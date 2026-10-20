import { memo } from 'react';
import type { Universidad } from '../types';
import { posicionUSNews, textoPuesto, EDICION_USNEWS, FUENTE_USNEWS } from '../data/rankingUSNews';

/** Lista numerada de las mejores entre tus resultados (la elige utils/topUniversidades). */
export const TopUniversidades = memo(function TopUniversidades({ universidades, lugar, onSeleccionar }: {
  universidades: Universidad[];
  /** "Florida", o null para todo el país. */
  lugar: string | null;
  onSeleccionar: (uni: Universidad) => void;
}) {
  const conRanking = universidades.filter(u => posicionUSNews(u)).length;

  return (
    <div className="panel">
      <div className="panel-cabecera">
        <h2 className="titulo-seccion">{lugar ? `Top universidades en ${lugar}` : 'Top universidades'}</h2>
        <p className="ayuda" title={`Fuente: ${FUENTE_USNEWS}`}>
          {conRanking === universidades.length
            ? `Según el ranking U.S. News ${EDICION_USNEWS}, entre tus resultados.`
            : conRanking > 0
              ? `Primero las del ranking U.S. News ${EDICION_USNEWS}; después, las de SAT promedio más alto. Entre tus resultados.`
              : `Ninguna de tus resultados está en el top de U.S. News ${EDICION_USNEWS}: estas son las de SAT promedio más alto.`}
        </p>
      </div>

      <div className="panel-cuerpo">
        {universidades.length === 0 ? (
          <p className="vacio">Ninguna de tus resultados tiene ranking ni SAT promedio publicado.</p>
        ) : (
          <ol className="top-lista">
            {universidades.map((uni, i) => {
              const ranking = posicionUSNews(uni);
              return (
                <li key={uni._id ?? uni.INSTNM}>
                  <button type="button" className="top-fila" onClick={() => onSeleccionar(uni)}>
                    <span className="top-numero numero">{i + 1}</span>
                    <span className="top-identidad">
                      <span className="top-nombre">{uni.INSTNM}</span>
                      <span className="top-lugar">{uni.CITY}, {uni.STABBR}</span>
                    </span>
                    {ranking ? (
                      <span className="marca marca-ranking top-motivo">
                        U.S. News {textoPuesto(ranking)}{ranking.lista === 'liberal-arts' ? ' LAC' : ''}
                      </span>
                    ) : (
                      <span className="marca top-motivo">SAT prom. {uni.SAT_AVG}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
});
