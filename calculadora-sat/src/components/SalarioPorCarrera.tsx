import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Universidad } from '../types';
import type { SalarioCarrera } from '../utils/salariosCarreras';
import { formatDinero } from '../utils/formatters';
import { useFuentesDatos } from '../utils/fuentesDatos';
import { SINONIMOS_CARRERAS } from '../data/carrerasEspanol';

/** Cuántas carreras se ven de entrada: las mejor pagadas. El resto, con "Ver todas" o buscando. */
const VISIBLES = 5;

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
 */
export function SalarioPorCarrera({ uni, carreras }: { uni: Universidad; carreras: SalarioCarrera[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const anios = useFuentesDatos()?.scorecard.anios;
  const anio = anios?.salario_por_carrera ?? anios?.salario_4_anios;
  const prom1 = uni.MD_EARN_WNE_1YR ?? null;
  const prom4 = uni.MD_EARN_WNE_4YR ?? null;

  const buscada = normalizar(busqueda.trim());
  const encontradas = useMemo(
    () => (buscada ? carreras.filter(c => textoBuscable(c).includes(buscada)) : carreras),
    [carreras, buscada]
  );
  const visibles = buscada || verTodas ? encontradas : encontradas.slice(0, VISIBLES);

  // Escala común para todas las filas: el salario más alto de la universidad (o su mediana, si
  // es mayor), para que las líneas se puedan comparar entre sí.
  const maximo = Math.max(...carreras.map(c => c.cuatroAnios ?? c.unAnio ?? 0), prom4 ?? 0);
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
        Lo que gana al año quien se gradúa de {carreras.length > 0 ? 'cada carrera (bachiller) en ' : ''}{uni.INSTNM}.
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
            {buscada ? `${encontradas.length} ${encontradas.length === 1 ? 'carrera encontrada' : 'carreras encontradas'}` : ''}
          </p>

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
                  const puesto = carreras.indexOf(c) + 1;
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
          ) : (
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

          {!buscada && carreras.length > VISIBLES && (
            <button type="button" className="boton salarios-ver" onClick={() => setVerTodas(!verTodas)}>
              {verTodas ? `Ver solo las ${VISIBLES} mejor pagadas` : `Ver las ${carreras.length} carreras`}
            </button>
          )}
        </>
      ) : (
        <p className="ayuda">
          College Scorecard no publica el salario por carrera de esta universidad: lo oculta cuando
          cada carrera tiene pocos graduados.
        </p>
      )}

      <p className="fuente">
        Mediana: la mitad gana más y la mitad menos. Solo cuenta a quienes trabajan y ya no estudian.
        {anio && ` Medido en ${anio.replace(/^medido en /, '')}.`}
        {' '}Fuente: College Scorecard (Departamento de Educación de EE.UU.).{carreras.length > 0 && ' “—” = no publicado (pocos graduados).'}
      </p>
    </>
  );
}
