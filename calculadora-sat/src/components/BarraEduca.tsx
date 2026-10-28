import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import logoEduca from '../assets/educa-logo.png';

/** Página de contacto de Educa: la usan la barra y el cierre de la ficha. */
export const CONTACTO = 'https://educacollegeprep.com/pe/contactanos/';

/** Lo escucha App: vuelve a la vista principal sin recargar (se conservan los filtros). */
export const EVENTO_INICIO = 'college-finder:inicio';

/** Clic normal → se queda en la app. Con Cmd/Ctrl (nueva pestaña) se deja al navegador. */
function irAlInicio(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  window.dispatchEvent(new Event(EVENTO_INICIO));
}

/**
 * Barra de Educa College Prep, como la de su web: logo, nombre de la herramienta y
 * "Contáctanos". Queda fija arriba al bajar por la página.
 * Va fuera de #root (ver main.tsx) para ocupar todo el ancho de la pantalla.
 */
export function BarraEduca() {
  const ref = useRef<HTMLElement>(null);

  // Su altura cambia según la pantalla: se publica para que lo que se desplaza hasta un
  // punto de la página (o se queda pegado arriba) no termine escondido debajo de la barra.
  useLayoutEffect(() => {
    const barra = ref.current;
    if (!barra) return;
    const publicar = () => document.documentElement.style.setProperty('--alto-barra', `${barra.offsetHeight}px`);
    publicar();
    const observador = new ResizeObserver(publicar);
    observador.observe(barra);
    return () => observador.disconnect();
  }, []);

  const inicio = import.meta.env.BASE_URL;
  return (
    <header ref={ref} className="barra-educa">
      <div className="barra-educa-interior">
        <a className="barra-educa-marca" href={inicio} onClick={irAlInicio} aria-label="Educa College Finder: ir al inicio">
          <img src={logoEduca} alt="" width="210" height="40" />
        </a>
        <a className="barra-educa-producto" href={inicio} onClick={irAlInicio} tabIndex={-1} aria-hidden="true">
          College Finder
        </a>
        <a className="barra-educa-contacto" href={CONTACTO} target="_blank" rel="noopener noreferrer">
          Contáctanos
          <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
        </a>
      </div>
    </header>
  );
}
