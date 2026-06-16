import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Chart } from "react-google-charts"; 
import './App.css';

interface Universidad {
  INSTNM: string;
  CITY: string;
  STABBR: string;
  CONTROL: string | null;
  UGDS?: number | null;
  UGDS_HISP?: number | null;
  ADM_RATE?: number | null;
  SATVR25?: number | null;
  SATMT25?: number | null;
  SATVR75?: number | null;
  SATMT75?: number | null;
  SAT_AVG?: number | null;
  ADMCON7?: string | null;
  OPENADMP?: string | null;
  PRGMOFR?: number | null;
  CIPTITLE1?: string | null;
  CIPTITLE2?: string | null;
  CIPTITLE3?: string | null;
  CIPTITLE4?: string | null;
  CIPTITLE5?: string | null;
  CIPTITLE6?: string | null;
  ICLEVEL?: string | null;
  TUITIONFEE_OUT?: number | null;
  COSTT4_A?: number | null;
  NPT4_PRIV?: number | null;
  NPT4_PUB?: number | null;
  C150_4?: number | null;
  C150_L4?: number | null;
  C150_4_HISP?: number | null;
  C150_L4_HISP?: number | null;
  MD_EARN_WNE_P6?: number | null;
  MD_EARN_WNE_P8?: number | null;
  MD_EARN_WNE_P10?: number | null;
  MD_EARN_WNE_1YR?: number | null;
  MD_EARN_WNE_5YR?: number | null;
  GT_THRESHOLD_P6?: number | null;
  GT_THRESHOLD_P8?: number | null;
  GT_THRESHOLD_P10?: number | null;
  GT_THRESHOLD_1YR?: number | null;
  GT_THRESHOLD_5YR?: number | null;
}

