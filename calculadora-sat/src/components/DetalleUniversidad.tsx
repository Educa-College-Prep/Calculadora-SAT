import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, calcularPorcentajeDesdeConteo } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { MiniBarChart } from './MiniBarChart';

interface Props {
  uni: Universidad;
  onVolver: () => void;
}

export function DetalleUniversidad({ uni, onVolver }: Props) {
  const tieneSalarios = uni.MD_EARN_WNE_1YR || uni.MD_EARN_WNE_5YR || uni.MD_EARN_WNE_P6 || uni.MD_EARN_WNE_P8 || uni.MD_EARN_WNE_P10;
  const tieneNetPricePorIngreso = uni.NPT41_PRIV || uni.NPT41_PUB || uni.NPT43_PRIV || uni.NPT43_PUB || uni.NPT45_PRIV || uni.NPT45_PUB;

  // Datos para el gráfico de salarios (Retorno de Inversión)
  const datosSalarios = [
    { label: 'A 1 año', valor: uni.MD_EARN_WNE_1YR },
    { label: 'A 5 años', valor: uni.MD_EARN_WNE_5YR },
    { label: 'A 6 años', valor: uni.MD_EARN_WNE_P6 },
    { label: 'A 8 años', valor: uni.MD_EARN_WNE_P8 },
    { label: 'A 10 años', valor: uni.MD_EARN_WNE_P10 },
  ].filter((d): d is { label: string; valor: number } => d.valor != null);

  // Datos para el gráfico de "% supera salario de secundaria"
  // 1YR/5YR vienen como conteo crudo y hay que dividirlos entre el cohorte (COUNT_WNE_*)
  const datosUmbral = [
    { label: 'A 1 año', valor: calcularPorcentajeDesdeConteo(uni.GT_THRESHOLD_1YR, uni.COUNT_WNE_1YR) },
    { label: 'A 5 años', valor: calcularPorcentajeDesdeConteo(uni.GT_THRESHOLD_5YR, uni.COUNT_WNE_5YR) },
    { label: 'A 6 años', valor: uni.GT_THRESHOLD_P6 != null ? uni.GT_THRESHOLD_P6 * 100 : null },
    { label: 'A 8 años', valor: uni.GT_THRESHOLD_P8 != null ? uni.GT_THRESHOLD_P8 * 100 : null },
    { label: 'A 10 años', valor: uni.GT_THRESHOLD_P10 != null ? uni.GT_THRESHOLD_P10 * 100 : null },
  ].filter((d): d is { label: string; valor: number } => d.valor != null);

  // Datos para el gráfico de precio neto por ingreso familiar
  const datosPrecioNeto = [
    { label: 'Ingreso Bajo', valor: uni.NPT41_PUB ?? uni.NPT41_PRIV },
    { label: 'Ingreso Medio', valor: uni.NPT43_PUB ?? uni.NPT43_PRIV },
    { label: 'Ingreso Alto', valor: uni.NPT45_PUB ?? uni.NPT45_PRIV },
  ].filter((d): d is { label: string; valor: number } => d.valor != null);

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
          {uni.CITY}, {uni.STABBR} | {uni.CONTROL} {uni.ICLEVEL && `| Nivel: ${uni.ICLEVEL}`}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

          {/* Perfil Estudiantil */}
          {(uni.UGDS || uni.UGDS_HISP || uni.STUFACR) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f72585' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Perfil Estudiantil</h4>
              {uni.UGDS && (
                <p><strong>Total Pregrado:</strong> {uni.UGDS.toLocaleString()}
                  <InfoTooltip texto={glosarioCampos.UGDS} />
                </p>
              )}
              {uni.UGDS_HISP != null && (
                <p><strong>% Estudiantes Hispanos:</strong> {formatPorcentaje(uni.UGDS_HISP)}
                  <InfoTooltip texto={glosarioCampos.UGDS_HISP} />
                </p>
              )}
              {uni.STUFACR != null && (
                <p><strong>Ratio Estudiante-Facultad:</strong> {uni.STUFACR}:1
                  <InfoTooltip texto={glosarioCampos.STUFACR} />
                </p>
              )}
            </div>
          )}

          {/* Admisiones y SAT */}
          {(uni.ADM_RATE || uni.ADMCON7 || uni.OPENADMP || uni.SAT_AVG) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #7209b7' }}>
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
              {uni.SAT_AVG && (
                <>
                  <hr style={{ borderColor: '#444', margin: '10px 0' }} />
                  <p><strong>Promedio SAT:</strong> {uni.SAT_AVG}
                    <InfoTooltip texto={glosarioCampos.SAT_AVG} />
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#bbb' }}>
                    {(uni.SATMT25 || uni.SATMT75) && (
                      <div><p><strong>Math 25-75%:</strong> {uni.SATMT25 || '-'} / {uni.SATMT75 || '-'}</p></div>
                    )}
                    {(uni.SATVR25 || uni.SATVR75) && (
                      <div><p><strong>Lectura 25-75%:</strong> {uni.SATVR25 || '-'} / {uni.SATVR75 || '-'}</p></div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Costos */}
          {(uni.TUITIONFEE_OUT || uni.TUITIONFEE_IN || uni.COSTT4_A || uni.NPT4_PUB || uni.NPT4_PRIV) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4361ee' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)' }}>Costos Anuales</h4>
              {uni.TUITIONFEE_IN && (
                <p><strong>Matrícula (Dentro del Estado):</strong> {formatDinero(uni.TUITIONFEE_IN)}
                  <InfoTooltip texto={glosarioCampos.TUITIONFEE_IN} />
                </p>
              )}
              {uni.TUITIONFEE_OUT && (
                <p><strong>Matrícula (Fuera de Estado):</strong> {formatDinero(uni.TUITIONFEE_OUT)}
                  <InfoTooltip texto={glosarioCampos.TUITIONFEE_OUT} />
                </p>
              )}
              {uni.COSTT4_A && (
                <p><strong>Costo Total Asistencia:</strong> {formatDinero(uni.COSTT4_A)}
                  <InfoTooltip texto={glosarioCampos.COSTT4_A} />
                </p>
              )}
              {(uni.NPT4_PUB || uni.NPT4_PRIV) && (
                <>
                  <hr style={{ borderColor: '#444', margin: '10px 0' }} />
                  <p><strong>Costo Neto Promedio:</strong> {formatDinero(uni.NPT4_PUB || uni.NPT4_PRIV)}
                    <InfoTooltip texto={glosarioCampos.NPT4} />
                  </p>
                </>
              )}
            </div>
          )}

          {/* Precio Neto por Nivel de Ingreso Familiar — ahora como gráfico */}
          {tieneNetPricePorIngreso && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f9c74f' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                Precio Neto por Ingreso Familiar
                <InfoTooltip texto={glosarioCampos.NPT_INGRESO} />
              </h4>
              <MiniBarChart datos={datosPrecioNeto} color="#f9c74f" formato="dinero" />
            </div>
          )}

          {/* Salarios — ahora como gráfico */}
          {tieneSalarios && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #48cae4', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                Retorno de Inversión (Salario Mediano)
                <InfoTooltip texto={glosarioCampos.MD_EARN} />
              </h4>
              <p style={{ fontSize: '12px', color: '#aaa', margin: '-8px 0 12px 0' }}>
                "A 1/5 años" se mide desde la graduación · "A 6/8/10 años" se mide desde el ingreso a la universidad
              </p>
              <MiniBarChart datos={datosSalarios} color="#48cae4" formato="dinero" altura={240} />
            </div>
          )}

          {/* % Supera Salario de Secundaria — ahora como gráfico */}
          {datosUmbral.length > 0 && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #90be6d', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                % de Egresados que Supera Salario de Secundaria
                <InfoTooltip texto={glosarioCampos.GT_THRESHOLD} />
              </h4>
              <p style={{ fontSize: '12px', color: '#aaa', margin: '-8px 0 12px 0' }}>
                "A 1/5 años" se mide desde la graduación · "A 6/8/10 años" se mide desde el ingreso a la universidad
              </p>
              <MiniBarChart datos={datosUmbral} color="#90be6d" formato="porcentaje" altura={240} />
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
