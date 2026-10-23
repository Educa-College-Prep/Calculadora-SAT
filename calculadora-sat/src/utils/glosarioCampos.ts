/**
 * Textos de ayuda para cada campo del dataset. Se muestran en los InfoTooltip.
 * Basado en la documentación técnica oficial de College Scorecard (PDF Sept. 2025).
 */
export const glosarioCampos: Record<string, string> = {
  // Identificación
  CONTROL: 'Tipo de propiedad: Pública (financiada por el estado) o Privada sin fines de lucro. Las privadas con fines de lucro no se incluyen en esta web.',
  ICLEVEL: 'Tipo de grado del programa principal: Grado Bachiller (programa de 4 años) o Grado Associate (programa de 2 años).',

  // Estudiantes
  UGDS: 'Número total de estudiantes de pregrado matriculados actualmente.',
  UGDS_HISP: 'Porcentaje del total de estudiantes de pregrado que se identifican como hispanos.',
  STUFACR: 'Número de estudiantes por cada profesor. Un número más bajo suele indicar clases más pequeñas y atención más personalizada.',

  // Admisiones
  ADM_RATE: 'Porcentaje de solicitantes que fueron aceptados. Un valor bajo indica una universidad más selectiva.',
  SAT_AVG: 'Puntaje SAT promedio de los estudiantes admitidos (escala 400–1600). Incluye a quienes rindieron el ACT, con su puntaje convertido a escala SAT.',
  POSTULANTES: 'Alumnos de primer año que postularon, fueron admitidos y se matricularon. Hombres y mujeres se muestran como porcentaje del total de cada fila.',
  SAT_RANGO: 'Rango intercuartil: el 25% de los alumnos sacó menos que el número de la izquierda y el 25% sacó más que el de la derecha. La mitad central está dentro de la barra. La mediana es el puntaje del alumno que queda justo en el medio.',
  ADMCON7: 'Lo que pide cada universidad sobre el puntaje SAT o ACT para postular, según lo que reporta al gobierno de EE.UU. (IPEDS). Las que no lo informan solo aparecen en "Todos".',

  // Costos
  TUITIONFEE_IN: 'In-state: matrícula anual para estudiantes que residen en el mismo estado de la universidad.',
  TUITIONFEE_OUT: 'Out-of-state: matrícula anual para estudiantes que vienen de otro estado o del extranjero.',
  COSTO_VIDA: 'Gasto anual estimado viviendo en el campus: alojamiento, comida, libros, materiales y otros gastos personales. No incluye la matrícula.',
  COSTO_VIDA_ESTIMADO: 'Gasto anual aproximado en alojamiento, comida, libros y otros gastos. Calculado como el costo total oficial del año menos la matrícula.',
  TUITIONFEE_UNICA: 'Matrícula anual (incluye cuotas obligatorias). Las universidades privadas cobran lo mismo a todos los estudiantes, sin importar el estado donde vivan.',
  COSTT4_A: 'Costo total estimado de un año completo: incluye matrícula, alojamiento, comida, libros y otros gastos.',
  COSTO_TOTAL_ANUAL: 'Matrícula + costo de vida, antes de becas.',
  COSTO_TOTAL_ESENCIAL: 'Matrícula para alumnos de otros estados y del extranjero + costo de vida, antes de becas. Abajo, en "Costos y financiamiento", lo ves según tu perfil.',
  COSTO_APROX_BECA: 'Aproximado: costo total menos la beca típica de la universidad. Solo si la universidad te la otorga; no todos la reciben.',
  NPT4: 'Promedio de alumnos de EE.UU. con ayuda federal. No incluye a estudiantes extranjeros.',
  NPT4_PUB: 'Promedio de residentes del estado con ayuda federal. No incluye a alumnos de otros estados ni extranjeros.',
  NPT_INGRESO: 'Costo anual promedio después de becas, según el ingreso de la familia. "Gratis" = las becas cubren todo el costo.',
  BECAS_1ER_ANIO: 'Becas que no se devuelven, para alumnos de 1er año a tiempo completo (in-state y out-of-state juntos). Los extranjeros no reciben becas federales ni estatales.',

  // Programas

  // Resultados económicos
  MD_EARN_4YR: 'Lo que gana al año el egresado típico, 4 años después de graduarse. Solo cuenta a quienes trabajan y ya no estudian.',
};
