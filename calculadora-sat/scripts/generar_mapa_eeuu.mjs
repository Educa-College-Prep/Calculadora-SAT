/**
 * Genera public/geo/mapa-eeuu.json: el dibujo de los estados y dónde cae cada ciudad, ya
 * proyectados, para que el mapa de la portada no dependa de Google ni de librerías en el navegador.
 * Hay que correrlo solo si cambia public/geo/ubicaciones.json. Pide us-atlas, d3-geo y
 * topojson-client, que no son dependencias de la web:
 *   NODE_PATH=<carpeta con esos paquetes>/node_modules node scripts/generar_mapa_eeuu.mjs <esa carpeta>
 * Estados: us-atlas (Oficina del Censo de EE. UU.), proyección Albers USA de 975×610.
 */
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const paquetes = process.argv[2];
const requerir = createRequire(join(paquetes, 'x.js'));
const { feature } = requerir('topojson-client');
const atlas = requerir('us-atlas/states-albers-10m.json');
const { geoPath, geoAlbersUsa } = await import(requerir.resolve('d3-geo'));

// Sigla de cada estado según su código FIPS, que es lo que trae el atlas.
const SIGLAS = { '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', 10: 'DE', 11: 'DC', 12: 'FL', 13: 'GA', 15: 'HI', 16: 'ID', 17: 'IL', 18: 'IN', 19: 'IA', 20: 'KS', 21: 'KY', 22: 'LA', 23: 'ME', 24: 'MD', 25: 'MA', 26: 'MI', 27: 'MN', 28: 'MS', 29: 'MO', 30: 'MT', 31: 'NE', 32: 'NV', 33: 'NH', 34: 'NJ', 35: 'NM', 36: 'NY', 37: 'NC', 38: 'ND', 39: 'OH', 40: 'OK', 41: 'OR', 42: 'PA', 44: 'RI', 45: 'SC', 46: 'SD', 47: 'TN', 48: 'TX', 49: 'UT', 50: 'VT', 51: 'VA', 53: 'WA', 54: 'WV', 55: 'WI', 56: 'WY' };

const trazo = geoPath().digits(1);
const estados = feature(atlas, atlas.objects.states).features.map(f => {
  const st = SIGLAS[f.id];
  if (!st) throw new Error(`Sin sigla: ${f.properties.name}`);
  const [[x0, y0], [x1, y1]] = trazo.bounds(f);
  return { st, d: trazo(f), caja: [x0, y0, x1, y1].map(v => Math.round(v)) };
});

// La misma proyección con la que se dibujó el atlas: así las ciudades caen en su lugar.
const proyeccion = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const puntos = {};
for (const [clave, [, lat, lon]] of Object.entries(JSON.parse(readFileSync('public/geo/ubicaciones.json', 'utf8')))) {
  const p = proyeccion([lon, lat]);
  if (p) puntos[clave] = [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10];
}
writeFileSync('public/geo/mapa-eeuu.json', JSON.stringify({ estados, puntos }));
console.log(`${estados.length} estados, ${Object.keys(puntos).length} ciudades`);
