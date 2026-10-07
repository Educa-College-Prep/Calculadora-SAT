import { useRef } from 'react';
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

  const alTeclear = (e: KeyboardEvent, indice: number) => {
    const paso = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!paso) return;
    e.preventDefault();
    const siguiente = (indice + paso + opciones.length) % opciones.length;
    onCambio(opciones[siguiente].id);
    refs.current[siguiente]?.focus();
  };

  return (
    <div role="tablist" aria-label={etiqueta} className="pestanas">
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
