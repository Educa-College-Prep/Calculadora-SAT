import { useEffect, useState } from 'react';
import type { Universidad } from '../types';

/**
 * Fotos de las universidades: public/fotos_universidades.json (lo genera
 * scripts/fotos_universidades.py). Son fotos libres de Wikimedia Commons; se muestran
 * siempre con su autor y licencia, como piden esas licencias.
 *
 * El archivo se pide recién cuando alguien abre una ficha, y una sola vez.
 */
export interface Foto {
  /** Nombre del archivo en Commons. */
  f: string;
  /** Autor (puede venir vacío). */
  a: string;
  /** Licencia corta: "CC BY-SA 4.0", "Public domain"... */
  l: string;
}

let fotos: Promise<Record<string, Foto>> | null = null;

function cargarFotos() {
  fotos ??= fetch(`${import.meta.env.BASE_URL}fotos_universidades.json`)
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return fotos;
}

/** Miniatura de Commons del ancho pedido (Commons la genera y la guarda en caché). */
export const urlFoto = (foto: Foto, ancho: number) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(foto.f)}?width=${ancho}`;

/** Página de la foto en Commons, con el detalle del autor y la licencia. */
export const paginaFoto = (foto: Foto) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(foto.f)}`;

/** undefined mientras carga; null si la universidad no tiene foto. */
export function useFoto(uni: Pick<Universidad, 'INSTNM' | 'CITY' | 'STABBR'>): Foto | null | undefined {
  const clave = `${uni.INSTNM}|${uni.CITY}|${uni.STABBR}`;
  const [resultado, setResultado] = useState<{ clave: string; foto: Foto | null } | null>(null);

  useEffect(() => {
    let vigente = true;
    cargarFotos().then(todas => { if (vigente) setResultado({ clave, foto: todas[clave] ?? null }); });
    return () => { vigente = false; };
  }, [clave]);

  return resultado?.clave === clave ? resultado.foto : undefined;
}
