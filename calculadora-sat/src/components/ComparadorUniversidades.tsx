import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, formatPoliticaSAT } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { posicionUSNews, nivelRanking, textoPuesto, NOMBRE_LISTA, FUENTE_USNEWS, EDICION_USNEWS } from '../data/rankingUSNews';
import { clasificar, rangoSAT, NIVELES, AYUDA_NIVELES } from '../utils/nivelSAT';
import type { Nivel } from '../utils/nivelSAT';
import { costosSegunPerfil, usePerfil } from '../utils/perfil';
import type { CostosPerfil, Perfil } from '../utils/perfil';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { claveUniversidad } from '../utils/useMiLista';
import { buscarUniversidades } from '../utils/busqueda';
import type { IndiceBusqueda } from '../utils/busqueda';
import { InfoTooltip } from './InfoTooltip';
import { EtiquetaNivel } from './EtiquetaNivel';
import { FotoUniversidad } from './FotoUniversidad';
import { Buscador } from './Buscador';
import { InputTotalSAT } from './Filtros';
import { CONTACTO } from './BarraEduca';

/** Un aviso arriba de la pantalla ("Quitaste Yale"). Con `antes`, ofrece deshacer. */
export interface AvisoLista {
  texto: string;
  /** Cómo estaba la lista antes del cambio: "Deshacer" la deja así. */
  antes: string[] | null;
  /** Cambia en cada aviso, para reiniciar el tiempo aunque el texto se repita. */
  id: number;
}

interface Props {
  /** Las guardadas, en el orden en que se guardaron. */
  universidades: Universidad[];
  /** Las claves guardadas tal cual (para deshacer, incluso las que ya no están en los datos). */
  claves: string[];
  guardadas: Set<string>;
  indiceBusqueda: IndiceBusqueda;
  /** Tu SAT total, el mismo de la portada y la ficha (0 = sin puntaje). */
  puntajeSAT: number;
  onCambiarPuntajeSAT: (total: number) => void;
  onSeleccionar: (uni: Universidad) => void;
  onAgregar: (uni: Universidad) => void;
  onQuitar: (uni: Universidad) => void;
  onVaciar: () => void;
  onRestaurar: (claves: string[]) => void;
  onVolver: () => void;
  /** Un aviso que llega de afuera: las universidades de un enlace compartido. */
  avisoInicial?: AvisoLista | null;
  /** Ya se mostró: que no vuelva a salir al volver a Mi lista más tarde. */
  onAvisoInicialVisto?: () => void;
}

/** Lo que una fila necesita saber de cada universidad, ya calculado una vez. */
interface Contexto {
  costos: CostosPerfil;
  nivel: Nivel | null;
}

interface Fila {
  etiqueta: string;
  ayuda?: string;
  /** Valor numérico para decidir cuál es la mejor (si aplica). */
  numero?: (u: Universidad, c: Contexto) => number | null | undefined;
  /** Cómo se muestra. Si no se da, se usa `numero` con `formato`. */
  texto?: (u: Universidad, c: Contexto) => ReactNode;
  formato?: 'dinero' | 'porcentaje' | 'numero';
  /** Qué valor se marca como el mejor. Sin esto, la fila no marca nada. */
  mejor?: 'menor' | 'mayor';
  /** Fila de costos: un college de 2 años no "gana" en precio a una universidad de 4. */
  costo?: boolean;
  /** Si devuelve algo, la fila es una sola celda a lo ancho con ese texto (en vez de un dato por universidad). */
  aLoAncho?: () => ReactNode;
}

interface Grupo { titulo: string; filas: Fila[]; destacado?: boolean }

type Orden = 'guardado' | 'probabilidad' | 'costo' | 'admision';

const ORDENES: { id: Orden; texto: string }[] = [
  { id: 'guardado', texto: 'Como las guardaste' },
  { id: 'probabilidad', texto: 'Probabilidad (alta primero)' },
  { id: 'costo', texto: 'Costo anual (menor primero)' },
  { id: 'admision', texto: 'Admisión (mayor primero)' },
];

/** Estados para elegir dónde vives, por nombre (sin los territorios chicos del Pacífico). */
const ESTADOS = Object.entries(NOMBRES_ESTADOS)
  .filter(([sigla]) => !['AS', 'FM', 'GU', 'MH', 'MP', 'PW'].includes(sigla))
  .sort((a, b) => a[1].localeCompare(b[1], 'es'));

