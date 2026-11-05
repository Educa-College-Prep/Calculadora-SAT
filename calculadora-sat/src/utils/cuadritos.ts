/**
 * Mapa de EE. UU. en cuadritos: un cuadrado del mismo tamaño por estado, puestos más o menos
 * donde van en el mapa. Se eligió así y no un mapa geográfico porque en el geográfico Rhode
 * Island, Delaware o D. C. casi no se pueden tocar, y Puerto Rico (59 universidades) no aparece.
 * Aquí todos se tocan igual de fácil, también con el teclado.
 *
 * [estado, columna, fila] en una grilla de 11 × 8.
 */
export const CUADRITOS: [string, number, number][] = [
  ['AK', 0, 0], ['ME', 10, 0],
  ['WI', 5, 1], ['VT', 9, 1], ['NH', 10, 1],
  ['WA', 0, 2], ['ID', 1, 2], ['MT', 2, 2], ['ND', 3, 2], ['MN', 4, 2], ['IL', 5, 2], ['MI', 6, 2], ['NY', 8, 2], ['MA', 9, 2],
  ['OR', 0, 3], ['NV', 1, 3], ['WY', 2, 3], ['SD', 3, 3], ['IA', 4, 3], ['IN', 5, 3], ['OH', 6, 3], ['PA', 7, 3], ['NJ', 8, 3], ['CT', 9, 3], ['RI', 10, 3],
  ['CA', 0, 4], ['UT', 1, 4], ['CO', 2, 4], ['NE', 3, 4], ['MO', 4, 4], ['KY', 5, 4], ['WV', 6, 4], ['VA', 7, 4], ['MD', 8, 4], ['DE', 9, 4],
  ['AZ', 1, 5], ['NM', 2, 5], ['KS', 3, 5], ['AR', 4, 5], ['TN', 5, 5], ['NC', 6, 5], ['SC', 7, 5], ['DC', 8, 5],
  ['OK', 3, 6], ['LA', 4, 6], ['MS', 5, 6], ['AL', 6, 6], ['GA', 7, 6],
  ['HI', 0, 7], ['TX', 3, 7], ['FL', 8, 7], ['PR', 10, 7],
];

/** Cuántos estados se pueden elegir a la vez: más que eso ya es "me da igual el lugar". */
export const TOPE_ESTADOS = 6;
