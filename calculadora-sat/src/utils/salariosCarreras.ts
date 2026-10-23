import { useEffect, useState } from 'react';
import { CARRERAS_ESPANOL } from '../data/carrerasEspanol';

/**
 * Salario por carrera: public/salarios_carreras.json (lo genera scripts/actualizar_datos.py
 * con el archivo "Field of Study" de College Scorecard). Solo carreras de bachiller y solo las
 * que tienen algún salario publicado: Scorecard lo oculta cuando hay pocos graduados.
 *
 * El archivo (~700 KB) se pide recién cuando alguien abre una ficha, y una sola vez.
 */
interface ArchivoSalarios {
  /** Código CIP → nombre en inglés. */
  carreras: Record<string, string>;
  /** UNITID → [código CIP, salario a 1 año, a 4 años, graduados del último año]. */
  universidades: Record<string, [string, number | null, number | null, number | null][]>;
}

export interface SalarioCarrera {
  cip: string;
  /** En español si ya está traducida (data/carrerasEspanol.ts); si no, en inglés. */
  nombre: string;
  /** Nombre original de Scorecard: también sirve para buscar ("nursing"). */
  nombreIngles: string;
  unAnio: number | null;
  cuatroAnios: number | null;
  graduados: number | null;
}

let archivo: Promise<ArchivoSalarios | null> | null = null;

function cargarSalarios() {
  archivo ??= fetch(`${import.meta.env.BASE_URL}salarios_carreras.json`)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
  return archivo;
}

/**
 * Carreras con salario de una universidad, de mayor a menor salario.
 * undefined mientras carga; [] si no tiene ninguna con salario publicado.
 */
export function useSalariosCarreras(unitid: number | null | undefined): SalarioCarrera[] | undefined {
  const [resultado, setResultado] = useState<{ unitid: number | null | undefined; carreras: SalarioCarrera[] } | null>(null);

  useEffect(() => {
    let vigente = true;
    cargarSalarios().then(datos => {
      if (!vigente) return;
      const filas = (unitid != null && datos?.universidades[String(unitid)]) || [];
      const carreras = filas.map(([cip, unAnio, cuatroAnios, graduados]) => ({
        cip,
        nombre: CARRERAS_ESPANOL[cip] ?? datos!.carreras[cip] ?? cip,
        nombreIngles: datos!.carreras[cip] ?? '',
        unAnio,
        cuatroAnios,
        graduados,
      }));
      // El salario a 1 año siempre es menor que a 4: no se mezclan. Primero las que tienen
      // salario a 4 años (de mayor a menor) y después las que solo tienen el de 1 año.
      carreras.sort((a, b) =>
        Number(a.cuatroAnios == null) - Number(b.cuatroAnios == null)
        || (b.cuatroAnios ?? b.unAnio ?? 0) - (a.cuatroAnios ?? a.unAnio ?? 0));
      setResultado({ unitid, carreras });
    });
    return () => { vigente = false; };
  }, [unitid]);

  return resultado && resultado.unitid === unitid ? resultado.carreras : undefined;
}