const AYUDA_RESIDENTE = 'Para pagar la matrícula del estado y recibir ayuda del gobierno de EE. UU. normalmente hay que ser ciudadano o residente permanente y vivir en ese estado, en general desde hace al menos un año. Cada universidad decide quién cuenta como residente.';

/** Si no usa el SAT, se dice: explica por qué no hay puntajes. */
const sinSAT = (u: Universidad) => u.ADMCON7 === 'Ni requerido ni recomendado' ? 'No usa el SAT' : null;

const ordenNivel = (n: Nivel | null) => n == null ? 3 : NIVELES.findIndex(x => x.nivel === n);

function formatear(valor: number | null | undefined, formato: Fila['formato']): string | null {
  if (valor == null) return null;
  if (formato === 'dinero') return formatDinero(valor);
  if (formato === 'porcentaje') return formatPorcentaje(valor);
  return valor.toLocaleString('en-US');
}

/** "$19,639 – $95,350", o un solo monto si todas cuestan lo mismo (o hay una sola). */
function rangoDinero(valores: (number | null | undefined)[]): string | null {
  const con = valores.filter((v): v is number => v != null);
  if (con.length === 0) return null;
  const min = Math.min(...con), max = Math.max(...con);
  return min === max ? formatDinero(min) : `${formatDinero(min)} – ${formatDinero(max)}`;
}

/** Para quién están calculados los costos: "estudiante internacional", "vives en Texas". */
const textoPerfil = (p: Perfil) =>
  p.tipo === 'internacional' ? 'estudiante internacional'
    : p.estado ? `vives en ${NOMBRES_ESTADOS[p.estado] ?? p.estado}` : 'vives en EE. UU.';

const notaCostoPerfil = (p: Perfil) =>
  p.tipo === 'internacional' ? 'Antes de becas, como estudiante internacional.'
    : p.estado ? `Antes de becas, viviendo en ${NOMBRES_ESTADOS[p.estado] ?? p.estado}.`
    : 'Antes de becas. Elige tu estado abajo para ver la matrícula del estado.';

