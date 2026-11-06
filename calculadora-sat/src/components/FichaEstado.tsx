import { memo, useMemo } from 'react';
import type { Universidad } from '../types';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { formatDinero } from '../utils/formatters';
import { posicionUSNews, textoPuesto, ayudaPuesto, EDICION_USNEWS } from '../data/rankingUSNews';

/** Mediana redondeada como en ResumenEstado: lo "típico" sin que una universidad carísima lo mueva. */
function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : Math.round((orden[medio - 1] + orden[medio]) / 2);
}

interface Props {
  estado: string;
  /** Todas las universidades (sin filtros): la ficha describe el estado, no tus resultados. */
  universidades: Universidad[];
  /** Título más chico, para la burbuja del mapa. */
  compacta?: boolean;
}

/**
 * "[Estado] en cifras" y "Las mejores de [estado]": lo que se extrañaba de la portada de main.
 * Se calcula sobre todas las universidades del estado, para que no cambie al mover un filtro.
 */
export const FichaEstado = memo(function FichaEstado({ estado, universidades, compacta = false }: Props) {
  const datos = useMemo(() => {
    const del = universidades.filter(u => u.STABBR === estado);
    const publicas = del.filter(u => u.CONTROL === 'Pública').length;
    const sats = del.map(u => u.SAT_AVG).filter((v): v is number => v != null);
    const ciudades = new Map<string, number>();
    for (const u of del) if (u.CITY) ciudades.set(u.CITY, (ciudades.get(u.CITY) ?? 0) + 1);
    // Las del ranking, primero las nacionales y después las liberal arts (USNEWS_ORDEN ya las ordena así).
    const mejores = del.filter(u => u.USNEWS_ORDEN != null)
      .sort((a, b) => (a.USNEWS_ORDEN ?? 0) - (b.USNEWS_ORDEN ?? 0)).slice(0, 3);
    return {
      total: del.length,
      publicas,
      matricula: mediana(del.map(u => u.TUITIONFEE_OUT).filter((v): v is number => v != null)),
      sat: mediana(sats),
      conSat: sats.length,
      ciudades: [...ciudades].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c),
      mejores,
    };
  }, [estado, universidades]);

  const nombre = NOMBRES_ESTADOS[estado] ?? estado;
  if (datos.total === 0) return null;

  return (
    <div className={`ficha-estado${compacta ? ' ficha-estado-compacta' : ''}`}>
      <h2 className="ficha-estado-titulo">{nombre} en cifras</h2>
      <dl className="ficha-estado-cifras">
        <div>
          <dt>Universidades</dt>
          <dd className="numero">{datos.total.toLocaleString('en-US')}</dd>
        </div>
        <div>
          <dt>Son públicas</dt>
          <dd className="numero">{Math.round((datos.publicas / datos.total) * 100)}%</dd>
        </div>
        <div>
          <dt>Matrícula mediana</dt>
          <dd className="numero">{formatDinero(datos.matricula) ?? 'Sin datos'}</dd>
        </div>
        <div>
          <dt>SAT mediano</dt>
          <dd className="numero">{datos.sat ?? 'Sin datos'}</dd>
        </div>
      </dl>
      <p className="ficha-estado-nota">
        Matrícula para quien viene de fuera del estado. SAT: solo {datos.conSat} de {datos.total} lo informan.
      </p>
      {datos.ciudades.length > 0 && (
        <p className="ficha-estado-ciudades"><strong>Ciudades con más universidades:</strong> {datos.ciudades.join(', ')}</p>
      )}
      <div className="ficha-estado-mejores">
        <h3>Las mejores de {nombre}</h3>
        {datos.mejores.length > 0 ? (
          <ul>
            {datos.mejores.map(u => {
              const p = posicionUSNews(u);
              return (
                <li key={u._id}>
                  {p && <span className="ficha-estado-puesto" title={ayudaPuesto(p)}>{textoPuesto(p)}</span>}
                  <span>{u.INSTNM}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>Ninguna está en el top de U.S. News: en los resultados verás primero las de mejor salario de egresados.</p>
        )}
        <p className="ficha-estado-fuente">U.S. News Best Colleges {EDICION_USNEWS} · College Scorecard e IPEDS</p>
      </div>
    </div>
  );
});
