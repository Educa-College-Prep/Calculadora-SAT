import type { Universidad } from '../types';

/**
 * Ranking U.S. News & World Report, Best Colleges 2027 (publicado el 22 de septiembre de 2026).
 * Solo se cita la posición de las primeras ~50 de cada lista, con su fuente.
 * U.S. News no publica estos datos para reutilizar: no se copia nada más de su sitio.
 *
 * Nombres y estados tal como aparecen en INSTNM/STABBR de la base, para cruzarlos
 * sin ambigüedad (hay varios "Union College" y "Trinity").
 *
 * Para actualizarlo cada septiembre: cambiar EDICION y las dos listas.
 */
export const EDICION_USNEWS = 2027;
export const FUENTE_USNEWS = `U.S. News & World Report, Best Colleges ${EDICION_USNEWS} (publicado en septiembre de 2026)`;

export type ListaUSNews = 'nacional' | 'liberal-arts';

export const NOMBRE_LISTA: Record<ListaUSNews, string> = {
  'nacional': 'Universidades nacionales',
  'liberal-arts': 'Liberal arts colleges',
};

/**
 * Nombre corto de cada lista para las insignias ("#12 Nacional", "#3 LAC"). Hace falta porque
 * un #3 de liberal arts no es lo mismo que un #3 nacional: son dos rankings distintos.
 */
export const SIGLA_LISTA: Record<ListaUSNews, string> = {
  'nacional': 'Nacional',
  'liberal-arts': 'LAC',
};

// [nombre en la base, estado, puesto]
const NACIONALES: [string, string, number][] = [
  ['Massachusetts Institute of Technology', 'MA', 1],
  ['Princeton University', 'NJ', 2],
  ['Harvard University', 'MA', 3],
  ['Yale University', 'CT', 4],
  ['California Institute of Technology', 'CA', 5],
  ['Stanford University', 'CA', 5],
  ['University of Pennsylvania', 'PA', 7],
  ['Duke University', 'NC', 8],
  ['Johns Hopkins University', 'MD', 9],
  ['Northwestern University', 'IL', 9],
  ['University of Chicago', 'IL', 9],
  ['Columbia University in the City of New York', 'NY', 12],
  ['Dartmouth College', 'NH', 12],
  ['Carnegie Mellon University', 'PA', 14],
  ['Cornell University', 'NY', 14],
  ['Brown University', 'RI', 16],
  ['Rice University', 'TX', 16],
  ['Vanderbilt University', 'TN', 16],
  ['Washington University in St Louis', 'MO', 16],
  ['University of California-Berkeley', 'CA', 20],
  ['University of California-Los Angeles', 'CA', 20],
  ['University of Notre Dame', 'IN', 20],
  ['Emory University', 'GA', 23],
  ['Georgetown University', 'DC', 23],
  ['University of Michigan-Ann Arbor', 'MI', 25],
  ['University of Virginia-Main Campus', 'VA', 26],
  ['University of North Carolina at Chapel Hill', 'NC', 27],
  ['University of Southern California', 'CA', 27],
  ['Georgia Institute of Technology-Main Campus', 'GA', 29],
  ['University of California-San Diego', 'CA', 29],
  ['Boston College', 'MA', 31],
  ['New York University', 'NY', 31],
  ['Tufts University', 'MA', 31],
  ['Boston University', 'MA', 34],
  ['University of California-Davis', 'CA', 34],
  ['University of California-Irvine', 'CA', 34],
  ['University of Florida', 'FL', 34],
  ['University of Illinois Urbana-Champaign', 'IL', 34],
  ['The University of Texas at Austin', 'TX', 34],
  ['University of Wisconsin-Madison', 'WI', 34],
  ['Wake Forest University', 'NC', 34],
  ['Northeastern University', 'MA', 42],
  ['Villanova University', 'PA', 42],
  ['Case Western Reserve University', 'OH', 44],
  ['Lehigh University', 'PA', 44],
  ['Ohio State University-Main Campus', 'OH', 44],
  ['Rutgers University-New Brunswick', 'NJ', 44],
  ['University of California-Santa Barbara', 'CA', 44],
  ['University of Maryland-College Park', 'MD', 49],
  ['University of Rochester', 'NY', 49],
  ['University of Washington-Seattle Campus', 'WA', 49],
];