function grupos(perfil: Perfil, puntaje: number): Grupo[] {
  const residente = perfil.tipo === 'eeuu';
  return [
    {
      // Lo que más pesa para decidir va primero y en grande: posibilidades, admisión, costo y salario.
      titulo: 'Lo esencial',
      destacado: true,
      filas: [
        {
          etiqueta: 'Tus posibilidades de entrar',
          ayuda: AYUDA_NIVELES,
          aLoAncho: () => puntaje > 0 ? null : 'Escribe tu puntaje SAT en el resumen de arriba para ver tus posibilidades en cada una.',
          // Corta ("Alta"): la fila ya dice que se habla de tus posibilidades.
          texto: (u, c) => c.nivel
            ? <EtiquetaNivel nivel={c.nivel} corta />
            : <span className="comparar-sin-dato">{sinSAT(u) ?? 'No publica puntajes SAT'}</span>,
        },
        { etiqueta: 'Tasa de admisión', numero: u => u.ADM_RATE, formato: 'porcentaje' },
        {
          etiqueta: 'Costo anual total',
          ayuda: glosarioCampos.COSTO_TOTAL_ANUAL,
          numero: (_, c) => c.costos.total,
          texto: (_, c) => c.costos.total != null ? `${c.costos.vidaEstimada ? '~' : ''}${formatDinero(c.costos.total)}` : null,
          mejor: 'menor',
          costo: true,
        },
        { etiqueta: 'Salario a 4 años', ayuda: glosarioCampos.MD_EARN_4YR, numero: u => u.MD_EARN_WNE_4YR, formato: 'dinero', mejor: 'mayor' },
      ],
    },
    {
      titulo: 'Admisión y SAT',
      filas: [
        { etiqueta: 'Rango SAT (25–75%)', ayuda: glosarioCampos.SAT_RANGO, texto: u => { const r = rangoSAT(u); return r ? `${r[0]}–${r[1]}` : sinSAT(u); } },
        { etiqueta: 'SAT promedio', texto: u => u.SAT_AVG != null ? String(u.SAT_AVG) : sinSAT(u) },
        { etiqueta: 'Política SAT', ayuda: glosarioCampos.ADMCON7, texto: u => formatPoliticaSAT(u.ADMCON7) },
      ],
    },
    {
      titulo: `Costos al año (${textoPerfil(perfil)})`,
      filas: [
        {
          etiqueta: 'Matrícula anual',
          numero: (_, c) => c.costos.matricula,
          // Debajo del monto, cuál de las dos matrículas es (solo si la universidad cobra distinto).
          texto: (_, c) => c.costos.matricula == null ? null : <>
            {formatDinero(c.costos.matricula)}
            {c.costos.tipoMatricula !== 'unica' && (
              <span className="comparar-sub">{c.costos.tipoMatricula === 'estado' ? 'Precio del estado' : 'Precio de fuera del estado'}</span>
            )}
          </>,
          mejor: 'menor',
          costo: true,
        },
        {
          etiqueta: 'Costo de vida',
          ayuda: glosarioCampos.COSTO_VIDA,
          numero: (_, c) => c.costos.costoVida,
          texto: (_, c) => c.costos.costoVida == null ? null : <>
            {c.costos.vidaEstimada ? '~' : ''}{formatDinero(c.costos.costoVida)}
            {c.costos.vidaEstimada && <span className="comparar-sub">Estimado</span>}
          </>,
          mejor: 'menor',
          costo: true,
        },
        // El precio neto es de alumnos de EE. UU. con ayuda federal: a un internacional no le aplica.
        ...(residente ? [{
          etiqueta: 'Precio neto promedio',
          ayuda: glosarioCampos.NPT4,
          numero: (_: Universidad, c: Contexto) => c.costos.neto,
          texto: (u: Universidad, c: Contexto) => c.costos.neto != null ? formatDinero(c.costos.neto)
            : c.costos.tipoMatricula === 'fuera' ? `Solo para residentes de ${NOMBRES_ESTADOS[u.STABBR] ?? u.STABBR}` : null,
          mejor: 'menor' as const,
          costo: true,
        }] : []),
      ],
    },
    {
      titulo: 'Becas de la universidad',
      filas: [
        { etiqueta: 'Alumnos con beca', ayuda: glosarioCampos.BECAS_1ER_ANIO, numero: u => u.IGRNT_P != null ? u.IGRNT_P / 100 : null, formato: 'porcentaje', mejor: 'mayor' },
        { etiqueta: 'Beca promedio al año', numero: u => u.IGRNT_A, formato: 'dinero', mejor: 'mayor' },
      ],
    },
    {
      titulo: 'Sobre la universidad',
      filas: [
        { etiqueta: 'Alumnos de pregrado', numero: u => u.UGDS, formato: 'numero' },
        { etiqueta: 'Alumnos por profesor', ayuda: glosarioCampos.STUFACR, numero: u => u.STUFACR, texto: u => u.STUFACR != null ? `${u.STUFACR}:1` : null, mejor: 'menor' },
      ],
    },
  ];
}

const claseControl = (control: string | null) =>
  control === 'Pública' ? 'marca marca-publica' : 'marca marca-privada';

/** Visto bueno de "Mejor": dibujado, del mismo trazo que los demás íconos de la web. */
const IconoMejor = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Los nombres de las universidades, pegados arriba al bajar por la tabla. La tabla se
 * desplaza de lado dentro de su caja, y eso impide que su propio encabezado quede pegado
 * a la pantalla (sticky solo funciona dentro de la caja). Por eso esta franja es una copia
 * aparte: mide las columnas de la tabla y se corre de lado junto con ella. Es solo visual
 * (aria-hidden): el lector de pantalla ya tiene el encabezado real de cada columna.
 */
