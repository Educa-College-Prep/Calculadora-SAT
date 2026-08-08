import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface DatoBarra {
  label: string;
  valor: number;
}

interface Props {
  datos: DatoBarra[];
  color?: string;
  formato?: 'dinero' | 'porcentaje' | 'numero';
  altura?: number;
}

/**
 * Gráfico de barras compacto para visualizar series pequeñas (5-6 puntos como máximo)
 * dentro de las tarjetas de detalle de universidad. El tooltip al pasar el mouse
 * muestra el valor exacto formateado.
 */
export function MiniBarChart({ datos, color = '#4cc9f0', formato = 'numero', altura = 200 }: Props) {
  if (datos.length === 0) return null;

  const formatearValor = (v: number): string => {
    if (formato === 'dinero') return `$${Math.round(v).toLocaleString()}`;
    if (formato === 'porcentaje') return `${v.toFixed(1)}%`;
    return v.toLocaleString();
  };

  return (
    <div style={{ width: '100%', height: altura }}>
      <ResponsiveContainer>
        <BarChart data={datos} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle, #444)" />
          <XAxis dataKey="label" stroke="var(--text-muted, #aaa)" tick={{ fontSize: 11 }} />
          <YAxis
            stroke="var(--text-muted, #aaa)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatearValor}
            width={formato === 'dinero' ? 55 : 40}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '6px' }}
            labelStyle={{ color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            formatter={(value: any) => [formatearValor(Number(value)), 'Valor']}
          />
          <Bar dataKey="valor" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
