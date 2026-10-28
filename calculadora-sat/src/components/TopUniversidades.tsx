import { memo } from 'react';
import type { Universidad } from '../types';
import { posicionUSNews, textoPuesto, NOMBRE_LISTA, EDICION_USNEWS, FUENTE_USNEWS, nivelRanking } from '../data/rankingUSNews';
import type { Nivel } from '../utils/nivelSAT';
import { EtiquetaNivel } from './EtiquetaNivel';
import { formatDinero } from '../utils/formatters';

/** Una fila: número, nombre y lugar, y a la derecha por qué está (ranking, salario o SAT). */
function FilaTop({ uni, numero, onSeleccionar }: { uni: Universidad; numero: number; onSeleccionar: (uni: Universidad) => void }) {
  const ranking = posicionUSNews(uni);
  return (
    <li>
      <button type="button" className="top-fila" onClick={() => onSeleccionar(uni)}>
        <span className="top-numero numero">{numero}</span>
        <span className="top-identidad">
          <span className="top-nombre">{uni.INSTNM}</span>
          <span className="top-lugar">{uni.CITY}, {uni.STABBR}</span>
        </span>
        {ranking ? (
          <span className={`marca marca-ranking marca-ranking-${nivelRanking(ranking.puesto)} top-motivo`} title={`${NOMBRE_LISTA[ranking.lista]}. Fuente: ${FUENTE_USNEWS}`}>
            {textoPuesto(ranking)}
          </span>
        ) : uni.MD_EARN_WNE_4YR != null ? (
          <span className="marca top-motivo" title="Salario de egresados a 4 años (College Scorecard)">Salario {formatDinero(uni.MD_EARN_WNE_4YR)}</span>
        ) : (
          <span className="marca top-motivo">SAT prom. {uni.SAT_AVG}</span>
        )}
      </button>
    </li>
  );
}

/**
 * Las mejores entre tus resultados (las eligen utils/topUniversidades). Sin puntaje SAT, una
 * lista numerada. Con puntaje, "tu lista equilibrada": unas de probabilidad alta, otras media y
 * un par de baja, cada grupo con su título, como la arma un consejero.
 */
export const TopUniversidades = memo(function TopUniversidades({ universidades, grupos, lugar, onSeleccionar }: {
  universidades: Universidad[];
  /** Con puntaje: los grupos por nivel (null sin puntaje). */
  grupos: { nivel: Nivel; universidades: Universidad[] }[] | null;
  /** "Florida", o null para todo el país. */
  lugar: string | null;
  onSeleccionar: (uni: Universidad) => void;
}) {
  const conRanking = universidades.filter(u => posicionUSNews(u)).length;
  const titulo = grupos ? 'Tu lista equilibrada' : 'Top universidades';
  const vacio = grupos ? grupos.length === 0 : universidades.length === 0;
  let numero = 0;

  return (
    <div className="panel">
      <div className="panel-cabecera">
        <h2 className="titulo-seccion">{lugar ? `${titulo} en ${lugar}` : titulo}</h2>
        <p className="ayuda" title={`Fuente: ${FUENTE_USNEWS}`}>
          {grupos
            ? `En cada grupo, las mejores según el ranking U.S. News ${EDICION_USNEWS} y el salario de egresados.`
            : conRanking === universidades.length
            ? `Según el ranking U.S. News ${EDICION_USNEWS}, entre tus resultados.`
            : conRanking > 0
              ? `Primero las del ranking U.S. News ${EDICION_USNEWS}; después, las de mejor salario de egresados. Entre tus resultados.`
              : `Ninguno de tus resultados está en el top de U.S. News ${EDICION_USNEWS}: estas son las de mejor salario de egresados.`}
        </p>
      </div>

      <div className="panel-cuerpo">
        {vacio ? (
          <p className="vacio">Ninguno de tus resultados tiene ranking, salario ni SAT promedio publicado.</p>
        ) : grupos ? (
          grupos.map(g => (
            <section key={g.nivel} className="top-grupo" aria-label={g.nivel}>
              <h3 className="top-grupo-titulo"><EtiquetaNivel nivel={g.nivel} /></h3>
              <ol className="top-lista">
                {g.universidades.map(uni => <FilaTop key={uni._id ?? uni.INSTNM} uni={uni} numero={++numero} onSeleccionar={onSeleccionar} />)}
              </ol>
            </section>
          ))
        ) : (
          <ol className="top-lista">
            {universidades.map(uni => <FilaTop key={uni._id ?? uni.INSTNM} uni={uni} numero={++numero} onSeleccionar={onSeleccionar} />)}
          </ol>
        )}
      </div>
    </div>
  );
});
