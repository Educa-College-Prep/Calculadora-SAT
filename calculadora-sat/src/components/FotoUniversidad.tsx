import { useState } from 'react';
import type { Universidad } from '../types';
import { useFoto, urlFoto, paginaFoto } from '../utils/fotos';

/** "University of North Carolina at Chapel Hill" → "UNC": iniciales de las palabras con peso. */
function iniciales(nombre: string): string {
  const palabras = nombre
    .split(/\s*-\s*/)[0]
    .split(/\s+/)
    .filter(p => !/^(of|the|at|in|and|for|de|la|&)$/i.test(p) && /^[A-Za-z]/.test(p));
  return palabras.slice(0, 3).map(p => p[0].toUpperCase()).join('') || nombre[0];
}

/**
 * Foto de referencia en la cabecera de la ficha. Si la universidad no tiene foto libre
 * (o no carga), se muestra una portada con sus iniciales: ninguna ficha queda con un hueco.
 */
export function FotoUniversidad({ uni }: { uni: Universidad }) {
  const foto = useFoto(uni);
  // Estado por archivo: al pasar a otra universidad se reinicia solo.
  const [cargada, setCargada] = useState<string | null>(null);
  const [fallida, setFallida] = useState<string | null>(null);

  if (foto === undefined) {
    return <div className="foto-uni foto-uni-cargando" aria-hidden="true" />;
  }

  if (foto === null || fallida === foto.f) {
    return (
      <div className="foto-uni foto-uni-portada" role="img" aria-label={`Portada de ${uni.INSTNM}`}>
        <span className="foto-uni-iniciales">{iniciales(uni.INSTNM)}</span>
        <span className="foto-uni-portada-lugar">{uni.CITY}, {uni.STABBR}</span>
      </div>
    );
  }

  const credito = [foto.a, foto.l].filter(Boolean).join(' · ');
  return (
    <figure className="foto-uni-figura">
      <div className={`foto-uni${cargada === foto.f ? ' foto-uni-lista' : ' foto-uni-cargando'}`}>
        <img
          src={urlFoto(foto, 960)}
          srcSet={`${urlFoto(foto, 640)} 640w, ${urlFoto(foto, 960)} 960w, ${urlFoto(foto, 1280)} 1280w`}
          sizes="(max-width: 900px) 100vw, 520px"
          alt={`Foto de ${uni.INSTNM}`}
          decoding="async"
          onLoad={() => setCargada(foto.f)}
          onError={() => setFallida(foto.f)}
        />
      </div>
      <figcaption className="foto-uni-credito">
        Foto: <a href={paginaFoto(foto)} target="_blank" rel="noopener noreferrer">{credito || 'ver autor'}</a>, vía Wikimedia Commons
      </figcaption>
    </figure>
  );
}
