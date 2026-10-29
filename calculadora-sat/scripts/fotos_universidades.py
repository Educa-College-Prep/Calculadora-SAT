"""
Genera public/fotos_universidades.json: una foto libre (Wikimedia Commons) por universidad,
con su autor y licencia para poder citarla.

Cómo se elige la foto, sin adivinar por nombre:
  1. El UNITID (ID oficial de IPEDS) que trae public/universidades.json.
  2. Wikidata → la entidad con ese ID de IPEDS (P1771) y su imagen (P18).
     Si no tiene, la imagen principal de su artículo en Wikipedia en inglés.
     Esas dos son de fiar: están atadas a la universidad.
  3. Si la foto es chica (se vería borrosa en el banner), se buscan alternativas, en este orden:
     a. las demás imágenes del artículo, pero solo si el nombre las acredita (lleva el nombre
        de la universidad o de su ciudad);
     b. los archivos de la categoría de Commons de la universidad, pero solo si el nombre
        describe un edificio o el campus ("hall", "library", "campus", "quad"...).
     La foto que ya es nítida no se cambia.
  4. Se descartan logos, escudos, sellos, mapas, gráficos, retratos (verticales), fotos de
     personas o de equipos deportivos, las que no están en Commons (las "no libres" de
     Wikipedia) y las de menos de 480 px de ancho.

Uso (desde calculadora-sat/):  python3 scripts/fotos_universidades.py
Tarda unos minutos: Wikipedia y Commons limitan la cantidad de consultas.
"""
import html
import json
import os
import re
import time
import urllib.error
import urllib.parse
import urllib.request

AGENTE = 'CalculadoraSAT/1.0 (https://educa-college-prep.github.io/Calculadora-SAT/)'

SALIDA = 'public/fotos_universidades.json'

# Universidades que se quedan con la foto que ya tienen: la alternativa automática era peor
# (un acto, un edificio que no es suyo, una foto de otra sede). Se revisaron a mano.
NO_CAMBIAR: set[str] = {
    'DePauw University|Greencastle|IN',
    'Eastern Kentucky University|Richmond|KY',
    'Gettysburg College|Gettysburg|PA',
    'Indiana State University|Terre Haute|IN',
    'Marymount Manhattan College|New York|NY',
    'New York College of Health Professions|Syosset|NY',
    'Pomona College|Claremont|CA',
    'Reinhardt University|Waleska|GA',
    'Rowan University|Glassboro|NJ',
    'Rutgers University-Camden|Camden|NJ',
    'Sacred Heart University|Fairfield|CT',
    'Southern Arkansas University Main Campus|Magnolia|AR',
    'Tiffin University|Tiffin|OH',
    'University of Dayton|Dayton|OH',
    'University of Delaware|Newark|DE',
    'University of Dubuque|Dubuque|IA',
    'University of Georgia|Athens|GA',
    'University of Mary Washington|Fredericksburg|VA',
    'University of Mississippi|University|MS',
    'University of North Carolina at Charlotte|Charlotte|NC',
    'Wake Forest University|Winston-Salem|NC',
    'Warren Wilson College|Swannanoa|NC',
    'Wheeling University|Wheeling|WV',
    'Yale University|New Haven|CT',
    # Revisión de la corrida del 28/10/2026: la alternativa era un partido, una estación, una
    # protesta, otra ciudad, una foto histórica en blanco y negro, o reemplazaba el edificio
    # más conocido de la universidad (la capilla de Duke, Royce Hall de UCLA…).
    'Auburn University|Auburn|AL',
    'CUNY York College|Jamaica|NY',
    'California State University-Northridge|Northridge|CA',
    'California State University-San Marcos|San Marcos|CA',
    'Carleton College|Northfield|MN',
    'Duke University|Durham|NC',
    'Eastern New Mexico University-Main Campus|Portales|NM',
    'Foothill College|Los Altos Hills|CA',
    'Hampton University|Hampton|VA',
    'Illinois Wesleyan University|Bloomington|IL',
    'Massachusetts College of Art and Design|Boston|MA',
    'Messiah University|Mechanicsburg|PA',
    'Metropolitan State University of Denver|Denver|CO',
    'Mississippi Valley State University|Itta Bena|MS',
    'Muskingum University|New Concord|OH',
    'Pitzer College|Claremont|CA',
    'Saint Louis University|Saint Louis|MO',
    'Savannah College of Art and Design|Savannah|GA',
    'University of Baltimore|Baltimore|MD',
    'University of California-Los Angeles|Los Angeles|CA',
    'University of Evansville|Evansville|IN',
    'University of Maryland Eastern Shore|Princess Anne|MD',
    'University of North Carolina School of the Arts|Winston Salem|NC',
    'University of Richmond|University of Richmond|VA',
    'Walla Walla University|College Place|WA',
    'Wright State University-Main Campus|Dayton|OH',
    'Oklahoma State University-Main Campus|Stillwater|OK',
}

