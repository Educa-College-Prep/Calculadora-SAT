"""
Genera public/fotos_universidades.json: una foto libre (Wikimedia Commons) por universidad,
con su autor y licencia para poder citarla.

Cómo se elige la foto, sin adivinar por nombre:
  1. El UNITID (ID oficial de IPEDS) que trae public/universidades.json.
  2. Wikidata → la entidad con ese ID de IPEDS (P1771) y su imagen (P18).
     Si no tiene, la imagen principal de su artículo en Wikipedia en inglés.
  3. Se descartan logos, escudos y sellos, las imágenes que no están en Commons
     (las "no libres" de Wikipedia) y las de menos de 480 px de ancho.

Uso (desde calculadora-sat/):  python3 scripts/fotos_universidades.py
Tarda unos minutos: Wikipedia y Commons limitan la cantidad de consultas.
"""
import html
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request

AGENTE = 'CalculadoraSAT/1.0 (https://educa-college-prep.github.io/Calculadora-SAT/)'
ANCHO_MINIMO = 480
NO_ES_FOTO = re.compile(r'seal|logo|wordmark|emblem|crest|coat.of.arms|insignia|shield|flag|map|signature|athletic', re.I)
ES_FOTO = re.compile(r'\.(jpe?g|webp|tiff?)$', re.I)


def pedir(url, crudo=False, **params):
    if params:
        url += '?' + urllib.parse.urlencode(params)
    for intento in range(6):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': AGENTE})) as r:
                datos = r.read()
                return datos if crudo else json.loads(datos)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(5 * (intento + 1))
    raise SystemExit(f'Demasiadas consultas rechazadas: {url[:80]}')


def sparql(consulta):
    filas = pedir('https://query.wikidata.org/sparql', query=consulta, format='json')['results']['bindings']
    return [{k: v['value'] for k, v in f.items()} for f in filas]


def archivo(url_commons):
    return urllib.parse.unquote(url_commons.rsplit('/', 1)[1]).replace(' ', '_')


def en_lotes(lista, n=50):
    for i in range(0, len(lista), n):
        yield lista[i:i + n]


def main():
    universidades = json.load(open('public/universidades.json'))
    clave = {str(u['UNITID']): f"{u['INSTNM']}|{u['CITY']}|{u['STABBR']}" for u in universidades if u.get('UNITID')}

    print('1/3 Wikidata…')
    fotos_wd, articulos = {}, {}
    for f in sparql('SELECT ?ipeds ?img WHERE { ?item wdt:P1771 ?ipeds . ?item wdt:P18 ?img }'):
        fotos_wd.setdefault(f['ipeds'], set()).add(archivo(f['img']))
    for f in sparql('SELECT ?ipeds ?art WHERE { ?item wdt:P1771 ?ipeds . '
                    '?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }'):
        if f['ipeds'] in clave:
            articulos[f['ipeds']] = urllib.parse.unquote(f['art'].rsplit('/wiki/', 1)[1]).replace('_', ' ')

    print('2/3 Imágenes de los artículos de Wikipedia…')
    imagen_articulo = {}
    titulos = sorted(set(articulos.values()))
    for lote in en_lotes(titulos):
        q = pedir('https://en.wikipedia.org/w/api.php', action='query', format='json', prop='pageimages',
                  piprop='name', titles='|'.join(lote), redirects=1)['query']
        cambios = {x['from']: x['to'] for x in q.get('normalized', []) + q.get('redirects', [])}
        por_titulo = {p['title']: p.get('pageimage') for p in q['pages'].values()}
        for t in lote:
            destino = cambios.get(cambios.get(t, t), cambios.get(t, t))
            imagen_articulo[t] = por_titulo.get(destino)
        time.sleep(1.5)

    candidata = {}
    for uid in clave:
        opciones = sorted(f for f in fotos_wd.get(uid, ()) if not NO_ES_FOTO.search(f))
        opciones = [f for f in opciones if ES_FOTO.search(f)] or opciones
        img = imagen_articulo.get(articulos.get(uid))
        if not opciones and img and ES_FOTO.search(img) and not NO_ES_FOTO.search(img):
            opciones = [img]
        if opciones:
            candidata[uid] = opciones[0]

    print(f'3/3 Autor y licencia de {len(candidata)} fotos en Commons…')
    info = {}
    for lote in en_lotes(sorted(set(candidata.values()))):
        q = pedir('https://commons.wikimedia.org/w/api.php', action='query', format='json', prop='imageinfo',
                  iiprop='extmetadata|size', iiextmetadatafilter='Artist|LicenseShortName|NonFree',
                  titles='|'.join('File:' + f for f in lote), redirects=1)['query']
        cambios = {x['from']: x['to'] for x in q.get('normalized', []) + q.get('redirects', [])}
        paginas = {p['title']: p for p in q['pages'].values()}
        for f in lote:
            t = cambios.get(cambios.get('File:' + f, 'File:' + f), cambios.get('File:' + f, 'File:' + f))
            p = paginas.get(t)
            if not p or 'imageinfo' not in p:
                continue  # No está en Commons: imagen no libre de Wikipedia.
            ii = p['imageinfo'][0]
            meta = ii.get('extmetadata', {})
            if meta.get('NonFree', {}).get('value') == 'true' or (ii.get('width') or 0) < ANCHO_MINIMO:
                continue
            autor = html.unescape(re.sub(r'<[^>]+>', '', meta.get('Artist', {}).get('value', ''))).strip()
            info[f] = {'f': t[5:].replace(' ', '_'), 'a': re.sub(r'\s+', ' ', autor)[:80],
                       'l': meta.get('LicenseShortName', {}).get('value', '')}
        time.sleep(1)

    salida = {clave[uid]: info[f] for uid, f in candidata.items() if f in info}
    salida = dict(sorted(salida.items()))
    with open('public/fotos_universidades.json', 'w') as s:
        json.dump(salida, s, ensure_ascii=False, separators=(',', ':'))
    print(f'Listo: {len(salida)} universidades con foto → public/fotos_universidades.json')


if __name__ == '__main__':
    main()
