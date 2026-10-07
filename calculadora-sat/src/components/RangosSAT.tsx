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
    rangos.push({ label: 'Verbal', p25: uni.SATVR25, p50: uni.SATVR50 ?? null, p75: uni.SATVR75, min: 200, max: 800 });
  }
  if (uni.SATMT25 != null && uni.SATMT75 != null) {
    rangos.push({ label: 'Math', p25: uni.SATMT25, p50: uni.SATMT50 ?? null, p75: uni.SATMT75, min: 200, max: 800 });
  }
  if (uni.SATVR25 != null && uni.SATVR75 != null && uni.SATMT25 != null && uni.SATMT75 != null) {
    rangos.push({
      label: 'Total',
      p25: uni.SATVR25 + uni.SATMT25,
      p50: uni.SATVR50 != null && uni.SATMT50 != null ? uni.SATVR50 + uni.SATMT50 : null,
      p75: uni.SATVR75 + uni.SATMT75,
      min: 400,
      max: 1600,
      aproximado: true,
    });
  }

  const total = rangos.find((r) => r.label === 'Total');
  const pos = (v: number, r: Rango) => `${((v - r.min) / (r.max - r.min)) * 100}%`;

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

              <div style={{ position: 'relative', height: '14px', borderRadius: '7px', background: 'var(--tinta-fondo)', border: '1px solid var(--tinta-suave)' }}>
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
                    borderRadius: '7px',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', lineHeight: 1.2, marginTop: '3px', color: 'var(--grafito-suave)' }}>
                <span>{r.min}</span>
                <span>{r.max}</span>
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
