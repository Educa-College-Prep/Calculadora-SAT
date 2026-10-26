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

/**
 * Otras palabras con las que alguien buscaría cada carrera (en español e inglés), por código
 * CIP, para el buscador de "Salarios de egresados". El nombre en español y el de Scorecard (en
 * inglés) ya se buscan solos: aquí va lo que no aparece en ninguno de los dos, como "medicina"
 * para Biología (el pre-med) o "programación" para Ciencias de la computación.
 */
export const SINONIMOS_CARRERAS: Record<string, string> = {
  '1107': 'cs informatica programacion software sistemas computacion',
  '1101': 'cs informatica programacion software sistemas',
  '1409': 'hardware computacion sistemas',
  '5212': 'sistemas informatica computacion',
  '2701': 'math estadistica',
  '2705': 'estadistica statistics',
  '1410': 'electronica electrica',
  '1419': 'mecatronica',
  '1408': 'construccion',
  '4506': 'negocios finanzas business administracion',
  '5202': 'negocios business administracion management mba',
  '5201': 'administracion business',
  '5208': 'banca inversiones',
  '4510': 'politica relaciones internacionales derecho gobierno',
  '2601': 'medicina premed pre-med salud',
  '2602': 'bioquimica biologia molecular medicina premed',
  '2604': 'biologia celular medicina premed',
  '2615': 'medicina premed neurociencia biologia',
  '3027': 'biologia humana medicina premed pre-med salud',
  '5111': 'medicina premed pre-med salud',
  '5112': 'medicina',
  '1405': 'biomedica ingenieria medicina',
  '5100': 'medicina premed salud',
  '5138': 'nursing enfermera',
  '4201': 'psychology',
  '2401': 'liberal arts humanidades letras',
  '2301': 'literatura escritura ingles',
  '0901': 'periodismo medios',
  '0909': 'marketing publicidad',
};
