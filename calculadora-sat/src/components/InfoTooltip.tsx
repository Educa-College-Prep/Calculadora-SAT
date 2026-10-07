import { useId, useLayoutEffect, useRef, useState } from 'react';

interface Props {
  texto: string;
}

const MARGEN = 12;

/**
 * Burbuja "?" (como las de la hoja de respuestas) que muestra un texto de ayuda.
 * Se abre con el mouse encima, con el foco del teclado o con un toque (móvil),
 * y se cierra con Escape. Si el globo se saldría de la pantalla, se corre hacia adentro.
 */
export function InfoTooltip({ texto }: Props) {
  const [visible, setVisible] = useState(false);
  const [fijado, setFijado] = useState(false);
  const globoRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  const abierto = visible || fijado;

  // Se mide antes de pintar y se corre el globo hacia adentro si se sale de la pantalla.
  useLayoutEffect(() => {
    const globo = globoRef.current;
    if (!abierto || !globo) return;
    globo.style.transform = 'translateX(-50%)';
    const caja = globo.getBoundingClientRect();
    let ajuste = 0;
    if (caja.left < MARGEN) ajuste = MARGEN - caja.left;
    else if (caja.right > window.innerWidth - MARGEN) ajuste = window.innerWidth - MARGEN - caja.right;
    if (ajuste) globo.style.transform = `translateX(calc(-50% + ${ajuste}px))`;
  }, [abierto]);

  return (
    <span
      className="ayuda-tooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <button
        type="button"
        className="ayuda-boton"
        aria-label="Más información"
        aria-describedby={abierto ? id : undefined}
        aria-expanded={abierto}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setFijado((v) => !v);
        }}
        onFocus={() => setVisible(true)}
        onBlur={() => { setVisible(false); setFijado(false); }}
        onKeyDown={(e) => { if (e.key === 'Escape') { setVisible(false); setFijado(false); } }}
      >
        ?
      </button>

      {abierto && (
        <span
          id={id}
          ref={globoRef}
          role="tooltip"
          className="ayuda-globo"
        >
          {texto}
        </span>
      )}
    </span>
  );
}
