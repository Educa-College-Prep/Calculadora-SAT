import { useDeferredValue, useMemo, useState } from 'react';
import type { Universidad } from '../types';
import { buscarUniversidades } from '../utils/busqueda';
import type { IndiceBusqueda } from '../utils/busqueda';
import { Buscador } from './Buscador';

/**
 * Buscador de la ficha: para saltar a otra universidad sin volver a la lista. Usa el mismo
 * índice que la portada (alias como "MIT", errores de tipeo) pero su propio texto: lo que se
 * escribe aquí no cambia el filtro de la lista. En celular empieza como un botón con lupa y
 * se despliega a todo el ancho; en escritorio el campo está siempre a la vista (lo hace el CSS).
 */
export function BuscadorFicha({ indice, onSeleccionar }: {
  indice: IndiceBusqueda;
  onSeleccionar: (uni: Universidad) => void;
}) {
  const [texto, setTexto] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const diferido = useDeferredValue(texto);
  const resultado = useMemo(() => buscarUniversidades(indice, diferido), [indice, diferido]);
  const sugerencias = useMemo(() => resultado?.ordenadas.slice(0, 8) ?? [], [resultado]);

  return (
    <div className={`migas-buscar${abierto ? ' migas-buscar-abierto' : ''}`} role="search">
      <button type="button" className="migas-buscar-boton" aria-expanded={abierto}
        aria-controls="ficha-buscador-universidad" onClick={() => setAbierto(a => !a)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
          strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <span>{abierto ? 'Cerrar' : 'Buscar'}</span>
      </button>
      <div className="migas-buscar-campo">
        <Buscador id="ficha-buscador" etiqueta="Busca otra universidad" etiquetaOculta compacto
          placeholder="Busca otra universidad" conservarTexto={false} autoFocus={abierto}
          busquedaNombre={texto} setBusquedaNombre={setTexto}
          mostrarSugerencias={mostrar} setMostrarSugerencias={setMostrar}
          sugerencias={sugerencias} sonAproximadas={resultado?.aproximado ?? false}
          onSeleccionar={onSeleccionar} />
      </div>
    </div>
  );
}
