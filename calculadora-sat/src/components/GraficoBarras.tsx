import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface DatoGrafico {
  nombre: string;
  costo: number | null | undefined;
  nombreCompleto: string;
}

interface Props {
  datosGrafico: DatoGrafico[];
}

export const GraficoBarras = memo(function GraficoBarras({ datosGrafico }: Props) {
  if (datosGrafico.length === 0) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#222', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '480px',
        color: '#aaa',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
        No hay datos de costos para mostrar
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#222', 
      borderRadius: '8px', 
      height: '100%',
      display: 'flex', 
      flexDirection: 'column'
    }}>
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '1.15rem', fontWeight: 600 }}>
          💰 Matrícula Más Elevada
        </h3>
        <p style={{ margin: '0', fontSize: '11px', color: '#888' }}>
          Ranking de los 10 costos más altos • {datosGrafico.length} universidades
        </p>
      </div>
      
      {/* Alto fijo, sin `flex: 1`. Con flex-basis 0 dentro de una columna cuya
          altura la define el contenido, este contenedor colapsaba a 0px y
          ResponsiveContainer dibujaba un gráfico vacío. */}
      <div style={{
        width: '100%',
        height: '300px',
        minHeight: '300px',
        flexShrink: 0
      }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={datosGrafico} 
            margin={{ top: 6, right: 16, left: 0, bottom: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="nombre" 
              stroke="#999" 
              tick={{ fontSize: 10 }} 
              angle={-40}
              textAnchor="end"
              height={72}
            />
            <YAxis 
              stroke="#999" 
              tick={{ fontSize: 10 }} 
              width={50}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#1a1a1a', 
                border: '1px solid #38bdf8', 
                borderRadius: '4px', 
                color: '#fff'
              }}
              formatter={(value: any) => {
                const formatted = new Intl.NumberFormat('en-US').format(value);
                return [`$${formatted}`, 'Costo Anual'];
              }}
            />
            <Bar 
              dataKey="costo" 
              fill="#38bdf8" 
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
