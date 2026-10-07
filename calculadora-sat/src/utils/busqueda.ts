import type { Universidad } from '../types';
import { ALIASES } from './aliases';

/**
 * Búsqueda de universidades por nombre, tolerante a siglas y errores de tipeo.
 *
 * Funciona en dos pasadas:
 *  1. Precisa: nombre exacto, alias ("MIT"), siglas automáticas ("UCLA"),
 *     texto contenido en el nombre, o todas las palabras presentes en cualquier
 *     orden ("california university").
 *  2. Aproximada: SOLO si la pasada precisa no encontró nada. Tolera letras de
 *     más/menos/cambiadas ("Hrvrd", "Stanfrod") y hasta una palabra que no
 *     coincide con nada ("harvard qwerty university").
 *
 * Separar las pasadas evita ruido: buscar "Boston" no muestra "Bolton".
 */

/** Palabras que no aportan al buscar ni al armar siglas. */
const PALABRAS_VACIAS = new Set(['of', 'the', 'and', 'at', 'in', 'for', 'on']);

/** Para quien busca en español: "universidad de california" → "university of california". */
const SINONIMOS: Record<string, string> = {
  universidad: 'university',
  instituto: 'institute',
  tecnologia: 'technology',
  tecnologico: 'technology',
  colegio: 'college',
  estatal: 'state',
  escuela: 'school',
  comunitario: 'community',
  de: 'of',
  del: 'of',
  y: 'and',
  en: 'in',
  la: 'the',
  el: 'the',
};

/** Minúsculas, sin tildes ni puntuación; "A & M" y "A&M" quedan igual ("am"). */
function normalizar(texto: string): string {
  return texto
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s*&\s*/g, '')
    .replace(/[-/]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map(p => (p === 'saint' ? 'st' : p))
    .join(' ');
}

function sigla(texto: string): string {
  return normalizar(texto)
    .split(' ')
    .filter(p => !PALABRAS_VACIAS.has(p))
    .map(p => p[0])
    .join('');
}

interface EntradaIndice {
  uni: Universidad;
  nombre: string;
  palabras: string[];
  /** Alias y siglas sin espacios, para que "cal tech" = "caltech". */
  alias: string[];
  siglas: string[];
}

export interface IndiceBusqueda {
  entradas: EntradaIndice[];
  /** Palabras que aparecen en muchos nombres ("university", "college", "state"...). */
  comunes: Set<string>;
}

/** Se arma una sola vez al cargar la data; cada búsqueda reutiliza este trabajo. */
export function crearIndiceBusqueda(universidades: Universidad[]): IndiceBusqueda {
  const frecuencia = new Map<string, number>();
  const entradas = universidades.map(uni => {
    const nombre = normalizar(uni.INSTNM);
    const palabras = nombre.split(' ');
    for (const p of new Set(palabras)) frecuencia.set(p, (frecuencia.get(p) ?? 0) + 1);
    // Sigla del nombre completo y de la parte antes del guion:
    // "University of California-Los Angeles" → "ucla" y "uc".
    const siglas = new Set([sigla(uni.INSTNM), sigla(uni.INSTNM.split('-')[0])]);
    return {
      uni,
      nombre,
      palabras,
      alias: (ALIASES[uni.INSTNM] ?? []).map(a => normalizar(a).replace(/ /g, '')),
      siglas: [...siglas].filter(s => s.length >= 3),
    };
  });

  const limite = universidades.length * 0.02;
  const comunes = new Set([...frecuencia].filter(([, n]) => n > limite).map(([p]) => p));
  return { entradas, comunes };
}

/**
 * Distancia de edición (inserción, borrado, sustitución y transposición de dos
 * letras vecinas). Corta apenas supera `maximo` para no gastar tiempo.
 */
