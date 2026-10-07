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

const formatoEje = (v: number) => `$${Math.round(v / 1000)}k`;

export const GraficoBarras = memo(function GraficoBarras({ datosGrafico }: Props) {
  return (
    <div className="panel">
      <div className="panel-cabecera">
        <h2 className="titulo-seccion">Las matrículas más altas</h2>
        <p className="ayuda">
          Matrícula anual para alumnos de otros estados y del extranjero, entre tus resultados.
        </p>
      </div>

      <div className="panel-cuerpo">
        {datosGrafico.length === 0 ? (
          <p className="vacio">Ninguno de tus resultados informa su matrícula.</p>
        ) : (
          // Barras horizontales: los nombres se leen sin girar la cabeza.
          // Alto fijo para que ResponsiveContainer no colapse a 0px dentro de la columna.
          <div style={{ width: '100%', height: 56 + datosGrafico.length * 30 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid horizontal={false} stroke="#dde3ea" />
                <XAxis
                  type="number"
                  tickFormatter={formatoEje}
                  stroke="#5d6467"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  width={128}
                  stroke="#26292b"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#e9f0fa' }}
                  contentStyle={{
                    background: '#26292b', border: 0, borderRadius: 8,
                    color: '#fff', fontFamily: 'Archivo, sans-serif', fontSize: 13,
                  }}
                  labelStyle={{ color: '#fff', fontWeight: 700, marginBottom: 2 }}
                  itemStyle={{ color: '#fff' }}
                  labelFormatter={(etiqueta, carga) => carga?.[0]?.payload?.nombreCompleto ?? etiqueta}
                  formatter={(value) => [`$${new Intl.NumberFormat('en-US').format(Number(value))}`, 'Matrícula anual']}
                />
                {/* Sin animación: así no se mueve cada vez que cambias un filtro. */}
                <Bar isAnimationActive={false} dataKey="costo" fill="#1b5fa8" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
});
