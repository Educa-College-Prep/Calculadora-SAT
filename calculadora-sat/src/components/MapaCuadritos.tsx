import { memo, useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent } from 'react';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { CUADRITOS } from '../utils/cuadritos';

interface Props {
  /** Universidades por estado (con los filtros que correspondan): el número de cada cuadrito. */
  conteo: Record<string, number>;
  seleccion: string[];
  /** El estado cuya ficha se está viendo: lleva un borde para saber cuál es. */
  foco?: string | null;
  /** La selección nueva y el estado que la cambió (el último tocado o pintado). */
  onCambiar: (seleccion: string[], tocado: string) => void;
  /** Avisa qué estado tiene el mouse encima (null al salir del mapa): la ficha lo muestra. */
  onEncima?: (estado: string | null) => void;
  /** 'incluir' = dónde quiero estudiar (amarillo); 'excluir' = dónde no (rojo, con un temblor). */
  modo?: 'incluir' | 'excluir';
  /** Mapa de calor: cada estado se pinta más oscuro cuantas más universidades le quedan. */
  calor?: boolean;
  /** true un instante al entrar al modo "excluir": todos los cuadritos tiemblan una vez. */
  temblando?: boolean;
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

export const MapaCuadritos = memo(function MapaCuadritos({
  conteo, seleccion, foco = null, onCambiar, onEncima, modo = 'incluir', calor = false, temblando = false, variante = 'grande',
}: Props) {
  // El estado bajo el mouse (o con el foco del teclado): su nombre sale en un globito sobre el
  // cuadrito, porque "RI" o "WV" no le dicen nada a quien no conoce EE. UU.
  const [encima, setEncimaInterno] = useState<string | null>(null);
  const setEncima = (st: string | null) => { setEncimaInterno(st); onEncima?.(st); };
  // El único cuadrito al que se llega con Tab (el resto, con flechas): cruzar el mapa eran 52 Tab.
  const [tabulable, setTabulable] = useState<string>(() => foco ?? seleccion[0] ?? 'TX');
  const botones = useRef(new Map<string, HTMLButtonElement>());
  const elegidos = new Set(seleccion);
  const chico = variante === 'chico';
  const excluir = modo === 'excluir';
  // En celular no hay "pasar el mouse": ahí la ayuda dice que se toque.
  const conMouse = typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  // Pintar arrastrando (solo con mouse): al apretar el clic sobre un estado se decide si se marca
  // o se desmarca (lo contrario de lo que estaba), y cada estado por el que pasa el mouse con el
  // clic apretado recibe lo mismo. En celular arrastrar el dedo tiene que seguir moviendo la página.
  // La selección en curso vive en un ref: los eventos llegan más rápido de lo que React re-dibuja.
  const pintando = useRef<{ marcar: boolean; seleccion: Set<string> } | null>(null);
  // El clic que el navegador manda al soltar sobre el mismo estado ya se aplicó al apretar. No se
  // limpia con un temporizador (el orden entre soltar y el clic no está garantizado): lo vuelve a
  // fijar el próximo apretar, y los clics del teclado (detail 0) nunca se ignoran.
  const ignorarClic = useRef(false);
  useEffect(() => {
    const soltar = () => { pintando.current = null; };
    window.addEventListener('pointerup', soltar);
    window.addEventListener('pointercancel', soltar);
    return () => {
      window.removeEventListener('pointerup', soltar);
      window.removeEventListener('pointercancel', soltar);
    };
  }, []);

  const pintar = (st: string) => {
    const p = pintando.current;
    if (!p || p.seleccion.has(st) === p.marcar) return;
    if (p.marcar) p.seleccion.add(st); else p.seleccion.delete(st);
    onCambiar([...p.seleccion], st);
  };
  const alApretar = (e: PointerEvent<HTMLButtonElement>, st: string) => {
    ignorarClic.current = false;
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pintando.current = { marcar: !elegidos.has(st), seleccion: new Set(seleccion) };
    ignorarClic.current = true;
    pintar(st);
  };
  const alTocar = (st: string, detalle: number) => {
    if (ignorarClic.current && detalle !== 0) { ignorarClic.current = false; return; }
    onCambiar(elegidos.has(st) ? seleccion.filter(x => x !== st) : [...seleccion, st], st);
  };

  const accion = (st: string) => elegidos.has(st)
    ? (excluir ? 'toca para volver a incluirlo' : 'toca para quitarlo')
    : (excluir ? 'toca para descartarlo' : 'toca para elegirlo');
  const pista = encima
    ? `${(conteo[encima] ?? 0).toLocaleString('en-US')} universidades · ${accion(encima)}`
    : conMouse ? 'Pasa el mouse por el mapa. Mantén el clic y arrastra para marcar varios.' : 'Toca un estado';

  // Mapa de calor: la raíz cuadrada del conteo, para que los estados chicos no queden todos
  // iguales de pálidos al lado de California (~250) o Nueva York (~200). El máximo es el de lo
  // que queda ahora: los colores se recalculan con cada respuesta.
  const maximo = Math.max(1, ...Object.values(conteo));
  const intensidad = (n: number) => Math.sqrt(n / maximo);

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
    <div className={`cuadritos cuadritos-${variante}${calor ? ' cuadritos-calor' : ''}${excluir ? ' cuadritos-excluir' : ''}${temblando ? ' cuadritos-temblando' : ''}`}>
      {/* Alto fijo y una sola línea: si cambiaba de alto al tocar, la grilla se movía bajo el dedo
          y el toque caía en el estado de al lado (o en ninguno). */}
      {!chico && <p className="cuadritos-pista" aria-hidden="true">{pista}</p>}
      <div className="cuadritos-grilla" role="group" aria-label="Mapa de estados. Usa las flechas para moverte."
        onPointerLeave={() => setEncima(null)}>
        {CUADRITOS.map(([st, col, fila]) => {
          const n = conteo[st] ?? 0;
          const elegido = elegidos.has(st);
          const t = intensidad(n);
          return (
            <button
              key={st}
              ref={el => { if (el) botones.current.set(st, el); else botones.current.delete(st); }}
              type="button"
              className={`cuadrito${elegido ? (excluir ? ' cuadrito-excluido' : ' cuadrito-elegido') : ''}${st === foco ? ' cuadrito-foco' : ''}${encima === st ? ' cuadrito-encima' : ''}${calor && n === 0 ? ' cuadrito-vacio' : ''}${calor && t > 0.55 ? ' cuadrito-oscuro' : ''}`}
              style={{ gridColumn: col + 1, gridRow: fila + 1, '--calor': t.toFixed(3) } as CSSProperties}
              tabIndex={st === tabulable ? 0 : -1}
              aria-pressed={elegido}
              aria-label={`${NOMBRES_ESTADOS[st] ?? st}, ${n.toLocaleString('en-US')} universidades${elegido && excluir ? ', descartado' : ''}`}
              // Solo con mouse de verdad: en pantallas táctiles el "hover" llegaba junto con el
              // toque y cambiaba lo que se veía justo en ese momento.
              onPointerEnter={e => { if (e.pointerType === 'mouse') { setEncima(st); pintar(st); } }}
              onPointerDown={e => alApretar(e, st)}
              onFocus={e => { setTabulable(st); if (e.currentTarget.matches(':focus-visible')) setEncima(st); }}
              onBlur={() => setEncima(null)}
              onKeyDown={e => alTeclear(e, st)}
              onClick={e => alTocar(st, e.detail)}
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
      {calor && !chico && (
        <div className="cuadritos-leyenda" aria-hidden="true">
          <span>Menos</span>
          <span className="cuadritos-leyenda-barra" />
          <span>Más universidades que encajan contigo</span>
        </div>
      )}
    </div>
  );
});
