import type { Universidad } from '../types';

export interface CostoVidaCalculado {
  valor: number;
  /** true = estimado (Costo total de asistencia − Matrícula In-state), no dato real. */
  estimado: boolean;
}

/**
 * Costo de vida anual (sin matrícula).
 * - Dato real (College Scorecard 2024-25): alojamiento y comida en campus + otros gastos + libros.
 * - Si la universidad no lo reporta (sin residencias, ej. community colleges): se estima como
 *   COSTT4_A − TUITIONFEE_IN. Esa resta mezcla años (COSTT4_A es de 2023-24), así que si da ≤ 0
 *   se descarta.
 */
export function calcularCostoVida(uni: Universidad): CostoVidaCalculado | null {
  if (uni.ROOMBOARD_ON != null) {
    return { valor: uni.ROOMBOARD_ON + (uni.OTHEREXPENSE_ON ?? 0) + (uni.BOOKSUPPLY ?? 0), estimado: false };
  }
  if (uni.COSTT4_A != null && uni.TUITIONFEE_IN != null) {
    const estimado = uni.COSTT4_A - uni.TUITIONFEE_IN;
    if (estimado > 0) return { valor: estimado, estimado: true };
  }
  return null;
}

/**
 * Matrícula única para privadas (cobran lo mismo a todos). Devuelve null si es pública o si
 * una privada excepcionalmente reporta precios distintos (~24 casos): ahí se muestran ambos.
 */
export function calcularMatriculaUnica(uni: Universidad): number | null {
  const esPrivada = uni.CONTROL?.includes('Privada') ?? false;
  if (!esPrivada) return null;
  if (uni.TUITIONFEE_IN == null || uni.TUITIONFEE_OUT == null || uni.TUITIONFEE_IN === uni.TUITIONFEE_OUT) {
    return uni.TUITIONFEE_OUT ?? uni.TUITIONFEE_IN ?? null;
  }
  return null;
}
