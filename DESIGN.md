---
name: College Finder · Educa College Prep
description: Buscador de universidades de EE. UU. en español, con datos oficiales y la experiencia de Educa.
colors:
  marino: "#1c2c6e"
  azul-educa: "#2a3f8f"
  azul-educa-suave: "#e8ecf8"
  violeta-atardecer: "#4a3a86"
  sol: "#ffd23f"
  verde-campus: "#2e7b6b"
  tinta-noche: "#1b2a57"
  gris-pizarra: "#5b6582"
  niebla: "#f2f3f8"
  blanco: "#ffffff"
  linea: "#d9deea"
  oro: "#ffd23f"
  plata: "#e3e8f2"
  bronce: "#f0b47e"
  sube: "#1e7b4a"
  baja: "#b4232f"
typography:
  display:
    fontFamily: "Lexend, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(40px, 6.4vw, 80px)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Lexend, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(26px, 3vw, 36px)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  cifra:
    fontFamily: "Lexend, Avenir Next, Segoe UI, sans-serif"
    fontSize: "clamp(28px, 2.8vw, 40px)"
    fontWeight: 700
    lineHeight: 1.1
    fontFeature: "tnum"
  title:
    fontFamily: "Lexend, Avenir Next, Segoe UI, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.3
  body:
    fontFamily: "Lexend, Avenir Next, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Lexend, Avenir Next, Segoe UI, sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  chico: "8px"
  fecha: "12px"
  panel: "18px"
  casillas: "20px"
  ovalo: "999px"
spacing:
  gap-chico: "8px"
  gap: "20px"
  panel: "24px"
  banda: "clamp(40px, 5vw, 64px)"
  margen: "clamp(16px, 4vw, 48px)"
components:
  boton-sol:
    backgroundColor: "{colors.sol}"
    textColor: "{colors.marino}"
    rounded: "{rounded.ovalo}"
    padding: "12px 20px"
    height: "44px"
  boton-marino:
    backgroundColor: "{colors.marino}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.ovalo}"
    padding: "12px 20px"
    height: "44px"
  boton-enlace:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.azul-educa}"
    rounded: "{rounded.ovalo}"
    padding: "8px 16px"
    height: "40px"
  boton-sobre-foto:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    textColor: "{colors.blanco}"
    rounded: "{rounded.ovalo}"
    height: "44px"
  chip-tipo-publica:
    backgroundColor: "{colors.azul-educa}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.ovalo}"
    padding: "5px 14px"
  chip-tipo-privada:
    backgroundColor: "{colors.verde-campus}"
    textColor: "{colors.blanco}"
    rounded: "{rounded.ovalo}"
    padding: "5px 14px"
  chip-ranking-oro:
    backgroundColor: "{colors.oro}"
    textColor: "#2a2100"
    rounded: "{rounded.ovalo}"
    padding: "6px 16px 6px 8px"
  chip-ranking-plata:
    backgroundColor: "{colors.plata}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.ovalo}"
    padding: "6px 16px 6px 8px"
  chip-ranking-bronce:
    backgroundColor: "{colors.bronce}"
    textColor: "#3a1d05"
    rounded: "{rounded.ovalo}"
    padding: "6px 16px 6px 8px"
  panel:
    backgroundColor: "{colors.niebla}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.panel}"
    padding: "{spacing.panel}"
  bloque-sol:
    backgroundColor: "{colors.sol}"
    textColor: "{colors.marino}"
    rounded: "{rounded.panel}"
    padding: "24px 28px"
  campo:
    backgroundColor: "{colors.blanco}"
    textColor: "{colors.tinta-noche}"
    rounded: "{rounded.chico}"
    padding: "9px 12px"
    height: "42px"
---

# Design System: College Finder · Educa College Prep

## Overview

**Creative North Star: "La carta de admisión"**

