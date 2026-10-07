import type { CSSProperties } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, formatNivel, calcularPorcentajeDesdeConteo } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { RangosSAT } from './RangosSAT';
import { ParGraficosEgresados } from './ParGraficosEgresados';
import { DemografiaAdmision } from './DemografiaAdmision';
import { CostosFinanciamiento } from './CostosFinanciamiento';

// Línea pequeña de año de medición y fuente, mismo estilo que "Fuente: IPEDS" en admisiones.
const estiloFuente: CSSProperties = { fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' };

interface Props {
  uni: Universidad;
  onVolver: () => void;
}

export function DetalleUniversidad({ uni, onVolver }: Props) {
  // Salarios y "% supera salario de secundaria": dos grupos distintos de personas.
  // Desde la graduación (1/5 años) = solo graduados. Desde el ingreso (6/8/10 años) = todos.
  // 1YR/5YR del umbral vienen como conteo crudo y hay que dividirlos entre el cohorte (COUNT_WNE_*).
  const conDato = (d: { label: string; valor: number | null | undefined }): d is { label: string; valor: number } => d.valor != null;
  const salariosGraduados = [
    { label: '1 año', valor: uni.MD_EARN_WNE_1YR },
    { label: '5 años', valor: uni.MD_EARN_WNE_5YR },
  ].filter(conDato);
  const salariosIngreso = [
    { label: '6 años', valor: uni.MD_EARN_WNE_P6 },
    { label: '8 años', valor: uni.MD_EARN_WNE_P8 },
    { label: '10 años', valor: uni.MD_EARN_WNE_P10 },
  ].filter(conDato);
  const umbralGraduados = [
    { label: '1 año', valor: calcularPorcentajeDesdeConteo(uni.GT_THRESHOLD_1YR, uni.COUNT_WNE_1YR) },
    { label: '5 años', valor: calcularPorcentajeDesdeConteo(uni.GT_THRESHOLD_5YR, uni.COUNT_WNE_5YR) },
  ].filter(conDato);
  const umbralIngreso = [
    { label: '6 años', valor: uni.GT_THRESHOLD_P6 != null ? uni.GT_THRESHOLD_P6 * 100 : null },
    { label: '8 años', valor: uni.GT_THRESHOLD_P8 != null ? uni.GT_THRESHOLD_P8 * 100 : null },
    { label: '10 años', valor: uni.GT_THRESHOLD_P10 != null ? uni.GT_THRESHOLD_P10 * 100 : null },
  ].filter(conDato);

  return (
    <main className="contenedor-principal">
      <button
        onClick={onVolver}
        style={{ padding: '10px 20px', backgroundColor: '#4cc9f0', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
      >
        ← Volver al Buscador
      </button>

      <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', textAlign: 'left', border: '1px solid #333' }}>
        <h1 style={{ color: '#4cc9f0', margin: '0 0 10px 0', fontSize: '2.5rem' }}>{uni.INSTNM}</h1>
        <h3 style={{ margin: '0 0 20px 0', color: '#aaa', fontWeight: 'normal' }}>
          {uni.CITY}, {uni.STABBR} | {uni.CONTROL} {uni.ICLEVEL && `| ${formatNivel(uni.ICLEVEL)}`}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Datos demográficos y de admisión */}
          {(uni.UGDS != null || uni.UGDS_HISP != null || uni.STUFACR != null || uni.APPLCN != null) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f72585' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Datos demográficos y de admisión</h4>
              <DemografiaAdmision uni={uni} />
            </div>
          )}

          {/* Admisiones y SAT */}
          {(uni.ADM_RATE || uni.ADMCON7 || uni.OPENADMP || uni.SAT_AVG || uni.SATVR25 || uni.SATMT25) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #7209b7', minWidth: 0 }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Admisiones y SAT</h4>
              {uni.ADM_RATE != null && (
                <p><strong>Tasa de Admisión:</strong> {formatPorcentaje(uni.ADM_RATE)}
                  <InfoTooltip texto={glosarioCampos.ADM_RATE} />
                </p>
              )}
              {uni.ADMCON7 && (
                <p><strong>Política SAT:</strong> {uni.ADMCON7}
                  <InfoTooltip texto={glosarioCampos.ADMCON7} />
                </p>
              )}
              {uni.OPENADMP && (
                <p><strong>Admisión Abierta:</strong> {uni.OPENADMP}
                  <InfoTooltip texto={glosarioCampos.OPENADMP} />
                </p>
              )}
              {(uni.SAT_AVG || uni.SATVR25 || uni.SATMT25) && (
                <>
                  <hr style={{ borderColor: '#444', margin: '10px 0' }} />
                  <RangosSAT uni={uni} />
                </>
              )}
            </div>
          )}

          {/* Costos y financiamiento (pestañas por perfil) */}
          {(uni.TUITIONFEE_OUT != null || uni.TUITIONFEE_IN != null || uni.COSTT4_A != null || uni.NPT4_PUB != null || uni.NPT4_PRIV != null) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4361ee', gridColumn: 'span 2', minWidth: 0 }}>
              <CostosFinanciamiento uni={uni} />
            </div>
          )}

          {/* Salarios — ahora como gráfico */}
          {(uni.MD_EARN_WNE_4YR != null || salariosGraduados.length > 0 || salariosIngreso.length > 0) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #48cae4', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                Salario anual mediano de egresados
                <InfoTooltip texto={glosarioCampos.MD_EARN} />
              </h4>
              {uni.MD_EARN_WNE_4YR != null && (
                <div style={{ margin: '0 0 16px 0' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.1 }}>
                    {formatDinero(uni.MD_EARN_WNE_4YR)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    Salario mediano 4 años después de graduarse
                    <InfoTooltip texto={glosarioCampos.MD_EARN_4YR} />
                  </div>
                  <div style={estiloFuente}>Medido en 2022-2023 · Fuente: College Scorecard</div>
                </div>
              )}
              <ParGraficosEgresados graduados={salariosGraduados} ingreso={salariosIngreso} color="#48cae4" formato="dinero" />
              {(salariosGraduados.length > 0 || salariosIngreso.length > 0) && (
                <div style={estiloFuente}>Gráficos medidos en 2020-2021, en dólares de 2022 · Fuente: College Scorecard</div>
              )}
            </div>
          )}

          {/* % Supera Salario de Secundaria — ahora como gráfico */}
          {(umbralGraduados.length > 0 || umbralIngreso.length > 0) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #90be6d', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                % de Egresados que Supera Salario de Secundaria
                <InfoTooltip texto={glosarioCampos.GT_THRESHOLD} />
              </h4>
              <ParGraficosEgresados graduados={umbralGraduados} ingreso={umbralIngreso} color="#90be6d" formato="porcentaje" />
              <div style={estiloFuente}>Medido en 2020-2021 · Fuente: College Scorecard</div>
            </div>
          )}

          {/* Oferta Académica */}
          {(uni.CIPTITLE1 || uni.PRGMOFR) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00b4d8', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                Oferta Académica {uni.PRGMOFR && `(${uni.PRGMOFR} Programas)`}
                <InfoTooltip texto={glosarioCampos.PRGMOFR} />
              </h4>
              {uni.CIPTITLE1 && (
                <>
                  <p><strong>Programas Más Populares:</strong></p>
                  <ul style={{ paddingLeft: '20px', color: '#ccc', margin: '10px 0 0 0' }}>
                    {uni.CIPTITLE1 && <li>{uni.CIPTITLE1}</li>}
                    {uni.CIPTITLE2 && <li>{uni.CIPTITLE2}</li>}
                    {uni.CIPTITLE3 && <li>{uni.CIPTITLE3}</li>}
                    {uni.CIPTITLE4 && <li>{uni.CIPTITLE4}</li>}
                    {uni.CIPTITLE5 && <li>{uni.CIPTITLE5}</li>}
                    {uni.CIPTITLE6 && <li>{uni.CIPTITLE6}</li>}
                  </ul>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
