import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';

interface DatoBarra {
  label: string;
  valor: number;
}

interface Props {
  datos: DatoBarra[];
  color?: string;
  formato?: 'dinero' | 'porcentaje' | 'numero';
  altura?: number;
  /** Tope del eje Y. Sirve para que dos gráficos lado a lado usen la misma escala. */
  maxY?: number;
  /** Precio neto: los valores ≤ 0 (becas mayores que el costo) se dibujan en 0 con la etiqueta "Gratis". */
  pisoCero?: boolean;
}

/**
 * Gráfico de barras compacto para visualizar series pequeñas (5-6 puntos como máximo)
 * dentro de las tarjetas de detalle de universidad. El tooltip al pasar el mouse
 * muestra el valor exacto formateado.
 */
export function MiniBarChart({ datos, color = '#1b5fa8', formato = 'numero', altura = 200, maxY, pisoCero = false }: Props) {
  if (datos.length === 0) return null;

  // `original` guarda el valor real para el tooltip; `valor` es lo que se dibuja.
  const filas = datos.map((d) => ({
    ...d,
    original: d.valor,
    valor: pisoCero ? Math.max(0, d.valor) : d.valor,
    etiqueta: pisoCero && d.valor <= 0 ? 'Gratis' : undefined,
  }));

  // Valor exacto (tooltip) y versión corta para el eje (ej. "$120k", "75%").
  const formatearValor = (v: number): string => {
    if (formato === 'dinero') return `$${Math.round(v).toLocaleString()}`;
    if (formato === 'porcentaje') return `${v.toFixed(1)}%`;
    return v.toLocaleString();
  };
  const formatearEje = (v: number): string => {
    if (formato === 'dinero') return Math.abs(v) >= 1000 ? `$${Math.round(v / 1000)}k` : `$${v}`;
    if (formato === 'porcentaje') return `${Math.round(v)}%`;
    return v.toLocaleString();
  };

  // Redondea el tope del eje hacia arriba a un número "limpio" (148,383 → 150,000).
  const topeRedondo = (v: number): number => {
    if (v <= 0) return v;
    const paso = 10 ** Math.floor(Math.log10(v)) / 2;
    return Math.ceil(v / paso) * paso;
  };

  return (
    <div style={{ width: '100%', height: altura }}>
      <ResponsiveContainer>
        <BarChart data={filas} margin={{ top: pisoCero ? 18 : 10, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--linea)" />
          <XAxis dataKey="label" stroke="var(--grafito-suave)" tick={{ fontSize: 10 }} interval={0} />
          <YAxis
            stroke="var(--grafito-suave)"
            tick={{ fontSize: 11 }}
            tickFormatter={formatearEje}
            width={44}
            domain={[0, maxY != null ? topeRedondo(maxY) : 'auto']}
          />
          <Tooltip
            cursor={{ fill: 'var(--tinta-fondo)' }}
            contentStyle={{ background: 'var(--grafito)', border: 0, borderRadius: '8px', fontSize: '13px', fontFamily: 'var(--fuente)' }}
            labelStyle={{ color: '#fff', opacity: 0.8 }}
            itemStyle={{ color: '#fff', fontWeight: 700 }}
            separator=""
            formatter={(value, _nombre, item) => {
              const original = Number(item?.payload?.original ?? value);
              if (pisoCero && original <= 0) {
                return [original < 0 ? `Gratis · las becas superan el costo en ${formatearValor(-original)}` : 'Gratis', ''];
              }
              return [formatearValor(original), ''];
            }}
          />
          <Bar dataKey="valor" fill={color} radius={[4, 4, 0, 0]} minPointSize={pisoCero ? 2 : 0}>
            {pisoCero && (
              <LabelList dataKey="etiqueta" position="top" style={{ fontSize: 11, fontWeight: 600, fill: 'var(--grafito)' }} />
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