# Fotos elegidas a mano cuando el automatismo se equivoca (la sede de Hong Kong de Chicago,
# por ejemplo, es "University of Chicago" pero no es el campus que se quiere mostrar).
ELEGIR_A_MANO: dict[str, str] = {
    'University of Chicago|Chicago|IL': 'University_of_Chicago,_Harper_Library.jpg',
    'Georgia Institute of Technology-Main Campus|Atlanta|GA': 'Tech_Tower_lawn.jpg',
    'University of California-Irvine|Irvine|CA': 'Engineering_Tower_and_Computer_Science_Building.jpg',
    'Wake Forest University|Winston-Salem|NC': 'Scales_Fine_Arts_Center.jpg',
    # Revisión a mano de la corrida del 28/10/2026 (revision-fotos.md).
    'Carnegie Mellon University|Pittsburgh|PA': 'Carnegie_Mellon_University_as_seen_from_the_Cathedral_of_Learning.jpg',
    'Centralia College|Centralia|WA': 'Centralia_College_Panorama.jpg',
    'College of the Redwoods|Eureka|CA': 'College_of_the_Redwoods_North_Entry.JPG',
    'Glendale Community College|Glendale|CA': 'Glendale_Community_College,_California.jpg',
    'Lehigh University|Bethlehem|PA': 'Lehigh_University_Rauch.jpg',
    'Trinity College|Hartford|CT': 'Trinity_College_Jessee_Miller_Field,_Hartford_CT.jpg',
    'Yale University|New Haven|CT': 'Yale_University_Old_Campus_04.JPG',
    'Princeton University|Princeton|NJ': 'Center_Courtyard_of_East_Pyne_Building_Princeton_University_2024.jpg',
    # En la misma revisión se prefirió la foto que tenían antes: la nueva era un dormitorio,
    # una postal antigua o un rincón menos reconocible. Se fijan aquí (y no en NO_CAMBIAR)
    # porque el JSON de partida ya trae la foto nueva.
    'Augusta University|Augusta|GA': 'Georgia_Regents_University,_University_Hall.jpg',
    'Bentley University|Waltham|MA': 'Bentley_College_Library.jpg',
    'City College of San Francisco|San Francisco|CA': 'City_College_of_San_Francisco_at_Valencia.jpg',
    'Hollins University|Roanoke|VA': 'Cocke_building,_Hollins_University.jpg',
    "Saint Michael's College|Colchester|VT": "Aerial_shot_of_Saint_Michael's_College.jpg",
    'Virginia State University|Petersburg|VA': 'Library_VSU_2006.jpg',
    'Westmoreland County Community College|Youngwood|PA': 'Westmoreland_County_Community_College_pavilion.jpg',
}

# Un banner ocupa hasta 1280 px de ancho (1920 en pantallas grandes): por debajo de 1000 se
# nota borroso. 1600 es el punto donde ya se ve bien; de ahí para arriba no se toca.
ANCHO_MINIMO = 480
ANCHO_ACEPTABLE = 1000
ANCHO_NITIDO = 1600

# Fotos horizontales: un retrato vertical (0.7) recortado a lo ancho pierde la cara y no sirve.
ASPECTO_MIN = 0.95
ASPECTO_MAX = 3.6

def palabras(lista):
    """Regex que busca cada palabra suelta (con plural opcional) en un nombre de archivo.

    Sin esto, "field" saltaba en "Bakersfield", "sign" en "Design", "flag" en "Flagler" y
    "award" en "Hayward". Los _ - . y espacios del nombre cuentan como separadores; la letra
    de antes o de después, no.
    """
    return r'(?<![a-z])(?:' + lista + r')s?(?![a-z])'


