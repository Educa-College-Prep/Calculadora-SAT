import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje } from '../utils/formatters';

interface Props {
  uni: Universidad;
  onVolver: () => void;
}

export function DetalleUniversidad({ uni, onVolver }: Props) {
  const tieneSalarios = uni.MD_EARN_WNE_1YR || uni.MD_EARN_WNE_5YR || uni.MD_EARN_WNE_P6 || uni.MD_EARN_WNE_P8 || uni.MD_EARN_WNE_P10;
  const tieneNetPricePorIngreso = uni.NPT41_PRIV || uni.NPT41_PUB || uni.NPT43_PRIV || uni.NPT43_PUB || uni.NPT45_PRIV || uni.NPT45_PUB;

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
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Perfil Estudiantil</h4>
              {uni.UGDS && <p><strong>Total Pregrado:</strong> {uni.UGDS.toLocaleString()}</p>}
              {uni.UGDS_HISP && <p><strong>Estudiantes Hispanos:</strong> {uni.UGDS_HISP.toLocaleString()}</p>}
              {uni.STUFACR != null && <p><strong>Ratio Estudiante-Facultad:</strong> {uni.STUFACR}:1</p>}
            </div>
          )}

          {/* Admisiones y SAT */}
          {(uni.ADM_RATE || uni.ADMCON7 || uni.OPENADMP || uni.SAT_AVG) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #7209b7' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Admisiones y SAT</h4>
              {uni.ADM_RATE != null && <p><strong>Tasa de Admisión:</strong> {formatPorcentaje(uni.ADM_RATE)}</p>}
              {uni.ADMCON7 && <p><strong>Política SAT:</strong> {uni.ADMCON7}</p>}
              {uni.OPENADMP && <p><strong>Admisión Abierta:</strong> {uni.OPENADMP}</p>}
              {uni.SAT_AVG && (
                <>
                  <hr style={{ borderColor: '#444', margin: '10px 0' }} />
                  <p><strong>Promedio SAT:</strong> {uni.SAT_AVG}</p>
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
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Costos Anuales</h4>
              {uni.TUITIONFEE_IN && <p><strong>Matrícula (Dentro del Estado):</strong> {formatDinero(uni.TUITIONFEE_IN)}</p>}
              {uni.TUITIONFEE_OUT && <p><strong>Matrícula (Fuera de Estado):</strong> {formatDinero(uni.TUITIONFEE_OUT)}</p>}
              {uni.COSTT4_A && <p><strong>Costo Total Asistencia:</strong> {formatDinero(uni.COSTT4_A)}</p>}
              {(uni.NPT4_PUB || uni.NPT4_PRIV) && (
                <>
                  <hr style={{ borderColor: '#444', margin: '10px 0' }} />
                  <p><strong>Costo Neto Promedio:</strong> {formatDinero(uni.NPT4_PUB || uni.NPT4_PRIV)}</p>
                </>
              )}
            </div>
          )}

          {/* Precio Neto por Nivel de Ingreso Familiar */}
          {tieneNetPricePorIngreso && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f9c74f' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Precio Neto por Ingreso Familiar</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {(uni.NPT41_PUB || uni.NPT41_PRIV) && (
                  <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                    <small>Ingreso Bajo</small><br /><strong>{formatDinero(uni.NPT41_PUB || uni.NPT41_PRIV)}</strong>
                  </div>
                )}
                {(uni.NPT43_PUB || uni.NPT43_PRIV) && (
                  <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                    <small>Ingreso Medio</small><br /><strong>{formatDinero(uni.NPT43_PUB || uni.NPT43_PRIV)}</strong>
                  </div>
                )}
                {(uni.NPT45_PUB || uni.NPT45_PRIV) && (
                  <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
                    <small>Ingreso Alto</small><br /><strong>{formatDinero(uni.NPT45_PUB || uni.NPT45_PRIV)}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Salarios */}
          {tieneSalarios && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #48cae4', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Retorno de Inversión (Salario Mediano)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {uni.MD_EARN_WNE_1YR && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 1 año</small><br /><strong>{formatDinero(uni.MD_EARN_WNE_1YR)}</strong></div>}
                {uni.MD_EARN_WNE_5YR && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 5 años</small><br /><strong>{formatDinero(uni.MD_EARN_WNE_5YR)}</strong></div>}
                {uni.MD_EARN_WNE_P6 && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 6 años</small><br /><strong>{formatDinero(uni.MD_EARN_WNE_P6)}</strong></div>}
                {uni.MD_EARN_WNE_P8 && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 8 años</small><br /><strong>{formatDinero(uni.MD_EARN_WNE_P8)}</strong></div>}
                {uni.MD_EARN_WNE_P10 && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 10 años</small><br /><strong>{formatDinero(uni.MD_EARN_WNE_P10)}</strong></div>}
              </div>
            </div>
          )}

          {/* % Supera Salario de Secundaria */}
          {(uni.GT_THRESHOLD_P6 || uni.GT_THRESHOLD_P8 || uni.GT_THRESHOLD_P10 || uni.GT_THRESHOLD_1YR || uni.GT_THRESHOLD_5YR) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #90be6d', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>% de Egresados que Supera Salario de Secundaria</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                {uni.GT_THRESHOLD_1YR != null && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 1 año</small><br /><strong>{formatPorcentaje(uni.GT_THRESHOLD_1YR)}</strong></div>}
                {uni.GT_THRESHOLD_5YR != null && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 5 años</small><br /><strong>{formatPorcentaje(uni.GT_THRESHOLD_5YR)}</strong></div>}
                {uni.GT_THRESHOLD_P6 != null && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 6 años</small><br /><strong>{formatPorcentaje(uni.GT_THRESHOLD_P6)}</strong></div>}
                {uni.GT_THRESHOLD_P8 != null && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 8 años</small><br /><strong>{formatPorcentaje(uni.GT_THRESHOLD_P8)}</strong></div>}
                {uni.GT_THRESHOLD_P10 != null && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 10 años</small><br /><strong>{formatPorcentaje(uni.GT_THRESHOLD_P10)}</strong></div>}
              </div>
            </div>
          )}

          {/* Oferta Académica */}
          {(uni.CIPTITLE1 || uni.PRGMOFR) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00b4d8', gridColumn: '1 / -1' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>
                Oferta Académica {uni.PRGMOFR && `(${uni.PRGMOFR} Programas)`}
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