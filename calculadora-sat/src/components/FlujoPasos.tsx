import { useEffect, useMemo, useRef, useState } from 'react';
import type { Universidad } from '../types';
import type { ArchivoSalarios } from '../utils/salariosCarreras';
import { nombreCarrera } from '../utils/salariosCarreras';
import { SINONIMOS_CARRERAS } from '../data/carrerasEspanol';
import { NOMBRES_ESTADOS, OTRAS_ISLAS } from '../utils/estados';
import { PRECIO_MAXIMO_SLIDER } from '../utils/filtrosURL';
import { MapaCuadritos } from './MapaCuadritos';
import { CARRERAS_COMUNES, PRESUPUESTOS, TITULOS_PASOS } from '../data/pasos';
import { FichaEstado } from './FichaEstado';
import { TextoFuentes } from './AvisoFuentes';
import { InfoTooltip } from './InfoTooltip';

const minusculasSinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const dinero = (n: number) => `$${n.toLocaleString('en-US')}`;

/** Una salida cuando quedan pocas: qué respuesta cambiar y cuántas encajarían (ver App). */
export interface Sugerencia {
  texto: string;
  boton: string;
  aplicar: () => void;
}

interface Props {
  paso: number;
  setPaso: (paso: number) => void;
  /** Termina los pasos y muestra los resultados. */
  onTerminar: () => void;
  /** Todas las universidades: para el total y la ficha del estado. */
  universidades: Universidad[];
  /** Cuántas pasan los filtros elegidos hasta ahora (el mismo número que tendrá la lista). */
  encajan: number;
  /** De esas, cuántas publican el salario de la carrera elegida (null = sin carrera). */
  conCarrera: number | null;
  /** Universidades por estado con las demás respuestas (sin contar el lugar): el mapa de calor. */
  conteoEstados: Record<string, number>;
  sugerencia: Sugerencia | null;
  carreras: string[];
  setCarreras: (cips: string[]) => void;
  archivoCarreras: ArchivoSalarios | null;
  estados: string[];
  setEstados: (estados: string[]) => void;
  excluidos: string[];
  setExcluidos: (estados: string[]) => void;
  precio: number;
  setPrecio: (precio: number) => void;
  satTotal: number;
  setSatTotal: (total: number) => void;
  satNoRendido: boolean;
  setSatNoRendido: (valor: boolean) => void;
  exigirSAT: string;
  setExigirSAT: (valor: string) => void;
  conteoPolitica: Record<string, number>;
}

/**
 * El número de "Por ahora encajan" baja (o sube) contando hasta el valor nuevo, en vez de saltar:
 * es la parte que se siente al responder. Con "reducir movimiento" cambia de una vez.
 */
function useNumeroAnimado(valor: number): number {
  const [mostrado, setMostrado] = useState(valor);
  const actual = useRef(valor);
  useEffect(() => {
    const desde = actual.current;
    if (desde === valor) return;
    let cuadro = 0;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cuadro = requestAnimationFrame(() => { actual.current = valor; setMostrado(valor); });
      return () => cancelAnimationFrame(cuadro);
    }
    const inicio = performance.now();
    const DURACION = 450; // entre --duration-slow y --duration-very-slow: es el momento de la portada
    const avanzar = (ahora: number) => {
      const p = Math.min(1, (ahora - inicio) / DURACION);
      const suave = 1 - (1 - p) ** 3;
      actual.current = Math.round(desde + (valor - desde) * suave);
      setMostrado(actual.current);
      if (p < 1) cuadro = requestAnimationFrame(avanzar);
    };
    cuadro = requestAnimationFrame(avanzar);
    return () => cancelAnimationFrame(cuadro);
  }, [valor]);
  return mostrado;
}

