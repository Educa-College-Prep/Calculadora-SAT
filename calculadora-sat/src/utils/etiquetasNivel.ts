import type { Universidad } from '../types';

/**
 * Etiquetas de las cajas "Tasa de admisión" y "Puntaje SAT promedio" de la ficha: hasta 3
 * niveles cada una. Por debajo del primer nivel no hay etiqueta (la caja muestra solo el
 * número): así la etiqueta destaca a las pocas que lo merecen en vez de clasificar a todas.
 * Especificación: prompts/etiquetas-selectividad-sat.md.
 */
export interface EtiquetaNivel {
  clave: string;
  nombre: string;
  /** 1 a 3: cuanto más alto, más intenso el color del punto. */
  nivel: 1 | 2 | 3;
  /** Texto del tooltip: qué significa la etiqueta. */
  explicacion: string;
}

/** Cortes de selectividad (tasa de admisión, en fracción como viene en los datos). Por confirmar con el equipo. */
const SELECTIVIDAD: (EtiquetaNivel & { max: number })[] = [
  { clave: 'elite', nombre: 'Élite', nivel: 3, max: 0.10, explicacion: 'Admite a menos del 10% de quienes postulan.' },
  { clave: 'muy_selectiva', nombre: 'Muy selectiva', nivel: 2, max: 0.25, explicacion: 'Admite entre el 10% y el 25% de quienes postulan.' },
  { clave: 'selectiva', nombre: 'Selectiva', nivel: 1, max: 0.50, explicacion: 'Admite entre el 25% y el 50% de quienes postulan.' },
];

/**
 * Cortes del SAT promedio de los admitidos. "Top X%" es el percentil NACIONAL del SAT (entre
 * todos los que dan el examen), no un ranking de universidades.
 */
const SAT_TOP: (EtiquetaNivel & { min: number })[] = [
  { clave: 'top1', nombre: 'Top 1%', nivel: 3, min: 1510, explicacion: 'El SAT promedio de sus admitidos está en el 1% más alto del país.' },
  { clave: 'top5', nombre: 'Top 5%', nivel: 2, min: 1450, explicacion: 'El SAT promedio de sus admitidos está en el 5% más alto del país.' },
  { clave: 'top10', nombre: 'Top 10%', nivel: 1, min: 1350, explicacion: 'El SAT promedio de sus admitidos está en el 10% más alto del país.' },
];

/** El límite de cada nivel entra al siguiente: 10% exacto ya es "Muy selectiva", no "Élite". */
export function etiquetaSelectividad(tasa: number | null | undefined): EtiquetaNivel | null {
  if (tasa == null || Number.isNaN(tasa)) return null;
  return SELECTIVIDAD.find(e => tasa < e.max) ?? null;
}

/** Sin etiqueta si la universidad no considera el SAT (test-blind), aunque publique un promedio. */
export function etiquetaSAT(sat: number | null | undefined, politica: Universidad['ADMCON7']): EtiquetaNivel | null {
  if (politica === 'Ni requerido ni recomendado' || sat == null || Number.isNaN(sat)) return null;
  return SAT_TOP.find(e => sat >= e.min) ?? null;
}
