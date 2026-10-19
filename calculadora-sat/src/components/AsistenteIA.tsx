import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { Universidad } from '../types';
import type { IndiceBusqueda } from '../utils/busqueda';
import type { FiltrosSugeridos, RespuestaAgente } from '../asistente/tipos';
import { ESCENARIOS } from '../asistente/escenarios';
import { responder } from '../asistente/motor';

/**
 * Asistente IA (demo). Panel lateral con chat: muestra el razonamiento del agente
 * paso a paso, las herramientas que usa y las universidades que recomienda.
 *
 * Las respuestas las arma src/asistente/motor.ts con reglas y data real; aquí solo se
 * anima su llegada para que se vea como un agente trabajando.
 */

export interface SolicitudAsistente {
  texto: string;
  /** Cambia en cada pedido, para poder repetir la misma pregunta. */
  id: number;
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  onAbrir: () => void;
  solicitud: SolicitudAsistente | null;
  universidades: Universidad[];
  indice: IndiceBusqueda;
  onSeleccionar: (uni: Universidad) => void;
  onAplicarFiltros: (filtros: FiltrosSugeridos) => void;
}

type Fase = 'pensando' | 'escribiendo' | 'listo';

type Mensaje =
  | { id: number; rol: 'usuario'; texto: string }
  | { id: number; rol: 'asistente'; respuesta: RespuestaAgente; fase: Fase; pasos: number; palabras: number };

const PAUSA_PASO = 750;
const PAUSA_PALABRAS = 28;
const PALABRAS_POR_TICK = 2;

const movimientoReducido = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Primeras N palabras del texto, cerrando un ** que haya quedado abierto. */
function recortarPalabras(texto: string, n: number): string {
  const partes = texto.split(/(\s+)/);
  let cuenta = 0;
  let salida = '';
  for (const p of partes) {
    if (!/^\s+$/.test(p)) {
      if (cuenta >= n) break;
      cuenta++;
    }
    salida += p;
  }
  if ((salida.match(/\*\*/g)?.length ?? 0) % 2 === 1) salida += '**';
  return salida;
}

/** **negrita** y *cursiva*, sin dependencias. */
function enLinea(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((t, i) => {
    if (t.startsWith('**') && t.endsWith('**') && t.length > 4) return <strong key={i}>{t.slice(2, -2)}</strong>;
    if (t.startsWith('*') && t.endsWith('*') && t.length > 2) return <em key={i}>{t.slice(1, -1)}</em>;
    return t;
  });
}

function TextoRico({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(/\n\n+/).map((parrafo, i) => (
        <p key={i}>
          {parrafo.split('\n').map((linea, j) => (
            <span key={j}>{j > 0 && <br />}{enLinea(linea)}</span>
          ))}
        </p>
      ))}
    </>
  );
}

function IconoChispa({ tamano = 18 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5z" />
      <path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z" opacity=".7" />
    </svg>
  );
}

const claseEtiqueta = (e: string) =>
  e === 'Alcance' || e === 'Por debajo' ? 'asis-etiqueta asis-etiqueta-alcance'
    : e === 'Segura' ? 'asis-etiqueta asis-etiqueta-segura'
    : 'asis-etiqueta';

