import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Universidad } from '../types';
import type { SalarioCarrera } from '../utils/salariosCarreras';
import { formatDinero } from '../utils/formatters';
import { useFuentesDatos } from '../utils/fuentesDatos';
import { SINONIMOS_CARRERAS } from '../data/carrerasEspanol';

/** Cuántas carreras se ven de entrada: las mejor pagadas. El resto, con "Ver todas" o buscando. */
const VISIBLES = 5;
/** Cuántas de las que no publican salario se ven de entrada (son solo nombres, caben más). */
const VISIBLES_SIN_SALARIO = 12;

/** Palabras que se ofrecen cuando una búsqueda no encuentra nada (rellenan el buscador). */
const SUGERENCIAS = ['Computación', 'Economía', 'Ingeniería', 'Biología'];

/** Minúsculas y sin tildes: "Enfermería" se encuentra escribiendo "enfermeria". */
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Lo que se busca de cada carrera: su nombre, el de Scorecard (en inglés) y sus sinónimos. */
const textoBuscable = (c: SalarioCarrera) => normalizar(`${c.nombre} ${c.nombreIngles} ${SINONIMOS_CARRERAS[c.cip] ?? ''}`);

/**
 * Marca con <mark> lo buscado dentro del nombre. Se normaliza letra por letra para ubicar la
 * coincidencia en el nombre original, con sus tildes ("computacion" marca "computación").
 * Si lo buscado coincidió por un sinónimo y no está en el nombre, no se marca nada.
 */
function resaltar(nombre: string, buscada: string): ReactNode {
  if (!buscada) return nombre;
  const letras = [...nombre];
  let normalizado = '';
  const origen: number[] = [];
  letras.forEach((letra, i) => {
    for (const c of normalizar(letra)) { normalizado += c; origen.push(i); }
  });
  const desde = normalizado.indexOf(buscada);
  if (desde < 0) return nombre;
  const ini = origen[desde];
  const fin = origen[desde + buscada.length - 1] + 1;
  return <>{letras.slice(0, ini).join('')}<mark>{letras.slice(ini, fin).join('')}</mark>{letras.slice(fin).join('')}</>;
}

/** Cuánto sube el salario del 1.er año a los 4 años, en %; null si falta alguno de los dos. */
const crecimiento = (c: SalarioCarrera) =>
  c.unAnio && c.cuatroAnios ? Math.round((c.cuatroAnios / c.unAnio - 1) * 100) : null;

/**
 * Salarios de egresados en la ficha. Una lista numerada de carreras, de la mejor pagada a la
 * peor, con el salario al 1.er año y a los 4 años y una línea "punto a punto" que los une (hueco
 * = 1.er año, lleno = 4 años), sobre una marca con la mediana de toda la universidad. De entrada
 * se ven las 5 mejor pagadas, pero lo que importa es la carrera que le interesa a cada
 * estudiante: el buscador filtra todas mientras se escribe.
 *
 * Debajo, "Sin dato de salarios": las carreras que la universidad ofrece pero cuyo salario
 * Scorecard no publica (pocos graduados). Solo nombres: sirven para saber que la carrera está.
 */