function App() {
  const [puntajeMath, setPuntajeMath] = useState<number>(0);
  const [puntajeLectura, setPuntajeLectura] = useState<number>(0);
  
  const [exigirSAT, setExigirSAT] = useState<string>('todos');
  const [tipoUniversidad, setTipoUniversidad] = useState<string>('todos');
  const [precioMaximo, setPrecioMaximo] = useState<number>(90000);
  
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>('todos');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('todas');

  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [universidadSeleccionada, setUniversidadSeleccionada] = useState<Universidad | null>(null);

  useEffect(() => {
    fetch('/Calculadora-SAT/universidades.json')
      .then(response => response.json())
      .then(data => setUniversidades(data))
      .catch(error => console.error("Error cargando la data:", error));
  }, []);

  const estadosUnicos = Array.from(new Set(universidades.map(u => u.STABBR).filter(Boolean))).sort();
  
  const ciudadesUnicas = Array.from(new Set(
    universidades
      .filter(u => estadoSeleccionado === 'todos' || u.STABBR === estadoSeleccionado)
      .map(u => u.CITY)
      .filter(Boolean)
  )).sort();

  const puntajeTotal = puntajeMath + puntajeLectura;

  const universidadesFiltradas = universidades.filter((uni) => {
    if (estadoSeleccionado !== 'todos' && uni.STABBR !== estadoSeleccionado) return false;
    if (ciudadSeleccionada !== 'todas' && uni.CITY !== ciudadSeleccionada) return false;

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


  const datosMapaGeo: (string | number)[][] = [["Estado", "Universidades"]];
  const conteoPorEstado: Record<string, number> = {};
  
  universidadesFiltradas.forEach(uni => {
    if (uni.STABBR) conteoPorEstado[uni.STABBR] = (conteoPorEstado[uni.STABBR] || 0) + 1;
  });

  Object.keys(conteoPorEstado).forEach(estado => {
    datosMapaGeo.push([`US-${estado}`, conteoPorEstado[estado]]);
  });

  const mapOptions = {
    region: 'US', // Mantenemos siempre la vista del país
    displayMode: 'regions',
    resolution: 'provinces',
    colorAxis: { colors: ['#90e0ef', '#0077b6', '#03045e'] },
    backgroundColor: 'transparent',
    datalessRegionColor: '#222', // Color de fondo si el estado no tiene universidades
    defaultColor: '#555',
  };

  const chartEvents = [
    {
      eventName: "select" as const,
      callback: ({ chartWrapper }: any) => {
        const chart = chartWrapper.getChart();
        const selection = chart.getSelection();
        
        if (selection.length === 0 || selection[0].row == null) return;

        const dataTable = chartWrapper.getDataTable();
        const valorSeleccionado = dataTable.getValue(selection[0].row, 0);

        if (valorSeleccionado && valorSeleccionado.startsWith('US-')) {
          const estadoAbbr = valorSeleccionado.split('-')[1];
          setEstadoSeleccionado(estadoAbbr);
          setCiudadSeleccionada('todas');
        }
      }
    }
  ];
  // =======================================================

  const formatDinero = (valor: number | null | undefined) => valor ? `$${valor.toLocaleString()}` : null;
  const formatPorcentaje = (valor: number | null | undefined) => valor ? `${(valor * 100).toFixed(1)}%` : null;

  if (universidadSeleccionada) {
    const uni = universidadSeleccionada;
    const tieneSalarios = uni.MD_EARN_WNE_1YR || uni.MD_EARN_WNE_5YR || uni.MD_EARN_WNE_P6 || uni.MD_EARN_WNE_P8 || uni.MD_EARN_WNE_P10;

    return (
      <main className="contenedor-principal">
        <button 
          onClick={() => setUniversidadSeleccionada(null)}
          style={{ padding: '10px 20px', backgroundColor: '#4cc9f0', color: '#000', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '20px' }}
        >
          ← Volver al Buscador
        </button>
        
        <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', textAlign: 'left', border: '1px solid #333' }}>
          <h1 style={{ color: '#4cc9f0', margin: '0 0 10px 0', fontSize: '2.5rem' }}>{uni.INSTNM}</h1>
          <h3 style={{ margin: '0 0 20px 0', color: '#aaa', fontWeight: 'normal' }}> {uni.CITY}, {uni.STABBR} |  {uni.CONTROL} {uni.ICLEVEL && `|  Nivel: ${uni.ICLEVEL}`}</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {(uni.UGDS || uni.UGDS_HISP) && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #f72585' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}> Perfil Estudiantil</h4>
                {uni.UGDS && <p><strong>Total Pregrado (UGDS):</strong> {uni.UGDS.toLocaleString()}</p>}
                {uni.UGDS_HISP && <p><strong>Estudiantes Hispanos:</strong> {uni.UGDS_HISP.toLocaleString()}</p>}
              </div>
            )}

            {(uni.ADM_RATE || uni.ADMCON7 || uni.OPENADMP || uni.SAT_AVG) && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #7209b7' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}> Admisiones y SAT</h4>
                {uni.ADM_RATE != null && <p><strong>Tasa de Admisión:</strong> {formatPorcentaje(uni.ADM_RATE)}</p>}
                {uni.ADMCON7 && <p><strong>Política SAT:</strong> {uni.ADMCON7}</p>}
                {uni.OPENADMP && <p><strong>Admisión Abierta:</strong> {uni.OPENADMP}</p>}
                {uni.SAT_AVG && (
                  <>
                    <hr style={{ borderColor: '#444', margin: '10px 0' }}/>
                    <p><strong>Promedio SAT:</strong> {uni.SAT_AVG}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em', color: '#bbb' }}>
                      {(uni.SATMT25 || uni.SATMT75) && (
                        <div><p><strong>Math 25-75%:</strong> {uni.SATMT25 || '-'} / {uni.SATMT75 || '-'}</p></div>
                      )}
                      {(uni.SATVR25 || uni.SATVR75) && (
                        <div><p><strong>Lectura 25-75%:</strong> {uni.SATVR25 || '-'} / {uni.SATVR75 || '-'}</p></div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {(uni.TUITIONFEE_OUT || uni.COSTT4_A || uni.NPT4_PUB || uni.NPT4_PRIV) && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4361ee' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}> Costos Anuales</h4>
                {uni.TUITIONFEE_OUT && <p><strong>Matrícula (Fuera de Estado):</strong> {formatDinero(uni.TUITIONFEE_OUT)}</p>}
                {uni.COSTT4_A && <p><strong>Costo Total Asistencia:</strong> {formatDinero(uni.COSTT4_A)}</p>}
                {(uni.NPT4_PUB || uni.NPT4_PRIV) && (
                  <>
                    <hr style={{ borderColor: '#444', margin: '10px 0' }}/>
                    <p><strong>Costo Neto Promedio:</strong> {formatDinero(uni.NPT4_PUB || uni.NPT4_PRIV)}</p>
                  </>
                )}
              </div>
            )}

            {(uni.C150_4 || uni.C150_L4 || uni.C150_4_HISP || uni.C150_L4_HISP) && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #4cc9f0' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}> Tasas de Graduación</h4>
                {uni.C150_4 != null && <p><strong>General (4-Year):</strong> {formatPorcentaje(uni.C150_4)}</p>}
                {uni.C150_L4 != null && <p><strong>General (&lt;4-Year):</strong> {formatPorcentaje(uni.C150_L4)}</p>}
                {uni.C150_4_HISP != null && <p><strong>Hispanos (4-Year):</strong> {formatPorcentaje(uni.C150_4_HISP)}</p>}
                {uni.C150_L4_HISP != null && <p><strong>Hispanos (&lt;4-Year):</strong> {formatPorcentaje(uni.C150_L4_HISP)}</p>}
              </div>
            )}

            {tieneSalarios && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #48cae4', gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}> Retorno de Inversión (Salario Mediano)</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {uni.MD_EARN_WNE_1YR && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 1 año</small><br/><strong>{formatDinero(uni.MD_EARN_WNE_1YR)}</strong></div>}
                  {uni.MD_EARN_WNE_5YR && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 5 años</small><br/><strong>{formatDinero(uni.MD_EARN_WNE_5YR)}</strong></div>}
                  {uni.MD_EARN_WNE_P6 && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 6 años</small><br/><strong>{formatDinero(uni.MD_EARN_WNE_P6)}</strong></div>}
                  {uni.MD_EARN_WNE_P8 && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 8 años</small><br/><strong>{formatDinero(uni.MD_EARN_WNE_P8)}</strong></div>}
                  {uni.MD_EARN_WNE_P10 && <div style={{ backgroundColor: '#333', padding: '10px', borderRadius: '5px', textAlign: 'center' }}><small>A 10 años</small><br/><strong>{formatDinero(uni.MD_EARN_WNE_P10)}</strong></div>}
                </div>
              </div>
            )}

            {(uni.CIPTITLE1 || uni.PRGMOFR) && (
              <div style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #00b4d8', gridColumn: '1 / -1' }}>
                <h4 style={{ margin: '0 0 15px 0', color: '#fff' }}> Oferta Académica {uni.PRGMOFR && `(${uni.PRGMOFR} Programas)`}</h4>
                {uni.CIPTITLE1 && (
                  <>
                    <p><strong>Programas Más Populares:</strong></p>
                    <ul style={{ paddingLeft: '20px', color: '#ccc', margin: '10px 0 0 0' }}>
                      {uni.CIPTITLE1 && <li>{uni.CIPTITLE1}</li>}
                      {uni.CIPTITLE2 && <li>{uni.CIPTITLE2}</li>}
                      {uni.CIPTITLE3 && <li>{uni.CIPTITLE3}</li>}
                      {uni.CIPTITLE4 && <li>{uni.CIPTITLE4}</li>}
                      {uni.CIPTITLE5 && <li>{uni.CIPTITLE5}</li>}
                      {uni.CIPTITLE6 && <li>{uni.CIPTITLE6}</li>}
                    </ul>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="contenedor-principal">
      <h1>Buscador y Calculadora SAT</h1>
      <p>Aplica filtros para explorar nuestra base de datos de universidades en EE.UU.</p>
      
      <div style={{ margin: '20px 0', padding: '15px 20px', border: '1px solid #444', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '20px', backgroundColor: '#1a1a1a' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}> Estado:</label>
          <select 
            value={estadoSeleccionado} 
            onChange={(e) => {
              setEstadoSeleccionado(e.target.value);
              setCiudadSeleccionada('todas'); 
            }} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px' }}
          >
            <option value="todos">Todos los estados</option>
            {estadosUnicos.map(estado => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}> Ciudad:</label>
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
             <button onClick={() => { setEstadoSeleccionado('todos'); setCiudadSeleccionada('todas'); }} style={{ padding: '8px', width: '100%', backgroundColor: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
               Ver todo el país
             </button>
          </div>
        )}
      </div>

      <div style={{ margin: '0 0 20px 0', padding: '20px', border: '1px solid #444', borderRadius: '8px', display: 'flex', flexWrap: 'wrap', gap: '30px', backgroundColor: '#1a1a1a' }}>
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
            <h3>2. Delimitaciones Adicionales</h3>
            <div style={{ marginBottom: '15px' }}>
              <label>Políticas de Admisión SAT: </label>
              <select value={exigirSAT} onChange={(e) => setExigirSAT(e.target.value)} style={{ width: '100%', padding: '5px' }}>
                <option value="todos">Mostrar todas</option>
                <option value="requerido">El SAT es obligatorio</option>
                <option value="opcional">No exigen SAT</option>
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
              <input type="range" min="1000" max="90000" step="1000" value={precioMaximo} onChange={(e) => setPrecioMaximo(Number(e.target.value))} style={{ width: '100%', marginTop: '10px' }} />
            </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        
        <div style={{ padding: '20px', backgroundColor: '#222', borderRadius: '8px' }}>
          <h3>Concentración de Universidades {estadoSeleccionado !== 'todos' && `en ${estadoSeleccionado}`}</h3>
          <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 10px 0' }}> Haz clic en el mapa para aplicar un filtro geográfico</p>
          {datosMapaGeo.length > 1 ? (
            <Chart
              chartEvents={chartEvents}
              chartType="GeoChart"
              width="100%"
              height="300px"
              data={datosMapaGeo}
              options={mapOptions}
            />
          ) : (
            <p style={{ color: '#aaa', textAlign: 'center', marginTop: '50px' }}>No hay datos suficientes para dibujar el mapa en este nivel.</p>
          )}
        </div>

        {datosGrafico.length > 0 && (
          <div style={{ padding: '20px', backgroundColor: '#222', borderRadius: '8px' }}>
            <h3>Comparativa de Costos de Matrícula (Top 10 resultantes)</h3>
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
      </div>

      <div style={{ marginTop: '30px', textAlign: 'left' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '5px' }}>
          <h3 style={{ margin: 0 }}>Universidades Encontradas</h3>

          <span style={{ 
            backgroundColor: '#4cc9f0', 
            color: '#000', 
            padding: '5px 15px', 
            borderRadius: '20px', 
            fontWeight: 'bold', 
            fontSize: '14px',
            boxShadow: '0 0 10px rgba(76, 201, 240, 0.3)'
          }}>
            {universidadesFiltradas.length} de {universidades.length}
          </span>
        </div>
        
        <p style={{ color: '#aaa', fontSize: '14px', marginTop: '5px' }}>
          Explorando nuestra base de datos completa. Mostrando un máximo de 50 resultados en pantalla para agilizar tu búsqueda.
        </p>

        {universidadesFiltradas.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {universidadesFiltradas.slice(0, 50).map((uni, index) => ( 
              <li 
                key={index} 
                onClick={() => setUniversidadSeleccionada(uni)}
                style={{ padding: '15px', border: '1px solid #444', margin: '10px 0', borderRadius: '8px', backgroundColor: '#2a2a2a', cursor: 'pointer', transition: '0.3s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
              >
                <strong style={{ fontSize: '1.2em' }}>{uni.INSTNM}</strong> <small>({uni.CITY}, {uni.STABBR})</small>
                <div style={{ marginTop: '10px' }}>
                  <span style={{ display: 'inline-block', padding: '4px 10px', marginRight: '10px', backgroundColor: uni.CONTROL === 'Pública' ? '#2d6a4f' : '#5c4d7d', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>{uni.CONTROL}</span>
                  <span style={{ display: 'inline-block', padding: '4px 10px', backgroundColor: uni.ADMCON7 === 'Requerido' ? '#9b2226' : '#005f73', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>SAT: {uni.ADMCON7 || "No especificado"}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#ff6b6b', padding: '20px', backgroundColor: '#331a1a', borderRadius: '8px' }}>
            No se encontraron universidades con esa combinación exacta de filtros. Intenta ampliar tu presupuesto o cambiar la ubicación.
          </p>
        )}
      </div>
    </main>
  );
}

export default App;