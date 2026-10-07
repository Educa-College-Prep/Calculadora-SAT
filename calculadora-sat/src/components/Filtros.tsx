import { useState } from 'react';
import type { ReactNode } from 'react';
import { InfoTooltip } from './InfoTooltip';
import { glosarioCampos } from '../utils/glosarioCampos';

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
  tipoUniversidad: string;
  setTipoUniversidad: (v: string) => void;
  precioMaximo: number;
  setPrecioMaximo: (v: number) => void;
}

const SAT_MIN = 200;
const SAT_MAX = 800;
const PRECIO_TOPE = 90000;

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

/**
 * Input de una sección del SAT. Deja escribir libremente y, al salir del campo,
 * ajusta el valor al rango oficial (200–800) en múltiplos de 10.
 * Vacío = sin filtrar (se guarda como 0).
 */
function InputSeccionSAT({ etiqueta, valor, setValor }: { etiqueta: string; valor: number; setValor: (v: number) => void }) {
  const [texto, setTexto] = useState(valor ? String(valor) : '');

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
  tipoUniversidad, setTipoUniversidad,
  precioMaximo, setPrecioMaximo,
}: Props) {
  const satIncompleto = (puntajeMath > 0) !== (puntajeLectura > 0);
  const sinLimitePrecio = precioMaximo >= PRECIO_TOPE;

  return (
    <aside className="hoja" aria-label="Filtros">
      <div className="hoja-cabecera">
        <h2 className="titulo-seccion">Marca tus datos</h2>
        <p className="ayuda">Los resultados cambian al instante.</p>
      </div>

      {/* PUNTAJE SAT (orden: Verbal, Math, Total) */}
      <Seccion
        titulo="Tu puntaje SAT"
        ayuda="Con ambos puntajes, se muestran las universidades cuyo SAT promedio de admitidos es igual o menor a tu total."
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

      {/* POLÍTICA Y TIPO */}
      <Seccion
        titulo="¿Piden el SAT?"
        ayuda="Obligatorio: la universidad exige el SAT para postular. Opcional: muestra las que no lo exigen, aunque igual puedes enviarlo."
      >
        <Burbujas
          nombre="politica-sat"
          valor={exigirSAT}
          onCambio={setExigirSAT}
          opciones={[
            { valor: 'todos', texto: 'No importa' },
            { valor: 'requerido', texto: 'Obligatorio' },
            { valor: 'opcional', texto: 'Opcional' },
          ]}
        />
      </Seccion>

      <Seccion titulo="Tipo de universidad" ayuda={glosarioCampos.CONTROL}>
        <Burbujas
          nombre="tipo-universidad"
          valor={tipoUniversidad}
          onCambio={setTipoUniversidad}
          opciones={[
            { valor: 'todos', texto: 'Todas' },
            { valor: 'publica', texto: 'Públicas' },
            { valor: 'privada', texto: 'Privadas' },
          ]}
        />
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
