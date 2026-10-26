/**
 * Descripción breve de cada universidad para "Sobre la universidad" en la ficha: el comienzo
 * de su artículo en Wikipedia en inglés, traducido al español y resumido a mano (2 o 3
 * oraciones). Se dejaron fuera las cifras de alumnos y otros números que cambian cada año:
 * la ficha ya muestra los datos oficiales al lado y no deben contradecirse.
 *
 * Solo están las universidades que más ven nuestros alumnos: las del ranking de U.S. News y
 * las que tienen videos de Educa. Las demás muestran solo el párrafo armado con los datos.
 *
 * Licencia: el texto de Wikipedia es CC BY-SA 4.0. Por eso la ficha cita el artículo, dice
 * que es una traducción resumida y enlaza la licencia.
 *
 * La clave es el UNITID. `articulo` es lo que va después de "en.wikipedia.org/wiki/".
 * Este archivo se carga recién al abrir una ficha (import dinámico): no pesa en la portada.
 */
export interface DescripcionUniversidad {
  texto: string;
  articulo: string;
}

export const DESCRIPCIONES_UNIVERSIDADES: Record<number, DescripcionUniversidad> = {
  // Massachusetts Institute of Technology
  166683: {
    articulo: 'Massachusetts_Institute_of_Technology',
    texto: 'El Instituto Tecnológico de Massachusetts (MIT) es una universidad privada de investigación en Cambridge, Massachusetts. Es uno de los institutos de tecnología de Estados Unidos dedicados al avance de la ciencia y la ingeniería.',
  },
  // Princeton University
  186131: {
    articulo: 'Princeton_University',
    texto: 'Princeton es una universidad privada de investigación de la Ivy League en Princeton, Nueva Jersey. Fundada en 1746 como College of New Jersey, es la cuarta institución de educación superior más antigua de Estados Unidos y uno de los nueve colleges coloniales creados antes de la Revolución estadounidense.',
  },
  // Harvard University
  166027: {
    articulo: 'Harvard_University',
    texto: 'Harvard es una universidad privada de investigación de la Ivy League en Cambridge, Massachusetts. Fundada en 1636 y llamada así en honor a su primer benefactor, el clérigo John Harvard, es la institución de educación superior más antigua de Estados Unidos. Su influencia, su riqueza y sus rankings la han convertido en una de las universidades más prestigiosas del mundo.',
  },
  // Yale University
  130794: {
    articulo: 'Yale_University',
    texto: 'Yale es una universidad privada de investigación de la Ivy League en New Haven, Connecticut. Fundada en 1701, es la tercera institución de educación superior más antigua de Estados Unidos y uno de los nueve colleges coloniales creados antes de la Revolución estadounidense.',
  },
  // California Institute of Technology
  110404: {
    articulo: 'California_Institute_of_Technology',
    texto: 'El Instituto Tecnológico de California (Caltech) es una universidad privada de investigación en Pasadena, California. Es responsable de muchos avances científicos modernos y forma parte de un pequeño grupo de institutos de tecnología de Estados Unidos dedicados a la enseñanza de las ciencias puras y aplicadas.',
  },
  // Stanford University
  243744: {
    articulo: 'Stanford_University',
    texto: 'Stanford es una universidad privada de investigación en Stanford, California. Fue fundada en 1885 por el magnate ferroviario Leland Stanford y su esposa, Jane, en memoria de su único hijo, Leland Stanford Jr., que murió de tifoidea a los 15 años.',
  },
  // University of Pennsylvania
  215062: {
    articulo: 'University_of_Pennsylvania',
    texto: 'La Universidad de Pensilvania (UPenn) es una universidad privada de investigación de la Ivy League en Filadelfia. Fue creada en 1755 por su primer presidente, Benjamin Franklin, que buscaba una institución que formara líderes para la academia, los negocios y el servicio público. Es uno de los nueve colleges coloniales del país.',
  },
  // Duke University
  198419: {
    articulo: 'Duke_University',
    texto: 'Duke es una universidad privada de investigación en Durham, Carolina del Norte. Fue fundada en 1838 por metodistas y cuáqueros, y se mudó a Durham en 1892. En 1924, el industrial James Buchanan Duke creó la fundación Duke Endowment y la institución tomó su nombre actual en honor a su padre, Washington Duke.',
  },
  // Johns Hopkins University
  162928: {
    articulo: 'Johns_Hopkins_University',
    texto: 'Johns Hopkins es una universidad privada de investigación en Baltimore, Maryland. Abrió en 1876 siguiendo el modelo de las instituciones de investigación europeas y se la considera la primera universidad de investigación de Estados Unidos.',
  },
  // Northwestern University
  147767: {
    articulo: 'Northwestern_University',
    texto: 'Northwestern es una universidad privada de investigación en Evanston, Illinois, junto a Chicago. Fundada en 1851, es la universidad más antigua de Illinois. Fue miembro fundador de la Big Ten Conference en 1896 y entró a la Asociación de Universidades Americanas (AAU) en 1917.',
  },
  // University of Chicago
  144050: {
    articulo: 'University_of_Chicago',
    texto: 'La Universidad de Chicago (UChicago) es una universidad privada de investigación en el barrio de Hyde Park, en Chicago, Illinois.',
  },
  // Columbia University in the City of New York
  190150: {
    articulo: 'Columbia_University',
    texto: 'Columbia es una universidad privada de investigación de la Ivy League en Nueva York. Fundada en 1754 como King’s College por cédula real del rey Jorge II de Gran Bretaña, es la institución de educación superior más antigua de Nueva York y la quinta más antigua de Estados Unidos.',
  },
  // Dartmouth College
  182670: {
    articulo: 'Dartmouth_College',
    texto: 'Dartmouth es una universidad privada de investigación de la Ivy League en Hanover, Nuevo Hampshire. Fundada en 1769 por Eleazar Wheelock y Samson Occom, es uno de los nueve colleges coloniales creados antes de la Revolución estadounidense.',
  },
  // Carnegie Mellon University
  211440: {
    articulo: 'Carnegie_Mellon_University',
    texto: 'Carnegie Mellon (CMU) es una universidad privada de investigación en Pittsburgh, Pensilvania. Andrew Carnegie la fundó en 1900 como Carnegie Technical Schools, y en 1967 tomó su nombre actual al fusionarse con el Mellon Institute of Industrial Research.',
  },
  // Cornell University
  190415: {
    articulo: 'Cornell_University',
    texto: 'Cornell es una universidad privada de investigación de la Ivy League en Ithaca, Nueva York. Fue fundada en 1865 por el filántropo Ezra Cornell y el historiador Andrew Dickson White, y desde el inicio fue mixta y laica. Tiene alumnos de los 50 estados y de unos 130 países.',
  },
  // Brown University
  217156: {
    articulo: 'Brown_University',
    texto: 'Brown es una universidad privada de investigación de la Ivy League en Providence, Rhode Island. Fundada en 1764, es la séptima institución de educación superior más antigua de Estados Unidos y fue el primer college del país en establecer que la admisión y la enseñanza serían iguales para todos, sin importar su religión.',
  },
  // Rice University
  227757: {
    articulo: 'Rice_University',
    texto: 'Rice es una universidad privada de investigación en Houston, Texas, fundada en 1912. Tiene ocho escuelas: arquitectura, negocios, estudios continuos, ingeniería, humanidades, música, ciencias naturales y ciencias sociales.',
  },
  // Vanderbilt University
  221999: {
    articulo: 'Vanderbilt_University',
    texto: 'Vanderbilt es una universidad privada de investigación en Nashville, Tennessee. Fundada en 1873, lleva el nombre del magnate Cornelius Vanderbilt, que donó el capital inicial con la esperanza de ayudar a sanar las heridas de la Guerra Civil. Es miembro fundador de la Southeastern Conference.',
  },
  // Washington University in St Louis
  179867: {
    articulo: 'Washington_University_in_St._Louis',
    texto: 'La Universidad Washington en San Luis (WashU) es una universidad privada de investigación en San Luis, Misuri. Fundada en 1853 y llamada así por George Washington, tiene 10 escuelas y ofrece más de 150 programas de pregrado.',
  },
  // University of California-Berkeley
  110635: {
    articulo: 'University_of_California%2C_Berkeley',
    texto: 'La Universidad de California en Berkeley es una universidad pública de investigación en Berkeley, California. Fundada en 1868, es el primer campus del sistema de la Universidad de California y lleva el nombre del filósofo George Berkeley.',
  },
  // University of California-Los Angeles
  110662: {
    articulo: 'University_of_California%2C_Los_Angeles',
    texto: 'La Universidad de California en Los Ángeles (UCLA) es una universidad pública de investigación en el barrio de Westwood, en Los Ángeles. Nació en 1881 como sede sur de una escuela de maestros y se unió a la Universidad de California en 1919: es el segundo campus más antiguo del sistema, después de Berkeley.',
  },
  // University of Notre Dame
  152080: {
    articulo: 'University_of_Notre_Dame',
    texto: 'Notre Dame es una universidad católica privada de investigación en Notre Dame, Indiana. Fue fundada en 1842 por la Congregación de la Santa Cruz. Su campus principal tiene lugares emblemáticos como la Cúpula Dorada, la Basílica del Sagrado Corazón y el Notre Dame Stadium.',
  },
  // Emory University
  139658: {
    articulo: 'Emory_University',
    texto: 'Emory es una universidad privada de investigación en Atlanta, Georgia. Fue fundada en 1836 como Emory College por la Iglesia Metodista. Su campus principal está en Druid Hills, a unos 6 km del centro de Atlanta.',
  },
  // Georgetown University
  131496: {
    articulo: 'Georgetown_University',
    texto: 'Georgetown es una universidad jesuita privada de investigación en Washington D. C. Fundada en 1789 por el obispo John Carroll, es la institución católica de educación superior más antigua de Estados Unidos y la universidad más antigua de la capital.',
  },
  // University of Michigan-Ann Arbor
  170976: {
    articulo: 'University_of_Michigan',
    texto: 'La Universidad de Míchigan es una universidad pública de investigación en Ann Arbor, Míchigan. Fundada en 1817, es la institución de educación superior más antigua del estado, una de las primeras universidades de investigación del país y miembro fundador de la Asociación de Universidades Americanas (AAU).',
  },
  // University of Virginia-Main Campus
  234076: {
    articulo: 'University_of_Virginia',
    texto: 'La Universidad de Virginia es una universidad pública de investigación en Charlottesville, Virginia. Fue fundada en 1819 por Thomas Jefferson, que diseñó sus primeros planes de estudio y su arquitectura original. Su campus histórico, la Academical Village, es Patrimonio de la Humanidad de la UNESCO.',
  },
  // University of North Carolina at Chapel Hill
  199120: {
    articulo: 'University_of_North_Carolina_at_Chapel_Hill',
    texto: 'La Universidad de Carolina del Norte en Chapel Hill es una universidad pública de investigación. Creada en 1789, empezó a recibir alumnos en 1795, lo que la hace una de las universidades públicas más antiguas de Estados Unidos.',
  },
  // University of Southern California
  123961: {
    articulo: 'University_of_Southern_California',
    texto: 'La Universidad del Sur de California (USC) es una universidad privada de investigación en Los Ángeles. Fundada en 1880 por Robert M. Widney, es la universidad privada de investigación más antigua de California.',
  },
  // Georgia Institute of Technology-Main Campus
  139755: {
    articulo: 'Georgia_Tech',
    texto: 'El Instituto Tecnológico de Georgia (Georgia Tech) es una universidad pública de investigación y un instituto de tecnología en Atlanta, Georgia. Fundado en 1885, es la institución con más alumnos del sistema universitario de Georgia y tiene sedes en Savannah y en Metz, Francia.',
  },
  // University of California-San Diego
  110680: {
    articulo: 'University_of_California%2C_San_Diego',
    texto: 'La Universidad de California en San Diego (UC San Diego) es una universidad pública de investigación en el barrio de La Jolla, en San Diego. Fundada en 1960, es el campus más al sur de los diez de la Universidad de California y está junto a la costa del Pacífico.',
  },
  // Boston College
  164924: {
    articulo: 'Boston_College',
    texto: 'Boston College es una universidad católica y jesuita, privada y de investigación, en Chestnut Hill, Massachusetts. Fue fundada en 1863 por la Compañía de Jesús y es una de las universidades católicas más grandes de Estados Unidos.',
  },
  // New York University
  193900: {
    articulo: 'New_York_University',
    texto: 'La Universidad de Nueva York (NYU) es una universidad privada de investigación en la ciudad de Nueva York. Fundada en 1831, tiene su campus principal en Greenwich Village, alrededor de Washington Square Park. Es una de las universidades privadas más grandes del país y una de las que más postulaciones recibe.',
  },
  // Tufts University
  168148: {
    articulo: 'Tufts_University',
    texto: 'Tufts es una universidad privada de investigación en Medford y Somerville, Massachusetts, cerca de Boston. Fue fundada en 1852 como Tufts College. Fue un pequeño college de artes liberales hasta los años 70, cuando se convirtió en una universidad de investigación con doctorados en varias áreas.',
  },
  // Boston University
  164988: {
    articulo: 'Boston_University',
    texto: 'La Universidad de Boston (BU) es una universidad privada de investigación en Boston, Massachusetts. Fue fundada en 1839 por un grupo de metodistas y se estableció en Boston en 1869. Es miembro de la Asociación de Universidades Americanas (AAU).',
  },
  // University of California-Davis
  110644: {
    articulo: 'University_of_California%2C_Davis',
    texto: 'La Universidad de California en Davis (UC Davis) es una universidad pública de investigación en Davis, California. Es el campus más al norte de la Universidad de California. Nació en 1905 como sede agrícola del sistema y se convirtió en campus en 1959.',
  },
  // University of California-Irvine
  110653: {
    articulo: 'University_of_California%2C_Irvine',
    texto: 'La Universidad de California en Irvine (UC Irvine) es una universidad pública de investigación en Irvine, California, y uno de los diez campus de la Universidad de California. Ofrece 87 carreras de pregrado y es miembro de la Asociación de Universidades Americanas (AAU) desde 1996.',
  },
  // University of Florida
  134130: {
    articulo: 'University_of_Florida',
    texto: 'La Universidad de Florida es una universidad pública de investigación en Gainesville, Florida, y una de las principales del sistema universitario del estado. Sus orígenes se remontan a 1853 y funciona en su campus de Gainesville desde 1906.',
  },
  // University of Illinois Urbana-Champaign
  145637: {
    articulo: 'University_of_Illinois_Urbana-Champaign',
    texto: 'La Universidad de Illinois en Urbana-Champaign es una universidad pública de investigación en Illinois. Fundada en 1867, es el campus original y principal del sistema de la Universidad de Illinois, y una de las universidades públicas con más alumnos de Estados Unidos.',
  },
  // The University of Texas at Austin
  228778: {
    articulo: 'University_of_Texas_at_Austin',
    texto: 'La Universidad de Texas en Austin (UT Austin) es una universidad pública de investigación en Austin, Texas. Fundada en 1883, es la institución principal y la más grande del sistema de la Universidad de Texas.',
  },
  // University of Wisconsin-Madison
  240444: {
    articulo: 'University_of_Wisconsin%E2%80%93Madison',
    texto: 'La Universidad de Wisconsin-Madison es una universidad pública de investigación en Madison, Wisconsin. Fue fundada en 1848, cuando Wisconsin se convirtió en estado, y es el campus principal del sistema de la Universidad de Wisconsin. Su campus está a orillas del lago Mendota.',
  },
  // Wake Forest University
  199847: {
    articulo: 'Wake_Forest_University',
    texto: 'Wake Forest es una universidad privada de investigación en Winston-Salem, Carolina del Norte. Fue fundada por cristianos bautistas en 1834 y su nombre viene de su ubicación original, en Wake Forest. Desde 1956 está en Winston-Salem.',
  },
  // Northeastern University
  167358: {
    articulo: 'Northeastern_University',
    texto: 'Northeastern es una universidad privada de investigación con campus principal en Boston, Massachusetts. Fue fundada en 1898 por la YMCA de Boston y obtuvo el rango de universidad en 1922.',
  },
  // Villanova University
  216597: {
    articulo: 'Villanova_University',
    texto: 'Villanova es una universidad católica privada de investigación en Villanova, Pensilvania. Fue fundada en 1842 por la Orden de San Agustín y es la universidad católica más antigua de Pensilvania.',
  },
  // Case Western Reserve University
  201645: {
    articulo: 'Case_Western_Reserve_University',
    texto: 'Case Western Reserve (CWRU) es una universidad privada de investigación en Cleveland, Ohio. Nació en 1967 de la unión de Western Reserve University, fundada en 1826, y el Case Institute of Technology, fundado en 1880. Tiene alumnos de los 50 estados y de más de 100 países.',
  },
  // Lehigh University
  213543: {
    articulo: 'Lehigh_University',
    texto: 'Lehigh es una universidad privada de investigación en Bethlehem, Pensilvania. Fue fundada en 1865 por el empresario Asa Packer y está clasificada entre las universidades con actividad de investigación muy alta (R1).',
  },
  // Ohio State University-Main Campus
  204796: {
    articulo: 'Ohio_State_University',
    texto: 'La Universidad Estatal de Ohio (Ohio State) es una universidad pública de investigación en Columbus, Ohio. Fundada en 1870, es la institución principal del sistema universitario de Ohio.',
  },
  // Rutgers University-New Brunswick
  186380: {
    articulo: 'Rutgers_University%E2%80%93New_Brunswick',
    texto: 'Rutgers–New Brunswick es el campus más grande y más antiguo de la Universidad Rutgers, una universidad pública de investigación de Nueva Jersey. Está en New Brunswick y Piscataway, y se compone de varios campus más pequeños: College Avenue, Busch, Livingston, Cook y Douglass.',
  },
  // University of California-Santa Barbara
  110705: {
    articulo: 'University_of_California%2C_Santa_Barbara',
    texto: 'La Universidad de California en Santa Bárbara (UC Santa Barbara) es una universidad pública de investigación en el condado de Santa Bárbara, California. Nació en 1891 como escuela de maestros y se unió a la Universidad de California en 1944: es el tercer campus más antiguo del sistema, después de Berkeley y UCLA.',
  },
  // University of Maryland-College Park
  163286: {
    articulo: 'University_of_Maryland%2C_College_Park',
    texto: 'La Universidad de Maryland en College Park (UMD) es una universidad pública de investigación en College Park, Maryland, cerca de Washington D. C. Fundada en 1856, es la institución principal del sistema universitario de Maryland.',
  },
  // University of Rochester
  195030: {
    articulo: 'University_of_Rochester',
    texto: 'La Universidad de Rochester es una universidad privada de investigación en Rochester, Nueva York. Fue fundada en 1850 y desde 1930 está en su campus actual, junto al río Genesee. Es el mayor empleador privado del norte del estado de Nueva York.',
  },
  // University of Washington-Seattle Campus
  236948: {
    articulo: 'University_of_Washington',
    texto: 'La Universidad de Washington es una universidad pública de investigación en Seattle, Washington. Fundada en 1861, es una de las universidades más antiguas de la costa oeste de Estados Unidos.',
  },
  // Williams College
  168342: {
    articulo: 'Williams_College',
    texto: 'Williams es un college privado de artes liberales en Williamstown, Massachusetts. Fue fundado en 1793 como college para hombres, con fondos de la herencia de Ephraim Williams.',
  },
  // Amherst College
  164465: {
    articulo: 'Amherst_College',
    texto: 'Amherst es un college privado de artes liberales en Amherst, Massachusetts. Fundado en 1821, es la tercera institución de educación superior más antigua de Massachusetts. Nació como college para hombres y es mixto desde 1975.',
  },
  // Bowdoin College
  161004: {
    articulo: 'Bowdoin_College',
    texto: 'Bowdoin es un college privado de artes liberales en Brunswick, Maine, fundado en 1794.',
  },
  // Claremont McKenna College
  112260: {
    articulo: 'Claremont_McKenna_College',
    texto: 'Claremont McKenna (CMC) es un college privado de artes liberales en Claremont, California. Es uno de los siete miembros del consorcio de los Claremont Colleges.',
  },
  // Pomona College
  121345: {
    articulo: 'Pomona_College',
    texto: 'Pomona es un college privado en Claremont, California. Fue fundado en 1887 por un grupo de congregacionalistas que querían crear un “college al estilo de Nueva Inglaterra” en el sur de California. En 1925 fue el miembro fundador de los Claremont Colleges, un consorcio de colleges vecinos.',
  },
  // Swarthmore College
  216287: {
    articulo: 'Swarthmore_College',
    texto: 'Swarthmore es un college privado de artes liberales en Swarthmore, Pensilvania. Fundado en 1864 por cuáqueros, fue uno de los primeros colleges mixtos de Estados Unidos. Desde 1906 no tiene afiliación religiosa.',
  },
  // United States Naval Academy
  164155: {
    articulo: 'United_States_Naval_Academy',
    texto: 'La Academia Naval de Estados Unidos es una academia militar federal junto a Annapolis, Maryland. Fundada en 1845, forma a los futuros oficiales de la Marina y del Cuerpo de Marines. Todo su campus, conocido como “the Yard”, es Monumento Histórico Nacional.',
  },
  // Harvey Mudd College
  115409: {
    articulo: 'Harvey_Mudd_College',
    texto: 'Harvey Mudd (HMC) es un college privado de artes liberales en Claremont, California, enfocado en ciencias e ingeniería. Forma parte de los Claremont Colleges, que comparten terrenos y recursos, y otorga el título de Bachelor of Science.',
  },
  // United States Military Academy
  197036: {
    articulo: 'United_States_Military_Academy',
    texto: 'La Academia Militar de Estados Unidos, conocida como West Point, está en West Point, Nueva York, y forma a los futuros oficiales del Ejército. Fundada en 1802, es la más antigua de las cinco academias militares del país. Está sobre el río Hudson, a unos 80 km de la ciudad de Nueva York.',
  },
  // Wellesley College
  168218: {
    articulo: 'Wellesley_College',
    texto: 'Wellesley es un college privado de artes liberales para mujeres en Wellesley, Massachusetts. Fue fundado en 1870 por Henry y Pauline Durant y es uno de los Seven Sisters, el grupo histórico de colleges para mujeres del noreste de Estados Unidos.',
  },
  // United States Air Force Academy
  128328: {
    articulo: 'United_States_Air_Force_Academy',
    texto: 'La Academia de la Fuerza Aérea de Estados Unidos (USAFA) está junto a Colorado Springs, Colorado, y forma a los futuros oficiales de la Fuerza Aérea y de la Fuerza Espacial. Sus graduados reciben un Bachelor of Science y salen como subtenientes.',
  },
  // Vassar College
  197133: {
    articulo: 'Vassar_College',
    texto: 'Vassar es un college privado de artes liberales en Poughkeepsie, Nueva York. Fundado en 1861 por Matthew Vassar, fue la segunda institución de Estados Unidos en dar títulos universitarios a mujeres; es mixto desde 1969. Ofrece más de cincuenta carreras.',
  },
  // Washington and Lee University
  234207: {
    articulo: 'Washington_and_Lee_University',
    texto: 'Washington and Lee es un college privado de artes liberales en Lexington, Virginia. Fundado en 1749 como Augusta Academy, es una de las instituciones de educación superior más antiguas de Estados Unidos.',
  },
  // Hamilton College
  191515: {
    articulo: 'Hamilton_College',
    texto: 'Hamilton es un college privado de artes liberales en Clinton, Nueva York. Fue fundado en 1812 en honor a Alexander Hamilton, uno de sus primeros fideicomisarios, y es mixto desde 1978.',
  },
  // Wesleyan University
  130697: {
    articulo: 'Wesleyan_University',
    texto: 'Wesleyan es una universidad privada de artes liberales en Middletown, Connecticut. Fue fundada en 1831 como college para hombres de la Iglesia Metodista y con el tiempo se convirtió en una institución laica y mixta.',
  },
  // Carleton College
  173258: {
    articulo: 'Carleton_College',
    texto: 'Carleton es un college privado de artes liberales en Northfield, Minnesota, fundado en 1866. Su campus principal está junto al Cowling Arboretum, un bosque de unas 320 hectáreas que forma parte del campus.',
  },
  // Davidson College
  198385: {
    articulo: 'Davidson_College',
    texto: 'Davidson es un college privado de artes liberales en Davidson, Carolina del Norte. Fue fundado en 1837 por presbiterianos y lleva el nombre del general William Lee Davidson, héroe de la Guerra de Independencia.',
  },
  // Grinnell College
  153384: {
    articulo: 'Grinnell_College',
    texto: 'Grinnell es un college privado de artes liberales en Grinnell, Iowa, fundado en 1846. Tiene un “currículo abierto”: los alumnos no tienen que seguir una lista fija de cursos.',
  },
  // Barnard College
  189097: {
    articulo: 'Barnard_College',
    texto: 'Barnard es un college privado de artes liberales para mujeres en la ciudad de Nueva York, afiliado a la Universidad de Columbia. Fue fundado en 1889 y es uno de los Seven Sisters, el grupo histórico de colleges para mujeres del noreste de Estados Unidos.',
  },
  // Middlebury College
  230959: {
    articulo: 'Middlebury_College',
    texto: 'Middlebury es un college privado de artes liberales en Middlebury, Vermont. Fundado en 1800, fue el primer college o universidad en funcionar en Vermont.',
  },
  // University of Richmond
  233374: {
    articulo: 'University_of_Richmond',
    texto: 'La Universidad de Richmond es un college privado de artes liberales en Richmond, Virginia, centrado sobre todo en el pregrado y con vida en el campus. Tiene cinco escuelas, entre ellas la de Negocios Robins y la de Estudios de Liderazgo Jepson.',
  },
  // Colby College
  161086: {
    articulo: 'Colby_College',
    texto: 'Colby es un college privado de artes liberales en Waterville, Maine. Fue fundado en 1813 y lleva el nombre del filántropo Gardner Colby. Tiene alumnos de más de 45 estados y 80 países.',
  },
  // Colgate University
  190099: {
    articulo: 'Colgate_University',
    texto: 'Colgate es un college privado de artes liberales en Hamilton, Nueva York. Fue fundado en 1819 como sociedad educativa bautista y lleva su nombre actual desde 1890.',
  },
  // College of the Holy Cross
  166124: {
    articulo: 'College_of_the_Holy_Cross',
    texto: 'Holy Cross es un college jesuita privado de artes liberales en Worcester, Massachusetts. Fundado en 1843, fue el primer college católico de Nueva Inglaterra y es una de las instituciones católicas de educación superior más antiguas de Estados Unidos.',
  },
  // Smith College
  167835: {
    articulo: 'Smith_College',
    texto: 'Smith es un college privado de artes liberales para mujeres en Northampton, Massachusetts, fundado en 1871. Es uno de los Seven Sisters y forma parte del Five College Consortium: sus alumnas pueden tomar clases en Amherst, Mount Holyoke, Hampshire y la Universidad de Massachusetts Amherst.',
  },
  // Bates College
  160977: {
    articulo: 'Bates_College',
    texto: 'Bates es un college privado de artes liberales en Lewiston, Maine. Además de su campus, tiene una reserva natural de unas 240 hectáreas y un centro costero.',
  },
  // Haverford College
  212911: {
    articulo: 'Haverford_College',
    texto: 'Haverford es un college privado de artes liberales en Haverford, Pensilvania. Fue fundado en 1833 por cuáqueros como college para hombres; empezó a aceptar alumnos no cuáqueros en 1849 y mujeres en 1980.',
  },
  // Macalester College
  173902: {
    articulo: 'Macalester_College',
    texto: 'Macalester es un college privado de artes liberales en Saint Paul, Minnesota, fundado en 1874. Solo ofrece pregrado y pone énfasis en lo internacional, la diversidad cultural y el servicio a la sociedad.',
  },
  // Bucknell University
  211291: {
    articulo: 'Bucknell_University',
    texto: 'Bucknell es un college privado de artes liberales en Lewisburg, Pensilvania, fundado en 1846. Tiene un College de Artes y Ciencias, un College de Administración y un College de Ingeniería, con 65 carreras.',
  },
  // Lafayette College
  213385: {
    articulo: 'Lafayette_College',
    texto: 'Lafayette es un college privado de artes liberales en Easton, Pensilvania. Fue fundado en 1826 y lleva el nombre del marqués de Lafayette, héroe de la Revolución estadounidense.',
  },
  // Bryn Mawr College
  211273: {
    articulo: 'Bryn_Mawr_College',
    texto: 'Bryn Mawr es un college privado de artes liberales para mujeres en Bryn Mawr, Pensilvania. Fundado por cuáqueros en 1885, es uno de los Seven Sisters y fue uno de los primeros colleges para mujeres de Estados Unidos en ofrecer doctorados.',
  },
  // Denison University
  202523: {
    articulo: 'Denison_University',
    texto: 'Denison es un college privado de artes liberales en Granville, Ohio. Fundado en 1831, es uno de los primeros colleges del antiguo Territorio del Noroeste y ofrece 65 programas académicos.',
  },
  // Trinity College
  130590: {
    articulo: 'Trinity_College_(Connecticut)',
    texto: 'Trinity es un college privado de artes liberales en Hartford, Connecticut. Fundado en 1823, es el segundo college más antiguo del estado y es mixto desde 1969. Ofrece 41 carreras.',
  },
  // Colorado College
  126678: {
    articulo: 'Colorado_College',
    texto: 'Colorado College es un college privado de artes liberales en Colorado Springs, Colorado. Fue fundado en 1874 por Thomas Nelson Haskell en memoria de su hija y ofrece 42 carreras.',
  },
  // Franklin and Marshall College
  212577: {
    articulo: 'Franklin_%26_Marshall_College',
    texto: 'Franklin & Marshall (F&M) es un college privado de artes liberales en Lancaster, Pensilvania. Fundado en 1787, es uno de los colleges más antiguos de Estados Unidos y lleva el nombre de Benjamin Franklin, que le dio su primera donación, y de John Marshall.',
  },
  // Mount Holyoke College
  166939: {
    articulo: 'Mount_Holyoke_College',
    texto: 'Mount Holyoke es un college privado de artes liberales para mujeres en South Hadley, Massachusetts. Fundado en 1837 por la pionera de la educación femenina Mary Lyon, es el más antiguo de los Seven Sisters y forma parte del Five College Consortium.',
  },
  // Spelman College
  141060: {
    articulo: 'Spelman_College',
    texto: 'Spelman es un college privado de artes liberales para mujeres en Atlanta, Georgia, históricamente afroamericano. Fundado en 1881, es la institución privada de artes liberales para mujeres afroamericanas más antigua del país.',
  },
  // Occidental College
  120254: {
    articulo: 'Occidental_College',
    texto: 'Occidental es un college privado de artes liberales en Los Ángeles, California. Fue fundado en 1887 y es uno de los colleges de artes liberales más antiguos de la costa oeste de Estados Unidos.',
  },
  // Scripps College
  123165: {
    articulo: 'Scripps_College',
    texto: 'Scripps es un college privado de artes liberales para mujeres en Claremont, California. Fue fundado en 1926 como miembro de los Claremont Colleges, con el aporte de la periodista y filántropa Ellen Browning Scripps.',
  },
  // Trinity University
  229267: {
    articulo: 'Trinity_University',
    texto: 'Trinity es un college privado de artes liberales en San Antonio, Texas. Fue fundado en 1869 como institución mixta por presbiterianos y está en San Antonio desde 1942.',
  },
  // Kenyon College
  203535: {
    articulo: 'Kenyon_College',
    texto: 'Kenyon es un college privado de artes liberales en Gambier, Ohio. Fundado en 1824, es la institución privada de educación superior más antigua de Ohio. Ofrece más de 50 carreras, menciones y concentraciones, y permite diseñar una carrera propia.',
  },
  // Skidmore College
  195526: {
    articulo: 'Skidmore_College',
    texto: 'Skidmore es un college privado de artes liberales en Saratoga Springs, Nueva York. Sus alumnos estudian un Bachelor of Arts o un Bachelor of Science en más de 60 áreas.',
  },
  // Soka University of America
  399911: {
    articulo: 'Soka_University_of_America',
    texto: 'Soka University of America (SUA) es un college privado de artes liberales en Aliso Viejo, California, en su campus actual desde 2001. Su plan de estudios es laico y pone énfasis en la paz, los derechos humanos y la convivencia con la naturaleza.',
  },
  // Pitzer College
  121257: {
    articulo: 'Pitzer_College',
    texto: 'Pitzer es un college privado de artes liberales en Claremont, California. Fue fundado en 1963 como college para mujeres dentro de los Claremont Colleges y es mixto desde 1970.',
  },
  // Union College
  196866: {
    articulo: 'Union_College',
    texto: 'Union es un college privado de artes liberales en Schenectady, Nueva York. Fundado en 1795, fue la primera institución de educación superior aprobada por el estado de Nueva York. Además de las artes liberales, ofrece carreras de ingeniería acreditadas por ABET.',
  },
  // Wabash College
  152673: {
    articulo: 'Wabash_College',
    texto: 'Wabash es un college privado de artes liberales para hombres en Crawfordsville, Indiana. Fue fundado en 1832 por un grupo de graduados de Dartmouth y líderes del Medio Oeste.',
  },
  // Connecticut College
  128902: {
    articulo: 'Connecticut_College',
    texto: 'Connecticut College (Conn) es un college privado de artes liberales en New London, Connecticut. Fue fundado en 1911 como el único college para mujeres del estado y es mixto desde 1969.',
  },
  // Hillsdale College
  170286: {
    articulo: 'Hillsdale_College',
    texto: 'Hillsdale es un college cristiano privado de artes liberales en Hillsdale, Míchigan. Fue fundado en 1844 y admitió mujeres desde el principio: es la segunda institución mixta más antigua de Estados Unidos.',
  },
  // DePauw University
  150400: {
    articulo: 'DePauw_University',
    texto: 'DePauw es un college privado de artes liberales en Greencastle, Indiana. Fue fundado en 1837 con raíces metodistas, pero abierto a todas las religiones, y lleva su nombre actual desde 1884.',
  },
  // Rhodes College
  221351: {
    articulo: 'Rhodes_College',
    texto: 'Rhodes es un college privado de artes liberales en Memphis, Tennessee, históricamente afiliado a la Iglesia Presbiteriana. Su campus de estilo gótico está en el barrio histórico de Midtown, en Memphis.',
  },
  // St Lawrence University
  195216: {
    articulo: 'St._Lawrence_University',
    texto: 'St. Lawrence (SLU) es un college privado de artes liberales en Canton, Nueva York.',
  },
  // St Olaf College
  174844: {
    articulo: 'St._Olaf_College',
    texto: 'St. Olaf es un college privado de artes liberales en Northfield, Minnesota. Fue fundado en 1874 por pastores y agricultores noruego-estadounidenses y está afiliado a la Iglesia Evangélica Luterana en América.',
  },
  // The University of the South
  221519: {
    articulo: 'Sewanee%3A_The_University_of_the_South',
    texto: 'La Universidad del Sur, conocida como Sewanee, es un college privado episcopal de artes liberales en Sewanee, Tennessee. Su campus ocupa más de 5,000 hectáreas de montaña sobre la meseta de Cumberland.',
  },
  // Pepperdine University
  121150: {
    articulo: 'Pepperdine_University',
    texto: 'Pepperdine es una universidad privada de investigación afiliada a las Iglesias de Cristo, con campus principal cerca de Malibú, California, frente al océano Pacífico. Fue fundada en 1937 por el empresario George Pepperdine y tiene sedes de posgrado en Estados Unidos, América Latina y Europa.',
  },
  // University of Connecticut
  129020: {
    articulo: 'University_of_Connecticut',
    texto: 'La Universidad de Connecticut (UConn) es una universidad pública de investigación con campus principal en Storrs, Connecticut. Fue fundada en 1881 como escuela agrícola y lleva su nombre actual desde 1939. En los años 60 creó UConn Health, con sus escuelas de medicina y odontología.',
  },
  // George Washington University
  131469: {
    articulo: 'George_Washington_University',
    texto: 'La Universidad George Washington es una universidad privada de investigación en Washington D. C. Fue creada en 1821 por el Congreso de Estados Unidos y es la primera universidad fundada en la capital.',
  },
  // University of South Florida
  137351: {
    articulo: 'University_of_South_Florida',
    texto: 'La Universidad del Sur de Florida (USF) es una universidad pública de investigación con campus principal en Tampa y otro en St. Petersburg, Florida. Tiene 14 colleges con más de 245 programas, desde pregrado hasta doctorado, y es miembro de la Asociación de Universidades Americanas (AAU).',
  },
  // Roosevelt University
  148487: {
    articulo: 'Roosevelt_University',
    texto: 'Roosevelt es una universidad privada en Chicago, Illinois. Fundada en 1945, lleva el nombre del presidente Franklin D. Roosevelt y de Eleanor Roosevelt. Tiene cuatro colleges, entre ellos el Chicago College of Performing Arts y el college de negocios Walter E. Heller.',
  },
  // Indiana University-Bloomington
  151351: {
    articulo: 'Indiana_University_Bloomington',
    texto: 'Indiana University Bloomington es una universidad pública de investigación en Bloomington, Indiana. Es el campus principal y el más grande de la Universidad de Indiana. Fue fundada en 1820 y tomó el nombre de Indiana University en 1838.',
  },
  // Babson College
  164580: {
    articulo: 'Babson_College',
    texto: 'Babson es una escuela privada de negocios en Wellesley, Massachusetts, especializada en emprendimiento. Fue fundada en 1919 por Roger Babson en su casa y puede otorgar títulos universitarios desde 1947.',
  },
  // Berklee College of Music
  164748: {
    articulo: 'Berklee_College_of_Music',
    texto: 'Berklee es un college privado de música en Boston, Massachusetts, y el college independiente de música contemporánea más grande del mundo. Es conocido por el jazz y la música moderna estadounidense, y también enseña rock, hip-hop, reggae, salsa y muchos otros estilos.',
  },
  // Rochester Institute of Technology
  195003: {
    articulo: 'Rochester_Institute_of_Technology',
    texto: 'El Instituto Tecnológico de Rochester (RIT) es una universidad privada de investigación en Henrietta, Nueva York, en las afueras de Rochester. Fue fundado en 1829.',
  },
  // Drexel University
  212054: {
    articulo: 'Drexel_University',
    texto: 'Drexel es una universidad privada de investigación con campus principal en Filadelfia, Pensilvania, fundada en 1891 por el financista Anthony J. Drexel. Es conocida por su programa co-op: antes de graduarse, los alumnos pueden trabajar hasta 18 meses a tiempo completo, con sueldo, en algo relacionado con su carrera.',
  },
  // Pennsylvania State University-Main Campus
  214777: {
    articulo: 'Pennsylvania_State_University',
    texto: 'Penn State es una universidad pública de investigación con campus en toda Pensilvania. Fue fundada en 1855 como escuela agrícola. Su campus principal, University Park, está en State College.',
  },
  // University of Pittsburgh-Pittsburgh Campus
  215293: {
    articulo: 'University_of_Pittsburgh',
    texto: 'La Universidad de Pittsburgh (Pitt) es una universidad de investigación en Pittsburgh, Pensilvania. Su campus urbano reúne diecisiete escuelas, y su edificio más conocido es la Cathedral of Learning, una torre neogótica de 42 pisos. Es miembro de la Asociación de Universidades Americanas (AAU).',
  },
  // George Mason University
  232186: {
    articulo: 'George_Mason_University',
    texto: 'George Mason (GMU) es una universidad pública de investigación en el condado de Fairfax, Virginia, cerca de Washington D. C. Lleva el nombre de George Mason, uno de los padres fundadores de Estados Unidos.',
  },
  // Purdue University-Main Campus
  243780: {
    articulo: 'Purdue_University',
    texto: 'Purdue es una universidad pública de investigación en Indiana, con campus principal en West Lafayette. Fue fundada en 1869 gracias a la donación de tierras y dinero del empresario John Purdue para crear un college de ciencia, tecnología y agricultura.',
  },
};
