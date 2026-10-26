/**
 * Fechas de postulación de cada universidad (Early Decision, Early Action, Regular Decision),
 * para el panel "Fechas de postulación" de la banda Admisión. Ninguna fuente pública las
 * publica, así que se cargan a mano desde la web de admisión de cada universidad y se
 * **verifican cada ciclo**: cambian todos los años.
 *
 * La clave es el UNITID, como en videosUniversidades.ts. Sin fechas, el panel no aparece: es
 * preferible no mostrar nada a mostrar una fecha que no se verificó.
 *
 * Ejemplo de entrada:
 *   193900: {  // New York University
 *     ciclo: '2026-27',
 *     plazos: [
 *       { nombre: 'Early Decision I', fecha: '2026-11-01', descripcion: 'Compromiso de matricularte si te admiten.' },
 *     ],
 *   },
 */
export interface PlazoPostulacion {
  nombre: string;
  /** AAAA-MM-DD. */
  fecha: string;
  descripcion: string;
}

export interface FechasDeUniversidad {
  /** Ciclo de admisión al que corresponden, por ejemplo "2026-27". */
  ciclo: string;
  plazos: PlazoPostulacion[];
}

export const FECHAS_POSTULACION: Record<number, FechasDeUniversidad> = {};
