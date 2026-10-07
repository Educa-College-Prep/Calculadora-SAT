import { memo, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Universidad } from '../types';
import { formatNivel } from '../utils/formatters';

interface Props {
  universidadesFiltradas: Universidad[];
  universidadesOrdenadas: Universidad[];
  /** id -> motivos por los que no se pudo evaluar con los filtros activos */
  faltantesPorId: Map<number, string[]>;
  totalUniversidades: number;
  ordenarPor: string;
  setOrdenarPor: (v: string) => void;
  ordenDireccion: 'asc' | 'desc';
  setOrdenDireccion: (v: 'asc' | 'desc') => void;
  onSeleccionar: (uni: Universidad) => void;
}

const OPCIONES_POR_PAGINA = [25, 50, 100, 200];

const estiloBotonPagina: CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#333',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
};

/**
 * Cada tarjeta va memoizada: al cambiar de página o de orden, React solo
 * re-renderiza las filas cuyos datos cambiaron, no las 4300.
 */
const FilaUniversidad = memo(function FilaUniversidad({
  uni,
  faltantes,
  onSeleccionar,
}: {
  uni: Universidad;
  faltantes?: string[];
  onSeleccionar: (uni: Universidad) => void;
}) {
  const incompleta = !!faltantes?.length;
  return (
    <li
      onClick={() => onSeleccionar(uni)}
      title={incompleta ? `No se pudo evaluar con los filtros activos: ${faltantes!.join(', ')}` : undefined}
      style={{ padding: '15px', border: incompleta ? '1px dashed #fcd34d' : '1px solid #444', margin: '10px 0', borderRadius: '8px', backgroundColor: '#2a2a2a', cursor: 'pointer', transition: '0.3s', opacity: incompleta ? 0.82 : 1 }}
      onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
      onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
    >
      <strong style={{ fontSize: '1.2em' }}>{uni.INSTNM}</strong>{' '}
      <small>({uni.CITY}, {uni.STABBR})</small>
      <div style={{ marginTop: '10px' }}>
        <span style={{ display: 'inline-block', padding: '4px 10px', marginRight: '10px', backgroundColor: uni.CONTROL === 'Pública' ? '#2d6a4f' : '#5c4d7d', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          {uni.CONTROL}
        </span>
        {uni.ICLEVEL && (
          <span style={{ display: 'inline-block', padding: '4px 10px', marginRight: '10px', backgroundColor: '#264653', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
            {formatNivel(uni.ICLEVEL)}
          </span>
        )}
        <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: uni.ADMCON7 === 'Requerido' ? '#9b2226' : '#005f73', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
          SAT: {uni.ADMCON7 || 'No especificado'}
        </span>
      </div>

      {/* Etiquetas de datos faltantes para los filtros que el usuario activó */}
      {incompleta && (
        <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {faltantes!.map(motivo => (
            <span
              key={motivo}
              style={{
                display: 'inline-block', padding: '3px 9px', borderRadius: '4px',
                fontSize: '11px', fontWeight: 600, color: '#92400e',
                background: '#fef3c7', border: '1px solid #fcd34d',
              }}
            >
              ⚠ {motivo}
            </span>
          ))}
        </div>
      )}
    </li>
  );
});

export function ListaUniversidades({
  universidadesFiltradas,
  universidadesOrdenadas,
  faltantesPorId,
  totalUniversidades,
  ordenarPor,
  setOrdenarPor,
  ordenDireccion,
  setOrdenDireccion,
  onSeleccionar,
}: Props) {
  const [porPagina, setPorPagina] = useState<number>(50);
  const [pagina, setPagina] = useState<number>(1);

  const totalPaginas = Math.max(1, Math.ceil(universidadesOrdenadas.length / porPagina));

  // Al cambiar filtros u orden se vuelve al inicio del listado.
  useEffect(() => {
    setPagina(1);
  }, [universidadesOrdenadas, porPagina]);

  const paginaSegura = Math.min(pagina, totalPaginas);

  // Solo se pintan los resultados de la página actual, no los 3500 de golpe.
  const universidadesVisibles = useMemo(() => {
    const inicio = (paginaSegura - 1) * porPagina;
    return universidadesOrdenadas.slice(inicio, inicio + porPagina);
  }, [universidadesOrdenadas, paginaSegura, porPagina]);

  const primerResultado = universidadesOrdenadas.length === 0 ? 0 : (paginaSegura - 1) * porPagina + 1;
  const ultimoResultado = Math.min(paginaSegura * porPagina, universidadesOrdenadas.length);

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
              <option value="UGDS_HISP">% Estudiantes Hispanos</option>
              <option value="STUFACR">Ratio Estudiante-Facultad</option>
            </optgroup>
            <optgroup label="Costos">
              <option value="TUITIONFEE_IN">Matrícula (Dentro de Estado)</option>
              <option value="TUITIONFEE_OUT">Matrícula (Fuera de Estado)</option>
              <option value="COSTT4_A">Costo Total Anual</option>
              <option value="NPT4_PUB">Costo Neto (Pública)</option>
              <option value="NPT4_PRIV">Costo Neto (Privada)</option>
            </optgroup>
            <optgroup label="Precio Neto por Ingreso Familiar">
              <option value="NPT41_PUB">Ingreso hasta $30k (Pública)</option>
              <option value="NPT41_PRIV">Ingreso hasta $30k (Privada)</option>
              <option value="NPT43_PUB">Ingreso $48k–$75k (Pública)</option>
              <option value="NPT43_PRIV">Ingreso $48k–$75k (Privada)</option>
              <option value="NPT45_PUB">Ingreso más de $110k (Pública)</option>
              <option value="NPT45_PRIV">Ingreso más de $110k (Privada)</option>
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
        {universidadesOrdenadas.length > 0
          ? `Mostrando ${primerResultado}–${ultimoResultado} de ${universidadesOrdenadas.length} resultados.`
          : 'Explorando nuestra base de datos completa.'}
      </p>

      {faltantesPorId.size > 0 && (
        <p style={{ color: '#92400e', fontSize: '13px', margin: '4px 0 10px 0' }}>
          ⚠ {faltantesPorId.size} de estos resultados no tienen los datos que piden tus filtros.
          No se descartaron, pero van al final de la lista y aparecen marcados.
        </p>
      )}

      {/* Lista */}
      {universidadesFiltradas.length > 0 ? (
        <>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {universidadesVisibles.map((uni, index) => (
              <FilaUniversidad
                key={uni._id ?? `${uni.INSTNM}-${uni.CITY}-${index}`}
                uni={uni}
                faltantes={uni._id != null ? faltantesPorId.get(uni._id) : undefined}
                onSeleccionar={onSeleccionar}
              />
            ))}
          </ul>

          {/* Controles de paginación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', padding: '10px 0 20px 0' }}>
            <button
              style={{ ...estiloBotonPagina, opacity: paginaSegura === 1 ? 0.4 : 1, cursor: paginaSegura === 1 ? 'default' : 'pointer' }}
              onClick={() => setPagina(1)}
              disabled={paginaSegura === 1}
            >
              « Primera
            </button>
            <button
              style={{ ...estiloBotonPagina, opacity: paginaSegura === 1 ? 0.4 : 1, cursor: paginaSegura === 1 ? 'default' : 'pointer' }}
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={paginaSegura === 1}
            >
              ‹ Anterior
            </button>

            <span style={{ color: '#aaa', fontSize: '13px' }}>
              Página <strong style={{ color: '#4cc9f0' }}>{paginaSegura}</strong> de {totalPaginas}
            </span>

            <button
              style={{ ...estiloBotonPagina, opacity: paginaSegura >= totalPaginas ? 0.4 : 1, cursor: paginaSegura >= totalPaginas ? 'default' : 'pointer' }}
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaSegura >= totalPaginas}
            >
              Siguiente ›
            </button>
            <button
              style={{ ...estiloBotonPagina, opacity: paginaSegura >= totalPaginas ? 0.4 : 1, cursor: paginaSegura >= totalPaginas ? 'default' : 'pointer' }}
              onClick={() => setPagina(totalPaginas)}
              disabled={paginaSegura >= totalPaginas}
            >
              Última »
            </button>

            <label style={{ color: '#aaa', fontSize: '13px', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Por página:
              <select
                value={porPagina}
                onChange={(e) => setPorPagina(Number(e.target.value))}
                style={{ padding: '6px 10px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #555', fontSize: '13px' }}
              >
                {OPCIONES_POR_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
        </>
      ) : (
        <p style={{ color: '#ff6b6b', padding: '20px', backgroundColor: '#331a1a', borderRadius: '8px' }}>
          No se encontraron universidades con esa combinación exacta de filtros. Intenta ampliar tu presupuesto o cambiar la ubicación.
        </p>
      )}
    </div>
  );
}
