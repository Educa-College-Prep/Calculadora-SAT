import { useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, formatNivel } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { calcularCostoVida } from '../utils/costos';
import { etiquetaSAT, etiquetaSelectividad } from '../utils/etiquetasNivel';
import type { EtiquetaNivel } from '../utils/etiquetasNivel';
import { similaresParaFicha } from '../utils/similares';
import { urlCalculadora, NOTA_CALCULADORA } from '../utils/enlacesUniversidad';
import { ALIASES } from '../utils/aliases';
import { InfoTooltip } from './InfoTooltip';
import { BotonGuardar } from './BotonGuardar';
import { FotoUniversidad, CreditoFoto } from './FotoUniversidad';
import { UniversidadesSimilares } from './UniversidadesSimilares';
import { posicionUSNews, NOMBRE_LISTA, FUENTE_USNEWS, EDICION_USNEWS } from '../data/rankingUSNews';
import { RangosSAT } from './RangosSAT';
import { DemografiaAdmision } from './DemografiaAdmision';
import { CostosFinanciamiento } from './CostosFinanciamiento';
import { SobreUniversidad, ContactoUniversidad } from './InfoUniversidad';
import { VideosEduca } from './VideoUniversidad';
import { VIDEOS_UNIVERSIDADES, tieneVideos } from '../data/videosUniversidades';
import { FECHAS_POSTULACION } from '../data/fechasPostulacion';
import { SalarioPorCarrera } from './SalarioPorCarrera';
import { useSalariosCarreras } from '../utils/salariosCarreras';
import { BarraFlotante } from './BarraFlotante';
import { useALaVista, useSubiendo } from '../utils/useDesplazamiento';

interface Props {
  uni: Universidad;
  onVolver: () => void;
  guardada: boolean;
  onAlternarGuardada: (uni: Universidad) => void;
  cantidadMiLista: number;
  onVerMiLista: () => void;
  /** Todas las universidades, para buscar las similares. */
  universidades: Universidad[];
  onSeleccionar: (uni: Universidad) => void;
}

/**
 * Casilla de "Lo esencial": un dato clave con su explicación a un toque y, en admisión y SAT,
 * una etiqueta de nivel debajo del número ("Élite", "Top 1%"). Sin etiqueta no se dibuja nada.
 * `corta` es la etiqueta abreviada para celular ("SAT promedio").
 */
function Esencial({ etiqueta, corta, valor, ayuda, nivel }: {
  etiqueta: string; corta?: string; valor: string | null; ayuda: string; nivel?: EtiquetaNivel | null;
}) {
  return (
    <div className="esencial">
      <dt className="esencial-etiqueta">
        {corta ? <><span className="solo-ancho">{etiqueta}</span><span className="solo-movil">{corta}</span></> : etiqueta}
        <InfoTooltip texto={ayuda} />
      </dt>
      <dd className={`esencial-valor numero${valor == null ? ' esencial-vacio' : ''}`}>{valor ?? 'Sin dato'}</dd>
      {nivel && (
        <dd className="esencial-nivel">
          {/* El nivel nunca se dice solo con el color: el texto siempre está. */}
          <span className={`punto-nivel punto-nivel-${nivel.nivel}`} title={nivel.explicacion}>
            <i aria-hidden="true" />{nivel.nombre}
          </span>
        </dd>
      )}
    </div>
  );
}

/**
 * Banda de la ficha: ocupa todo el ancho de la pantalla, con el contenido centrado (máx. 1280px).
 * Las bandas alternan gris y blanco para separar secciones sin bordes; "marca" es la azul de
 * Experiencia Educa. Con `id`, la barra de pestañas puede saltar a ella.
 */
