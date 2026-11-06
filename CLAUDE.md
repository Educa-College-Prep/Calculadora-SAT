# CLAUDE.md

Guía para trabajar en este repositorio.

## Qué es

**College Finder / Calculadora SAT** de Educa College Prep: una web estática (React + TypeScript + Vite) para que estudiantes hispanohablantes busquen universidades de EE.UU., filtren por puntaje SAT, costo, estado, etc., y vean sus posibilidades de entrar. Se publica en GitHub Pages: https://educa-college-prep.github.io/Calculadora-SAT/

No hay backend: todos los datos son JSON en `calculadora-sat/public/` que la web baja con `fetch`.

Todo (interfaz, código, comentarios, commits) está en **español**. Mantenerlo así.

## Estructura

```
.github/workflows/
  deploy.yml            push a main → build y publica en Pages; en PR solo compila
  actualizar-datos.yml  "el robot": cada lunes corre actualizar_datos.py y abre PR si hay datos nuevos
  actualizar-videos.yml robot de videos: cada día corre actualizar_videos.py y abre PR si hay videos nuevos
calculadora-sat/        ← la app (todos los comandos se corren desde aquí)
  src/
    main.tsx            monta <BarraEduca /> (barra de la marca) + <App />
    App.tsx             estado global, carga de datos, filtrado, ruteo por history
    types.ts            tipo Universidad (columnas de Scorecard + IPEDS)
    components/         un componente por archivo, nombres en español (PascalCase)
    utils/              lógica pura y hooks (búsqueda, niveles SAT, costos, formato…)
    data/rankingUSNews.ts  ranking U.S. News (top ~50), se actualiza a mano cada septiembre
    data/videos_universidades.json  videos de YouTube de Educa por UNITID; lo mantiene el robot de videos
    index.css           todos los estilos (CSS plano, sin framework)
  public/
    universidades.json      base principal (~4300 universidades), GENERADA por script
    fuentes_datos.json      fecha/año de cada fuente, GENERADA por script (la muestra el pie)
    fotos_universidades.json  foto de Wikimedia por universidad, GENERADA por script
    geo/                    ubicaciones de ciudades y condados por estado (mapas)
  scripts/
    actualizar_datos.py     baja College Scorecard + IPEDS y regenera los JSON
    fotos_universidades.py  regenera fotos_universidades.json vía Wikidata/Commons
    actualizar_videos.py    agrega a cada ficha los videos nuevos del canal de YouTube de Educa
capturas/               screenshots que deja el usuario (ignorada por git)
_to_delete/             basura histórica; no tocar ni usar
```

## Comandos

Desde `calculadora-sat/`:

```bash
npm run dev       # servidor de desarrollo (Vite)
npm run build     # tsc -b && vite build — lo mismo que corre CI; usarlo para verificar cambios
npm run lint      # eslint
npm run preview   # sirve dist/
python3 scripts/actualizar_datos.py            # solo escribe si hay datos nuevos
python3 scripts/actualizar_datos.py --forzar   # regenera igual
python3 scripts/fotos_universidades.py         # tarda minutos (límite de Wikipedia)
python3 scripts/actualizar_videos.py           # con YOUTUBE_API_KEY lee el canal completo; sin ella, el RSS
```

No hay tests automatizados. La verificación es `npm run build` (TypeScript estricto con `noUnusedLocals`/`noUnusedParameters`) + `npm run lint` + probar en el navegador.

Publicar = mergear a `main` (lo hace `deploy.yml`). El script `npm run deploy` (gh-pages) es heredado; no se usa.

## Arquitectura de la app

