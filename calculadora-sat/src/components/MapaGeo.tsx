import { Chart } from 'react-google-charts';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { MapaCiudades } from './MapaCiudades';
import type { Universidad } from '../types';

type TooltipCell = { role: 'tooltip'; p: { html: true } };
type RegionCell = string | number | { v: string | number; f: string };

interface Props {
  datosMapaGeoEstados: (RegionCell | TooltipCell)[][];
  universidadesFiltradas: Universidad[];
  estadoSeleccionado: string;
  onSeleccionarEstado: (estado: string) => void;
}

export function MapaGeo({ datosMapaGeoEstados, universidadesFiltradas, estadoSeleccionado, onSeleccionarEstado }: Props) {
  const esNacional = estadoSeleccionado === 'todos';

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

  const chartEvents = [
    {
      eventName: 'select' as const,
      callback: ({ chartWrapper }: any) => {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();
        if (selection.length === 0 || selection[0].row == null) return;
        const dataTable = chartWrapper.getDataTable();
        const valorSeleccionado = dataTable.getValue(selection[0].row, 0);
        
        if (typeof valorSeleccionado === 'string' && valorSeleccionado.startsWith('US-')) {
          onSeleccionarEstado(valorSeleccionado.split('-')[1]);
        }
      }
    }
  ];

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
            ? 'Haz clic en un estado para ver sus ciudades'
            : 'Densidad de universidades por ciudad'}
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
            options={stateMapOptions}
          />
        </div>
      ) : (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>
          No hay datos suficientes para dibujar el mapa nacional.
        </p>
      )}

      {!esNacional && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '0.95rem', fontWeight: 600 }}>🏙️ Ciudades Dentro de {nombreEstado}</h4>
          {universidadesFiltradas.length > 0 ? (
            <MapaCiudades
              universidades={universidadesFiltradas}
              estadoSeleccionado={estadoSeleccionado}
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
}