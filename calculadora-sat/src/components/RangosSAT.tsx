import type { Universidad } from '../types';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';

interface Rango {
  label: string;
  p25: number;
  p50: number | null;
  p75: number;
  min: number;
  max: number;
  /** Separación entre las marcas de la escala (100 en secciones, 200 en el total). */
  paso: number;
  aproximado?: boolean;
}

const COLOR_BANDA = 'var(--tinta)';

/**
 * Gráfico pequeño del rango intercuartil (percentil 25–75) del SAT.
 * Orden fijo: Verbal, Math, Total. Cada fila usa su propia escala
 * (secciones 200–800, total 400–1600).
 *
 * College Scorecard no publica percentiles del TOTAL, así que se aproxima
 * sumando Verbal + Math (ver glosarioCampos.SAT_TOTAL).
 */
export function RangosSAT({ uni }: { uni: Universidad }) {
  const rangos: Rango[] = [];

  if (uni.SATVR25 != null && uni.SATVR75 != null) {
    rangos.push({ label: 'Verbal', p25: uni.SATVR25, p50: uni.SATVR50 ?? null, p75: uni.SATVR75, min: 200, max: 800, paso: 100 });
  }
  if (uni.SATMT25 != null && uni.SATMT75 != null) {
    rangos.push({ label: 'Math', p25: uni.SATMT25, p50: uni.SATMT50 ?? null, p75: uni.SATMT75, min: 200, max: 800, paso: 100 });
  }
  if (uni.SATVR25 != null && uni.SATVR75 != null && uni.SATMT25 != null && uni.SATMT75 != null) {
    rangos.push({
      label: 'Total',
      p25: uni.SATVR25 + uni.SATMT25,
      p50: uni.SATVR50 != null && uni.SATMT50 != null ? uni.SATVR50 + uni.SATMT50 : null,
      p75: uni.SATVR75 + uni.SATMT75,
      min: 400,
      max: 1600,
      paso: 200,
      aproximado: true,
    });
  }

  const total = rangos.find((r) => r.label === 'Total');
  const pos = (v: number, r: Rango) => `${((v - r.min) / (r.max - r.min)) * 100}%`;
  const marcas = (r: Rango) =>
    Array.from({ length: Math.floor((r.max - r.min) / r.paso) + 1 }, (_, i) => r.min + i * r.paso);

  return (
    <div>
      {rangos.length > 0 && (
        <>
          <p className="con-ayuda" style={{ marginBottom: '10px' }}>
            <strong>Rango SAT de los admitidos (25–75%)</strong>
            <InfoTooltip texto={glosarioCampos.SAT_RANGO} />
          </p>

          {rangos.map((r) => (
            <div key={r.label} style={{ marginBottom: '14px' }}>
              {/* Etiqueta y valores arriba; la barra va debajo a todo el ancho */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px', lineHeight: 1.3, marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>{r.label}</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                  <strong>{r.p25} – {r.p75}</strong>
                  {r.p50 != null && <span style={{ color: 'var(--grafito-suave)' }}> · mediana {r.p50}</span>}
                </span>
              </div>

              <div style={{ position: 'relative', height: '16px', borderRadius: '8px', background: 'var(--tinta-fondo)', border: '1px solid var(--tinta-suave)' }}>
                {/* Banda 25–75 */}
                <div
                  title={`${r.label}: ${r.p25} – ${r.p75}`}
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    bottom: '-1px',
                    left: pos(r.p25, r),
                    width: `calc(${pos(r.p75, r)} - ${pos(r.p25, r)})`,
                    background: COLOR_BANDA,
                    opacity: r.aproximado ? 0.5 : 1,
                    borderRadius: '8px',
                  }}
                />
                {/* Puntos de la escala: dejan ver a qué altura está la banda. Los extremos
                    no llevan punto porque coinciden con el borde de la pista. */}
                {marcas(r).slice(1, -1).map((m) => {
                  const dentro = m >= r.p25 && m <= r.p75;
                  return (
                    <span
                      key={m}
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: pos(m, r),
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: dentro ? '#fff' : 'var(--grafito-suave)',
                        opacity: dentro ? 0.9 : 0.45,
                      }}
                    />
                  );
                })}
                {/* Mediana, si existe */}
                {r.p50 != null && (
                  <span
                    title={`Mediana: ${r.p50}`}
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      bottom: '-4px',
                      left: pos(r.p50, r),
                      width: '3px',
                      transform: 'translateX(-50%)',
                      background: 'var(--grafito)',
                      borderRadius: '2px',
                      border: '1px solid #fff',
                    }}
                  />
                )}
              </div>

              {/* Escala con todos los valores intermedios */}
              <div aria-hidden="true" style={{ position: 'relative', height: '16px', marginTop: '4px', fontSize: '11px', lineHeight: 1.2, color: 'var(--grafito-suave)', fontVariantNumeric: 'tabular-nums' }}>
                {marcas(r).map((m, i, todas) => (
                  <span
                    key={m}
                    style={{
                      position: 'absolute',
                      left: pos(m, r),
                      transform: i === 0 ? 'none' : i === todas.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {total && (
            <p style={{ fontSize: '12px', lineHeight: 1.4, color: 'var(--grafito-suave)', margin: '4px 0 0 0' }}>
              La mitad central de los admitidos sacó aproximadamente entre <strong>{total.p25}</strong> y <strong>{total.p75}</strong> en total.
            </p>
          )}
        </>
      )}

      {uni.SAT_AVG != null && (
        <div className="dato-fila" style={{ marginTop: rangos.length > 0 ? '6px' : 0 }}>
          <span className="con-ayuda" style={{ color: 'var(--grafito-suave)' }}>SAT promedio
            <InfoTooltip texto={glosarioCampos.SAT_AVG} />
          </span>
          <strong className="numero">{uni.SAT_AVG}</strong>
        </div>
      )}
    </div>
  );
}
