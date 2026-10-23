import type { Universidad } from '../types';

/**
 * Tus posibilidades de entrar: Alta probabilidad / Intermedia / Baja. Es la clasificación de
 * consejería (safety / target / reach), comparando tu puntaje SAT con el rango de los
 * admitidos (percentiles 25 y 75). La usan la lista, los filtros y la ficha, para que
 * todos digan lo mismo. Se habla de probabilidad y no de "segura": ninguna admisión está
 * garantizada solo por el puntaje, y "objetivo" o "alcance" confunden.
 */
export type Nivel = 'Alta probabilidad' | 'Intermedia' | 'Baja';

export const NIVELES: { nivel: Nivel; clase: string; barras: number; explicacion: string }[] = [
  { nivel: 'Alta probabilidad', clase: 'alta', barras: 3, explicacion: 'Tienes muy buenas posibilidades de entrar.' },
  { nivel: 'Intermedia', clase: 'intermedia', barras: 2, explicacion: 'Tienes posibilidades reales de entrar.' },
  { nivel: 'Baja', clase: 'baja', barras: 1, explicacion: 'Puedes intentarlo, pero entrar es más difícil.' },
];

/** Para el texto de ayuda: qué significa cada nivel y de dónde sale. */
export const AYUDA_NIVELES = NIVELES.map(n => `${n.nivel}: ${n.explicacion.charAt(0).toLowerCase()}${n.explicacion.slice(1)}`).join(' ')
  + ' Se calcula comparando tu puntaje SAT con el de sus alumnos admitidos.';

/** Rango SAT total (percentil 25 y 75) sumando Math + Lectura. */
export function rangoSAT(u: Universidad): [number, number] | null {
  if (u.SATVR25 == null || u.SATMT25 == null || u.SATVR75 == null || u.SATMT75 == null) return null;
  return [u.SATVR25 + u.SATMT25, u.SATVR75 + u.SATMT75];
}

export function clasificar(u: Universidad, sat: number): Nivel | null {
  const r = rangoSAT(u);
  if (!r) return null;
  if (sat >= r[1]) return 'Alta probabilidad';
  if (sat >= r[0]) return 'Intermedia';
  return 'Baja';
}

/** Más de esto por debajo del percentil 25 ya no es probabilidad "baja": es prácticamente inalcanzable. */
const MARGEN_ALCANCE = 100;
/** Sin rango, solo con el promedio: el percentil 25 suele estar ~80 puntos bajo el promedio. */
const MARGEN_PROMEDIO = 80 + MARGEN_ALCANCE;

/**
 * ¿Entra en la lista con este puntaje? true = alta probabilidad, intermedia o baja; false = muy por
 * encima de tu puntaje; null = la universidad no publica datos SAT y no se puede saber.
 */
export function alcanzable(u: Universidad, sat: number): boolean | null {
  const r = rangoSAT(u);
  if (r) return sat >= r[0] - MARGEN_ALCANCE;
  if (u.SAT_AVG != null) return sat >= u.SAT_AVG - MARGEN_PROMEDIO;
  return null;
}
