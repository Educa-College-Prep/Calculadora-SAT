import { memo, useEffect, useMemo, useState } from 'react';
import type { Universidad } from '../types';
import { formatNivel, formatDinero, formatPorcentaje, chipPoliticaSAT } from '../utils/formatters';
import { BotonGuardar } from './BotonGuardar';
import { claveUniversidad } from '../utils/useMiLista';
import { posicionUSNews, textoPuesto, NOMBRE_LISTA, FUENTE_USNEWS } from '../data/rankingUSNews';
import { clasificar, rangoSAT } from '../utils/nivelSAT';
import type { Nivel } from '../utils/nivelSAT';
import { EtiquetaNivel } from './EtiquetaNivel';

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
  /** Claves (claveUniversidad) de las universidades en "Mi lista". */
  guardadas: Set<string>;
  onAlternarGuardada: (uni: Universidad) => void;
  /** Tu puntaje SAT total (0 = sin puntaje): para la etiqueta Probabilidad alta / media / baja. */
  puntajeSAT: number;
}

const OPCIONES_POR_PAGINA = [25, 50, 100, 200];

/** Color de la etiqueta según el tipo de institución (mismo código en toda la web). */
function claseControl(control: string | null): string {
  return control === 'Pública' ? 'marca marca-publica' : 'marca marca-privada';
}

/**
 * Cada tarjeta va memoizada: al cambiar de página o de orden, React solo
 * re-renderiza las filas cuyos datos cambiaron, no las 4300.
 */
const FilaUniversidad = memo(function FilaUniversidad({
  uni,
  faltantes,
  onSeleccionar,
  guardada,
  onAlternarGuardada,
  nivel,
}: {
  uni: Universidad;
  faltantes?: string[];
  onSeleccionar: (uni: Universidad) => void;
  guardada: boolean;
  onAlternarGuardada: (uni: Universidad) => void;
  nivel: Nivel | null;
}) {
  const incompleta = !!faltantes?.length;
  const ranking = posicionUSNews(uni);
  const rango = rangoSAT(uni);
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
            {nivel && <EtiquetaNivel nivel={nivel} />}
            {ranking && (
              <span className="marca marca-ranking" title={`${NOMBRE_LISTA[ranking.lista]}. Fuente: ${FUENTE_USNEWS}`}>
                {textoPuesto(ranking)}
              </span>
            )}
            {uni.CONTROL && <span className={claseControl(uni.CONTROL)}>{uni.CONTROL}</span>}
            {uni.ICLEVEL && <span className="marca">{formatNivel(uni.ICLEVEL)}</span>}
            {chipPoliticaSAT(uni.ADMCON7) && (
              <span className={`marca${uni.ADMCON7 === 'Requerido' ? ' marca-sat' : ''}`}>{chipPoliticaSAT(uni.ADMCON7)}</span>
            )}
          </span>
        </span>

        {/* Tres datos para comparar de un vistazo, siempre en la misma columna. */}
        <span className="fila-datos">
          <span className="dato">
            <span className="dato-valor numero">{formatPorcentaje(uni.ADM_RATE) ?? '—'}</span>
            <span className="dato-etiqueta">admisión</span>
          </span>
          {/* El rango (percentiles 25 y 75) y no el promedio: es con lo que se decide
              si es de probabilidad alta, intermedia o baja, así la etiqueta y el número cuadran. */}
          <span className="dato" title="El 50% de los admitidos sacó un puntaje dentro de este rango">
            <span className="dato-valor numero">{rango ? `${rango[0]}–${rango[1]}` : '—'}</span>
            <span className="dato-etiqueta">rango SAT</span>
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
              <span key={motivo} className="marca marca-aviso">{motivo}</span>
            ))}
          </span>
        )}
      </button>
      <BotonGuardar guardada={guardada} nombre={uni.INSTNM} onAlternar={() => onAlternarGuardada(uni)} />
    </li>
  );
});

/**
 * Criterios de "Ordenar por". Pocos y en palabras del estudiante: lo que de verdad compara al
 * elegir universidad. Cada uno trae su dirección natural (la que se aplica al elegirlo).
 */
const ORDENES: { valor: string; texto: string; direccion?: 'asc' | 'desc' }[] = [
  { valor: 'ninguno', texto: 'Por defecto' },
  { valor: 'USNEWS_ORDEN', texto: 'Ranking U.S. News 2027', direccion: 'asc' },
  { valor: 'ADM_RATE', texto: 'Tasa de admisión', direccion: 'desc' },
  { valor: 'SAT_AVG', texto: 'SAT promedio', direccion: 'desc' },
  { valor: 'TUITIONFEE_OUT', texto: 'Matrícula', direccion: 'asc' },
  { valor: 'MD_EARN_WNE_4YR', texto: 'Salario de egresados', direccion: 'desc' },
  { valor: 'INSTNM', texto: 'Nombre', direccion: 'asc' },
];

/** Qué dice el botón de dirección según el criterio: "Mayor primero", "A → Z", "#1 primero". */
function textoDireccion(orden: { valor: string }, direccion: 'asc' | 'desc'): string {
  if (orden.valor === 'INSTNM') return direccion === 'asc' ? 'A → Z' : 'Z → A';
  if (orden.valor === 'USNEWS_ORDEN') return direccion === 'asc' ? '#1 primero' : '#1 al final';
  return direccion === 'asc' ? 'Menor primero' : 'Mayor primero';
}

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
  guardadas,
  onAlternarGuardada,
  puntajeSAT,
}: Props) {
  const [porPagina, setPorPagina] = useState<number>(50);
  const [pagina, setPagina] = useState<number>(1);
  const ordenActual = ORDENES.find(o => o.valor === ordenarPor);

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
            <select id="ordenar-por" value={ordenarPor} onChange={(e) => {
              // Al elegir un criterio, la dirección natural: la matrícula más barata primero, el
              // salario más alto primero… Después se puede invertir con el botón.
              const criterio = ORDENES.find(o => o.valor === e.target.value);
              setOrdenarPor(e.target.value);
              if (criterio?.direccion) setOrdenDireccion(criterio.direccion);
            }}>
              {ORDENES.map(o => <option key={o.valor} value={o.valor}>{o.texto}</option>)}
            </select>
            {ordenActual?.direccion && (
              <button
                type="button"
                className="boton"
                onClick={() => setOrdenDireccion(ordenDireccion === 'asc' ? 'desc' : 'asc')}
                aria-label={`${textoDireccion(ordenActual, ordenDireccion)}. Cambiar a ${textoDireccion(ordenActual, ordenDireccion === 'asc' ? 'desc' : 'asc').toLowerCase()}`}
              >
                {textoDireccion(ordenActual, ordenDireccion)}
              </button>
            )}
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
                guardada={guardadas.has(claveUniversidad(uni))}
                onAlternarGuardada={onAlternarGuardada}
                nivel={puntajeSAT > 0 ? clasificar(uni, puntajeSAT) : null}
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
