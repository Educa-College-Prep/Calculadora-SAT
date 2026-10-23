/**
 * Nombre en español de cada carrera, por su código CIP de 4 dígitos (el que usa College
 * Scorecard en public/salarios_carreras.json, donde vienen en inglés).
 *
 * DEMO: por ahora solo las 50 más frecuentes, que son ~71% de las carreras con salario. Las
 * demás se muestran en inglés, tal como las publica Scorecard. Se completa a mano: Scorecard
 * usa ~320 carreras de bachiller y casi no cambian de un año a otro.
 *
 * Nombres pensados para estudiantes, como se dicen en Latinoamérica, no traducciones literales
 * del catálogo ("Registered Nursing, Nursing Administration…" → "Enfermería").
 */
export const CARRERAS_ESPANOL: Record<string, string> = {
  '5202': 'Administración de empresas',
  '4201': 'Psicología',
  '5138': 'Enfermería',
  '2601': 'Biología',
  '5203': 'Contabilidad',
  '1312': 'Educación (por nivel: inicial, primaria, secundaria)',
  '0901': 'Comunicación',
  '3105': 'Ciencias del deporte y kinesiología',
  '4301': 'Justicia penal y criminología',
  '4510': 'Ciencia política',
  '2301': 'Literatura inglesa',
  '5214': 'Marketing',
  '2401': 'Estudios generales y humanidades',
  '4511': 'Sociología',
  '5401': 'Historia',
  '5208': 'Finanzas',
  '1101': 'Computación e informática',
  '5007': 'Bellas artes',
  '4407': 'Trabajo social',
  '1313': 'Educación (por materia)',
  '1107': 'Ciencias de la computación',
  '4506': 'Economía',
  '1419': 'Ingeniería mecánica',
  '2701': 'Matemáticas',
  '5004': 'Diseño',
  '0301': 'Recursos naturales y conservación',
  '5005': 'Teatro',
  '5009': 'Música',
  '1410': 'Ingeniería eléctrica y electrónica',
  '5107': 'Administración de salud',
  '5201': 'Negocios',
  '4005': 'Química',
  '1609': 'Lenguas romances (español, francés…)',
  '1408': 'Ingeniería civil',
  '5109': 'Tecnología médica y terapias',
  '5122': 'Salud pública',
  '5102': 'Fonoaudiología',
  '3099': 'Estudios interdisciplinarios',
  '1310': 'Educación especial',
  '4502': 'Antropología',
  '0909': 'Publicidad y relaciones públicas',
  '5210': 'Recursos humanos',
  '0904': 'Periodismo',
  '5100': 'Ciencias de la salud',
  '1409': 'Ingeniería de computadoras',
  '1907': 'Desarrollo humano y familia',
  '0907': 'Radio, televisión y medios digitales',
  '5212': 'Sistemas de información',
  '1407': 'Ingeniería química',
  '5213': 'Métodos cuantitativos de gestión',
};
