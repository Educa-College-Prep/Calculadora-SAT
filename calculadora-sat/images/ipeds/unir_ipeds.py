# Une datos de IPEDS a la base de la web:
#   - ADM 2024 (otoño 2024): postulantes/admitidos/matriculados por sexo.
#   - SFA 2023-24: becas que reciben los alumnos de 1er año a tiempo completo.
# Uso: python3 unir_ipeds.py <universidades.json> <salida ipeds_2024.json>
# Lee hd2024.csv, adm2024.csv y sfa2324.csv desde la misma carpeta de este script.
#
# El JSON de la web no trae UNITID, así que se empareja por nombre + ciudad + estado
# (directorio hd2024). Si el nombre cambió, se usa estado + tasa de admisión como respaldo.
# Cuando el colab exporte UNITID, este emparejamiento se puede reemplazar por el ID directo.
import csv,json,sys,collections,unicodedata,re,os
D=os.path.dirname(os.path.abspath(__file__))
J,OUT=sys.argv[1],sys.argv[2]

def cargar(nombre):
    raw=open(os.path.join(D,nombre),'rb').read()
    try: txt=raw.decode('utf-8-sig')
    except UnicodeDecodeError: txt=raw.decode('latin-1')
    return {r['UNITID']:r for r in csv.DictReader(txt.splitlines())}

uni=json.load(open(J))
hd=cargar('hd2024.csv'); adm=cargar('adm2024.csv'); sfa=cargar('sfa2324.csv')
st={u:r['STABBR'] for u,r in hd.items()}

def n(s): s=unicodedata.normalize('NFKD',s or '').encode('ascii','ignore').decode().lower(); return re.sub(r'[^a-z0-9]','',s)
def num(x):
    try: return int(float(x))
    except: return None
def rate(a):
    A,B=num(a['ADMSSN']),num(a['APPLCN']); return round(A/B,4) if A and B else None

k3=collections.defaultdict(list)
for u,r in hd.items(): k3[(n(r['INSTNM']),n(r['CITY']),r['STABBR'])].append(u)
kr=collections.defaultdict(list)
for uid,a in adm.items(): kr[(st.get(uid),rate(a))].append(uid)

# "Otro género / no informado" no se exporta: IPEDS lo deja vacío en muchas universidades
# (es opcional), así que la web lo calcula como Total − Hombres − Mujeres.
COLS_ADM=['APPLCN','APPLCNM','APPLCNW','ADMSSN','ADMSSNM','ADMSSNW','ENRLT','ENRLM','ENRLW']
# AGRNT = cualquier beca (federal, estatal, local o de la universidad); IGRNT = de la universidad.
# _P = % de alumnos de 1er año que la reciben; _A = monto promedio entre quienes la reciben.
COLS_SFA=['AGRNT_P','AGRNT_A','IGRNT_P','IGRNT_A']

res={}; stats=collections.Counter()
for u in uni:
    key=f"{u['INSTNM']}|{u['CITY']}|{u['STABBR']}"
    cand=k3.get((n(u['INSTNM']),n(u['CITY']),u['STABBR']),[])
    uid=cand[0] if len(cand)==1 else None
    # Verificación: si IPEDS tiene admisión, su tasa debe coincidir con la del JSON.
    if uid and uid in adm and u['ADM_RATE'] is not None:
        r=rate(adm[uid])
        if r is not None and abs(r-u['ADM_RATE'])>0.0002:
            stats['nombre_pero_tasa_distinta']+=1; uid=None
    if uid: stats['por_nombre']+=1
    elif u['ADM_RATE'] is not None:
        c=kr.get((u['STABBR'],round(u['ADM_RATE'],4)),[])
        if len(c)==1: uid=c[0]; stats['por_tasa']+=1
        else: stats['sin_match']+=1
    else: stats['sin_match']+=1
    if not uid: continue
    fila={}
    if uid in adm: fila.update({c:num(adm[uid][c]) for c in COLS_ADM})
    if uid in sfa: fila.update({c:num(sfa[uid][c]) for c in COLS_SFA})
    fila={k:v for k,v in fila.items() if v is not None}
    if fila: res[key]=fila

print(dict(stats))
print("con admisión:",sum(1 for f in res.values() if 'APPLCN' in f),"| con becas:",sum(1 for f in res.values() if 'AGRNT_P' in f))
json.dump(res,open(OUT,'w'),ensure_ascii=False,separators=(',',':'))
