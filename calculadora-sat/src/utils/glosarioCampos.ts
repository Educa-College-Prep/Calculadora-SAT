/**
 * Textos de ayuda para cada campo del dataset. Se muestran en los InfoTooltip.
 * Basado en la documentación técnica oficial de College Scorecard (PDF Sept. 2025).
 */
export const glosarioCampos: Record<string, string> = {
  // Identificación
  CONTROL: 'Tipo de propiedad: Pública (financiada por el estado), Privada sin fines de lucro, o Privada con fines de lucro.',
  ICLEVEL: 'Duración típica del programa principal: 4-Year (licenciatura), 2-Year (asociado) o menos de 2 años (certificado).',

  // Estudiantes
  UGDS: 'Número total de estudiantes de pregrado matriculados actualmente.',
  UGDS_HISP: 'Porcentaje del total de estudiantes de pregrado que se identifican como hispanos.',
  STUFACR: 'Número de estudiantes por cada profesor. Un número más bajo suele indicar clases más pequeñas y atención más personalizada.',

  // Admisiones
  ADM_RATE: 'Porcentaje de solicitantes que fueron aceptados. Un valor bajo indica una universidad más selectiva.',
  SAT_AVG: 'Promedio combinado (Lectura + Matemáticas) del puntaje SAT de los estudiantes admitidos.',
  ADMCON7: 'Qué tan importante es el expediente académico (notas, cursos tomados) en la decisión de admisión.',
  OPENADMP: 'Indica si la universidad acepta prácticamente a cualquier solicitante con diploma de preparatoria, sin importar sus calificaciones.',

  // Costos
  TUITIONFEE_IN: 'Costo de matrícula anual para estudiantes que residen en el mismo estado de la universidad.',
  TUITIONFEE_OUT: 'Costo de matrícula anual para estudiantes que vienen de fuera del estado.',
  COSTT4_A: 'Costo total estimado de un año completo: incluye matrícula, alojamiento, comida, libros y otros gastos.',
  NPT4: 'Precio neto promedio: lo que realmente paga una familia después de restar becas y ayudas financieras al costo total de asistencia.',
  NPT_INGRESO: 'Precio neto promedio para familias en este rango específico de ingresos anuales, después de becas y ayudas.',

  // Programas
  PRGMOFR: 'Cantidad total de programas académicos (carreras) diferentes que ofrece la institución.',

  // Resultados económicos
  MD_EARN: 'Salario mediano (el valor central, no el promedio) de los egresados que trabajan, medido en este punto del tiempo.',
  GT_THRESHOLD: 'Porcentaje de egresados que ganan más que el salario mediano de alguien que solo terminó la preparatoria. Es un indicador de si la carrera "valió la pena" económicamente frente a no ir a la universidad.',
};
