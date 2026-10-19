import type { Universidad } from '../types';
import { NOMBRES_ESTADOS } from '../utils/estados';
import type { IndiceBusqueda } from '../utils/busqueda';
import type { PerfilDetectado, RespuestaAgente } from './tipos';
import { ESCENARIOS, recomendarPorPerfil, respuestaSinCoincidencia } from './escenarios';

/**
 * "Cerebro" simulado de la demo. Decide qué responder con reglas simples:
 *   1. Si la pregunta es una de las preparadas, usa esa.
 *   2. Si contiene palabras clave de algún tema, usa el tema que mejor calce.
 *   3. Si trae puntaje, estado o presupuesto, hace una recomendación por perfil.
 *   4. Si no, explica qué puede responder.
 * Con la IA real, este archivo es lo único que se reemplaza.
 */

export const normalizarTexto = (t: string) =>
  t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Nombres en inglés que difieren del nombre en español de NOMBRES_ESTADOS. */
const NOMBRES_EN_INGLES: Record<string, string> = {
  'new york': 'NY', 'nyc': 'NY', 'new jersey': 'NJ', 'new mexico': 'NM', 'new hampshire': 'NH',
  'north carolina': 'NC', 'south carolina': 'SC', 'north dakota': 'ND', 'south dakota': 'SD',
  'pennsylvania': 'PA', 'louisiana': 'LA', 'hawaii': 'HI', 'missouri': 'MO', 'mississippi': 'MS',
  'oregon': 'OR', 'west virginia': 'WV', 'washington dc': 'DC',
};

const NOMBRES_DE_ESTADO: [string, string][] = [
  ...Object.entries(NOMBRES_ESTADOS).map(([st, nombre]) => [normalizarTexto(nombre), st] as [string, string]),
  ...Object.entries(NOMBRES_EN_INGLES),
].sort((a, b) => b[0].length - a[0].length); // "virginia occidental" antes que "virginia"

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function detectarPerfil(textoNormalizado: string): PerfilDetectado {
  const t = textoNormalizado;
  const perfil: PerfilDetectado = {};

  const math = t.match(/(?:math|matematicas?)\D{0,12}(\d{3})\b/);
  const lectura = t.match(/(?:reading|lectura|verbal)\D{0,12}(\d{3})\b/);
  if (math) perfil.math = Number(math[1]);
  if (lectura) perfil.lectura = Number(lectura[1]);

  for (const m of t.matchAll(/(\$)?\s?(\d[\d,.]*)\s*(k\b|mil\b)?/g)) {
    const [, dolar, cifra, miles] = m;
    let valor = Number(cifra.replace(/[,.](?=\d{3}\b)/g, '').replace(',', '.'));
    if (!Number.isFinite(valor)) continue;
    if (miles) valor *= 1000;
    if (dolar || miles || valor > 1600) {
      if (valor >= 1000 && valor <= 150000 && perfil.presupuesto == null) perfil.presupuesto = valor;
    } else if (valor >= 400 && valor <= 1600 && valor !== perfil.math && valor !== perfil.lectura && perfil.sat == null) {
      perfil.sat = valor;
    }
  }
  if (perfil.sat == null && perfil.math && perfil.lectura) perfil.sat = perfil.math + perfil.lectura;

  for (const [nombre, st] of NOMBRES_DE_ESTADO) {
    if (new RegExp(`\\b${escaparRegex(nombre)}\\b`).test(t)) { perfil.estado = st; break; }
  }

  const publica = /\bpublica/.test(t);
  const privada = /\bprivada/.test(t);
  if (publica !== privada) perfil.tipo = publica ? 'publica' : 'privada';

  return perfil;
}

export function responder(
  pregunta: string,
  universidades: Universidad[],
  indice: IndiceBusqueda,
): RespuestaAgente {
  const texto = normalizarTexto(pregunta);
  const perfil = detectarPerfil(texto);
  const ctx = { universidades, indice, perfil, texto };

  const exacta = ESCENARIOS.find(e => e.pregunta === pregunta.trim());
  if (exacta) return exacta.resolver(ctx);

  // Gana el tema con más texto coincidente ("no exigen" le gana a "exigen").
  let mejor: { puntaje: number; resolver: (typeof ESCENARIOS)[number]['resolver'] } | null = null;
  for (const e of ESCENARIOS) {
    const puntaje = e.claves.filter(c => texto.includes(c)).reduce((s, c) => s + c.length, 0);
    if (puntaje > 0 && (!mejor || puntaje > mejor.puntaje)) mejor = { puntaje, resolver: e.resolver };
  }
  if (mejor) return mejor.resolver(ctx);

  if (perfil.sat || perfil.estado || perfil.presupuesto) return recomendarPorPerfil(ctx);
  return respuestaSinCoincidencia();
}
