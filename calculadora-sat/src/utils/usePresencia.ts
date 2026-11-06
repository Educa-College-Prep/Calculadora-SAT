import { useEffect, useState } from 'react';

/**
 * Mantiene algo en pantalla un momento después de que se quita, para que pueda animar su
 * salida (el aviso que se desvanece, la capa del mapa que baja) en vez de desaparecer de golpe.
 *
 * Devuelve `[mostrado, saliendo]`: `mostrado` es el último valor no nulo mientras dura la
 * salida, y `saliendo` avisa que hay que ponerle la clase de salida. Con "reducir movimiento"
 * activado no hay animación, así que se quita al instante.
 */
export function usePresencia<T>(valor: T | null, ms: number): [T | null, boolean] {
  const [mostrado, setMostrado] = useState<T | null>(valor);
  // Llega un valor nuevo: se muestra ya, en el mismo render (sin esperar a un efecto).
  if (valor !== null && valor !== mostrado) setMostrado(valor);

  useEffect(() => {
    if (valor !== null || mostrado === null) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => setMostrado(null), reducido ? 0 : ms);
    return () => clearTimeout(t);
  }, [valor, mostrado, ms]);

  return [valor ?? mostrado, valor === null && mostrado !== null];
}
