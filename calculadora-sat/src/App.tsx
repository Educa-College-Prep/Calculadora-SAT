import { useState, useEffect } from 'react';
import './App.css';

// Definimos la estructura basada en tus columnas
interface Universidad {
  INSTNM: string;
  CITY: string;
  STABBR: string;
  SAT_AVG: number | null;
  TUITIONFEE_OUT: number | null;
}

function App() {
  const [puntajeMath, setPuntajeMath] = useState<number>(0);
  const [puntajeLectura, setPuntajeLectura] = useState<number>(0);
  const [universidades, setUniversidades] = useState<Universidad[]>([]);

  // Cargamos tu JSON real al iniciar la página
  useEffect(() => {
    fetch('/universidades.json')
      .then(response => response.json())
      .then(data => setUniversidades(data))
      .catch(error => console.error("Error cargando la data:", error));
  }, []);

  const puntajeTotal = puntajeMath + puntajeLectura;

  // Lógica de filtrado con tus columnas
  const universidadesFiltradas = universidades.filter((uni) => {
    // 1. Descartamos las que no piden SAT o tienen el dato en blanco
    if (!uni.SAT_AVG) return false;
    
    // 2. Filtramos comparando el puntaje del usuario con el promedio de la u
    return puntajeTotal >= uni.SAT_AVG;
  });

  return (
    <main className="contenedor-principal">
      <h1>Calculadora de Puntaje SAT</h1>
      <p>Descubre a qué universidades puedes aplicar con tu data real.</p>
      
      <div style={{ margin: '20px 0', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Matemáticas (200-800): </label>
          <input 
            type="number" 
            min="200" max="800"
            value={puntajeMath} 
            onChange={(e) => setPuntajeMath(Number(e.target.value))} 
          />
        </div>
        <div>
          <label>Lectura/Escritura (200-800): </label>
          <input 
            type="number" 
            min="200" max="800"
            value={puntajeLectura} 
            onChange={(e) => setPuntajeLectura(Number(e.target.value))} 
          />
        </div>
        <h2>Puntaje Total: {puntajeTotal}</h2>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'left' }}>
        <h3>Universidades que encajan con tu perfil:</h3>
        
        {universidadesFiltradas.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {universidadesFiltradas.map((uni, index) => (
              <li key={index} style={{ padding: '15px', border: '1px solid #555', margin: '10px 0', borderRadius: '5px', backgroundColor: '#222' }}>
                <strong>{uni.INSTNM}</strong> <small>({uni.CITY}, {uni.STABBR})</small>
                <br />
                <small>Promedio SAT admitido: {uni.SAT_AVG}</small>
                <br />
                {uni.TUITIONFEE_OUT && <small>Matrícula fuera de estado: ${uni.TUITIONFEE_OUT}</small>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#ff6b6b' }}>
            Ajusta tus puntajes para explorar las opciones.
          </p>
        )}
      </div>
    </main>
  );
}

export default App;