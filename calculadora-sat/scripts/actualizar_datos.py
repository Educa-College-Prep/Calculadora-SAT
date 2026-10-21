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

PAGINA_SCORECARD = 'https://collegescorecard.ed.gov/data/'
DICCIONARIO_SCORECARD = 'https://collegescorecard.ed.gov/files/CollegeScorecardDataDictionary.xlsx'
IPEDS = 'https://nces.ed.gov/ipeds/complete-data-files/'
AGENTE = {'User-Agent': 'Mozilla/5.0 (Educa College Finder; actualizacion de datos)'}

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


def descargar(url, nombre):
    """Descarga a la caché (una sola vez por nombre de archivo) y devuelve la ruta."""
    os.makedirs(CACHE, exist_ok=True)
    ruta = os.path.join(CACHE, nombre)
    if not os.path.exists(ruta):
        print(f'  descargando {url}')
        with urllib.request.urlopen(urllib.request.Request(url, headers=AGENTE), timeout=300) as r, open(ruta + '.parcial', 'wb') as f:
            while bloque := r.read(1 << 20):
                f.write(bloque)
        os.replace(ruta + '.parcial', ruta)
    return ruta


def existe(url):
    try:
        req = urllib.request.Request(url, headers={**AGENTE, 'Range': 'bytes=0-0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status in (200, 206)
    except Exception:
        return False


def ultimo_scorecard():
    """El archivo por universidad más reciente que enlaza la página de datos de Scorecard."""
    with urllib.request.urlopen(urllib.request.Request(PAGINA_SCORECARD, headers=AGENTE), timeout=60) as r:
        html = r.read().decode('utf-8', 'replace')
    enlaces = set(re.findall(r'https://[^"\'\s]+/Most-Recent-Cohorts-Institution_(\d{8})\.zip', html))
    if not enlaces:
        sys.exit('No encontré el archivo de Scorecard en su página: ¿cambió de nombre o de sitio?')
    # El nombre trae la fecha de publicación como MMDDAAAA.
    fecha = max(enlaces, key=lambda f: (f[4:], f[:4]))
    url = re.search(rf'https://[^"\'\s]+/Most-Recent-Cohorts-Institution_{fecha}\.zip', html).group(0)
    return url, datetime.date(int(fecha[4:]), int(fecha[:2]), int(fecha[2:4]))


def ultimo_ipeds(prefijo, nombre_anio, desde):
    """Prueba del año más nuevo hacia atrás hasta encontrar un archivo publicado."""
    for anio in range(desde, desde - 5, -1):
        nombre = f'{prefijo}{nombre_anio(anio)}'
        if existe(f'{IPEDS}{nombre}.zip'):
            return nombre, anio
    sys.exit(f'No encontré ningún archivo {prefijo} de IPEDS en los últimos 5 años.')


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


def main():
    forzar = '--forzar' in sys.argv
    hoy = datetime.date.today()

    print('Buscando lo último publicado...')
    url_scorecard, fecha_scorecard = ultimo_scorecard()
    adm, anio_adm = ultimo_ipeds('ADM', str, hoy.year)
    sfa, anio_sfa = ultimo_ipeds('SFA', lambda a: f'{(a - 1) % 100:02d}{a % 100:02d}', hoy.year)
    archivos = {'scorecard': os.path.basename(url_scorecard), 'ipeds_adm': f'{adm}.zip', 'ipeds_sfa': f'{sfa}.zip'}
    print(f'  Scorecard {fecha_scorecard} · IPEDS {adm}, {sfa}')

    if not forzar and os.path.exists(FUENTES):
        anteriores = json.load(open(FUENTES, encoding='utf-8')).get('archivos', {})
        if anteriores == archivos and os.path.exists(SALIDA):
            print('Sin datos nuevos: la web ya usa estos archivos. (Usa --forzar para regenerar.)')
            return

    print('Leyendo College Scorecard...')
    filas = leer_csv_de_zip(descargar(url_scorecard, archivos['scorecard']))
    faltan = [c for c in COLUMNAS + COLUMNAS_NUEVAS if c not in filas[0]]
    if faltan:
        sys.exit(f'Scorecard ya no trae estas columnas: {faltan}. Revisa su diccionario de datos.')
    try:
        anios = mapa_de_anios(descargar(DICCIONARIO_SCORECARD, f'diccionario_{fecha_scorecard:%Y%m%d}.xlsx'))
    except Exception as e:  # el diccionario solo sirve para rotular años: si falla, se sigue
        print(f'  aviso: no pude leer el diccionario de Scorecard ({e})')
        anios = {}

    print('Leyendo IPEDS...')
    por_id_adm = {r['UNITID']: r for r in leer_csv_de_zip(descargar(f'{IPEDS}{adm}.zip', f'{adm}.zip'))}
    por_id_sfa = {r['UNITID']: r for r in leer_csv_de_zip(descargar(f'{IPEDS}{sfa}.zip', f'{sfa}.zip'))}

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
        unitid = fila['UNITID']
        for columnas, fuente in ((COLUMNAS_ADM, por_id_adm), (COLUMNAS_SFA, por_id_sfa)):
            if unitid in fuente:
                for c in columnas:
                    valor = numero(fuente[unitid].get(c))
                    if valor is not None:
                        u[c] = valor
        universidades.append(u)

    fuentes = {
        'scorecard': {
            'nombre': 'College Scorecard',
            'organismo': 'Departamento de Educación de EE.UU.',
            'publicado': fecha_scorecard.isoformat(),
            'url': PAGINA_SCORECARD,
            'anios': {grupo: en_espanol(anios[var]) for grupo, var in REPRESENTANTES.items() if anios.get(var)},
        },
        'ipeds': {
            'nombre': 'IPEDS',
            'organismo': 'Centro Nacional de Estadísticas de Educación (NCES)',
            'url': 'https://nces.ed.gov/ipeds/',
            'anios': {'admision_por_sexo': f'otoño {anio_adm}', 'becas_primer_anio': f'{anio_sfa - 1}-{anio_sfa % 100:02d}'},
        },
        'archivos': archivos,
    }

    os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
    with open(SALIDA, 'w', encoding='utf-8') as f:
        json.dump(universidades, f, ensure_ascii=False, separators=(',', ':'))
    with open(FUENTES, 'w', encoding='utf-8') as f:
        json.dump(fuentes, f, ensure_ascii=False, indent=2)
        f.write('\n')

    con = lambda c: sum(u.get(c) is not None for u in universidades)
    print(f'Listo: {len(universidades)} universidades → {os.path.relpath(SALIDA, RAIZ)}')
    print(f'  con admisión por sexo: {con("APPLCN")} · con becas: {con("AGRNT_P")}'
          f' · costo de vida en el campus: {con("ROOMBOARD_ON")} · fuera del campus: {con("ROOMBOARD_OFF")}')
    print(f'  años: {json.dumps(fuentes["scorecard"]["anios"], ensure_ascii=False)}')


if __name__ == '__main__':
    main()
