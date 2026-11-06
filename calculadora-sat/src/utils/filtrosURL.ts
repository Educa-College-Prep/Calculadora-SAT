/**
 * Los filtros de la portada guardados en la URL. Así una búsqueda se puede compartir, quedar
 * en un marcador y sobrevivir a una recarga:
 *
 *   ?sat=1250&estado=CA&nivel=alta,media&orden=salario&dir=desc
 *   ?estados=TX,CA&carrera=1101,1107   (varios estados y carreras, desde los pasos de la portada)
 *
 * Solo se escribe lo que no está en su valor por defecto, para que las URLs queden cortas.
 * Las vistas (ficha, "Mi lista") no van acá: siguen en history.state, como antes.
 */
import type { Nivel } from './nivelSAT';
import type { TipoControl } from './tipoControl';

/** Tope del deslizador de costo. En ese valor el filtro se considera inactivo. */
export const PRECIO_MAXIMO_SLIDER = 100000;

/** Todo lo que se puede fijar desde la URL, ya validado. */
export interface FiltrosURL {
  busqueda: string;
  estado: string;
  /** Varios estados a la vez (los pasos de la portada dejan elegir hasta 6). Con uno solo se usa `estado`. */
  estados: string[];
  ciudad: string;
  /** Códigos CIP de las carreras que le interesan (salarios_carreras.json). No descartan: ordenan y marcan. */
  carreras: string[];
  puntajeMath: number;
  puntajeLectura: number;
  puntajeSoloTotal: number;
  exigirSAT: string;
  niveles: Nivel[];
  tipos: TipoControl[];
  precio: number;
  ordenarPor: string;
  ordenDireccion: 'asc' | 'desc';
}

/** Los valores "sin filtro": lo que esté así no se escribe en la URL. */
export const FILTROS_URL_VACIOS: FiltrosURL = {
  busqueda: '',
  estado: 'todos',
  estados: [],
  ciudad: 'todas',
  carreras: [],
  puntajeMath: 0,
  puntajeLectura: 0,
  puntajeSoloTotal: 0,
  exigirSAT: 'todos',
  niveles: [],
  tipos: [],
  precio: PRECIO_MAXIMO_SLIDER,
  ordenarPor: 'ninguno',
  ordenDireccion: 'asc',
};

// La URL usa palabras cortas; el código, los nombres de los datos. Estos mapas traducen.
const NIVEL_A_URL: Record<Nivel, string> = {
  'Probabilidad alta': 'alta',
  'Probabilidad media': 'media',
  'Probabilidad baja': 'baja',
};
const URL_A_NIVEL = new Map<string, Nivel>(
  (Object.entries(NIVEL_A_URL) as [Nivel, string][]).map(([nivel, token]) => [token, nivel])
);

const ORDEN_A_URL: Record<string, string> = {
  USNEWS_ORDEN: 'ranking',
  ADM_RATE: 'admision',
  SAT_AVG: 'sat',
  COSTO_ANUAL: 'costo',
  MD_EARN_WNE_4YR: 'salario',
  INSTNM: 'nombre',
};
const URL_A_ORDEN = new Map(Object.entries(ORDEN_A_URL).map(([orden, token]) => [token, orden]));

const OPCIONES_POLITICA = ['requerido', 'opcional', 'no-considera', 'no-exige'];
const TIPOS: TipoControl[] = ['publica', 'privada'];

