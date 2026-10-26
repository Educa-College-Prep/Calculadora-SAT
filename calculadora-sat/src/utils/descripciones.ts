import { useEffect, useState } from 'react';
import type { DescripcionUniversidad } from '../data/descripcionesUniversidades';

/**
 * Descripciones traducidas de Wikipedia (src/data/descripcionesUniversidades.ts). El archivo se
 * pide recién cuando alguien abre una ficha, y una sola vez: así no pesa en la portada.
 */
export const LICENCIA_WIKIPEDIA = { nombre: 'CC BY-SA 4.0', url: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es' };

export const urlArticulo = (d: DescripcionUniversidad) => `https://en.wikipedia.org/wiki/${d.articulo}`;

let descripciones: Promise<Record<number, DescripcionUniversidad>> | null = null;

function cargarDescripciones() {
  descripciones ??= import('../data/descripcionesUniversidades')
    .then(m => m.DESCRIPCIONES_UNIVERSIDADES)
    .catch(() => ({}));
  return descripciones;
}

/** La descripción de la universidad, o null si no tiene (o mientras carga). */
export function useDescripcion(unitid: number | undefined): DescripcionUniversidad | null {
  const [resultado, setResultado] = useState<{ unitid: number; descripcion: DescripcionUniversidad | null } | null>(null);
  useEffect(() => {
    if (unitid == null) return;
    let vigente = true;
    cargarDescripciones().then(todas => { if (vigente) setResultado({ unitid, descripcion: todas[unitid] ?? null }); });
    return () => { vigente = false; };
  }, [unitid]);
  // Al pasar de una ficha a otra, no se muestra la descripción de la anterior mientras carga.
  return resultado && resultado.unitid === unitid ? resultado.descripcion : null;
}
