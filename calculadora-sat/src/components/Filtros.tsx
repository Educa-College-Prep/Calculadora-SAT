import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { glosarioCampos } from '../utils/glosarioCampos';
import type { TipoControl } from '../utils/tipoControl';
import { NIVELES, AYUDA_NIVELES } from '../utils/nivelSAT';
import type { Nivel } from '../utils/nivelSAT';

/** Qué significa cada opción de "¿Piden el SAT?", para que no se confundan opcional y no considerado. */
const EXPLICACION_POLITICA: Record<string, string> = {
  todos: 'Muestra todas, pidan o no el SAT.',
  requerido: 'Tienes que enviar tu puntaje SAT (o ACT) para postular.',
  opcional: 'No es obligatorio, pero si lo envías lo toman en cuenta: un buen puntaje suma.',
  'no-considera': 'No lo piden y no lo miran aunque lo envíes: deciden con tus notas, ensayos y actividades.',
};

interface Props {
  // Ubicación
  estadoSeleccionado: string;
  setEstadoSeleccionado: (v: string) => void;
  ciudadSeleccionada: string;
  setCiudadSeleccionada: (v: string) => void;
  estadosUnicos: string[];
  ciudadesUnicas: string[];
  nombresEstados: Record<string, string>;
  // SAT (0 = vacío, sin filtrar)
  puntajeMath: number;
  setPuntajeMath: (v: number) => void;
  puntajeLectura: number;
  setPuntajeLectura: (v: number) => void;
  /** Total escrito a mano (sin secciones); 0 = vacío. */
  puntajeSoloTotal: number;
  setPuntajeSoloTotal: (v: number) => void;
  puntajeTotal: number;
  // Adicionales
  exigirSAT: string;
  setExigirSAT: (v: string) => void;
  tiposUniversidad: TipoControl[];
  setTiposUniversidad: (v: TipoControl[]) => void;
  precioMaximo: number;
  setPrecioMaximo: (v: number) => void;
  // Limpiar
  /** Nombres de los filtros activos; el botón "Limpiar" muestra cuántos son y cuáles. */
  filtrosActivos: readonly string[];
  onLimpiar: () => void;
  /** Cuántos resultados hay de cada nivel (alta probabilidad, intermedia, baja); null sin puntaje. */
  conteoNiveles: Record<Nivel, number> | null;
  /** Cuántos resultados quedarían con cada opción de "¿Piden el SAT?", con los demás filtros aplicados. */
  conteoPolitica: Record<string, number>;
  /** Niveles marcados; vacío = todos. */
  nivelesSAT: Nivel[];
  setNivelesSAT: (v: Nivel[]) => void;
  /** En celular el mapa va en una capa aparte: esto la abre. undefined en pantallas anchas. */
  onAbrirMapa?: () => void;
}

const SAT_MIN = 200;
const SAT_MAX = 800;
const TOTAL_MIN = 400;
const TOTAL_MAX = 1600;

/** Redondea al múltiplo de 10 más cercano: el SAT se califica de 10 en 10. */
const aDecena = (n: number) => Math.round(n / 10) * 10;

/**
 * Por qué un puntaje de sección no vale, dicho como lo pensaría el estudiante. Si el número
 * cabe como total (810–1600), lo más probable es que haya escrito su total en una sección:
 * se devuelve ese total para ofrecer usarlo. Con 2 dígitos (65), lo más probable es que le
 * faltó un cero (650).
 */
function problemaSeccion(n: number): { texto: string; total?: number } | null {
  if (n >= SAT_MIN && n <= SAT_MAX) return null;
  if (n > SAT_MAX && n <= TOTAL_MAX) return { texto: 'Cada sección llega hasta 800.', total: aDecena(n) };
  if (n > TOTAL_MAX) return { texto: 'El SAT llega hasta 800 por sección y 1600 en total.' };
  if (n >= 20 && n <= 80) return { texto: `Cada sección va de 200 a 800. ¿Quisiste poner ${n * 10}?` };
  return { texto: 'Cada sección va de 200 a 800.' };
}

