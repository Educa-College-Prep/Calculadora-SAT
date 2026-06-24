import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface DatoGrafico {
  nombre: string;
  costo: number | null | undefined;
  nombreCompleto: string;
}

interface Props {
  datosGrafico: DatoGrafico[];
}

export function GraficoBarras({ datosGrafico }: Props) {
  if (datosGrafico.length === 0) return null;

  return (
    <div style={{ padding: '20px', backgroundColor: '#222', borderRadius: '8px' }}>
      <h3>Comparativa de Costos de Matrícula (Top 10 resultantes)</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="nombre" stroke="#ccc" tick={{ fontSize: 12 }} />
            <YAxis stroke="#ccc" />
            <Tooltip
              contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }}
              formatter={(value: any) => [`$${value}`, 'Costo Anual']}
              labelFormatter={(label, payload) => payload?.[0]?.payload?.nombreCompleto || label}
            />
            <Bar dataKey="costo" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
