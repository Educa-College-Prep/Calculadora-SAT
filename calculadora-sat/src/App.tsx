import { useState, useEffect, useMemo, useCallback, useDeferredValue } from 'react';
import type { Universidad } from './types';
import { NOMBRES_ESTADOS } from './utils/estados';

import { Buscador } from './components/Buscador';
import { Filtros } from './components/Filtros';
import { MapaGeo } from './components/MapaGeo';
import { GraficoBarras } from './components/GraficoBarras';
import { ListaUniversidades } from './components/ListaUniversidades';
import { ResumenEstado } from './components/ResumenEstado';
import { DetalleUniversidad } from './components/DetalleUniversidad';

type TooltipCell = { role: 'tooltip'; p: { html: true } };

/** Tope del deslizador de matrícula. En ese valor el filtro se considera inactivo. */
const PRECIO_MAXIMO_SLIDER = 90000;

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

  // El texto que se usa para filtrar va "un paso atrás" del que se ve en el input.
  // Así el tecleo nunca se congela aunque el filtrado de 4300 registros tarde.
  const busquedaDiferida = useDeferredValue(busquedaNombre);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}universidades.json`)
      .then(response => response.json())
      .then((data: Universidad[]) => {
        // Se asigna un id estable una sola vez, al cargar.
        setUniversidades(data.map((uni, indice) => ({ ...uni, _id: indice })));
      })
      .catch(error => console.error("Error cargando la data:", error));
  }, []);

  const estadosUnicos = useMemo(
    () => Array.from(new Set(universidades.map(u => u.STABBR).filter(Boolean))).sort(),
    [universidades]
  );

  const ciudadesUnicas = useMemo(
    () => Array.from(new Set(
      universidades
        .filter(u => estadoSeleccionado === 'todos' || u.STABBR === estadoSeleccionado)
        .map(u => u.CITY)
        .filter(Boolean)
    )).sort(),
    [universidades, estadoSeleccionado]
  );

  const puntajeTotal = puntajeMath + puntajeLectura;

  /**
   * Filtrado con manejo explícito de datos faltantes.
   *
   * Antes, una universidad sin SAT_AVG, sin matrícula o sin política de admisión
   * simplemente se colaba por todos esos filtros sin ser evaluada. Ahora cada
   * filtro activo distingue tres casos: cumple (se queda), no cumple (se descarta)
   * y no se puede saber (se queda, pero marcada y ordenada al final).
   */
  const { universidadesFiltradas, faltantesPorId } = useMemo(() => {
    const textoBusqueda = busquedaDiferida.toLowerCase();

    // Un filtro solo "empuja al final" cuando el usuario realmente lo activó.
    const filtroSATActivo = puntajeTotal > 0;
    const filtroPrecioActivo = precioMaximo < PRECIO_MAXIMO_SLIDER;
    const filtroPoliticaActivo = exigirSAT !== 'todos';

    const faltantes = new Map<number, string[]>();

    const lista = universidades.filter((uni) => {
      // Filtros duros: aquí no hay ambigüedad, el dato siempre existe.
      if (textoBusqueda && !uni.INSTNM.toLowerCase().includes(textoBusqueda)) return false;
      if (estadoSeleccionado !== 'todos' && uni.STABBR !== estadoSeleccionado) return false;
      if (ciudadSeleccionada !== 'todas' && uni.CITY !== ciudadSeleccionada) return false;
      if (tipoUniversidad === 'publica' && uni.CONTROL !== 'Pública') return false;
      if (tipoUniversidad === 'privada' && (!uni.CONTROL || !uni.CONTROL.includes('Privada'))) return false;

      const falta: string[] = [];

      if (filtroSATActivo) {
        if (uni.SAT_AVG == null) falta.push('Sin promedio SAT');
        else if (puntajeTotal < uni.SAT_AVG) return false;
      }

      if (filtroPrecioActivo) {
        if (uni.TUITIONFEE_OUT == null) falta.push('Sin dato de matrícula');
        else if (uni.TUITIONFEE_OUT > precioMaximo) return false;
      }

      if (filtroPoliticaActivo) {
        if (uni.ADMCON7 == null) falta.push('Política SAT no informada');
        else if (exigirSAT === 'requerido' && uni.ADMCON7 !== 'Requerido') return false;
        else if (exigirSAT === 'opcional' && uni.ADMCON7 === 'Requerido') return false;
      }

      if (falta.length > 0 && uni._id != null) faltantes.set(uni._id, falta);
      return true;
    });

    return { universidadesFiltradas: lista, faltantesPorId: faltantes };
  }, [universidades, busquedaDiferida, estadoSeleccionado, ciudadSeleccionada, tipoUniversidad, precioMaximo, exigirSAT, puntajeTotal]);

  const universidadesOrdenadas = useMemo(() => {
    const hayFaltantes = faltantesPorId.size > 0;
    if (!hayFaltantes && ordenarPor === 'ninguno') return universidadesFiltradas;

    const sinDato = (u: Universidad) => (u._id != null && faltantesPorId.has(u._id) ? 1 : 0);

    return [...universidadesFiltradas].sort((a, b) => {
      // Primero las que sí se pudieron evaluar; las incompletas al final.
      const diferencia = sinDato(a) - sinDato(b);
      if (diferencia !== 0) return diferencia;

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
  }, [universidadesFiltradas, faltantesPorId, ordenarPor, ordenDireccion]);

  const datosGrafico = useMemo(
    () => universidadesFiltradas
      .filter(uni => uni.TUITIONFEE_OUT !== null && uni.TUITIONFEE_OUT !== undefined)
      .sort((a, b) => (b.TUITIONFEE_OUT || 0) - (a.TUITIONFEE_OUT || 0))
      .slice(0, 10)
      .map(uni => ({
        nombre: uni.INSTNM.length > 15 ? uni.INSTNM.substring(0, 15) + '...' : uni.INSTNM,
        costo: uni.TUITIONFEE_OUT,
        nombreCompleto: uni.INSTNM
      })),
    [universidadesFiltradas]
  );

  // --- PREPARACIÓN DE DATOS DEL MAPA GEO ---
  const datosMapaGeoEstados = useMemo(() => {
    const filas: (string | number | TooltipCell)[][] = [
      ["Estado", "Universidades", { role: 'tooltip', p: { html: true } }]
    ];

    const conteoPorEstado: Record<string, number> = {};

    universidadesFiltradas.forEach(uni => {
      if (uni.STABBR) conteoPorEstado[uni.STABBR] = (conteoPorEstado[uni.STABBR] || 0) + 1;
    });

    Object.keys(conteoPorEstado).sort().forEach(estado => {
      const nombreEstado = NOMBRES_ESTADOS[estado] ?? estado;
      const tooltip = `<div style="padding:8px; line-height:1.35; color:#111;">
      <strong style="font-size:1rem;">${nombreEstado}</strong><br />
      <span style="font-size:0.9rem; color:#555;">${conteoPorEstado[estado]} universidades</span>
    </div>`;

      filas.push([`US-${estado}`, conteoPorEstado[estado], tooltip]);
    });

    return filas;
  }, [universidadesFiltradas]);

  // Callbacks estables: sin esto, los mapas y el gráfico se redibujan en cada tecla.
  const seleccionarEstadoDesdeMapa = useCallback((st: string) => {
    setEstadoSeleccionado(st);
    setCiudadSeleccionada('todas');
  }, []);

  const seleccionarCiudadDesdeMapa = useCallback((ciudad: string) => {
    setCiudadSeleccionada(ciudad);
  }, []);

  const seleccionarUniversidad = useCallback((uni: Universidad) => {
    setUniversidadSeleccionada(uni);
  }, []);

  const volverDelDetalle = useCallback(() => setUniversidadSeleccionada(null), []);

  if (universidadSeleccionada) {
    return (
      <DetalleUniversidad
        uni={universidadSeleccionada}
        onVolver={volverDelDetalle}
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
              {estadosUnicos.map(st => <option key={st} value={st}>{NOMBRES_ESTADOS[st] ?? st}</option>)}
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
            nombresEstados={NOMBRES_ESTADOS}
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
          <section style={{ display: 'grid', gridTemplateColumns: 'minmax(450px, 1.3fr) minmax(350px, 1fr)', gap: '20px', alignItems: 'start' }}>
            <div className="saas-panel" style={{ padding: '0' }}>
              <MapaGeo
                datosMapaGeoEstados={datosMapaGeoEstados}
                universidadesFiltradas={universidadesFiltradas}
                estadoSeleccionado={estadoSeleccionado}
                onSeleccionarEstado={seleccionarEstadoDesdeMapa}
                onSeleccionarCiudad={seleccionarCiudadDesdeMapa}
              />
            </div>

            {/* Columna derecha: el gráfico conserva su alto natural y, cuando se abre
                el mapa del estado, el espacio de abajo lo llena el resumen en vez de
                estirar las barras. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="saas-panel" style={{ padding: '0', display: 'flex' }}>
                <GraficoBarras datosGrafico={datosGrafico} />
              </div>
              {estadoSeleccionado !== 'todos' && (
                <div className="saas-panel" style={{ padding: '0', flex: 1 }}>
                  <ResumenEstado
                    universidades={universidadesFiltradas}
                    estadoSeleccionado={estadoSeleccionado}
                  />
                </div>
              )}
            </div>
          </section>

          {/* SEPARADOR VISUAL ANTES DE LOS RESULTADOS */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)', margin: '4px 0' }} />

          {/* TABLA DE RESULTADOS TOTALMENTE VISIBLE ABAJO */}
          <section className="saas-panel" style={{ padding: '8px' }}>
            <ListaUniversidades
              universidadesFiltradas={universidadesFiltradas} universidadesOrdenadas={universidadesOrdenadas}
              faltantesPorId={faltantesPorId}
              totalUniversidades={universidades.length} ordenarPor={ordenarPor} setOrdenarPor={setOrdenarPor}
              ordenDireccion={ordenDireccion} setOrdenDireccion={setOrdenDireccion}
              onSeleccionar={seleccionarUniversidad}
            />
          </section>

        </main>
      </div>
    </div>
  );
}
