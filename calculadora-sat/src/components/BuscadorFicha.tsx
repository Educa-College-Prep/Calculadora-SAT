import { useDeferredValue, useMemo, useState } from 'react';
import type { Universidad } from '../types';
import { buscarUniversidades } from '../utils/busqueda';
import type { IndiceBusqueda } from '../utils/busqueda';
import { createPortal } from 'react-dom';
import { Buscador } from './Buscador';
import { ID_BUSCADOR_BARRA } from './BarraEduca';

/**
 * Buscador de la ficha: para saltar a otra universidad sin volver a la lista. Usa el mismo
 * índice que la portada (alias como "MIT", errores de tipeo) pero su propio texto: lo que se
 * escribe aquí no cambia el filtro de la lista.
 *
 * Va en el mismo hueco de la barra de arriba que el buscador de los pasos y los resultados: antes
 * estaba en las migas de la ficha y el buscador "saltaba" hacia abajo al abrir una universidad.
 */
export function BuscadorFicha({ indice, onSeleccionar }: {
  indice: IndiceBusqueda;
  onSeleccionar: (uni: Universidad) => void;
}) {
  const [texto, setTexto] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const diferido = useDeferredValue(texto);
  const resultado = useMemo(() => buscarUniversidades(indice, diferido), [indice, diferido]);
  const sugerencias = useMemo(() => resultado?.ordenadas.slice(0, 8) ?? [], [resultado]);

  const hueco = document.getElementById(ID_BUSCADOR_BARRA);
  if (!hueco) return null;
  return createPortal(
    <Buscador id="ficha-buscador" etiqueta="Busca otra universidad" etiquetaOculta compacto
      placeholder="Busca otra universidad" conservarTexto={false}
      busquedaNombre={texto} setBusquedaNombre={setTexto}
      mostrarSugerencias={mostrar} setMostrarSugerencias={setMostrar}
      sugerencias={sugerencias} sonAproximadas={resultado?.aproximado ?? false}
      onSeleccionar={onSeleccionar} />,
    hueco,
  );
}
