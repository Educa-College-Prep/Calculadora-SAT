import { memo, useEffect, useMemo, useState } from 'react';
import type { Universidad } from '../types';
import { formatNivel, formatDinero, formatPorcentaje } from '../utils/formatters';

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

/** Color de la etiqueta según el tipo de institución (mismo código en toda la web). */
function claseControl(control: string | null): string {
  if (control === 'Pública') return 'marca marca-publica';
  if (control === 'Privada con fines de lucro') return 'marca marca-lucro';
  return 'marca marca-privada';
}

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
    <li className={`fila${incompleta ? ' fila-incompleta' : ''}`}>
      <button
        type="button"
        className="fila-boton"
        onClick={() => onSeleccionar(uni)}
        title={incompleta ? `No se pudo evaluar con los filtros activos: ${faltantes!.join(', ')}` : undefined}
      >
        <span className="fila-identidad">
          <span className="fila-nombre">{uni.INSTNM}</span>
          <span className="fila-lugar">{uni.CITY}, {uni.STABBR}</span>
          <span className="marcas">
            {uni.CONTROL && <span className={claseControl(uni.CONTROL)}>{uni.CONTROL}</span>}
            {uni.ICLEVEL && <span className="marca">{formatNivel(uni.ICLEVEL)}</span>}
            {uni.ADMCON7 === 'Requerido'
              ? <span className="marca marca-sat">SAT obligatorio</span>
              : uni.ADMCON7 && <span className="marca">SAT: {uni.ADMCON7.toLowerCase()}</span>}
          </span>
        </span>

        {/* Tres datos para comparar de un vistazo, siempre en la misma columna. */}
        <span className="fila-datos">
          <span className="dato">
            <span className="dato-valor numero">{formatPorcentaje(uni.ADM_RATE) ?? '—'}</span>
            <span className="dato-etiqueta">admisión</span>
          </span>
          <span className="dato">
            <span className="dato-valor numero">{uni.SAT_AVG ?? '—'}</span>
            <span className="dato-etiqueta">SAT prom.</span>
          </span>
          <span className="dato">
            <span className="dato-valor numero">{formatDinero(uni.TUITIONFEE_OUT) ?? '—'}</span>
            <span className="dato-etiqueta">matrícula</span>
          </span>
        </span>

        {/* Datos faltantes para los filtros que el usuario activó */}
        {incompleta && (
          <span className="fila-faltantes">
            {faltantes!.map(motivo => (
              <span key={motivo} className="marca marca-lucro">{motivo}</span>
            ))}
          </span>
        )}
      </button>
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
    <section className="panel" aria-labelledby="titulo-resultados">
      <div className="panel-cabecera lista-cabecera">
        <div>
          <h2 id="titulo-resultados" className="titulo-seccion">Resultados</h2>
          <p className="ayuda">
            {universidadesOrdenadas.length > 0
              ? `Mostrando ${primerResultado}–${ultimoResultado} de ${universidadesOrdenadas.length.toLocaleString()}. Toca una universidad para ver su ficha.`
              : `Ninguna de las ${totalUniversidades.toLocaleString()} universidades encaja todavía.`}
          </p>
        </div>

        <div className="orden">
          <label className="campo-etiqueta" htmlFor="ordenar-por">Ordenar por</label>
          <div className="orden-controles">
            <select id="ordenar-por" value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
            <option value="ninguno">Por defecto</option>
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
              type="button"
              className="boton"
              onClick={() => setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')}
              aria-label={ordenDireccion === 'asc' ? 'Orden ascendente; cambiar a descendente' : 'Orden descendente; cambiar a ascendente'}
            >
              {ordenDireccion === 'asc' ? '↑ Asc.' : '↓ Desc.'}
            </button>
          </div>
        </div>
      </div>

      {faltantesPorId.size > 0 && (
        <p className="nota-alerta lista-aviso">
          {faltantesPorId.size} resultados no tienen los datos que piden tus filtros.
          No se descartaron: van al final y aparecen marcados.
        </p>
      )}

      {universidadesFiltradas.length > 0 ? (
        <>
          <ul className="filas">
            {universidadesVisibles.map((uni, index) => (
              <FilaUniversidad
                key={uni._id ?? `${uni.INSTNM}-${uni.CITY}-${index}`}
                uni={uni}
                faltantes={uni._id != null ? faltantesPorId.get(uni._id) : undefined}
                onSeleccionar={onSeleccionar}
              />
            ))}
          </ul>

          <nav className="paginacion" aria-label="Páginas de resultados">
            <button type="button" className="boton" onClick={() => setPagina(1)} disabled={paginaSegura === 1}>
              « Primera
            </button>
            <button type="button" className="boton" onClick={() => setPagina(p => Math.max(1, p - 1))} disabled={paginaSegura === 1}>
              ‹ Anterior
            </button>
            <span className="paginacion-estado numero">
              Página <strong>{paginaSegura}</strong> de {totalPaginas}
            </span>
            <button type="button" className="boton" onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))} disabled={paginaSegura >= totalPaginas}>
              Siguiente ›
            </button>
            <button type="button" className="boton" onClick={() => setPagina(totalPaginas)} disabled={paginaSegura >= totalPaginas}>
              Última »
            </button>

            <label className="por-pagina">
              Por página
              <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))}>
                {OPCIONES_POR_PAGINA.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </nav>
        </>
      ) : (
        <div className="panel-cuerpo">
          <p className="vacio">
            Ninguna universidad encaja con todos tus filtros. Prueba subir la matrícula máxima,
            quitar el estado o cambiar la política SAT.
          </p>
        </div>
      )}
    </section>
  );
}
