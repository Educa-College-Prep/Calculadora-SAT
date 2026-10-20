import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { glosarioCampos } from '../utils/glosarioCampos';
import { PRIVADAS } from '../utils/tipoControl';
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
  /** Cuántos resultados hay de cada nivel (segura, buena opción, difícil); null sin puntaje. */
  conteoNiveles: Record<Nivel, number> | null;
  /** Niveles marcados; vacío = todos. */
  nivelesSAT: Nivel[];
  setNivelesSAT: (v: Nivel[]) => void;
}

const SAT_MIN = 200;
const SAT_MAX = 800;
const PRECIO_TOPE = 90000;
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
      const tope = Math.min(MARGEN_STICKY, window.innerHeight - hoja.offsetHeight - MARGEN_STICKY);
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
function Seccion({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <fieldset className="hoja-seccion">
      <legend className="hoja-titulo">
        {titulo}
        {ayuda && <InfoTooltip texto={ayuda} />}
      </legend>
      {children}
    </fieldset>
  );
}

/** Opciones como burbujas de hoja de respuestas: se "rellena" la elegida. */
function Burbujas({ nombre, valor, opciones, onCambio }: {
  nombre: string;
  valor: string;
  opciones: { valor: string; texto: string }[];
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
          <span>{o.texto}</span>
        </label>
      ))}
    </div>
  );
}

/** Casilla cuadrada (selección múltiple), con el mismo estilo de la hoja de respuestas. */
function Casilla({ marcada, parcial = false, texto, onCambio, deshabilitada = false }: {
  marcada: boolean;
  parcial?: boolean;
  texto: ReactNode;
  onCambio: () => void;
  deshabilitada?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  // "indeterminate" solo se puede poner desde JS, no como atributo.
  useEffect(() => { if (ref.current) ref.current.indeterminate = parcial; }, [parcial]);
  return (
    <label className={`burbuja burbuja-casilla${deshabilitada ? ' burbuja-deshabilitada' : ''}`}>
      <input ref={ref} type="checkbox" checked={marcada} onChange={onCambio} disabled={deshabilitada} />
      <span>{texto}</span>
    </label>
  );
}

/**
 * Públicas y privadas se pueden combinar. Al marcar "Privadas" aparecen sus dos
 * subtipos (sin y con fines de lucro), que se pueden desmarcar por separado.
 */
function TiposUniversidad({ tipos, setTipos }: { tipos: TipoControl[]; setTipos: (v: TipoControl[]) => void }) {
  const tiene = (t: TipoControl) => tipos.includes(t);
  const alternar = (t: TipoControl) => setTipos(tiene(t) ? tipos.filter(x => x !== t) : [...tipos, t]);
  const privadasMarcadas = PRIVADAS.filter(tiene).length;
  const alternarPrivadas = () => setTipos(
    privadasMarcadas === PRIVADAS.length
      ? tipos.filter(t => !PRIVADAS.includes(t))
      : [...tipos.filter(t => !PRIVADAS.includes(t)), ...PRIVADAS]
  );

  return (
    <div className="burbujas">
      <Casilla marcada={tiene('publica')} texto="Públicas" onCambio={() => alternar('publica')} />
      <Casilla
        marcada={privadasMarcadas === PRIVADAS.length}
        parcial={privadasMarcadas === 1}
        texto="Privadas"
        onCambio={alternarPrivadas}
      />
      {privadasMarcadas > 0 && (
        <div className="casillas-anidadas">
          <Casilla marcada={tiene('sin-fines')} texto="Sin fines de lucro" onCambio={() => alternar('sin-fines')} />
          <Casilla marcada={tiene('con-fines')} texto="Con fines de lucro" onCambio={() => alternar('con-fines')} />
        </div>
      )}
      {tipos.length === 0 && <p className="ayuda">Sin marcar, se muestran todas.</p>}
    </div>
  );
}

/**
 * Input de una sección del SAT. Deja escribir libremente y, al salir del campo,
 * ajusta el valor al rango oficial (200–800) en múltiplos de 10.
 * Vacío = sin filtrar (se guarda como 0).
 */
function InputSeccionSAT({ etiqueta, valor, setValor }: { etiqueta: string; valor: number; setValor: (v: number) => void }) {
  const [texto, setTexto] = useState(valor ? String(valor) : '');

  // Si el valor cambia desde fuera (el asistente aplica filtros o "Limpiar filtros"), se refleja en el campo.
  const [valorPrevio, setValorPrevio] = useState(valor);
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor ? String(valor) : '');
  }

  const numero = Number(texto);
  const fueraDeRango = texto !== '' && (numero < SAT_MIN || numero > SAT_MAX);
  const idError = `error-${etiqueta.toLowerCase()}`;

  const confirmar = () => {
    if (texto === '') {
      setValor(0);
      return;
    }
    const ajustado = Math.min(SAT_MAX, Math.max(SAT_MIN, Math.round(numero / 10) * 10));
    setTexto(String(ajustado));
    setValor(ajustado);
  };

  return (
    <label className="casilla-sat">
      <span className="casilla-etiqueta">{etiqueta}</span>
      <input
        type="number"
        inputMode="numeric"
        min={SAT_MIN}
        max={SAT_MAX}
        step={10}
        placeholder="—"
        value={texto}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
        aria-invalid={fueraDeRango}
        aria-describedby={fueraDeRango ? idError : undefined}
      />
      <span className="casilla-escala">de {SAT_MIN} a {SAT_MAX}</span>
      {fueraDeRango && (
        <span id={idError} className="casilla-error">Debe estar entre {SAT_MIN} y {SAT_MAX}.</span>
      )}
    </label>
  );
}

