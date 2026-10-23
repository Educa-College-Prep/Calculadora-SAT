/**
 * Videos de Educa College Prep en YouTube (campus tours) que se muestran en la ficha de cada
 * universidad. Se completa a mano al publicar un video nuevo en el canal.
 *
 * La clave es el UNITID (el ID oficial de la universidad en public/universidades.json): no
 * cambia aunque la universidad cambie de nombre. El nombre va en un comentario para ubicarla.
 * `id` es lo que va después de "watch?v=" en el enlace del video.
 */
export interface VideoUniversidad {
  id: string;
  titulo: string;
}

export const CANAL_EDUCA = 'https://www.youtube.com/@EducaCollegePrep';

export const VIDEOS_UNIVERSIDADES: Record<number, VideoUniversidad> = {
  // New York University
  193900: { id: 'ry_g7fN-DoI', titulo: 'Así es estudiar en Nueva York | Campus Tour por NYU' },
};
