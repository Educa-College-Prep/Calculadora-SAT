import { useEffect, useRef, useState } from 'react';
import type { Universidad } from '../types';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { MapaCuadritos } from './MapaCuadritos';
import { FichaEstado } from './FichaEstado';

interface Props {
  /** Universidades por estado con tus filtros (sin contar el lugar): el número que dice cada estado. */
  conteo: Record<string, number>;
  /** Todas las universidades: para la ficha del estado. */
  universidades: Universidad[];
  seleccion: string[];
  /** Suma o quita un estado de la búsqueda (App aplica el tope). */
  onTocar: (estado: string) => void;
}

/**
 * En los resultados el mapa no ocupa lugar en la página (empujaba la lista una pantalla más abajo):
 * vive en una burbuja flotante abajo a la derecha. Al tocarla se abre; al tocar fuera de ella o con
 * Escape se vuelve a cerrar sola, sin buscar un botón de "cerrar".
 */
export function BurbujaMapa({ conteo, universidades, seleccion, onTocar }: Props) {
  const [abierta, setAbierta] = useState(false);
  const [foco, setFoco] = useState<string | null>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!abierta) return;
    const alTocarFuera = (e: PointerEvent) => {
      if (zonaRef.current && !zonaRef.current.contains(e.target as Node)) setAbierta(false);
    };
    const alEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setAbierta(false); botonRef.current?.focus(); }
    };
    document.addEventListener('pointerdown', alTocarFuera);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('pointerdown', alTocarFuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierta]);

  const enFoco = foco && seleccion.includes(foco) ? foco : seleccion[seleccion.length - 1] ?? null;
  const tocar = (st: string) => {
    if (!seleccion.includes(st)) setFoco(st);
    onTocar(st);
  };
  const resumen = seleccion.length === 0 ? 'Todo EE. UU.'
    : seleccion.length === 1 ? NOMBRES_ESTADOS[seleccion[0]] ?? seleccion[0]
    : `${seleccion.length} estados`;

  return (
    <div className={`burbuja-mapa${abierta ? ' burbuja-mapa-abierta' : ''}`} ref={zonaRef}>
      {abierta && (
        <div className="burbuja-mapa-panel" role="dialog" aria-label="Elige en el mapa">
          <div className="burbuja-mapa-cabecera">
            <h2>¿Dónde?</h2>
            <span>Toca un estado para sumarlo o quitarlo de tu búsqueda</span>
          </div>
          <MapaCuadritos conteo={conteo} seleccion={seleccion} foco={enFoco} onTocar={tocar} variante="chico" />
          {enFoco && <FichaEstado estado={enFoco} universidades={universidades} compacta />}
        </div>
      )}
      <button ref={botonRef} type="button" className="burbuja-mapa-boton" aria-expanded={abierta} onClick={() => setAbierta(a => !a)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>
        <span className="burbuja-mapa-texto">
          <span className="burbuja-mapa-etiqueta">Mapa</span>
          <span className="burbuja-mapa-resumen">{resumen}</span>
        </span>
      </button>
    </div>
  );
}
