export const NOMBRES_ESTADOS: Record<string, string> = {
  AK: 'Alaska', AL: 'Alabama', AR: 'Arkansas', AS: 'Samoa Americana',
  AZ: 'Arizona', CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DC: 'Distrito de Columbia', DE: 'Delaware', FL: 'Florida', FM: 'Micronesia',
  GA: 'Georgia', GU: 'Guam', HI: 'Hawái', IA: 'Iowa', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', KS: 'Kansas', KY: 'Kentucky', LA: 'Luisiana',
  MA: 'Massachusetts', MD: 'Maryland', ME: 'Maine', MH: 'Islas Marshall',
  MI: 'Michigan', MN: 'Minnesota', MO: 'Misuri', MP: 'Islas Marianas del Norte',
  MS: 'Misisipi', MT: 'Montana', NC: 'Carolina del Norte', ND: 'Dakota del Norte',
  NE: 'Nebraska', NH: 'Nuevo Hampshire', NJ: 'Nueva Jersey', NM: 'Nuevo México',
  NV: 'Nevada', NY: 'Nueva York', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregón',
  PA: 'Pensilvania', PR: 'Puerto Rico', PW: 'Palaos', RI: 'Rhode Island',
  SC: 'Carolina del Sur', SD: 'Dakota del Sur', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VA: 'Virginia', VI: 'Islas Vírgenes', VT: 'Vermont',
  WA: 'Washington', WI: 'Wisconsin', WV: 'Virginia Occidental', WY: 'Wyoming',
  // No es un estado: el cuadrito que agrupa las islas sin cuadrito propio (ver OTRAS_ISLAS).
  IS: 'Otras islas',
};
/**
 * "Otras islas": los lugares con universidades en College Scorecard que no son ni estados ni
 * Puerto Rico, y por eso no tienen cuadrito propio en el mapa. Cuatro son territorios de EE. UU.
 * (Islas Vírgenes, Guam, Samoa Americana e Islas Marianas del Norte) y tres son países
 * independientes "asociados" a EE. UU. (Micronesia, Palaos e Islas Marshall), que Scorecard
 * incluye porque reciben ayuda federal para estudiantes. Son unas 9 universidades en total.
 *
 * Sin este grupo, al descartar todos los estados en "Dónde no quiero" se quedaban siempre:
 * no había dónde tocarlas.
 */
export const OTRAS_ISLAS = new Set(['VI', 'GU', 'AS', 'MP', 'FM', 'PW', 'MH']);
/** Territorios de EE. UU. dentro de OTRAS_ISLAS (el resto son países asociados). */
export const TERRITORIOS_EEUU = new Set(['VI', 'GU', 'AS', 'MP']);
/**
 * Código del cuadrito "Otras islas". Dos letras para que pase por la URL (?sin=…,IS) como
 * cualquier estado; ningún STABBR real usa "IS".
 */
export const CODIGO_ISLAS = 'IS';

/**
 * ¿La universidad (por su STABBR) cae en alguno de los lugares de la lista? Como includes(),
 * pero "IS" cuenta para las siete islas.
 */
export function enLugares(lugares: string[], stabbr: string): boolean {
  return lugares.includes(stabbr) || (OTRAS_ISLAS.has(stabbr) && lugares.includes(CODIGO_ISLAS));
}
