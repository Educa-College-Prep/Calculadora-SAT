import { memo, useState } from 'react';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { CUADRITOS } from '../utils/cuadritos';

interface Props {
  /** Universidades por estado (con los filtros que correspondan): el número de cada cuadrito. */
  conteo: Record<string, number>;
  seleccion: string[];
  /** El estado cuya ficha se está viendo: lleva un borde para saber cuál es. */
  foco?: string | null;
  onTocar: (estado: string) => void;
  /** 'chico' = la burbuja de resultados: sin números ni la línea de ayuda. */
  variante?: 'grande' | 'chico';
}

export const MapaCuadritos = memo(function MapaCuadritos({ conteo, seleccion, foco = null, onTocar, variante = 'grande' }: Props) {
  // El estado bajo el mouse (o con el foco del teclado): su nombre se lee grande arriba del mapa,
  // porque "RI" o "WV" no le dicen nada a quien no conoce EE. UU.
  const [encima, setEncima] = useState<string | null>(null);
  const elegidos = new Set(seleccion);
  const chico = variante === 'chico';
  // En celular no hay "pasar el mouse": ahí la ayuda dice que se toque.
  const conMouse = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const pista = encima
    ? `${(conteo[encima] ?? 0).toLocaleString('en-US')} universidades · ${elegidos.has(encima)
        ? (encima === foco || !foco ? 'toca otra vez para quitarlo' : 'toca para ver sus cifras')
        : 'toca para elegirlo'}`
    : '';

  return (
    <div className={`cuadritos cuadritos-${variante}`}>
      <div className="cuadritos-pista" aria-hidden="true">
        {encima
          ? <><span className="cuadritos-pista-nombre">{NOMBRES_ESTADOS[encima] ?? encima}</span>{!chico && <span className="cuadritos-pista-detalle">{pista}</span>}</>
          : <span className="cuadritos-pista-vacia">{conMouse && !chico ? 'Pasa el mouse por el mapa' : 'Toca un estado'}</span>}
      </div>
      <div className="cuadritos-grilla" onMouseLeave={() => setEncima(null)}>
        {CUADRITOS.map(([st, col, fila]) => {
          const n = conteo[st] ?? 0;
          const elegido = elegidos.has(st);
          return (
            <button
              key={st}
              type="button"
              className={`cuadrito${elegido ? ' cuadrito-elegido' : ''}${st === foco ? ' cuadrito-foco' : ''}${encima === st ? ' cuadrito-encima' : ''}`}
              style={{ gridColumn: col + 1, gridRow: fila + 1 }}
              aria-pressed={elegido}
              aria-label={`${NOMBRES_ESTADOS[st] ?? st}, ${n.toLocaleString('en-US')} universidades`}
              onMouseEnter={() => setEncima(st)}
              onFocus={() => setEncima(st)}
              onBlur={() => setEncima(null)}
              onClick={() => onTocar(st)}
            >
              {/* El nombre completo sobre el mismo cuadrito: "WV" no le dice nada a quien no conoce EE. UU.
                  En los bordes se alinea hacia adentro, para que no se salga del mapa. */}
              {encima === st && (
                <span className={`cuadrito-globo${col <= 1 ? ' cuadrito-globo-izq' : col >= 9 ? ' cuadrito-globo-der' : ''}`} aria-hidden="true">
                  {NOMBRES_ESTADOS[st] ?? st}
                </span>
              )}
              <span className="cuadrito-sigla">{st}</span>
              {!chico && <span className="cuadrito-numero numero">{n.toLocaleString('en-US')}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
});
