"""
Actualiza los datos de la web con lo último que publicó el gobierno de EE.UU.

  - College Scorecard (Departamento de Educación): admisión, SAT, costos, precio neto,
    salarios... Es el mismo archivo que antes se procesaba en el Colab, con los mismos
    filtros, más UNITID y el costo de vida fuera del campus.
  - IPEDS (NCES): postulantes/admitidos/matriculados por sexo (ADM) y becas de 1er año (SFA).
    Se une por UNITID.

Escribe:
  public/universidades.json   la base de la web (Scorecard + IPEDS en un solo archivo).
  public/fuentes_datos.json   de dónde sale cada dato y de qué año (lo muestra la web).

Uso (desde calculadora-sat/):
  python3 scripts/actualizar_datos.py            # no hace nada si no hay datos nuevos
  python3 scripts/actualizar_datos.py --forzar   # regenera igual

Solo usa la biblioteca estándar de Python. Las descargas quedan en scripts/.cache/
(ignorada por git). Lo corre cada semana .github/workflows/actualizar-datos.yml.
"""
import csv
import datetime
import io
import json
import os
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(RAIZ, 'scripts', '.cache')
SALIDA = os.path.join(RAIZ, 'public', 'universidades.json')
FUENTES = os.path.join(RAIZ, 'public', 'fuentes_datos.json')
# Descripción del PR que abre el robot (la lee el workflow; no se sube al repo).
RESUMEN = os.path.join(CACHE, 'resumen_pr.md')

PAGINA_SCORECARD = 'https://collegescorecard.ed.gov/data/'
DICCIONARIO_SCORECARD = 'https://collegescorecard.ed.gov/files/CollegeScorecardDataDictionary.xlsx'
# Servidor de descargas de Scorecard (Amazon S3). A diferencia de su página, no bloquea a
# los servidores de GitHub: si la página responde 403, el archivo se busca aquí por fecha.
DESCARGAS_SCORECARD = 'https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_{:%m%d%Y}.zip'
IPEDS = 'https://nces.ed.gov/ipeds/complete-data-files/'
# Como un navegador: algunos sitios del gobierno rechazan pedidos que no lo parecen.
AGENTE = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

# --- Columnas de College Scorecard (las mismas del Colab) ---------------------------------
COLUMNAS = [
    'INSTNM', 'CITY', 'STABBR', 'CONTROL', 'UGDS', 'UGDS_HISP', 'ADM_RATE',
    'SATVR25', 'SATMT25', 'SATVR75', 'SATMT75', 'SATVR50', 'SATMT50', 'SAT_AVG', 'ADMCON7', 'OPENADMP',
    'PRGMOFR', 'CIPTITLE1', 'CIPTITLE2', 'CIPTITLE3', 'CIPTITLE4', 'CIPTITLE5', 'CIPTITLE6', 'MD_EARN_WNE_4YR', 'COUNT_WNE_4YR',
    'ICLEVEL', 'TUITIONFEE_OUT', 'TUITIONFEE_IN', 'COSTT4_A', 'NPT4_PRIV', 'NPT4_PUB',
    'MD_EARN_WNE_P6', 'MD_EARN_WNE_P8', 'MD_EARN_WNE_P10', 'MD_EARN_WNE_1YR', 'MD_EARN_WNE_5YR',
    'GT_THRESHOLD_P6', 'GT_THRESHOLD_P8', 'GT_THRESHOLD_P10', 'GT_THRESHOLD_1YR', 'GT_THRESHOLD_5YR',
    'COUNT_WNE_1YR', 'COUNT_WNE_5YR', 'NPCURL',
    'NPT41_PRIV', 'NPT41_PUB', 'NPT43_PRIV', 'NPT43_PUB', 'NPT45_PRIV', 'NPT45_PUB', 'STUFACR',
    'ROOMBOARD_ON', 'OTHEREXPENSE_ON', 'BOOKSUPPLY',
]
# Nuevas: no cuentan para el filtro de abajo, así la lista de universidades no cambia por ellas.
#   UNITID: ID oficial de la universidad (para unir fuentes; la web no lo muestra).
#   *_OFF: viviendo fuera del campus; OTHEREXPENSE_FAM: viviendo con la familia.
COLUMNAS_NUEVAS = ['UNITID', 'ROOMBOARD_OFF', 'OTHEREXPENSE_OFF', 'OTHEREXPENSE_FAM']
TEXTO = {'INSTNM', 'CITY', 'STABBR', 'NPCURL', 'CIPTITLE1', 'CIPTITLE2', 'CIPTITLE3', 'CIPTITLE4', 'CIPTITLE5', 'CIPTITLE6'}
# Filtro del Colab: solo 4 y 2 años, y al menos 10 de estas columnas con dato.
NO_CUENTAN_PARA_FILTRO = {'MD_EARN_WNE_4YR', 'COUNT_WNE_4YR'}
MINIMO_COLUMNAS_CON_DATO = 10

