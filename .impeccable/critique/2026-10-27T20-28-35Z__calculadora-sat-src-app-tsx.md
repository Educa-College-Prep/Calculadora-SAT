---
target: vista principal
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/Users/Henry/Documents/calculadora/Calculadora-SAT-main/calculadora-sat/src/App.tsx"
target_fingerprint: "sha256:63a3cc6a09671f3feab7bb5c1b6656041c5fcd980962028ed63687c400c28c3d"
target_path: /Users/Henry/Documents/calculadora/Calculadora-SAT-main/calculadora-sat/src/App.tsx
timestamp: 2026-10-27T20-28-35Z
slug: calculadora-sat-src-app-tsx
---
# Crítica: vista principal (calculadora-sat/src/App.tsx), rama portada-colores

Method: dual-agent (A: revisión de diseño · B: detector y navegador)

## Puntaje: 24/40 (Aceptable; antes 23/40)
1 Visibilidad 2 · 2 Lenguaje 3 · 3 Control 3 · 4 Consistencia 2 · 5 Prevención 3 · 6 Reconocer 3 · 7 Eficiencia 2 · 8 Diseño limpio 2 · 9 Recuperación 2 · 10 Ayuda 2

## Especificidad
Hecha para el producto (título-pregunta, casillas SAT, avisos que adivinan la causa). Coincide con DESIGN.md; aún paneles en vez de bandas y cifras chicas.
Detector: CLI 0. En vivo: low-contrast .marca-privada 4.4:1 (index.css:662, repetido por fila); nested-card en .total-sat (intencional) y .nota-alerta; straggler "marcadas." en el aviso; burbujas deshabilitadas 3.4:1 (falso positivo). Sin scroll horizontal. Táctiles <44px en celular: .ayuda-boton 20×20, "Quitar filtros" 20 alto, #sat-total 33 alto, "Limpiar" 30 alto.

## Problemas prioritarios
- [P1] La cifra principal con puntaje es el total filtrado (2,886), no el reparto alta/media/baja. → /impeccable layout, clarify
- [P1] "Recomendado" con puntaje abre solo con probabilidad alta poco conocidas; no arma lista realista. → /impeccable shape
- [P2] Vacíos que culpan a la causa equivocada (ListaUniversidades.tsx:262, TopUniversidades.tsx:40, MapaGeo.tsx:95). → /impeccable harden
- [P2] En escritorio el SAT está debajo de "Dónde quieres estudiar". → /impeccable layout
- [P2] Sin puente a Mi lista ni a Educa tras ver el reparto. → /impeccable onboard

## Personas
Jordan: "#3 LAC", "#34 Nacional", rango SAT sin explicar; aviso de 1,935 genera duda.
Casey: "Cerrar" arriba; mapa chico en la capa; táctiles chicos; botón fijo tapa la ayuda de niveles con "Más filtros" abierto.
Sam: combobox sin role listbox/option (Buscador.tsx:103); aria-live en cada tecla.
Padre: solo matrícula; "Matrícula máxima" escondida y sin aclarar; nada de ayuda financiera internacional.

## Menores
Aviso de 1,935 en ámbar (no es error); placeholder cortado; línea "Los resultados cambian al instante."; filas del Top irregulares; verde de "Privada" a 4.4:1.