export function Filtros({
  estadoSeleccionado, setEstadoSeleccionado,
  ciudadSeleccionada, setCiudadSeleccionada,
  estadosUnicos, ciudadesUnicas,
  nombresEstados,
  puntajeMath, setPuntajeMath,
  puntajeLectura, setPuntajeLectura,
  puntajeTotal,
  exigirSAT, setExigirSAT,
  tiposUniversidad, setTiposUniversidad,
  precioMaximo, setPrecioMaximo,
  filtrosActivos, onLimpiar,
  conteoNiveles,
  nivelesSAT, setNivelesSAT,
}: Props) {
  const satIncompleto = (puntajeMath > 0) !== (puntajeLectura > 0);
  const sinLimitePrecio = precioMaximo >= PRECIO_TOPE;
  const hojaRef = useTopeSticky();

  return (
    <aside ref={hojaRef} className="hoja" aria-label="Filtros">
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
        ) : (
          <p className="ayuda">También puedes elegir un estado en el mapa.</p>
        )}
      </Seccion>

      {/* PUNTAJE SAT (orden: Verbal, Math, Total) */}
      <Seccion
        titulo="Tu puntaje SAT"
        ayuda="Con ambos puntajes se compara tu total con el de los admitidos de cada universidad. Se ocultan solo las que están muy por encima de tu puntaje (más de 100 puntos bajo el 25% de sus admitidos)."
      >
        <div className="casillas-sat">
          <InputSeccionSAT etiqueta="Verbal" valor={puntajeLectura} setValor={setPuntajeLectura} />
          <InputSeccionSAT etiqueta="Math" valor={puntajeMath} setValor={setPuntajeMath} />
        </div>
        <div className={`total-sat${puntajeTotal > 0 ? ' total-sat-listo' : ''}`}>
          <span>Total</span>
          <strong className="numero">{puntajeTotal > 0 ? puntajeTotal : '—'}</strong>
          <span className="total-sat-escala">/ 1600</span>
        </div>
        {satIncompleto && <p className="ayuda ayuda-aviso">Ingresa ambos puntajes para filtrar.</p>}

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

      {/* POLÍTICA Y TIPO */}
      <Seccion titulo="¿Piden el SAT?" ayuda={glosarioCampos.ADMCON7}>
        <Burbujas
          nombre="politica-sat"
          valor={exigirSAT}
          onCambio={setExigirSAT}
          opciones={[
            { valor: 'todos', texto: 'Todos' },
            { valor: 'requerido', texto: 'Obligatorio' },
            { valor: 'opcional', texto: 'Opcional' },
            { valor: 'no-considera', texto: 'No lo toman en cuenta' },
          ]}
        />
        <p className="ayuda politica-explicacion">{EXPLICACION_POLITICA[exigirSAT]}</p>
      </Seccion>

      <Seccion titulo="Tipo de universidad" ayuda={glosarioCampos.CONTROL}>
        <TiposUniversidad tipos={tiposUniversidad} setTipos={setTiposUniversidad} />
      </Seccion>

      {/* MATRÍCULA */}
      <Seccion
        titulo="Matrícula máxima al año"
        ayuda="Se compara con la matrícula para alumnos de otros estados y del extranjero (out-of-state), que es la que pagarías como estudiante internacional."
      >
        <p className="precio-valor numero">
          {sinLimitePrecio ? 'Sin límite' : <>Hasta <strong>${precioMaximo.toLocaleString()}</strong> USD</>}
        </p>
        <input
          type="range" min="1000" max={PRECIO_TOPE} step="1000" value={precioMaximo}
          onChange={(e) => setPrecioMaximo(Number(e.target.value))}
          className="deslizador"
          aria-label="Matrícula máxima al año en dólares"
          aria-valuetext={sinLimitePrecio ? 'Sin límite' : `${precioMaximo} dólares`}
        />
        <div className="deslizador-escala numero" aria-hidden="true">
          <span>$1k</span>
          <span>$90k o más</span>
        </div>
      </Seccion>
    </aside>
  );
}