MAPEOS = {
    'CONTROL': {1: 'Pública', 2: 'Privada sin fines de lucro', 3: 'Privada con fines de lucro'},
    'ADMCON7': {1: 'Requerido', 2: 'Recomendado', 3: 'Ni requerido ni recomendado', 4: 'No se sabe', 5: 'Considerado pero no requerido'},
    'OPENADMP': {1: 'Sí', 2: 'No', 3: 'No admite first-time'},
    'ICLEVEL': {1: '4-Year', 2: '2-Year', 3: 'Less-than-2-Year'},
}

# --- Columnas de IPEDS --------------------------------------------------------------------
# "Otro género / no informado" no se exporta: IPEDS lo deja vacío en muchas universidades
# (es opcional), así que la web lo calcula como Total − Hombres − Mujeres.
COLUMNAS_ADM = ['APPLCN', 'APPLCNM', 'APPLCNW', 'ADMSSN', 'ADMSSNM', 'ADMSSNW', 'ENRLT', 'ENRLM', 'ENRLW']
# AGRNT = cualquier beca (federal, estatal, local o de la universidad); IGRNT = de la universidad.
# _P = % de alumnos de 1er año que la reciben; _A = monto promedio entre quienes la reciben.
COLUMNAS_SFA = ['AGRNT_P', 'AGRNT_A', 'IGRNT_P', 'IGRNT_A']

# Para fuentes_datos.json: qué año trae cada grupo de datos (según el diccionario de Scorecard).
REPRESENTANTES = {
    'admision_y_sat': 'ADM_RATE',
    'matricula_y_costo_de_vida': 'TUITIONFEE_OUT',
    'precio_neto': 'NPT4_PUB',
    'salario_4_anios': 'MD_EARN_WNE_4YR',
}


class DescargaFallida(Exception):
    """El sitio respondió algo que no es el archivo (mantenimiento, bloqueo...)."""


def descargar(url, nombre):
    """Descarga a la caché (una sola vez por nombre de archivo) y devuelve la ruta."""
    os.makedirs(CACHE, exist_ok=True)
    ruta = os.path.join(CACHE, nombre)
    if not os.path.exists(ruta):
        print(f'  descargando {url}')
        with urllib.request.urlopen(urllib.request.Request(url, headers=AGENTE), timeout=300) as r, open(ruta + '.parcial', 'wb') as f:
            while bloque := r.read(1 << 20):
                f.write(bloque)
        if nombre.endswith(('.zip', '.xlsx')) and not zipfile.is_zipfile(ruta + '.parcial'):
            os.remove(ruta + '.parcial')
            raise DescargaFallida(f'{url} no devolvió un archivo válido: el sitio puede estar en mantenimiento. Se reintentará.')
        os.replace(ruta + '.parcial', ruta)
    return ruta


def existe(url):
    """¿Hay un zip de verdad en esa dirección? Se miran los primeros bytes: cuando IPEDS está
    en mantenimiento responde 200 con una página HTML para cualquier archivo, exista o no."""
    global ultimo_error
    try:
        req = urllib.request.Request(url, headers={**AGENTE, 'Range': 'bytes=0-3'})
        with urllib.request.urlopen(req, timeout=60) as r:
            if r.status in (200, 206) and r.read(4).startswith(b'PK'):
                return True
            ultimo_error = f'respondió {r.status} pero no es un zip'
    except Exception as e:
        ultimo_error = str(e)
    return False


# Por qué falló la última consulta de existe(): va en los mensajes de error para saber si fue
# un 404 (no está) o un 403 (bloqueo).
ultimo_error = None


