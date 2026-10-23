import type { Universidad } from '../types';

/**
 * Enlace a la calculadora de costo neto de la universidad (NPCURL). Es la única calculadora que
 * mostramos: la ley de EE.UU. obliga a cada universidad a publicarla, así que trae sus datos.
 * NPCURL a veces viene sin protocolo ("www.uni.edu/..."); se antepone https:// y se descarta lo
 * inválido.
 */
export function urlCalculadora(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try { return new URL(url).href; } catch { return null; }
}

/** "https://www.uni.edu/aid/" → "uni.edu/aid", para comparar dos enlaces sin importar cómo se escribieron. */
const normalizar = (url: string) =>
  url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');

/** Direcciones que delatan una calculadora de costo ("net-price-calculator.php", "npc.collegeboard.org"…). */
const PATRON_CALCULADORA = /npc\.collegeboard|\/npc\b|net-?price|calculator|estimate-your-cost|cost-estimator/i;

/**
 * ¿El enlace es una calculadora de costo? En ~100 universidades IPEDS da como "ayuda financiera"
 * (FAIDURL) la misma calculadora que NPCURL, o una parecida. Mostrarla dos veces, con nombres
 * distintos, confunde a quien está explorando.
 */
function esCalculadora(url: string, npcurl: string | null | undefined): boolean {
  return (!!npcurl && normalizar(url) === normalizar(npcurl)) || PATRON_CALCULADORA.test(url);
}

/**
 * Página de ayuda financiera de la universidad (becas, requisitos, cómo postular), o null si no
 * hay o si el enlace es en realidad una calculadora: en ese caso basta con "Calcula cuánto te
 * costaría".
 */
export function urlAyudaFinanciera(uni: Universidad): string | null {
  return uni.FAIDURL && !esCalculadora(uni.FAIDURL, uni.NPCURL) ? uni.FAIDURL : null;
}

/** Aviso para la calculadora: el público de esta web es internacional y para ellos es solo una guía. */
export const NOTA_CALCULADORA =
  'La calculadora está pensada para familias de EE.UU.; para estudiantes internacionales el resultado es solo una referencia.';
