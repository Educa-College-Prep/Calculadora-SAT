import { memo, useEffect, useMemo, useState } from 'react';
import type { Universidad } from '../types';
import { claveCiudad } from '../utils/normalizar';
import { NOMBRES_ESTADOS } from '../utils/estados';

interface Props {
  universidades: Universidad[];
  estado: string;
  ciudad: string;
  /** Van numeradas en el mapa del país, en este orden. */
  top: Universidad[];
  onSeleccionarEstado: (st: string) => void;
  onSeleccionarCiudad: (ciudad: string) => void;
  onSeleccionarUniversidad: (uni: Universidad) => void;
}

interface EstadoMapa { st: string; d: string; caja: [number, number, number, number] }
interface DatosMapa { estados: EstadoMapa[]; puntos: Record<string, [number, number]> }

const ANCHO = 975;
const ALTO = 610;
/** Hasta dónde se acerca: Rhode Island llenaría la pantalla y se perdería la referencia. */
const ACERCAMIENTO_MAXIMO = 9;

/** La misma escala de azules del mapa de condados: de claro a oscuro, pasos parejos. */
const ESCALA = ['#c9d4f3', '#8fb3e0', '#4f86c9', '#2a3f8f', '#1c2c6e'];
const SIN_DATOS = '#eef0f6';

/** Raíz cuadrada: unos pocos estados concentran muchas universidades y el resto saldría igual de claro. */
function colorDe(cantidad: number, maximo: number) {
  if (!cantidad) return SIN_DATOS;
  return ESCALA[Math.min(ESCALA.length - 1, Math.floor(ESCALA.length * Math.sqrt(cantidad / Math.max(maximo, 1))))];
}

const plural = (n: number) => `${n.toLocaleString('en-US')} ${n === 1 ? 'universidad' : 'universidades'}`;

let promesaMapa: Promise<DatosMapa> | null = null;
function cargarMapa() {
  promesaMapa ??= fetch(`${import.meta.env.BASE_URL}geo/mapa-eeuu.json`).then(r => {
    if (!r.ok) throw new Error(`mapa-eeuu.json: ${r.status}`);
    return r.json() as Promise<DatosMapa>;
  }).catch(e => { promesaMapa = null; throw e; });
  return promesaMapa;
}

/** Separa los puntos que caerían uno encima de otro (MIT y Harvard están en la misma ciudad). */
function separar(puntos: { x: number; y: number }[], distancia: number) {
  for (let vuelta = 0; vuelta < 40; vuelta++) {
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        const dx = puntos[j].x - puntos[i].x || 0.5;
        const dy = puntos[j].y - puntos[i].y || 0.5;
        const d = Math.hypot(dx, dy);
        if (d >= distancia) continue;
        const empuje = (distancia - d) / 2 / d;
        puntos[i].x -= dx * empuje; puntos[i].y -= dy * empuje;
        puntos[j].x += dx * empuje; puntos[j].y += dy * empuje;
      }
    }
  }
}

/**
 * Mapa de la portada, dibujado con SVG propio en vez de Google Charts: los colores cambian con
 * suavidad al filtrar, tocar un estado acerca la vista y dentro de él aparecen sus ciudades.
 * No entra en el orden de Tab: lo mismo se elige con los campos de Estado y Ciudad de los filtros.
 */