- **Datos**: `App.tsx` baja `universidades.json` una vez, normaliza algunos campos (`aNumero` para salarios que pueden venir como `"PS"`), agrega `_id` (índice) y `USNEWS_ORDEN`. Otros JSON se cargan perezosamente con una promesa cacheada a nivel de módulo (`utils/fotos.ts`, `utils/fuentesDatos.ts`, mapa en `MapaInteractivo.tsx`). Las rutas siempre con `import.meta.env.BASE_URL` (la base es `/Calculadora-SAT/`, ver `vite.config.ts`).
- **Campos**: se usan los nombres originales de College Scorecard / IPEDS (`INSTNM`, `STABBR`, `SATMT25`, `ADMCON7`, `TUITIONFEE_OUT`, `NPT4_PRIV`…). `ADMCON7`, `CONTROL`, etc. ya vienen traducidos al español en el JSON. Faltante = `null`.
- **Filtrado** (`App.tsx`): los filtros se pasan por `useDeferredValue` para no trabar la UI con ~4300 registros. Cada filtro activo distingue tres casos: cumple, no cumple (se descarta) y *no se sabe* (se queda, marcada en `faltantesPorId` y ordenada al final). Respetar esta regla al agregar filtros.
- **Niveles SAT** (`utils/nivelSAT.ts`): Probabilidad alta / media / baja comparando el puntaje total con el rango 25–75 de los admitidos. Es la única fuente de verdad: lista, filtros y ficha la usan. No decir "Segura": ninguna admisión está garantizada solo por el puntaje (decisión de Educa).
- **Búsqueda** (`utils/busqueda.ts`, `utils/aliases.ts`): índice con alias ("MIT") y tolerancia a errores de tipeo.
- **Vistas**: principal (buscador, filtros, mapa, top, lista), ficha (`DetalleUniversidad`) y Mi lista (`ComparadorUniversidades`). Se navega con `window.history` (pushState/popstate), sin router. La barra (`BarraEduca`) vuelve al inicio emitiendo el evento `EVENTO_INICIO`.
- **Mi lista** (`utils/useMiLista.ts`): guardada en `localStorage`, clave por `claveUniversidad` (nombre|ciudad|estado).
- **Gráficos/mapas**: Recharts para gráficos. El mapa de la portada es SVG propio (`MapaInteractivo.tsx`), con `public/geo/mapa-eeuu.json`, que genera `scripts/generar_mapa_eeuu.mjs`.

## El robot de datos (`actualizar_datos.py`)

- Solo biblioteca estándar de Python. Descargas en `scripts/.cache/` (ignorada).
- Con `SCORECARD_API_KEY` (en GitHub) usa la API oficial de Scorecard, porque su página y descargas dan 403 a GitHub; sin clave baja el CSV. Ambos deben dar los mismos valores (`CAMPOS_API` mapea columna → campo de la API).
- La fecha de publicación y el diccionario de años de Scorecard se leen a través de archive.org. Si archive.org no responde, **no se adivina**: no actualiza nada y reintenta la semana siguiente.
- Si IPEDS no responde, conserva sus datos actuales.
- Escribe `hay_datos_nuevos` en `$GITHUB_OUTPUT` y la descripción del PR en `scripts/.cache/resumen_pr.md`.
- `COLUMNAS` y el filtro de mínimo de columnas definen qué universidades entran; `COLUMNAS_NUEVAS` no cuentan para ese filtro (para no cambiar la lista).
- No editar `public/universidades.json` ni `fuentes_datos.json` a mano: regenerarlos con el script.

## El robot de videos (`actualizar_videos.py`)

- Lee el canal @EducaCollegePrep con la API de YouTube (`YOUTUBE_API_KEY` en GitHub; canal completo, títulos en español con `hl=es`). Sin clave usa el feed RSS (últimos 15), que YouTube tiene caído a ratos: si falla, no cambia nada. Descarta Shorts (≤ 3 min) y en vivos.
- Reconoce la universidad por su nombre oficial o un alias de `aliases.ts` (con exclusiones: "UK", "Texas"…), primero en el título y si no en la descripción. Si el título habla de otro país no la agrega (King's College London ≠ King's College de PA).
- El PR separa: agregados, agregados con duda (⚠️) y no agregados (❓). Todo video visto queda en la universidad o en `ignorados`, para no volver a proponerlo.
- Se puede editar `videos_universidades.json` a mano (títulos más cortos, mover un video); el robot solo agrega.

## Convenciones

- Commits en español, en minúscula, con prefijo de área: `robot: …`, `pie: …`, `ficha: …`, `lista: …`, `datos: …`, `workflow: …`. Describen el efecto para el usuario. **Sin** línea `Co-Authored-By`.
- Trabajo en ramas y PR a `main`; nunca commitear directo a `main`.
- Comentarios en español explicando el *por qué* (abundantes, en el mismo tono que el código existente). Docstrings `/** … */` en funciones y constantes no obvias.
- Textos de la interfaz pensados para estudiantes: claros, sin jerga ("Probabilidad alta" en vez de "safety"), citando la fuente de cada dato.
- La rama `con-ia` guarda una versión con asistente de IA que se quitó de `main`.
