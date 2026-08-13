export interface Universidad {
  /** Identificador estable asignado al cargar la data. Se usa como key de React
   *  para que ordenar/filtrar no obligue a re-renderizar toda la lista. */
  _id?: number;
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

  // Costos
  TUITIONFEE_OUT?: number | null;
  TUITIONFEE_IN?: number | null;
  COSTT4_A?: number | null;

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