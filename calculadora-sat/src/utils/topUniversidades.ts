import type { Universidad } from '../types';
import { clasificar } from './nivelSAT';
import type { Nivel } from './nivelSAT';

/**
 * Por "prestigio": ranking U.S. News (nacionales y luego liberal arts) y, sin ranking, salario de
 * egresados a 4 años y SAT promedio más alto.
 */
function porPrestigio(a: Universidad, b: Universidad): number {
  if (a.USNEWS_ORDEN != null || b.USNEWS_ORDEN != null) {
    if (a.USNEWS_ORDEN == null) return 1;
    if (b.USNEWS_ORDEN == null) return -1;
    return a.USNEWS_ORDEN - b.USNEWS_ORDEN;
  }
  return (b.MD_EARN_WNE_4YR ?? 0) - (a.MD_EARN_WNE_4YR ?? 0) || (b.SAT_AVG ?? 0) - (a.SAT_AVG ?? 0);
}

/**
 * Las que entran al top: rankeadas o, si no, de 4 años con SAT promedio publicado y con
 * residencia en el campus (publican su costo de alojamiento): un alumno internacional necesita
 * dónde vivir, y así quedan fuera las que son solo online.
 */
const candidata = (u: Universidad) =>
  u.USNEWS_ORDEN != null || (u.SAT_AVG != null && u.ICLEVEL === '4-Year' && u.ROOMBOARD_ON != null);

/** Las mejores entre tus resultados, sin puntaje SAT (ver porPrestigio). */
export function elegirTop(universidades: Universidad[], cantidad: number): Universidad[] {
  return universidades.filter(candidata).sort(porPrestigio).slice(0, cantidad);
}

/** Cuántas de cada nivel lleva la lista equilibrada: más donde tienes más probabilidad. */
const POR_NIVEL: Record<Nivel, number> = { 'Probabilidad alta': 3, 'Probabilidad media': 3, 'Probabilidad baja': 2 };

/**
 * Con puntaje SAT, "tu lista equilibrada": como la arma un consejero, unas donde tienes
 * probabilidad alta, otras media y un par de baja (las que se sueñan), las mejores de cada
 * grupo. Las que no publican SAT no entran: no se puede decir a qué grupo van.
 */
export function elegirListaEquilibrada(universidades: Universidad[], sat: number): { nivel: Nivel; universidades: Universidad[] }[] {
  const ordenadas = universidades.filter(candidata).sort(porPrestigio);
  return (Object.keys(POR_NIVEL) as Nivel[])
    .map(nivel => ({ nivel, universidades: ordenadas.filter(u => clasificar(u, sat) === nivel).slice(0, POR_NIVEL[nivel]) }))
    .filter(g => g.universidades.length > 0);
}
