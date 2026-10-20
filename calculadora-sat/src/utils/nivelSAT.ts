import type { Universidad } from '../types';

/**
 * Segura / Objetivo / Alcance: la clasificación clásica de consejería, comparando tu
 * puntaje SAT con el rango de los admitidos (percentiles 25 y 75). La usan la lista,
 * los filtros y el asistente, para que todos digan lo mismo.
 */
export type Nivel = 'Segura' | 'Objetivo' | 'Alcance';

export const NIVELES: { nivel: Nivel; barras: number; explicacion: string }[] = [
  { nivel: 'Segura', barras: 3, explicacion: 'Sacaste más que 3 de cada 4 de sus admitidos.' },
  { nivel: 'Objetivo', barras: 2, explicacion: 'Sacaste lo mismo que la mayoría de sus admitidos.' },
  { nivel: 'Alcance', barras: 1, explicacion: 'Sacaste menos que 3 de cada 4 de sus admitidos: es posible, pero difícil.' },
];

/** Rango SAT total (percentil 25 y 75) sumando Math + Lectura. */
export function rangoSAT(u: Universidad): [number, number] | null {
  if (u.SATVR25 == null || u.SATMT25 == null || u.SATVR75 == null || u.SATMT75 == null) return null;
  return [u.SATVR25 + u.SATMT25, u.SATVR75 + u.SATMT75];
}

export function clasificar(u: Universidad, sat: number): Nivel | null {
  const r = rangoSAT(u);
  if (!r) return null;
  if (sat >= r[1]) return 'Segura';
  if (sat >= r[0]) return 'Objetivo';
  return 'Alcance';
}

/** Más de esto por debajo del percentil 25 ya no es "alcance": es prácticamente inalcanzable. */
const MARGEN_ALCANCE = 100;
/** Sin rango, solo con el promedio: el percentil 25 suele estar ~80 puntos bajo el promedio. */
const MARGEN_PROMEDIO = 80 + MARGEN_ALCANCE;

/**
 * ¿Entra en la lista con este puntaje? true = segura, objetivo o alcance; false = muy por
 * encima de tu puntaje; null = la universidad no publica datos SAT y no se puede saber.
 */
export function alcanzable(u: Universidad, sat: number): boolean | null {
  const r = rangoSAT(u);
  if (r) return sat >= r[0] - MARGEN_ALCANCE;
  if (u.SAT_AVG != null) return sat >= u.SAT_AVG - MARGEN_PROMEDIO;
  return null;
}
