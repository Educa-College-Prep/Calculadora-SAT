/**
 * Normaliza nombres de lugar para cruzarlos contra public/geo/ciudades.json.
 *
 * IMPORTANTE: esta función replica exactamente la que se usó al generar ese
 * archivo. Si se cambia una hay que cambiar la otra, o el cruce deja de dar.
 *
 * Resuelve: tildes, guiones ("Winston-Salem"), abreviaturas de dirección
 * ("N Little Rock" = "North Little Rock"), Saint/Ste = St, y sufijos de
 * división administrativa ("... County", "... Parish", "... Borough").
 */
const SUFIJOS = [
  ' COUNTY', ' PARISH', ' BOROUGH', ' CENSUS AREA', ' MUNICIPIO',
  ' CITY AND BOROUGH', ' MUNICIPALITY',
];

const ABREVIATURAS: Record<string, string> = {
  N: 'NORTH', S: 'SOUTH', E: 'EAST', W: 'WEST',
  NE: 'NORTHEAST', NW: 'NORTHWEST', SE: 'SOUTHEAST', SW: 'SOUTHWEST',
  FT: 'FORT', MT: 'MOUNT', ST: 'ST',
};

export function normalizarLugar(valor: string | null | undefined): string {
  let s = (valor ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')   // quita tildes
    .toUpperCase()
    .trim();

  s = s.replace(/[-/]/g, ' ');
  s = s.replace(/SAINT /g, 'ST ').replace(/STE /g, 'ST ');

  for (const sufijo of SUFIJOS) {
    if (s.endsWith(sufijo)) {
      s = s.slice(0, -sufijo.length);
      break;
    }
  }

  s = s.replace(/[.,']/g, '');

  return s
    .split(/\s+/)
    .filter(Boolean)
    .map(palabra => ABREVIATURAS[palabra] ?? palabra)
    .join(' ');
}

/** Clave usada en geo/ciudades.json: "CIUDAD|ESTADO" */
export function claveCiudad(ciudad: string | null | undefined, estado: string | null | undefined): string {
  return `${normalizarLugar(ciudad)}|${(estado ?? '').toUpperCase()}`;
}