def ultimo_scorecard(publicado_antes):
    """El archivo por universidad más reciente de Scorecard: lo enlaza su página de datos;
    si la página no responde (a GitHub le da 403), se prueba fecha por fecha en el servidor
    de descargas, de hoy hacia atrás hasta la última publicación conocida."""
    try:
        with urllib.request.urlopen(urllib.request.Request(PAGINA_SCORECARD, headers=AGENTE), timeout=60) as r:
            html = r.read().decode('utf-8', 'replace')
        # El nombre trae la fecha de publicación como MMDDAAAA.
        fechas = {datetime.date(int(f[4:]), int(f[:2]), int(f[2:4]))
                  for f in re.findall(r'/Most-Recent-Cohorts-Institution_(\d{8})\.zip', html)}
        if fechas:
            fecha = max(fechas)
            return DESCARGAS_SCORECARD.format(fecha), fecha
        print('  la página de Scorecard no enlaza el archivo; se busca por fecha')
    except Exception as e:
        print(f'  la página de Scorecard no respondió ({e}); se busca por fecha')
    hasta = publicado_antes or datetime.date.today() - datetime.timedelta(days=400)
    fecha = datetime.date.today()
    while fecha >= hasta:
        url = DESCARGAS_SCORECARD.format(fecha)
        if existe(url):
            return url, fecha
        fecha -= datetime.timedelta(days=1)
    sys.exit('No encontré ningún archivo de Scorecard ni en su página ni en su servidor de descargas'
             f' (última respuesta: {ultimo_error}). Si es 403, el servidor está bloqueando el pedido.')


def ultimo_ipeds(prefijo, nombre_anio, desde):
    """Prueba del año más nuevo hacia atrás hasta encontrar un archivo publicado. None si no
    encuentra ninguno: IPEDS en mantenimiento (pasa seguido) o bloqueando el pedido."""
    for anio in range(desde, desde - 5, -1):
        nombre = f'{prefijo}{nombre_anio(anio)}'
        if existe(f'{IPEDS}{nombre}.zip'):
            return nombre, anio
    return None


def leer_csv_de_zip(ruta_zip):
    """El CSV de un zip. Si IPEDS publicó una versión revisada (_rv), se usa esa."""
    with zipfile.ZipFile(ruta_zip) as z:
        csvs = [n for n in z.namelist() if n.lower().endswith('.csv') and not n.startswith('__MACOSX')]
        elegido = next((n for n in csvs if '_rv' in n.lower()), csvs[0])
        crudo = z.read(elegido)
    try:
        texto = crudo.decode('utf-8-sig')
    except UnicodeDecodeError:
        texto = crudo.decode('latin-1')
    return list(csv.DictReader(io.StringIO(texto)))


def mapa_de_anios(ruta_xlsx):
    """Hoja 'Most_Recent_Inst_Cohort_Map' del diccionario: variable → de qué año es."""
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
          'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
    with zipfile.ZipFile(ruta_xlsx) as z:
        compartidos = [''.join(t.text or '' for t in si.iter(f'{{{ns["m"]}}}t'))
                       for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        libro = ET.fromstring(z.read('xl/workbook.xml'))
        rels = ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))
        hoja = next((h for h in libro.iter(f'{{{ns["m"]}}}sheet') if h.get('name') == 'Most_Recent_Inst_Cohort_Map'), None)
        if hoja is None:
            return {}
        rid = hoja.get(f'{{{ns["r"]}}}id')
        destino = next(r.get('Target') for r in rels if r.get('Id') == rid)
        xml = ET.fromstring(z.read('xl/' + destino.lstrip('/').removeprefix('xl/')))
    filas = {}
    for fila in xml.iter(f'{{{ns["m"]}}}row'):
        valores = []
        for celda in fila.iter(f'{{{ns["m"]}}}c'):
            v = celda.find('m:v', ns)
            texto = (v.text if v is not None else '') or ''
            valores.append(compartidos[int(texto)] if celda.get('t') == 's' and texto else texto)
        if len(valores) >= 2 and valores[0]:
            filas[valores[0]] = valores[1]
    return filas


# Cómo marca Scorecard la falta de dato (pandas, en el Colab, los leía como vacío).
SIN_DATO = {'', 'NA', 'NULL', 'NaN', 'N/A'}


def texto(valor):
    return None if valor is None or valor.strip() in SIN_DATO else valor


def numero(valor):
    """Número o None. Scorecard marca la falta de dato con NULL, NA o PrivacySuppressed."""
    try:
        x = float(valor)
    except (TypeError, ValueError):
        return None
    if x != x:  # NaN
        return None
    return int(x) if x.is_integer() else x