Cada universidad se presenta como el lugar al que el estudiante quiere llegar: la foto del campus a todo el ancho, el nombre en grande y en blanco, y la marca Educa (azul marino y amarillo sol) acompañando. Es aspiracional, pero no promete nada: debajo de la foto vienen los números oficiales, grandes y claros, con su fuente. El sueño arriba, los datos honestos abajo.

La página se organiza en **bandas** a todo el ancho que alternan gris niebla y blanco, con el contenido centrado (máximo 1280px). Hay una sola banda de marca, en degradado marino a violeta, reservada para la experiencia Educa (campus tour y testimonios), y un solo bloque amarillo por página para la acción principal. Los controles son ovalados y generosos, fáciles de tocar en el celular, que es donde entra la mayoría.

Este es el sistema oficial y lo usan las tres vistas: la portada, la ficha de universidad y Mi lista. Las variables CSS conservan los nombres del sistema anterior ("Hoja de respuestas": `--tinta`, `--grafito`, `--papel`, `--resaltador`), pero sus valores ya son los de este; los colores viejos (`#1b5fa8`, `#26292b`, `#f2f5f9`, `#ffe14d`) no se usan más.

**Key Characteristics:**
- Foto del campus como protagonista, con un degradado neutro solo en la franja inferior donde va el texto.
- Bandas a todo el ancho, gris niebla y blanco alternados; una banda de marca y un bloque amarillo como máximo por página.
- Cifras grandes y tabulares (tasa de admisión, SAT, costos), cada una con su fuente.
- Todo ovalado y táctil: botones, chips, ranking, barra flotante.
- Una sola familia tipográfica, Lexend, del peso 400 al 800.

## Colors

Azul marino y azul Educa como estructura, amarillo sol como única chispa de acción, y neutros fríos con un toque de azul.

