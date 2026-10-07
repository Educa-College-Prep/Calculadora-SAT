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
const encabezado: CSSProperties = { ...celda, fontSize: '12px', fontWeight: 600, color: 'var(--grafito-suave)' };

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
      <dl className="datos">
        {uni.UGDS != null && (
          <div className="dato-fila">
            <dt>Alumnos de pregrado<InfoTooltip texto={glosarioCampos.UGDS} /></dt>
            <dd className="numero">{uni.UGDS.toLocaleString()}</dd>
          </div>
        )}
        {uni.UGDS_HISP != null && (
          <div className="dato-fila">
            <dt>Hispanos<InfoTooltip texto={glosarioCampos.UGDS_HISP} /></dt>
            <dd className="numero">{formatPorcentaje(uni.UGDS_HISP)}</dd>
          </div>
        )}
        {uni.STUFACR != null && (
          <div className="dato-fila">
            <dt>Alumnos por profesor<InfoTooltip texto={glosarioCampos.STUFACR} /></dt>
            <dd className="numero">{uni.STUFACR}:1</dd>
          </div>
        )}
      </dl>

      {filas.length > 0 && (
        <div className="ficha-bloque">
          <p className="con-ayuda">
            <strong>Postulantes, admitidos y matriculados</strong>
            <InfoTooltip texto={glosarioCampos.POSTULANTES} />
          </p>
          <div className="tabla-envoltura">
          <table className="tabla" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th />
                <th colSpan={mostrarOtro ? 4 : 3} style={{ ...celda, fontSize: '12px', fontWeight: 500, color: 'var(--grafito)' }}>Otoño 2024</th>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--linea)' }}>
                <th style={{ ...encabezado, textAlign: 'left' }}></th>
                <th style={encabezado}>Hombres</th>
                <th style={encabezado}>Mujeres</th>
                {mostrarOtro && <th style={encabezado} title="Otro género o no informado">Otro</th>}
                <th style={encabezado}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                // Filas alternadas como en el Common Data Set.
                <tr key={f.label} style={{ background: i % 2 === 0 ? 'var(--papel)' : 'transparent' }}>
                  <td style={{ ...celda, textAlign: 'left', fontWeight: 600, paddingLeft: '6px' }}>{f.label}</td>
                  <td style={celda}>{fmt(f.hombres)}</td>
                  <td style={celda}>{fmt(f.mujeres)}</td>
                  {mostrarOtro && <td style={celda}>{fmt(otro(f))}</td>}
                  <td style={{ ...celda, fontWeight: 600 }}>{fmt(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="fuente">Fuente: IPEDS</p>
        </div>
      )}
    </div>
  );
}