function distancia(a: string, b: string, maximo: number): number {
  if (Math.abs(a.length - b.length) > maximo) return maximo + 1;
  let previaPrevia: number[] = [];
  let previa = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const actual = [i];
    let minimoFila = i;
    for (let j = 1; j <= b.length; j++) {
      const costo = a[i - 1] === b[j - 1] ? 0 : 1;
      let valor = Math.min(previa[j] + 1, actual[j - 1] + 1, previa[j - 1] + costo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        valor = Math.min(valor, previaPrevia[j - 2] + 1);
      }
      actual.push(valor);
      if (valor < minimoFila) minimoFila = valor;
    }
    if (minimoFila > maximo) return maximo + 1;
    previaPrevia = previa;
    previa = actual;
  }
  return previa[b.length];
}

/** Cuántos errores se aceptan según el largo de la palabra buscada. */
function tolerancia(largo: number): number {
  if (largo <= 4) return 1;
  if (largo <= 8) return 2;
  return 3;
}

/** "mchgn" está "dentro" de "michigan" (mismas letras, mismo orden). */
function esAbreviatura(corta: string, larga: string): boolean {
  if (corta[0] !== larga[0] || corta.length < larga.length / 2) return false;
  let i = 0;
  for (const letra of larga) {
    if (letra === corta[i]) i++;
    if (i === corta.length) return true;
  }
  return false;
}

interface PalabraBuscada {
  texto: string;
  /** La última palabra puede estar a medio escribir. */
  ultima: boolean;
  /** Costo ya calculado contra cada palabra del vocabulario: muchos nombres repiten palabras. */
  costos: Map<string, number | null>;
}

/** Qué tan lejos está `buscada` de `palabra` (0 = calza); null si no se parecen. */
function costoContra(buscada: PalabraBuscada, palabra: string): number | null {
  const b = buscada.texto;
  if (palabra.startsWith(b)) return 0;
  if (b.length < 3) return null;

  const maximo = tolerancia(b.length);
  let mejor = distancia(b, palabra, maximo);
  // A medio escribir y con error: "massachs" → "massachusetts". Cuesta un poco más.
  if (buscada.ultima && palabra.length > b.length) {
    mejor = Math.min(mejor, distancia(b, palabra.slice(0, b.length), maximo) + 1);
  }
  if (esAbreviatura(b, palabra)) mejor = Math.min(mejor, 1.5);
  return mejor <= maximo ? mejor : null;
}

function costoPalabra(buscada: PalabraBuscada, palabra: string): number | null {
  let costo = buscada.costos.get(palabra);
  if (costo === undefined) {
    costo = costoContra(buscada, palabra);
    buscada.costos.set(palabra, costo);
  }
  return costo;
}

function puntajePreciso(e: EntradaIndice, consulta: string, compacta: string, significativas: string[]): number {
  if (e.nombre === consulta) return 1100;
  if (e.alias.includes(compacta)) return 1000;
  if (e.siglas.includes(compacta)) return 900;
  if (e.nombre.startsWith(consulta)) return 800;
  if (compacta.length >= 2 && e.alias.some(a => a.startsWith(compacta))) return 700;
  if ((' ' + e.nombre).includes(' ' + consulta)) return 600;
  if (e.nombre.includes(consulta)) return 500;
  if (significativas.length > 0 && significativas.every(b => e.palabras.some(p => p.startsWith(b)))) return 400;
  return 0;
}

