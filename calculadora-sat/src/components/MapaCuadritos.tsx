import { memo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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

const POSICION = new Map(CUADRITOS.map(([st, col, fila]) => [st, { col, fila }]));

/**
 * El cuadrito más cercano en una dirección (flechas del teclado). Se prefiere el que está en la
 * misma fila o columna; si hay un hueco (el mapa no es un rectángulo), salta al más próximo.
 */
function vecino(desde: string, dx: number, dy: number): string | null {
  const p = POSICION.get(desde);
  if (!p) return null;
  let mejor: string | null = null;
  let mejorPuntaje = Infinity;
  for (const [st, col, fila] of CUADRITOS) {
    const avance = dx ? (col - p.col) * dx : (fila - p.fila) * dy;
    if (avance <= 0) continue;
    const desvio = dx ? Math.abs(fila - p.fila) : Math.abs(col - p.col);
    const puntaje = avance + desvio * 3;
    if (puntaje < mejorPuntaje) { mejorPuntaje = puntaje; mejor = st; }
  }
  return mejor;
}

const FLECHAS: Record<string, [number, number]> = {
  ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1],
};

export const MapaCuadritos = memo(function MapaCuadritos({ conteo, seleccion, foco = null, onTocar, variante = 'grande' }: Props) {
  // El estado bajo el mouse (o con el foco del teclado): su nombre sale en un globito sobre el
  // cuadrito, porque "RI" o "WV" no le dicen nada a quien no conoce EE. UU.
  const [encima, setEncima] = useState<string | null>(null);
  // El único cuadrito al que se llega con Tab (el resto, con flechas): cruzar el mapa eran 52 Tab.
  const [tabulable, setTabulable] = useState<string>(() => foco ?? seleccion[0] ?? 'TX');
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const elegidos = new Set(seleccion);
  const chico = variante === 'chico';
  // En celular no hay "pasar el mouse": ahí la ayuda dice que se toque.
  const conMouse = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const pista = encima
    ? `${(conteo[encima] ?? 0).toLocaleString('en-US')} universidades · ${elegidos.has(encima)
        ? (encima === foco || !foco ? 'toca otra vez para quitarlo' : 'toca para ver sus cifras')
        : 'toca para elegirlo'}`
    : conMouse ? 'Pasa el mouse por el mapa' : 'Toca un estado';

  const alTeclear = (e: KeyboardEvent<HTMLButtonElement>, st: string) => {
    const flecha = FLECHAS[e.key];
    if (!flecha) return;
    e.preventDefault();
    const siguiente = vecino(st, flecha[0], flecha[1]);
    if (siguiente) {
      setTabulable(siguiente);
      botones.current.get(siguiente)?.focus();
    }
  };

  return (
    <div className={`cuadritos cuadritos-${variante}`}>
      {/* Alto fijo y una sola línea: si cambiaba de alto al tocar, la grilla se movía bajo el dedo
          y el toque caía en el estado de al lado (o en ninguno). */}
      {!chico && <p className="cuadritos-pista" aria-hidden="true">{pista}</p>}
      <div className="cuadritos-grilla" role="group" aria-label="Mapa de estados. Usa las flechas para moverte."
        onPointerLeave={() => setEncima(null)}>
        {CUADRITOS.map(([st, col, fila]) => {
          const n = conteo[st] ?? 0;
          const elegido = elegidos.has(st);
          return (
            <button
              key={st}
              ref={el => { if (el) botones.current.set(st, el); else botones.current.delete(st); }}
              type="button"
              className={`cuadrito${elegido ? ' cuadrito-elegido' : ''}${st === foco ? ' cuadrito-foco' : ''}${encima === st ? ' cuadrito-encima' : ''}`}
              style={{ gridColumn: col + 1, gridRow: fila + 1 }}
              tabIndex={st === tabulable ? 0 : -1}
              aria-pressed={elegido}
              aria-label={`${NOMBRES_ESTADOS[st] ?? st}, ${n.toLocaleString('en-US')} universidades`}
              // Solo con mouse de verdad: en pantallas táctiles el "hover" llegaba junto con el
              // toque y cambiaba lo que se veía justo en ese momento.
              onPointerEnter={e => { if (e.pointerType === 'mouse') setEncima(st); }}
              onFocus={e => { setTabulable(st); if (e.currentTarget.matches(':focus-visible')) setEncima(st); }}
              onBlur={() => setEncima(null)}
              onKeyDown={e => alTeclear(e, st)}
              onClick={() => onTocar(st)}
            >
              {/* El nombre completo sobre el mismo cuadrito. En los bordes se alinea hacia adentro,
                  para que no se salga del mapa. */}
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