function Banda({ id, fondo, titulo, subtitulo, children }: {
  id?: string; fondo: 'gris' | 'blanco' | 'marca'; titulo?: string; subtitulo?: ReactNode; children: ReactNode;
}) {
  return (
    <section id={id} className={`banda banda-${fondo}`}>
      <div className="in">
        {titulo && (
          <header className="banda-cabecera">
            <h2 className="banda-titulo">{titulo}</h2>
            {subtitulo && <p className="banda-subtitulo">{subtitulo}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

/** Panel con fondo gris claro y bordes redondeados, dentro de una banda blanca o gris. */
function Panel({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <div className="ficha-panel">
      <h3 className="ficha-panel-titulo con-ayuda">{titulo}{ayuda && <InfoTooltip texto={ayuda} />}</h3>
      {children}
    </div>
  );
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Lista de plazos de postulación, con un bloque de fecha (día grande y mes) a la izquierda. */
function FechasPostulacion({ unitid }: { unitid: number }) {
  const fechas = FECHAS_POSTULACION[unitid];
  return (
    <>
      <ul className="fechas">
        {fechas.plazos.map(p => {
          // Sin pasar por Date, que con la zona horaria podría correr el día.
          const [, mes, dia] = p.fecha.split('-').map(Number);
          return (
            <li key={p.nombre}>
              <span className="fecha-bloque" aria-hidden="true">
                <span className="fecha-dia">{dia}</span>
                <span className="fecha-mes">{MESES_CORTOS[mes - 1]}</span>
              </span>
              <span>
                <strong>{p.nombre}</strong>
                <span className="visualmente-oculto">: {dia} de {MESES_CORTOS[mes - 1]}.</span>
                <span className="fecha-descripcion">{p.descripcion}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="fuente">Ciclo {fechas.ciclo}. Fuente: web de admisión de la universidad. Confírmalas antes de postular.</p>
    </>
  );
}

/** Secciones de la barra de pestañas, en el orden de la página. */
const SECCIONES = [
  { id: 'resumen', texto: 'Resumen' },
  { id: 'experiencia', texto: 'Experiencia Educa' },
  { id: 'admision', texto: 'Admisión' },
  { id: 'costos', texto: 'Costos' },
  { id: 'contacto', texto: 'Contacto' },
];

/**
 * La pestaña activa es la de la sección que cruza una franja en el centro de la pantalla
 * (entre el 40% y el 45% de la altura): así cambia cuando la sección ya ocupa la vista, no
 * apenas asoma su borde.
 */
function useSeccionActiva(ids: string[]): string {
  const [activa, setActiva] = useState(ids[0]);
  const clave = ids.join(',');
  useEffect(() => {
    const observador = new IntersectionObserver(
      entradas => entradas.forEach(e => { if (e.isIntersecting) setActiva(e.target.id); }),
      { rootMargin: '-40% 0px -55% 0px' }
    );
    clave.split(',').forEach(id => { const s = document.getElementById(id); if (s) observador.observe(s); });
    return () => observador.disconnect();
  }, [clave]);
  return activa;
}

/**
 * Lleva a una sección sin cambiar la URL. Un enlace "#costos" normal agregaría una entrada al
 * historial y el navegador avisaría "popstate", que la app entiende como "atrás": cerraría la
 * ficha. El href queda para que el enlace siga siendo un enlace (teclado, lector de pantalla).
 */
function irASeccion(e: MouseEvent<HTMLAnchorElement>, id: string) {
  e.preventDefault();
  const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: suave ? 'smooth' : 'auto' });
}

const claseControl = (control: string | null) =>
  control === 'Pública' ? 'marca marca-publica' : 'marca marca-privada';

export function DetalleUniversidad({ uni, onVolver, guardada, onAlternarGuardada, cantidadMiLista, onVerMiLista, universidades, onSeleccionar }: Props) {
  const matricula = uni.TUITIONFEE_OUT ?? uni.TUITIONFEE_IN ?? null;
  // Lo que cuesta un año para alguien de fuera del estado (el público de esta web): matrícula + vida.
  const costoVida = calcularCostoVida(uni);
  const costoTotal = matricula != null && costoVida ? matricula + costoVida.valor : null;
  const aprox = costoVida?.estimado ? '~' : '';
  const ranking = posicionUSNews(uni);
  const similares = useMemo(() => similaresParaFicha(uni, universidades), [uni, universidades]);
  const salariosCarreras = useSalariosCarreras(uni.UNITID);
  const videos = uni.UNITID != null ? VIDEOS_UNIVERSIDADES[uni.UNITID] : undefined;
  const conVideos = tieneVideos(videos);
  const conFechas = uni.UNITID != null && FECHAS_POSTULACION[uni.UNITID] != null;
  const calculadora = urlCalculadora(uni.NPCURL);
  const conSalarios = salariosCarreras != null
    && (salariosCarreras.length > 0 || uni.MD_EARN_WNE_1YR != null || uni.MD_EARN_WNE_4YR != null);
  // Nombre corto para la barra de pestañas: la sigla conocida ("NYU", "MIT") o el nombre entero.
  const nombreCorto = ALIASES[uni.INSTNM]?.find(a => a.length <= 8 && a === a.toUpperCase()) ?? uni.INSTNM;

  // Sin videos no hay banda Experiencia Educa, así que tampoco su pestaña.
  const secciones = SECCIONES.filter(s => s.id !== 'experiencia' || conVideos);
  const activa = useSeccionActiva(secciones.map(s => s.id));

  // El nombre corto aparece en la barra recién cuando el hero salió de pantalla (la barra
  // ya está pegada arriba y el nombre grande no se ve).
  const heroRef = useRef<HTMLElement>(null);
  const heroALaVista = useALaVista(heroRef);

  // En celular las pestañas se deslizan de lado: la activa se centra sola.
  const pestanasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const caja = pestanasRef.current;
    const a = caja?.querySelector<HTMLElement>(`[data-s="${activa}"]`);
    if (caja && a && caja.scrollWidth > caja.clientWidth) {
      const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      caja.scrollTo({ left: a.offsetLeft - caja.clientWidth / 2 + a.clientWidth / 2, behavior: suave ? 'smooth' : 'auto' });
    }
  }, [activa]);

  // "Guardar" y "Comparar" flotan al subir por la ficha (debajo de las pestañas), pero no
  // mientras se ven los del hero (estarían repetidos).
  const accionesRef = useRef<HTMLDivElement>(null);
  const accionesALaVista = useALaVista(accionesRef);
  const subiendo = useSubiendo();
  const acciones = (
    <>
      <BotonGuardar guardada={guardada} nombre={uni.INSTNM} onAlternar={() => onAlternarGuardada(uni)} conTexto />
      {cantidadMiLista > 0 && (
        <button type="button" className="boton" onClick={onVerMiLista}>
          Comparar Mi lista ({cantidadMiLista})
        </button>
      )}
    </>
  );

  return (
    <main className="ficha">
      {/* En pantalla grande no hay "Volver": la barra de Educa y el "atrás" del navegador
          llevan a los resultados. En celular sí, debajo de la cabecera. */}
      <div className="in ficha-volver-movil">
        <button type="button" className="boton ficha-volver" onClick={onVolver}>← Volver a resultados</button>
      </div>
      <BarraFlotante visible={subiendo && !accionesALaVista}>{acciones}</BarraFlotante>

      {/* HERO: la foto a todo el ancho y, encima, el nombre sobre un degradado oscuro a la
          izquierda (donde va el texto blanco). En celular, la foto arriba y el texto debajo. */}
      <header className="hero" ref={heroRef}>
        <FotoUniversidad uni={uni} />
        <div className="in hero-contenido">
          <div className="marcas">
            {uni.CONTROL && <span className={claseControl(uni.CONTROL)}>{uni.CONTROL}</span>}
            {uni.ICLEVEL && <span className="marca marca-grado">{formatNivel(uni.ICLEVEL)}</span>}
            {uni.ADMCON7 === 'Requerido' && <span className="marca marca-sat">SAT obligatorio</span>}
          </div>
          {ranking && (
            <p className="hero-ranking" title={`Fuente: ${FUENTE_USNEWS}`}>
              <strong>#{ranking.puesto}</strong> en {NOMBRE_LISTA[ranking.lista]} · U.S. News {EDICION_USNEWS}
            </p>
          )}
          <h1 className="hero-nombre">{uni.INSTNM}</h1>
          <p className="hero-lugar">
            {[`${uni.CITY}, ${uni.STABBR}`, uni.LOCALE, uni.UGDS ? `${uni.UGDS.toLocaleString('en-US')} alumnos de pregrado` : null]
              .filter(Boolean).join(' · ')}
          </p>
          <div className="hero-acciones" ref={accionesRef}>
            {videos?.tour && <a className="boton-sol" href="#experiencia" onClick={e => irASeccion(e, 'experiencia')}>▶ Ver campus tour</a>}
            {acciones}
          </div>
        </div>
        <CreditoFoto uni={uni} />
      </header>

      {/* BARRA DE PESTAÑAS: pegada debajo de la barra de Educa al bajar. */}
      <nav className={`pestanas-ficha${heroALaVista ? '' : ' pegada'}`} aria-label="Secciones de la ficha">
        <div className="in">
          <span className="pestanas-nombre" aria-hidden={heroALaVista}>{nombreCorto}</span>
          <div className="pestanas-lista" ref={pestanasRef}>
            {secciones.map(s => (
              <a key={s.id} href={`#${s.id}`} data-s={s.id} className={s.id === activa ? 'activa' : undefined}
                onClick={e => irASeccion(e, s.id)}
                aria-current={s.id === activa ? 'location' : undefined}>
                {s.texto}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* RESUMEN: lo esencial en cinco casillas y "Sobre la universidad". */}
      <Banda id="resumen" fondo="gris">
        <dl className="esenciales" aria-label="Lo esencial">
          <Esencial etiqueta="Tasa de admisión" valor={formatPorcentaje(uni.ADM_RATE)} ayuda={glosarioCampos.ADM_RATE}
            nivel={etiquetaSelectividad(uni.ADM_RATE)} />
          <Esencial etiqueta="Puntaje SAT promedio" corta="SAT promedio" valor={uni.SAT_AVG != null ? String(uni.SAT_AVG) : null}
            ayuda={glosarioCampos.SAT_AVG} nivel={etiquetaSAT(uni.SAT_AVG, uni.ADMCON7)} />
          <Esencial etiqueta="Matrícula anual" valor={formatDinero(matricula)}
            ayuda={uni.TUITIONFEE_IN != null && uni.TUITIONFEE_OUT != null && uni.TUITIONFEE_IN !== uni.TUITIONFEE_OUT
              ? glosarioCampos.TUITIONFEE_OUT : glosarioCampos.TUITIONFEE_UNICA} />
          <Esencial etiqueta="Costo de vida al año" valor={costoVida ? aprox + formatDinero(costoVida.valor) : null}
            ayuda={costoVida?.estimado ? glosarioCampos.COSTO_VIDA_ESTIMADO : glosarioCampos.COSTO_VIDA} />
          <Esencial etiqueta="Costo anual total" valor={costoTotal != null ? aprox + formatDinero(costoTotal) : null}
            ayuda={glosarioCampos.COSTO_TOTAL_ESENCIAL} />
        </dl>
        <SobreUniversidad uni={uni} />
      </Banda>

      {/* EXPERIENCIA EDUCA: campus tour y testimonios. Sin videos, no hay banda ni pestaña. */}
      {conVideos && (
        <Banda id="experiencia" fondo="marca" titulo={`La experiencia Educa en ${uni.INSTNM}`}
          subtitulo="Recorre el campus y escucha a estudiantes que llegaron con Educa College Prep.">
          <VideosEduca videos={videos} />
        </Banda>
      )}

      {/* ADMISIÓN: rango SAT y política, fechas de postulación (si se cargaron) y postulantes. */}
      <Banda id="admision" fondo="blanco" titulo="Admisión" subtitulo="Qué puntaje tienen los admitidos y cuántos entran.">
        <div className="paneles">
          <Panel titulo="Política y puntajes SAT">
            <dl className="datos">
              {uni.ADM_RATE != null && (
                <div className="dato-fila">
                  <dt>Tasa de admisión<InfoTooltip texto={glosarioCampos.ADM_RATE} /></dt>
                  <dd className="numero">{formatPorcentaje(uni.ADM_RATE)}</dd>
                </div>
              )}
              {uni.ADMCON7 && (
                <div className="dato-fila">
                  <dt>Política SAT<InfoTooltip texto={glosarioCampos.ADMCON7} /></dt>
                  <dd>{uni.ADMCON7}</dd>
                </div>
              )}
            </dl>
            {(uni.SAT_AVG || uni.SATVR25 || uni.SATMT25)
              ? <div className="ficha-bloque"><RangosSAT uni={uni} /></div>
              : <p className="ayuda">Esta universidad no publica puntajes SAT de sus admitidos.</p>}
          </Panel>
          {conFechas && (
            <Panel titulo="Fechas de postulación">
              <FechasPostulacion unitid={uni.UNITID!} />
            </Panel>
          )}
          {uni.APPLCN != null && (
            <Panel titulo="Postulantes, admitidos y matriculados" ayuda={glosarioCampos.POSTULANTES}>
              <DemografiaAdmision uni={uni} soloAdmision />
            </Panel>
          )}
        </div>
      </Banda>

      {/* COSTOS Y RETORNO: costos por perfil, salarios de egresados y la calculadora. */}
      <Banda id="costos" fondo="gris" titulo="Costos y retorno" subtitulo="Cuánto cuesta un año, cuánto pagarías y cuánto ganan sus egresados.">
        <div className="panel ficha-seccion">
          <CostosFinanciamiento uni={uni} />
        </div>
        {/* El de toda la universidad y, si College Scorecard lo publica (~1,800), el de cada
            carrera. Espera a que cargue el archivo por carrera para no saltar de forma. La key
            reinicia la búsqueda al pasar a otra universidad. */}
        {conSalarios && (
          <div className="panel ficha-seccion">
            <h3 className="ficha-panel-titulo con-ayuda">Salarios de egresados<InfoTooltip texto={glosarioCampos.MD_EARN_4YR} /></h3>
            <SalarioPorCarrera key={uni.UNITID} uni={uni} carreras={salariosCarreras} />
          </div>
        )}
        {calculadora && (
          <div className="bloque-sol">
            <p>El precio de lista no es lo que pagas. <strong>Calcula tu costo real con ayuda financiera.</strong></p>
            <a className="boton-marino" href={calculadora} target="_blank" rel="noopener noreferrer">
              Calcula cuánto te costaría
              <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
            </a>
            <p className="bloque-sol-nota">{NOTA_CALCULADORA}</p>
          </div>
        )}
      </Banda>

      {/* CONTACTO */}
      <Banda id="contacto" fondo="blanco" titulo="Contacto" subtitulo="Dónde está y cómo comunicarte con la universidad.">
        <ContactoUniversidad uni={uni} />
      </Banda>

      {/* Al final, sin pestaña: para seguir explorando. */}
      {similares.length > 0 && (
        <Banda fondo="gris" titulo="Universidades similares">
          <UniversidadesSimilares uni={uni} similares={similares} onSeleccionar={onSeleccionar} />
        </Banda>
      )}
    </main>
  );
}
