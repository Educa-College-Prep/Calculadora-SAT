export const formatDinero = (valor: number | null | undefined): string | null =>
  valor ? `$${valor.toLocaleString()}` : null;

export const formatPorcentaje = (valor: number | null | undefined): string | null =>
  valor ? `${(valor * 100).toFixed(1)}%` : null;
