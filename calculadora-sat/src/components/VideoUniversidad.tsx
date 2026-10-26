import { useRef, useState } from 'react';
import type { VideoUniversidad as Video, VideosDeUniversidad } from '../data/videosUniversidades';
import { CANAL_EDUCA } from '../data/videosUniversidades';

/**
 * Video de Educa College Prep en YouTube, en 16:9, con su etiqueta ("Campus tour" o
 * "Testimonio") y su título. Se usa youtube-nocookie.com: YouTube no guarda cookies del
 * visitante hasta que le da play. El iframe carga recién al acercarse a él (loading="lazy"),
 * así no hace más lenta la ficha.
 */
function VideoYouTube({ video, tipo }: { video: Video; tipo: string }) {
  return (
    <figure className="video-item">
      <span className="video-tipo">{tipo}</span>
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

/**
 * Videos de la banda "Experiencia Educa". Con tour y testimonios: el tour grande a la izquierda
 * y los testimonios a la derecha. Con un solo video, una columna más angosta. En celular es un
 * carrusel que se desliza de lado, con puntos que marcan cuál se está viendo.
 */
export function VideosEduca({ videos }: { videos: VideosDeUniversidad }) {
  const lista = [
    ...(videos.tour ? [{ video: videos.tour, tipo: 'Campus tour' }] : []),
    ...(videos.testimonios ?? []).map(v => ({ video: v, tipo: 'Testimonio' })),
  ];
  const carrusel = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);

  // El punto activo sigue al video más centrado en el carrusel. Solo cambia en celular, que es
  // donde el contenedor se desliza de lado; en pantalla grande no hay desplazamiento.
  const alDesplazar = () => {
    const caja = carrusel.current;
    if (!caja) return;
    const centro = caja.scrollLeft + caja.clientWidth / 2;
    const distancia = (v: HTMLElement) => Math.abs(v.offsetLeft + v.clientWidth / 2 - centro);
    const items = [...caja.querySelectorAll<HTMLElement>('.video-item')];
    setActivo(items.reduce((mejor, v, i) => (distancia(v) < distancia(items[mejor]) ? i : mejor), 0));
  };

  const diseno = lista.length === 1 ? 'videos-uno' : videos.tour ? 'videos-tour' : 'videos-varios';
  const [primero, ...resto] = lista;

  return (
    <>
      <div className={`videos ${diseno}`} ref={carrusel} onScroll={alDesplazar}>
        {/* Con tour, los testimonios van juntos en la columna derecha (en celular, la columna
            "desaparece" y cada video es una tarjeta del carrusel). */}
        {diseno === 'videos-tour' ? (
          <>
            <VideoYouTube video={primero.video} tipo={primero.tipo} />
            <div className="videos-columna">
              {resto.map(v => <VideoYouTube key={v.video.id} video={v.video} tipo={v.tipo} />)}
            </div>
          </>
        ) : (
          lista.map(v => <VideoYouTube key={v.video.id} video={v.video} tipo={v.tipo} />)
        )}
      </div>
      {lista.length > 1 && (
        <div className="videos-puntos" aria-hidden="true">
          {lista.map((v, i) => <span key={v.video.id} className={i === activo ? 'activo' : undefined} />)}
        </div>
      )}
      <p className="fuente">
        Videos de <a href={CANAL_EDUCA} target="_blank" rel="noopener noreferrer">Educa College Prep en YouTube</a>.
      </p>
    </>
  );
}