# Logos, escudos y gráficos se buscan en cualquier parte del nombre ("MCNY_heritageLogo"):
# aquí es mejor descartar de más que publicar un logo como foto del campus.
NO_ES_FOTO = re.compile(
    r'seal|logo|wordmark|emblem|crest|coat.of.arms|insignia|shield|flag|map|signature'
    r'|diagram|chart|graph|comparison|\.svg$', re.I)

# Archivos revisados a mano que no sirven de portada aunque pasen los filtros (un bus, un
# acto, fotos de personal, un edificio que no es de la universidad).
DESCARTADAS: set[str] = {
    'Carnegie_Public_Library_2012-10-14_15-18-12.jpg',
    'TAMU-Kingsville_college_bus_IMG_6077.JPG',
    'Union_County_College_Phi_Theta_Kappa_speech_to_inductees.jpg',
    'Brandman_Faculty_Staff0013.JPG',
}
ES_FOTO = re.compile(r'\.(jpe?g|webp|tiff?)$', re.I)
# Nombres de archivo que casi siempre son la foto del campus y no un detalle suelto.
ES_CAMPUS = re.compile(r'campus|universit|college|hall|library|building|quad|tower|center|centre'
                       r'|aerial|entrance|gate|main|administration|students', re.I)
# Personas, equipos, eventos, fotos históricas: nunca sirven de portada. Tampoco lo que no es
# el campus: una roca, una pradera, una piscina o una escultura no representan a la universidad.
# Los años (fotos viejas) solo como número suelto de 4 cifras: "(55311018466)" es un ID de
# Flickr y "IMG_1823" el número de foto de la cámara, no los años 1846 y 1823. Sin
# "panorama": las panorámicas demasiado alargadas ya las descarta ASPECTO_MAX.
NO_ES_PORTADA = re.compile(
    palabras(r'portrait|senator|representative|president|mayor|governor|statue|cemetery|plaque|postcard'
             r'|historic(?:al)?|alumni|class.of|football|basketball|baseball|soccer|team|cheer|band|mascot'
             r'|court|stadium|sign'
             r'|boulder|rock|prairie|aquatic|pool|recreation|gym|arena|field|museum|interior|sculpture|garden')
    + r'|(?<!\d)(?<!img_)(?<!img-)(?<!dsc_)(?<!dscn)1[6-9]\d\d(?!\d)', re.I)
# Eventos y actos: el nombre lleva el de la universidad, pero la foto no es del campus.
NO_ES_EVENTO = re.compile(
    palabras(r'speaks|tackled|improv|ceremony|commencement|graduation|concert|performance|parade|festival'
             r'|conference|meeting|rally|protest|award|family.day|bed.race|guardsmen|aviation|choir|show'
             r'|game|match|visit|tour'), re.I)
# Palabras que describen un edificio o el campus: si el archivo las lleva, es una foto de eso.
# Lista corta a propósito: "university" o "college" aparecen en cualquier nombre y no dicen nada.
DESCRIBE_CAMPUS = re.compile(
    r'campus|hall|library|quad|tower|center|centre|building|entrance|gate|aerial|administration'
    r'|plaza|fountain|auditorium|union|dorm|residence|recreation|chapel|memorial|stadium|arena', re.I)

# Palabras que no distinguen una universidad de otra.
GENERICAS = set('''university college of the at in and for state main campus system institute
school a the'''.split())

# Los estados no distinguen: media docena de universidades llevan "Indiana" o "Idaho" en el nombre.
ESTADOS = set('''alabama alaska arizona arkansas california colorado connecticut delaware florida
georgia hawaii idaho illinois indiana iowa kansas kentucky louisiana maine maryland massachusetts
michigan minnesota mississippi missouri montana nebraska nevada hampshire jersey mexico york
carolina dakota ohio oklahoma oregon pennsylvania rhode rhodeisland tennessee texas utah vermont
virginia washington wisconsin wyoming columbia puerto'''.split())


def pegado(texto):
    """'Indiana State University' → 'indianastateuniversity' (para comparar nombres de archivo)."""
    return re.sub(r'[^a-z0-9]', '', texto.lower())


