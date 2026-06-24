import type { Universidad } from '../types';

interface Props {
  universidadesFiltradas: Universidad[];
  universidadesOrdenadas: Universidad[];
  totalUniversidades: number;
  ordenarPor: string;
  setOrdenarPor: (v: string) => void;
  ordenDireccion: 'asc' | 'desc';
  setOrdenDireccion: (v: 'asc' | 'desc') => void;
  onSeleccionar: (uni: Universidad) => void;
}

export function ListaUniversidades({
  universidadesFiltradas,
  universidadesOrdenadas,
  totalUniversidades,
  ordenarPor,
  setOrdenarPor,
  ordenDireccion,
  setOrdenDireccion,
  onSeleccionar,
}: Props) {
  return (
    <div style={{ marginTop: '30px', textAlign: 'left' }}>

      {/* Encabezado con contador y selector de orden */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0 }}>Universidades Encontradas</h3>

        <span style={{
          backgroundColor: '#4cc9f0', color: '#000',
          padding: '5px 15px', borderRadius: '20px',
          fontWeight: 'bold', fontSize: '14px',
          boxShadow: '0 0 10px rgba(76, 201, 240, 0.3)'
        }}>
          {universidadesFiltradas.length} de {totalUniversidades}
        </span>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
          <select
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #555', fontSize: '13px' }}
          >
            <option value="ninguno">Ordenar por...</option>
            <optgroup label="Identificación">
              <option value="INSTNM">Nombre (A-Z)</option>
              <option value="CITY">Ciudad</option>
              <option value="STABBR">Estado</option>
            </optgroup>
            <optgroup label="Admisiones">
              <option value="ADM_RATE">Tasa de Admisión</option>
              <option value="SAT_AVG">Promedio SAT</option>
            </optgroup>
            <optgroup label="Estudiantes">
              <option value="UGDS">Total Estudiantes Pregrado</option>
              <option value="UGDS_HISP">Estudiantes Hispanos</option>
            </optgroup>
            <optgroup label="Costos">
              <option value="TUITIONFEE_OUT">Matrícula (Fuera de Estado)</option>
              <option value="COSTT4_A">Costo Total de Asistencia</option>
              <option value="NPT4_PUB">Costo Neto (Pública)</option>
              <option value="NPT4_PRIV">Costo Neto (Privada)</option>
            </optgroup>
            <optgroup label="Graduación">
              <option value="C150_4">Tasa Graduación (4-Year)</option>
              <option value="C150_4_HISP">Tasa Graduación Hispanos</option>
            </optgroup>
            <optgroup label="Salarios Graduados">
              <option value="MD_EARN_WNE_1YR">Salario Mediano (1 año)</option>
              <option value="MD_EARN_WNE_5YR">Salario Mediano (5 años)</option>
              <option value="MD_EARN_WNE_P6">Salario Mediano (6 años)</option>
              <option value="MD_EARN_WNE_P8">Salario Mediano (8 años)</option>
              <option value="MD_EARN_WNE_P10">Salario Mediano (10 años)</option>
            </optgroup>
            <optgroup label="Retorno vs Secundaria">
              <option value="GT_THRESHOLD_P6">% Supera Salario Secundaria (6 años)</option>
              <option value="GT_THRESHOLD_P10">% Supera Salario Secundaria (10 años)</option>
              <option value="GT_THRESHOLD_5YR">% Supera Salario Secundaria (5 años)</option>
            </optgroup>
            <optgroup label="Programas">
              <option value="PRGMOFR">Cantidad de Programas Ofrecidos</option>
            </optgroup>
          </select>

          <button
            onClick={() => setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')}
            title={ordenDireccion === 'asc' ? 'Ascendente' : 'Descendente'}
            style={{ padding: '6px 12px', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' }}
          >
            {ordenDireccion === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <p style={{ color: '#aaa', fontSize: '14px', marginTop: '5px' }}>
        Explorando nuestra base de datos completa.
      </p>

      {/* Lista */}
      {universidadesFiltradas.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {universidadesOrdenadas.slice(0, 3500).map((uni, index) => (
            <li
              key={index}
              onClick={() => onSeleccionar(uni)}
              style={{ padding: '15px', border: '1px solid #444', margin: '10px 0', borderRadius: '8px', backgroundColor: '#2a2a2a', cursor: 'pointer', transition: '0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            >
              <strong style={{ fontSize: '1.2em' }}>{uni.INSTNM}</strong>{' '}
              <small>({uni.CITY}, {uni.STABBR})</small>
              <div style={{ marginTop: '10px' }}>
                <span style={{ display: 'inline-block', padding: '4px 10px', marginRight: '10px', backgroundColor: uni.CONTROL === 'Pública' ? '#2d6a4f' : '#5c4d7d', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  {uni.CONTROL}
                </span>
                <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: uni.ADMCON7 === 'Requerido' ? '#9b2226' : '#005f73', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                  SAT: {uni.ADMCON7 || 'No especificado'}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: '#ff6b6b', padding: '20px', backgroundColor: '#331a1a', borderRadius: '8px' }}>
          No se encontraron universidades con esa combinación exacta de filtros. Intenta ampliar tu presupuesto o cambiar la ubicación.
        </p>
      )}
    </div>
  );
}
