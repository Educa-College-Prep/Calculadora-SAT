"""
Actualiza los datos de la web con lo último que publicó el gobierno de EE.UU.

  - College Scorecard (Departamento de Educación): admisión, SAT, costos, precio neto,
    salarios... Las mismas columnas y filtros que antes se procesaban en el Colab, más
    UNITID y el costo de vida fuera del campus.
  - IPEDS (NCES): postulantes/admitidos/matriculados por sexo (ADM) y becas de 1er año (SFA).
    Se une por UNITID.

De dónde se baja Scorecard:
  - Con la variable de entorno SCORECARD_API_KEY (así corre en GitHub): de su API oficial.
    Su página y su servidor de descargas responden 403 a los servidores de GitHub.
    La clave es gratis: https://api.data.gov/signup/
  - Sin clave (en una computadora normal): el archivo CSV de su página de datos, como el Colab.
  Las dos dan los mismos valores.

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
import gzip
import io
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
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
API_SCORECARD = 'https://api.data.gov/ed/collegescorecard/v1/schools.json'
CLAVE_API = os.environ.get('SCORECARD_API_KEY', '').strip()
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
# Nombre de cada columna en la API (sale del diccionario de Scorecard, columna
# "developer-friendly name"). Verificado: dan los mismos valores que el CSV.
CAMPOS_API = {
    'INSTNM': 'school.name',
    'CITY': 'school.city',
    'STABBR': 'school.state',
    'CONTROL': 'school.ownership',
    'UGDS': 'latest.student.size',
    'UGDS_HISP': 'latest.student.demographics.race_ethnicity.hispanic',
    'ADM_RATE': 'latest.admissions.admission_rate.overall',
    'SATVR25': 'latest.admissions.sat_scores.25th_percentile.critical_reading',
    'SATMT25': 'latest.admissions.sat_scores.25th_percentile.math',
    'SATVR75': 'latest.admissions.sat_scores.75th_percentile.critical_reading',
    'SATMT75': 'latest.admissions.sat_scores.75th_percentile.math',
    'SATVR50': 'latest.admissions.sat_scores.50th_percentile.critical_reading',
    'SATMT50': 'latest.admissions.sat_scores.50th_percentile.math',
    'SAT_AVG': 'latest.admissions.sat_scores.average.overall',
    'ADMCON7': 'latest.admissions.test_requirements',
    'OPENADMP': 'school.open_admissions_policy',
    'PRGMOFR': 'latest.academics.program_reporter.programs_offered',
    'CIPTITLE1': 'latest.academics.program_reporter.program_1.cip_6_digit.title',
    'CIPTITLE2': 'latest.academics.program_reporter.program_2.cip_6_digit.title',
    'CIPTITLE3': 'latest.academics.program_reporter.program_3.cip_6_digit.title',
    'CIPTITLE4': 'latest.academics.program_reporter.program_4.cip_6_digit.title',
    'CIPTITLE5': 'latest.academics.program_reporter.program_5.cip_6_digit.title',
    'CIPTITLE6': 'latest.academics.program_reporter.program_6.cip_6_digit.title',
    'MD_EARN_WNE_4YR': 'latest.earnings.4_yrs_after_completion.median',
    'COUNT_WNE_4YR': 'latest.earnings.4_yrs_after_completion.working_not_enrolled.overall_count',
    'ICLEVEL': 'school.institutional_characteristics.level',
    'TUITIONFEE_OUT': 'latest.cost.tuition.out_of_state',
    'TUITIONFEE_IN': 'latest.cost.tuition.in_state',
    'COSTT4_A': 'latest.cost.attendance.academic_year',
    'NPT4_PRIV': 'latest.cost.avg_net_price.private',
    'NPT4_PUB': 'latest.cost.avg_net_price.public',
    'MD_EARN_WNE_P6': 'latest.earnings.6_yrs_after_entry.median',
    'MD_EARN_WNE_P8': 'latest.earnings.8_yrs_after_entry.median_earnings',
    'MD_EARN_WNE_P10': 'latest.earnings.10_yrs_after_entry.median',
    'MD_EARN_WNE_1YR': 'latest.earnings.1_yr_after_completion.median',
    'MD_EARN_WNE_5YR': 'latest.earnings.5_yrs_after_completion.median',
    'GT_THRESHOLD_P6': 'latest.earnings.6_yrs_after_entry.gt_threshold',
    'GT_THRESHOLD_P8': 'latest.earnings.8_yrs_after_entry.gt_threshold',
    'GT_THRESHOLD_P10': 'latest.earnings.10_yrs_after_entry.gt_threshold',
    'GT_THRESHOLD_1YR': 'latest.earnings.1_yr_after_completion.overall_count_gt_hs_grad',
    'GT_THRESHOLD_5YR': 'latest.earnings.5_yrs_after_completion.overall_count_gt_hs_grad',
    'COUNT_WNE_1YR': 'latest.earnings.1_yr_after_completion.working_not_enrolled.overall_count',
    'COUNT_WNE_5YR': 'latest.earnings.5_yrs_after_completion.working_not_enrolled.overall_count',
    'NPCURL': 'school.price_calculator_url',
    'NPT41_PRIV': 'latest.cost.net_price.private.by_income_level.0-30000',
    'NPT41_PUB': 'latest.cost.net_price.public.by_income_level.0-30000',
    'NPT43_PRIV': 'latest.cost.net_price.private.by_income_level.48001-75000',
    'NPT43_PUB': 'latest.cost.net_price.public.by_income_level.48001-75000',
    'NPT45_PRIV': 'latest.cost.net_price.private.by_income_level.110001-plus',
    'NPT45_PUB': 'latest.cost.net_price.public.by_income_level.110001-plus',
    'STUFACR': 'latest.student.demographics.student_faculty_ratio',
    'ROOMBOARD_ON': 'latest.cost.roomboard.oncampus',
    'OTHEREXPENSE_ON': 'latest.cost.otherexpense.oncampus',
    'BOOKSUPPLY': 'latest.cost.booksupply',
    'UNITID': 'id',
    'ROOMBOARD_OFF': 'latest.cost.roomboard.offcampus',
    'OTHEREXPENSE_OFF': 'latest.cost.otherexpense.offcampus',
    'OTHEREXPENSE_FAM': 'latest.cost.otherexpense.withfamily',
}
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
    try:
        req = urllib.request.Request(url, headers={**AGENTE, 'Range': 'bytes=0-3'})
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status in (200, 206) and r.read(4).startswith(b'PK')
    except Exception:
        return False


def archivos_en_pagina(html):
    """{fecha de publicación: enlace} de los archivos por universidad que enlaza la página de
    datos de Scorecard. El nombre trae la fecha como MMDDAAAA."""
    return {datetime.date(int(f[4:]), int(f[:2]), int(f[2:4])): u
            for u, f in re.findall(r'(https://[^"\'\s]+/Most-Recent-Cohorts-Institution_(\d{8})\.zip)', html)}


def ultimo_scorecard():
    """El archivo por universidad más reciente que enlaza la página de datos de Scorecard."""
    try:
        with urllib.request.urlopen(urllib.request.Request(PAGINA_SCORECARD, headers=AGENTE), timeout=60) as r:
            html = r.read().decode('utf-8', 'replace')
    except Exception as e:
        sys.exit(f'La página de Scorecard no respondió ({e}). Si es 403, está bloqueando el pedido:'
                 ' usa la API con la variable SCORECARD_API_KEY (ver arriba del script).')
    enlaces = archivos_en_pagina(html)
    if not enlaces:
        sys.exit('No encontré el archivo de Scorecard en su página: ¿cambió de nombre o de sitio?')
    fecha = max(enlaces)
    return enlaces[fecha], fecha


def copia_fresca_en_archive(url, intentos=4):
    """Scorecard bloquea a GitHub, pero no a Internet Archive: se le pide a archive.org que guarde
    una copia de `url` en este momento (la descarga la hacen sus servidores) y se lee esa copia.
    Solo sirve una copia recién hecha: una vieja podría ser de antes de la última publicación.
    Si archive.org falla o devuelve una copia vieja, se le vuelve a pedir (archive.org a veces
    está ocupado). Devuelve los bytes del archivo original, o None si ningún intento resultó."""
    for intento in range(intentos):
        if intento:
            espera = 30 * 2 ** (intento - 1)  # 30 s, 1 min, 2 min
            print(f'  archive.org: reintento en {espera} s')
            time.sleep(espera)
        try:
            pedido = urllib.request.Request(f'https://web.archive.org/save/{url}', headers=AGENTE)
            with urllib.request.urlopen(pedido, timeout=300) as r:
                copia = re.search(r'/web/(\d{14})', r.geturl())
            if not copia:
                print(f'  archive.org no devolvió una copia de {url}')
                continue
            hecha = datetime.datetime.strptime(copia.group(1), '%Y%m%d%H%M%S')
            if datetime.datetime.utcnow() - hecha > datetime.timedelta(days=1):
                print(f'  archive.org devolvió una copia vieja ({hecha:%d/%m/%Y}) de {url}')
                continue
            # "id_": el archivo tal cual, sin la barra que archive.org agrega a las páginas.
            original = urllib.request.Request(f'https://web.archive.org/web/{copia.group(1)}id_/{url}', headers=AGENTE)
            with urllib.request.urlopen(original, timeout=300) as r:
                contenido = r.read()
            # Las páginas las guarda comprimidas, tal como las mandó el sitio.
            return gzip.decompress(contenido) if contenido[:2] == b'\x1f\x8b' else contenido
        except Exception as e:
            print(f'  archive.org no pudo copiar {url} ({e})')
    return None


def scorecard_por_api():
    """Todas las universidades desde la API, con los nombres de columna del CSV."""
    filas, pagina, total = [], 0, None
    while total is None or pagina * 100 < total:
        consulta = urllib.parse.urlencode({'api_key': CLAVE_API, 'fields': ','.join(CAMPOS_API.values()),
                                           'per_page': 100, 'page': pagina})
        for intento in range(5):
            try:
                with urllib.request.urlopen(f'{API_SCORECARD}?{consulta}', timeout=120) as r:
                    datos = json.load(r)
                break
            except urllib.error.HTTPError as e:
                if e.code in (429, 500, 502, 503, 504) and intento < 4:
                    time.sleep(15 * (intento + 1))  # límite de consultas o falla pasajera
                    continue
                sys.exit(f'La API de Scorecard respondió {e.code} en la página {pagina}. Si es 403,'
                         ' revisa que la clave SCORECARD_API_KEY sea correcta.')
        total = datos['metadata']['total']
        filas += [{columna: r.get(campo) for columna, campo in CAMPOS_API.items()} for r in datos['results']]
        pagina += 1
    print(f'  {len(filas)} universidades desde la API ({pagina} consultas)')
    return filas


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
    if valor is None:
        return None
    valor = str(valor)
    return None if valor.strip() in SIN_DATO else valor


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


def fecha_de(scorecard):
    return f"publicado el {fecha_corta(scorecard.get('publicado'))}"


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
        f"- **College Scorecard**: {fecha_de(sc_antes)} → **{fecha_de(fuentes['scorecard'])}**",
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


def esperar_a_la_proxima(motivo):
    """No actualiza nada y lo deja a la vista: en GitHub, "::warning::" aparece como anotación
    arriba en la página de la ejecución, sin tener que abrir el registro."""
    texto = f'No se actualizó esta semana: {motivo} Se reintentará el próximo lunes.'
    print(f'::warning title=Robot en espera::{texto}' if os.environ.get('GITHUB_ACTIONS') else f'  {texto}')


def main():
    forzar = '--forzar' in sys.argv
    hoy = datetime.date.today()
    anteriores = json.load(open(SALIDA, encoding='utf-8')) if os.path.exists(SALIDA) else []
    fuentes_antes = json.load(open(FUENTES, encoding='utf-8')) if os.path.exists(FUENTES) else {}
    archivos_antes = fuentes_antes.get('archivos', {})
    avisos = []

    print('Buscando lo último publicado...')
    if CLAVE_API:
        url_scorecard = fecha_scorecard = None
        archivo_scorecard = 'api'
        print('  Scorecard: desde su API')
    else:
        url_scorecard, fecha_scorecard = ultimo_scorecard()
        archivo_scorecard = os.path.basename(url_scorecard)
        print(f'  Scorecard: archivo del {fecha_scorecard}')
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
        'scorecard': archivo_scorecard,
        'ipeds_adm': archivos_antes.get('ipeds_adm') if conservar_ipeds else f'{adm[0]}.zip',
        'ipeds_sfa': archivos_antes.get('ipeds_sfa') if conservar_ipeds else f'{sfa[0]}.zip',
    }
    print(f"  IPEDS: {archivos['ipeds_adm']}, {archivos['ipeds_sfa']}" + (' (los de antes: no respondió)' if conservar_ipeds else ''))

    # Con el CSV, el nombre del archivo ya dice si es nuevo (y se evita bajarlo). Con la API
    # hay que bajar los datos y compararlos (más abajo).
    if not CLAVE_API and not forzar and archivos_antes == archivos and anteriores:
        print('Sin datos nuevos: la web ya usa estos archivos. (Usa --forzar para regenerar.)')
        return

    print('Leyendo College Scorecard...')
    if CLAVE_API:
        filas = scorecard_por_api()
    else:
        filas = leer_csv_de_zip(descargar(url_scorecard, archivo_scorecard))
        faltan = [c for c in COLUMNAS + COLUMNAS_NUEVAS if c not in filas[0]]
        if faltan:
            sys.exit(f'Scorecard ya no trae estas columnas: {faltan}. Revisa su diccionario de datos.')

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

    # ¿Cambió algo de verdad? Las direcciones se comparan sin mayúsculas: el CSV y la API
    # escriben distinto algunas (…?NULL=NULL frente a …?null=null) y son la misma.
    def comparable(lista, columnas):
        return [{c: u.get(c).lower() if c == 'NPCURL' and u.get(c) else u.get(c) for c in columnas} for u in lista]
    cambio_scorecard = comparable(universidades, COLUMNAS + COLUMNAS_NUEVAS) != comparable(anteriores, COLUMNAS + COLUMNAS_NUEVAS)
    cambio_ipeds = comparable(universidades, COLUMNAS_ADM + COLUMNAS_SFA) != comparable(anteriores, COLUMNAS_ADM + COLUMNAS_SFA)
    if not forzar and not cambio_scorecard and not cambio_ipeds:
        print('Sin datos nuevos: los datos que se bajaron son iguales a los de la web.')
        return

    # Fecha de publicación y años de Scorecard: la fecha viene en el nombre del archivo CSV, y los
    # años, en su diccionario. Con la API (en GitHub) ambos se leen a través de archive.org.
    # Si archive.org no responde, NO se adivina: no se actualiza nada y se reintenta la semana
    # siguiente, dejando el motivo a la vista en la ejecución del robot.
    if CLAVE_API and not cambio_scorecard:
        # Solo cambió IPEDS: la fecha y los años de Scorecard siguen valiendo.
        fecha = {'publicado': fuentes_antes.get('scorecard', {}).get('publicado')}
        anios_scorecard = fuentes_antes.get('scorecard', {}).get('anios', {})
    else:
        if CLAVE_API:
            pagina = copia_fresca_en_archive(PAGINA_SCORECARD)
            enlaces = archivos_en_pagina(pagina.decode('utf-8', 'replace')) if pagina else {}
            if not enlaces:
                return esperar_a_la_proxima('no se pudo leer la fecha de publicación de Scorecard: su página'
                                            ' bloquea a GitHub y archive.org no respondió.')
            fecha_scorecard = max(enlaces)
        fecha = {'publicado': fecha_scorecard.isoformat()}
        nombre_diccionario = f'diccionario_{fecha_scorecard:%Y%m%d}.xlsx'
        try:
            ruta = descargar(DICCIONARIO_SCORECARD, nombre_diccionario)
        except Exception as e:
            print(f'  no pude bajar el diccionario de Scorecard ({e}); se pide a archive.org')
            contenido = copia_fresca_en_archive(DICCIONARIO_SCORECARD)
            ruta = None
            if contenido and contenido.startswith(b'PK'):
                ruta = os.path.join(CACHE, nombre_diccionario)
                with open(ruta, 'wb') as f:
                    f.write(contenido)
        anios = mapa_de_anios(ruta) if ruta else {}
        anios_scorecard = {grupo: en_espanol(anios[var]) for grupo, var in REPRESENTANTES.items() if anios.get(var)}
        if len(anios_scorecard) < len(REPRESENTANTES):
            return esperar_a_la_proxima('no se pudo leer de qué año es cada dato (diccionario de Scorecard):'
                                        ' su sitio bloquea a GitHub y archive.org no respondió.')

    fuentes = {
        'scorecard': {
            'nombre': 'College Scorecard',
            'organismo': 'Departamento de Educación de EE.UU.',
            **fecha,
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
    # Para el workflow: el paso que abre el PR solo corre si esto dice true.
    if os.environ.get('GITHUB_OUTPUT'):
        with open(os.environ['GITHUB_OUTPUT'], 'a', encoding='utf-8') as f:
            f.write('hay_datos_nuevos=true\n')

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
