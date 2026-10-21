export interface Universidad {
  /** Identificador estable asignado al cargar la data. Se usa como key de React
   *  para que ordenar/filtrar no obligue a re-renderizar toda la lista. */
  _id?: number;
  /** ID oficial de la universidad en IPEDS. Sirve para unir fuentes; no se muestra. */
  UNITID?: number;
  INSTNM: string;
  CITY: string;
  STABBR: string;
  CONTROL: string | null;
  UGDS?: number | null;
  /** Proporción (0.0–1.0) de estudiantes de pregrado que son hispanos, NO un conteo total */
  UGDS_HISP?: number | null;
  ADM_RATE?: number | null;
  SATVR25?: number | null;
  SATMT25?: number | null;
  SATVR75?: number | null;
  SATMT75?: number | null;
  /** Mediana (percentil 50). Solo ~949 universidades la reportan. */
  SATVR50?: number | null;
  SATMT50?: number | null;

  // Postulantes, admitidos y matriculados por sexo (IPEDS ADM). Vienen en el mismo
  // universidades.json, unidos por UNITID. M = hombres, W = mujeres.
  APPLCN?: number | null;
  APPLCNM?: number | null;
  APPLCNW?: number | null;
  ADMSSN?: number | null;
  ADMSSNM?: number | null;
  ADMSSNW?: number | null;
  ENRLT?: number | null;
  ENRLM?: number | null;
  ENRLW?: number | null;

  // Becas a alumnos de 1er año a tiempo completo (IPEDS SFA, todos los alumnos juntos,
  // sin separar in-state/out-of-state). _P = % que la recibe, _A = monto promedio.
  /** Cualquier beca: federal, estatal, local o de la universidad. */
  AGRNT_P?: number | null;
  AGRNT_A?: number | null;
  /** Beca de la propia universidad. */
  IGRNT_P?: number | null;
  IGRNT_A?: number | null;
  SAT_AVG?: number | null;
  ADMCON7?: string | null;
  OPENADMP?: string | null;
  PRGMOFR?: number | null;
  CIPTITLE1?: string | null;
  CIPTITLE2?: string | null;
  CIPTITLE3?: string | null;
  CIPTITLE4?: string | null;
  CIPTITLE5?: string | null;
  CIPTITLE6?: string | null;
  ICLEVEL?: string | null;
  /** Orden en el ranking U.S. News (se calcula al cargar): primero las universidades
   *  nacionales (1–49) y luego los liberal arts colleges (1001–1049). null = no rankeada. */
  USNEWS_ORDEN?: number | null;
  /** URL de la calculadora de costo neto de la universidad (College Scorecard NPCURL). */
  NPCURL?: string | null;

  // Costos
  TUITIONFEE_OUT?: number | null;
  TUITIONFEE_IN?: number | null;
  COSTT4_A?: number | null;

  // Componentes del costo de vida (College Scorecard; el año está en public/fuentes_datos.json).
  // En el campus solo ~1,950 universidades los reportan; para el resto se estima con
  // COSTT4_A − TUITIONFEE_IN.
  ROOMBOARD_ON?: number | null;
  OTHEREXPENSE_ON?: number | null;
  BOOKSUPPLY?: number | null;
  /** Viviendo fuera del campus (~3,250 universidades): alojamiento y comida, y otros gastos. */
  ROOMBOARD_OFF?: number | null;
  OTHEREXPENSE_OFF?: number | null;
  /** Viviendo con la familia: solo otros gastos (no paga alojamiento). */
  OTHEREXPENSE_FAM?: number | null;

  // Precio neto promedio general
  NPT4_PRIV?: number | null;
  NPT4_PUB?: number | null;

  // Precio neto por rango de ingreso familiar (1=bajo, 3=medio, 5=alto)
  NPT41_PRIV?: number | null;
  NPT41_PUB?: number | null;
  NPT43_PRIV?: number | null;
  NPT43_PUB?: number | null;
  NPT45_PRIV?: number | null;
  NPT45_PUB?: number | null;

  // Ratio estudiante-facultad
  STUFACR?: number | null;

  // Salarios de egresados
  MD_EARN_WNE_P6?: number | null;
  MD_EARN_WNE_P8?: number | null;
  MD_EARN_WNE_P10?: number | null;
  MD_EARN_WNE_1YR?: number | null;
  MD_EARN_WNE_5YR?: number | null;
  /** Salario 4 años después de graduarse. El más reciente (medido 2022-23, dólares de 2024)
   *  y el que muestra la web oficial de College Scorecard. Se normaliza a número al cargar. */
  MD_EARN_WNE_4YR?: number | null;
  COUNT_WNE_4YR?: number | null;

  // % que supera salario de secundaria
  // OJO: P6/P8/P10 vienen como FRACCIÓN (0.0–1.0), listos para formatPorcentaje().
  // 1YR/5YR vienen como CONTEO CRUDO (numerador), NO como fracción. Hay que dividirlos
  // entre COUNT_WNE_1YR/COUNT_WNE_5YR (el cohorte total) para obtener el porcentaje real.
  // Ver utils/formatters.ts -> formatPorcentajeDesdeConteo()
  GT_THRESHOLD_P6?: number | null;
  GT_THRESHOLD_P8?: number | null;
  GT_THRESHOLD_P10?: number | null;
  GT_THRESHOLD_1YR?: number | null;
  GT_THRESHOLD_5YR?: number | null;
  COUNT_WNE_1YR?: number | null;
  COUNT_WNE_5YR?: number | null;
}