### Primary
- **Marino Educa** (#1c2c6e): fondo del hero mientras carga la foto, banda de marca, botón marino, bloque de fecha y texto sobre el amarillo.
- **Azul Educa** (#2a3f8f): enlaces, migas de pan, subrayado de la pestaña activa, borde de las casillas del resumen, chip "Pública", foco sobre fondos claros.
- **Azul Educa suave** (#e8ecf8): rellenos de lo seleccionado y el hover del botón guardado.

### Secondary
- **Sol** (#ffd23f): la acción principal ("▶ Ver campus tour"), el bloque de la calculadora, el foco sobre fondos oscuros, el mes en el bloque de fecha y el anillo decorativo de la banda de marca (al 8%).
- **Violeta atardecer** (#4a3a86): solo como final del degradado de la banda de marca (marino → #2b2a78 → violeta, a 135°).

### Tertiary
- **Verde campus** (#2e7b6b): chip "Privada sin fines de lucro". El tipo de universidad siempre se distingue por color: azul pública, verde privada.
- **Oro / Plata / Bronce** (#ffd23f / #e3e8f2 / #f0b47e): chip de ranking según el puesto (1–10, 11–25, 26–50). Más de 50: chip neutro translúcido.
- **Sube / Baja** (#1e7b4a / #b4232f): crecimiento del salario de una carrera, del 1.er año a los 4 años.

### Neutral
- **Tinta noche** (#1b2a57): texto principal y títulos.
- **Gris pizarra** (#5b6582): texto secundario, subtítulos de banda, pestañas inactivas.
- **Niebla** (#f2f3f8): fondo de página, bandas grises y paneles dentro de bandas blancas.
- **Blanco** (#ffffff): bandas blancas, barra de pestañas, migas de pan, casillas.
- **Línea** (#d9deea): bordes y divisores.

### Named Rules
**The Un Solo Sol Rule.** El amarillo sol marca una sola acción principal por pantalla (el campus tour en el hero, la calculadora en Costos). Nunca dos amarillos compitiendo en la misma vista: por eso "En Mi lista" guardado va en blanco con texto marino, no en amarillo.

**The Color Con Significado Rule.** Azul = pública, verde = privada, oro/plata/bronce = ranking. El color nunca es la única señal: el texto ("Pública", "#16") siempre está visible.

## Typography

**Display Font:** Lexend (con Avenir Next, Segoe UI, sans-serif)
**Body Font:** Lexend

**Character:** Una sola familia, redonda y muy legible (Lexend está pensada para la lectura fácil). La jerarquía sale del peso y del tamaño, no de mezclar fuentes: 800 para nombres y títulos, 700 para cifras, 600 para etiquetas, 400 para texto corrido.

### Hierarchy
- **Display** (800, clamp(40px, 6.4vw, 80px), 0.95, -0.035em): el nombre de la universidad en el hero, en blanco con sombra suave.
- **Headline** (800, clamp(26px, 3vw, 36px), 1.15, -0.02em): título de cada banda ("Admisión", "Costos y financiamiento").
- **Cifra** (700, clamp(28px, 2.8vw, 40px), cifras tabulares): los números del resumen (5.4%, 1546, $74,650).
- **Title** (700, 17px): títulos de panel.
- **Body** (400, 16px, 1.55): texto de la ficha; párrafos de hasta ~62 caracteres de ancho.
- **Label** (600, 13px): etiquetas de casillas, ayudas y fuentes (12px).

### Named Rules
**The Cifras Tabulares Rule.** Todo número que se compare (porcentajes, puntajes, montos) usa cifras tabulares, para que las columnas queden alineadas.

## Layout

- **Bandas a todo el ancho** con el contenido en un contenedor de máximo 1280px y margen lateral clamp(16px, 4vw, 48px) (respetando el área segura del celular). Padding vertical de banda: clamp(40px, 5vw, 64px).
- **Orden de la ficha:** migas de pan → hero (mínimo 520px; 440px en celular) → barra de pestañas pegada (56px) → bandas Resumen, Experiencia Educa, Admisión, Costos, Contacto → Similares.
- **Resumen en cinco casillas** en una fila con subgrid (títulos, cifras y etiquetas alineados entre casillas); de dos en dos bajo 860px, con el costo total a lo ancho.
- **Paneles** lado a lado con `auto-fit` y mínimo de 420px; separación de 20px.
- **Celular (≤520px):** letras más chicas, la barra flotante de Guardar/Comparar baja al pie en una sola línea, los videos pasan a carrusel horizontal con puntos.
- Puntos de quiebre usados: 1180, 960, 860, 760, 640, 600, 520 y 480px.

## Elevation & Depth

Plano por defecto: la profundidad viene del cambio de fondo entre bandas (niebla / blanco) y de los bordes de 1px. Las sombras se reservan para lo que flota sobre la página o se quiere destacar.

### Shadow Vocabulary
- **Casillas del resumen** (`box-shadow: 0 18px 40px -26px rgba(28, 44, 110, 0.6)`): sombra larga y difusa en azul, que levanta el recuadro de lo esencial.
- **Flotante** (`box-shadow: 0 6px 20px rgba(17, 29, 63, 0.18)`): barra flotante de Guardar/Comparar.
- **Chip sobre foto** (`box-shadow: 0 6px 18px -8px rgba(0, 0, 0, 0.5)`): chip de ranking, para despegarlo de la foto.
- **Texto sobre foto** (`text-shadow: 0 2px 24px rgba(0, 0, 0, 0.35)`): nombre en el hero.

### Named Rules
**The Plano Por Defecto Rule.** Paneles, bandas y tarjetas no llevan sombra. Si algo necesita destacarse, primero se prueba con fondo o borde.

## Shapes

Curvas generosas y amables. Todo lo que se toca es ovalado (999px): botones, chips, ranking, barra flotante. Los contenedores tienen esquinas suaves: paneles y bloque amarillo 18px, recuadro de casillas 20px, bloque de fecha 12px, campos de formulario 8px. Los puntos de la lista de salarios y las marcas de nivel son círculos perfectos.

## Components

### Buttons
Seguros y cercanos: ovalados, con peso tipográfico alto y altura táctil (44px).
- **Shape:** ovalado (999px).
- **Sol (principal):** fondo sol, texto marino, peso 800. Una sola acción por pantalla.
- **Marino:** fondo marino, texto blanco, peso 800.
- **Enlace:** fondo blanco, texto azul Educa, borde línea de 1px, 40px de alto; al pasar el mouse el borde pasa a azul Educa.
- **Sobre foto (Guardar / Comparar en el hero):** blanco translúcido al 8% con borde blanco al 55%; al pasar el mouse sube a 24% y el borde se vuelve blanco sólido. Guardado: fondo blanco con texto marino.
- **Hover / Focus:** brillo +6% en los rellenos; foco con contorno de 2px azul Educa sobre claro y sol sobre oscuro.

### Chips
- **Tipo de universidad:** relleno sólido (azul pública, verde privada) con texto blanco; "Grado Bachiller" en blanco con texto tinta noche.
- **Ranking:** relleno del color del nivel, ícono de trofeo en círculo al 12% de negro, el puesto en 17px/800 y la fuente ("U.S. News 2027") al final en 12.5px. En celular la fuente baja a una segunda línea.
- **Etiquetas de nivel** (Élite, Top 1%): texto con un punto de color delante, sin relleno.

### Cards / Containers
- **Casillas del resumen:** cinco celdas blancas separadas por rayas de 1.5px, dentro de un borde azul Educa de 1.5px, radio 20px y la sombra azul larga.
- **Panel:** fondo niebla dentro de banda blanca (o blanco dentro de banda gris), borde línea, radio 18px, padding 24px.
- **Bloque sol:** fondo sol, texto marino, radio 18px, padding 24px 28px; cierra la sección de costos con la calculadora.

### Inputs / Fields
- **Style:** fondo blanco, borde de 1.5px línea, radio 8px, alto mínimo 42px.
- **Focus:** borde azul y halo de 3px en azul suave.
- **Buscador de carreras:** lupa a la izquierda, botón "×" propio a la derecha cuando hay texto, estado "N carreras encontradas" debajo.

### Navigation
- **Migas de pan:** franja blanca, "← Resultados" en azul Educa 700, el nombre actual en tinta noche, cortado con puntos suspensivos.
- **Pestañas:** barra blanca pegada bajo la barra de Educa; pestañas en gris pizarra 600, la activa en tinta noche con un subrayado azul Educa de 4px con esquinas superiores redondeadas. Al bajar aparece el nombre corto de la universidad, que lleva de vuelta arriba.

### Hero de universidad
La foto a todo el ancho (centrada, `object-fit: cover`) con dos degradados en un azul casi negro neutro `rgb(10, 13, 28)`: de abajo hacia arriba (88% → 0% al 75% de la altura) y uno suave desde la izquierda (35% → 0% al 55%). La mitad de arriba de la foto queda sin filtro. Sin foto libre: portada azul rayada como un formulario con las iniciales enormes al 12%. El crédito de la foto va abajo a la derecha, en 12px (el mínimo de las fuentes).

### Banda de marca (Experiencia Educa)
Degradado marino → violeta a 135°, con un anillo amarillo al 8% que asoma por la esquina superior derecha. Etiquetas "CAMPUS TOUR" / "TESTIMONIO" en chips sol. El tour ocupa dos tercios de ancho y dos filas; los testimonios van al lado y debajo, de a tres.

### Banda de cierre (siguiente paso con Educa)
Marino liso (`#1c2c6e`), sin degradado: el degradado es solo de la banda de videos. Va en todas las fichas, entre Contacto y Similares. El título cambia según tu probabilidad (baja: curso SAT y consejería; media: la postulación; alta: lista equilibrada; sin puntaje o sin datos SAT: mensajes que no hablan de tu probabilidad). Un solo botón sol, "Habla con un consejero de Educa", a la página de contacto de Educa; en celular, a todo el ancho. Nunca promete una admisión ni un puntaje.

### Mi lista (comparador)
Las mismas piezas que la ficha: migas de pan "← Resultados / Mi lista", una banda blanca con el título, el buscador "Agrega una universidad" y tres casillas de resumen (tus posibilidades contadas por nivel, el rango del costo anual y el del salario a 4 años), una banda gris con la tabla en un panel blanco y la banda de cierre marino al final (el único amarillo de la vista).
- **Columnas:** foto miniatura 16:9 con radio 12px (o la portada rayada con iniciales), el botón "×" para quitar en su esquina (32px a la vista, 44px al tacto), el nombre en 17px/700 (abre la ficha), el lugar y los chips de ranking y tipo.
- **Filas:** "Lo esencial" primero y en cifras de 19px/700 (posibilidades, tasa de admisión, costo anual total, salario); el resto en 15px. Bordes sólidos de 1px en línea, sin rayas punteadas.
- **La mejor de la fila:** fondo azul Educa suave (`#e8ecf8`), cifra en marino y una insignia marino "✓ Mejor" (el texto oculto agrega "de tu lista"). Nunca en amarillo. En costos, un college de 2 años no compite con universidades de 4.
- **Perfil de costos:** control ovalado de dos opciones (la elegida en marino) y, si vive en EE. UU., el estado. Cambia la matrícula (del estado o de fuera del estado) y muestra el precio neto solo a quien puede recibirlo.
- **Al bajar:** una franja blanca con los nombres queda pegada bajo la barra de Educa y se corre de lado junto con la tabla; los títulos de grupo quedan pegados a la izquierda.
- **Avisos:** píldora marino arriba, debajo de la barra de Educa ("Quitaste Yale de tu lista." + "Deshacer" en blanco), 8 segundos.
- **Imprimir:** solo el título, el resumen y la tabla, en horizontal.

### Lista de salarios "punto a punto"
Filas numeradas (el puesto 1 en dorado oscuro #8a6100, que pasa AA sobre blanco), con el nombre de la carrera, el crecimiento en verde o rojo, los graduados por año y los montos a 1 año (gris) y 4 años (negrita). Debajo, una línea con un punto hueco (1.er año) y uno lleno (4 años) unidos por un tramo azul suave, y una marca vertical con la mediana de la universidad. Escala común para todas las filas.

## Do's and Don'ts

### Do:
- **Do** usar el amarillo sol (#ffd23f) para una sola acción principal por pantalla.
- **Do** citar la fuente debajo de cada dato (College Scorecard, IPEDS, U.S. News, Wikipedia) en 12px gris pizarra.
- **Do** mostrar "Sin dato" o "—" cuando falta un dato, nunca un valor inventado ni un cero.
- **Do** usar cifras tabulares en todo número comparable.
- **Do** mantener los botones y chips ovalados (999px) y con al menos 40–44px de alto.
- **Do** alternar bandas niebla y blanco; dentro de una banda blanca, los paneles van en niebla.
- **Do** distinguir pública (azul Educa) y privada (verde campus) siempre con color y con texto.

### Don't:
- **Don't** teñir la foto del hero con un degradado de color (morado u otro): la sombra es un azul casi negro y solo en la franja inferior.
- **Don't** poner dos elementos amarillos en la misma vista (por ejemplo, "En Mi lista" en amarillo junto a "Ver campus tour").
- **Don't** usar el amarillo del ranking (oro) fuera del chip de ranking de los puestos 1–10.
- **Don't** pintar con degradado las casillas del resumen: las cinco van en blanco.
- **Don't** usar botones rectangulares: todo lo que se toca es ovalado.
- **Don't** sumar sombras a paneles o tarjetas comunes.
- **Don't** usar los colores del sistema anterior (azul tinta #1b5fa8, grafito #26292b, resaltador #ffe14d) en pantallas nuevas.
