/**
 * Videos de Educa College Prep en YouTube que se muestran en la ficha de cada universidad: el
 * campus tour (uno por universidad) y los testimonios de estudiantes (pueden ser varios). Se
 * completa a mano al publicar un video nuevo en el canal.
 *
 * La clave es el UNITID (el ID oficial de la universidad en public/universidades.json): no
 * cambia aunque la universidad cambie de nombre. El nombre va en un comentario para ubicarla.
 * `id` es lo que va después de "watch?v=" en el enlace del video.
 */
export interface VideoUniversidad {
  id: string;
  titulo: string;
}

export interface VideosDeUniversidad {
  tour?: VideoUniversidad;
  testimonios?: VideoUniversidad[];
}

export const CANAL_EDUCA = 'https://www.youtube.com/@EducaCollegePrep';

/** ¿Tiene algún video? Sin videos no hay banda "Experiencia Educa" ni su pestaña en la ficha. */
export const tieneVideos = (videos: VideosDeUniversidad | undefined): videos is VideosDeUniversidad =>
  !!videos && (videos.tour != null || (videos.testimonios?.length ?? 0) > 0);

export const VIDEOS_UNIVERSIDADES: Record<number, VideosDeUniversidad> = {
  // Harvard University
  166027: {
    tour: { id: 'Q5FA_t0llQY', titulo: 'Harvard Campus Tour | Recorriendo la mejor universidad del mundo' },
  },
  // Yale University
  130794: {
    tour: { id: 'mQEuxUNywYc', titulo: 'Yale University Campus Tour | Secretos de una Ivy League de 300+ años' },
    testimonios: [
      { id: 'GaZdAFTX8HA', titulo: '¿Cómo es estudiar en Yale? | Economía y Humanidades en una Ivy League' },
      { id: 'iePLxavGWgs', titulo: 'El “right fit” y la elección entre dos Ivy Leagues: Yale y Brown' },
    ],
  },
  // Columbia University in the City of New York
  190150: {
    tour: { id: 'V56Zf6OjoaU', titulo: 'Columbia University Tour | Así es la universidad top 10 del mundo' },
  },
  // Princeton University
  186131: {
    tour: { id: 'aFT84EcTUuo', titulo: 'Tour por Princeton University: todo lo que debes saber' },
  },
  // Brown University
  217156: {
    tour: { id: 'IyR2fkXKcxo', titulo: 'Brown University Campus Tour | Recorrido por una Ivy League' },
    testimonios: [
      { id: 'rL7p42A9eSQ', titulo: 'Estudiar 3 carreras en Brown University | De Perú a EE.UU.' },
      { id: 'lLRwnjTY8TE', titulo: '¿Cómo es estudiar Economía en Brown? | El Open Curriculum que lo cambia todo' },
      { id: '_Tw6Qk8iRwg', titulo: '¿Cómo ingresar a la Ivy League con beca completa? | Brown University' },
      { id: 'iePLxavGWgs', titulo: 'El “right fit” y la elección entre dos Ivy Leagues: Yale y Brown' },
    ],
  },
  // Stanford University
  243744: {
    tour: { id: 'JuZizW36lzY', titulo: 'Stanford Campus Tour | Aquí estudiaron los fundadores de Google' },
    testimonios: [
      { id: 'buOXZBVUqho', titulo: 'Estudiar Computer Science y Political Science en Stanford | Admission Counseling' },
    ],
  },
  // Georgetown University
  131496: {
    tour: { id: 'ZwJTQuxOhXg', titulo: 'Georgetown: la universidad #1 en Ciencias Políticas | Campus Tour' },
    testimonios: [
      { id: 'CjLZQBiUds0', titulo: '¿Cómo estudiar Finanzas en Estados Unidos? | Georgetown University' },
      { id: 'fVoljLaql4U', titulo: 'Admitida a las mejores universidades de EE.UU. y Canadá | Admission Counseling' },
    ],
  },
  // Babson College
  164580: {
    tour: { id: '86jbPp7xHjo', titulo: 'Babson College Campus Tour | La mejor escuela en Emprendimiento' },
    testimonios: [
      { id: '9AYX2lOj-mc', titulo: 'Cómo estudiar Negocios en Babson College | Admission Counseling' },
    ],
  },
  // University of California-Berkeley
  110635: {
    tour: { id: '7DI8Xbdbhaw', titulo: '¿Vale la pena estudiar en UC Berkeley? | UC Berkeley Campus Tour' },
    testimonios: [
      { id: 'a65HI8NcWLc', titulo: '¿Cómo es estudiar Media Studies? | De Arquitectura a Media Studies en UC Berkeley' },
    ],
  },
  // Williams College
  168342: {
    tour: { id: 'TkckJgHQqpU', titulo: 'Williams College Campus Tour | Top Liberal Arts Colleges' },
  },
  // University of Pennsylvania (incluye Wharton)
  215062: {
    tour: { id: 'NpPFsbb1GSk', titulo: 'University of Pennsylvania (UPenn) Campus Tour | #1 in Business' },
    testimonios: [
      { id: 'B35h18QNsjQ', titulo: '¿Cómo es estudiar en la mejor escuela de negocios del mundo? | Wharton School' },
      { id: '6q_ksoIr8h8', titulo: '¿Cómo ingresar a UPenn y la Ivy League desde LATAM? | Admission Counseling' },
    ],
  },
  // Vanderbilt University
  221999: {
    tour: { id: 'L_Q__A6FFJ4', titulo: 'Así es estudiar en Estados Unidos | Campus tour por Vanderbilt University' },
  },
  // Dartmouth College
  182670: {
    tour: { id: 'fds2ie675Yk', titulo: 'Tour por Dartmouth College | ¡La Ivy League más pequeña!' },
  },
  // University of Southern California
  123961: {
    tour: { id: '0_uSXsSckik', titulo: 'University of Southern California Campus Tour | USC cerca de Hollywood' },
  },
  // University of California-Los Angeles
  110662: {
    tour: { id: '17iWtoexVAw', titulo: 'UCLA Campus Tour | ¿Cómo es estudiar en UCLA?' },
    testimonios: [
      { id: 'yhN4KusAtNQ', titulo: '¡Así logré ser admitida en UCLA! | Mi primer paso para estudiar Derecho en EE.UU.' },
    ],
  },
  // New York University (incluye Gallatin)
  193900: {
    tour: { id: 'ry_g7fN-DoI', titulo: 'Así es estudiar en Nueva York | Campus Tour por NYU' },
    testimonios: [
      { id: 'zh8AHnAYYcI', titulo: 'De Parsons a NYU Gallatin | ¿Cómo diseñé mi carrera en Entertainment Business?' },
    ],
  },
  // Pepperdine University
  121150: {
    testimonios: [
      { id: '-TZ5ks5QRU0', titulo: '¿Cómo es estudiar Ciencias Políticas en Estados Unidos? | Pepperdine University' },
    ],
  },
  // Pomona College
  121345: {
    testimonios: [
      { id: 'draC9N-VEkY', titulo: 'Estudiar Política y Economía en Pomona College | ¿Cómo funciona un Double Major?' },
    ],
  },
  // Berklee College of Music
  164748: {
    testimonios: [
      { id: 'opSps2-NZ1Y', titulo: 'Film Scoring en Berklee College of Music | Una de las mejores escuelas de música' },
    ],
  },
  // George Mason University
  232186: {
    testimonios: [
      { id: 'hoM5ektogjU', titulo: '¿Cómo es estudiar Economía en Estados Unidos? | George Mason University' },
    ],
  },
  // Johns Hopkins University
  162928: {
    testimonios: [
      { id: '8FemQmSpWBw', titulo: 'De Pre-Med a Negocios en Johns Hopkins University | Cómo cambiar de carrera' },
    ],
  },
  // University of Chicago
  144050: {
    testimonios: [
      { id: '1G2uT8w3GPw', titulo: 'De Trujillo, Perú a UChicago | Cómo ingresar a una de las universidades más selectivas de EE.UU.' },
      { id: 'HJrXmNFS-Z0', titulo: 'Fui admitida en una universidad top 10 de EE.UU. | Early Decision | UChicago' },
    ],
  },
  // University of South Florida
  137351: {
    testimonios: [
      { id: 'kJtA64EUYIc', titulo: 'De Lima a USF | Biología Celular y Molecular en EE.UU.' },
    ],
  },
  // University of Connecticut
  129020: {
    testimonios: [
      { id: 'j4cEGyL6Xek', titulo: 'Camino a UConn | Ingeniería Biomédica y programa de Medicina' },
    ],
  },
  // University of California-Davis
  110644: {
    testimonios: [
      { id: 'l2Yeq-G4qqo', titulo: 'De Lima a UC Davis | Managerial Economics en EE.UU.' },
    ],
  },
  // Purdue University-Main Campus
  243780: {
    testimonios: [
      { id: 'izMadAivQaA', titulo: 'Mi admisión a Purdue University | Testimonio de Valeria' },
      { id: 'aDL5vmAp_fw', titulo: '¿Cómo estudiar Business en Estados Unidos? | Purdue University' },
    ],
  },
  // The University of Texas at Austin
  228778: {
    testimonios: [
      { id: 'ilDoV2sWEu4', titulo: 'Cómo ingresé a UT Austin para Public Relations | Estudiar en Texas' },
      { id: 'bIIuLxEmm3w', titulo: 'María Fernanda fue admitida a UT Austin | Universidad top en Estados Unidos' },
      { id: 'dwXcTDqDn-A', titulo: '¿Cómo estudiar Psicología en EE.UU.? | UT Austin | Admission Counseling' },
    ],
  },
  // Indiana University-Bloomington
  151351: {
    testimonios: [
      { id: 'nDThLYxnOho', titulo: '¿Cómo estudiar Periodismo en Estados Unidos? | Indiana University Bloomington' },
      { id: 'B9vnBi1mgTU', titulo: 'Micaela estudia en un top 10 de Economía en Estados Unidos | Indiana University Bloomington' },
    ],
  },
  // Pennsylvania State University-Main Campus
  214777: {
    testimonios: [
      { id: 'UC62EGQBUg8', titulo: 'Cómo ingresé a Penn State | Negocios en EE.UU. | Admission Counseling' },
    ],
  },
  // Northeastern University
  167358: {
    testimonios: [
      { id: 'YFfAbfFwgRs', titulo: 'Cómo ingresé a Northeastern University | Mi camino a Economía' },
    ],
  },
  // Drexel University
  212054: {
    testimonios: [
      { id: 'tZmVvB8G_Dk', titulo: 'Cómo estudiar Negocios en Estados Unidos | Drexel University | Admission Counseling' },
    ],
  },
  // Roosevelt University (su escuela de artes es el Chicago College of Performing Arts)
  148487: {
    testimonios: [
      { id: '5KOLt4UwyRI', titulo: '¿Cómo aplicar a una universidad de artes en EE.UU.? | Chicago College of Performing Arts (CCPA)' },
    ],
  },
  // Rochester Institute of Technology
  195003: {
    testimonios: [
      { id: 'dyyDRzFluK8', titulo: 'Cómo creé mi propia licenciatura en RIT | Rochester Institute of Technology' },
    ],
  },
  // University of Pittsburgh-Pittsburgh Campus
  215293: {
    testimonios: [
      { id: 'HAojN9AQsEk', titulo: 'Marcela estudiará Ingeniería Biomédica en EE.UU. | Gap year | Admission Counseling' },
    ],
  },
  // Boston College (video del Curso SAT Prep)
  164924: {
    testimonios: [
      { id: 'dusq0Nepcl4', titulo: '¿Cómo equilibrar el colegio con el SAT? | Curso SAT Prep | SAT para Boston College' },
    ],
  },
  // George Washington University
  131469: {
    testimonios: [
      { id: 'xlPZuhcGyyM', titulo: 'Diseño Gráfico en George Washington University | Admission Counseling' },
    ],
  },
  // Lehigh University
  213543: {
    testimonios: [
      { id: 'cOywFbjYQN8', titulo: 'El camino a Lehigh University | Cómo encontrar tu universidad ideal' },
    ],
  },
  // University of Notre Dame
  152080: {
    testimonios: [
      { id: 'FKfh0aRiCy8', titulo: 'Cómo ingresé a University of Notre Dame | Finanzas en EE.UU.' },
    ],
  },
};
