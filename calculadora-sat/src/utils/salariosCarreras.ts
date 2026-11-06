import { useEffect, useState } from 'react';
import { CARRERAS_ESPANOL } from '../data/carrerasEspanol';

/**
 * Carreras y salarios: public/salarios_carreras.json (lo genera scripts/actualizar_datos.py
 * con el archivo "Field of Study" de College Scorecard). Todas las carreras de bachiller de cada
 * universidad: las que no publican salario (Scorecard lo oculta cuando hay pocos graduados)
 * vienen con los dos salarios en null. Igual sirven: dicen que la universidad ofrece la carrera.
 *
 * El archivo (~700 KB) se pide recién cuando alguien abre una ficha, y una sola vez.
 */
export interface ArchivoSalarios {
  /** Código CIP → nombre en inglés. */
  carreras: Record<string, string>;
  /** UNITID → [código CIP, salario a 1 año, a 4 años, graduados del último año]. Salarios null = no publicados. */
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

export function cargarSalarios() {
  archivo ??= fetch(`${import.meta.env.BASE_URL}salarios_carreras.json`)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
  return archivo;
}

/**
 * Carreras de bachiller de una universidad: primero las que publican salario, de mayor a menor;
 * al final, las que no lo publican. undefined mientras carga; [] si Scorecard no le registra ninguna.
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
      // salario a 4 años (de mayor a menor), después las que solo tienen el de 1 año y al final
      // las que no publican ninguno.
      carreras.sort((a, b) =>
        Number(a.cuatroAnios == null && a.unAnio == null) - Number(b.cuatroAnios == null && b.unAnio == null)
        || Number(a.cuatroAnios == null) - Number(b.cuatroAnios == null)
        || (b.cuatroAnios ?? b.unAnio ?? 0) - (a.cuatroAnios ?? a.unAnio ?? 0));
      setResultado({ unitid, carreras });
    });
    return () => { vigente = false; };
  }, [unitid]);

  return resultado && resultado.unitid === unitid ? resultado.carreras : undefined;
}

/**
 * El archivo entero, para filtrar y ordenar la lista por carrera. Se pide recién cuando
 * `activo` es true (alguien abrió los pasos o eligió una carrera): quien no lo usa no lo baja.
 * null mientras no llega (o si no se pudo bajar).
 */
export function useArchivoCarreras(activo: boolean): ArchivoSalarios | null {
  const [archivoCargado, setArchivoCargado] = useState<ArchivoSalarios | null>(null);
  useEffect(() => {
    if (!activo || archivoCargado) return;
    let vigente = true;
    cargarSalarios().then(datos => { if (vigente && datos) setArchivoCargado(datos); });
    return () => { vigente = false; };
  }, [activo, archivoCargado]);
  return archivoCargado;
}

/** Nombre de una carrera para mostrar: en español si ya está traducida; si no, el de Scorecard. */
export function nombreCarrera(cip: string, archivoCarreras: ArchivoSalarios | null): string {
  return CARRERAS_ESPANOL[cip] ?? archivoCarreras?.carreras[cip] ?? cip;
}
