/** Tipos de universidad que se pueden marcar en los filtros. Ninguno marcado = se muestran todas. */
export type TipoControl = 'publica' | 'sin-fines' | 'con-fines';

export const PRIVADAS: TipoControl[] = ['sin-fines', 'con-fines'];

/** Tipo de una universidad según CONTROL, o null si no lo informa. */
export function tipoControl(control: string | null | undefined): TipoControl | null {
  if (control === 'Pública') return 'publica';
  if (control === 'Privada sin fines de lucro') return 'sin-fines';
  if (control === 'Privada con fines de lucro') return 'con-fines';
  return null;
}
