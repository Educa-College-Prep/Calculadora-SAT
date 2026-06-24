interface Props {
  // Ubicación
  estadoSeleccionado: string;
  setEstadoSeleccionado: (v: string) => void;
  ciudadSeleccionada: string;
  setCiudadSeleccionada: (v: string) => void;
  estadosUnicos: string[];
  ciudadesUnicas: string[];
  // SAT
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

export function Filtros({
  estadoSeleccionado, setEstadoSeleccionado,
  ciudadSeleccionada, setCiudadSeleccionada,
  estadosUnicos, ciudadesUnicas,
  puntajeMath, setPuntajeMath,
  puntajeLectura, setPuntajeLectura,
  puntajeTotal,
  exigirSAT, setExigirSAT,
  tipoUniversidad, setTipoUniversidad,
  precioMaximo, setPrecioMaximo,
}: Props) {
  return (
    <>
      {/* Filtro de ubicación */}
      <div style={{ margin: '20px 0', padding: '15px 20px', border: '1px solid #444', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '20px', backgroundColor: '#1a1a1a' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Estado:</label>
          <select
            value={estadoSeleccionado}
            onChange={(e) => { setEstadoSeleccionado(e.target.value); setCiudadSeleccionada('todas'); }}
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          >
            <option value="todos">Todos los estados</option>
            {estadosUnicos.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Ciudad:</label>
          <select
            value={ciudadSeleccionada}
            onChange={(e) => setCiudadSeleccionada(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
            disabled={estadoSeleccionado === 'todos'}
          >
            <option value="todas">Todas las ciudades</option>
            {ciudadesUnicas.map(ciudad => (
              <option key={ciudad} value={ciudad}>{ciudad}</option>
            ))}
          </select>
        </div>

        {estadoSeleccionado !== 'todos' && (
          <div style={{ flex: '1 1 100px', display: 'flex', alignItems: 'flex-end' }}>
            <button
              onClick={() => { setEstadoSeleccionado('todos'); setCiudadSeleccionada('todas'); }}
              style={{ padding: '8px', width: '100%', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Ver todo el país
            </button>
          </div>
        )}
      </div>

      {/* Filtros de SAT y adicionales */}
      <div style={{ margin: '0 0 20px 0', padding: '20px', border: '1px solid #444', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '30px', backgroundColor: '#1a1a1a' }}>
        <div style={{ flex: '1 1 250px' }}>
          <h3>1. Tus Puntajes SAT</h3>
          <div style={{ marginBottom: '10px' }}>
            <label>Matemáticas (200-800): </label><br />
            <input
              type="number" min="0" max="800" value={puntajeMath}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPuntajeMath(v > 800 ? 800 : v < 0 ? 0 : v);
              }}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          <div>
            <label>Lectura (200-800): </label><br />
            <input
              type="number" min="0" max="800" value={puntajeLectura}
              onChange={(e) => {
                const v = Number(e.target.value);
                setPuntajeLectura(v > 800 ? 800 : v < 0 ? 0 : v);
              }}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>
          <h4 style={{ color: '#4cc9f0' }}>Puntaje Total: {puntajeTotal}</h4>
        </div>

        <div style={{ flex: '1 1 300px' }}>
          <h3>2. Delimitaciones Adicionales</h3>
          <div style={{ marginBottom: '15px' }}>
            <label>Políticas de Admisión SAT: </label>
            <select value={exigirSAT} onChange={(e) => setExigirSAT(e.target.value)} style={{ width: '100%', padding: '5px' }}>
              <option value="todos">Mostrar todas</option>
              <option value="requerido">El SAT es obligatorio</option>
              <option value="opcional">SAT es opcional</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Tipo de Institución: </label>
            <select value={tipoUniversidad} onChange={(e) => setTipoUniversidad(e.target.value)} style={{ width: '100%', padding: '5px' }}>
              <option value="todos">Ambas</option>
              <option value="publica">Solo Públicas</option>
              <option value="privada">Solo Privadas</option>
            </select>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Límite de Matrícula: <strong>${precioMaximo} / año</strong></label><br />
            <input
              type="range" min="1000" max="90000" step="1000" value={precioMaximo}
              onChange={(e) => setPrecioMaximo(Number(e.target.value))}
              style={{ width: '100%', marginTop: '10px' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
