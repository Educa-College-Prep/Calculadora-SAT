import { memo, useEffect, useMemo, useState } from 'react';
import type { Universidad } from '../types';
import { formatNivel, formatDinero, formatPorcentaje, chipPoliticaSAT } from '../utils/formatters';
import { BotonGuardar } from './BotonGuardar';
import { claveUniversidad } from '../utils/useMiLista';
import { posicionUSNews, textoPuesto, NOMBRE_LISTA, FUENTE_USNEWS, nivelRanking } from '../data/rankingUSNews';
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
  /** Texto del buscador: si no hay resultados por él, el vacío lo dice y ofrece borrarlo. */
  busqueda: string;
  onBorrarBusqueda: () => void;
}

const OPCIONES_POR_PAGINA = [25, 50, 100, 200];

/** Color de la etiqueta según el tipo de institución (mismo código en toda la web). */
function claseControl(control: string | null): string {
  return control === 'Pública' ? 'marca marca-publica' : 'marca marca-privada';
}

/** Datos que la fila no muestra pero por los que se puede ordenar: se agregan como cuarta columna. */
const DATO_ORDEN: Record<string, { etiqueta: string; valor: (u: Universidad) => string | null }> = {
  SAT_AVG: { etiqueta: 'SAT promedio', valor: u => (u.SAT_AVG != null ? String(u.SAT_AVG) : null) },
  MD_EARN_WNE_4YR: { etiqueta: 'salario a 4 años', valor: u => formatDinero(u.MD_EARN_WNE_4YR) },
};

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
  ordenarPor,
  guardarConTexto,
}: {
  uni: Universidad;
  faltantes?: string[];
  onSeleccionar: (uni: Universidad) => void;
  guardada: boolean;
  onAlternarGuardada: (uni: Universidad) => void;
  nivel: Nivel | null;
  /** El criterio de "Ordenar por": su dato se resalta (o se agrega) para que se vea por qué va aquí. */
  ordenarPor: string;
  /** "Guardar" con texto mientras Mi lista está vacía: así se entiende qué hace la estrella. */
  guardarConTexto: boolean;
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
              <span className={`marca marca-ranking marca-ranking-${nivelRanking(ranking.puesto)}`} title={`${NOMBRE_LISTA[ranking.lista]}. Fuente: ${FUENTE_USNEWS}`}>
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
          <span className={`dato${ordenarPor === 'ADM_RATE' ? ' dato-orden' : ''}`}>
            <span className="dato-valor numero">{formatPorcentaje(uni.ADM_RATE) ?? '—'}</span>
            <span className="dato-etiqueta">admisión</span>
          </span>
          {/* El rango (percentiles 25 y 75) y no el promedio: es con lo que se decide
              si es de probabilidad alta, intermedia o baja, así la etiqueta y el número cuadran. */}
          <span className="dato" title="El 50% de los admitidos sacó un puntaje dentro de este rango">
            <span className="dato-valor numero">{rango ? `${rango[0]}–${rango[1]}` : '—'}</span>
            <span className="dato-etiqueta">rango SAT</span>
          </span>
          {/* Costo real al año (matrícula + vida), como el "Costo anual total" de la ficha.
              "~" = el costo de vida es estimado. */}
          <span className={`dato${ordenarPor === 'COSTO_ANUAL' ? ' dato-orden' : ''}`}
            title="Matrícula (out-of-state) más vivienda, comida y libros, antes de becas">
            <span className="dato-valor numero">
              {uni.COSTO_ANUAL != null ? `${uni.COSTO_ANUAL_ESTIMADO ? '~' : ''}${formatDinero(uni.COSTO_ANUAL)}` : '—'}
            </span>
            <span className="dato-etiqueta">costo al año</span>
          </span>
          {/* Ordenando por un dato que la fila no muestra, se agrega: así se ve por qué va aquí. */}
          {DATO_ORDEN[ordenarPor] && (
            <span className="dato dato-orden">
              <span className="dato-valor numero">{DATO_ORDEN[ordenarPor].valor(uni) ?? '—'}</span>
              <span className="dato-etiqueta">{DATO_ORDEN[ordenarPor].etiqueta}</span>
            </span>
          )}
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
      <BotonGuardar guardada={guardada} nombre={uni.INSTNM} onAlternar={() => onAlternarGuardada(uni)} etiqueta={guardarConTexto} />
    </li>
  );
});

/**
 * Criterios de "Ordenar por". Pocos y en palabras del estudiante: lo que de verdad compara al
 * elegir universidad. Cada uno trae su dirección natural (la que se aplica al elegirlo).
 */
const ORDENES: { valor: string; texto: string; direccion?: 'asc' | 'desc' }[] = [
  { valor: 'ninguno', texto: 'Recomendado' },
  { valor: 'USNEWS_ORDEN', texto: 'Ranking U.S. News 2027', direccion: 'asc' },
  { valor: 'ADM_RATE', texto: 'Tasa de admisión', direccion: 'desc' },
  { valor: 'SAT_AVG', texto: 'SAT promedio', direccion: 'desc' },
  { valor: 'COSTO_ANUAL', texto: 'Costo al año', direccion: 'asc' },
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
  busqueda,
  onBorrarBusqueda,
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
          {ordenarPor === 'ninguno' && (
            <p className="ayuda orden-explicacion">
              {puntajeSAT > 0
                ? 'Primero donde tu probabilidad es alta, luego media y baja; en cada una, por ranking y salario.'
                : 'Primero las del ranking U.S. News; luego por salario de egresados.'}
            </p>
          )}
        </div>
      </div>

      {/* Informativo, no alerta: que una universidad no publique SAT no es un error (muchas no
          lo piden y deciden por el resto del perfil). */}
      {faltantesPorId.size > 0 && (
        <p className="nota-info lista-aviso">
          {[...faltantesPorId.values()].every(f => f.length === 1 && f[0] === 'Sin datos SAT')
            ? `${faltantesPorId.size.toLocaleString('en-US')} no publican puntajes SAT: muchas no lo piden y deciden por tus notas, ensayos y actividades. Están al final de la lista, marcadas.`
            : `${faltantesPorId.size.toLocaleString('en-US')} no tienen alguno de los datos que piden tus filtros. Están al final de la lista, marcadas.`}
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
                ordenarPor={ordenarPor}
                guardarConTexto={guardadas.size === 0}
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
          {/* El vacío nombra la causa: si hay búsqueda, casi siempre es ella. */}
          {busqueda.trim() ? (
            <p className="vacio">
              Ninguna universidad coincide con “{busqueda.trim()}” y tus filtros.{' '}
              <button type="button" className="boton" onClick={onBorrarBusqueda}>Borrar la búsqueda</button>
            </p>
          ) : (
            <p className="vacio">
              Ninguna universidad encaja con todos tus filtros. Prueba subir el costo máximo,
              quitar el estado o cambiar la política SAT.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
