import { useState } from 'react';
import type { CSSProperties } from 'react';

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

// Mismo estilo para todos los títulos de sección del sidebar.
const estiloSeccion: CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: '11px',
  display: 'block',
  marginBottom: '8px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
};

const estiloCampo: CSSProperties = {
  display: 'block',
  fontSize: '13px',
  marginBottom: '4px',
};

const estiloAyuda: CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  margin: '4px 0 0 0',
  lineHeight: 1.4,
};

function Separador() {
  return <div style={{ height: '1px', background: 'var(--border-subtle)' }} />;
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
    <div style={{ marginBottom: '10px' }}>
      <label style={estiloCampo}>{etiqueta}</label>
      <input
        type="number"
        inputMode="numeric"
        min={SAT_MIN}
        max={SAT_MAX}
        step={10}
        placeholder={`${SAT_MIN} – ${SAT_MAX}`}
        value={texto}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, '').slice(0, 3))}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); }}
        style={fueraDeRango ? { borderColor: '#dc2626' } : undefined}
      />
      {fueraDeRango && (
        <p style={{ ...estiloAyuda, color: '#dc2626' }}>Debe estar entre {SAT_MIN} y {SAT_MAX}.</p>
      )}
    </div>
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* UBICACIÓN */}
      <div>
        <span style={estiloSeccion}>Ubicación</span>
        <label style={estiloCampo}>Estado</label>
        <select
          value={estadoSeleccionado}
          onChange={(e) => {
            setEstadoSeleccionado(e.target.value);
            setCiudadSeleccionada('todas');
          }}
          style={{ marginBottom: '10px' }}
        >
          <option value="todos">Todos los estados</option>
          {estadosUnicos.map(estado => (
            <option key={estado} value={estado}>{nombresEstados[estado] ?? estado}</option>
          ))}
        </select>

        <label style={estiloCampo}>Ciudad</label>
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

        {estadoSeleccionado !== 'todos' && (
          <button
            className="btn-saas-secondary"
            style={{ width: '100%', marginTop: '10px', padding: '6px', fontSize: '12px' }}
            onClick={() => { setEstadoSeleccionado('todos'); setCiudadSeleccionada('todas'); }}
          >
            Ver todo el país
          </button>
        )}
        <p style={estiloAyuda}>También puedes hacer clic en el mapa para filtrar.</p>
      </div>

      <Separador />

      {/* PUNTAJE SAT (orden: Verbal, Math, Total) */}
      <div>
        <span style={estiloSeccion}>Tu puntaje SAT</span>
        <InputSeccionSAT etiqueta="Verbal" valor={puntajeLectura} setValor={setPuntajeLectura} />
        <InputSeccionSAT etiqueta="Math" valor={puntajeMath} setValor={setPuntajeMath} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: '13px' }}>
          <span>Total</span>
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{puntajeTotal > 0 ? `${puntajeTotal} pts` : '—'}</strong>
        </div>
        <p style={estiloAyuda}>
          {satIncompleto
            ? 'Ingresa ambos puntajes para filtrar.'
            : 'Muestra universidades cuyo promedio SAT es igual o menor a tu total.'}
        </p>
      </div>

      <Separador />

      {/* POLÍTICA Y TIPO */}
      <div>
        <span style={estiloSeccion}>Admisión e institución</span>
        <label style={estiloCampo}>Política SAT</label>
        <select value={exigirSAT} onChange={(e) => setExigirSAT(e.target.value)} style={{ marginBottom: '10px' }}>
          <option value="todos">Cualquiera</option>
          <option value="requerido">SAT obligatorio</option>
          <option value="opcional">SAT opcional</option>
        </select>

        <label style={estiloCampo}>Tipo de institución</label>
        <select value={tipoUniversidad} onChange={(e) => setTipoUniversidad(e.target.value)}>
          <option value="todos">Públicas y privadas</option>
          <option value="publica">Solo públicas</option>
          <option value="privada">Solo privadas</option>
        </select>
      </div>

      <Separador />

      {/* MATRÍCULA */}
      <div>
        <span style={estiloSeccion}>Matrícula máxima anual</span>
        <div style={{ fontSize: '13px' }}>
          Hasta <strong>${precioMaximo.toLocaleString()} USD</strong>
        </div>
        <input
          type="range" min="1000" max="90000" step="1000" value={precioMaximo}
          onChange={(e) => setPrecioMaximo(Number(e.target.value))}
          style={{ width: '100%', marginTop: '8px', cursor: 'pointer', accentColor: 'var(--brand-blue)' }}
        />
      </div>
    </div>
  );
}
