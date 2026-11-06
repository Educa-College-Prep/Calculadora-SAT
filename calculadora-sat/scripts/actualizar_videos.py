#!/usr/bin/env python3
"""
Robot de videos: revisa el canal de YouTube de Educa College Prep y agrega a la ficha de cada
universidad sus videos nuevos (campus tours y testimonios de alumnos).

Uso (desde calculadora-sat/):
    python3 scripts/actualizar_videos.py                    # revisa el canal y escribe si hay videos nuevos
    python3 scripts/actualizar_videos.py --videos lista.jsonl  # usa una lista bajada aparte (ver abajo)

De dónde saca los videos:
  - Con YOUTUBE_API_KEY (secreto en GitHub): la API oficial de YouTube. Da el canal COMPLETO
    con títulos en español y descripciones. Cada corrida gasta ~10 de las 10 000 unidades
    diarias gratuitas.
  - Sin clave: el feed RSS del canal (solo los últimos 15 videos). YouTube lo tiene caído a
    ratos (404/500); si no responde, no se adivina: no cambia nada y reintenta en la próxima
    corrida.
  - --videos: un archivo con un JSON por línea ({id, title, description, upload_date,
    duration}), como el que da `yt-dlp -j`. Sirve para importar el canal entero a mano.

Cómo decide la universidad de cada video:
  1. Busca en el TÍTULO el nombre oficial de alguna universidad de public/universidades.json o
     uno de sus alias de src/utils/aliases.ts ("UPenn", "Georgia Tech"...). Gana el nombre más
     largo: "Penn State" no cuenta también como "Penn".
  2. Si el título no nombra ninguna, busca en la DESCRIPCIÓN. Ahí suelen aparecer varias
     ("su top tres incluye Brown, Pittsburgh y Virginia Tech"), así que solo se acepta si
     nombra una sola.
  3. Si el título habla de otro país (Canadá, Reino Unido, Europa…), el nombre puede ser de una
     universidad de allá que se llama parecido ("King's College London" ≠ King's College de
     Pensilvania): no se agrega y queda en el PR para que lo vea una persona.
  Tipo: "tour" si el título dice tour; si no, testimonio. Los "Fun Facts" no son ni una cosa
  ni la otra y no se agregan.

Todo video que el robot ya vio queda anotado (en la universidad o en "ignorados"), así no lo
vuelve a proponer. Lo que no estaba seguro de ubicar queda marcado en el PR: "Agregados, pero confírmalos" o
"No agregados".

Escribe `hay_videos_nuevos` en $GITHUB_OUTPUT y la descripción del PR en
scripts/.cache/resumen_videos_pr.md.
"""

import argparse
import json
import os
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import date

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)  # calculadora-sat/
CACHE = os.path.join(AQUI, '.cache')
ARCHIVO_VIDEOS = os.path.join(RAIZ, 'src', 'data', 'videos_universidades.json')
ARCHIVO_UNIVERSIDADES = os.path.join(RAIZ, 'public', 'universidades.json')
ARCHIVO_ALIAS = os.path.join(RAIZ, 'src', 'utils', 'aliases.ts')
RESUMEN = os.path.join(CACHE, 'resumen_videos_pr.md')

CANAL_ID = 'UC9o0MPODgl7OwhgKQJnnYSw'  # @EducaCollegePrep
# Listas automáticas del canal: mismo ID cambiando "UC" por "UULF" (solo videos largos, sin
# Shorts ni en vivos) o por "UU" (todo lo subido).
LISTA_LARGOS = 'UULF' + CANAL_ID[2:]
LISTA_SUBIDOS = 'UU' + CANAL_ID[2:]
API = 'https://www.googleapis.com/youtube/v3'
RSS = f'https://www.youtube.com/feeds/videos.xml?channel_id={CANAL_ID}'

# Los Shorts son verticales: en el marco 16:9 de la ficha se ven mal. No se pueden reconocer por
# la duración (hay testimonios normales de 1–2 minutos y Shorts de hasta 3), así que se usa la
# lista de videos largos. Solo si esa lista fallara, se descartan los de un minuto o menos.
DURACION_MAXIMA_SHORT = 60

