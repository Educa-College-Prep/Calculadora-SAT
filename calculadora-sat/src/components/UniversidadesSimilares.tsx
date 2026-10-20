import { useMemo } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje } from '../utils/formatters';
import { universidadesSimilares } from '../utils/similares';

/** Diferencia de matrícula respecto de la universidad que se está viendo. */
function diferencia(otra: number | null | undefined, base: number | null | undefined): { texto: string; clase: string } | null {
  if (otra == null || base == null) return null;
  const d = otra - base;
  if (Math.abs(d) < 500) return { texto: 'casi igual', clase: '' };
  return d < 0
    ? { texto: `${formatDinero(-d)} menos`, clase: 'similar-menos' }
    : { texto: `${formatDinero(d)} más`, clase: 'similar-mas' };
}

/** 4 llena sin huecos la grilla de 4 columnas, la de 2 y la de 1. */
const CANTIDAD = 4;

export function UniversidadesSimilares({ uni, universidades, onSeleccionar }: {
  uni: Universidad;
  universidades: Universidad[];
  onSeleccionar: (uni: Universidad) => void;
}) {
  const similares = useMemo(() => {
    const lista = universidadesSimilares(uni, universidades, CANTIDAD);
    // Filas completas: en el raro caso de que haya menos de 4, se deja un número par
    // para que la grilla de 2 columnas no quede con un hueco.
    return lista.length > 1 ? lista.slice(0, lista.length - (lista.length % 2)) : lista;
  }, [uni, universidades]);
  if (similares.length === 0) return null;

  return (
    <>
      <p className="ficha-intro">
        Parecidas en nivel SAT, selectividad, tamaño, matrícula y salario de egresados.
      </p>
      <div className="similares-envoltura">
        <ul className="similares">
          {similares.map(({ uni: otra, parecidaEn }) => {
            const dif = diferencia(otra.TUITIONFEE_OUT, uni.TUITIONFEE_OUT);
            return (
              <li key={`${otra.INSTNM}|${otra.CITY}`}>
                <button type="button" className="similar" onClick={() => onSeleccionar(otra)}>
                  <span className="similar-nombre">{otra.INSTNM}</span>
                  <span className="similar-lugar">{otra.CITY}, {otra.STABBR} · {otra.CONTROL}</span>
                  <span className="similar-datos numero">
                    <span>
                      Matrícula <strong>{formatDinero(otra.TUITIONFEE_OUT) ?? '—'}</strong>
                      {dif && <span className={`similar-dif ${dif.clase}`}> ({dif.texto})</span>}
                    </span>
                    <span>Admite <strong>{formatPorcentaje(otra.ADM_RATE) ?? '—'}</strong></span>
                    {otra.SAT_AVG != null && <span>SAT prom. <strong>{otra.SAT_AVG}</strong></span>}
                  </span>
                  {parecidaEn.length > 0 && (
                    <span className="similar-razon">Parecida en {parecidaEn.join(', ')}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <p className="similares-pista" aria-hidden="true">Desliza para ver las {similares.length} →</p>
      </div>
    </>
  );
}