def en_espanol(cohorte):
    """'AcadYr 2025-26, reported in…' → '2025-26'; 'Fall 2024…' → 'otoño 2024'. Si el
    diccionario cambia de formato, se deja el texto original en vez de inventar un año."""
    if m := re.search(r'AcadYr (\d{4}-\d{2})', cohorte):
        return m.group(1)
    if m := re.search(r'Fall (\d{4})', cohorte):
        return f'otoño {m.group(1)}'
    if m := re.findall(r'CY(\d{4})', cohorte):
        return 'medido en ' + ' y '.join(m)
    return cohorte


# Qué cambios se cuentan en el resumen del PR: columna → cómo se nombra.
CAMBIOS_A_CONTAR = {
    'TUITIONFEE_OUT': 'matrícula (otro estado e internacionales)',
    'ROOMBOARD_ON': 'alojamiento y comida en el campus',
    'ROOMBOARD_OFF': 'alojamiento y comida fuera del campus',
    'NPT4_PUB': 'precio neto (públicas)',
    'NPT4_PRIV': 'precio neto (privadas)',
    'ADM_RATE': 'tasa de admisión',
    'SAT_AVG': 'SAT promedio',
    'MD_EARN_WNE_4YR': 'salario a 4 años',
    'IGRNT_A': 'beca promedio de la universidad',
}


NOMBRES_GRUPOS = {
    'admision_y_sat': 'admisión y SAT', 'matricula_y_costo_de_vida': 'matrícula y costo de vida',
    'precio_neto': 'precio neto', 'salario_4_anios': 'salario a 4 años',
    'admision_por_sexo': 'admisión por sexo', 'becas_primer_anio': 'becas de 1er año',
}


def fecha_corta(iso):
    return '—' if not iso else '/'.join(reversed(iso.split('-')))


def resumen_de_cambios(anteriores, nuevas, fuentes_antes, fuentes, avisos=()):
    """Markdown corto para la descripción del PR: qué se publicó y cuánto cambió."""
    # Por UNITID; si los datos anteriores no lo traían (los del Colab), por nombre y lugar.
    por_id = bool(anteriores) and all(u.get('UNITID') for u in anteriores)
    clave = (lambda u: u['UNITID']) if por_id else (lambda u: f"{u['INSTNM']}|{u['CITY']}|{u['STABBR']}")
    antes = {clave(u): u for u in anteriores}
    ahora = {clave(u): u for u in nuevas}
    agregadas = [ahora[k]['INSTNM'] for k in ahora.keys() - antes.keys()]
    quitadas = [antes[k]['INSTNM'] for k in antes.keys() - ahora.keys()]
    comunes = ahora.keys() & antes.keys()

    def lista(nombres, maximo=15):
        nombres = sorted(nombres)
        texto = ', '.join(nombres[:maximo])
        return texto + (f' y {len(nombres) - maximo} más' if len(nombres) > maximo else '')

    sc_antes = (fuentes_antes or {}).get('scorecard', {})
    ip_antes = (fuentes_antes or {}).get('ipeds', {}).get('anios', {})
    lineas = [
        'El robot semanal encontró datos nuevos publicados por el gobierno de EE.UU.',
        '',
        *[f'> ⚠️ {aviso}' for aviso in avisos],
        *([''] if avisos else []),
        '### Fuentes',
        f"- **College Scorecard**: publicado el {fecha_corta(sc_antes.get('publicado'))} → **{fecha_corta(fuentes['scorecard']['publicado'])}**",
    ]
    for grupo, anio in fuentes['scorecard']['anios'].items():
        previo = sc_antes.get('anios', {}).get(grupo)
        if previo != anio:
            lineas.append(f"  - {NOMBRES_GRUPOS.get(grupo, grupo)}: {previo or '—'} → **{anio}**")
    for grupo, anio in fuentes['ipeds']['anios'].items():
        previo = ip_antes.get(grupo)
        lineas.append(f"- **IPEDS** {NOMBRES_GRUPOS.get(grupo, grupo)}: " + (f'{previo or "—"} → **{anio}**' if previo != anio else f'{anio} (sin cambios)'))
    lineas += [
        '',
        '### Universidades',
        f'- **{len(antes):,} → {len(ahora):,}** (+{len(agregadas)} nuevas, −{len(quitadas)} que ya no están)',
    ]
    if agregadas:
        lineas.append(f'- Nuevas: {lista(agregadas)}')
    if quitadas:
        lineas.append(f'- Ya no están: {lista(quitadas)}')
    lineas += ['', '### Cuántas cambiaron', '| Dato | Universidades con cambios |', '|---|---:|']
    for columna, nombre in CAMBIOS_A_CONTAR.items():
        if not any(antes[k].get(columna) is not None for k in comunes):
            # Columna que antes no venía: no son "cambios", es un dato nuevo.
            con_dato = sum(ahora[k].get(columna) is not None for k in comunes)
            lineas.append(f'| {nombre} | dato nuevo en {con_dato:,} |')
            continue
        n = sum(antes[k].get(columna) != ahora[k].get(columna) for k in comunes)
        lineas.append(f'| {nombre} | {n:,} |')
    lineas += [
        '',
        'Antes de mergear, revisa la vista previa: que las fichas se vean bien y que los números',
        'tengan sentido. Al mergear, la web se publica con estos datos.',
    ]
    return '\n'.join(lineas) + '\n'


