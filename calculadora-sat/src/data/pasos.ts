/**
 * Las carreras que más universidades publican, como botones de entrada. Computación junta dos
 * códigos CIP (Computación e informática y Ciencias de la computación): para el estudiante es lo mismo.
 */
export const CARRERAS_COMUNES: { nombre: string; cips: string[] }[] = [
  { nombre: 'Administración de empresas', cips: ['5202'] },
  { nombre: 'Psicología', cips: ['4201'] },
  { nombre: 'Biología', cips: ['2601'] },
  { nombre: 'Enfermería', cips: ['5138'] },
  { nombre: 'Contabilidad', cips: ['5203'] },
  { nombre: 'Computación', cips: ['1101', '1107'] },
];

/** Opciones de presupuesto del paso 3 (costo al año: matrícula de fuera del estado + costo de vida). */
export const PRESUPUESTOS = [20000, 40000, 60000, 80000];

/** Lo que pregunta cada paso, en corto: para la barra de progreso y para "Cambiar" en los resultados. */
export const TITULOS_PASOS = ['¿Qué quieres estudiar?', '¿Dónde?', 'Presupuesto', 'Tu SAT'];