/**
 * "Cuéntanos de ti" en 4 pasos cortos, todos opcionales: carrera, dónde, presupuesto y SAT (al
 * final, como un dato más). Cada respuesta es un filtro real de la lista, así "Por ahora encajan"
 * dice exactamente cuántas va a haber. Pensado para quien entra por primera vez; el resto puede
 * saltar directo a los resultados. El buscador de universidades vive en la barra de arriba.
 */
export function FlujoPasos(props: Props) {
  const { paso, setPaso, onTerminar, universidades, encajan, conCarrera, conteoEstados, sugerencia,
    carreras, setCarreras, archivoCarreras, estados, setEstados, excluidos, setExcluidos,
    precio, setPrecio, satTotal, setSatTotal, satNoRendido, setSatNoRendido,
    exigirSAT, setExigirSAT, conteoPolitica } = props;

  const siguiente = () => (paso < 4 ? setPaso(paso + 1) : onTerminar());
  // "Saltar" solo cuando el paso no tiene respuesta: con algo elegido hacía lo mismo que Siguiente
  // pero conservando lo elegido, y eso engañaba.
  const respondido = [carreras.length > 0, estados.length > 0 || excluidos.length > 0, precio < PRECIO_MAXIMO_SLIDER,
    satTotal > 0 || satNoRendido || exigirSAT !== 'todos'][paso - 1];

  // Hacia dónde entra el paso nuevo: desde la derecha al avanzar, desde la izquierda al volver.
  // Se calcula al cambiar de paso, durante el render (sin esperar un efecto que lo dibuje tarde).
  const [pasoAnterior, setPasoAnterior] = useState(paso);
  const [direccion, setDireccion] = useState<'adelante' | 'atras'>('adelante');
  if (paso !== pasoAnterior) {
    setDireccion(paso > pasoAnterior ? 'adelante' : 'atras');
    setPasoAnterior(paso);
  }

  // Al cambiar de paso, el foco va a la pregunta nueva: así el lector de pantalla la anuncia y el
  // teclado sigue desde ahí (no desde el botón "Siguiente", que quedaba abajo). No al entrar.
  const primeraVez = useRef(true);
  useEffect(() => {
    if (primeraVez.current) { primeraVez.current = false; return; }
    document.getElementById('paso-titulo')?.focus({ preventScroll: true });
  }, [paso]);
  const textoSiguiente = ['Siguiente: dónde', 'Siguiente: presupuesto', 'Siguiente: tu SAT', 'Ver mis universidades'][paso - 1];
  const nombreElegidas = carreras.length
    ? [...new Set(carreras.map(c => CARRERAS_COMUNES.find(g => g.cips.includes(c))?.nombre ?? nombreCarrera(c, archivoCarreras)))].join(' o ')
    : '';
  const encajanAnimado = useNumeroAnimado(encajan);

  return (
    <div className="flujo">
      <div className="flujo-arriba">
        <div className="in flujo-arriba-in">
          <nav className="flujo-progreso" aria-label="Pasos">
            <span>Paso {paso} de 4</span>
            <span className="flujo-rayas">
              {TITULOS_PASOS.map((titulo, i) => (
                <button key={titulo} type="button" className={`flujo-raya${i < paso ? ' flujo-raya-hecha' : ''}`}
                  aria-current={i + 1 === paso ? 'step' : undefined} aria-label={`Ir al paso ${i + 1}: ${titulo}`}
                  onClick={() => setPaso(i + 1)} />
              ))}
            </span>
          </nav>
        </div>
      </div>

      {/* La key hace que cada paso entre con su animación (CSS: .flujo-paso-adelante / -atras). */}
      <div key={paso} className={`in flujo-cuerpo flujo-paso-${direccion}`}>
        {paso === 1 && <PasoCarrera carreras={carreras} setCarreras={setCarreras} archivoCarreras={archivoCarreras} />}
        {paso === 2 && (
          <PasoDonde estados={estados} setEstados={setEstados} excluidos={excluidos} setExcluidos={setExcluidos}
            conteo={conteoEstados} universidades={universidades} />
        )}
        {paso === 3 && <PasoPresupuesto precio={precio} setPrecio={setPrecio} universidades={universidades} />}
        {paso === 4 && (
          <PasoSAT satTotal={satTotal} setSatTotal={setSatTotal} satNoRendido={satNoRendido} setSatNoRendido={setSatNoRendido}
            exigirSAT={exigirSAT} setExigirSAT={setExigirSAT} conteoPolitica={conteoPolitica} />
        )}
      </div>

      {/* Fija abajo, como el total de un carrito: siempre a la vista y junto al botón de avanzar. */}
      <div className="flujo-barra">
        <div className="in flujo-barra-in">
          <div className="flujo-cuenta-zona">
            {/* El número animado es solo visual: al lector de pantalla se le anuncia el valor final, una vez. */}
            <p className="flujo-cuenta" aria-hidden="true">
              <span className="flujo-cuenta-etiqueta">Por ahora encajan</span>
              <strong className="flujo-cuenta-numero numero">{encajanAnimado.toLocaleString('en-US')}</strong>
              <span className="flujo-cuenta-de">de {universidades.length.toLocaleString('en-US')} universidades</span>
              {conCarrera != null && (
                <span className="flujo-cuenta-carrera">{conCarrera.toLocaleString('en-US')} publican el salario de {nombreElegidas}</span>
              )}
            </p>
            <p className="visualmente-oculto" aria-live="polite">
              Por ahora encajan {encajan.toLocaleString('en-US')} de {universidades.length.toLocaleString('en-US')} universidades.
            </p>
            {sugerencia && (
              <p className="flujo-sugerencia" role="status">
                {sugerencia.texto}
                <button type="button" className="boton-enlace" onClick={sugerencia.aplicar}>{sugerencia.boton}</button>
              </p>
            )}
          </div>
          <div className="flujo-botones">
            {paso > 1 && <button type="button" className="boton" onClick={() => setPaso(paso - 1)}>Atrás</button>}
            {!respondido && <button type="button" className="boton-limpiar boton-limpiar-enlace flujo-saltar" onClick={siguiente}>Saltar este paso</button>}
            <button type="button" className="boton-sol" onClick={siguiente}>
              {textoSiguiente}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Paso 1 */

function PasoCarrera({ carreras, setCarreras, archivoCarreras }: { carreras: string[]; setCarreras: (c: string[]) => void; archivoCarreras: ArchivoSalarios | null }) {
  const [texto, setTexto] = useState('');

  // Cuántas universidades ofrecen cada carrera: el número de cada botón.
  const porCarrera = useMemo(() => {
    const conteo = new Map<string, number>();
    if (!archivoCarreras) return conteo;
    for (const filas of Object.values(archivoCarreras.universidades)) {
      for (const [cip] of filas) conteo.set(cip, (conteo.get(cip) ?? 0) + 1);
    }
    return conteo;
  }, [archivoCarreras]);
  // Para los botones de arriba: una universidad cuenta una vez aunque tenga los dos códigos de Computación.
  const conteoComunes = useMemo(() => CARRERAS_COMUNES.map(g => {
    if (!archivoCarreras) return null;
    let n = 0;
    for (const filas of Object.values(archivoCarreras.universidades)) if (filas.some(([cip]) => g.cips.includes(cip))) n++;
    return n;
  }), [archivoCarreras]);

  const elegida = (cips: string[]) => cips.every(c => carreras.includes(c));
  const alternar = (cips: string[]) => setCarreras(elegida(cips) ? carreras.filter(c => !cips.includes(c)) : [...new Set([...carreras, ...cips])]);

  // Buscar entre todas las carreras (en español, en inglés o por sinónimo: "programación").
  const buscada = minusculasSinTildes(texto.trim());
  const encontradas = useMemo(() => {
    if (!archivoCarreras || buscada.length < 2) return [];
    return Object.keys(archivoCarreras.carreras)
      .filter(cip => minusculasSinTildes(`${nombreCarrera(cip, archivoCarreras)} ${archivoCarreras.carreras[cip]} ${SINONIMOS_CARRERAS[cip] ?? ''}`).includes(buscada))
      .sort((a, b) => (porCarrera.get(b) ?? 0) - (porCarrera.get(a) ?? 0))
      .slice(0, 8);
  }, [archivoCarreras, buscada, porCarrera]);

  // Las elegidas desde el buscador (no son uno de los botones de arriba): se muestran para poder quitarlas.
  const sueltas = carreras.filter(c => !CARRERAS_COMUNES.some(g => g.cips.includes(c)));

  return (
    <section className="flujo-tarjeta" aria-labelledby="paso-titulo">
      <h1 id="paso-titulo" className="flujo-titulo" tabIndex={-1}>¿Qué quieres estudiar?</h1>
      <p className="flujo-subtitulo">Elige una o varias. Te mostraremos cuánto ganan sus egresados en cada universidad.</p>
      <div className="flujo-opciones">
        {CARRERAS_COMUNES.map((g, i) => (
          <button key={g.nombre} type="button" className="flujo-pastilla" aria-pressed={elegida(g.cips)} onClick={() => alternar(g.cips)}>
            {g.nombre}
            {conteoComunes[i] != null && <span className="flujo-pastilla-numero numero">{conteoComunes[i]!.toLocaleString('en-US')}</span>}
          </button>
        ))}
        <button type="button" className="flujo-pastilla flujo-pastilla-nose" aria-pressed={carreras.length === 0} onClick={() => setCarreras([])}>Aún no sé</button>
      </div>
      {sueltas.length > 0 && (
        <div className="flujo-opciones">
          {sueltas.map(cip => (
            <button key={cip} type="button" className="flujo-pastilla" aria-pressed onClick={() => setCarreras(carreras.filter(c => c !== cip))}
              aria-label={`Quitar ${nombreCarrera(cip, archivoCarreras)}`}>
              {nombreCarrera(cip, archivoCarreras)} <span aria-hidden="true">✕</span>
            </button>
          ))}
        </div>
      )}
      <label className="flujo-campo">
        ¿Otra carrera? Búscala
        <input type="search" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej.: Ingeniería, Medicina, Diseño…" />
      </label>
      {encontradas.length > 0 && (
        <div className="flujo-opciones">
          {encontradas.map(cip => (
            <button key={cip} type="button" className="flujo-pastilla" aria-pressed={carreras.includes(cip)}
              onClick={() => setCarreras(carreras.includes(cip) ? carreras.filter(c => c !== cip) : [...carreras, cip])}>
              {nombreCarrera(cip, archivoCarreras)}
              <span className="flujo-pastilla-numero numero">{(porCarrera.get(cip) ?? 0).toLocaleString('en-US')}</span>
            </button>
          ))}
        </div>
      )}
      {buscada.length >= 2 && archivoCarreras && encontradas.length === 0 && (
        <p className="flujo-nota">No encontramos “{texto.trim()}”. Prueba con otra palabra, en español o en inglés.</p>
      )}
      <div className="flujo-notas">
        <p className="flujo-nota">El número: cuántas universidades ofrecen la carrera (bachiller). Las que no lo informan se quedan, al final.</p>
        {/* La nota de fuentes del pie, en corto: en los pasos no hay pie (la barra de abajo va pegada al borde). */}
        <p className="flujo-nota"><TextoFuentes corto /></p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Paso 2 */

function PasoDonde({ estados, setEstados, excluidos, setExcluidos, conteo, universidades }: {
  estados: string[]; setEstados: (e: string[]) => void; excluidos: string[]; setExcluidos: (e: string[]) => void;
  conteo: Record<string, number>; universidades: Universidad[];
}) {
  // Dos modos que no se mezclan: elegir dónde (quedan esos) o descartar dónde no (quedan los demás).
  const [modo, setModo] = useState<'incluir' | 'excluir'>(excluidos.length > 0 ? 'excluir' : 'incluir');
  const excluir = modo === 'excluir';
  const marcados = excluir ? excluidos : estados;
  const setMarcados = excluir ? setExcluidos : setEstados;

  // La ficha muestra el estado bajo el mouse; si no hay ninguno, el último que se tocó.
  const [encima, setEncima] = useState<string | null>(null);
  const [ultimo, setUltimo] = useState<string | null>(marcados[marcados.length - 1] ?? null);
  const enFicha = encima ?? (ultimo && marcados.includes(ultimo) ? ultimo : marcados[marcados.length - 1] ?? null);

  // Al entrar a "no quiero", todos los cuadritos tiemblan una vez: avisa que el mapa cambió de modo.
  const [temblando, setTemblando] = useState(false);
  useEffect(() => {
    if (!temblando) return;
    const espera = setTimeout(() => setTemblando(false), 500);
    return () => clearTimeout(espera);
  }, [temblando]);

  const cambiarModo = (nuevo: 'incluir' | 'excluir') => {
    if (nuevo === modo) return;
    // Lo marcado en un modo no tiene sentido en el otro: se empieza de cero.
    setModo(nuevo);
    if (nuevo === 'excluir') { setExcluidos([]); setTemblando(true); } else setEstados([]);
    setUltimo(null);
  };
  const cambiar = (lista: string[], st: string) => {
    setMarcados(lista);
    setUltimo(st);
  };

  // En celular los cuadritos del noreste son chicos para el dedo: también se pueden buscar por nombre.
  const [texto, setTexto] = useState('');
  const buscado = minusculasSinTildes(texto.trim());
  const encontrados = buscado
    ? Object.entries(NOMBRES_ESTADOS)
      // Las islas sueltas no: se eligen juntas en "Otras islas" (buscar "Guam" lleva ahí).
      .filter(([st, nombre]) => conteo[st] != null && !OTRAS_ISLAS.has(st)
        && minusculasSinTildes(`${nombre} ${st}${st === 'IS' ? ' ' + [...OTRAS_ISLAS].map(i => NOMBRES_ESTADOS[i]).join(' ') : ''}`).includes(buscado))
      .slice(0, 6)
    : [];
  const alternar = (st: string) => cambiar(marcados.includes(st) ? marcados.filter(x => x !== st) : [...marcados, st], st);

  return (
    <div className="flujo-donde">
      <div className="flujo-donde-mapa">
        {/* El título y los dos modos en una fila: cada línea que se ahorra arriba es mapa más grande. */}
        <div className="flujo-donde-cabeza">
          <h1 id="paso-titulo" className="flujo-titulo" tabIndex={-1}>
            {excluir ? '¿Dónde no te gustaría estudiar?' : '¿Dónde te gustaría estudiar?'}
          </h1>
          <div className="flujo-modo" role="group" aria-label="Cómo elegir el lugar">
            <button type="button" aria-pressed={!excluir} onClick={() => cambiarModo('incluir')}>Dónde quiero</button>
            <button type="button" aria-pressed={excluir} onClick={() => cambiarModo('excluir')}>Dónde no quiero</button>
          </div>
        </div>
        <p className="flujo-subtitulo">
          {excluir
            ? 'Marca los estados que descartas: te mostraremos todos los demás.'
            : 'Marca los estados que te interesan, todos los que quieras. Si te da igual, salta este paso.'}
        </p>
        <MapaCuadritos conteo={conteo} seleccion={marcados} foco={enFicha} onCambiar={cambiar} onEncima={setEncima}
          modo={modo} calor temblando={temblando} />
        <div className="flujo-donde-lista">
          <label className="flujo-campo">
            Busca un estado
            <input type="search" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Ej.: Texas, Florida…" />
          </label>
          {encontrados.length > 0 && (
            <div className="flujo-opciones">
              {encontrados.map(([st, nombre]) => (
                <button key={st} type="button" className={`flujo-pastilla${excluir ? ' flujo-pastilla-excluir' : ''}`}
                  aria-pressed={marcados.includes(st)} onClick={() => alternar(st)}>
                  {nombre}
                  <span className="flujo-pastilla-numero numero">{(conteo[st] ?? 0).toLocaleString('en-US')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <aside className="flujo-donde-ficha" aria-label="Ficha del estado">
        {marcados.length > 0 && (
          <div className="flujo-marcados">
            <p className="flujo-marcados-titulo">
              {excluir ? `Descartaste ${marcados.length}` : `Elegiste ${marcados.length}`} {marcados.length === 1 ? 'estado' : 'estados'}
              <button type="button" className="boton-enlace" onClick={() => { setMarcados([]); setUltimo(null); }}>Quitar todos</button>
            </p>
            <div className="flujo-chips">
              {marcados.map(st => (
                <span key={st} className={`flujo-chip${excluir ? ' flujo-chip-excluido' : ''}${st === enFicha ? ' flujo-chip-activo' : ''}`}>
                  <button type="button" aria-pressed={st === enFicha} onClick={() => setUltimo(st)}>{NOMBRES_ESTADOS[st] ?? st}</button>
                  <button type="button" aria-label={`Quitar ${NOMBRES_ESTADOS[st] ?? st}`} onClick={() => cambiar(marcados.filter(x => x !== st), st)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
        {enFicha ? (
          <FichaEstado estado={enFicha} universidades={universidades} />
        ) : (
          <>
            <h2 className="ficha-estado-titulo">Pasa por un estado del mapa</h2>
            <p className="flujo-nota">Aquí verás cuántas universidades tiene, cuánto cuestan y cuáles son las mejores.</p>
          </>
        )}
      </aside>
    </div>
  );
}

/* ---------------------------------------------------------------- Paso 3 */

function PasoPresupuesto({ precio, setPrecio, universidades }: { precio: number; setPrecio: (p: number) => void; universidades: Universidad[] }) {
  const entran = useMemo(() => PRESUPUESTOS.map(p => universidades.filter(u => u.COSTO_ANUAL != null && u.COSTO_ANUAL <= p).length), [universidades]);
  return (
    <section className="flujo-tarjeta" aria-labelledby="paso-titulo">
      <h1 id="paso-titulo" className="flujo-titulo" tabIndex={-1}>¿Cuánto podría pagar tu familia al año?</h1>
      <p className="flujo-subtitulo">Sin presión: lo puedes cambiar cuando quieras, y en cada ficha verás cuánta beca suelen dar.</p>
      <div className="flujo-presupuestos">
        {PRESUPUESTOS.map((p, i) => (
          <button key={p} type="button" className="flujo-caja" aria-pressed={precio === p} onClick={() => setPrecio(p)}>
            <span className="flujo-caja-titulo">Hasta {dinero(p)}</span>
            <span className="flujo-caja-detalle">{entran[i].toLocaleString('en-US')} entran</span>
          </button>
        ))}
        <button type="button" className="flujo-caja" aria-pressed={precio >= PRECIO_MAXIMO_SLIDER} onClick={() => setPrecio(PRECIO_MAXIMO_SLIDER)}>
          <span className="flujo-caja-titulo">Aún no sé</span>
          <span className="flujo-caja-detalle">Te mostramos todas</span>
        </button>
      </div>
      <p className="flujo-nota">Costo al año = matrícula para quien viene de fuera del estado + costo de vida, antes de becas (College Scorecard). Las que no lo publican se quedan, al final.</p>
    </section>
  );
}

/* ---------------------------------------------------------------- Paso 4 */

/** Qué es el SAT, para quien nunca lo escuchó (la "?" del título del paso 4). */
const AYUDA_SAT = 'El SAT es un examen de matemática y de lectura y redacción, en inglés, que piden muchas universidades de EE. UU. para admitir estudiantes. El puntaje va de 400 a 1600 y se puede dar varias veces, también desde fuera de EE. UU. Hoy muchas universidades lo dejan opcional o no lo toman en cuenta.';

function PasoSAT({ satTotal, setSatTotal, satNoRendido, setSatNoRendido, exigirSAT, setExigirSAT, conteoPolitica }: {
  satTotal: number; setSatTotal: (t: number) => void; satNoRendido: boolean; setSatNoRendido: (v: boolean) => void;
  exigirSAT: string; setExigirSAT: (v: string) => void; conteoPolitica: Record<string, number>;
}) {
  // Lo que se escribe se guarda tal cual mientras se tipea; el filtro solo usa un total válido.
  const [texto, setTexto] = useState(satTotal > 0 ? String(satTotal) : '');
  const escribir = (valor: string) => {
    const limpio = valor.replace(/\D/g, '').slice(0, 4);
    setTexto(limpio);
    setSatNoRendido(false);
    const n = Number(limpio);
    setSatTotal(n >= 400 && n <= 1600 ? n : 0);
  };
  const fueraDeRango = texto.length >= 3 && (Number(texto) < 400 || Number(texto) > 1600);

  return (
    <section className="flujo-tarjeta" aria-labelledby="paso-titulo">
      {/* Muchos estudiantes de Latinoamérica nunca oyeron del SAT: la "?" lo explica en corto,
          sin sacarlos del paso. */}
      <h1 id="paso-titulo" className="flujo-titulo" tabIndex={-1}>
        ¿Ya presentaste el SAT?{' '}
        <InfoTooltip sobre="el SAT" texto={AYUDA_SAT} />
      </h1>
      <p className="flujo-subtitulo">Es un dato más: muchas universidades no lo piden.</p>
      <div className="flujo-opciones">
        <label className="flujo-caja flujo-caja-fila" data-elegida={!satNoRendido && texto !== ''}>
          <span className="flujo-caja-titulo">Sí, saqué</span>
          <input type="text" inputMode="numeric" aria-label="Tu puntaje SAT total" placeholder="1250" value={texto}
            onChange={e => escribir(e.target.value)} aria-invalid={fueraDeRango} />
          <span className="flujo-caja-detalle">/ 1600</span>
        </label>
        <button type="button" className="flujo-caja flujo-caja-fila" aria-pressed={satNoRendido}
          onClick={() => { setSatNoRendido(true); setTexto(''); setSatTotal(0); }}>
          <span className="flujo-caja-titulo">Aún no lo presento</span>
        </button>
      </div>
      {fueraDeRango && <p className="flujo-aviso" role="status">El SAT va de 400 a 1600.</p>}
      {/* Una sola decisión más, y opcional: antes eran 4 opciones técnicas ("Las que lo piden" dejaba
          casi sin resultados). Las demás siguen en "Más filtros" de los resultados. */}
      <button type="button" className="flujo-interruptor" aria-pressed={exigirSAT === 'no-exige'}
        onClick={() => setExigirSAT(exigirSAT === 'no-exige' ? 'todos' : 'no-exige')}>
        <span className="flujo-interruptor-caja" aria-hidden="true" />
        <span>
          Mostrar solo las que no exigen el SAT
          {conteoPolitica['no-exige'] != null && <span className="flujo-pastilla-numero numero"> · {conteoPolitica['no-exige'].toLocaleString('en-US')}</span>}
        </span>
      </button>
      <p className="flujo-nota">Lo hacen opcional o no lo toman en cuenta. Las que no publican su política sobre el SAT no aparecen con esta opción.</p>
    </section>
  );
}
