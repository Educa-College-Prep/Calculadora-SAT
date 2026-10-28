---
target: ficha de universidad
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/Users/Henry/Documents/calculadora/Calculadora-SAT-main/calculadora-sat/src/components/DetalleUniversidad.tsx"
target_fingerprint: "sha256:72932983945b8578e41aa99f39d10e1c7084f09a825942d9fbc42fa85819989b"
target_path: /Users/Henry/Documents/calculadora/Calculadora-SAT-main/calculadora-sat/src/components/DetalleUniversidad.tsx
timestamp: 2026-10-28T16-01-20Z
slug: sat-src-components-detalleuniversidad-tsx-31bbf89e
---
# Crítica: ficha de universidad (DetalleUniversidad.tsx)
Method: dual-agent. Casos: Harvard (completo) y universidad sin datos/sin foto, a 390 y 1440px.

## Heurísticas (27/40, Aceptable)
1 Estado 3 · 2 Lenguaje 3 · 3 Control 3 · 4 Consistencia 2 · 5 Prevención 3 · 6 Reconocer 2 · 7 Flexibilidad 3 · 8 Estética 3 · 9 Errores 3 · 10 Ayuda 2

## Especificidad
Hecha para el producto ("La carta de admisión"). Fuera de sistema: puntos de nivel #3b82f6/#7c4ddb/#e2a300 (index.css:27-29); estilos en línea en RangosSAT y DemografiaAdmision.
Detector en navegador: low-contrast puesto #1 salarios #c98f00 2.8:1 (index.css:1418, real); tiny-text crédito foto 11px (index.css:1165); nested-cards costos-columna (discutible) y nota-alerta (falso positivo); iniciales portada (falso positivo, aria-hidden); stripes (intencional); 5 stragglers. CLI .tsx: 0 (solo regex).

## Problemas prioritarios
- [P0] La ficha no usa el SAT del estudiante ni nivelSAT (App.tsx:533-543): mostrar "Con tu X: Probabilidad …", marcar "tú" en RangosSAT, campo si no hay puntaje.
- [P1] No hay momento de contacto con Educa en la ficha; termina en Similares. Banda de cierre marina con siguiente paso según nivel.
- [P1] Dos amarillos en el hero móvil (chip ranking oro + Ver campus tour); puntos de nivel fuera de paleta.
- [P2] ~25 "?" de 20px todos "Más información", 3 dentro de h3; title-only en niveles y fuente ranking; miga 20px, pestañas costo 38px; contraste puesto #1.
- [P2] Cifras repetidas 3 veces, tabla por sexo, "Sin dato" a 30px en móvil (index.css:1540), banda Admisión vacía sin datos, similares poco útiles.

## Personas
Casey: primera cifra a ~630px, sin guardar al bajar. Jordan: 25–75 solo en tooltip, Élite/Top 1% confuso, sin siguiente paso. Sam: 25 botones idénticos, info en title. Padre latinoamericano: $93,353 vs ~$28,093, sin total 4 años, calculadora solo EE.UU.

## Menores
Título largo de banda Educa; párrafo de datos repetido y >75 caracteres; barra Total translúcida sin leyenda; PRODUCT.md con "Segura/Buena opción/Difícil" y 2,965; DESIGN.md "Grado Bachiller".

## Preguntas
¿Probabilidad baja bajo la foto? ¿Ficha para estudiante o consejero? ¿Última banda "Tu siguiente paso"?
