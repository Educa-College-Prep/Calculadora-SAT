---
target: vista principal
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:/Users/Henry/Documents/calculadora/Calculadora-SAT-main/calculadora-sat/src/App.tsx"
target_fingerprint: "sha256:824214f644053696939d93ab4d56a9aafc2dca28cfdae3f0fa188fd3b4830723"
target_path: /Users/Henry/Documents/calculadora/Calculadora-SAT-main/calculadora-sat/src/App.tsx
timestamp: 2026-10-27T18-27-16Z
slug: calculadora-sat-src-app-tsx
---
# Crítica: vista principal (calculadora-sat/src/App.tsx)

Method: dual-agent (A: revisión de diseño · B: detector y navegador)

## Puntaje: 23/40 (Aceptable)
1 Visibilidad 3 · 2 Lenguaje 2 · 3 Control 3 · 4 Consistencia 2 · 5 Prevención 2 · 6 Reconocer 3 · 7 Eficiencia 2 · 8 Diseño limpio 2 · 9 Recuperación 2 · 10 Ayuda 2

## Especificidad
Intercambiable: plantilla genérica de buscador. Gran distancia con DESIGN.md: tokens viejos (index.css:10-25, MapaGeo.tsx:26), sin bandas ni marino/sol, sin fotos ni Educa en la portada.
Detector: low-contrast 3.5:1 en niveles deshabilitados (index.css:1777, falso positivo técnico pero confirma el problema); stragglers en Filtros.tsx:300 y TopUniversidades.tsx:20; side-tab en .nota-alerta (index.css:512).

## Problemas prioritarios
- [P1] Celular: la lista queda bajo ~1.7 pantallas de filtros; contador en la 3.ª pantalla. → /impeccable adapt, layout
- [P1] Portada no migrada a "La carta de admisión": tokens viejos, amarillo en 4 lugares, ranking amarillo #1–#34 (index.css:1566), niveles semáforo con rojo en "Baja" (index.css:1772-1774). → /impeccable colorize, bolder
- [P1] Campo SAT corta a 3 dígitos (Filtros.tsx:205): "1200" → "120" + error; no se puede ingresar solo el total; "Verbal". → /impeccable harden, clarify
- [P2] Lenguaje mezclado: "Grado Associate", dos vocabularios de política SAT, ~28 opciones de orden con jerga. → /impeccable clarify, distill
- [P2] Orden por defecto alfabético con vacíos; aviso de 1,935 sin datos; Top sin nivel. → /impeccable layout

## Personas
Jordan: no sabe qué hace la herramienta; jerga sin explicar; "Tus posibilidades" gris sin indicar dónde llenar el SAT.
Casey: ~2,300px hasta la lista; acciones arriba; estrella pequeña sin texto; buscador sigue filtrando al volver.
Sam: fila = botón gigante leído como un bloque; explicaciones de nivel en title; mapa sin teclado.
Padre: solo matrícula sin vivienda; "Matrícula máxima" sin aclarar; precio neto para ciudadanos.

## Menores
h1 duplicado con línea gruesa; "↑ Asc." críptico; "Ninguna de tus resultados" (TopUniversidades.tsx:23,29); text-wrap: pretty; CLAUDE.md desactualizado sobre los nombres de niveles.

## Preguntas
¿Abrir con "¿me alcanza mi SAT?" en vez de un formulario? ¿"Las mejores a tu alcance" en vez de Top? ¿El mapa ayuda o decora en celular? ¿Una banda de Educa en la portada?
