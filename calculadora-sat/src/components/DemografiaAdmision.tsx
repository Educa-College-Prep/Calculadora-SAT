import type { CSSProperties } from 'react';
import type { Universidad } from '../types';
import { formatPorcentaje } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';

interface FilaCDS {
  label: string;
  hombres: number | null | undefined;
  mujeres: number | null | undefined;
  total: number | null | undefined;
}

/** "Otro género / no informado" = Total − Hombres − Mujeres (IPEDS deja vacío el detalle). */
const otro = (f: FilaCDS) =>
  f.total != null && f.hombres != null && f.mujeres != null ? f.total - f.hombres - f.mujeres : null;

// Padding y encabezados compactos: con la columna "Otro" la tabla son 5 columnas en una tarjeta angosta.
const celda: CSSProperties = { padding: '6px 4px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
const encabezado: CSSProperties = { ...celda, fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' };

const fmt = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');

/**
 * Bloque "Datos demográficos y de admisión" del detalle.
 * Arriba: población (pregrado + % hispanos). Debajo de la línea: postulantes y
 * admitidos por sexo, al estilo de la sección C1 del Common Data Set.
 *
 * Postulantes/admitidos/matriculados NO vienen en College Scorecard: salen de IPEDS
 * (ADM 2024). Las universidades sin ese dato (ej. admisión abierta) no muestran la tabla.
 */
export function DemografiaAdmision({ uni }: { uni: Universidad }) {
  const filas: FilaCDS[] = [
    { label: 'Postulantes', hombres: uni.APPLCNM, mujeres: uni.APPLCNW, total: uni.APPLCN },
    { label: 'Admitidos', hombres: uni.ADMSSNM, mujeres: uni.ADMSSNW, total: uni.ADMSSN },
    { label: 'Matriculados', hombres: uni.ENRLM, mujeres: uni.ENRLW, total: uni.ENRLT },
  ].filter((f) => f.hombres != null || f.mujeres != null || f.total != null);

  // La columna "Otro" solo aparece si alguna fila tiene alumnos de otro género o sin informar.
  const mostrarOtro = filas.some((f) => (otro(f) ?? 0) > 0);

  return (
    <div>
      {uni.UGDS != null && (
        <p><strong>Total de alumnos de pregrado:</strong> {uni.UGDS.toLocaleString()}
          <InfoTooltip texto={glosarioCampos.UGDS} />
        </p>
      )}
      {uni.UGDS_HISP != null && (
        <p><strong>Porcentaje de hispanos:</strong> {formatPorcentaje(uni.UGDS_HISP)}
          <InfoTooltip texto={glosarioCampos.UGDS_HISP} />
        </p>
      )}
      {uni.STUFACR != null && (
        <p><strong>Ratio estudiante-facultad:</strong> {uni.STUFACR}:1
          <InfoTooltip texto={glosarioCampos.STUFACR} />
        </p>
      )}

      {filas.length > 0 && (
        <>
          <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle, #444)', margin: '12px 0' }} />
          <p style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center' }}>
            <strong>Postulantes, admitidos y matriculados</strong>
            <InfoTooltip texto={glosarioCampos.POSTULANTES} />
          </p>
          <table style={{ width: 'auto', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                <th />
                <th colSpan={mostrarOtro ? 4 : 3} style={{ ...celda, fontSize: '12px', fontWeight: 500, color: 'var(--text-main)' }}>Otoño 2024</th>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--border-subtle, #cbd5e1)' }}>
                <th style={{ ...encabezado, textAlign: 'left' }}></th>
                <th style={encabezado}>Hombres</th>
                <th style={encabezado}>Mujeres</th>
                {mostrarOtro && <th style={encabezado} title="Otro género o no informado">Otro</th>}
                <th style={encabezado}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                // Filas alternadas como en el Common Data Set. Se usa `background` (no
                // background-color) para que no lo pise la regla global de index.css.
                <tr key={f.label} style={{ background: i % 2 === 0 ? 'var(--bg-hover, #f1f5f9)' : 'transparent' }}>
                  <td style={{ ...celda, textAlign: 'left', fontWeight: 600, paddingLeft: '6px' }}>{f.label}</td>
                  <td style={celda}>{fmt(f.hombres)}</td>
                  <td style={celda}>{fmt(f.mujeres)}</td>
                  {mostrarOtro && <td style={celda}>{fmt(otro(f))}</td>}
                  <td style={{ ...celda, fontWeight: 600 }}>{fmt(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: '1px solid var(--border-subtle, #cbd5e1)' }} />
          <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Fuente: IPEDS</p>
        </>
      )}
    </div>
  );
}