def main():
    forzar = '--forzar' in sys.argv
    hoy = datetime.date.today()
    anteriores = json.load(open(SALIDA, encoding='utf-8')) if os.path.exists(SALIDA) else []
    fuentes_antes = json.load(open(FUENTES, encoding='utf-8')) if os.path.exists(FUENTES) else {}
    publicado_antes = fuentes_antes.get('scorecard', {}).get('publicado')
    avisos = []

    print('Buscando lo último publicado...')
    url_scorecard, fecha_scorecard = ultimo_scorecard(datetime.date.fromisoformat(publicado_antes) if publicado_antes else None)
    adm = ultimo_ipeds('ADM', str, hoy.year)
    sfa = ultimo_ipeds('SFA', lambda a: f'{(a - 1) % 100:02d}{a % 100:02d}', hoy.year)
    # Sin acceso a IPEDS (mantenimiento o bloqueo) se conservan sus datos actuales: no tiene
    # sentido frenar una actualización de Scorecard por eso.
    conservar_ipeds = adm is None or sfa is None
    if conservar_ipeds:
        if not anteriores or not all(u.get('UNITID') for u in anteriores):
            sys.exit('No pude acceder a IPEDS (¿mantenimiento?) y no hay datos anteriores para conservar. Se reintentará.')
        avisos.append('No se pudo acceder a IPEDS (mantenimiento o bloqueo): se conservaron sus datos anteriores.')
    archivos = {
        'scorecard': os.path.basename(url_scorecard),
        'ipeds_adm': fuentes_antes.get('archivos', {}).get('ipeds_adm') if conservar_ipeds else f'{adm[0]}.zip',
        'ipeds_sfa': fuentes_antes.get('archivos', {}).get('ipeds_sfa') if conservar_ipeds else f'{sfa[0]}.zip',
    }
    print(f"  Scorecard {fecha_scorecard} · IPEDS {archivos['ipeds_adm']}, {archivos['ipeds_sfa']}"
          + (' (los de antes: IPEDS no respondió)' if conservar_ipeds else ''))

    if not forzar and fuentes_antes.get('archivos') == archivos and anteriores:
        print('Sin datos nuevos: la web ya usa estos archivos. (Usa --forzar para regenerar.)')
        return

    print('Leyendo College Scorecard...')
    filas = leer_csv_de_zip(descargar(url_scorecard, archivos['scorecard']))
    faltan = [c for c in COLUMNAS + COLUMNAS_NUEVAS if c not in filas[0]]
    if faltan:
        sys.exit(f'Scorecard ya no trae estas columnas: {faltan}. Revisa su diccionario de datos.')
    try:
        anios = mapa_de_anios(descargar(DICCIONARIO_SCORECARD, f'diccionario_{fecha_scorecard:%Y%m%d}.xlsx'))
        anios_scorecard = {grupo: en_espanol(anios[var]) for grupo, var in REPRESENTANTES.items() if anios.get(var)}
    except Exception as e:  # el diccionario solo sirve para rotular años: si falla, se sigue
        print(f'  aviso: no pude leer el diccionario de Scorecard ({e})')
        mismo_archivo = fuentes_antes.get('archivos', {}).get('scorecard') == archivos['scorecard']
        # Mismo archivo que antes: sus años siguen valiendo. Archivo nuevo: no se inventan.
        anios_scorecard = fuentes_antes.get('scorecard', {}).get('anios', {}) if mismo_archivo else {}
        if not mismo_archivo:
            avisos.append('No se pudo leer el diccionario de Scorecard: la web no mostrará de qué año son'
                          ' sus datos hasta la próxima actualización. Revisa los años a mano si hace falta.')

    print('Leyendo IPEDS...')
    if conservar_ipeds:
        anterior_por_id = {u['UNITID']: u for u in anteriores}
        ipeds_de = lambda unitid: {c: anterior_por_id[unitid][c] for c in COLUMNAS_ADM + COLUMNAS_SFA
                                   if unitid in anterior_por_id and anterior_por_id[unitid].get(c) is not None}
        anios_ipeds = fuentes_antes.get('ipeds', {}).get('anios', {})
    else:
        por_id_adm = {r['UNITID']: r for r in leer_csv_de_zip(descargar(f'{IPEDS}{adm[0]}.zip', f'{adm[0]}.zip'))}
        por_id_sfa = {r['UNITID']: r for r in leer_csv_de_zip(descargar(f'{IPEDS}{sfa[0]}.zip', f'{sfa[0]}.zip'))}

        def ipeds_de(unitid):
            datos = {}
            for columnas, fuente in ((COLUMNAS_ADM, por_id_adm), (COLUMNAS_SFA, por_id_sfa)):
                for c in columnas if str(unitid) in fuente else []:
                    valor = numero(fuente[str(unitid)].get(c))
                    if valor is not None:
                        datos[c] = valor
            return datos
        anios_ipeds = {'admision_por_sexo': f'otoño {adm[1]}', 'becas_primer_anio': f'{sfa[1] - 1}-{sfa[1] % 100:02d}'}

    columnas_filtro = [c for c in COLUMNAS if c not in NO_CUENTAN_PARA_FILTRO]
    universidades = []
    for fila in filas:
        u = {c: texto(fila[c]) if c in TEXTO else numero(fila[c]) for c in COLUMNAS + COLUMNAS_NUEVAS}
        if u['ICLEVEL'] not in (1, 2):
            continue
        if sum(u[c] is not None for c in columnas_filtro) < MINIMO_COLUMNAS_CON_DATO:
            continue
        for columna, mapeo in MAPEOS.items():
            u[columna] = mapeo.get(u[columna])
        u.update(ipeds_de(u['UNITID']))
        universidades.append(u)

    fuentes = {
        'scorecard': {
            'nombre': 'College Scorecard',
            'organismo': 'Departamento de Educación de EE.UU.',
            'publicado': fecha_scorecard.isoformat(),
            'url': PAGINA_SCORECARD,
            'anios': anios_scorecard,
        },
        'ipeds': {
            'nombre': 'IPEDS',
            'organismo': 'Centro Nacional de Estadísticas de Educación (NCES)',
            'url': 'https://nces.ed.gov/ipeds/',
            'anios': anios_ipeds,
        },
        'archivos': archivos,
    }

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(universidades, f, ensure_ascii=False, separators=(',', ':'))
    with open(FUENTES, 'w', encoding='utf-8') as f:
        json.dump(fuentes, f, ensure_ascii=False, indent=2)
        f.write('\n')
    os.makedirs(CACHE, exist_ok=True)
    with open(RESUMEN, 'w', encoding='utf-8') as f:
        f.write(resumen_de_cambios(anteriores, universidades, fuentes_antes, fuentes, avisos))

    con = lambda c: sum(u.get(c) is not None for u in universidades)
    print(f'Listo: {len(universidades)} universidades → {os.path.relpath(SALIDA, RAIZ)}')
    print(f'  con admisión por sexo: {con("APPLCN")} · con becas: {con("AGRNT_P")}'
          f' · costo de vida en el campus: {con("ROOMBOARD_ON")} · fuera del campus: {con("ROOMBOARD_OFF")}')
    print(f'  años: {json.dumps(fuentes["scorecard"]["anios"], ensure_ascii=False)}')
    for aviso in avisos:
        print(f'  aviso: {aviso}')
    print(f'  resumen para el PR: {os.path.relpath(RESUMEN, RAIZ)}')


if __name__ == '__main__':
    try:
        main()
    except DescargaFallida as e:
        sys.exit(str(e))
