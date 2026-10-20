import type { Universidad } from '../types';

/**
 * Las mejores universidades entre tus resultados: primero las del ranking U.S. News
 * (nacionales y luego liberal arts) y, si no alcanzan, las de SAT promedio más alto.
 * Cada fila dice por qué está en la lista.
 */
export function elegirTop(universidades: Universidad[], cantidad: number): Universidad[] {
  const rankeadas = universidades
    .filter(u => u.USNEWS_ORDEN != null)
    .sort((a, b) => a.USNEWS_ORDEN! - b.USNEWS_ORDEN!);
  if (rankeadas.length >= cantidad) return rankeadas.slice(0, cantidad);
  const porSAT = universidades
    .filter(u => u.USNEWS_ORDEN == null && u.SAT_AVG != null && u.ICLEVEL === '4-Year')
    .sort((a, b) => b.SAT_AVG! - a.SAT_AVG!);
  return [...rankeadas, ...porSAT].slice(0, cantidad);
}
