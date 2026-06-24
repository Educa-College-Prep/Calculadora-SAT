import { Chart } from 'react-google-charts';

interface Props {
  datosMapaGeo: (string | number)[][];
  estadoSeleccionado: string;
  onSeleccionarEstado: (estado: string) => void;
}

export function MapaGeo({ datosMapaGeo, estadoSeleccionado, onSeleccionarEstado }: Props) {
  const mapOptions = {
    region: 'US',
    displayMode: 'regions',
    resolution: 'provinces',
    colorAxis: { colors: ['#90e0ef', '#0077b6', '#03045e'] },
    backgroundColor: 'transparent',
    datalessRegionColor: '#222',
    defaultColor: '#555',
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
        if (valorSeleccionado && valorSeleccionado.startsWith('US-')) {
          onSeleccionarEstado(valorSeleccionado.split('-')[1]);
        }
      }
    }
  ];

  return (
    <div style={{ padding: '20px', backgroundColor: '#222', borderRadius: '8px' }}>
      <h3>Concentración de Universidades {estadoSeleccionado !== 'todos' && `en ${estadoSeleccionado}`}</h3>
      <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 10px 0' }}>
        Haz clic en el mapa para aplicar un filtro geográfico
      </p>
      {datosMapaGeo.length > 1 ? (
        <Chart
          chartEvents={chartEvents}
          chartType="GeoChart"
          width="100%"
          height="300px"
          data={datosMapaGeo}
          options={mapOptions}
        />
      ) : (
        <p style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>
          No hay datos suficientes para dibujar el mapa en este nivel.
        </p>
      )}
    </div>
  );
}
