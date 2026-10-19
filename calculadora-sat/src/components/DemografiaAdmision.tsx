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

const celda: CSSProperties = { padding: '10px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
const encabezado: CSSProperties = { ...celda, paddingTop: '6px', paddingBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--grafito-suave)' };

const fmt = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');

/** Hombres o mujeres como % del total de su fila, con la cantidad debajo. */
function CeldaPorcentaje({ parte, total }: { parte: number | null | undefined; total: number | null | undefined }) {
  if (parte == null) return <td style={celda}>—</td>;
  const porcentaje = total ? `${((parte / total) * 100).toFixed(1)}%` : '—';
  return (
    <td style={celda}>
      <span style={{ display: 'block', fontSize: '16px', fontWeight: 700 }}>{porcentaje}</span>
      <span style={{ display: 'block', fontSize: '12px', color: 'var(--grafito-suave)' }}>{fmt(parte)}</span>
    </td>
  );
}

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
          <table className="tabla" style={{ width: '100%', fontSize: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--linea)' }}>
                <th style={{ ...encabezado, textAlign: 'left' }}>Otoño 2024</th>
                <th style={encabezado}>Hombres</th>
                <th style={encabezado}>Mujeres</th>
                <th style={encabezado}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                // Filas alternadas como en el Common Data Set.
                <tr key={f.label} style={{ background: i % 2 === 0 ? 'var(--papel)' : 'transparent' }}>
                  <td style={{ ...celda, textAlign: 'left', fontWeight: 600 }}>{f.label}</td>
                  <CeldaPorcentaje parte={f.hombres} total={f.total} />
                  <CeldaPorcentaje parte={f.mujeres} total={f.total} />
                  <td style={{ ...celda, fontSize: '16px', fontWeight: 700 }}>{fmt(f.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="fuente">Porcentajes sobre el total de cada fila. Fuente: IPEDS</p>
        </div>
      )}
    </div>
  );
}