# Alias de aliases.ts que en un título significan otra cosa: "UK" es Reino Unido, "Texas" es el
# estado, "Cal" o "Navy" son palabras comunes. Para el buscador sirven; aquí darían falsos aciertos.
ALIAS_EXCLUIDOS = {
    'cal', 'texas', 'army', 'navy', 'air force', 'coast guard', 'illinois', 'indiana', 'wisconsin',
    'minnesota', 'maryland', 'alabama', 'bama', 'arizona', 'colorado', 'oregon', 'utah', 'michigan',
    'hunter', 'stevens', 'rice', 'mines', 'the u', 'cuse', 'mudd', 'hopkins', 'osu oregon',
}
# Siglas que se buscan respetando mayúsculas (en minúscula son palabras comunes) y que no son
# ambiguas. Las de 2 letras (UT, UK, BU…) nunca: en un título casi siempre son otra cosa.
SIGLAS_EXCLUIDAS = {'OSU', 'ISU', 'FIT', 'IIT', 'MSU', 'UCB', 'UCD', 'UCI', 'UCR', 'UTA', 'CPP', 'SBU', 'UNR', 'UNL', 'UNM', 'RPI'}

# Señales de que el video es de una universidad fuera de EE.UU.
OTROS_PAISES = [
    'canada', 'canadá', 'reino unido', ' uk ', 'london', 'londres', 'england', 'inglaterra', 'europa', 'europe',
    'francia', 'france', 'paris', 'parís', 'españa', 'spain', 'madrid', 'segovia', 'italia', 'italy', 'milan',
    'países bajos', 'paises bajos', 'netherlands', 'holanda', 'amsterdam', 'rotterdam', 'singapur', 'singapore',
    'australia', 'suiza', 'switzerland', 'austria', 'viena', 'alemania', 'germany', 'toronto', 'montreal',
    'russell group', 'sciences po', 'oxford', 'cambridge',
]
BANDERAS_OTROS_PAISES = ['🇨🇦', '🇬🇧', '🇫🇷', '🇪🇸', '🇮🇹', '🇳🇱', '🇦🇺', '🇸🇬', '🇨🇭', '🇦🇹', '🇩🇪']
SENALES_EEUU = ['🇺🇸', 'ee.uu', 'eeuu', 'estados unidos', 'united states', ' usa ', ' us ', ' u.s.']


# ---------------------------------------------------------------------------------------------
# Leer el canal
# ---------------------------------------------------------------------------------------------

