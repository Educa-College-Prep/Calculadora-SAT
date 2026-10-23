import { useEffect, useState } from 'react';

/**
 * De dónde sale cada dato y de qué año: public/fuentes_datos.json, que escribe
 * scripts/actualizar_datos.py junto con universidades.json. Así los años que se muestran
 * cambian solos cuando se actualizan los datos.
 */
export interface FuentesDatos {
  scorecard: {
    nombre: string;
    organismo: string;
    /** Fecha en que Scorecard publicó el paquete de datos, AAAA-MM-DD. */
    publicado: string;
    url: string;
    /** "otoño 2024", "2025-26"... Puede faltar alguno si el diccionario cambió de formato. */
    anios: Partial<Record<'admision_y_sat' | 'matricula_y_costo_de_vida' | 'precio_neto' | 'salario_4_anios' | 'graduacion' | 'salario_por_carrera', string>>;
  };
  ipeds: {
    nombre: string;
    organismo: string;
    url: string;
    anios: Partial<Record<'admision_por_sexo' | 'becas_primer_anio' | 'directorio', string>>;
  };
}

let fuentes: Promise<FuentesDatos | null> | null = null;

function cargarFuentes() {
  fuentes ??= fetch(`${import.meta.env.BASE_URL}fuentes_datos.json`)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null);
  return fuentes;
}

/** null mientras carga (o si el archivo no está): quien lo usa simplemente no muestra el año. */
export function useFuentesDatos(): FuentesDatos | null {
  const [datos, setDatos] = useState<FuentesDatos | null>(null);
  useEffect(() => {
    let vigente = true;
    cargarFuentes().then(f => { if (vigente) setDatos(f); });
    return () => { vigente = false; };
  }, []);
  return datos;
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** "2026-10-15" → "15 de octubre de 2026" (sin pasar por Date, que lo correría un día por la zona horaria). */
export function fechaLarga(iso: string) {
  const [anio, mes, dia] = iso.split('-').map(Number);
  return MESES[mes - 1] ? `${dia} de ${MESES[mes - 1]} de ${anio}` : iso;
}

/** "otoño 2024" → "Otoño 2024", para usarlo al inicio de una frase o en un encabezado. */
export const conMayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1);
