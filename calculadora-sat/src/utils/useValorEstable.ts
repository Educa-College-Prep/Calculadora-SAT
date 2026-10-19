import { useEffect, useRef, useState } from 'react';

/**
 * Devuelve `valor`, pero mientras cambia muy seguido (p. ej. al arrastrar un
 * deslizador) espera a que se quede quieto `ms` milisegundos antes de actualizar.
 * Un cambio aislado (un clic) se aplica de inmediato.
 *
 * Sirve para lo que es caro de redibujar, como el mapa de Google, que no se
 * puede interrumpir a medio dibujo.
 */
export function useValorEstable<T>(valor: T, ms: number): T {
  const [estable, setEstable] = useState(valor);
  const ultimoCambio = useRef(0);

  useEffect(() => {
    const reciente = performance.now() - ultimoCambio.current < ms;
    const t = window.setTimeout(() => {
      ultimoCambio.current = performance.now();
      setEstable(valor);
    }, reciente ? ms : 0);
    return () => window.clearTimeout(t);
  }, [valor, ms]);

  return estable;
}
