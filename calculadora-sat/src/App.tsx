import { useState, useEffect } from 'react';
import type { Universidad } from './types';

import { Buscador } from './components/Buscador';
import { Filtros } from './components/Filtros';
import { MapaGeo } from './components/MapaGeo';
import { GraficoBarras } from './components/GraficoBarras';
import { ListaUniversidades } from './components/ListaUniversidades';
import { DetalleUniversidad } from './components/DetalleUniversidad';

export default function App() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [universidadSeleccionada, setUniversidadSeleccionada] = useState<Universidad | null>(null);

  const [busquedaNombre, setBusquedaNombre] = useState<string>('');
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);
  
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>('todos');
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>('todas');

  const [puntajeMath, setPuntajeMath] = useState<number>(0);
  const [puntajeLectura, setPuntajeLectura] = useState<number>(0);
  
  const [exigirSAT, setExigirSAT] = useState<string>('todos');
  const [tipoUniversidad, setTipoUniversidad] = useState<string>('todos');
  const [precioMaximo, setPrecioMaximo] = useState<number>(90000);
  
  const [ordenarPor, setOrdenarPor] = useState<string>('ninguno');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');

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

  const universidadesOrdenadas = [...universidadesFiltradas].sort((a, b) => {
    if (ordenarPor === 'ninguno') return 0;
    const valA = (a as any)[ordenarPor];
    const valB = (b as any)[ordenarPor];
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;
    if (typeof valA === 'string' && typeof valB === 'string') {
      return ordenDireccion === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    return ordenDireccion === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
  });
  
  const datosGrafico = universidadesOrdenadas
    .filter(uni => uni.TUITIONFEE_OUT !== null && uni.TUITIONFEE_OUT !== undefined)
    .slice(0, 10)
    .map(uni => ({
      nombre: uni.INSTNM.length > 12 ? uni.INSTNM.substring(0, 12) + '...' : uni.INSTNM,
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

  if (universidadSeleccionada) {
    return (
      <DetalleUniversidad 
        uni={universidadSeleccionada} 
        onVolver={() => setUniversidadSeleccionada(null)} 
      />
    );
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. CABECERA GLOBAL IMPECABLE */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: '1px solid var(--border-subtle)', 
        paddingBottom: '16px',
        marginBottom: '10px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 700, letterSpacing: '-0.5px' }}>
            Calculadora SAT
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
            Métricas de admisión, costos y distribución regional de instituciones académicas.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-saas-secondary" style={{ fontSize: '12px' }} onClick={() => window.location.reload()}>
            Sincronizar Datos
          </button>
        </div>
      </header>

      {/* 2. ESTRUCTURA PRINCIPAL DE DOS COLUMNAS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr', 
        gap: '30px', 
        alignItems: 'start' 
      }}>
        
        {/* COLUMNA IZQUIERDA: PANEL DE FILTROS LATERAL (SIDEBAR) */}
        <aside className="saas-panel" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          position: 'sticky', 
          top: '20px' 
        }}>
          <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Filtros de Control
            </h3>
          </div>

          {/* Bloque Geográfico de la Barra Lateral */}
          <div>
            <label style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block', marginBottom: '6px', fontWeight: 600 }}>UBICACIÓN GEOGRÁFICA</label>
            <select value={estadoSeleccionado} onChange={(e) => { setEstadoSeleccionado(e.target.value); setCiudadSeleccionada('todas'); }} style={{ marginBottom: '10px' }}>
              <option value="todos">Todos los estados</option>
              {estadosUnicos.map(st => <option key={st} value={st}>{st}</option>)}
            </select>
            <button className="btn-saas-secondary" style={{ width: '100%', padding: '6px', fontSize: '12px' }} onClick={() => { setEstadoSeleccionado('todos'); setCiudadSeleccionada('todas'); }}>
              Restablecer Mapa
            </button>
          </div>

          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

          {/* Subcomponente Filtros (Rangos, SAT, Precios) */}
          <Filtros 
            estadoSeleccionado={estadoSeleccionado} setEstadoSeleccionado={setEstadoSeleccionado}
            ciudadSeleccionada={ciudadSeleccionada} setCiudadSeleccionada={setCiudadSeleccionada}
            estadosUnicos={estadosUnicos} ciudadesUnicas={ciudadesUnicas}
            puntajeMath={puntajeMath} setPuntajeMath={setPuntajeMath}
            puntajeLectura={puntajeLectura} setPuntajeLectura={setPuntajeLectura}
            puntajeTotal={puntajeTotal} exigirSAT={exigirSAT} setExigirSAT={setExigirSAT}
            tipoUniversidad={tipoUniversidad} setTipoUniversidad={setTipoUniversidad}
            precioMaximo={precioMaximo} setPrecioMaximo={setPrecioMaximo}
          />
        </aside>

        {/* COLUMNA DERECHA: PANEL PRINCIPAL CENTRAL */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* BUSCADOR COMPACTO SUPERIOR */}
          <section className="saas-panel" style={{ padding: '16px 20px' }}>
            <Buscador 
              busquedaNombre={busquedaNombre} setBusquedaNombre={setBusquedaNombre} 
              mostrarSugerencias={mostrarSugerencias} setMostrarSugerencias={setMostrarSugerencias} 
              universidades={universidades} 
            />
          </section>

          {/* SEPARADOR VISUAL */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

          {/* REPORTES GRÁFICOS INTERACTIVOS (LADO A LADO) */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <div className="saas-panel" style={{ padding: '20px' }}>
              <MapaGeo datosMapaGeo={datosMapaGeo} estadoSeleccionado={estadoSeleccionado} onSeleccionarEstado={(st) => { setEstadoSeleccionado(st); setCiudadSeleccionada('todas'); }} />
            </div>
            <div className="saas-panel" style={{ padding: '20px' }}>
              <GraficoBarras datosGrafico={datosGrafico} />
            </div>
          </section>

          {/* SEPARADOR VISUAL ANTES DE LOS RESULTADOS */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

          {/* TABLA DE RESULTADOS TOTALMENTE VISIBLE ABAJO */}
          <section className="saas-panel" style={{ padding: '8px' }}>
            <ListaUniversidades 
              universidadesFiltradas={universidadesFiltradas} universidadesOrdenadas={universidadesOrdenadas}
              totalUniversidades={universidades.length} ordenarPor={ordenarPor} setOrdenarPor={setOrdenarPor}
              ordenDireccion={ordenDireccion} setOrdenDireccion={setOrdenDireccion}
              onSeleccionar={(uni) => setUniversidadSeleccionada(uni)}
            />
          </section>

        </main>
      </div>
    </div>
  );
}