import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Universidad } from '../types';
import type { ArchivoSalarios } from '../utils/salariosCarreras';
import { nombreCarrera } from '../utils/salariosCarreras';
import { SINONIMOS_CARRERAS } from '../data/carrerasEspanol';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { PRECIO_MAXIMO_SLIDER } from '../utils/filtrosURL';
import { MapaCuadritos } from './MapaCuadritos';
import { TOPE_ESTADOS } from '../utils/cuadritos';
import { CARRERAS_COMUNES, TITULOS_PASOS } from '../data/pasos';
import { FichaEstado } from './FichaEstado';

/** Opciones de presupuesto (costo al año: matrícula de fuera del estado + costo de vida). */
const PRESUPUESTOS = [20000, 40000, 60000, 80000];


const minusculasSinTildes = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const dinero = (n: number) => `$${n.toLocaleString('en-US')}`;

interface Props {
  paso: number;
  setPaso: (paso: number) => void;
  /** Termina los pasos y muestra los resultados. */
  onTerminar: () => void;
  /** Todas las universidades: para el número de cada estado y la ficha. */
  universidades: Universidad[];
  /** Cuántas pasan los filtros elegidos hasta ahora (el mismo número que tendrá la lista). */
  encajan: number;
  /** De esas, cuántas publican datos de la carrera elegida (null = sin carrera). */
  conCarrera: number | null;
  carreras: string[];
  setCarreras: (cips: string[]) => void;
  archivoCarreras: ArchivoSalarios | null;
  estados: string[];
  setEstados: (estados: string[]) => void;
  precio: number;
  setPrecio: (precio: number) => void;
  satTotal: number;
  setSatTotal: (total: number) => void;
  satNoRendido: boolean;
  setSatNoRendido: (valor: boolean) => void;
  exigirSAT: string;
  setExigirSAT: (valor: string) => void;
  conteoPolitica: Record<string, number>;
  /** El buscador de universidades: va arriba, para quien ya sabe a cuál quiere ir. */
  buscador: ReactNode;
}

/**
 * "Cuéntanos de ti" en 4 pasos cortos, todos opcionales: carrera, dónde, presupuesto y SAT (al
 * final, como un dato más). Cada respuesta es un filtro real de la lista, así "Por ahora encajan"
 * dice exactamente cuántas va a haber. Pensado para quien entra por primera vez; el resto puede
 * saltar directo a los resultados.
 */
export function FlujoPasos(props: Props) {
  const { paso, setPaso, onTerminar, universidades, encajan, conCarrera, carreras, setCarreras, archivoCarreras,
    estados, setEstados, precio, setPrecio, satTotal, setSatTotal, satNoRendido, setSatNoRendido,
    exigirSAT, setExigirSAT, conteoPolitica, buscador } = props;

  const siguiente = () => (paso < 4 ? setPaso(paso + 1) : onTerminar());
  // "Saltar" solo cuando el paso no tiene respuesta: con algo elegido hacía lo mismo que Siguiente
  // pero conservando lo elegido, y eso engañaba.
  const respondido = [carreras.length > 0, estados.length > 0, precio < PRECIO_MAXIMO_SLIDER,
    satTotal > 0 || satNoRendido || exigirSAT !== 'todos'][paso - 1];

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
          <div className="flujo-buscador">{buscador}</div>
        </div>
      </div>

      <div className="in flujo-cuerpo">
        {paso === 1 && <PasoCarrera carreras={carreras} setCarreras={setCarreras} archivoCarreras={archivoCarreras} />}
        {paso === 2 && <PasoDonde estados={estados} setEstados={setEstados} universidades={universidades} />}
        {paso === 3 && <PasoPresupuesto precio={precio} setPrecio={setPrecio} universidades={universidades} />}
        {paso === 4 && (
          <PasoSAT satTotal={satTotal} setSatTotal={setSatTotal} satNoRendido={satNoRendido} setSatNoRendido={setSatNoRendido}
            exigirSAT={exigirSAT} setExigirSAT={setExigirSAT} conteoPolitica={conteoPolitica} />
        )}
      </div>

      {/* Fija abajo, como el total de un carrito: siempre a la vista y junto al botón de avanzar. */}
      <div className="flujo-barra">
        <div className="in flujo-barra-in">
          <p className="flujo-cuenta" aria-live="polite">
            <span className="flujo-cuenta-etiqueta">Por ahora encajan</span>
            <strong className="flujo-cuenta-numero numero">{encajan.toLocaleString('en-US')}</strong>
            <span className="flujo-cuenta-de">de {universidades.length.toLocaleString('en-US')} universidades</span>
            {conCarrera != null && (
              <span className="flujo-cuenta-carrera">{conCarrera.toLocaleString('en-US')} publican datos de {nombreElegidas}</span>
            )}
          </p>
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

  // Cuántas universidades publican cada carrera: el número de cada botón.
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
      <p className="flujo-nota">El número es cuántas universidades publican el salario de esa carrera (College Scorecard). Las demás no se descartan: van al final, marcadas.</p>
    </section>
  );
}

