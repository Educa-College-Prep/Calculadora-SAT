import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import type { Universidad } from './types';
import { NOMBRES_ESTADOS } from './utils/estados';
import { crearIndiceBusqueda, buscarUniversidades } from './utils/busqueda';

import { Buscador } from './components/Buscador';
import { Filtros } from './components/Filtros';
import { MapaGeo } from './components/MapaGeo';
import { GraficoBarras } from './components/GraficoBarras';
import { ListaUniversidades } from './components/ListaUniversidades';
import { ResumenEstado } from './components/ResumenEstado';
import { DetalleUniversidad } from './components/DetalleUniversidad';

type TooltipCell = { role: 'tooltip'; p: { html: true } };

/** Convierte "123" → 123; "PS" (Privacy Suppressed), vacío o texto raro → null. */
function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

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

  // Búsqueda con alias ("MIT") y tolerancia a errores ("Hrvrd"). El índice se arma una sola vez.
  const indiceBusqueda = useMemo(() => crearIndiceBusqueda(universidades), [universidades]);
  const resultadoBusqueda = useMemo(
    () => buscarUniversidades(indiceBusqueda, busquedaDiferida),
    [indiceBusqueda, busquedaDiferida]
  );
  const sugerencias = useMemo(() => resultadoBusqueda?.ordenadas.slice(0, 8) ?? [], [resultadoBusqueda]);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    // Datos de IPEDS (admisión por sexo ADM 2024 y becas SFA 2023-24) vienen en un archivo
    // aparte, con clave "INSTNM|CITY|STABBR". Si falla, la web sigue funcionando sin ellos.
    const admisiones: Promise<Record<string, Partial<Universidad>>> =
      fetch(`${base}ipeds_2024.json`)
        .then(r => r.json())
        .catch(() => ({}));

    Promise.all([fetch(`${base}universidades_seleccionadas6.json`).then(r => r.json()), admisiones])
      .then(([data, adm]: [Universidad[], Record<string, Partial<Universidad>>]) => {
        // Se asigna un id estable una sola vez, al cargar.
        setUniversidades(data.map((uni, indice) => ({
          ...uni,
          ...adm[`${uni.INSTNM}|${uni.CITY}|${uni.STABBR}`],
          // Protección por si el colab vuelve a exportarlos como texto o con "PS" (dato suprimido).
          MD_EARN_WNE_4YR: aNumero(uni.MD_EARN_WNE_4YR),
          COUNT_WNE_4YR: aNumero(uni.COUNT_WNE_4YR),
          _id: indice,
        })));
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

  // Solo hay total (y filtro SAT) cuando se ingresaron las dos secciones.
  const puntajeTotal = puntajeMath > 0 && puntajeLectura > 0 ? puntajeMath + puntajeLectura : 0;

  /**
   * Filtrado con manejo explícito de datos faltantes.
   *
   * Antes, una universidad sin SAT_AVG, sin matrícula o sin política de admisión
   * simplemente se colaba por todos esos filtros sin ser evaluada. Ahora cada
   * filtro activo distingue tres casos: cumple (se queda), no cumple (se descarta)
   * y no se puede saber (se queda, pero marcada y ordenada al final).
   */
  const { universidadesFiltradas, universidadesSinUbicacion, faltantesPorId } = useMemo(() => {
    // Un filtro solo "empuja al final" cuando el usuario realmente lo activó.
    const filtroSATActivo = puntajeTotal > 0;
    const filtroPrecioActivo = precioMaximo < PRECIO_MAXIMO_SLIDER;
    const filtroPoliticaActivo = exigirSAT !== 'todos';

    const faltantes = new Map<number, string[]>();

    // El mapa nacional usa todas las que pasan los filtros MENOS estado/ciudad;
    // si no, al elegir un estado los demás quedan sin datos y no se pueden clickear.
    const sinUbicacion: Universidad[] = [];

    const lista = universidades.filter((uni) => {
      // Filtros duros: aquí no hay ambigüedad, el dato siempre existe.
      if (resultadoBusqueda && (uni._id == null || !resultadoBusqueda.posicion.has(uni._id))) return false;
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

      sinUbicacion.push(uni);
      if (estadoSeleccionado !== 'todos' && uni.STABBR !== estadoSeleccionado) return false;
      if (ciudadSeleccionada !== 'todas' && uni.CITY !== ciudadSeleccionada) return false;

      if (falta.length > 0 && uni._id != null) faltantes.set(uni._id, falta);
      return true;
    });

    return { universidadesFiltradas: lista, universidadesSinUbicacion: sinUbicacion, faltantesPorId: faltantes };
  }, [universidades, resultadoBusqueda, estadoSeleccionado, ciudadSeleccionada, tipoUniversidad, precioMaximo, exigirSAT, puntajeTotal]);

  const universidadesOrdenadas = useMemo(() => {
    const hayFaltantes = faltantesPorId.size > 0;
    // Sin orden elegido pero con búsqueda activa, se ordena por relevancia (MIT antes que Smith College).
    const posicion = resultadoBusqueda?.posicion;
    if (!hayFaltantes && ordenarPor === 'ninguno' && !posicion) return universidadesFiltradas;

    const sinDato = (u: Universidad) => (u._id != null && faltantesPorId.has(u._id) ? 1 : 0);

    return [...universidadesFiltradas].sort((a, b) => {
      // Primero las que sí se pudieron evaluar; las incompletas al final.
      const diferencia = sinDato(a) - sinDato(b);
      if (diferencia !== 0) return diferencia;

      if (ordenarPor === 'ninguno') {
        return posicion ? (posicion.get(a._id ?? -1) ?? 0) - (posicion.get(b._id ?? -1) ?? 0) : 0;
      }
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
  }, [universidadesFiltradas, faltantesPorId, ordenarPor, ordenDireccion, resultadoBusqueda]);

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

    universidadesSinUbicacion.forEach(uni => {
      if (uni.STABBR) conteoPorEstado[uni.STABBR] = (conteoPorEstado[uni.STABBR] || 0) + 1;
    });

    Object.keys(conteoPorEstado).sort().forEach(estado => {
      const nombreEstado = NOMBRES_ESTADOS[estado] ?? estado;
      const tooltip = `<div style="padding:8px 10px; line-height:1.35; color:#26292b; font-family:Archivo, sans-serif;">
      <strong style="font-size:15px;">${nombreEstado}</strong><br />
      <span style="font-size:13px; color:#5d6467;">${conteoPorEstado[estado]} universidades · clic para ver condados</span>
    </div>`;

      // Con un estado elegido, el valor solo marca "elegido (1) / resto (0)" para
      // pintar ese estado y dejar los demás en gris. El tooltip conserva el conteo real.
      const valor = estadoSeleccionado === 'todos'
        ? conteoPorEstado[estado]
        : estado === estadoSeleccionado ? 1 : 0;

      filas.push([`US-${estado}`, valor, tooltip]);
    });

    return filas;
  }, [universidadesSinUbicacion, estadoSeleccionado]);

  // Callbacks estables: sin esto, los mapas y el gráfico se redibujan en cada tecla.
  // Clic en el estado que ya está elegido = volver a ver todo el país.
  const seleccionarEstadoDesdeMapa = useCallback((st: string) => {
    setEstadoSeleccionado(prev => (prev === st ? 'todos' : st));
    setCiudadSeleccionada('todas');
  }, []);

  const seleccionarCiudadDesdeMapa = useCallback((ciudad: string) => {
    setCiudadSeleccionada(ciudad);
  }, []);

  // El detalle se abre como una entrada del historial del navegador: así el botón
  // "atrás" vuelve a la lista (y "adelante" reabre la universidad) en vez de salir de la web.
  const scrollDeLista = useRef(0);
  const restaurarScroll = useRef(false);

  const seleccionarUniversidad = useCallback((uni: Universidad) => {
    scrollDeLista.current = window.scrollY;
    window.history.pushState({ detalleId: uni._id }, '');
    setUniversidadSeleccionada(uni);
    window.scrollTo(0, 0);
  }, []);

  // El botón "Volver" de la página hace lo mismo que el "atrás" del navegador.
  const volverDelDetalle = useCallback(() => {
    if (window.history.state?.detalleId != null) window.history.back();
    else setUniversidadSeleccionada(null);
  }, []);

  useEffect(() => {
    const alNavegar = (e: PopStateEvent) => {
      const id = e.state?.detalleId;
      if (id != null) {
        const uni = universidades.find(u => u._id === id);
        if (uni) {
          scrollDeLista.current = window.scrollY;
          setUniversidadSeleccionada(uni);
          window.scrollTo(0, 0);
        }
      } else {
        restaurarScroll.current = true;
        setUniversidadSeleccionada(null);
      }
    };
    window.addEventListener('popstate', alNavegar);
    return () => window.removeEventListener('popstate', alNavegar);
  }, [universidades]);

  // Al volver a la lista, se recupera la posición donde estaba el usuario.
  useLayoutEffect(() => {
    if (universidadSeleccionada == null && restaurarScroll.current) {
      restaurarScroll.current = false;
      window.scrollTo(0, scrollDeLista.current);
    }
  }, [universidadSeleccionada]);

  if (universidadSeleccionada) {
    return (
      <DetalleUniversidad
        uni={universidadSeleccionada}
        onVolver={volverDelDetalle}
      />
    );
  }

  const hayFiltrosUbicacion = estadoSeleccionado !== 'todos';

  return (
    <>
      <header className="cabecera">
        <div>
          <h1>Calculadora SAT</h1>
          <p className="cabecera-bajada">
            Encuentra universidades de EE.&nbsp;UU. que encajan con tu puntaje, tu presupuesto y el lugar donde quieres estudiar.
          </p>
        </div>
        <Buscador
          busquedaNombre={busquedaNombre} setBusquedaNombre={setBusquedaNombre}
          mostrarSugerencias={mostrarSugerencias} setMostrarSugerencias={setMostrarSugerencias}
          sugerencias={sugerencias} sonAproximadas={resultadoBusqueda?.aproximado ?? false}
          onSeleccionar={seleccionarUniversidad}
        />
      </header>

      <div className="cuerpo">
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

        <main className="columna-principal">
          {/* Lo primero que se lee: cuántas universidades quedan con lo que marcaste. */}
          <div className="resultado" aria-live="polite">
            <span className="resultado-cifra">{universidadesFiltradas.length.toLocaleString()}</span>
            <span className="resultado-texto">
              {universidadesFiltradas.length === 1 ? 'universidad encaja' : 'universidades encajan'} con lo que marcaste
            </span>
            <span className="resultado-nota">
              de {universidades.length.toLocaleString()} en la base de datos
              {hayFiltrosUbicacion && ` · en ${NOMBRES_ESTADOS[estadoSeleccionado] ?? estadoSeleccionado}`}
              {ciudadSeleccionada !== 'todas' && `, ${ciudadSeleccionada}`}
            </span>
          </div>

          <section className="tablero">
            <MapaGeo
              datosMapaGeoEstados={datosMapaGeoEstados}
              universidadesFiltradas={universidadesFiltradas}
              estadoSeleccionado={estadoSeleccionado}
              onSeleccionarEstado={seleccionarEstadoDesdeMapa}
              onSeleccionarCiudad={seleccionarCiudadDesdeMapa}
            />

            {/* El gráfico conserva su alto natural y, con un estado elegido, debajo
                va el resumen en vez de estirar las barras. */}
            <div className="tablero-lateral">
              <GraficoBarras datosGrafico={datosGrafico} />
              {hayFiltrosUbicacion && (
                <ResumenEstado
                  universidades={universidadesFiltradas}
                  estadoSeleccionado={estadoSeleccionado}
                />
              )}
            </div>
          </section>

          <ListaUniversidades
            universidadesFiltradas={universidadesFiltradas} universidadesOrdenadas={universidadesOrdenadas}
            faltantesPorId={faltantesPorId}
            totalUniversidades={universidades.length} ordenarPor={ordenarPor} setOrdenarPor={setOrdenarPor}
            ordenDireccion={ordenDireccion} setOrdenDireccion={setOrdenDireccion}
            onSeleccionar={seleccionarUniversidad}
          />
        </main>
      </div>
    </>
  );
}
