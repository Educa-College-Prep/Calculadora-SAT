import { useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { KeyboardEvent } from 'react';

interface Opcion<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  opciones: Opcion<T>[];
  activa: T;
  onCambio: (id: T) => void;
  /** Para lectores de pantalla: qué se está eligiendo. */
  etiqueta: string;
  /** Prefijo de ids para enlazar cada pestaña con su panel (aria-controls). */
  idBase: string;
}

/**
 * Minipestañas tipo "píldora". Se recorren con las flechas del teclado,
 * como indica el patrón de pestañas de WAI-ARIA.
 */
export function Pestanas<T extends string>({ opciones, activa, onCambio, etiqueta, idBase }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const listaRef = useRef<HTMLDivElement>(null);
  const indiceActivo = opciones.findIndex(o => o.id === activa);

  // La píldora oscura se mide sobre la pestaña elegida y se desliza hasta ella (ver CSS).
  // Se vuelve a medir si cambia el ancho: en celular las pestañas se estiran o bajan de fila.
  const [indicador, setIndicador] = useState<CSSProperties | null>(null);
  useLayoutEffect(() => {
    const lista = listaRef.current;
    if (!lista) return;
    const medir = () => {
      const boton = refs.current[indiceActivo];
      if (!boton) return setIndicador(null);
      setIndicador({
        width: boton.offsetWidth,
        height: boton.offsetHeight,
        transform: `translate(${boton.offsetLeft}px, ${boton.offsetTop}px)`,
      });
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(lista);
    return () => observador.disconnect();
  }, [indiceActivo, opciones.length]);

  const alTeclear = (e: KeyboardEvent, indice: number) => {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const siguiente = (indice + paso + opciones.length) % opciones.length;
    onCambio(opciones[siguiente].id);
    refs.current[siguiente]?.focus();
  };

  return (
    <div ref={listaRef} role="tablist" aria-label={etiqueta} className="pestanas">
      {indicador && <span className="pestanas-indicador" style={indicador} aria-hidden="true" />}
      {opciones.map((o, i) => {
        const seleccionada = o.id === activa;
        return (
          <button
            key={o.id}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="tab"
            id={`${idBase}-tab-${o.id}`}
            aria-selected={seleccionada}
            aria-controls={`${idBase}-panel`}
            tabIndex={seleccionada ? 0 : -1}
            className="pestana"
            onClick={() => onCambio(o.id)}
            onKeyDown={(e) => alTeclear(e, i)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
