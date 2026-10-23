import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/** Movimientos más chicos que esto (temblores del touchpad o del dedo) no cambian la dirección. */
const UMBRAL_PX = 10;

/**
 * ¿El usuario está subiendo por la página? Es el patrón de Chrome, Safari e Instagram: al bajar
 * está leyendo y no hay que distraerlo; un gesto hacia arriba suele significar "quiero hacer
 * otra cosa", y ahí conviene mostrarle los botones.
 */
export function useSubiendo(): boolean {
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    let anterior = window.scrollY;
    const alDesplazar = () => {
      const y = window.scrollY;
      if (Math.abs(y - anterior) < UMBRAL_PX) return;
      setSubiendo(y < anterior);
      anterior = y;
    };
    window.addEventListener('scroll', alDesplazar, { passive: true });
    return () => window.removeEventListener('scroll', alDesplazar);
  }, []);

  return subiendo;
}

/**
 * ¿Se ve el elemento en pantalla? Descuenta la barra de Educa, que está fija arriba y lo
 * taparía: un botón escondido debajo de ella no cuenta como visible.
 */
export function useALaVista(ref: RefObject<HTMLElement | null>): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    const altoBarra = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-barra')) || 0;
    const observador = new IntersectionObserver(
      ([entrada]) => setVisible(entrada.isIntersecting),
      { rootMargin: `-${altoBarra}px 0px 0px 0px` }
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, [ref]);

  return visible;
}