function useCabeceraPegada(envolturaRef: RefObject<HTMLDivElement | null>, theadRef: RefObject<HTMLTableSectionElement | null>, cantidad: number) {
  const [estado, setEstado] = useState<{ left: number; width: number; scroll: number; columnas: number[] } | null>(null);
  useEffect(() => {
    const envoltura = envolturaRef.current;
    const thead = theadRef.current;
    if (!envoltura || !thead) return;
    let cuadro = 0;
    const medir = () => {
      cancelAnimationFrame(cuadro);
      cuadro = requestAnimationFrame(() => {
        const alto = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--alto-barra')) || 0;
        const caja = envoltura.getBoundingClientRect();
        // Aparece cuando el encabezado real ya pasó por debajo de la barra de Educa, y se va
        // antes de que termine la tabla (no tapa la última fila ni el cierre).
        if (thead.getBoundingClientRect().bottom > alto || caja.bottom < alto + 140) { setEstado(null); return; }
        const columnas = Array.from(thead.rows[0].cells, c => c.getBoundingClientRect().width);
        setEstado({ left: caja.left, width: caja.width, scroll: envoltura.scrollLeft, columnas });
      });
    };
    medir();
    window.addEventListener('scroll', medir, { passive: true });
    window.addEventListener('resize', medir);
    envoltura.addEventListener('scroll', medir, { passive: true });
    return () => {
      cancelAnimationFrame(cuadro);
      window.removeEventListener('scroll', medir);
      window.removeEventListener('resize', medir);
      envoltura.removeEventListener('scroll', medir);
    };
  }, [envolturaRef, theadRef, cantidad]);
  return estado;
}

/**
 * "Mi lista": las universidades guardadas, lado a lado, con la misma cara que la ficha
 * (bandas, foto, chips de tipo y ranking, cifras grandes). Arriba, un resumen de la lista
 * (tus posibilidades, el costo y el salario); en cada fila se marca la mejor cuando hay una
 * clara; al final, el siguiente paso con Educa. Quitar o vaciar se puede deshacer.
 */
