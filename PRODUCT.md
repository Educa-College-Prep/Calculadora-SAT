# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Estudiantes de colegio hispanohablantes**, sobre todo de Latinoamérica, que quieren estudiar el pregrado en EE. UU. Buscan universidades, comparan costos y quieren saber si su puntaje SAT les alcanza.
- **Padres de familia**, que revisan costos y opciones junto con sus hijos.
- **Consejeros de Educa College Prep**, que la usan en las asesorías de Admission Counseling con sus alumnos.
- **Hispanos que ya viven en EE. UU.** y buscan universidad desde allá.

La mayoría entra desde el celular.

## Product Purpose

College Finder (Calculadora SAT) es una web gratuita de Educa College Prep para buscar universidades de EE. UU., filtrarlas por puntaje SAT, costo, estado y tipo, ver las posibilidades de entrar a cada una y armar una lista para compararlas.

Éxito para Educa:
1. El estudiante sale con una lista realista de universidades (Mi lista).
2. El estudiante o su familia contacta a Educa (botón "Contáctanos": Admission Counseling, curso SAT).

## Positioning

- Todo en español y pensado para quien no conoce el sistema de EE. UU.: sin jerga ("Probabilidad alta" en vez de "safety"), explicando cada dato.
- Datos oficiales del gobierno de EE. UU. (College Scorecard e IPEDS), actualizados cada semana por un robot y citando siempre la fuente.
- La experiencia real de Educa: campus tours y testimonios en video de alumnos de Educa que entraron a esas universidades.

## Operating Context

- Vistas: principal (buscador, filtros, mapa, top universidades, lista de resultados), ficha de cada universidad y Mi lista (comparador).
- El estudiante llega buscando una universidad por nombre o filtrando por su puntaje SAT; abre fichas, guarda universidades en Mi lista y las compara.
- En asesorías, el consejero de Educa la recorre con el alumno.
- Se publica en GitHub Pages: https://educa-college-prep.github.io/Calculadora-SAT/

## Capabilities and Constraints

- Web estática (React + TypeScript + Vite), sin backend; los datos son JSON que se bajan con fetch.
- Todo en español: interfaz, código, comentarios y commits.
- Niveles de posibilidad según el puntaje SAT frente al rango 25–75 de los admitidos: Probabilidad alta / media / baja. Nunca "Segura": ninguna admisión está garantizada solo por el puntaje.
- Los filtros distinguen "cumple", "no cumple" y "no se sabe" (las universidades sin dato se quedan, marcadas y al final).
- Solo universidades públicas y privadas sin fines de lucro. Fuera: las con fines de lucro, las que no tienen ningún dato en el resumen y las sedes vacías de una universidad que ya está en la web.
- No se inventan datos. Si no hay fuente oficial, se muestra "Sin dato" o no se muestra.
- Mi lista se guarda en el navegador (localStorage), igual que el perfil de costos (estudiante internacional o vive en EE. UU. y en qué estado). Se comparte con un enlace (`?lista=` con los UNITID): quien lo abre suma esas universidades a su propia lista, con "Deshacer".
- Por decidir: un perfil más completo (ciudadano, residente, estado) que cambie los costos en toda la web, no solo en Mi lista y la pestaña inicial de Costos de la ficha.
- Por decidir: fechas de postulación (no hay fuente oficial pública; hay que verificarlas a mano en la web de cada universidad).

## Brand Commitments

- Marca: Educa College Prep. Producto: College Finder. La barra superior de Educa con "Contáctanos" está en todas las vistas.
- Tono: claro y cercano, para estudiantes; cada dato con su fuente.

## Evidence on Hand

- Datos de unas 2,965 universidades: College Scorecard (Departamento de Educación de EE. UU.) e IPEDS (NCES). Salario por carrera de College Scorecard (Field of Study).
- Ranking U.S. News 2027 (top ~50 nacionales y liberal arts), actualizado a mano: `calculadora-sat/src/data/rankingUSNews.ts`.
- 58 videos de Educa (campus tours y testimonios) en 38 universidades: `calculadora-sat/src/data/videosUniversidades.ts`.
- Descripciones traducidas de Wikipedia para 118 universidades: `calculadora-sat/src/data/descripcionesUniversidades.ts`.
- Fotos libres de Wikimedia Commons con autor y licencia: `calculadora-sat/public/fotos_universidades.json`.
- No hay: testimonios escritos, cifras de alumnos de Educa admitidos, fechas de postulación verificadas ni datos de analítica de uso. No inventarlos.

## Product Principles

1. **Datos oficiales y citados.** Cada número viene de una fuente pública y se dice cuál; si falta, se dice que falta.
2. **Para quien no conoce el sistema.** Español claro, sin jerga, con ayuda en cada término.
3. **La decisión es del estudiante.** La web ayuda a armar una lista realista (Probabilidad alta / media / baja), no promete admisiones.
4. **Celular primero.** La mayoría la usa en el teléfono.
5. **Educa como guía, no como anuncio.** Los videos y el contacto con Educa acompañan los datos, no los tapan.
