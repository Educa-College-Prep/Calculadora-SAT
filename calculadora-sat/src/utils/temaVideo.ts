/**
 * Tema de cada video de Educa, para agruparlos en la lista de "Experiencia Educa". Los datos solo
 * distinguen campus tour de testimonio; el tema se deduce del título, que en el canal sigue
 * patrones bastante fijos ("Cómo ingresé a…", "¿Cómo es estudiar en…?", "¿Cómo estudiar
 * Finanzas…?"). Un título puede encajar en dos temas: gana el primero de la lista, en este orden
 * (lo más específico antes). Lo que no encaja en ninguno va a "Más videos": es preferible a
 * adivinar.
 */
export type TemaVideo = 'tour' | 'carrera' | 'admision' | 'vida' | 'otros';

/** Nombre de cada grupo en la lista, en el orden en que se muestran. */
export const TEMAS: { tema: TemaVideo; nombre: string; etiqueta: string }[] = [
  { tema: 'tour', nombre: 'Campus tour', etiqueta: 'Campus tour' },
  { tema: 'admision', nombre: 'Cómo entraron', etiqueta: 'Cómo entró' },
  { tema: 'vida', nombre: 'Cómo es estudiar ahí', etiqueta: 'Vida en el campus' },
  { tema: 'carrera', nombre: 'Por carrera', etiqueta: 'Carrera' },
  { tema: 'otros', nombre: 'Más videos', etiqueta: 'Video' },
];

// Carrera: "¿Cómo estudiar Finanzas…?", "Estudiar Business en NYU" (no "Estudiar en…"), o una
// comparación "X vs Y".
const CARRERA = /\bestudiar (?!en\b)\p{L}[\p{L} ]* en\b|c[oó]mo estudiar (?!en\b)\p{L}|\bvs\.?\s/iu;
// Admisión: cómo postuló o entró, el camino desde su país, becas, transferencias, el SAT y el
// año sabático antes de postular.
const ADMISION = /ingres|admitid|admisi[oó]n|road to|postula|aplicar|\bcamino\b|logr[eéó]|early decision|transfer|beca|\bSAT\b|sab[aá]tico|gap year/iu;
// "De Lima a UC Davis", "De Trujillo, Perú a UChicago": sin la bandera i, para que las
// mayúsculas sí cuenten (si no, "de universidades a…" también encajaría).
const DE_PAIS_A = /\b[Dd]e \p{Lu}\p{L}+(?:,? \p{Lu}\p{L}+)? a\b/u;
// Vida: cómo es estudiar ahí, el año que cursa, la vida en el campus.
const VIDA = /c[oó]mo es estudiar|estudiar en|\d\s*(?:er|do|ro|to|º|°)?\s*año|student life|\bvida\b|30 ?preguntas|estudia(?:ndo)? en/iu;

function temaDeTexto(texto: string): TemaVideo | null {
  if (CARRERA.test(texto)) return 'carrera';
  if (ADMISION.test(texto) || DE_PAIS_A.test(texto)) return 'admision';
  if (VIDA.test(texto)) return 'vida';
  return null;
}

/**
 * Primero se mira la primera frase del título (antes del "|"), que es la que dice de qué trata;
 * el resto suele ser gancho ("De Perú a EEUU", "Admission Counseling"). Si la primera frase no
 * encaja en ningún tema, se mira el título entero.
 */
export function temaDeVideo(titulo: string, esTour: boolean): TemaVideo {
  if (esTour) return 'tour';
  return temaDeTexto(titulo.split('|')[0]) ?? temaDeTexto(titulo) ?? 'otros';
}

/**
 * Los títulos de YouTube juntan varias frases con "|". En la ficha, la primera es el título y
 * el resto va debajo, más chico: así se leen de un vistazo en la lista.
 */
export function partirTitulo(titulo: string): { titulo: string; detalle: string } {
  const partes = titulo.split('|').map(p => p.trim()).filter(Boolean);
  return { titulo: partes[0] ?? titulo, detalle: partes.slice(1).join(' · ') };
}
