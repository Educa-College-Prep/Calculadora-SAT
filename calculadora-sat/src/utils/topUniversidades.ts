import type { Universidad } from '../types';
import { clasificar } from './nivelSAT';

/** Por ranking U.S. News (nacionales y luego liberal arts) y, sin ranking, por SAT promedio más alto. */
function porPrestigio(a: Universidad, b: Universidad): number {
  if (a.USNEWS_ORDEN != null || b.USNEWS_ORDEN != null) {
    if (a.USNEWS_ORDEN == null) return 1;
    if (b.USNEWS_ORDEN == null) return -1;
    return a.USNEWS_ORDEN - b.USNEWS_ORDEN;
  }
  return (b.SAT_AVG ?? 0) - (a.SAT_AVG ?? 0);
}

/** Las que entran al top: rankeadas o, si no, de 4 años con SAT promedio publicado. */
const candidata = (u: Universidad) => u.USNEWS_ORDEN != null || (u.SAT_AVG != null && u.ICLEVEL === '4-Year');

/** Cuántos lugares del top se guardan para las de probabilidad baja (las aspiracionales). */
const LUGARES_BAJA = 2;

/**
 * Las mejores universidades entre tus resultados, ordenadas por prestigio (ver porPrestigio).
 *
 * Con puntaje SAT son "las mejores a tu alcance": primero las de probabilidad alta o media y,
 * al final, hasta dos de probabilidad baja, para que no falten las que se sueñan. Las que no
 * publican SAT no entran: no se puede decir si están a tu alcance.
 */
export function elegirTop(universidades: Universidad[], cantidad: number, sat = 0): Universidad[] {
  const candidatas = universidades.filter(candidata).sort(porPrestigio);
  if (sat <= 0) return candidatas.slice(0, cantidad);

  const alcance: Universidad[] = [];
  const bajas: Universidad[] = [];
  for (const u of candidatas) {
    const nivel = clasificar(u, sat);
    if (nivel === 'Probabilidad alta' || nivel === 'Probabilidad media') alcance.push(u);
    else if (nivel === 'Probabilidad baja') bajas.push(u);
  }
  // Dos lugares para las de probabilidad baja; más si no hay suficientes a tu alcance.
  const nBajas = Math.min(bajas.length, Math.max(LUGARES_BAJA, cantidad - alcance.length));
  const nAlcance = Math.min(alcance.length, cantidad - nBajas);
  return [...alcance.slice(0, nAlcance), ...bajas.slice(0, nBajas)];
}