export function ComparadorUniversidades({
  universidades, claves, guardadas, indiceBusqueda, puntajeSAT, onCambiarPuntajeSAT,
  onSeleccionar, onAgregar, onQuitar, onVaciar, onRestaurar, onVolver, avisoInicial, onAvisoInicialVisto,
}: Props) {
  const [perfil, setPerfil] = usePerfil();
  const [orden, setOrden] = useState<Orden>('guardado');

  // ---------- Avisos con "Deshacer" ----------
  const [aviso, setAviso] = useState<AvisoLista | null>(avisoInicial ?? null);
  const contadorAvisos = useRef(0);
  useEffect(() => { if (avisoInicial) onAvisoInicialVisto?.(); }, [avisoInicial, onAvisoInicialVisto]);
  const avisar = (texto: string, antes: string[] | null = null) => setAviso({ texto, antes, id: ++contadorAvisos.current });
  useEffect(() => {
    if (!aviso) return;
    // 8 segundos: lo justo para leerlo y arrepentirse, sin que se quede tapando la tabla.
    const t = setTimeout(() => setAviso(null), 8000);
    return () => clearTimeout(t);
  }, [aviso]);

  const quitar = (u: Universidad) => { avisar(`Quitaste ${u.INSTNM} de tu lista.`, claves); onQuitar(u); };
  const vaciar = () => { avisar('Vaciaste tu lista.', claves); onVaciar(); };
  const deshacer = () => { if (aviso?.antes) onRestaurar(aviso.antes); setAviso(null); };

  // ---------- Agregar desde el buscador ----------
  const [texto, setTexto] = useState('');
  const [sugerir, setSugerir] = useState(false);
  const textoDiferido = useDeferredValue(texto);
  const resultado = useMemo(() => buscarUniversidades(indiceBusqueda, textoDiferido), [indiceBusqueda, textoDiferido]);
  const sugerencias = useMemo(() => resultado?.ordenadas.slice(0, 8) ?? [], [resultado]);
  const agregar = (u: Universidad) => {
    if (guardadas.has(claveUniversidad(u))) { avisar(`${u.INSTNM} ya está en tu lista.`); return; }
    avisar(`Agregaste ${u.INSTNM} a tu lista.`, claves);
    onAgregar(u);
  };

  // ---------- Datos de cada universidad, calculados una vez ----------
  const contextos = useMemo(() => new Map(universidades.map(u => [u, {
    costos: costosSegunPerfil(u, perfil),
    nivel: puntajeSAT > 0 ? clasificar(u, puntajeSAT) : null,
  }])), [universidades, perfil, puntajeSAT]);
  const ctx = (u: Universidad) => contextos.get(u)!;

  const ordenadas = useMemo(() => {
    const lista = [...universidades];
    // sort es estable: a igual valor, se respeta el orden en que se guardaron. Sin dato, al final.
    const porNumero = (f: (u: Universidad) => number | null | undefined, signo: 1 | -1) => (a: Universidad, b: Universidad) => {
      const x = f(a), y = f(b);
      if (x == null || y == null) return (x == null ? 1 : 0) - (y == null ? 1 : 0);
      return (x - y) * signo;
    };
    if (orden === 'probabilidad') lista.sort((a, b) => ordenNivel(contextos.get(a)!.nivel) - ordenNivel(contextos.get(b)!.nivel));
    if (orden === 'costo') lista.sort(porNumero(u => contextos.get(u)!.costos.total, 1));
    if (orden === 'admision') lista.sort(porNumero(u => u.ADM_RATE, -1));
    return lista;
  }, [universidades, orden, contextos]);

  const GRUPOS = useMemo(() => grupos(perfil, puntajeSAT), [perfil, puntajeSAT]);
  // ¿Se mezclan colleges de 2 años con universidades de 4? Entonces en costos solo compiten las de 4.
  const mezclaNiveles = ordenadas.some(u => u.ICLEVEL === '4-Year') && ordenadas.some(u => u.ICLEVEL !== '4-Year');

  // ---------- Resumen de la lista ----------
  const conteo = NIVELES.map(n => ({ ...n, cantidad: ordenadas.filter(u => ctx(u).nivel === n.nivel).length }));
  const sinNivel = ordenadas.filter(u => ctx(u).nivel == null).length;
  const consejo = (() => {
    const [alta, media, baja] = conteo.map(c => c.cantidad);
    if (alta + media + baja === 0) return null;
    // Nunca se promete nada: se sugiere cómo equilibrar la lista.
    if (alta === 0) return 'Te conviene sumar alguna con probabilidad alta.';
    if (media + baja === 0) return 'Puedes sumar alguna más exigente.';
    return 'Tu lista combina distintas probabilidades.';
  })();

  const rangoCosto = rangoDinero(ordenadas.map(u => ctx(u).costos.total));
  const rangoSalario = rangoDinero(ordenadas.map(u => u.MD_EARN_WNE_4YR));

  const envolturaRef = useRef<HTMLDivElement>(null);
  const theadRef = useRef<HTMLTableSectionElement>(null);
  const pegada = useCabeceraPegada(envolturaRef, theadRef, ordenadas.length);

  // ---------- Compartir ----------
  const compartir = async () => {
    const ids = ordenadas.map(u => u.UNITID).filter((id): id is number => id != null);
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?lista=${ids.join(',')}`;
    // En el celular abre el menú de compartir del teléfono (WhatsApp, correo…).
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Mi lista de universidades', text: 'Mira las universidades que estoy comparando en College Finder de Educa:', url });
      } catch { /* la persona cerró el menú: no pasa nada */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      avisar('Copiamos el enlace de tu lista. Pégalo en WhatsApp, en un correo o donde quieras.');
    } catch {
      window.prompt('Copia el enlace de tu lista:', url);
    }
  };

  const n = ordenadas.length;
  const subtitulo = n === 0 ? 'Todavía no guardas universidades.'
    : n === 1 ? 'Tienes 1 universidad. Agrega otra para compararlas: en cada fila marcaremos la mejor.'
    : `Tienes ${n} universidades, guardadas en este navegador. En cada fila marcamos la mejor.`;

  const buscador = (
    <div className="mi-lista-agregar">
      <Buscador id="mi-lista-buscador" etiqueta="Agrega una universidad" compacto
        placeholder="Nombre o sigla: Harvard, MIT, UCLA…" conservarTexto={false}
        busquedaNombre={texto} setBusquedaNombre={setTexto}
        mostrarSugerencias={sugerir} setMostrarSugerencias={setSugerir}
        sugerencias={sugerencias} sonAproximadas={resultado?.aproximado ?? false}
        onSeleccionar={agregar} />
    </div>
  );

  return (
    <main className="mi-lista">
      {/* Migas de pan, como en la ficha: "← Resultados" vuelve a la lista con los filtros de antes. */}
      <div className="migas">
        <div className="in">
          <nav className="migas-ruta" aria-label="Ruta">
            <a href={import.meta.env.BASE_URL} onClick={e => { e.preventDefault(); onVolver(); }}>
              <span aria-hidden="true">←</span> Resultados
            </a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mi lista</span>
          </nav>
        </div>
      </div>

      {/* El aviso vive siempre en la página (vacío): así el lector de pantalla lo anuncia al cambiar. */}
      <div className="aviso-lista-zona" role="status" aria-live="polite">
        {aviso && (
          <div className="aviso-lista" key={aviso.id}>
            <span>{aviso.texto}</span>
            {aviso.antes && <button type="button" className="aviso-lista-deshacer" onClick={deshacer}>Deshacer</button>}
            <button type="button" className="aviso-lista-cerrar" onClick={() => setAviso(null)} aria-label="Cerrar aviso">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}
      </div>

      {/* CABECERA: título, acciones y el resumen de la lista. */}
      <section className="banda banda-blanco mi-lista-cabecera">
        <div className="in">
          <div className="mi-lista-titulo-fila">
            <div>
              <h1 className="mi-lista-titulo">Mi lista</h1>
              <p className="banda-subtitulo">{subtitulo}</p>
            </div>
            {n > 0 && (
              <div className="mi-lista-acciones">
                <button type="button" className="boton-enlace" onClick={compartir}>Compartir</button>
                <button type="button" className="boton-enlace" onClick={() => window.print()}>Imprimir o guardar PDF</button>
                <button type="button" className="boton-enlace" onClick={vaciar}>Vaciar lista</button>
              </div>
            )}
          </div>

          {buscador}

          {n === 0 ? (
            <div className="mi-lista-vacia">
              <p>
                También puedes tocar la <strong>estrella</strong> en cualquier universidad de los resultados
                o en su ficha para guardarla aquí. La lista se guarda en este navegador: no hace falta crear una cuenta.
              </p>
              <button type="button" className="boton-marino" onClick={onVolver}>Explorar universidades</button>
            </div>
          ) : (
            <dl className="esenciales esenciales-lista" aria-label="Resumen de tu lista">
              <div className="esencial">
                <dt className="esencial-etiqueta">Tus posibilidades<InfoTooltip sobre="Tus posibilidades" texto={AYUDA_NIVELES} /></dt>
                {puntajeSAT > 0 ? (
                  <>
                    <dd className="esencial-valor resumen-niveles">
                      {conteo.filter(c => c.cantidad > 0).map(c => (
                        <span key={c.nivel} className="resumen-nivel">
                          <b className="numero">{c.cantidad}</b><EtiquetaNivel nivel={c.nivel} corta />
                        </span>
                      ))}
                      {conteo.every(c => c.cantidad === 0) && <span className="esencial-vacio">Sin datos SAT</span>}
                    </dd>
                    <dd className="esencial-nota">
                      {consejo}
                      {sinNivel > 0 && <> {sinNivel === 1 ? '1 no publica' : `${sinNivel} no publican`} puntajes SAT.</>}
                      {' '}Con tu SAT de <strong className="numero">{puntajeSAT}</strong>.
                    </dd>
                  </>
                ) : (
                  <>
                    <dd className="esencial-valor resumen-puntaje">
                      <InputTotalSAT id="sat-total-lista" etiqueta="Tu SAT total" total={0}
                        onEscribir={() => {}} setSoloTotal={v => { if (v > 0) onCambiarPuntajeSAT(v); }} />
                    </dd>
                    <dd className="esencial-nota">Escríbelo y lo comparamos con el de los admitidos de cada una.</dd>
                  </>
                )}
              </div>
              <div className="esencial">
                <dt className="esencial-etiqueta">Costo anual total<InfoTooltip sobre="Costo anual total" texto={glosarioCampos.COSTO_TOTAL_ANUAL} /></dt>
                <dd className={`esencial-valor numero${rangoCosto ? '' : ' esencial-vacio'}`}>
                  {rangoCosto ?? 'Sin dato'}
                </dd>
                <dd className="esencial-nota">{notaCostoPerfil(perfil)}</dd>
              </div>
              <div className="esencial">
                <dt className="esencial-etiqueta">Salario a 4 años<InfoTooltip sobre="Salario a 4 años" texto={glosarioCampos.MD_EARN_4YR} /></dt>
                <dd className={`esencial-valor numero${rangoSalario ? '' : ' esencial-vacio'}`}>
                  {rangoSalario ?? 'Sin dato'}
                </dd>
                <dd className="esencial-nota">Lo que gana al año el egresado típico.</dd>
              </div>
            </dl>
          )}
        </div>
      </section>

      {n > 0 && (
        <section className="banda banda-gris" aria-label="Comparación">
          <div className="in">
            {/* Perfil y orden: cambian lo que muestra la tabla, por eso van justo encima de ella. */}
            <div className="mi-lista-controles">
              <div className="perfil">
                <span id="perfil-titulo" className="perfil-titulo">Calcular costos para</span>
                <div className="segmento" role="radiogroup" aria-labelledby="perfil-titulo">
                  <label className={perfil.tipo === 'internacional' ? 'activo' : undefined}>
                    <input type="radio" name="perfil" checked={perfil.tipo === 'internacional'}
                      onChange={() => setPerfil({ tipo: 'internacional' })} />
                    Estudiante internacional
                  </label>
                  <label className={perfil.tipo === 'eeuu' ? 'activo' : undefined}>
                    <input type="radio" name="perfil" checked={perfil.tipo === 'eeuu'}
                      onChange={() => setPerfil({ tipo: 'eeuu', estado: perfil.tipo === 'eeuu' ? perfil.estado : null })} />
                    Vivo en EE. UU.
                  </label>
                </div>
                {perfil.tipo === 'eeuu' && (
                  <span className="perfil-estado">
                    <label htmlFor="perfil-estado" className="visualmente-oculto">Estado donde vives</label>
                    <select id="perfil-estado" value={perfil.estado ?? ''} onChange={e => setPerfil({ tipo: 'eeuu', estado: e.target.value || null })}>
                      <option value="">Elige tu estado</option>
                      {ESTADOS.map(([sigla, nombre]) => <option key={sigla} value={sigla}>{nombre}</option>)}
                    </select>
                    <InfoTooltip sobre="Vivo en EE. UU." texto={AYUDA_RESIDENTE} />
                  </span>
                )}
              </div>
              <label className="mi-lista-orden">
                <span>Ordenar por</span>
                <select value={orden} onChange={e => setOrden(e.target.value as Orden)}>
                  {ORDENES.map(o => (
                    <option key={o.id} value={o.id} disabled={o.id === 'probabilidad' && puntajeSAT === 0}>{o.texto}</option>
                  ))}
                </select>
              </label>
            </div>

            {pegada && (
              <div className="comparar-pegada" aria-hidden="true" style={{ left: pegada.left, width: pegada.width }}>
                <div className="comparar-pegada-fila" style={{ transform: `translateX(${-pegada.scroll}px)` }}>
                  {pegada.columnas.map((ancho, i) => (
                    <div key={i} style={{ width: ancho }} className="comparar-pegada-celda">{i > 0 && ordenadas[i - 1]?.INSTNM}</div>
                  ))}
                </div>
                <div className="comparar-pegada-esquina" style={{ width: pegada.columnas[0] }}>Mi lista</div>
              </div>
            )}

            <div className="panel comparar-envoltura" ref={envolturaRef}>
              <table className="comparar-tabla">
                <thead ref={theadRef}>
                  <tr>
                    <th scope="col" className="comparar-esquina"><span className="visualmente-oculto">Dato</span></th>
                    {ordenadas.map(u => {
                      const ranking = posicionUSNews(u);
                      return (
                        <th scope="col" key={claveUniversidad(u)} className="comparar-uni">
                          <div className="comparar-foto">
                            <FotoUniversidad uni={u} miniatura />
                            {/* Lejos del nombre (que abre la ficha), en la esquina de la foto. */}
                            <button type="button" className="comparar-quitar" onClick={() => quitar(u)} aria-label={`Quitar ${u.INSTNM} de Mi lista`} title="Quitar de Mi lista">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                            </button>
                          </div>
                          <button type="button" className="comparar-nombre" onClick={() => onSeleccionar(u)}>{u.INSTNM}</button>
                          <span className="comparar-lugar">{u.CITY}, {u.STABBR}</span>
                          <span className="marcas">
                            {ranking && (
                              <span className={`marca marca-ranking marca-ranking-${nivelRanking(ranking.puesto)}`} title={`${NOMBRE_LISTA[ranking.lista]}. Fuente: ${FUENTE_USNEWS}`}>
                                {textoPuesto(ranking)}
                              </span>
                            )}
                            {u.CONTROL && <span className={claseControl(u.CONTROL)}>{u.CONTROL === 'Pública' ? 'Pública' : 'Privada'}</span>}
                            {u.ICLEVEL === '2-Year' && <span className="marca">2 años</span>}
                          </span>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                {GRUPOS.map(grupo => (
                  <tbody key={grupo.titulo} className={grupo.destacado ? 'comparar-destacado' : undefined}>
                    <tr className="comparar-grupo">
                      {/* El título va en un span pegado a la izquierda: al correr la tabla no se pierde. */}
                      <th scope="rowgroup" colSpan={n + 1}><span>{grupo.titulo}</span></th>
                    </tr>
                    {grupo.filas.map(fila => {
                      const etiqueta = (
                        <th scope="row">
                          <span className="con-ayuda">{fila.etiqueta}{fila.ayuda && <InfoTooltip sobre={fila.etiqueta} texto={fila.ayuda} />}</span>
                        </th>
                      );
                      const ancho = fila.aLoAncho?.();
                      if (ancho) {
                        return <tr key={fila.etiqueta}>{etiqueta}<td colSpan={n} className="comparar-ancho"><span>{ancho}</span></td></tr>;
                      }
                      const numeros = ordenadas.map(u => fila.numero?.(u, ctx(u)) ?? null);
                      // Compiten las que tienen dato (y en costos, solo las de 4 años si se mezclan).
                      const compiten = numeros.filter((v, i): v is number =>
                        v != null && !(fila.costo && mezclaNiveles && ordenadas[i].ICLEVEL !== '4-Year'));
                      // Se marca solo si hay al menos dos valores y no son todos iguales.
                      const objetivo = fila.mejor && compiten.length >= 2 && new Set(compiten).size > 1
                        ? (fila.mejor === 'menor' ? Math.min(...compiten) : Math.max(...compiten))
                        : null;
                      return (
                        <tr key={fila.etiqueta}>
                          {etiqueta}
                          {ordenadas.map((u, i) => {
                            const contenido = fila.texto ? fila.texto(u, ctx(u)) : formatear(numeros[i], fila.formato);
                            const esMejor = objetivo != null && numeros[i] === objetivo
                              && !(fila.costo && mezclaNiveles && u.ICLEVEL !== '4-Year');
                            return (
                              <td key={claveUniversidad(u)} className={`numero${esMejor ? ' comparar-mejor' : ''}`}>
                                {contenido ?? <span className="comparar-sin-dato">Sin dato</span>}
                                {esMejor && (
                                  <span className="comparar-insignia"><IconoMejor />Mejor<span className="visualmente-oculto"> de tu lista</span></span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                ))}
              </table>
            </div>
            <p className="fuente">
              Ranking: U.S. News {EDICION_USNEWS}. "~" = costo de vida estimado. Los costos son antes de becas.
              {mezclaNiveles && ' En costos, los colleges de 2 años no compiten por "Mejor" con las universidades de 4 años: sus precios no son comparables.'}
              {' '}Fotos de Wikimedia Commons: el autor y la licencia de cada una están en su ficha.
            </p>
          </div>
        </section>
      )}

      {/* EL SIGUIENTE PASO: revisar la lista con un consejero. Es el único amarillo de la vista. */}
      {n > 0 && (
        <section className="banda banda-contacto" aria-labelledby="cierre-lista-titulo">
          <div className="in cierre-educa">
            <div className="cierre-educa-texto">
              <h2 id="cierre-lista-titulo" className="banda-titulo">
                {puntajeSAT > 0 && conteo[0].cantidad === 0 && conteo.some(c => c.cantidad > 0)
                  ? 'Tu lista todavía no tiene universidades con probabilidad alta.'
                  : '¿Revisamos tu lista con un consejero de Educa?'}
              </h2>
              <p>
                {puntajeSAT > 0 && conteo[0].cantidad === 0 && conteo.some(c => c.cantidad > 0)
                  ? 'Un consejero de Educa te ayuda a equilibrarla con universidades donde tienes más posibilidades, y en el curso SAT te preparas para subir tu puntaje.'
                  : 'Te ayudamos a confirmar que tu lista esté equilibrada, a entender los costos y a preparar cada postulación.'}
              </p>
            </div>
            <div className="cierre-educa-accion">
              <a className="boton-sol" href={CONTACTO} target="_blank" rel="noopener noreferrer">
                Habla con un consejero de Educa
                <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
              </a>
              <p className="cierre-educa-nota">Admission Counseling y curso SAT · Educa College Prep</p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
