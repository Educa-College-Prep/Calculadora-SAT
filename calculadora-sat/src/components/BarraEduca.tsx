import { useLayoutEffect, useRef } from 'react';
import type { MouseEvent } from 'react';
import logoEduca from '../assets/educa-logo.png';
import { useCantidadMiLista } from '../utils/useMiLista';

/** Página de contacto de Educa: la usan la barra y el cierre de la ficha. */
export const CONTACTO = 'https://educacollegeprep.com/pe/contactanos/';

/** Lo escucha App: vuelve a la vista principal sin recargar (se conservan los filtros). */
export const EVENTO_INICIO = 'college-finder:inicio';

/** Lo escucha App: abre Mi lista desde la estrella de la barra. */
export const EVENTO_MI_LISTA = 'college-finder:mi-lista';

/** Id del hueco de la barra donde App pone el buscador de universidades (con un portal). */
export const ID_BUSCADOR_BARRA = 'barra-buscador';

/** Clic normal → se queda en la app. Con Cmd/Ctrl (nueva pestaña) se deja al navegador. */
function irAlInicio(e: MouseEvent<HTMLAnchorElement>) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
  e.preventDefault();
  window.dispatchEvent(new Event(EVENTO_INICIO));
}

/**
 * Barra de Educa College Prep: logo, nombre de la herramienta, el buscador de universidades (para
 * quien ya sabe a cuál quiere ir: antes ocupaba una franja entera en los pasos) y "Mi lista y
 * comparar", en el lugar del botón de "Contáctanos" (que pasó al pie). Queda fija arriba al bajar.
 * Va fuera de #root (ver main.tsx) para ocupar todo el ancho; por eso el buscador lo pone App con
 * un portal en el hueco #barra-buscador (solo en los pasos y los resultados: la ficha tiene el suyo).
 */
export function BarraEduca() {
  const ref = useRef<HTMLElement>(null);
  const cantidad = useCantidadMiLista();

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
        <div id={ID_BUSCADOR_BARRA} className="barra-educa-buscador" />
        {/* La misma estrella que "Guardar" en cada universidad: es donde terminan las guardadas. */}
        <button type="button" className="barra-educa-lista" onClick={() => window.dispatchEvent(new Event(EVENTO_MI_LISTA))}
          aria-label={`Mi lista y comparar: ${cantidad} ${cantidad === 1 ? 'universidad guardada' : 'universidades guardadas'}`}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3.2z" /></svg>
          <span className="barra-educa-lista-texto">Mi lista<span className="barra-educa-lista-largo"> y comparar</span></span>
          {/* La key reinicia la animación: como la barra siempre se ve, guardar se nota al instante. */}
          <span key={cantidad} className="contador numero">{cantidad}</span>
        </button>
      </div>
    </header>
  );
}
