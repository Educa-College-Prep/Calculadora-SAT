import { useEffect, useRef, useState } from 'react';
import type { VideoUniversidad as Video, VideosDeUniversidad } from '../data/videosUniversidades';
import { CANAL_EDUCA, EVENTO_VER_TOUR } from '../data/videosUniversidades';
import { TEMAS, partirTitulo, temaDeVideo, type TemaVideo } from '../utils/temaVideo';

interface VideoConTema {
  video: Video;
  tema: TemaVideo;
  titulo: string;
  detalle: string;
}

const miniatura = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
const etiquetaDe = (tema: TemaVideo) => TEMAS.find(t => t.tema === tema)!.etiqueta;

const movimientoReducido = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Banda "Experiencia Educa": un solo reproductor y, al lado, la lista de videos agrupada por
 * tema (campus tour, cómo entraron, cómo es estudiar ahí, por carrera). La lista mide lo mismo
 * que el reproductor y se desplaza por dentro, así la banda no crece aunque la universidad tenga
 * muchos videos. En celular la lista va debajo, con un alto máximo.
 *
 * Hasta que el visitante da play se ve la miniatura del video, no el reproductor de YouTube:
 * así la ficha no carga un iframe por video, y YouTube no recibe nada hasta el play (además se
 * usa youtube-nocookie.com).
 */
export function VideosEduca({ videos }: { videos: VideosDeUniversidad }) {
  const lista: VideoConTema[] = [
    ...(videos.tour ? [{ video: videos.tour, esTour: true }] : []),
    ...(videos.testimonios ?? []).map(v => ({ video: v, esTour: false })),
  ].map(({ video, esTour }) => ({ video, tema: temaDeVideo(video.titulo, esTour), ...partirTitulo(video.titulo) }));

  const [actualId, setActualId] = useState(lista[0].video.id);
  const [sonando, setSonando] = useState(false);
  const reproductor = useRef<HTMLDivElement>(null);
  // La ficha monta este componente con key por universidad: al cambiar de ficha arranca de cero.
  const actual = lista.find(v => v.video.id === actualId) ?? lista[0];

  const poner = (id: string) => {
    setActualId(id);
    setSonando(true);
    // En celular la lista está debajo: sube hasta el reproductor para que se vea lo que suena.
    reproductor.current?.scrollIntoView({ block: 'nearest', behavior: movimientoReducido() ? 'auto' : 'smooth' });
  };

  // "Ver campus tour" del hero.
  const tourId = videos.tour?.id;
  useEffect(() => {
    if (!tourId) return;
    const alPedirTour = () => { setActualId(tourId); setSonando(true); };
    window.addEventListener(EVENTO_VER_TOUR, alPedirTour);
    return () => window.removeEventListener(EVENTO_VER_TOUR, alPedirTour);
  }, [tourId]);

  const grupos = TEMAS
    .map(t => ({ ...t, items: lista.filter(v => v.tema === t.tema) }))
    .filter(g => g.items.length > 0);

  return (
    <>
      <div className={`videos-sala${lista.length === 1 ? ' videos-sala-uno' : ''}`}>
        <div className="videos-principal">
          <div className="video-marco" ref={reproductor}>
            {sonando ? (
              <iframe
                key={actual.video.id}
                src={`https://www.youtube-nocookie.com/embed/${actual.video.id}?rel=0&autoplay=1`}
                title={actual.video.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button type="button" className="video-portada" onClick={() => setSonando(true)}>
                <img src={miniatura(actual.video.id)} alt="" />
                <span className="video-play" aria-hidden="true">
                  <svg width="28" height="28" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
                </span>
                <span className="visualmente-oculto">Reproducir: {actual.video.titulo}</span>
              </button>
            )}
          </div>
          <div className="video-info">
            <span className="video-tipo">{etiquetaDe(actual.tema)}</span>
            <h3 className="video-titulo">{actual.titulo}</h3>
            {actual.detalle && <p className="video-detalle">{actual.detalle}</p>}
          </div>
        </div>

        {lista.length > 1 && (
          <div className="videos-lista">
            <div className="videos-lista-caja">
              {grupos.map(g => (
                <section key={g.tema} className="videos-grupo" aria-label={g.nombre}>
                  <h4 className="videos-grupo-titulo">
                    {g.nombre} <span>{g.items.length === 1 ? '1 video' : `${g.items.length} videos`}</span>
                  </h4>
                  {g.items.map(v => {
                    const esActual = v.video.id === actual.video.id;
                    return (
                      <button key={v.video.id} type="button" className={`videos-item${esActual ? ' activo' : ''}`}
                        aria-current={esActual ? 'true' : undefined} onClick={() => poner(v.video.id)}>
                        <img className="videos-item-mini" src={miniatura(v.video.id)} alt="" loading="lazy" />
                        <span className="videos-item-texto">
                          {esActual && <span className="videos-item-sonando">{sonando ? 'Reproduciendo' : 'En pantalla'}</span>}
                          <span className="videos-item-titulo">{v.titulo}</span>
                          {v.detalle && <span className="videos-item-detalle">{v.detalle}</span>}
                        </span>
                      </button>
                    );
                  })}
                </section>
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="fuente">
        Videos de <a href={CANAL_EDUCA} target="_blank" rel="noopener noreferrer">Educa College Prep en YouTube</a>.
      </p>
    </>
  );
}
