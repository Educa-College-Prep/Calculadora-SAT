/**
 * Tipos de universidad que se pueden marcar en los filtros. Ninguno marcado = se muestran todas.
 * Las privadas son siempre sin fines de lucro: las con fines de lucro no están en la base
 * (las descarta scripts/actualizar_datos.py).
 */
export type TipoControl = 'publica' | 'privada';

/** Tipo de una universidad según CONTROL, o null si no lo informa. */
export function tipoControl(control: string | null | undefined): TipoControl | null {
  if (control === 'Pública') return 'publica';
  if (control === 'Privada sin fines de lucro') return 'privada';
  return null;
}
