import type { VideoUniversidad as Video } from '../data/videosUniversidades';
import { CANAL_EDUCA } from '../data/videosUniversidades';

/**
 * Campus tour de Educa College Prep en YouTube, en 16:9. Se usa youtube-nocookie.com: YouTube
 * no guarda cookies del visitante hasta que le da play. El iframe carga recién al acercarse a
 * él (loading="lazy"), así no hace más lenta la ficha.
 */
export function VideoUniversidad({ video }: { video: Video }) {
  return (
    <>
      <div className="video-marco">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${video.id}?rel=0`}
          title={video.titulo}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="video-titulo">{video.titulo}</p>
      <p className="fuente">
        Video de <a href={CANAL_EDUCA} target="_blank" rel="noopener noreferrer">Educa College Prep en YouTube</a>.
      </p>
    </>
  );
}
