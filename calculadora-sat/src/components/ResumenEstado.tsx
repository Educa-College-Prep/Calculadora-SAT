import { memo, useMemo } from 'react';
import type { Universidad } from '../types';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { formatDinero } from '../utils/formatters';

interface Props {
  universidades: Universidad[];
  estadoSeleccionado: string;
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : Math.round((orden[medio - 1] + orden[medio]) / 2);
}

/**
 * Dato suelto: número grande + etiqueta. No es un gráfico y no debe serlo.
 * El valor va en tinta de texto normal, no en color de serie.
 */
function Cifra({ valor, etiqueta, nota }: { valor: string; etiqueta: string; nota?: string }) {
  return (
    <div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>{valor}</div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', fontWeight: 500 }}>{etiqueta}</div>
      {nota && <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '1px' }}>{nota}</div>}
    </div>
  );
}

export const ResumenEstado = memo(function ResumenEstado({ universidades, estadoSeleccionado }: Props) {
  const resumen = useMemo(() => {
    const total = universidades.length;
    const publicas = universidades.filter(u => u.CONTROL === 'Pública').length;
    const sinFines = universidades.filter(u => u.CONTROL === 'Privada sin fines de lucro').length;
    const conFines = universidades.filter(u => u.CONTROL === 'Privada con fines de lucro').length;
    const cuatroAnios = universidades.filter(u => u.ICLEVEL === '4-Year').length;

    const matriculas = universidades.map(u => u.TUITIONFEE_OUT).filter((v): v is number => v != null);
    const sats = universidades.map(u => u.SAT_AVG).filter((v): v is number => v != null);

    const porCiudad = new Map<string, number>();
    for (const u of universidades) {
      if (u.CITY) porCiudad.set(u.CITY, (porCiudad.get(u.CITY) || 0) + 1);
    }
    const topCiudades = [...porCiudad.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total, publicas, sinFines, conFines, cuatroAnios,
      matriculaMediana: mediana(matriculas), conMatricula: matriculas.length,
      satMediano: mediana(sats), conSat: sats.length,
      topCiudades,
    };
  }, [universidades]);

  const nombreEstado = NOMBRES_ESTADOS[estadoSeleccionado] ?? estadoSeleccionado;
  const maxCiudad = resumen.topCiudades[0]?.[1] ?? 1;
  const anchoBarra = 150;

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
        <h3 style={{ margin: 0 }}>Resumen de {nombreEstado}</h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
          Calculado sobre los resultados que pasan tus filtros
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px 12px', marginBottom: '18px' }}>
        <Cifra
          valor={resumen.total.toLocaleString()}
          etiqueta="Universidades"
          nota={`${resumen.cuatroAnios} de 4 años · ${resumen.total - resumen.cuatroAnios} de 2 años`}
        />
        <Cifra
          valor={resumen.total ? `${Math.round((resumen.publicas / resumen.total) * 100)}%` : '—'}
          etiqueta="Son públicas"
          nota={`${resumen.publicas} públicas · ${resumen.sinFines + resumen.conFines} privadas`}
        />
        <Cifra
          valor={formatDinero(resumen.matriculaMediana) ?? 'Sin datos'}
          etiqueta="Matrícula mediana"
          nota={`${resumen.conMatricula} de ${resumen.total} informan precio`}
        />
        <Cifra
          valor={resumen.satMediano ? String(resumen.satMediano) : 'Sin datos'}
          etiqueta="SAT promedio (mediana)"
          nota={`solo ${resumen.conSat} de ${resumen.total} lo informan`}
        />
      </div>

      {resumen.conFines > 0 && (
        <div style={{
          fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px',
          paddingLeft: '10px', borderLeft: '2px solid #cbd5e1', lineHeight: 1.45,
        }}>
          {resumen.conFines} son privadas <strong style={{ color: 'var(--text-main)' }}>con fines de lucro</strong>,
          un perfil con retorno salarial habitualmente más bajo. Conviene mirarlas aparte.
        </div>
      )}

      {resumen.topCiudades.length > 0 && (
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
            Ciudades con más universidades
          </div>
          {/* Las barras van en SVG: index.css repinta cualquier div o span con
              background-color en línea, y las dejaría invisibles. */}
          <svg width="100%" height={resumen.topCiudades.length * 20} role="img" aria-label="Ciudades con más universidades">
            {resumen.topCiudades.map(([ciudad, cantidad], i) => (
              <g key={ciudad} transform={`translate(0, ${i * 20})`}>
                <text x="0" y="12" fontSize="11" fill="var(--text-main)">
                  {ciudad.length > 16 ? ciudad.slice(0, 15) + '…' : ciudad}
                </text>
                <rect x="115" y="4" width={anchoBarra} height="8" rx="4" fill="#e2e8f0" />
                <rect x="115" y="4" width={Math.max(4, (cantidad / maxCiudad) * anchoBarra)} height="8" rx="4" fill="#0284c7" />
                <text x={115 + anchoBarra + 8} y="12" fontSize="11" fill="var(--text-muted)">{cantidad}</text>
              </g>
            ))}
          </svg>
        </div>
      )}
    </div>
  );
});