export function SalarioPorCarrera({ uni, carreras }: { uni: Universidad; carreras: SalarioCarrera[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const [verTodasSin, setVerTodasSin] = useState(false);
  const anios = useFuentesDatos()?.scorecard.anios;
  const anio = anios?.salario_por_carrera ?? anios?.salario_4_anios;
  const prom1 = uni.MD_EARN_WNE_1YR ?? null;
  const prom4 = uni.MD_EARN_WNE_4YR ?? null;

  // Vienen ordenadas: primero las que publican salario, al final las que no (useSalariosCarreras).
  const conSalario = useMemo(() => carreras.filter(c => c.unAnio != null || c.cuatroAnios != null), [carreras]);
  const sinSalario = useMemo(() => carreras.filter(c => c.unAnio == null && c.cuatroAnios == null), [carreras]);

  const buscada = normalizar(busqueda.trim());
  const encontradas = useMemo(
    () => (buscada ? conSalario.filter(c => textoBuscable(c).includes(buscada)) : conSalario),
    [conSalario, buscada]
  );
  const encontradasSin = useMemo(
    () => (buscada ? sinSalario.filter(c => textoBuscable(c).includes(buscada)) : sinSalario),
    [sinSalario, buscada]
  );
  const visibles = buscada || verTodas ? encontradas : encontradas.slice(0, VISIBLES);
  const visiblesSin = buscada || verTodasSin ? encontradasSin : encontradasSin.slice(0, VISIBLES_SIN_SALARIO);

  // Escala común para todas las filas: el salario más alto de la universidad (o su mediana, si
  // es mayor), para que las líneas se puedan comparar entre sí.
  const maximo = Math.max(...conSalario.map(c => c.cuatroAnios ?? c.unAnio ?? 0), prom4 ?? 0);
  const pct = (v: number) => `${((v / maximo) * 100).toFixed(1)}%`;

  // "En toda la universidad, la mediana es $X al primer año y $Y a los 4 años." Es una mediana,
  // no un promedio: así lo publica College Scorecard.
  const general = prom1 != null && prom4 != null
    ? <> En toda la universidad, la mediana es <b>{formatDinero(prom1)}</b> al primer año y <b>{formatDinero(prom4)}</b> a los 4 años.</>
    : prom4 != null ? <> En toda la universidad, la mediana es <b>{formatDinero(prom4)}</b> a los 4 años.</>
    : prom1 != null ? <> En toda la universidad, la mediana es <b>{formatDinero(prom1)}</b> al primer año.</>
    : null;

  return (
    <>
      <p className="salarios-intro">
        Lo que gana al año quien se gradúa de {conSalario.length > 0 ? 'cada carrera (bachiller) en ' : ''}{uni.INSTNM}.
        {general}
      </p>

      {carreras.length > 0 ? (
        <>
          <label className="campo-etiqueta salarios-etiqueta" htmlFor="salarios-busqueda">Busca tu carrera</label>
          <div className="salarios-campo">
            <svg className="salarios-lupa" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            {/* type="text" y no "search": así no aparece la "×" del navegador junto a la nuestra. */}
            <input
              id="salarios-busqueda"
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Ej.: computación, economía, medicina…"
              autoComplete="off"
            />
            {busqueda && (
              <button type="button" className="salarios-borrar" onClick={() => setBusqueda('')} aria-label="Borrar la búsqueda">×</button>
            )}
          </div>
          <p className="salarios-estado" aria-live="polite">
            {buscada ? `${encontradas.length + encontradasSin.length} ${encontradas.length + encontradasSin.length === 1 ? 'carrera encontrada' : 'carreras encontradas'}` : ''}
          </p>

          {conSalario.length === 0 && (
            <p className="ayuda">
              College Scorecard no publica el salario de ninguna carrera de esta universidad: lo oculta
              cuando cada carrera tiene pocos graduados.
            </p>
          )}

          {visibles.length > 0 ? (
            <>
              <div className="salarios-leyenda" aria-hidden="true">
                <span><i className="ley-uno" />1.er año</span>
                <span><i className="ley-cuatro" />4 años</span>
                {prom4 != null && <span><i className="ley-mediana" />Mediana de la universidad a 4 años</span>}
              </div>

              <div className="sal-lista">
                <div className="sal-cabecera" aria-hidden="true">
                  <span /><span>Carrera</span><span>1.er año</span><span>4 años</span>
                </div>
                {visibles.map(c => {
                  // El puesto es el de la lista completa, también al buscar: "Economía, 7.ª mejor pagada".
                  const puesto = conSalario.indexOf(c) + 1;
                  const sube = crecimiento(c);
                  return (
                    <div key={c.cip} className={`sal-fila${puesto === 1 ? ' sal-fila-primera' : ''}`}>
                      <span className="sal-puesto numero">{puesto}</span>
                      <span className="sal-nombre">
                        {resaltar(c.nombre, buscada)}
                        {sube != null && (
                          <span className={`sal-crece${sube < 0 ? ' sal-crece-baja' : ''}`}>
                            {sube < 0 ? '↓' : '↑'} {Math.abs(sube)}%
                            <span className="visualmente-oculto"> {sube < 0 ? 'menos' : 'más'} del 1.er año a los 4 años</span>
                          </span>
                        )}
                        {c.graduados ? <small className="numero">{c.graduados.toLocaleString('en-US')} grad./año</small> : null}
                      </span>
                      <span className="sal-uno numero">{formatDinero(c.unAnio) ?? '—'}</span>
                      <span className="sal-cuatro numero">{formatDinero(c.cuatroAnios) ?? '—'}</span>
                      {/* Decorativa: los montos en texto ya dicen lo mismo. */}
                      <span className="sal-linea" aria-hidden="true">
                        <span className="sal-riel" />
                        {c.unAnio != null && c.cuatroAnios != null && (
                          <span className="sal-tramo" style={{ left: pct(Math.min(c.unAnio, c.cuatroAnios)), width: pct(Math.abs(c.cuatroAnios - c.unAnio)) }} />
                        )}
                        {prom4 != null && <span className="sal-mediana" style={{ left: pct(prom4) }} />}
                        {c.unAnio != null && <span className="sal-punto sal-punto-uno" style={{ left: pct(c.unAnio) }} />}
                        {c.cuatroAnios != null && <span className="sal-punto sal-punto-cuatro" style={{ left: pct(c.cuatroAnios) }} />}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : buscada && encontradasSin.length === 0 && (
            <div className="salarios-vacio">
              <p><strong>No hay datos de “{busqueda.trim()}” en {uni.INSTNM}.</strong></p>
              <p>Puede que no se ofrezca o que tenga muy pocos graduados para publicar salarios. Prueba con:</p>
              <div className="salarios-sugerencias">
                {SUGERENCIAS.map(s => (
                  <button key={s} type="button" className="boton-enlace" onClick={() => setBusqueda(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {!buscada && conSalario.length > VISIBLES && (
            <button type="button" className="boton salarios-ver" onClick={() => setVerTodas(!verTodas)}>
              {verTodas ? `Ver solo las ${VISIBLES} mejor pagadas` : `Ver las ${conSalario.length} carreras`}
            </button>
          )}

          {visiblesSin.length > 0 && (
            <div className="salarios-sin">
              <h4 className="salarios-sin-titulo">
                Sin dato de salarios <span className="salarios-sin-cuenta numero">· {encontradasSin.length} {encontradasSin.length === 1 ? 'carrera' : 'carreras'}</span>
              </h4>
              <p className="ayuda">
                {uni.INSTNM} también {encontradasSin.length === 1 ? 'ofrece esta carrera' : 'ofrece estas carreras'}, pero
                con muy pocos graduados para que College Scorecard publique cuánto ganan.
              </p>
              <ul className="salarios-sin-lista">
                {visiblesSin.map(c => <li key={c.cip}>{resaltar(c.nombre, buscada)}</li>)}
              </ul>
              {!buscada && sinSalario.length > VISIBLES_SIN_SALARIO && (
                <button type="button" className="boton-enlace salarios-ver" onClick={() => setVerTodasSin(!verTodasSin)}>
                  {verTodasSin ? 'Ver menos' : `Ver las ${sinSalario.length}`}
                </button>
              )}
            </div>
          )}
        </>
      ) : (
        <p className="ayuda">
          College Scorecard no registra las carreras de bachiller de esta universidad.
        </p>
      )}

      <p className="fuente">
        Mediana: la mitad gana más y la mitad menos. Solo cuenta a quienes trabajan y ya no estudian.
        {anio && ` Medido en ${anio.replace(/^medido en /, '')}.`}
        {' '}Fuente: College Scorecard (Departamento de Educación de EE.UU.).{conSalario.length > 0 && ' “—” = no publicado (pocos graduados).'}
      </p>
    </>
  );
}
