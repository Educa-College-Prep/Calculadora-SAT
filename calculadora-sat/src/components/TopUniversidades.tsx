import { memo } from 'react';
import type { Universidad } from '../types';
import { posicionUSNews, textoPuesto, NOMBRE_LISTA, EDICION_USNEWS, FUENTE_USNEWS } from '../data/rankingUSNews';
import { clasificar } from '../utils/nivelSAT';
import { EtiquetaNivel } from './EtiquetaNivel';

/**
 * Lista numerada de las mejores entre tus resultados (la elige utils/topUniversidades). Con tu
 * puntaje SAT son "las mejores a tu alcance", y cada una muestra tu probabilidad de entrar.
 */
export const TopUniversidades = memo(function TopUniversidades({ universidades, lugar, onSeleccionar, puntajeSAT }: {
  universidades: Universidad[];
  /** "Florida", o null para todo el país. */
  lugar: string | null;
  onSeleccionar: (uni: Universidad) => void;
  /** Tu puntaje SAT total (0 = sin puntaje). */
  puntajeSAT: number;
}) {
  const conRanking = universidades.filter(u => posicionUSNews(u)).length;
  const conPuntaje = puntajeSAT > 0;
  const titulo = conPuntaje ? 'Las mejores a tu alcance' : 'Top universidades';

  return (
    <div className="panel">
      <div className="panel-cabecera">
        <h2 className="titulo-seccion">{lugar ? `${titulo} en ${lugar}` : titulo}</h2>
        <p className="ayuda" title={`Fuente: ${FUENTE_USNEWS}`}>
          {conPuntaje
            ? `Según el ranking U.S. News ${EDICION_USNEWS}, primero donde tu probabilidad es alta o media; al final, algunas de probabilidad baja.`
            : conRanking === universidades.length
            ? `Según el ranking U.S. News ${EDICION_USNEWS}, entre tus resultados.`
            : conRanking > 0
              ? `Primero las del ranking U.S. News ${EDICION_USNEWS}; después, las de SAT promedio más alto. Entre tus resultados.`
              : `Ninguno de tus resultados está en el top de U.S. News ${EDICION_USNEWS}: estas son las de SAT promedio más alto.`}
        </p>
      </div>

      <div className="panel-cuerpo">
        {universidades.length === 0 ? (
          <p className="vacio">Ninguno de tus resultados tiene ranking ni SAT promedio publicado.</p>
        ) : (
          <ol className="top-lista">
            {universidades.map((uni, i) => {
              const ranking = posicionUSNews(uni);
              const nivel = conPuntaje ? clasificar(uni, puntajeSAT) : null;
              return (
                <li key={uni._id ?? uni.INSTNM}>
                  <button type="button" className="top-fila" onClick={() => onSeleccionar(uni)}>
                    <span className="top-numero numero">{i + 1}</span>
                    <span className="top-identidad">
                      <span className="top-nombre">{uni.INSTNM}</span>
                      <span className="top-lugar">{uni.CITY}, {uni.STABBR}</span>
                      {nivel && <EtiquetaNivel nivel={nivel} />}
                    </span>
                    {ranking ? (
                      <span className="marca marca-ranking top-motivo" title={`${NOMBRE_LISTA[ranking.lista]}. Fuente: ${FUENTE_USNEWS}`}>
                        {textoPuesto(ranking)}
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
