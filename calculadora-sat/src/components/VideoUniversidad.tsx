import type { VideoUniversidad as Video } from '../data/videosUniversidades';
import { CANAL_EDUCA } from '../data/videosUniversidades';

/**
 * Video de Educa College Prep en YouTube, en 16:9. Se usa youtube-nocookie.com: YouTube no
 * guarda cookies del visitante hasta que le da play. El iframe carga recién al acercarse a él
 * (loading="lazy"), así no hace más lenta la ficha.
 */
function VideoYouTube({ video }: { video: Video }) {
  return (
    <figure className="video-item">
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
      <figcaption className="video-titulo">{video.titulo}</figcaption>
    </figure>
  );
}

const FuenteEduca = () => (
  <p className="fuente">
    Video de <a href={CANAL_EDUCA} target="_blank" rel="noopener noreferrer">Educa College Prep en YouTube</a>.
  </p>
);

/** Campus tour, a la derecha de "Sobre la universidad". */
export function VideoUniversidad({ video }: { video: Video }) {
  return (
    <div className="video">
      <h3 className="subtitulo">Campus tour</h3>
      <VideoYouTube video={video} />
      <FuenteEduca />
    </div>
  );
}

/** Testimonios de estudiantes: una grilla de videos (en celular, uno debajo del otro). */
export function TestimoniosUniversidad({ videos }: { videos: Video[] }) {
  return (
    <>
      <div className="testimonios">
        {videos.map((v) => <VideoYouTube key={v.id} video={v} />)}
      </div>
      <FuenteEduca />
    </>
  );
}
