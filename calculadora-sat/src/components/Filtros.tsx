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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '10px' }}>
      
      {/* SECCIÓN FILTRO: UBICACIÓN */}
      <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', backgroundColor: '#161616' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#4cc9f0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
          📍 Filtro por Ubicación
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Seleccionar Estado:</label>
            <select 
              value={estadoSeleccionado} 
              onChange={(e) => {
                setEstadoSeleccionado(e.target.value);
                setCiudadSeleccionada('todas'); 
              }} 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}
            >
              <option value="todos">Todos los estados</option>
              {estadosUnicos.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Seleccionar Ciudad:</label>
            <select 
              value={ciudadSeleccionada} 
              onChange={(e) => setCiudadSeleccionada(e.target.value)} 
              style={{ width: '100%', padding: '10px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}
              disabled={estadoSeleccionado === 'todos'}
            >
              <option value="todas">Todas las ciudades</option>
              {ciudadesUnicas.map(ciudad => (
                <option key={ciudad} value={ciudad}>{ciudad}</option>
              ))}
            </select>
          </div>

          {estadoSeleccionado !== 'todos' && (
            <div style={{ flex: '1 1 150px', display: 'flex', alignItems: 'flex-end' }}>
               <button 
                 onClick={() => { setEstadoSeleccionado('todos'); setCiudadSeleccionada('todas'); }} 
                 style={{ padding: '10px', width: '100%', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
               >
                 Ver todo el país
               </button>
            </div>
          )}
        </div>
        <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#aaa', fontStyle: 'italic' }}>
          💡 También puedes hacer clic directamente en el mapa interactivo para filtrar geográficamente.
        </p>
      </div>

      {/* SECCIÓN FILTROS: REQUISITOS ACADÉMICOS Y FINANCIEROS */}
      <div style={{ padding: '20px', border: '1px solid #333', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '30px', backgroundColor: '#161616' }}>
        
        {/* FILTRO: PUNTAJE SAT REQUERIDO */}
        <div style={{ flex: '1 1 280px' }}>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#4cc9f0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
              📊 Puntaje SAT Requerido
            </h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', color: '#ccc' }}>Matemáticas (200-800): </label>
              <input type="number" min="0" max="800" value={puntajeMath} onChange={(e) => {
                const val = Number(e.target.value);
                setPuntajeMath(val > 800 ? 800 : val < 0 ? 0 : val);
              }} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: '#ccc' }}>Lectura Evidencial (200-800): </label>
              <input type="number" min="0" max="800" value={puntajeLectura} onChange={(e) => {
                const val = Number(e.target.value);
                setOriginalValue: setPuntajeLectura(val > 800 ? 800 : val < 0 ? 0 : val);
              }} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }} />
            </div>
            <h4 style={{ color: '#4cc9f0', margin: '5px 0 0 0' }}>Tu Puntaje Ingresado: {puntajeTotal} pts</h4>
        </div>

        {/* FILTROS ADICIONALES (POLÍTICA, INSTITUCIÓN, MATRÍCULA) */}
        <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: '#4cc9f0', borderBottom: '1px solid #333', paddingBottom: '5px' }}>
              ⚙️ Delimitaciones Adicionales
            </h3>
            
            {/* FILTRO: POLÍTICA SAT */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Política de Admisión SAT: </label>
              <select value={exigirSAT} onChange={(e) => setExigirSAT(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}>
                <option value="todos">Mostrar todas (Cualquiera)</option>
                <option value="requerido">El SAT es obligatorio</option>
                <option value="opcional">SAT Opcional</option>
              </select>
            </div>

            {/* FILTRO: TIPO DE INSTITUCIÓN */}
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Tipo de Institución: </label>
              <select value={tipoUniversidad} onChange={(e) => setTipoUniversidad(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#222', color: '#fff', border: '1px solid #444' }}>
                <option value="todos">Públicas y Privadas</option>
                <option value="publica">Solo Públicas</option>
                <option value="privada">Solo Privadas</option>
              </select>
            </div>

            {/* FILTRO: MATRÍCULA */}
            <div>
              <label style={{ display: 'block', marginBottom: '2px', fontSize: '14px' }}>
                Matrícula Máxima Anual: <strong style={{ color: '#4cc9f0' }}>${precioMaximo.toLocaleString()} USD</strong>
              </label>
              <input 
                type="range" min="1000" max="90000" step="1000" value={precioMaximo} 
                onChange={(e) => setPrecioMaximo(Number(e.target.value))} 
                style={{ width: '100%', marginTop: '8px', cursor: 'pointer' }} 
              />
            </div>
        </div>

      </div>
    </div>
  );
}