/* ---------------------------------------------------------------- Paso 2 */

function PasoDonde({ estados, setEstados, universidades }: { estados: string[]; setEstados: (e: string[]) => void; universidades: Universidad[] }) {
  const [foco, setFoco] = useState<string | null>(estados[estados.length - 1] ?? null);
  const [aviso, setAviso] = useState('');
  const conteo = useMemo(() => {
    const c: Record<string, number> = {};
    for (const u of universidades) if (u.STABBR) c[u.STABBR] = (c[u.STABBR] ?? 0) + 1;
    return c;
  }, [universidades]);
  const enFoco = foco && estados.includes(foco) ? foco : estados[estados.length - 1] ?? null;

  const quitar = (st: string) => {
    const resto = estados.filter(x => x !== st);
    setEstados(resto);
    setFoco(resto[resto.length - 1] ?? null);
    setAviso('');
  };
  // Tocar uno nuevo lo suma y muestra su ficha; uno elegido que no se está viendo, muestra su ficha;
  // el que se está viendo, se quita. Al pasar del tope se quita el primero que se eligió.
  const tocar = (st: string) => {
    if (!estados.includes(st)) {
      let nuevos = [...estados, st];
      if (nuevos.length > TOPE_ESTADOS) {
        setAviso(`Puedes elegir hasta ${TOPE_ESTADOS} estados: quitamos ${NOMBRES_ESTADOS[nuevos[0]] ?? nuevos[0]}, el primero que elegiste.`);
        nuevos = nuevos.slice(1);
      } else setAviso('');
      setEstados(nuevos);
      setFoco(st);
    } else if (enFoco !== st) {
      setFoco(st);
      setAviso('');
    } else quitar(st);
  };

  return (
    <div className="flujo-donde">
      <div className="flujo-donde-mapa">
        <h1 id="paso-titulo" className="flujo-titulo" tabIndex={-1}>¿Dónde te gustaría estudiar?</h1>
        <p className="flujo-subtitulo">Toca los estados que te interesan, hasta {TOPE_ESTADOS}. Si te da igual, salta este paso.</p>
        {aviso && <p className="flujo-aviso" role="status">{aviso}</p>}
        <MapaCuadritos conteo={conteo} seleccion={estados} foco={enFoco} onTocar={tocar} />
      </div>
      <aside className="flujo-donde-ficha" aria-label="Ficha del estado">
        {enFoco ? (
          <>
            <div className="flujo-chips">
              {estados.map(st => (
                <span key={st} className={`flujo-chip${st === enFoco ? ' flujo-chip-activo' : ''}`}>
                  <button type="button" aria-pressed={st === enFoco} onClick={() => setFoco(st)}>{NOMBRES_ESTADOS[st] ?? st}</button>
                  <button type="button" aria-label={`Quitar ${NOMBRES_ESTADOS[st] ?? st}`} onClick={() => quitar(st)}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </span>
              ))}
            </div>
            <FichaEstado estado={enFoco} universidades={universidades} />
          </>
        ) : (
          <>
            <h2 className="ficha-estado-titulo">Toca un estado del mapa</h2>
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
      <h1 id="paso-titulo" className="flujo-titulo" tabIndex={-1}>¿Ya presentaste el SAT?</h1>
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