/** Lo mismo para el total escrito a mano. */
function problemaTotal(n: number): string | null {
  if (n >= TOTAL_MIN && n <= TOTAL_MAX) return null;
  if (n > TOTAL_MAX) return 'El total llega hasta 1600.';
  if (n >= SAT_MIN) return 'El total va de 400 a 1600. Si es el puntaje de una sola sección, escríbelo arriba.';
  return 'El total va de 400 a 1600.';
}
const PRECIO_TOPE = 100000;
const MARGEN_STICKY = 16;

/**
 * Calcula dónde se "pega" la hoja al hacer scroll. Si cabe en la pantalla, arriba
 * (16px). Si es más alta, con un tope negativo: se pega cuando su borde inferior
 * llega al final de la pantalla, así se ve completa.
 */
function useTopeSticky() {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const hoja = ref.current;
    if (!hoja) return;
    const actualizar = () => {
      // La barra de Educa queda fija arriba: la hoja se pega justo debajo de ella.
      const barra = document.getElementById('barra')?.offsetHeight ?? 0;
      const tope = barra + Math.min(MARGEN_STICKY, window.innerHeight - barra - hoja.offsetHeight - MARGEN_STICKY);
      hoja.style.setProperty('--hoja-tope', `${tope}px`);
    };
    actualizar();
    // La altura cambia, por ejemplo, al aparecer el botón "Ver todo el país".
    const observador = new ResizeObserver(actualizar);
    observador.observe(hoja);
    window.addEventListener('resize', actualizar);
    return () => {
      observador.disconnect();
      window.removeEventListener('resize', actualizar);
    };
  }, []);
  return ref;
}

