import type { Universidad } from '../types';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { buscarUniversidades } from '../utils/busqueda';
import type { IndiceBusqueda } from '../utils/busqueda';
import type { FichaRecomendada, PerfilDetectado } from './tipos';
import { rangoSAT } from '../utils/nivelSAT';

/**
 * "Herramientas" del agente: funciones puras sobre la data cargada.
 * Son las mismas que usaría la IA real a través de tool use.
 */

export const usd = (n: number | null | undefined): string =>
  n == null ? 'sin dato' : `$${Math.max(0, Math.round(n)).toLocaleString('en-US')}`;

export const pct = (fraccion: number | null | undefined): string =>
  fraccion == null ? 'sin dato' : `${Math.round(fraccion * 100)}%`;

export const miles = (n: number): string => n.toLocaleString('en-US');

export const nombreEstado = (st: string): string => NOMBRES_ESTADOS[st] ?? st;

export const esPublica = (u: Universidad) => u.CONTROL === 'Pública';
export const esPrivada = (u: Universidad) => u.CONTROL?.includes('Privada') ?? false;
export const esCuatroAnios = (u: Universidad) => u.ICLEVEL === '4-Year';

// La clasificación por SAT vive en utils/nivelSAT: la misma que usan la lista y los filtros.
export { rangoSAT, clasificar } from '../utils/nivelSAT';
export type { Nivel } from '../utils/nivelSAT';

/** Universidad "tradicional": publica datos SAT. Deja fuera escuelas de salud, de posgrado
 *  y community colleges, que no son opciones típicas para quien rinde el SAT. */
export const esTradicional = (u: Universidad) => rangoSAT(u) != null || u.SAT_AVG != null;

/** Precio neto para familias de ingreso bajo (lo que pagan tras becas). */
export const netoIngresoBajo = (u: Universidad) => u.NPT41_PUB ?? u.NPT41_PRIV ?? null;
export const netoPromedio = (u: Universidad) => u.NPT4_PUB ?? u.NPT4_PRIV ?? null;

export const mediana = (valores: number[]): number | null => {
  if (valores.length === 0) return null;
  const o = [...valores].sort((a, b) => a - b);
  const m = Math.floor(o.length / 2);
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2;
};


/** Busca una universidad por nombre o sigla ("NYU", "MIT"), solo coincidencias claras. */
export function encontrarPorNombre(indice: IndiceBusqueda, texto: string): Universidad | null {
  const r = buscarUniversidades(indice, texto.trim());
  if (!r || r.aproximado) return null;
  return r.ordenadas[0] ?? null;
}

/** Datos típicos de una tarjeta, en el orden en que se leen. */
export function datosBasicos(u: Universidad): string[] {
  const r = rangoSAT(u);
  return [
    r ? `SAT ${r[0]}–${r[1]}` : u.SAT_AVG ? `SAT prom. ${u.SAT_AVG}` : '',
    u.ADM_RATE != null ? `Admite ${pct(u.ADM_RATE)}` : '',
    u.TUITIONFEE_OUT != null ? `Matrícula ${usd(u.TUITIONFEE_OUT)}` : '',
  ].filter(Boolean);
}

export const ficha = (uni: Universidad, datos: string[], etiqueta?: string): FichaRecomendada =>
  ({ uni, datos: datos.filter(Boolean), etiqueta });

/** Describe los criterios en formato de "argumentos" de la herramienta. */
export function describirArgumentos(p: PerfilDetectado, extra: string[] = []): string {
  return [
    p.estado ? `estado=${p.estado}` : '',
    p.sat ? `sat=${p.sat}` : '',
    p.presupuesto ? `matricula_max=${usd(p.presupuesto)}` : '',
    p.tipo ? `tipo=${p.tipo}` : '',
    ...extra,
  ].filter(Boolean).join(' · ') || 'sin filtros';
}

/** Reparte un puntaje total en Math/Lectura para poder llenar los filtros de la calculadora. */
export function repartirSAT(sat: number): { math: number; lectura: number } {
  const math = Math.min(800, Math.round(sat / 2 / 10) * 10);
  return { math, lectura: Math.min(800, sat - math) };
}
