import { useCallback, useState } from 'react';
import type { Universidad } from '../types';
import { calcularCostoVida } from './costos';

/**
 * Cómo postularía el estudiante: cambia qué matrícula le corresponde y si puede recibir
 * ayuda del gobierno de EE. UU. Es un primer paso hacia un perfil completo: por ahora solo
 * distingue internacional de quien vive en EE. UU. (y en qué estado).
 * - Internacional: paga la matrícula de fuera del estado en las públicas y no recibe ayuda
 *   federal (el "precio neto" de College Scorecard no le aplica).
 * - Vive en EE. UU.: en las públicas de su estado paga la matrícula del estado; el precio neto
 *   oficial existe para las públicas de su estado y para todas las privadas.
 */
export type Perfil =
  | { tipo: 'internacional' }
  | { tipo: 'eeuu'; estado: string | null };

const CLAVE_ALMACEN = 'calculadora-sat:perfil';
/** El público principal de la web: estudiantes de Latinoamérica. */
const PERFIL_INICIAL: Perfil = { tipo: 'internacional' };

function leer(): Perfil {
  try {
    const valor = JSON.parse(localStorage.getItem(CLAVE_ALMACEN) ?? 'null');
    if (valor?.tipo === 'eeuu') return { tipo: 'eeuu', estado: typeof valor.estado === 'string' ? valor.estado : null };
    return PERFIL_INICIAL;
  } catch {
    return PERFIL_INICIAL;
  }
}

/** El perfil se recuerda en el navegador, como Mi lista: así no hay que elegirlo cada vez. */
export function usePerfil(): [Perfil, (p: Perfil) => void] {
  const [perfil, setPerfil] = useState<Perfil>(leer);
  const cambiar = useCallback((p: Perfil) => {
    setPerfil(p);
    try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(p)); } catch { /* sin almacenamiento: dura mientras la página esté abierta */ }
  }, []);
  return [perfil, cambiar];
}

/** De qué tipo es la matrícula que se muestra: para decirlo debajo del monto. */
export type TipoMatricula = 'estado' | 'fuera' | 'unica';

export interface CostosPerfil {
  matricula: number | null;
  tipoMatricula: TipoMatricula;
  costoVida: number | null;
  /** true = el costo de vida es una estimación (la universidad no lo reporta). */
  vidaEstimada: boolean;
  /** Matrícula + costo de vida, antes de becas. Sin uno de los dos, no hay total (como en la ficha). */
  total: number | null;
  /** Precio neto oficial (después de becas, con ayuda federal). Solo para quien vive en EE. UU. */
  neto: number | null;
}

/** ¿La universidad cobra distinto a los del estado y a los de afuera? (las públicas, casi siempre) */
export const cobraSegunEstado = (u: Universidad) =>
  u.TUITIONFEE_IN != null && u.TUITIONFEE_OUT != null && u.TUITIONFEE_IN !== u.TUITIONFEE_OUT;

/**
 * Los costos de un año para este perfil. Con el perfil internacional dan lo mismo que el
 * resumen de la ficha (matrícula de fuera del estado + costo de vida).
 */
export function costosSegunPerfil(u: Universidad, perfil: Perfil): CostosPerfil {
  const vida = calcularCostoVida(u);
  const porEstado = cobraSegunEstado(u);
  const delEstado = perfil.tipo === 'eeuu' && perfil.estado === u.STABBR;

  const matricula = porEstado && delEstado ? u.TUITIONFEE_IN ?? null : u.TUITIONFEE_OUT ?? u.TUITIONFEE_IN ?? null;
  const tipoMatricula: TipoMatricula = !porEstado ? 'unica' : delEstado ? 'estado' : 'fuera';

  // El precio neto de las públicas es solo de los residentes del estado: para otro estado no
  // hay dato oficial y no se inventa uno.
  let neto: number | null = null;
  if (perfil.tipo === 'eeuu') {
    neto = porEstado ? (delEstado ? u.NPT4_PUB ?? null : null) : u.NPT4_PRIV ?? u.NPT4_PUB ?? null;
  }

  return {
    matricula,
    tipoMatricula,
    costoVida: vida?.valor ?? null,
    vidaEstimada: vida?.estimado ?? false,
    total: matricula != null && vida ? matricula + vida.valor : null,
    neto,
  };
}