def pedir_json(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Accept': 'application/json'}), timeout=60) as r:
        return json.load(r)


def segundos_de(duracion_iso):
    """'PT1H2M3S' → 3723. La API da la duración en formato ISO 8601."""
    m = re.fullmatch(r'P(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duracion_iso or '')
    if not m:
        return None
    h, mi, s = (int(x) if x else 0 for x in m.groups())
    return h * 3600 + mi * 60 + s


def ids_de_lista(lista, clave):
    ids, pagina = [], None
    while True:
        parametros = {'part': 'contentDetails', 'playlistId': lista, 'maxResults': 50, 'key': clave}
        if pagina:
            parametros['pageToken'] = pagina
        datos = pedir_json(f'{API}/playlistItems?{urllib.parse.urlencode(parametros)}')
        ids += [item['contentDetails']['videoId'] for item in datos.get('items', [])]
        pagina = datos.get('nextPageToken')
        if not pagina:
            return ids


def videos_por_api(clave):
    """Todos los videos largos del canal, con título y descripción en español (hl=es)."""
    try:
        ids, sin_shorts = ids_de_lista(LISTA_LARGOS, clave), True
    except urllib.error.HTTPError as error:
        if error.code != 404:
            raise
        ids, sin_shorts = ids_de_lista(LISTA_SUBIDOS, clave), False
    videos = []
    for i in range(0, len(ids), 50):
        parametros = {'part': 'snippet,contentDetails', 'id': ','.join(ids[i:i + 50]), 'hl': 'es', 'key': clave}
        for item in pedir_json(f'{API}/videos?{urllib.parse.urlencode(parametros)}').get('items', []):
            snippet = item['snippet']
            # localized trae la traducción al español si el canal la cargó; si no, el original.
            localizado = snippet.get('localized') or snippet
            videos.append({
                'id': item['id'],
                'titulo': localizado.get('title') or snippet['title'],
                'descripcion': localizado.get('description') or snippet.get('description', ''),
                'fecha': snippet.get('publishedAt', '')[:10],
                'segundos': None if sin_shorts else segundos_de(item.get('contentDetails', {}).get('duration')),
                'en_vivo': snippet.get('liveBroadcastContent') not in (None, 'none'),
            })
    return videos


def videos_por_rss():
    """Los últimos 15 videos del canal. Los Shorts se reconocen por su enlace /shorts/."""
    ns = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015',
          'media': 'http://search.yahoo.com/mrss/'}
    with urllib.request.urlopen(urllib.request.Request(RSS, headers={'User-Agent': 'Mozilla/5.0'}), timeout=60) as r:
        raiz = ET.fromstring(r.read())
    videos = []
    for entrada in raiz.findall('a:entry', ns):
        enlace = entrada.find('a:link', ns).get('href', '')
        videos.append({
            'id': entrada.findtext('yt:videoId', '', ns),
            'titulo': entrada.findtext('a:title', '', ns),
            'descripcion': entrada.findtext('media:group/media:description', '', ns),
            'fecha': entrada.findtext('a:published', '', ns)[:10],
            'segundos': 0 if '/shorts/' in enlace else None,
            'en_vivo': False,
        })
    return videos


def videos_de_archivo(ruta):
    """Lista bajada con yt-dlp: un JSON por línea con id, title, description, upload_date, duration."""
    videos = []
    with open(ruta, encoding='utf-8') as f:
        for linea in f:
            if not linea.strip():
                continue
            v = json.loads(linea)
            fecha = v.get('upload_date') or ''
            videos.append({
                'id': v['id'],
                'titulo': v.get('title') or '',
                'descripcion': v.get('description') or '',
                'fecha': f'{fecha[:4]}-{fecha[4:6]}-{fecha[6:]}' if len(fecha) == 8 else '',
                # La lista se baja de la pestaña "Videos" del canal, que no incluye los Shorts.
            'segundos': None,
                'en_vivo': False,
            })
    return videos


# ---------------------------------------------------------------------------------------------
# Reconocer la universidad
# ---------------------------------------------------------------------------------------------

def normalizar(texto):
    """Minúsculas, sin tildes ni apóstrofes y solo letras/números separados por un espacio:
    "King’s College" y "KINGS COLLEGE" quedan iguales."""
    texto = unicodedata.normalize('NFKD', texto)
    texto = ''.join(c for c in texto if not unicodedata.combining(c)).lower()
    texto = re.sub(r"['’`´]", '', texto)
    texto = re.sub(r'[^a-z0-9&]+', ' ', texto)
    return f' {texto.strip()} '


def leer_alias():
    """aliases.ts → {INSTNM: [alias, …]}. Se lee con una expresión regular para no duplicar la
    lista: lo que se agrega allá para el buscador sirve aquí también."""
    with open(ARCHIVO_ALIAS, encoding='utf-8') as f:
        codigo = f.read()
    alias = {}
    for nombre, lista in re.findall(r"^\s*'((?:[^'\\]|\\.)+)':\s*\[([^\]]*)\]", codigo, re.M):
        alias[nombre.replace("\\'", "'")] = re.findall(r"'((?:[^'\\]|\\.)+)'", lista)
    return alias


class Reconocedor:
    def __init__(self, universidades, alias):
        self.nombre = {u['UNITID']: u['INSTNM'] for u in universidades if u.get('UNITID')}
        tamano = {u['UNITID']: u.get('UGDS') or 0 for u in universidades if u.get('UNITID')}
        por_nombre = {u['INSTNM']: u['UNITID'] for u in universidades if u.get('UNITID')}

        # Variante normalizada del nombre → universidades que la usan.
        candidatos = {}
        for unitid, instnm in self.nombre.items():
            variantes = {instnm, re.sub(r'^The ', '', instnm)}
            if '-' in instnm:
                # "Purdue University-Main Campus" también se reconoce como "Purdue University".
                variantes.add(re.sub(r'^The ', '', instnm.split('-')[0]))
            for v in variantes:
                candidatos.setdefault(normalizar(v), set()).add(unitid)

        # Si varias universidades comparten una variante ("Indiana University" es Bloomington y
        # sus sedes regionales), gana la más grande; es dudoso si la segunda no es mucho menor.
        self.variantes = {}
        for variante, unitids in candidatos.items():
            orden = sorted(unitids, key=lambda u: -tamano[u])
            dudoso = len(orden) > 1 and tamano[orden[1]] >= tamano[orden[0]] / 2
            self.variantes[variante] = (orden[0], dudoso)

        # Los alias los eligió una persona: mandan sobre las variantes calculadas.
        self.siglas = {}
        for instnm, lista in alias.items():
            unitid = por_nombre.get(instnm)
            if unitid is None:
                continue
            for a in lista:
                if re.fullmatch(r'[A-Z]{3,5}', a):
                    if a not in SIGLAS_EXCLUIDAS:
                        self.siglas[a] = unitid
                elif normalizar(a).strip() not in ALIAS_EXCLUIDOS and len(a) >= 4:
                    self.variantes[normalizar(a)] = (unitid, False)

    def buscar(self, texto):
        """Universidades nombradas en el texto: {unitid: dudoso}. Gana el nombre más largo y los
        más cortos que caen dentro de él no cuentan."""
        norm = normalizar(texto)
        hallazgos = []
        for variante, (unitid, dudoso) in self.variantes.items():
            inicio = norm.find(variante)
            while inicio != -1:
                hallazgos.append((inicio, inicio + len(variante), unitid, dudoso))
                inicio = norm.find(variante, inicio + 1)
        ocupado, encontradas = [], {}
        for ini, fin, unitid, dudoso in sorted(hallazgos, key=lambda h: h[0] - h[1]):
            # Las variantes empiezan y terminan con espacio: se tocan sin pisarse.
            if any(ini < f - 1 and fin - 1 > i for i, f in ocupado):
                continue
            ocupado.append((ini, fin))
            encontradas[unitid] = encontradas.get(unitid, True) and dudoso
        for sigla, unitid in self.siglas.items():
            if re.search(rf'(?<![A-Za-z]){sigla}(?![A-Za-z])', texto) and unitid not in encontradas:
                encontradas[unitid] = False
        return encontradas


def es_de_otro_pais(titulo):
    """El título habla de otro país y no de EE.UU. ("Estudiar en EE.UU. y Francia" sí es de EE.UU.)."""
    norm = f' {titulo.lower()} '
    otro = any(p in norm for p in OTROS_PAISES) or any(b in titulo for b in BANDERAS_OTROS_PAISES)
    eeuu = any(s in norm for s in SENALES_EEUU)
    return otro and not eeuu


def tipo_de(titulo):
    t = titulo.lower()
    if 'fun facts' in t:
        return None
    return 'tour' if re.search(r'\btour\b', t) else 'testimonio'


def limpiar_titulo(titulo):
    """Sin emojis ni banderas, sin hashtags del canal y sin espacios de sobra: así se ve en la ficha."""
    titulo = re.sub(r'#(30\w*|CollegeInsiders\w*|Educa\w*)', '', titulo, flags=re.I)
    titulo = titulo.replace('#', '')
    titulo = ''.join(c for c in titulo if unicodedata.category(c) not in ('So', 'Sk', 'Cs', 'Mn', 'Cf'))
    titulo = re.sub(r'\s+', ' ', titulo)
    titulo = re.sub(r'(\s*[|—-]\s*)+$', '', titulo).strip()
    titulo = re.sub(r'\s+([,.!?)])', r'\1', titulo)
    return re.sub(r'\(\s*', '(', titulo)


# ---------------------------------------------------------------------------------------------
# Principal
# ---------------------------------------------------------------------------------------------

def ya_vistos(datos):
    vistos = set(datos['ignorados'])
    for u in datos['universidades'].values():
        if u.get('tour'):
            vistos.add(u['tour']['id'])
        vistos.update(v['id'] for v in u.get('testimonios', []))
    return vistos


def enlace(video_id):
    return f'https://youtu.be/{video_id}'


def escribir_salida(hay_nuevos):
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as f:
            f.write(f'hay_videos_nuevos={"true" if hay_nuevos else "false"}\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    parser.add_argument('--videos', help='lista de videos bajada aparte (un JSON por línea, como yt-dlp -j)')
    args = parser.parse_args()

    clave = os.environ.get('YOUTUBE_API_KEY', '').strip()
    try:
        if args.videos:
            videos, fuente = videos_de_archivo(args.videos), f'el archivo {os.path.basename(args.videos)}'
        elif clave:
            videos, fuente = videos_por_api(clave), 'la API de YouTube (canal completo)'
        else:
            videos, fuente = videos_por_rss(), 'el feed RSS del canal (últimos 15 videos)'
    except Exception as error:  # red caída, clave inválida, RSS de YouTube en 404…
        print(f'No se pudo leer el canal ({error}). No se cambia nada; se reintenta en la próxima corrida.')
        if os.environ.get('GITHUB_ACTIONS'):
            print(f'::warning::No se pudo leer el canal de YouTube: {error}')
        escribir_salida(False)
        return

    with open(ARCHIVO_VIDEOS, encoding='utf-8') as f:
        datos = json.load(f)
    with open(ARCHIVO_UNIVERSIDADES, encoding='utf-8') as f:
        reconocedor = Reconocedor(json.load(f), leer_alias())

    vistos = ya_vistos(datos)
    nuevos = [v for v in videos if v['id'] and v['id'] not in vistos]
    # Los más antiguos primero: cada uno se pone al inicio de su lista, así el último publicado
    # queda adelante.
    nuevos.sort(key=lambda v: v['fecha'])

    agregados, revisar, sin_universidad, saltados = [], [], [], []
    for v in nuevos:
        titulo = limpiar_titulo(v['titulo'])
        if v['segundos'] is not None and v['segundos'] <= DURACION_MAXIMA_SHORT or v['en_vivo']:
            # Ni Shorts ni transmisiones en vivo; no se anotan (un en vivo puede subirse luego).
            saltados.append(v)
            continue
        tipo = tipo_de(v['titulo'])
        en_titulo = reconocedor.buscar(v['titulo'])
        en_descripcion = {} if en_titulo else reconocedor.buscar(v['descripcion'])

        # Video de otro país que de pasada nombra una de EE.UU. en la descripción: no es de ella.
        if not en_titulo and es_de_otro_pais(v['titulo']):
            en_descripcion = {}
        candidatas = list(en_titulo or en_descripcion)

        # motivo: no se agrega (lo más probable es que esté mal). nota: se agrega, pero el PR pide
        # confirmarlo. Nada se publica sin que una persona mergee el PR.
        motivo = nota = None
        if tipo is None:
            motivo = 'es un video de "Fun Facts": no es campus tour ni testimonio'
        elif en_titulo and es_de_otro_pais(v['titulo']):
            motivo = 'el título habla de otro país; el nombre puede ser de una universidad de allá'
        elif any((en_titulo or en_descripcion).values()):
            motivo = 'hay varias universidades con ese nombre'
        elif len(en_descripcion) > 1:
            motivo = 'el título no nombra ninguna y la descripción nombra varias'
        elif en_descripcion:
            nota = 'el título no la nombra; solo aparece en la descripción'
        elif len(en_titulo) > 1:
            nota = f'el título nombra {len(en_titulo)} universidades; se agregó a todas'

        if not candidatas:
            sin_universidad.append(v)
            datos['ignorados'][v['id']] = f'sin universidad de EE.UU. — {titulo}'
            continue
        if motivo:
            revisar.append((v, candidatas, motivo))
            datos['ignorados'][v['id']] = f'no agregado ({motivo}) — {titulo}'
            continue

        for unitid in candidatas:
            ficha = datos['universidades'].setdefault(str(unitid), {'nombre': reconocedor.nombre[unitid]})
            video = {'id': v['id'], 'titulo': titulo}
            if tipo == 'tour' and not ficha.get('tour'):
                ficha['tour'] = video
            else:
                # Un segundo tour de la misma universidad entra como un video más.
                ficha.setdefault('testimonios', []).insert(0, video)
            agregados.append((v, unitid, tipo, nota))

    hay_nuevos = bool(agregados or revisar or sin_universidad)
    if hay_nuevos:
        # Ordenadas por nombre para que el archivo sea fácil de recorrer y los diffs, limpios.
        datos['universidades'] = dict(sorted(datos['universidades'].items(), key=lambda kv: kv[1]['nombre']))
        with open(ARCHIVO_VIDEOS, 'w', encoding='utf-8') as f:
            json.dump(datos, f, ensure_ascii=False, indent=2)
            f.write('\n')

    os.makedirs(CACHE, exist_ok=True)
    with open(RESUMEN, 'w', encoding='utf-8') as f:
        f.write(resumen(fuente, agregados, revisar, sin_universidad, reconocedor.nombre))
    print(f'Leídos {len(videos)} videos de {fuente}: {len(nuevos)} sin ver, {len(saltados)} Shorts o en vivo.')
    print(f'Agregados: {len(agregados)} · No agregados: {len(revisar)} · Sin universidad de EE.UU.: {len(sin_universidad)}')
    escribir_salida(hay_nuevos)


def resumen(fuente, agregados, revisar, sin_universidad, nombre):
    """Descripción del PR: lo que se agregó, lo dudoso y lo que se dejó fuera."""
    lineas = [f'Videos nuevos del canal de Educa en YouTube, leídos de {fuente} el {date.today().isoformat()}.', '']
    if revisar:
        lineas += [
            f'## ❓ No agregados: ¿son de esta universidad? ({len(revisar)})', '',
            'El robot no estaba seguro de la universidad y **no los agregó**. Si alguno sí va, '
            'en `src/data/videos_universidades.json` bórralo de `ignorados` y agrégalo a su universidad '
            '(la clave es el UNITID).', '',
            '| Video | ¿Universidad? | Por qué no se agregó |', '|---|---|---|',
        ]
        for v, candidatas, motivo in revisar:
            sugeridas = ', '.join(f'{nombre[u]} ({u})' for u in candidatas)
            lineas.append(f'| [{limpiar_titulo(v["titulo"])}]({enlace(v["id"])}) | {sugeridas} | {motivo} |')
        lineas.append('')
    con_dudas = [a for a in agregados if a[3]]
    seguros = [a for a in agregados if not a[3]]
    if con_dudas:
        lineas += [
            f'## ⚠️ Agregados, pero confírmalos ({len(con_dudas)})', '',
            'El robot los agregó, pero no está del todo seguro. Si alguno no va en esa universidad, '
            'quítalo de `src/data/videos_universidades.json` en este mismo PR (y anota su id en `ignorados`).', '',
            '| Universidad | Tipo | Video | Por qué la duda |', '|---|---|---|---|',
        ]
        for v, unitid, tipo, nota in con_dudas:
            lineas.append(f'| {nombre[unitid]} | {tipo} | [{limpiar_titulo(v["titulo"])}]({enlace(v["id"])}) | {nota} |')
        lineas.append('')
    if seguros:
        lineas += [
            f'## ✅ Agregados ({len(seguros)})', '',
            'El nombre de la universidad está en el título del video.', '',
            '| Universidad | Tipo | Video |', '|---|---|---|',
        ]
        for v, unitid, tipo, _ in seguros:
            lineas.append(f'| {nombre[unitid]} | {tipo} | [{limpiar_titulo(v["titulo"])}]({enlace(v["id"])}) |')
        lineas.append('')
    if sin_universidad:
        lineas += [
            f'<details><summary>Sin universidad de EE.UU. ({len(sin_universidad)}): cursos SAT, guías, '
            'universidades de otros países…</summary>', '',
            'Si alguno sí es de una universidad de EE.UU., el robot no reconoció el nombre: agrégalo a mano '
            'y, si el nombre es un apodo común, súmalo a `src/utils/aliases.ts`.', '',
        ]
        lineas += [f'- [{limpiar_titulo(v["titulo"])}]({enlace(v["id"])})' for v in sin_universidad]
        lineas += ['', '</details>', '']
    lineas.append('Al mergear, los videos aparecen en la ficha de cada universidad.')
    return '\n'.join(lineas) + '\n'


if __name__ == '__main__':
    sys.exit(main())
