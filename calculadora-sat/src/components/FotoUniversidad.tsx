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
 * Fondo del banner de la ficha: la foto de la universidad. Si no tiene foto libre
 * (o no carga), una portada en tinta azul con sus iniciales: ninguna ficha queda vacía.
 * Ocupa todo su contenedor; el texto va encima.
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
      <div className="foto-uni foto-uni-portada" aria-hidden="true">
        <span className="foto-uni-iniciales">{iniciales(uni.INSTNM)}</span>
      </div>
    );
  }

  return (
    <div className={`foto-uni${cargada === foto.f ? ' foto-uni-lista' : ' foto-uni-cargando'}`}>
      <img
        src={urlFoto(foto, 1280)}
        srcSet={`${urlFoto(foto, 640)} 640w, ${urlFoto(foto, 1280)} 1280w, ${urlFoto(foto, 1920)} 1920w`}
        sizes="(max-width: 1320px) 100vw, 1280px"
        alt={`Foto de ${uni.INSTNM}`}
        decoding="async"
        onLoad={() => setCargada(foto.f)}
        onError={() => setFallida(foto.f)}
      />
    </div>
  );
}

/** Autor y licencia de la foto, con enlace a Commons (lo piden las licencias libres). */
export function CreditoFoto({ uni }: { uni: Universidad }) {
  const foto = useFoto(uni);
  if (!foto) return null;
  const credito = [foto.a, foto.l].filter(Boolean).join(' · ');
  return (
    <p className="foto-uni-credito">
      Foto: <a href={paginaFoto(foto)} target="_blank" rel="noopener noreferrer">{credito || 'ver autor'}</a>, vía Wikimedia Commons
    </p>
  );
}
