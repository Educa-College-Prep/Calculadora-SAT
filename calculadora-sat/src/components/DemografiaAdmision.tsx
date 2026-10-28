import type { CSSProperties } from 'react';
import type { Universidad } from '../types';
import { formatPorcentaje } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { conMayuscula, useFuentesDatos } from '../utils/fuentesDatos';

interface FilaCDS {
  label: string;
  /** De qué etapa sale el porcentaje ("de los postulantes"); null en Postulantes, que es la primera. */
  respecto: string | null;
  hombres: number | null | undefined;
  mujeres: number | null | undefined;
  total: number | null | undefined;
}

type Valor = number | null | undefined;

// El espacio entre columnas y el tamaño de las cifras se achican en celulares angostos
// (variables --tabla-adm-* en index.css), para que la tabla quepa entera.
const celda: CSSProperties = { padding: '10px var(--tabla-adm-espacio, 8px)', textAlign: 'right', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' };
const encabezado: CSSProperties = { ...celda, paddingTop: '6px', paddingBottom: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--grafito-suave)' };

const fmt = (v: number | null | undefined) => (v != null ? v.toLocaleString() : '—');

/**
 * Cantidad de una etapa como % de la etapa anterior del mismo grupo (admitidos hombres ÷
 * postulantes hombres; matriculados ÷ admitidos), con la cantidad debajo. En Postulantes, que
 * no tiene etapa anterior, solo la cantidad.
 */
function CeldaEtapa({ parte, anterior, primera }: { parte: Valor; anterior: Valor; primera: boolean }) {
  if (parte == null) return <td style={celda}>—</td>;
  if (primera) return <td style={{ ...celda, fontSize: 'var(--tabla-adm-cifra, 16px)', fontWeight: 700 }}>{fmt(parte)}</td>;
  const porcentaje = anterior ? `${((parte / anterior) * 100).toFixed(1)}%` : '—';
  return (
    <td style={celda}>
      <span style={{ display: 'block', fontSize: 'var(--tabla-adm-cifra, 16px)', fontWeight: 700 }}>{porcentaje}</span>
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
 *
 * Con `soloAdmision`, solo la tabla: en la ficha la población ya está en "Sobre la universidad".
 */
export function DemografiaAdmision({ uni, soloAdmision = false }: { uni: Universidad; soloAdmision?: boolean }) {
  const anioAdmision = useFuentesDatos()?.ipeds.anios.admision_por_sexo;
  // Cada etapa se compara con la anterior: de los postulantes, cuántos fueron admitidos; de los
  // admitidos, cuántos se matricularon. Así se lee la selectividad de cada grupo.
  const etapas: FilaCDS[] = [
    { label: 'Postulantes', respecto: null, hombres: uni.APPLCNM, mujeres: uni.APPLCNW, total: uni.APPLCN },
    { label: 'Admitidos', respecto: 'de los postulantes', hombres: uni.ADMSSNM, mujeres: uni.ADMSSNW, total: uni.ADMSSN },
    { label: 'Matriculados', respecto: 'de los admitidos', hombres: uni.ENRLM, mujeres: uni.ENRLW, total: uni.ENRLT },
  ];
  const filas = etapas
    .map((f, i) => ({ ...f, anterior: i > 0 ? etapas[i - 1] : null }))
    .filter((f) => f.hombres != null || f.mujeres != null || f.total != null);

  return (
    <div>
      {!soloAdmision && (
        <dl className="datos">
          {uni.UGDS != null && (
            <div className="dato-fila">
              <dt>Alumnos de pregrado</dt>
              <dd className="numero">{uni.UGDS.toLocaleString()}</dd>
            </div>
          )}
          {uni.UGDS_HISP != null && (
            <div className="dato-fila">
              <dt>Hispanos</dt>
              <dd className="numero">{formatPorcentaje(uni.UGDS_HISP)}</dd>
            </div>
          )}
          {uni.STUFACR != null && (
            <div className="dato-fila">
              <dt>Alumnos por profesor<InfoTooltip sobre="Alumnos por profesor" texto={glosarioCampos.STUFACR} /></dt>
              <dd className="numero">{uni.STUFACR}:1</dd>
            </div>
          )}
        </dl>
      )}

      {filas.length > 0 && (
        <div className={soloAdmision ? undefined : 'ficha-bloque'}>
          {!soloAdmision && (
            <p className="con-ayuda">
              <strong>Postulantes, admitidos y matriculados</strong>
            </p>
          )}
          <div className="tabla-envoltura">
          <table className="tabla tabla-admision" style={{ width: '100%', fontSize: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--linea)' }}>
                <th style={{ ...encabezado, textAlign: 'left' }}>{anioAdmision ? conMayuscula(anioAdmision) : ''}</th>
                <th style={encabezado}>Hombres</th>
                <th style={encabezado}>Mujeres</th>
                <th style={encabezado}>Total</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => (
                // Filas alternadas como en el Common Data Set.
                <tr key={f.label} style={{ background: i % 2 === 0 ? 'var(--papel)' : 'transparent' }}>
                  {/* La etiqueta sí puede partirse en dos líneas ("de los / postulantes"): así la
                      tabla cabe entera en celulares angostos, sin esconder la columna Total. */}
                  <td style={{ ...celda, textAlign: 'left', fontWeight: 600, whiteSpace: 'normal' }}>
                    {f.label}
                    {f.respecto && <span style={{ display: 'block', fontSize: '12px', fontWeight: 400, color: 'var(--grafito-suave)' }}>{f.respecto}</span>}
                  </td>
                  <CeldaEtapa parte={f.hombres} anterior={f.anterior?.hombres} primera={!f.anterior} />
                  <CeldaEtapa parte={f.mujeres} anterior={f.anterior?.mujeres} primera={!f.anterior} />
                  <CeldaEtapa parte={f.total} anterior={f.anterior?.total} primera={!f.anterior} />
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <p className="fuente">Cada porcentaje es sobre la etapa anterior del mismo grupo: admitidos sobre postulantes y matriculados sobre admitidos. Fuente: IPEDS</p>
        </div>
      )}
    </div>
  );
}
