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
    ],
  },
  // Stanford University
  243744: {
    tour: { id: 'JuZizW36lzY', titulo: 'Stanford Campus Tour | Aquí estudiaron los fundadores de Google' },
  },
  // Georgetown University
  131496: {
    tour: { id: 'ZwJTQuxOhXg', titulo: 'Georgetown: la universidad #1 en Ciencias Políticas | Campus Tour' },
    testimonios: [
      { id: 'CjLZQBiUds0', titulo: '¿Cómo estudiar Finanzas en Estados Unidos? | Georgetown University' },
    ],
  },
  // Babson College
  164580: {
    tour: { id: '86jbPp7xHjo', titulo: 'Babson College Campus Tour | La mejor escuela en Emprendimiento' },
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
};