function puntajeAproximado(
  e: EntradaIndice,
  compacta: string,
  buscadas: PalabraBuscada[],
  comunes: Set<string>,
): { puntaje: number; omitidas: number } {
  let mejor = 0;

  // Alias mal escrito: "calteck" → Caltech.
  if (compacta.length >= 4) {
    const maximo = tolerancia(compacta.length);
    for (const a of e.alias) {
      const d = distancia(compacta, a, maximo);
      if (d <= maximo) mejor = Math.max(mejor, 350 - 40 * d);
    }
  }

  let errores = 0;
  let omitidas = 0;
  let algunaFuerte = false;
  let algunaDistintiva = false;
  for (const b of buscadas) {
    let costo: number | null = null;
    let calzo = '';
    for (const p of e.palabras) {
      const c = costoPalabra(b, p);
      if (c != null && (costo == null || c < costo)) {
        costo = c;
        calzo = p;
      }
    }
    if (costo == null) {
      omitidas++;
      continue;
    }
    errores += costo;
    if (b.texto.length >= 3) {
      algunaFuerte = true;
      if (!comunes.has(calzo)) algunaDistintiva = true;
    }
  }

  // Se perdona UNA palabra que no calza con nada, pero solo si lo que sí calzó
  // identifica algo: "harvard qwerty" sí; "colmbia university" no puede quedarse
  // solo con "university" (eso traería 1600 resultados).
  const valida = omitidas === 0
    ? algunaFuerte
    : omitidas === 1 && buscadas.length >= 2 && algunaDistintiva;
  if (valida) mejor = Math.max(mejor, 300 - 20 * errores - 80 * omitidas);

  return { puntaje: mejor, omitidas: valida ? omitidas : 0 };
}

export interface ResultadoBusqueda {
  /** Universidades encontradas, de más a menos relevante. */
  ordenadas: Universidad[];
  /** _id → posición en `ordenadas`; sirve para filtrar y para ordenar por relevancia. */
  posicion: Map<number, number>;
  /** true si no hubo coincidencias exactas y se muestran las parecidas. */
  aproximado: boolean;
}

/** Devuelve null si la búsqueda está vacía (= no filtrar por nombre). */
export function buscarUniversidades(indice: IndiceBusqueda, texto: string): ResultadoBusqueda | null {
  const terminaEnEspacio = /\s$/.test(texto);
  const crudas = normalizar(texto).split(' ').filter(Boolean);
  if (crudas.length === 0) return null;

  // La última palabra puede estar a medio escribir: "de" podría ser el inicio de
  // "delaware", así que solo se traduce si ya es larga o el usuario puso espacio.
  const palabras = crudas.map((p, i) => {
    const completa = i < crudas.length - 1 || terminaEnEspacio || p.length >= 4;
    return completa ? SINONIMOS[p] ?? p : p;
  });

  const consulta = palabras.join(' ');
  const compacta = palabras.join('');
  const significativas = palabras.filter(p => !PALABRAS_VACIAS.has(p));

  let encontradas: { entrada: EntradaIndice; puntaje: number; omitidas: number }[] = [];
  for (const entrada of indice.entradas) {
    const puntaje = puntajePreciso(entrada, consulta, compacta, significativas);
    if (puntaje > 0) encontradas.push({ entrada, puntaje, omitidas: 0 });
  }

  const aproximado = encontradas.length === 0;
  if (aproximado) {
    const ultima = palabras[palabras.length - 1];
    const buscadas: PalabraBuscada[] = significativas.map(texto => ({
      texto,
      ultima: texto === ultima && !terminaEnEspacio,
      costos: new Map(),
    }));
    for (const entrada of indice.entradas) {
      const { puntaje, omitidas } = puntajeAproximado(entrada, compacta, buscadas, indice.comunes);
      if (puntaje > 0) encontradas.push({ entrada, puntaje, omitidas });
    }
    // Si hay resultados donde calzaron todas las palabras, los que omitieron una sobran.
    const minimoOmitidas = Math.min(...encontradas.map(r => r.omitidas));
    encontradas = encontradas.filter(r => r.omitidas === minimoOmitidas);
  }

  // A igual puntaje, primero la más grande (suele ser el campus principal).
  encontradas.sort((a, b) =>
    b.puntaje - a.puntaje
    || (b.entrada.uni.UGDS ?? -1) - (a.entrada.uni.UGDS ?? -1)
    || a.entrada.nombre.length - b.entrada.nombre.length
  );

  const ordenadas = encontradas.map(r => r.entrada.uni);
  const posicion = new Map<number, number>();
  ordenadas.forEach((uni, i) => { if (uni._id != null) posicion.set(uni._id, i); });

  return { ordenadas, posicion, aproximado };
}
