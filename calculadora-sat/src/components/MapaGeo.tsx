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
  colorAxis: {
    colors: ['#e0f2fe', '#38bdf8', '#0284c7']
  },
  backgroundColor: '#ffffff',
  datalessRegionColor: '#f1f5f9',
  defaultColor: '#cbd5e1',
  keepAspectRatio: true,
  enableRegionInteractivity: true,
  tooltip: { isHtml: true, trigger: 'focus' },
  legend: { textStyle: { color: '#334155' } },
};

// Con un estado elegido: solo ese en azul, el resto en gris (pero clickeable).
const stateMapOptionsSeleccion = {
  ...stateMapOptions,
  colorAxis: { minValue: 0, maxValue: 1, colors: ['#e2e8f0', '#0284c7'] },
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
    <div style={{ padding: '0', backgroundColor: '#222', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column', minHeight: '500px' }}>
      <div style={{ padding: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#fff', fontWeight: 600 }}>
          🗺️ Distribución Geográfica
          {!esNacional && ` de ${nombreEstado}`}
        </h3>
        <p style={{ fontSize: '11px', color: '#888', margin: '0' }}>
          {esNacional
            ? 'Haz clic en un estado para ver el detalle por condado'
            : 'Haz clic de nuevo en el estado para volver a ver todo el país'}
        </p>
      </div>

      <div style={{ padding: '20px', paddingTop: '12px', flex: 1 }}>

      {datosMapaGeoEstados.length > 1 ? (
        <div style={{ flex: 1, minHeight: '300px' }}>
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
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>
          No hay datos suficientes para dibujar el mapa nacional.
        </p>
      )}

      {!esNacional && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>🏙️ Universidades por Condado en {nombreEstado}</h4>
          {universidadesFiltradas.length > 0 ? (
            <MapaCondados
              universidades={universidadesFiltradas}
              estadoSeleccionado={estadoSeleccionado}
              onSeleccionarCiudad={onSeleccionarCiudad}
            />
          ) : (
            <p style={{ color: '#aaa', textAlign: 'center', marginTop: '20px' }}>
              No hay datos de ciudad suficientes para este estado.
            </p>
          )}
        </div>
      )}
      </div>
    </div>
  );
});