/** Bloque de la hoja: título con tooltip opcional y su contenido. */
function Seccion({ titulo, ayuda, clase, children }: { titulo: string; ayuda?: string; clase?: string; children: ReactNode }) {
  return (
    <fieldset className={`hoja-seccion${clase ? ` ${clase}` : ''}`}>
      <legend className="hoja-titulo">
        {titulo}
        {ayuda && <InfoTooltip texto={ayuda} />}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Opciones como burbujas de hoja de respuestas: se "rellena" la elegida. `cuenta`: cuántos
 * resultados quedarían al elegirla.
 */
function Burbujas({ nombre, valor, opciones, onCambio }: {
  nombre: string;
  valor: string;
  opciones: { valor: string; texto: string; cuenta?: number }[];
  onCambio: (v: string) => void;
}) {
  return (
    <div className="burbujas">
      {opciones.map((o) => (
        <label key={o.valor} className="burbuja">
          <input
            type="radio"
            name={nombre}
            value={o.valor}
            checked={valor === o.valor}
            onChange={() => onCambio(o.valor)}
          />
          <span>
            {o.texto}
            {o.cuenta != null && <span className="nivel-opcion-cuenta numero">{o.cuenta.toLocaleString('en-US')}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Casilla cuadrada (selección múltiple), con el mismo estilo de la hoja de respuestas. */
function Casilla({ marcada, texto, onCambio, deshabilitada = false }: {
  marcada: boolean;
  texto: ReactNode;
  onCambio: () => void;
  deshabilitada?: boolean;
}) {
  return (
    <label className={`burbuja burbuja-casilla${deshabilitada ? ' burbuja-deshabilitada' : ''}`}>
      <input type="checkbox" checked={marcada} onChange={onCambio} disabled={deshabilitada} />
      <span>{texto}</span>
    </label>
  );
}

/**
 * Públicas y privadas se pueden combinar. Al marcar "Privadas" se aclara que son solo las
 * sin fines de lucro: las con fines de lucro no están en la web.
 */
function TiposUniversidad({ tipos, setTipos }: { tipos: TipoControl[]; setTipos: (v: TipoControl[]) => void }) {
  const tiene = (t: TipoControl) => tipos.includes(t);
  const alternar = (t: TipoControl) => setTipos(tiene(t) ? tipos.filter(x => x !== t) : [...tipos, t]);

  return (
    <div className="burbujas">
      <Casilla marcada={tiene('publica')} texto="Públicas" onCambio={() => alternar('publica')} />
      <Casilla marcada={tiene('privada')} texto="Privadas" onCambio={() => alternar('privada')} />
      {tiene('privada') && (
        <p className="ayuda">Solo consideramos privadas <strong>sin fines de lucro</strong>.</p>
      )}
      {tipos.length === 0 && <p className="ayuda">Sin marcar, se muestran todas.</p>}
    </div>
  );
}

/**
 * Input de una sección del SAT. Deja escribir libremente (hasta 4 dígitos, por si alguien
 * pone su total aquí) y, al salir del campo, guarda el valor redondeado a la decena si está
 * entre 200 y 800. Si no, no filtra y explica qué pasó; si el número parece un total, ofrece
 * usarlo como total. Vacío = sin filtrar (se guarda como 0).
 */
function InputSeccionSAT({ id, etiqueta, valor, setValor, onUsarComoTotal }: {
  id: string;
  etiqueta: string;
  valor: number;
  setValor: (v: number) => void;
  onUsarComoTotal: (total: number) => void;
}) {
  const [texto, setTexto] = useState(valor ? String(valor) : '');
  // El "muy bajo" se avisa recién al salir del campo: mientras se escribe "650", el "6" no es un error.
  const [salio, setSalio] = useState(false);

  // Si el valor cambia desde fuera ("Limpiar filtros", usar el total), se refleja en el campo.
  const [valorPrevio, setValorPrevio] = useState(valor);
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor ? String(valor) : '');
  }

  const numero = Number(texto);
  const problema = texto === '' ? null : problemaSeccion(numero);
  const mostrarProblema = problema && (salio || numero > SAT_MAX);
  const idProblema = `${id}-problema`;

  const confirmar = () => {
    setSalio(true);
    if (texto === '' || problema) {
      setValor(0);
      return;
    }
    const redondeado = aDecena(numero);
    setTexto(String(redondeado));
    setValor(redondeado);
  };

  return (
    <div className="casilla-sat">
      <label className="casilla-etiqueta" htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="—"
        value={texto}
        onChange={(e) => { setTexto(e.target.value.replace(/\D/g, '').slice(0, 4)); setSalio(false); }}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
        aria-invalid={!!mostrarProblema}
        aria-describedby={mostrarProblema ? idProblema : undefined}
      />
      <span className="casilla-escala">de {SAT_MIN} a {SAT_MAX}</span>
      <span id={idProblema} className="casilla-error" aria-live="polite">
        {mostrarProblema && (
          <>
            {problema.texto}
            {problema.total != null && (
              // onMouseDown: así el clic no dispara antes el blur del campo, que borraría el error.
              <button type="button" className="casilla-sugerencia" onMouseDown={(e) => e.preventDefault()}
                onClick={() => onUsarComoTotal(problema.total!)}>
                ¿Es tu total? Usar {problema.total} como total
              </button>
            )}
          </>
        )}
      </span>
    </div>
  );
}

/**
 * Total del SAT. Con las dos secciones se calcula solo; sin ellas se puede escribir directo,
 * para quien solo recuerda su total. Escribir aquí borra las secciones: el total manda.
 */
function InputTotalSAT({ total, setSoloTotal, onEscribir }: {
  total: number;
  setSoloTotal: (v: number) => void;
  onEscribir: () => void;
}) {
  const [texto, setTexto] = useState(total ? String(total) : '');
  const [salio, setSalio] = useState(false);
  // Mientras se escribe aquí no se pisa el texto: el primer dígito borra las secciones y el
  // total de afuera cambia, pero lo que el estudiante está escribiendo se queda.
  const [editando, setEditando] = useState(false);
  const [totalPrevio, setTotalPrevio] = useState(total);
  if (total !== totalPrevio) {
    setTotalPrevio(total);
    if (!editando) setTexto(total ? String(total) : '');
  }

  const problema = texto === '' ? null : problemaTotal(Number(texto));
  const mostrarProblema = problema && (salio || Number(texto) > TOTAL_MAX);

  const confirmar = () => {
    setSalio(true);
    if (texto === '' || problema) {
      setSoloTotal(0);
      return;
    }
    const redondeado = aDecena(Number(texto));
    setTexto(String(redondeado));
    setSoloTotal(redondeado);
  };

  return (
    <>
      <div className={`total-sat${total > 0 ? ' total-sat-listo' : ''}${mostrarProblema ? ' total-sat-error' : ''}`}>
        <label htmlFor="sat-total">Total</label>
        <input
          id="sat-total"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="—"
          value={texto}
          onChange={(e) => { setTexto(e.target.value.replace(/\D/g, '').slice(0, 4)); setSalio(false); onEscribir(); }}
          onFocus={() => setEditando(true)}
          onBlur={() => { setEditando(false); confirmar(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
          aria-invalid={!!mostrarProblema}
          aria-describedby={mostrarProblema ? 'sat-total-problema' : undefined}
        />
        <span className="total-sat-escala">/ 1600</span>
      </div>
      <p id="sat-total-problema" className="casilla-error" aria-live="polite">{mostrarProblema ? problema : ''}</p>
    </>
  );
}

export function Filtros({
  estadoSeleccionado, setEstadoSeleccionado,
  ciudadSeleccionada, setCiudadSeleccionada,
  estadosUnicos, ciudadesUnicas,
  nombresEstados,
  puntajeMath, setPuntajeMath,
  puntajeLectura, setPuntajeLectura,
  puntajeSoloTotal, setPuntajeSoloTotal,
  puntajeTotal,
  exigirSAT, setExigirSAT,
  tiposUniversidad, setTiposUniversidad,
  precioMaximo, setPrecioMaximo,
  filtrosActivos, onLimpiar,
  conteoNiveles,
  conteoPolitica,
  nivelesSAT, setNivelesSAT,
  onAbrirMapa,
}: Props) {
  // En celular, la hoja muestra solo el puntaje SAT; el resto se despliega con "Más filtros"
  // (en pantallas anchas siempre se ve todo: el CSS ignora esto).
  const [plegada, setPlegada] = useState(true);
  const otrosActivos = filtrosActivos.filter(f => f !== 'puntaje SAT' && !f.startsWith('búsqueda')).length;
  // Con una sola sección y sin total escrito no se puede filtrar: se dice cuál falta.
  const satFalta = puntajeSoloTotal > 0 || (puntajeMath > 0) === (puntajeLectura > 0)
    ? null : puntajeMath > 0 ? 'Lectura y Escritura' : 'Matemáticas';
  // Escribir el total a mano borra las secciones; la "key" vuelve a montar sus campos vacíos
  // (si una tenía un número inválido sin guardar, su valor ya era 0 y no se borraría solo).
  const [reinicioSecciones, setReinicioSecciones] = useState(0);
  const borrarSecciones = () => {
    if (puntajeMath === 0 && puntajeLectura === 0) return;
    setPuntajeMath(0);
    setPuntajeLectura(0);
    setReinicioSecciones(n => n + 1);
  };
  const usarComoTotal = (total: number) => {
    setPuntajeMath(0);
    setPuntajeLectura(0);
    setReinicioSecciones(n => n + 1);
    setPuntajeSoloTotal(total);
  };
  // Al escribir una sección, el total escrito a mano deja de valer: manda la suma.
  // (Solo si la sección tiene un número: pasar con Tab por una sección vacía no lo borra.)
  const conSeccion = (setSeccion: (v: number) => void) => (v: number) => {
    setSeccion(v);
    if (v > 0 && puntajeSoloTotal > 0) setPuntajeSoloTotal(0);
  };
  const sinLimitePrecio = precioMaximo >= PRECIO_TOPE;
  const hojaRef = useTopeSticky();

  return (
    <aside ref={hojaRef} className={`hoja${plegada ? ' hoja-plegada' : ''}`} aria-label="Filtros">
      <div className="hoja-cabecera">
        <div className="hoja-cabecera-fila">
          <h2 className="titulo-seccion">Marca tus datos</h2>
          {filtrosActivos.length > 0 && (
            <button
              type="button"
              className="boton-limpiar"
              onClick={onLimpiar}
              title={`Quita: ${filtrosActivos.join(', ')}`}
              aria-label={`Limpiar ${filtrosActivos.length} ${filtrosActivos.length === 1 ? 'filtro' : 'filtros'}: ${filtrosActivos.join(', ')}`}
            >
              Limpiar ({filtrosActivos.length})
            </button>
          )}
        </div>
        <p className="ayuda">Los resultados cambian al instante.</p>
      </div>

      {/* UBICACIÓN */}
      <Seccion titulo="Dónde quieres estudiar">
        <label className="campo">
          <span className="campo-etiqueta">Estado</span>
          <select
            value={estadoSeleccionado}
            onChange={(e) => {
              setEstadoSeleccionado(e.target.value);
              setCiudadSeleccionada('todas');
            }}
          >
            <option value="todos">Todos los estados</option>
            {estadosUnicos.map(estado => (
              <option key={estado} value={estado}>{nombresEstados[estado] ?? estado}</option>
            ))}
          </select>
        </label>

        <label className="campo">
          <span className="campo-etiqueta">Ciudad</span>
          <select
            value={ciudadSeleccionada}
            onChange={(e) => setCiudadSeleccionada(e.target.value)}
            disabled={estadoSeleccionado === 'todos'}
          >
            <option value="todas">{estadoSeleccionado === 'todos' ? 'Elige un estado primero' : 'Todas las ciudades'}</option>
            {ciudadesUnicas.map(ciudad => (
              <option key={ciudad} value={ciudad}>{ciudad}</option>
            ))}
          </select>
        </label>

        {estadoSeleccionado !== 'todos' ? (
          <button
            type="button"
            className="boton boton-ancho"
            onClick={() => { setEstadoSeleccionado('todos'); setCiudadSeleccionada('todas'); }}
          >
            Ver todo el país
          </button>
        ) : onAbrirMapa ? (
          <button type="button" className="boton boton-ancho" onClick={onAbrirMapa}>Elegir en el mapa</button>
        ) : (
          <p className="ayuda">También puedes elegir un estado en el mapa.</p>
        )}
      </Seccion>

      {/* PUNTAJE SAT (orden: Lectura y Escritura, Matemáticas, Total). Se puede llenar con las dos
          secciones o solo con el total. */}
      <Seccion
        clase="hoja-seccion-sat"
        titulo="Tu puntaje SAT"
        ayuda="Escribe tus dos secciones o solo tu total. Se compara tu total con el de los admitidos de cada universidad. Se ocultan solo las que están muy por encima de tu puntaje (más de 100 puntos bajo el 25% de sus admitidos)."
      >
        <div className="casillas-sat">
          <InputSeccionSAT key={`lectura-${reinicioSecciones}`} id="sat-lectura" etiqueta="Lectura y Escritura"
            valor={puntajeLectura} setValor={conSeccion(setPuntajeLectura)} onUsarComoTotal={usarComoTotal} />
          <InputSeccionSAT key={`math-${reinicioSecciones}`} id="sat-math" etiqueta="Matemáticas"
            valor={puntajeMath} setValor={conSeccion(setPuntajeMath)} onUsarComoTotal={usarComoTotal} />
        </div>
        <InputTotalSAT total={puntajeTotal} setSoloTotal={setPuntajeSoloTotal} onEscribir={borrarSecciones} />
        {satFalta && (
          <p className="ayuda ayuda-aviso">Falta tu puntaje de {satFalta}, o escribe solo tu total.</p>
        )}

      </Seccion>

      {/* Solo en celular (ver CSS): abre o cierra los demás filtros, justo debajo del puntaje. */}
      <button type="button" className="boton boton-ancho hoja-mas-filtros" aria-expanded={!plegada}
        onClick={() => setPlegada(!plegada)}>
        {plegada ? `Más filtros${otrosActivos > 0 ? ` (${otrosActivos} activo${otrosActivos === 1 ? '' : 's'})` : ''}` : 'Menos filtros'}
      </button>

      {/* POLÍTICA SAT: junto al puntaje, porque es lo siguiente que se pregunta quien da el SAT. */}
      <Seccion titulo="¿Piden el SAT?" ayuda={glosarioCampos.ADMCON7}>
        <Burbujas
          nombre="politica-sat"
          valor={exigirSAT}
          onCambio={setExigirSAT}
          opciones={[
            { valor: 'todos', texto: 'Todos', cuenta: conteoPolitica.todos },
            { valor: 'requerido', texto: 'Obligatorio', cuenta: conteoPolitica.requerido },
            { valor: 'opcional', texto: 'Opcional', cuenta: conteoPolitica.opcional },
            { valor: 'no-considera', texto: 'No lo toman en cuenta', cuenta: conteoPolitica['no-considera'] },
          ]}
        />
        <p className="ayuda politica-explicacion">{EXPLICACION_POLITICA[exigirSAT]}</p>
      </Seccion>

      {/* Se marcan una o varias; sin marcar, se muestran todas. Solo con puntaje,
          porque sin él no hay con qué comparar. */}
      <Seccion titulo="Tus posibilidades de entrar" ayuda={AYUDA_NIVELES}>
        <div className="burbujas">
          {NIVELES.map(({ nivel }) => (
            <Casilla
              key={nivel}
              marcada={!!conteoNiveles && nivelesSAT.includes(nivel)}
              deshabilitada={!conteoNiveles}
              onCambio={() => setNivelesSAT(nivelesSAT.includes(nivel) ? nivelesSAT.filter(n => n !== nivel) : [...nivelesSAT, nivel])}
              texto={
                <>
                  {nivel}
                  {conteoNiveles && <span className="nivel-opcion-cuenta numero">{conteoNiveles[nivel].toLocaleString('en-US')}</span>}
                </>
              }
            />
          ))}
        </div>
        <p className="ayuda">
          {conteoNiveles ? 'Sin marcar, se muestran todas.' : 'Pon tu puntaje SAT para ver en cuáles tienes más posibilidades de entrar.'}
        </p>
      </Seccion>

      {/* TIPO */}
      <Seccion titulo="Tipo de universidad" ayuda={glosarioCampos.CONTROL}>
        <TiposUniversidad tipos={tiposUniversidad} setTipos={setTiposUniversidad} />
      </Seccion>

      {/* MATRÍCULA */}
      <Seccion
        titulo="Costo máximo al año"
        ayuda="Lo que costaría un año completo: matrícula para alumnos de otros estados y del extranjero (out-of-state, la que pagarías como internacional) más vivienda, comida y libros. Es el mismo costo anual total de cada ficha, antes de becas."
      >
        <p className="precio-valor numero">
          {sinLimitePrecio ? 'Sin límite' : <>Hasta <strong>${precioMaximo.toLocaleString()}</strong> USD</>}
        </p>
        <input
          type="range" min="5000" max={PRECIO_TOPE} step="1000" value={precioMaximo}
          onChange={(e) => setPrecioMaximo(Number(e.target.value))}
          className="deslizador"
          aria-label="Costo máximo al año en dólares"
          aria-valuetext={sinLimitePrecio ? 'Sin límite' : `${precioMaximo} dólares`}
        />
        <div className="deslizador-escala numero" aria-hidden="true">
          <span>$5k</span>
          <span>$100k o más</span>
        </div>
      </Seccion>
    </aside>
  );
}