function Razonamiento({ respuesta, pasos, fase, abiertoInicial }: {
  respuesta: RespuestaAgente; pasos: number; fase: Fase; abiertoInicial: boolean;
}) {
  const herramientas = respuesta.pasos.filter(p => p.tipo === 'herramienta').length;
  return (
    <details className="asis-razonamiento" open={abiertoInicial}>
      <summary>
        {fase === 'pensando'
          ? <><span className="asis-punto-vivo" aria-hidden="true" />Pensando…</>
          : <>Razonó en {respuesta.pasos.length} pasos · usó {herramientas} herramientas</>}
      </summary>
      <ol className="asis-pasos">
        {respuesta.pasos.slice(0, pasos).map((p, i) => (
          <li key={i} className={p.tipo === 'herramienta' ? 'asis-paso asis-paso-herramienta' : 'asis-paso'}>
            {p.tipo === 'pensamiento' ? (
              <span className="asis-pensamiento">{p.texto}</span>
            ) : (
              <>
                <code className="asis-herramienta">{p.nombre}</code>
                <span className="asis-argumentos">{p.argumentos}</span>
                <span className="asis-resultado">→ {p.resultado}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </details>
  );
}

export function AsistenteIA({
  abierto, onCerrar, onAbrir, solicitud, universidades, indice, onSeleccionar, onAplicarFiltros,
}: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [entrada, setEntrada] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const siguienteId = useRef(1);
  const listaRef = useRef<HTMLDivElement>(null);
  const entradaRef = useRef<HTMLInputElement>(null);

  const ocupado = mensajes.some(m => m.rol === 'asistente' && m.fase !== 'listo');
  const datosListos = universidades.length > 0;

  const preguntar = useCallback((texto: string) => {
    const limpio = texto.trim();
    if (!limpio || !datosListos) return;
    const respuesta = responder(limpio, universidades, indice);
    const instantaneo = movimientoReducido();
    const idU = siguienteId.current++;
    const idA = siguienteId.current++;
    setMensajes(prev => [
      ...prev,
      { id: idU, rol: 'usuario', texto: limpio },
      instantaneo
        ? { id: idA, rol: 'asistente', respuesta, fase: 'listo', pasos: respuesta.pasos.length, palabras: Infinity }
        : { id: idA, rol: 'asistente', respuesta, fase: 'pensando', pasos: 0, palabras: 0 },
    ]);
    setEntrada('');
    setVerTodas(false);
  }, [datosListos, universidades, indice]);

  // Pedidos que llegan desde fuera del panel (la barra de la página principal).
  const ultimaSolicitud = useRef<number | null>(null);
  useEffect(() => {
    if (!solicitud || solicitud.id === ultimaSolicitud.current || !datosListos) return;
    ultimaSolicitud.current = solicitud.id;
    preguntar(solicitud.texto);
  }, [solicitud, datosListos, preguntar]);

  // Anima el último mensaje: primero los pasos del razonamiento, después el texto.
  const ultimo = mensajes[mensajes.length - 1];
  useEffect(() => {
    if (!ultimo || ultimo.rol !== 'asistente' || ultimo.fase === 'listo') return;
    const totalPalabras = ultimo.respuesta.texto.split(/\s+/).length;
    const espera = ultimo.fase === 'pensando' ? PAUSA_PASO : PAUSA_PALABRAS;
    const t = window.setTimeout(() => {
      setMensajes(prev => prev.map(m => {
        if (m.id !== ultimo.id || m.rol !== 'asistente') return m;
        if (m.fase === 'pensando') {
          return m.pasos < m.respuesta.pasos.length ? { ...m, pasos: m.pasos + 1 } : { ...m, fase: 'escribiendo' };
        }
        const palabras = m.palabras + PALABRAS_POR_TICK;
        return palabras >= totalPalabras ? { ...m, palabras, fase: 'listo' } : { ...m, palabras };
      }));
    }, espera);
    return () => window.clearTimeout(t);
  }, [ultimo]);

  // Mantiene a la vista lo último que se escribe.
  useEffect(() => {
    const lista = listaRef.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensajes]);

  useEffect(() => {
    if (abierto && !ocupado) entradaRef.current?.focus({ preventScroll: true });
  }, [abierto, ocupado]);

  // Esc cierra el panel.
  useEffect(() => {
    if (!abierto) return;
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, [abierto, onCerrar]);

  // En pantallas anchas el panel empuja la página en vez de taparla.
  useEffect(() => {
    document.body.classList.toggle('con-asistente', abierto);
    // Los mapas y gráficos se ajustan al nuevo ancho cuando termina la transición.
    const t = window.setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    return () => window.clearTimeout(t);
  }, [abierto]);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!ocupado) preguntar(entrada);
  };

  const preguntadas = useMemo(
    () => new Set(mensajes.filter(m => m.rol === 'usuario').map(m => (m as { texto: string }).texto)),
    [mensajes],
  );
  const sugerencias = ESCENARIOS.filter(e => !preguntadas.has(e.pregunta)).slice(0, 2);
  const categorias = useMemo(() => {
    const grupos = new Map<string, typeof ESCENARIOS>();
    for (const e of ESCENARIOS) grupos.set(e.categoria, [...(grupos.get(e.categoria) ?? []), e]);
    return [...grupos.entries()];
  }, []);

  const listaPreguntas = (
    <div className="asis-catalogo">
      {categorias.map(([categoria, escenarios]) => (
        <section key={categoria}>
          <h3 className="asis-catalogo-titulo">{categoria}</h3>
          <div className="asis-chips">
            {escenarios.map(e => (
              <button key={e.id} type="button" className="asis-chip" disabled={ocupado || !datosListos}
                onClick={() => preguntar(e.pregunta)}>
                {e.pregunta}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );

  return (
    <>
      {!abierto && (
        <button type="button" className="asis-lanzador" onClick={onAbrir}>
          <IconoChispa />
          <span>Pregúntale a la IA</span>
        </button>
      )}

      <aside className={`asis-panel${abierto ? ' asis-panel-abierto' : ''}`} aria-label="Asistente IA" aria-hidden={!abierto} inert={!abierto}>
        <header className="asis-cabecera">
          <span className="asis-avatar"><IconoChispa tamano={16} /></span>
          <div className="asis-cabecera-texto">
            <h2>Asistente de universidades</h2>
            <p>Busca, compara y explica con los datos de la calculadora</p>
          </div>
          <span className="asis-demo" title="Respuestas simuladas para la demostración, con datos reales">Demo</span>
          {mensajes.length > 0 && (
            <button type="button" className="asis-icono" onClick={() => setMensajes([])} disabled={ocupado}
              title="Nueva conversación" aria-label="Nueva conversación">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></svg>
            </button>
          )}
          <button type="button" className="asis-icono" onClick={onCerrar} title="Cerrar (Esc)" aria-label="Cerrar asistente">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </header>

        <div className="asis-mensajes" ref={listaRef} aria-live="polite">
          {mensajes.length === 0 ? (
            <div className="asis-bienvenida">
              <p className="asis-bienvenida-titulo">Hola 👋 ¿En qué te ayudo?</p>
              <p className="ayuda">
                Cuéntame tu puntaje SAT, dónde quieres estudiar o cuánto puedes pagar, y busco en las{' '}
                {datosListos ? universidades.length.toLocaleString('en-US') : '…'} universidades de la base. O prueba con una de estas:
              </p>
              {listaPreguntas}
            </div>
          ) : (
            mensajes.map(m => m.rol === 'usuario' ? (
              <div key={m.id} className="asis-burbuja-usuario">{m.texto}</div>
            ) : (
              <article key={m.id} className="asis-respuesta">
                <Razonamiento respuesta={m.respuesta} pasos={m.pasos} fase={m.fase} abiertoInicial={m.id === ultimo?.id} />
                {m.fase !== 'pensando' && (
                  <div className="asis-texto">
                    <TextoRico texto={m.fase === 'listo' ? m.respuesta.texto : recortarPalabras(m.respuesta.texto, m.palabras)} />
                    {m.fase === 'escribiendo' && <span className="asis-cursor" aria-hidden="true" />}
                  </div>
                )}
                {m.fase === 'listo' && (
                  <>
                    {m.respuesta.universidades && m.respuesta.universidades.length > 0 && (
                      <ul className="asis-fichas">
                        {m.respuesta.universidades.map(f => (
                          <li key={`${f.uni._id}-${f.etiqueta ?? ''}`}>
                            <button type="button" className="asis-ficha" onClick={() => onSeleccionar(f.uni)}>
                              <span className="asis-ficha-cabeza">
                                <span className="asis-ficha-nombre">{f.uni.INSTNM}</span>
                                {f.etiqueta && <span className={claseEtiqueta(f.etiqueta)}>{f.etiqueta}</span>}
                              </span>
                              <span className="asis-ficha-lugar">{f.uni.CITY}, {f.uni.STABBR}</span>
                              <span className="asis-ficha-datos numero">{f.datos.join(' · ')}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                    {m.respuesta.cierre && <div className="asis-texto"><TextoRico texto={m.respuesta.cierre} /></div>}
                    {m.respuesta.filtros && Object.values(m.respuesta.filtros).some(v => v != null) && (
                      <button type="button" className="boton asis-aplicar" onClick={() => onAplicarFiltros(m.respuesta.filtros!)}>
                        Ver estos filtros en la calculadora →
                      </button>
                    )}
                  </>
                )}
              </article>
            ))
          )}
        </div>

        <footer className="asis-pie">
          {mensajes.length > 0 && !ocupado && (
            verTodas ? (
              <div className="asis-todas">
                <button type="button" className="asis-enlace" onClick={() => setVerTodas(false)}>Ocultar preguntas</button>
                {listaPreguntas}
              </div>
            ) : (
              <div className="asis-chips asis-chips-fila">
                {sugerencias.map(e => (
                  <button key={e.id} type="button" className="asis-chip" onClick={() => preguntar(e.pregunta)}>{e.pregunta}</button>
                ))}
                <button type="button" className="asis-chip asis-chip-mas" onClick={() => setVerTodas(true)}>Ver las 20 preguntas</button>
              </div>
            )
          )}
          <form className="asis-formulario" onSubmit={enviar}>
            <input
              ref={entradaRef}
              type="text"
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              placeholder={ocupado ? 'Respondiendo…' : 'Ej.: Tengo 1300 y quiero ir a Florida'}
              aria-label="Escribe tu pregunta"
              disabled={!datosListos}
            />
            <button type="submit" className="boton boton-primario asis-enviar" disabled={ocupado || !entrada.trim()} aria-label="Enviar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>
          <p className="asis-nota">Demo: el razonamiento es simulado, pero las cifras salen de los datos reales de la calculadora.</p>
        </footer>
      </aside>
    </>
  );
}

/** Barra visible en la página principal: invita a usar el asistente sin buscarlo. */
export function EntradaAsistente({ onPreguntar }: { onPreguntar: (texto: string) => void }) {
  const [texto, setTexto] = useState('');
  const destacadas = ['perfil-florida', 'costo-total', 'comparar']
    .map(id => ESCENARIOS.find(e => e.id === id)!)
    .filter(Boolean);

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    onPreguntar(texto);
    setTexto('');
  };

  return (
    <section className="asis-entrada" aria-label="Pregúntale al asistente">
      <div className="asis-entrada-cabeza">
        <span className="asis-avatar"><IconoChispa tamano={16} /></span>
        <div>
          <h2 className="asis-entrada-titulo">¿No sabes por dónde empezar? Pregúntale a la IA</h2>
          <p className="ayuda">Escríbelo como se lo dirías a un consejero. Te recomienda universidades y te explica por qué.</p>
        </div>
      </div>
      <form className="asis-formulario" onSubmit={enviar}>
        <input
          type="text"
          value={texto}
          onChange={e => setTexto(e.target.value)}
          placeholder="Ej.: Tengo 1300 en el SAT, ¿a qué universidades de Texas puedo entrar?"
          aria-label="Escribe tu pregunta al asistente"
        />
        <button type="submit" className="boton boton-primario" disabled={!texto.trim()}>Preguntar</button>
      </form>
      <div className="asis-chips asis-chips-fila">
        {destacadas.map(e => (
          <button key={e.id} type="button" className="asis-chip" onClick={() => onPreguntar(e.pregunta)}>{e.pregunta}</button>
        ))}
      </div>
    </section>
  );
}
