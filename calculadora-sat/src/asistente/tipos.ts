import type { Universidad } from '../types';
import type { IndiceBusqueda } from '../utils/busqueda';

/**
 * Tipos del asistente de demostración.
 *
 * El "cerebro" es simulado (reglas + preguntas preparadas), pero cada número que
 * muestra sale de la data real. La forma de estas piezas imita a un agente con
 * herramientas: cuando se conecte la IA de verdad, solo cambia quién decide qué
 * herramienta usar; el chat y las herramientas se quedan igual.
 */

/** Un paso del razonamiento que se ve en el bloque "Pensando…". */
export type PasoAgente =
  | { tipo: 'pensamiento'; texto: string }
  | { tipo: 'herramienta'; nombre: string; argumentos: string; resultado: string };

/** Universidad recomendada en la respuesta, con los datos que justifican la elección. */
export interface FichaRecomendada {
  uni: Universidad;
  datos: string[];
  /** Etiqueta corta opcional: "Segura", "Objetivo", "Alcance"... */
  etiqueta?: string;
}

/** Filtros que el asistente puede aplicar en la calculadora con un clic. */
export interface FiltrosSugeridos {
  estado?: string;
  math?: number;
  lectura?: number;
  precioMaximo?: number;
  tipo?: 'publica' | 'privada';
  exigirSAT?: 'requerido' | 'opcional';
}

export interface RespuestaAgente {
  pasos: PasoAgente[];
  /** Párrafos separados por línea en blanco. Admite **negrita**. */
  texto: string;
  universidades?: FichaRecomendada[];
  /** Texto que va después de la lista de universidades. */
  cierre?: string;
  filtros?: FiltrosSugeridos;
}

/** Lo que se pudo leer de la pregunta: puntaje, presupuesto, estado... */
export interface PerfilDetectado {
  sat?: number;
  math?: number;
  lectura?: number;
  presupuesto?: number;
  estado?: string;
  tipo?: 'publica' | 'privada';
}

export interface Contexto {
  universidades: Universidad[];
  indice: IndiceBusqueda;
  perfil: PerfilDetectado;
  /** Pregunta original, ya normalizada (minúsculas, sin tildes). */
  texto: string;
}

export interface Escenario {
  id: string;
  categoria: string;
  pregunta: string;
  /** Palabras (normalizadas) que delatan esta intención en una pregunta libre. */
  claves: string[];
  resolver: (ctx: Contexto) => RespuestaAgente;
}
