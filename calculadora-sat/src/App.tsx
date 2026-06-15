import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './App.css';

interface Universidad {
  INSTNM: string;
  CITY: string;
  STABBR: string;
  SAT_AVG: number | null;
  TUITIONFEE_OUT: number | null;
  CONTROL: string | null;
  ADMCON7: string | null;
}

function App() {
  const [puntajeMath, setPuntajeMath] = useState<number>(0);
  const [puntajeLectura, setPuntajeLectura] = useState<number>(0);
  
  const [exigirSAT, setExigirSAT] = useState<string>('todos');
  const [tipoUniversidad, setTipoUniversidad] = useState<string>('todos');
  const [precioMaximo, setPrecioMaximo] = useState<number>(60000);

  const [universidades, setUniversidades] = useState<Universidad[]>([]);

  useEffect(() => {
    fetch('/universidades.json')
      .then(response => response.json())
      .then(data => setUniversidades(data))
      .catch(error => console.error("Error cargando la data:", error));
  }, []);

  const puntajeTotal = puntajeMath + puntajeLectura;

  const universidadesFiltradas = universidades.filter((uni) => {
    if (tipoUniversidad === 'publica' && uni.CONTROL !== 'Pública') return false;
    if (tipoUniversidad === 'privada' && (!uni.CONTROL || !uni.CONTROL.includes('Privada'))) return false;
    if (uni.TUITIONFEE_OUT && uni.TUITIONFEE_OUT > precioMaximo) return false;
    if (exigirSAT === 'requerido' && uni.ADMCON7 !== 'Requerido') return false;
    if (exigirSAT === 'opcional' && uni.ADMCON7 === 'Requerido') return false;
    if (puntajeTotal > 0 && uni.SAT_AVG) {
        if (puntajeTotal < uni.SAT_AVG) return false;
    }
    return true;
  });

  const datosGrafico = universidadesFiltradas
    .filter(uni => uni.TUITIONFEE_OUT !== null)
    .slice(0, 10)
    .map(uni => ({
      nombre: uni.INSTNM.length > 15 ? uni.INSTNM.substring(0, 15) + '...' : uni.INSTNM,
      costo: uni.TUITIONFEE_OUT,
      nombreCompleto: uni.INSTNM
    }));

  return (
    <main className="contenedor-principal">
      <h1>Buscador y Calculadora SAT</h1>
      <p>Aplica filtros para encontrar universidades que se ajusten a tus requisitos.</p>
      
      <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '30px', backgroundColor: '#1a1a1a' }}>
        
        <div style={{ flex: '1 1 250px' }}>
            <h3>1. Tus Puntajes SAT</h3>
            <div style={{ marginBottom: '10px' }}>
              <label>Matemáticas (200-800): </label>
              <br />
              <input type="number" min="0" max="800" value={puntajeMath} onChange={(e) => {
                if (Number(e.target.value) > 800) {
                  setPuntajeMath(800);
                } else if (Number(e.target.value) < 0) {
                  setPuntajeMath(0);
                } else {
                  setPuntajeMath(Number(e.target.value))
                }
              }} style={{ width: '100%', padding: '5px' }} />
            </div>
            <div>
              <label>Lectura (200-800): </label>
              <br />
              <input type="number" min="0" max="800" value={puntajeLectura} onChange={(e) => {
                if (Number(e.target.value) > 800) {
                  setPuntajeLectura(800);
                } else if (Number(e.target.value) < 0) {
                  setPuntajeLectura(0);
                } else {
                  setPuntajeLectura(Number(e.target.value))
                }
              }} style={{ width: '100%', padding: '5px' }} />
            </div>
            <h4 style={{ color: '#4cc9f0' }}>Puntaje Total: {puntajeTotal}</h4>
        </div>

        <div style={{ flex: '1 1 300px' }}>
            <h3>2. Delimitaciones y Filtros</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label>Políticas de Admisión SAT: </label>
              <select value={exigirSAT} onChange={(e) => setExigirSAT(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                <option value="todos">Mostrar todas</option>
                <option value="requerido">El SAT es obligatorio</option>
                <option value="opcional">No exigen SAT (Opcional/No requerido)</option>
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
              <label>Límite de Matrícula: <strong>${precioMaximo} / año</strong></label>
              <br />
              <input 
                type="range" 
                min="1000" 
                max="90000" 
                step="1000" 
                value={precioMaximo} 
                onChange={(e) => setPrecioMaximo(Number(e.target.value))} 
                style={{ width: '100%', marginTop: '10px' }} 
              />
            </div>
        </div>
      </div>

      {datosGrafico.length > 0 && (
        <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#222', borderRadius: '8px' }}>
          <h3>Comparativa de Costos de Matrícula (Top 10)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={datosGrafico} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="nombre" stroke="#ccc" tick={{ fontSize: 12 }} />
                <YAxis stroke="#ccc" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#333', border: 'none', color: '#fff' }}
                  formatter={(value: any) => [`$${value}`, 'Costo Anual']}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.nombreCompleto || label}
                />
                <Bar dataKey="costo" fill="#4cc9f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', textAlign: 'left' }}>
        <h3>Universidades Encontradas ({universidadesFiltradas.length}):</h3>
        
        {universidadesFiltradas.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {universidadesFiltradas.slice(0, 50).map((uni, index) => ( 
              <li key={index} style={{ padding: '15px', border: '1px solid #444', margin: '10px 0', borderRadius: '8px', backgroundColor: '#2a2a2a' }}>
                <strong style={{ fontSize: '1.2em' }}>{uni.INSTNM}</strong> <small>({uni.CITY}, {uni.STABBR})</small>
                
                <div style={{ marginTop: '10px' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', marginRight: '10px', backgroundColor: uni.CONTROL === 'Pública' ? '#2d6a4f' : '#5c4d7d', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    {uni.CONTROL}
                  </span>
                  
                  <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: uni.ADMCON7 === 'Requerido' ? '#9b2226' : '#005f73', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                    SAT: {uni.ADMCON7 || "No especificado"}
                  </span>
                </div>

                <div style={{ marginTop: '10px', fontSize: '14px', color: '#ccc' }}>
                  <p style={{ margin: '3px 0' }}>🎓 <strong>Promedio SAT admitido:</strong> {uni.SAT_AVG || 'No se requiere / No especificado'}</p>
                  <p style={{ margin: '3px 0' }}>💰 <strong>Matrícula (Fuera del Estado):</strong> {uni.TUITIONFEE_OUT ? `$${uni.TUITIONFEE_OUT}` : 'No disponible'}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#ff6b6b' }}>No se encontraron universidades que coincidan con estos filtros exactos.</p>
        )}
      </div>
    </main>
  );
}

export default App;