const LIBERAL_ARTS: [string, string, number][] = [
  ['Williams College', 'MA', 1],
  ['Amherst College', 'MA', 2],
  ['Bowdoin College', 'ME', 3],
  ['Claremont McKenna College', 'CA', 3],
  ['Pomona College', 'CA', 3],
  ['Swarthmore College', 'PA', 3],
  ['United States Naval Academy', 'MD', 3],
  ['Harvey Mudd College', 'CA', 8],
  ['United States Military Academy', 'NY', 9],
  ['Wellesley College', 'MA', 10],
  ['United States Air Force Academy', 'CO', 11],
  ['Vassar College', 'NY', 12],
  ['Washington and Lee University', 'VA', 12],
  ['Hamilton College', 'NY', 14],
  ['Wesleyan University', 'CT', 14],
  ['Carleton College', 'MN', 16],
  ['Davidson College', 'NC', 16],
  ['Grinnell College', 'IA', 16],
  ['Barnard College', 'NY', 19],
  ['Middlebury College', 'VT', 19],
  ['University of Richmond', 'VA', 21],
  ['Colby College', 'ME', 22],
  ['Colgate University', 'NY', 22],
  ['College of the Holy Cross', 'MA', 22],
  ['Smith College', 'MA', 22],
  ['Bates College', 'ME', 26],
  ['Haverford College', 'PA', 26],
  ['Macalester College', 'MN', 28],
  ['Bucknell University', 'PA', 29],
  ['Lafayette College', 'PA', 30],
  ['Bryn Mawr College', 'PA', 31],
  ['Denison University', 'OH', 31],
  ['Trinity College', 'CT', 31],
  ['Colorado College', 'CO', 34],
  ['Franklin and Marshall College', 'PA', 34],
  ['Mount Holyoke College', 'MA', 34],
  ['Spelman College', 'GA', 34],
  ['Occidental College', 'CA', 38],
  ['Scripps College', 'CA', 38],
  ['Trinity University', 'TX', 38],
  ['Kenyon College', 'OH', 41],
  ['Skidmore College', 'NY', 41],
  ['Soka University of America', 'CA', 41],
  ['Pitzer College', 'CA', 44],
  ['Union College', 'NY', 44],
  ['Wabash College', 'IN', 44],
  ['Connecticut College', 'CT', 47],
  ['Hillsdale College', 'MI', 47],
  ['DePauw University', 'IN', 49],
  ['Rhodes College', 'TN', 49],
  ['St Lawrence University', 'NY', 49],
  ['St Olaf College', 'MN', 49],
  ['The University of the South', 'TN', 49],
];

export interface PosicionUSNews {
  puesto: number;
  lista: ListaUSNews;
}

function indexar(filas: [string, string, number][], lista: ListaUSNews, mapa: Map<string, PosicionUSNews>) {
  for (const [nombre, estado, puesto] of filas) mapa.set(`${nombre}|${estado}`, { puesto, lista });
}

const POSICIONES = new Map<string, PosicionUSNews>();
indexar(NACIONALES, 'nacional', POSICIONES);
indexar(LIBERAL_ARTS, 'liberal-arts', POSICIONES);

export function posicionUSNews(uni: Pick<Universidad, 'INSTNM' | 'STABBR'>): PosicionUSNews | null {
  return POSICIONES.get(`${uni.INSTNM}|${uni.STABBR}`) ?? null;
}

/**
 * Texto corto para insignias: "#7 Nacional" o "#3 LAC". Los empates no se marcan: si dos
 * universidades muestran el mismo número, ya se entiende que comparten el puesto.
 */
export function textoPuesto(p: PosicionUSNews): string {
  return `#${p.puesto} ${SIGLA_LISTA[p.lista]}`;
}

export type NivelRanking = 'oro' | 'plata' | 'bronce' | 'neutro';

/**
 * Color del chip del ranking en la ficha: oro (1–10), plata (11–25), bronce (26–50) y neutro
 * (más de 50, discreto para que un puesto bajo no se destaque). Hoy solo se cargan las ~50
 * primeras de cada lista, así que "neutro" no aparece, pero queda listo si se agregan más.
 */
export function nivelRanking(puesto: number): NivelRanking {
  if (puesto <= 10) return 'oro';
  if (puesto <= 25) return 'plata';
  if (puesto <= 50) return 'bronce';
  return 'neutro';
}
