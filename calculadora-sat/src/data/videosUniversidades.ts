import datos from './videos_universidades.json';

/**
 * Videos de Educa College Prep en YouTube que se muestran en la ficha de cada universidad: el
 * campus tour (uno por universidad) y los testimonios de estudiantes (pueden ser varios).
 *
 * La lista está en videos_universidades.json y la mantiene el robot de videos
 * (scripts/actualizar_videos.py): revisa el canal cada día y abre un PR con los videos nuevos.
 * También se puede editar a mano. La clave es el UNITID (el ID oficial de la universidad en
 * public/universidades.json): no cambia aunque la universidad cambie de nombre; "nombre" está
 * solo para ubicarla. `id` es lo que va después de "watch?v=" en el enlace del video. En
 * "ignorados" quedan los videos del canal que no van en ninguna ficha (cursos SAT, universidades
 * de otros países…), para que el robot no los vuelva a proponer.
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

/**
 * Evento que emite el botón "Ver campus tour" del hero: además de bajar hasta la banda, deja el
 * tour sonando en el reproductor (es un clic del visitante, así que el navegador permite el
 * autoplay).
 */
export const EVENTO_VER_TOUR = 'educa:ver-tour';

/** ¿Tiene algún video? Sin videos no hay banda "Experiencia Educa" ni su pestaña en la ficha. */
export const tieneVideos = (videos: VideosDeUniversidad | undefined): videos is VideosDeUniversidad =>
  !!videos && (videos.tour != null || (videos.testimonios?.length ?? 0) > 0);

/** Testimonios primero el más reciente (así los agrega el robot). */
export const VIDEOS_UNIVERSIDADES: Record<string, VideosDeUniversidad> = datos.universidades;