def identificadores(clave, nombre):
    """Lo que acredita que un archivo es de esta universidad."""
    institucion, ciudad, _ = clave.split('|')
    tokens = [t for t in re.split(r'[^a-z]+', institucion.lower())
              if len(t) >= 6 and t not in GENERICAS and t not in ESTADOS]
    return pegado(nombre), tokens, pegado(ciudad)


def acreditada(f, ids, exigir_edificio):
    """El nombre del archivo señala a esta universidad (y, si se pide, a un edificio)."""
    plano = pegado(f)
    completo, tokens, ciudad = ids
    if exigir_edificio and not DESCRIBE_CAMPUS.search(f):
        return False
    if completo and len(completo) >= 8 and completo in plano:
        return True
    if any(t in plano for t in tokens):
        return True
    # El nombre de la ciudad solo vale acompañado de un edificio: "Rexburg Idaho Temple" no es el campus.
    return bool(exigir_edificio and len(ciudad) >= 6 and ciudad in plano)



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


def pedir_post(url, **params):
    """Igual que pedir(), pero por POST: con 50 títulos la URL de GET se pasa de largo."""
    datos = urllib.parse.urlencode(params).encode()
    for intento in range(6):
        try:
            req = urllib.request.Request(url, data=datos, headers={
                'User-Agent': AGENTE, 'Content-Type': 'application/x-www-form-urlencoded'})
            with urllib.request.urlopen(req) as r:
                return json.loads(r.read())
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


def tamanos(archivos):
    """{archivo: (ancho, alto)} según Commons. Los que no están en Commons no aparecen."""
    salida = {}
    for lote in en_lotes(sorted(archivos)):
        q = pedir_post('https://commons.wikimedia.org/w/api.php', action='query', format='json',
                       prop='imageinfo', iiprop='size', titles='|'.join('File:' + f for f in lote))
        normalizados = {x['to']: x['from'] for x in q['query'].get('normalized', [])}
        for p in q['query']['pages'].values():
            titulo = normalizados.get(p['title'], p['title'])
            f = titulo[5:].replace(' ', '_')
            ii = (p.get('imageinfo') or [{}])[0]
            if ii.get('width'):
                salida[f] = (ii['width'], ii['height'])
        time.sleep(0.35)
    return salida


def imagenes_de_articulos(titulos):
    """{artículo: [archivos]} con todas las imágenes que usa el artículo de Wikipedia."""
    salida = {}
    for lote in en_lotes(sorted(titulos), 5):
        cont = {}
        while True:
            q = pedir('https://en.wikipedia.org/w/api.php', action='query', format='json', prop='images',
                      titles='|'.join(lote), imlimit='max', redirects=1, **cont)['query']
            # La API devuelve el título normalizado: hay que volver al que pedimos.
            cambios = {x['to']: x['from'] for x in q.get('normalized', []) + q.get('redirects', [])}
            for p in q['pages'].values():
                lista = salida.setdefault(cambios.get(p['title'], p['title']), [])
                for i in p.get('images', []):
                    lista.append(i['title'][5:].replace(' ', '_'))
            if 'continue' not in q:
                break
            cont = q['continue']
        time.sleep(0.6)
    return salida


def archivos_de_categoria(nombre):
    """Archivos de Category:<nombre> en Commons (solo los que cuelgan directo)."""
    q = pedir('https://commons.wikimedia.org/w/api.php', action='query', format='json',
              list='categorymembers', cmtitle='Category:' + nombre, cmtype='file', cmlimit='500')
    return [m['title'][5:].replace(' ', '_') for m in q.get('query', {}).get('categorymembers', [])]


def puntaje(f, medidas):
    """Qué tan buena es una foto para el banner. None = no sirve."""
    if (f in DESCARTADAS or not ES_FOTO.search(f) or NO_ES_FOTO.search(f) or NO_ES_PORTADA.search(f)
            or NO_ES_EVENTO.search(f)):
        return None
    t = medidas.get(f)
    if not t:
        return None
    ancho, alto = t
    if ancho < ANCHO_MINIMO or not alto:
        return None
    aspecto = ancho / alto
    if not (ASPECTO_MIN <= aspecto <= ASPECTO_MAX):
        return None
    # Manda la resolución; a igualdad, una foto de campus y un encuadre apaisado normal.
    return (ancho, 1 if ES_CAMPUS.search(f) else 0, -abs(aspecto - 1.5))


