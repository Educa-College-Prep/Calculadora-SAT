export const formatDinero = (valor: number | null | undefined): string | null =>
  valor ? `$${valor.toLocaleString()}` : null;

export const formatPorcentaje = (valor: number | null | undefined): string | null =>
  valor ? `${(valor * 100).toFixed(1)}%` : null;

/**
 * Para campos que vienen como CONTEO CRUDO en vez de fracción (ej. GT_THRESHOLD_1YR/5YR),
 * calcula el porcentaje real dividiendo el numerador (personas que cumplen la condición)
 * entre el denominador (tamaño total del cohorte).
 *
 * Devuelve null si falta cualquiera de los dos valores o si el cohorte es 0
 * (para evitar división entre cero o "Infinity%").
 */
/**
 * Igual que formatPorcentajeDesdeConteo, pero devuelve el número crudo (0-100)
 * en vez de un string formateado. Útil para pasarle datos a un gráfico.
 */
export const calcularPorcentajeDesdeConteo = (
  numerador: number | null | undefined,
  denominador: number | null | undefined
): number | null => {
  if (numerador == null || denominador == null || denominador === 0) return null;
  return (numerador / denominador) * 100;
};

export const formatPorcentajeDesdeConteo = (
  numerador: number | null | undefined,
  denominador: number | null | undefined
): string | null => {
  const pct = calcularPorcentajeDesdeConteo(numerador, denominador);
  return pct == null ? null : `${pct.toFixed(1)}%`;
};