export const MapaInteractivo = memo(function MapaInteractivo({ universidades, estado, ciudad, top, onSeleccionarEstado, onSeleccionarCiudad, onSeleccionarUniversidad }: Props) {
  const [datos, setDatos] = useState<DatosMapa | null>(null);
  const [fallo, setFallo] = useState(false);
  const [encima, setEncima] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    cargarMapa().then(d => { if (vigente) setDatos(d); }).catch(() => { if (vigente) setFallo(true); });
    return () => { vigente = false; };
  }, []);

  const conteo = useMemo(() => {
    const porEstado = new Map<string, number>();
    for (const u of universidades) if (u.STABBR) porEstado.set(u.STABBR, (porEstado.get(u.STABBR) ?? 0) + 1);
    return porEstado;
  }, [universidades]);
  const maximo = useMemo(() => Math.max(0, ...conteo.values()), [conteo]);

  const elegido = estado !== 'todos' ? datos?.estados.find(e => e.st === estado) : undefined;
  // Acercarse es mover y agrandar el grupo: la transición de CSS lo vuelve un viaje, no un salto.
  const vista = useMemo(() => {
    if (!elegido) return { k: 1, x: 0, y: 0 };
    const [x0, y0, x1, y1] = elegido.caja;
    const k = Math.min(ACERCAMIENTO_MAXIMO, 0.82 * ANCHO / Math.max(x1 - x0, 1), 0.82 * ALTO / Math.max(y1 - y0, 1));
    return { k, x: ANCHO / 2 - k * (x0 + x1) / 2, y: ALTO / 2 - k * (y0 + y1) / 2 };
  }, [elegido]);

  // Con un estado elegido: sus ciudades. El tamaño dice cuántas universidades tiene cada una.
  const ciudades = useMemo(() => {
    if (!datos || !elegido) return [];
    const porCiudad = new Map<string, { nombre: string; x: number; y: number; n: number }>();
    for (const u of universidades) {
      if (u.STABBR !== elegido.st || !u.CITY) continue;
      const clave = claveCiudad(u.CITY, u.STABBR);
      const p = datos.puntos[clave];
      if (!p) continue;
      const previa = porCiudad.get(clave);
      if (previa) previa.n++;
      else porCiudad.set(clave, { nombre: u.CITY, x: p[0], y: p[1], n: 1 });
    }
    return [...porCiudad.values()].sort((a, b) => b.n - a.n);
  }, [datos, elegido, universidades]);

  // En todo el país: las mejores, numeradas, separadas para que no se tapen.
  const marcas = useMemo(() => {
    if (!datos || elegido) return [];
    const lista = top.flatMap((uni, i) => {
      const p = datos.puntos[claveCiudad(uni.CITY, uni.STABBR)];
      return p ? [{ uni, puesto: i + 1, x: p[0], y: p[1] }] : [];
    });
    separar(lista, 23);
    return lista;
  }, [datos, elegido, top]);

  const nombreElegido = elegido ? NOMBRES_ESTADOS[elegido.st] ?? elegido.st : null;
  const titulo = nombreElegido ?? 'Universidades por estado';
  const leyenda = encima ?? (elegido ? `${plural(conteo.get(elegido.st) ?? 0)} en ${nombreElegido}. Toca una ciudad.` : 'Toca un estado para acercarte.');

  return (
    <section className="panel mapa-ix" aria-labelledby="mapa-ix-titulo">
      <div className="mapa-ix-cabecera">
        <h2 id="mapa-ix-titulo" className="titulo-seccion">{titulo}</h2>
        {elegido && (
          <button type="button" className="boton" onClick={() => onSeleccionarEstado(elegido.st)}>
            <span aria-hidden="true">←</span> Todo el país
          </button>
        )}
      </div>

      <div className="mapa-ix-lienzo">
        {fallo ? (
          <p className="vacio">No pudimos cargar el mapa. Puedes elegir el estado en los filtros.</p>
        ) : !datos ? (
          <div className="mapa-ix-cargando" aria-hidden="true" />
        ) : (
          <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img"
            aria-label={`Mapa de Estados Unidos: ${plural(universidades.length)} con tus filtros.`}
            onClick={() => { if (elegido) onSeleccionarEstado(elegido.st); }}
            onPointerLeave={() => setEncima(null)}>
            <g className="mapa-ix-grupo" style={{ transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.k})` }}>
              {datos.estados.map(e => {
                const n = conteo.get(e.st) ?? 0;
                const esElegido = e.st === elegido?.st;
                return (
                  <path key={e.st} d={e.d} data-st={e.st}
                    className={`mapa-ix-estado${esElegido ? ' elegido' : ''}`}
                    fill={elegido ? (esElegido ? '#e8ecf8' : '#f2f3f8') : colorDe(n, maximo)}
                    onPointerEnter={() => setEncima(`${NOMBRES_ESTADOS[e.st] ?? e.st}: ${plural(n)}`)}
                    onClick={ev => {
                      // Dentro del estado elegido, un toque en vacío no debe sacarte de él.
                      ev.stopPropagation();
                      // En el celular no hay "dejar de pasar por encima": la leyenda se quedaría pegada.
                      setEncima(null);
                      if (!esElegido) onSeleccionarEstado(e.st);
                    }} />
                );
              })}

              {ciudades.map(c => {
                const activa = c.nombre === ciudad;
                return (
                  <circle key={c.nombre} cx={c.x} cy={c.y} r={(4 + Math.sqrt(c.n) * 2.2) / vista.k}
                    className={`mapa-ix-ciudad${activa ? ' activa' : ''}`}
                    onPointerEnter={() => setEncima(`${c.nombre}: ${plural(c.n)}`)}
                    onClick={ev => { ev.stopPropagation(); setEncima(null); onSeleccionarCiudad(activa ? 'todas' : c.nombre); }} />
                );
              })}

              {marcas.map(m => (
                <g key={m.uni._id} className="mapa-ix-marca" transform={`translate(${m.x} ${m.y})`}
                  onPointerEnter={() => setEncima(`${m.puesto}. ${m.uni.INSTNM}`)}
                  onClick={ev => { ev.stopPropagation(); onSeleccionarUniversidad(m.uni); }}>
                  <circle r="11" />
                  <text textAnchor="middle" dy="4.2">{m.puesto}</text>
                </g>
              ))}
            </g>
          </svg>
        )}
      </div>

      {/* Texto y no un globo flotante: en el celular no hay "pasar por encima", y aquí se lee igual. */}
      <p className="mapa-ix-leyenda" aria-live="polite">{leyenda}</p>
    </section>
  );
});
