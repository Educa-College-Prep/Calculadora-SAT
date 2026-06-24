import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje } from '../utils/formatters';

interface Props {
  uni: Universidad;
  onVolver: () => void;
}

export function DetalleUniversidad({ uni, onVolver }: Props) {
  const tieneSalarios = uni.MD_EARN_WNE_1YR || uni.MD_EARN_WNE_5YR || uni.MD_EARN_WNE_P6 || uni.MD_EARN_WNE_P8 || uni.MD_EARN_WNE_P10;

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
          {(uni.UGDS || uni.UGDS_HISP) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f72585' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Perfil Estudiantil</h4>
              {uni.UGDS && <p><strong>Total Pregrado:</strong> {uni.UGDS.toLocaleString()}</p>}
              {uni.UGDS_HISP && <p><strong>Estudiantes Hispanos:</strong> {uni.UGDS_HISP.toLocaleString()}</p>}
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
          {(uni.TUITIONFEE_OUT || uni.COSTT4_A || uni.NPT4_PUB || uni.NPT4_PRIV) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4361ee' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Costos Anuales</h4>
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

          {/* Tasas de Graduación */}
          {(uni.C150_4 || uni.C150_L4 || uni.C150_4_HISP || uni.C150_L4_HISP) && (
            <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4cc9f0' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}>Tasas de Graduación</h4>
              {uni.C150_4 != null && <p><strong>General (4-Year):</strong> {formatPorcentaje(uni.C150_4)}</p>}
              {uni.C150_L4 != null && <p><strong>General (&lt;4-Year):</strong> {formatPorcentaje(uni.C150_L4)}</p>}
              {uni.C150_4_HISP != null && <p><strong>Hispanos (4-Year):</strong> {formatPorcentaje(uni.C150_4_HISP)}</p>}
              {uni.C150_L4_HISP != null && <p><strong>Hispanos (&lt;4-Year):</strong> {formatPorcentaje(uni.C150_L4_HISP)}</p>}
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