/** Número entero, o null si el texto no lo es. */
function entero(valor: string | null): number | null {
  if (valor == null || valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isInteger(n) ? n : null;
}

/** Número entero dentro del rango; fuera de rango o ilegible, null. */
function enRango(valor: string | null, min: number, max: number): number | null {
  const n = entero(valor);
  return n != null && n >= min && n <= max ? n : null;
}

/** "alta,media" → ['Probabilidad alta', 'Probabilidad media'], sin repetidos ni desconocidos. */
function listaDeNiveles(valor: string | null): Nivel[] {
  if (!valor) return [];
  return Array.from(new Set(valor.split(',').map(t => URL_A_NIVEL.get(t.trim()))))
    .filter((n): n is Nivel => n != null);
}

/** "publica,privada" → los tipos válidos, sin repetidos. */
function listaDeTipos(valor: string | null): TipoControl[] {
  if (!valor) return [];
  return Array.from(new Set(valor.split(',').map(t => t.trim())))
    .filter((t): t is TipoControl => TIPOS.includes(t as TipoControl));
}

/** "TX,ca" → ['TX', 'CA']: códigos de dos letras, sin repetidos, como mucho 6 (el tope del mapa). */
function listaDeEstados(valor: string | null): string[] {
  if (!valor) return [];
  return Array.from(new Set(valor.toUpperCase().split(',').map(t => t.trim())))
    .filter(t => /^[A-Z]{2}$/.test(t)).slice(0, 6);
}

/** "1101,1107" → códigos CIP de 4 dígitos, sin repetidos. */
function listaDeCarreras(valor: string | null): string[] {
  if (!valor) return [];
  return Array.from(new Set(valor.split(',').map(t => t.trim()))).filter(t => /^\d{4}$/.test(t)).slice(0, 20);
}

/**
 * Lee los filtros de la URL. Cualquier valor raro (fuera de rango, desconocido, mal escrito)
 * se ignora y queda en su valor por defecto: un enlace mal armado nunca rompe la página.
 */
export function leerFiltrosDeURL(search: string): FiltrosURL {
  const p = new URLSearchParams(search);

  const estado = (p.get('estado') ?? '').toUpperCase();
  const ciudad = (p.get('ciudad') ?? '').trim();
  const politica = p.get('pide') ?? '';
  const orden = p.get('orden');

  // Con las dos secciones el total se calcula solo: el total escrito a mano no se usa.
  const mate = enRango(p.get('mat'), 200, 800) ?? 0;
  const lectura = enRango(p.get('lec'), 200, 800) ?? 0;
  const total = enRango(p.get('sat'), 400, 1600) ?? 0;

  const estados = listaDeEstados(p.get('estados'));
  // Uno solo en ?estados= es lo mismo que ?estado=: así la ciudad y el resumen del estado funcionan.
  const unico = estados.length === 1 ? estados[0] : estado;

  return {
    busqueda: (p.get('q') ?? '').trim().slice(0, 100),
    estado: estados.length > 1 ? FILTROS_URL_VACIOS.estado : /^[A-Z]{2}$/.test(unico) ? unico : FILTROS_URL_VACIOS.estado,
    estados: estados.length > 1 ? estados : [],
    ciudad: estados.length <= 1 && ciudad && ciudad.length <= 80 ? ciudad : FILTROS_URL_VACIOS.ciudad,
    carreras: listaDeCarreras(p.get('carrera')),
    puntajeMath: mate,
    puntajeLectura: lectura,
    puntajeSoloTotal: mate > 0 && lectura > 0 ? 0 : total,
    exigirSAT: OPCIONES_POLITICA.includes(politica) ? politica : FILTROS_URL_VACIOS.exigirSAT,
    // Los niveles solo tienen sentido con un puntaje: sin él ninguna universidad se puede
    // clasificar y la lista quedaría vacía.
    niveles: (mate > 0 && lectura > 0) || total > 0 ? listaDeNiveles(p.get('nivel')) : [],
    tipos: listaDeTipos(p.get('tipo')),
    precio: enRango(p.get('precio'), 0, PRECIO_MAXIMO_SLIDER) ?? PRECIO_MAXIMO_SLIDER,
    ordenarPor: (orden && URL_A_ORDEN.get(orden)) ?? FILTROS_URL_VACIOS.ordenarPor,
    ordenDireccion: p.get('dir') === 'desc' ? 'desc' : 'asc',
  };
}

/** La URL completa (mismo path, misma base) que representa estos filtros. */
export function urlDeFiltros(f: FiltrosURL): string {
  const p = new URLSearchParams();

  if (f.busqueda.trim()) p.set('q', f.busqueda.trim());
  if (f.estado !== 'todos') p.set('estado', f.estado);
  if (f.estados.length > 0) p.set('estados', f.estados.join(','));
  if (f.ciudad !== 'todas') p.set('ciudad', f.ciudad);
  if (f.carreras.length > 0) p.set('carrera', f.carreras.join(','));
  if (f.puntajeMath > 0) p.set('mat', String(f.puntajeMath));
  if (f.puntajeLectura > 0) p.set('lec', String(f.puntajeLectura));
  if (f.puntajeSoloTotal > 0) p.set('sat', String(f.puntajeSoloTotal));
  if (f.exigirSAT !== 'todos') p.set('pide', f.exigirSAT);
  if (f.niveles.length > 0) p.set('nivel', f.niveles.map(n => NIVEL_A_URL[n]).join(','));
  if (f.tipos.length > 0) p.set('tipo', [...f.tipos].sort().join(','));
  if (f.precio < PRECIO_MAXIMO_SLIDER) p.set('precio', String(f.precio));

  const orden = ORDEN_A_URL[f.ordenarPor];
  if (orden) {
    p.set('orden', orden);
    // La dirección siempre acompaña al orden: sin ella no se sabe si es "más barato primero".
    p.set('dir', f.ordenDireccion);
  }

  // ?lista= no es un filtro: es un enlace de Mi lista que App lee y borra cuando llegan los datos.
  // Si esta escritura se lo llevara antes, el enlace se perdería cuando los datos tardan.
  const lista = new URLSearchParams(window.location.search).get('lista');
  if (lista) p.set('lista', lista);

  const buscar = p.toString();
  const { pathname, hash } = window.location;
  return `${pathname}${buscar ? `?${buscar}` : ''}${hash}`;
}

/**
 * Escribe los filtros en la URL sin crear una entrada de historial: "atrás" sigue llevando a
 * la vista anterior, no a cada tecla del buscador. Si la URL ya es la correcta, no hace nada.
 */
export function escribirFiltrosEnURL(f: FiltrosURL) {
  const url = urlDeFiltros(f);
  const { pathname, search, hash } = window.location;
  if (url === `${pathname}${search}${hash}`) return;
  window.history.replaceState(window.history.state, '', url);
}
