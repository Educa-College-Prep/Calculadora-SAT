import { useState, useEffect } from 'react';
import type { Universidad } from './types';

// Importación de Componentes
import { Buscador } from './components/Buscador';
import { Filtros } from './components/Filtros';
import { MapaGeo } from './components/MapaGeo';
import { GraficoBarras } from './components/GraficoBarras';
import { ListaUniversidades } from './components/ListaUniversidades';
import { DetalleUniversidad } from './components/DetalleUniversidad';

import './App.css';

export default function App() {
  // --- ESTADOS GENERALES Y DATA ---
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [universidadSeleccionada, setUniversidadSeleccionada] = useState<Universidad | null>(null);

  // --- ESTADOS DE FILTROS ---
  const [busquedaNombre, setBusquedaNombre] = useState<string>('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);
  
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>('todos');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('todas');

  const [puntajeMath, setPuntajeMath] = useState<number>(0);
  const [puntajeLectura, setPuntajeLectura] = useState<number>(0);
  
  const [exigirSAT, setExigirSAT] = useState<string>('todos');
  const [tipoUniversidad, setTipoUniversidad] = useState<string>('todos');
  const [precioMaximo, setPrecioMaximo] = useState<number>(90000);
  
  // --- ESTADOS DE ORDENAMIENTO ---
  const [ordenarPor, setOrdenarPor] = useState<string>('ninguno');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');

  // --- EFECTO: Carga inicial de datos ---
  useEffect(() => {
    // Nota: Asegúrate de que la ruta coincida con la ubicación de tu JSON en public/
    fetch('/Calculadora-SAT/universidades.json')
      .then(response => response.json())
      .then(data => setUniversidades(data))
      .catch(error => console.error("Error cargando la data:", error));
  }, []);

  // --- DERIVACIONES DE DATOS (Selectores geográficos) ---
  const estadosUnicos = Array.from(new Set(universidades.map(u => u.STABBR).filter(Boolean))).sort();
  
  const ciudadesUnicas = Array.from(new Set(
    universidades
      .filter(u => estadoSeleccionado === 'todos' || u.STABBR === estadoSeleccionado)
      .map(u => u.CITY)
      .filter(Boolean)
  )).sort();

  const puntajeTotal = puntajeMath + puntajeLectura;

  // --- LÓGICA DE FILTRADO ---
  const universidadesFiltradas = universidades.filter((uni) => {
    if (busquedaNombre && !uni.INSTNM.toLowerCase().includes(busquedaNombre.toLowerCase())) return false;

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

  // --- LÓGICA DE ORDENAMIENTO ---
  const universidadesOrdenadas = [...universidadesFiltradas].sort((a, b) => {
    if (ordenarPor === 'ninguno') return 0;

    const valA = (a as any)[ordenarPor];
    const valB = (b as any)[ordenarPor];

    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;

    if (typeof valA === 'string' && typeof valB === 'string') {
      return ordenDireccion === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    return ordenDireccion === 'asc'
      ? Number(valA) - Number(valB)
      : Number(valB) - Number(valA);
  });
  
  // --- DATOS PARA GRÁFICO (Top 10) ---
  const datosGrafico = universidadesOrdenadas
    .filter(uni => uni.TUITIONFEE_OUT !== null && uni.TUITIONFEE_OUT !== undefined)
    .slice(0, 10)
    .map(uni => ({
      nombre: uni.INSTNM.length > 15 ? uni.INSTNM.substring(0, 15) + '...' : uni.INSTNM,
      costo: uni.TUITIONFEE_OUT,
      nombreCompleto: uni.INSTNM
    }));

  // --- DATOS PARA MAPA GEOGRÁFICO ---
  const datosMapaGeo: (string | number)[][] = [["Estado", "Universidades"]];
  const conteoPorEstado: Record<string, number> = {};
  
  universidadesFiltradas.forEach(uni => {
    if (uni.STABBR) conteoPorEstado[uni.STABBR] = (conteoPorEstado[uni.STABBR] || 0) + 1;
  });

  Object.keys(conteoPorEstado).forEach(estado => {
    datosMapaGeo.push([`US-${estado}`, conteoPorEstado[estado]]);
  });

  // --- MANEJADOR PARA SELECCIÓN DESDE EL MAPA ---
  const handleSeleccionarEstadoDesdeMapa = (estadoAbbr: string) => {
    setEstadoSeleccionado(estadoAbbr);
    setCiudadSeleccionada('todas');
  };

  // --- RENDEREADO CONDICIONAL ---

  // 1. Vista de Ficha Detallada
  if (universidadSeleccionada) {
    return (
      <DetalleUniversidad 
        uni={universidadSeleccionada} 
        onVolver={() => setUniversidadSeleccionada(null)} 
      />
    );
  }

  // 2. Vista del Buscador Principal
  return (
    <main className="contenedor-principal">
      <h1>Buscador y Calculadora SAT</h1>
      <p>Aplica filtros para explorar nuestra base de datos de universidades en EE.UU.</p>
      
      {/* Componente de Búsqueda por Texto */}
      <Buscador 
        busquedaNombre={busquedaNombre}
        setBusquedaNombre={setBusquedaNombre}
        mostrarSugerencias={mostrarSugerencias}
        setMostrarSugerencias={setMostrarSugerencias}
        universidades={universidades}
      />

      {/* Componente de Panel de Filtros (Ubicación, SAT, Costos) */}
      <Filtros 
        estadoSeleccionado={estadoSeleccionado}
        setEstadoSeleccionado={setEstadoSeleccionado}
        ciudadSeleccionada={ciudadSeleccionada}
        setCiudadSeleccionada={setCiudadSeleccionada}
        estadosUnicos={estadosUnicos}
        ciudadesUnicas={ciudadesUnicas}
        puntajeMath={puntajeMath}
        setPuntajeMath={setPuntajeMath}
        puntajeLectura={puntajeLectura}
        setPuntajeLectura={setPuntajeLectura}
        puntajeTotal={puntajeTotal}
        exigirSAT={exigirSAT}
        setExigirSAT={setExigirSAT}
        tipoUniversidad={tipoUniversidad}
        setTipoUniversidad={setTipoUniversidad}
        precioMaximo={precioMaximo}
        setPrecioMaximo={setPrecioMaximo}
      />

      {/* Grid de Reportes Visuales (Mapa y Gráfico) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <MapaGeo 
          datosMapaGeo={datosMapaGeo}
          estadoSeleccionado={estadoSeleccionado}
          onSeleccionarEstado={handleSeleccionarEstadoDesdeMapa}
        />

        <GraficoBarras 
          datosGrafico={datosGrafico}
        />
      </div>

      {/* Componente de Lista de Resultados */}
      <ListaUniversidades 
        universidadesFiltradas={universidadesFiltradas}
        universidadesOrdenadas={universidadesOrdenadas}
        totalUniversidades={universidades.length}
        ordenarPor={ordenarPor}
        setOrdenarPor={setOrdenarPor}
        ordenDireccion={ordenDireccion}
        setOrdenDireccion={setOrdenDireccion}
        onSeleccionar={(uni) => setUniversidadSeleccionada(uni)}
      />
    </main>
  );
}