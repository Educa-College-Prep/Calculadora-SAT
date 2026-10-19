import { memo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface DatoGrafico {
  /** Identificador único de la barra (el nombre puede repetirse entre sedes). */
  id: string;
  costo: number | null | undefined;
  nombreCompleto: string;
}

interface Props {
  datosGrafico: DatoGrafico[];
}

const formatoEje = (v: number) => `$${Math.round(v / 1000)}k`;

const MAX_ETIQUETA = 22;

const recortar = (texto: string, largo: number) =>
  texto.length > largo ? `${texto.slice(0, largo - 1).trimEnd()}…` : texto;

/**
 * Nombre corto para el eje. Si hay sede ("Keiser University-Tampa"), lo que distingue
 * una barra de otra es la sede, así que se quitan las palabras genéricas del nombre
 * y se conserva la sede: "Keiser · Tampa". El nombre completo sale al pasar el mouse.
 */
function etiquetaCorta(nombre: string): string {
  const [base, ...resto] = nombre.split(/\s*-\s*/);
  const sede = resto.join(' - ');
  if (!sede) return recortar(nombre.replace(/\bUniversity\b/g, 'Univ.'), MAX_ETIQUETA);
  const nucleo = base.replace(/\b(University|College|of|the|at|in)\b/gi, '').replace(/\s+/g, ' ').trim() || base;
  const sedeCorta = recortar(sede, 13);
  return `${recortar(nucleo, Math.max(6, MAX_ETIQUETA - sedeCorta.length - 3))} · ${sedeCorta}`;
}

export const GraficoBarras = memo(function GraficoBarras({ datosGrafico }: Props) {
  const etiquetas = new Map(datosGrafico.map(d => [d.id, etiquetaCorta(d.nombreCompleto)]));

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
                  dataKey="id"
                  tickFormatter={(id: string) => etiquetas.get(id) ?? ''}
                  width={170}
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
