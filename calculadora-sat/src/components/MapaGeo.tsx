import { memo, useMemo } from 'react';
import { Chart } from 'react-google-charts';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { MapaCondados } from './MapaCondados';
import type { Universidad } from '../types';

type TooltipCell = { role: 'tooltip'; p: { html: true } };
type RegionCell = string | number | { v: string | number; f: string };

interface Props {
  datosMapaGeoEstados: (RegionCell | TooltipCell)[][];
  universidadesFiltradas: Universidad[];
  estadoSeleccionado: string;
  onSeleccionarEstado: (estado: string) => void;
  onSeleccionarCiudad?: (ciudad: string) => void;
}

// Fuera del componente: si se recrearan en cada render, Google Charts
// redibujaría el mapa entero en cada tecla que se escribe en el buscador.
const stateMapOptions = {
  region: 'US',
  displayMode: 'regions',
  resolution: 'provinces',
  // Escala en la tinta azul de la hoja: más oscuro = más universidades.
  colorAxis: {
    colors: ['#e4edf8', '#7ea6d8', '#1b5fa8', '#0d2f5c']
  },
  backgroundColor: '#ffffff',
  datalessRegionColor: '#eef2f6',
  defaultColor: '#d3dae3',
  keepAspectRatio: true,
  enableRegionInteractivity: true,
  tooltip: { isHtml: true, trigger: 'focus' },
  legend: { textStyle: { color: '#26292b', fontName: 'Archivo', fontSize: 12 } },
};

// Con un estado elegido: solo ese en azul, el resto en gris (pero clickeable).
const stateMapOptionsSeleccion = {
  ...stateMapOptions,
  colorAxis: { minValue: 0, maxValue: 1, colors: ['#e3e8ee', '#1b5fa8'] },
  legend: 'none',
};

export const MapaGeo = memo(function MapaGeo({ datosMapaGeoEstados, universidadesFiltradas, estadoSeleccionado, onSeleccionarEstado, onSeleccionarCiudad }: Props) {
  const esNacional = estadoSeleccionado === 'todos';

  const chartEvents = useMemo(() => [
    {
      eventName: 'select' as const,
      callback: ({ chartWrapper }: any) => {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();
        // Google "deselecciona" al volver a clickear la región activa: se trata
        // igual que clickear el mismo estado (vuelve a la vista nacional).
        if (selection.length === 0 || selection[0].row == null) {
          if (!esNacional) onSeleccionarEstado(estadoSeleccionado);
          return;
        }
        const dataTable = chartWrapper.getDataTable();
        const valorSeleccionado = dataTable.getValue(selection[0].row, 0);

        if (typeof valorSeleccionado === 'string' && valorSeleccionado.startsWith('US-')) {
          onSeleccionarEstado(valorSeleccionado.split('-')[1]);
        }
      }
    }
  ], [onSeleccionarEstado, esNacional, estadoSeleccionado]);

  const nombreEstado = !esNacional ? (NOMBRES_ESTADOS[estadoSeleccionado] ?? estadoSeleccionado) : null;

  return (
    <div className="panel">
      <div className="panel-cabecera">
        <h2 className="titulo-seccion">{esNacional ? 'Dónde están' : `Dónde están en ${nombreEstado}`}</h2>
        <p className="ayuda">
          {esNacional
            ? 'Elige un estado para ver sus condados y ciudades.'
            : 'Toca el estado de nuevo para volver a todo el país.'}
        </p>
      </div>

      <div className="panel-cuerpo">
        {datosMapaGeoEstados.length > 1 ? (
          <div className="mapa-nacional">
            <Chart
              chartEvents={chartEvents}
              chartType="GeoChart"
              width="100%"
              height="300px"
              data={datosMapaGeoEstados}
              options={esNacional ? stateMapOptions : stateMapOptionsSeleccion}
            />
          </div>
        ) : (
          <p className="vacio">Ninguna universidad encaja con tus filtros, así que no hay nada que mostrar en el mapa.</p>
        )}

        {!esNacional && (
          <div className="mapa-condados">
            <h3 className="subtitulo">Universidades por condado</h3>
            {universidadesFiltradas.length > 0 ? (
              <MapaCondados
                universidades={universidadesFiltradas}
                estadoSeleccionado={estadoSeleccionado}
                onSeleccionarCiudad={onSeleccionarCiudad}
              />
            ) : (
              <p className="vacio">Ninguna universidad de {nombreEstado} encaja con tus filtros.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
