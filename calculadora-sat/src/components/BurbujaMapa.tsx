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
  /** Los estados descartados ("Dónde no quiero estudiar"). Si hay, el mapa sigue en ese modo. */
  excluidos: string[];
  onElegir: (estados: string[]) => void;
  onExcluir: (estados: string[]) => void;
}

/**
 * En los resultados el mapa no ocupa lugar en la página (empujaba la lista una pantalla más abajo):
 * vive en una burbuja flotante abajo a la derecha. Al tocarla se abre; al tocar fuera de ella o con
 * Escape se vuelve a cerrar sola, sin buscar un botón de "cerrar".
 */
export function BurbujaMapa({ conteo, universidades, seleccion, excluidos, onElegir, onExcluir }: Props) {
  const [abierta, setAbierta] = useState(false);
  const [foco, setFoco] = useState<string | null>(null);
  const zonaRef = useRef<HTMLDivElement>(null);
  const botonRef = useRef<HTMLButtonElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!abierta) return;
    // Al abrir, el foco entra al panel: si no, quien usa teclado o lector no se entera de que se abrió.
    tituloRef.current?.focus();
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

  // Con estados descartados el mapa sigue en "dónde no quiero": tocar uno lo descarta o lo vuelve a sumar.
  const excluir = excluidos.length > 0;
  const marcados = excluir ? excluidos : seleccion;
  const enFoco = foco ?? marcados[marcados.length - 1] ?? null;
  const cambiar = (lista: string[], st: string) => {
    setFoco(st);
    (excluir ? onExcluir : onElegir)(lista);
  };
  const resumen = excluir ? `Todo EE. UU. menos ${excluidos.length === 1 ? NOMBRES_ESTADOS[excluidos[0]] ?? excluidos[0] : `${excluidos.length} estados`}`
    : seleccion.length === 0 ? 'Todo EE. UU.'
    : seleccion.length === 1 ? NOMBRES_ESTADOS[seleccion[0]] ?? seleccion[0]
    : `${seleccion.length} estados`;

  return (
    <div className={`burbuja-mapa${abierta ? ' burbuja-mapa-abierta' : ''}`} ref={zonaRef}>
      <button ref={botonRef} type="button" className="burbuja-mapa-boton" aria-expanded={abierta} onClick={() => setAbierta(a => !a)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>
        <span className="burbuja-mapa-texto">
          <span className="burbuja-mapa-etiqueta">Mapa</span>
          <span className="burbuja-mapa-resumen">{resumen}</span>
        </span>
      </button>
      {abierta && (
        <div className="burbuja-mapa-panel" role="dialog" aria-label="Elige en el mapa">
          <div className="burbuja-mapa-cabecera">
            <h2 ref={tituloRef} tabIndex={-1}>¿Dónde?</h2>
            <span>{excluir ? 'Toca un estado para descartarlo o volver a incluirlo' : 'Toca un estado para sumarlo o quitarlo de tu búsqueda'}</span>
          </div>
          <MapaCuadritos conteo={conteo} seleccion={marcados} foco={enFoco} onCambiar={cambiar} modo={excluir ? 'excluir' : 'incluir'} variante="chico" />
          {enFoco && <FichaEstado estado={enFoco} universidades={universidades} compacta />}
        </div>
      )}
    </div>
  );
}