def ancho_de(f, medidas):
    return medidas[f][0] if f in medidas else 0


def conviene_cambiar(nueva, previa, medidas):
    """Solo se cambia si la nueva es nítida de verdad o mucho más ancha que la actual.

    Cambiar una foto de 900 px por una de 1.200 no se nota y sí cambia el encuadre que ya
    conocía el usuario: por eso el umbral es 1600 px, o una mejora de al menos 1,5 veces.
    """
    ancho_nueva = ancho_de(nueva, medidas)
    ancho_previa = ancho_de(previa or '', medidas)
    if ancho_previa <= 0:
        return ancho_nueva > 0
    return ancho_nueva > ANCHO_NITIDO or ancho_nueva >= 1.5 * ancho_previa


def mejor_de(opciones, medidas):
    """La de mayor puntaje, o None si ninguna sirve."""
    validas = [f for f in opciones if puntaje(f, medidas)]
    return max(validas, key=lambda f: puntaje(f, medidas)) if validas else None


def main():
    universidades = json.load(open('public/universidades.json'))
    clave = {str(u['UNITID']): f"{u['INSTNM']}|{u['CITY']}|{u['STABBR']}" for u in universidades if u.get('UNITID')}
    nombre = {str(u['UNITID']): u['INSTNM'] for u in universidades if u.get('UNITID')}
    ids = {uid: identificadores(clave[uid], nombre[uid]) for uid in clave}
    # Lo que hay publicado ahora, para el resumen de cambios del final.
    antes = json.load(open(SALIDA)) if os.path.exists(SALIDA) else {}

    print('1/6 Wikidata…')
    fotos_wd, articulos = {}, {}
    for f in sparql('SELECT ?ipeds ?img WHERE { ?item wdt:P1771 ?ipeds . ?item wdt:P18 ?img }'):
        fotos_wd.setdefault(f['ipeds'], set()).add(archivo(f['img']))
    for f in sparql('SELECT ?ipeds ?art WHERE { ?item wdt:P1771 ?ipeds . '
                    '?art schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }'):
        if f['ipeds'] in clave:
            articulos[f['ipeds']] = urllib.parse.unquote(f['art'].rsplit('/wiki/', 1)[1]).replace('_', ' ')

    print('2/6 Imágenes principales de los artículos de Wikipedia…')
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

    print('3/6 La foto de cada universidad según Wikidata y Wikipedia…')
    # Nivel de confianza alto: P18 y la imagen principal del artículo están atadas a la entidad.
    candidatas = {}
    for uid in clave:
        opciones = sorted(f for f in fotos_wd.get(uid, ()) if ES_FOTO.search(f) and not NO_ES_FOTO.search(f))
        img = imagen_articulo.get(articulos.get(uid))
        if img and ES_FOTO.search(img) and not NO_ES_FOTO.search(img):
            opciones.append(img)
        candidatas[uid] = opciones

    medidas = tamanos({f for ops in candidatas.values() for f in ops})
    # Para comparar también hay que medir la foto que está publicada hoy.
    medidas.update(tamanos({v['f'] for v in antes.values()}))

    elegidas = {}
    # Las que ya quedaron decididas (a mano, NO_CAMBIAR o la foto de Wikidata que se respeta):
    # los pasos 4 y 5, que buscan alternativas a las fotos chicas, no las vuelven a tocar.
    fijas = set()
    for uid, ops in candidatas.items():
        previa = antes.get(clave[uid], {}).get('f')
        if clave[uid] in ELEGIR_A_MANO:
            elegidas[uid] = ELEGIR_A_MANO[clave[uid]]
            fijas.add(uid)
            continue
        if clave[uid] in NO_CAMBIAR and previa:
            elegidas[uid] = previa
            fijas.add(uid)
            continue
        # Si la comunidad eligió esa foto en Wikidata (P18) y ya llega a 1000 px, se respeta.
        if previa in fotos_wd.get(uid, set()) and ancho_de(previa or '', medidas) >= ANCHO_ACEPTABLE:
            elegidas[uid] = previa
            fijas.add(uid)
            continue
        # La foto que ya se ve bien no se toca: solo se cambia lo que se ve borroso.
        if ancho_de(previa or '', medidas) >= ANCHO_NITIDO and puntaje(previa, medidas):
            elegidas[uid] = previa
            continue
        mejor = mejor_de(ops, medidas)
        if mejor and conviene_cambiar(mejor, previa, medidas):
            elegidas[uid] = mejor
        elif previa:
            # Sin una opción mejor se queda la de hoy: ninguna universidad pierde su foto.
            elegidas[uid] = previa

    chicas = [uid for uid, f in elegidas.items() if uid not in fijas and ancho_de(f, medidas) < ANCHO_NITIDO]
    print(f'4/6 {len(chicas)} universidades con foto chica: buscando alternativas en su artículo…')
    por_articulo = imagenes_de_articulos({articulos[uid] for uid in chicas if uid in articulos})
    nuevas = {uid: [f for f in por_articulo.get(articulos.get(uid), []) if acreditada(f, ids[uid], False)]
              for uid in chicas if uid in articulos}
    medidas.update(tamanos({f for lista in nuevas.values() for f in lista}))

    for uid, lista in nuevas.items():
        mejor = mejor_de(lista, medidas)
        if mejor and conviene_cambiar(mejor, elegidas.get(uid), medidas):
            elegidas[uid] = mejor

    siguen = [uid for uid, f in elegidas.items() if uid not in fijas and ancho_de(f, medidas) < ANCHO_NITIDO]
    print(f'5/6 {len(siguen)} siguen chicas: mirando la categoría de Commons de cada una…')
    por_categoria = {}
    for uid in siguen:
        titulo = articulos.get(uid) or nombre.get(uid)
        if not titulo:
            continue
        archivos = archivos_de_categoria(titulo)
        if not archivos and nombre.get(uid) and nombre[uid] != titulo:
            archivos = archivos_de_categoria(nombre[uid])
        # Solo los que el nombre acredita como de esta universidad y como edificio o campus.
        por_categoria[uid] = [f for f in archivos if acreditada(f, ids[uid], True)]
        time.sleep(1)
    medidas.update(tamanos({f for lista in por_categoria.values() for f in lista}))

    for uid, lista in por_categoria.items():
        mejor = mejor_de(lista, medidas)
        if mejor and conviene_cambiar(mejor, elegidas.get(uid), medidas):
            elegidas[uid] = mejor

    print('6/6 Autor y licencia de las fotos en Commons…')
    info, anchos = {}, {}
    for lote in en_lotes(sorted(set(elegidas.values()))):
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
            anchos[f] = ii['width']
        time.sleep(1)

    salida = {clave[uid]: info[f] for uid, f in elegidas.items() if f in info}
    # Si la foto nueva no era libre, mejor la anterior que ninguna.
    for k, v in antes.items():
        salida.setdefault(k, v)
    salida = dict(sorted(salida.items()))
    with open(SALIDA, 'w') as s:
        json.dump(salida, s, ensure_ascii=False, separators=(',', ':'))

    # Resumen para revisar qué cambió. Lo que no se midió en esta corrida se mide ahora.
    faltan = {v['f'] for v in salida.values() if v['f'] not in anchos}
    for f, (ancho, _) in tamanos(faltan).items():
        anchos[f] = ancho
    cambios = [(k, antes[k]['f'], salida[k]['f'], anchos[salida[k]['f']])
               for k in salida if k in antes and antes[k]['f'] != salida[k]['f']]
    distintas = [k for k in salida if k not in antes or antes[k]['f'] != salida[k]['f']]
    chicas = [k for k in salida if anchos[salida[k]['f']] < ANCHO_NITIDO]
    with open('scripts/.cache/fotos_cambios.md', 'w') as s:
        s.write(f'# Fotos: {len(distintas)} cambiadas de {len(salida)}\n\n')
        s.write(f'Siguen por debajo de {ANCHO_NITIDO} px: {len(chicas)}\n\n')
        s.write('| Universidad | Antes | Ahora | Ancho |\n|---|---|---|---|\n')
        for k, a, b, w in cambios:
            s.write(f'| {k} | {a} | {b} | {w} |\n')

    print(f'Listo: {len(salida)} universidades con foto → {SALIDA}')
    print(f'  cambiadas: {len(distintas)} | siguen <{ANCHO_NITIDO}px: {len(chicas)}')
    print('  detalle: scripts/.cache/fotos_cambios.md')


if __name__ == '__main__':
    main()
