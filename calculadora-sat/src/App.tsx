import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import type { Universidad } from './types';
import { NOMBRES_ESTADOS } from './utils/estados';
import { crearIndiceBusqueda, buscarUniversidades } from './utils/busqueda';

import { Buscador } from './components/Buscador';
import { Filtros } from './components/Filtros';
import { tipoControl } from './utils/tipoControl';
import { useValorEstable } from './utils/useValorEstable';
import { posicionUSNews } from './data/rankingUSNews';
import { useMiLista, claveUniversidad } from './utils/useMiLista';
import type { TipoControl } from './utils/tipoControl';
import { MapaGeo } from './components/MapaGeo';
import { TopUniversidades } from './components/TopUniversidades';
import { elegirTop } from './utils/topUniversidades';
import { ListaUniversidades } from './components/ListaUniversidades';
import { ResumenEstado } from './components/ResumenEstado';
import { DetalleUniversidad } from './components/DetalleUniversidad';
import { ComparadorUniversidades } from './components/ComparadorUniversidades';
import { alcanzable, clasificar } from './utils/nivelSAT';
import type { Nivel } from './utils/nivelSAT';
import { AvisoFuentes } from './components/AvisoFuentes';
import { EVENTO_INICIO } from './components/BarraEduca';

/** Opción del filtro "¿Piden el SAT?" → valor de ADMCON7 (política de puntajes de IPEDS). */
const POLITICA_SAT: Record<string, string> = {
  requerido: 'Requerido',
  opcional: 'Considerado pero no requerido',
  'no-considera': 'Ni requerido ni recomendado',
};

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
  /** Total escrito directamente, para quien no recuerda sus dos secciones (0 = vacío). */
  const [puntajeSoloTotal, setPuntajeSoloTotal] = useState<number>(0);

  const [exigirSAT, setExigirSAT] = useState<string>('todos');
  /** "Tus posibilidades de entrar": niveles marcados (vacío = todos); solo con puntaje SAT. */
  const [nivelesSAT, setNivelesSAT] = useState<Nivel[]>([]);
  const [tiposUniversidad, setTiposUniversidad] = useState<TipoControl[]>([]);
  const [precioMaximo, setPrecioMaximo] = useState<number>(90000);

  const miLista = useMiLista();
  const [viendoMiLista, setViendoMiLista] = useState(false);

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
    // Un solo archivo con College Scorecard + IPEDS, unidos por UNITID. Lo genera
    // scripts/actualizar_datos.py (y cada semana el workflow actualizar-datos).
    fetch(`${import.meta.env.BASE_URL}universidades.json`)
      .then(r => r.json())
      .then((data: Universidad[]) => {
        // Se asigna un id estable una sola vez, al cargar.
        setUniversidades(data.map((uni, indice) => {
          const ranking = posicionUSNews(uni);
          return {
          ...uni,
          // Protección por si el colab vuelve a exportarlos como texto o con "PS" (dato suprimido).
          MD_EARN_WNE_4YR: aNumero(uni.MD_EARN_WNE_4YR),
          COUNT_WNE_4YR: aNumero(uni.COUNT_WNE_4YR),
          USNEWS_ORDEN: ranking ? ranking.puesto + (ranking.lista === 'liberal-arts' ? 1000 : 0) : null,
          _id: indice,
          };
        }));
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

  // El total sale de las dos secciones o, si no las hay, del total escrito a mano. Con una
  // sola sección no hay total (ni filtro SAT): no se puede adivinar la otra.
  const puntajeTotal = puntajeMath > 0 && puntajeLectura > 0 ? puntajeMath + puntajeLectura : puntajeSoloTotal;

  // Los controles (deslizador, casillas) se actualizan al instante con los valores de
  // arriba. El filtrado y todo lo que se dibuja con él usan esta copia diferida: React
  // la procesa en segundo plano y, si el usuario sigue moviendo un filtro, descarta el
  // trabajo viejo en vez de trabarse en cada paso.
  const filtros = useDeferredValue(useMemo(() => ({
    estado: estadoSeleccionado,
    ciudad: ciudadSeleccionada,
    tipos: tiposUniversidad,
    precio: precioMaximo,
    politica: exigirSAT,
    sat: puntajeTotal,
    niveles: nivelesSAT,
  }), [estadoSeleccionado, ciudadSeleccionada, tiposUniversidad, precioMaximo, exigirSAT, puntajeTotal, nivelesSAT]));

  /**
   * Filtrado con manejo explícito de datos faltantes.
   *
   * Antes, una universidad sin SAT_AVG, sin matrícula o sin política de admisión
   * simplemente se colaba por todos esos filtros sin ser evaluada. Ahora cada
   * filtro activo distingue tres casos: cumple (se queda), no cumple (se descarta)
   * y no se puede saber (se queda, pero marcada y ordenada al final).
   */
  const { universidadesFiltradas, universidadesSinUbicacion, faltantesPorId, conteoNiveles, conteoPolitica } = useMemo(() => {
    const { estado, ciudad, tipos, precio, politica, sat } = filtros;
    // Un filtro solo "empuja al final" cuando el usuario realmente lo activó.
    const filtroSATActivo = sat > 0;
    const filtroPrecioActivo = precio < PRECIO_MAXIMO_SLIDER;
    const filtroPoliticaActivo = politica !== 'todos';

    const faltantes = new Map<number, string[]>();

    // El mapa nacional usa todas las que pasan los filtros MENOS estado/ciudad;
    // si no, al elegir un estado los demás quedan sin datos y no se pueden clickear.
    const sinUbicacion: Universidad[] = [];
    // Las que pasan todos los filtros menos "¿Piden el SAT?": con ellas se cuenta cuántas
    // quedarían con cada opción de ese filtro, antes de elegirla.
    const sinFiltroPolitica: Universidad[] = [];

    const lista = universidades.filter((uni) => {
      // Filtros duros: aquí no hay ambigüedad, el dato siempre existe.
      if (resultadoBusqueda && (uni._id == null || !resultadoBusqueda.posicion.has(uni._id))) return false;
      if (tipos.length > 0) {
        const tipo = tipoControl(uni.CONTROL);
        if (tipo == null || !tipos.includes(tipo)) return false;
      }

      const falta: string[] = [];

      // Quedan las de probabilidad alta, intermedia y baja; solo salen las prácticamente inalcanzables.
      if (filtroSATActivo) {
        const entra = alcanzable(uni, sat);
        if (entra == null) falta.push('Sin datos SAT');
        else if (!entra) return false;
      }

      if (filtroPrecioActivo) {
        if (uni.TUITIONFEE_OUT == null) falta.push('Sin dato de matrícula');
        else if (uni.TUITIONFEE_OUT > precio) return false;
      }

      // Las que no informan su política solo aparecen en "Todos": mostrarlas bajo
      // "Obligatorio" u "Opcional" haría creer que lo son.
      const cumplePolitica = !filtroPoliticaActivo || uni.ADMCON7 === POLITICA_SAT[politica];

      if (cumplePolitica) sinUbicacion.push(uni);
      if (estado !== 'todos' && uni.STABBR !== estado) return false;
      if (ciudad !== 'todas' && uni.CITY !== ciudad) return false;
      sinFiltroPolitica.push(uni);
      if (!cumplePolitica) return false;

      if (falta.length > 0 && uni._id != null) faltantes.set(uni._id, falta);
      return true;
    });

    // Cuántas quedarían con cada opción de "¿Piden el SAT?" (con los niveles marcados, si hay).
    const contarPolitica = (lista: Universidad[]): Record<string, number> => {
      const conteo: Record<string, number> = { todos: lista.length };
      for (const [opcion, valor] of Object.entries(POLITICA_SAT)) {
        conteo[opcion] = lista.filter(u => u.ADMCON7 === valor).length;
      }
      return conteo;
    };

    // Cuántas hay de cada nivel, contadas ANTES de elegir uno: así el menú
    // "Tus posibilidades de entrar" muestra cuántas hay de cada una.
    if (!filtroSATActivo) {
      return {
        universidadesFiltradas: lista, universidadesSinUbicacion: sinUbicacion, faltantesPorId: faltantes,
        conteoNiveles: null, conteoPolitica: contarPolitica(sinFiltroPolitica),
      };
    }
    const conteo: Record<Nivel, number> = { 'Alta probabilidad': 0, 'Intermedia': 0, 'Baja': 0 };
    for (const uni of lista) {
      const n = clasificar(uni, sat);
      if (n) conteo[n]++;
    }
    // Con niveles marcados quedan solo los de esos niveles (las sin rango SAT no se pueden clasificar).
    const delNivel = (uni: Universidad) => {
      if (filtros.niveles.length === 0) return true;
      const n = clasificar(uni, sat);
      return n != null && filtros.niveles.includes(n);
    };
    return {
      universidadesFiltradas: lista.filter(delNivel),
      universidadesSinUbicacion: sinUbicacion.filter(delNivel),
      faltantesPorId: faltantes,
      conteoNiveles: conteo,
      conteoPolitica: contarPolitica(sinFiltroPolitica.filter(delNivel)),
    };
  }, [universidades, resultadoBusqueda, filtros]);

  // Filtros activos, con nombre para explicar qué quita "Limpiar" (el puntaje SAT y
  // estado+ciudad cuentan como uno cada uno).
  const filtrosActivos = ([
    [puntajeMath > 0 || puntajeLectura > 0 || puntajeSoloTotal > 0, 'puntaje SAT'],
    [estadoSeleccionado !== 'todos', 'estado'],
    [exigirSAT !== 'todos', '¿piden el SAT?'],
    // Marcar los tres niveles equivale a no filtrar.
    [puntajeTotal > 0 && nivelesSAT.length > 0 && nivelesSAT.length < 3, 'tus posibilidades de entrar'],
    // Marcar los tres tipos equivale a no filtrar.
    [tiposUniversidad.length === 1, 'tipo de universidad'],
    [precioMaximo < PRECIO_MAXIMO_SLIDER, 'matrícula máxima'],
    [busquedaNombre.trim() !== '', `búsqueda "${busquedaNombre.trim()}"`],
  ] as const).filter(([activo]) => activo).map(([, nombre]) => nombre);

  const limpiarFiltros = useCallback(() => {
    setBusquedaNombre('');
    setPuntajeMath(0);
    setPuntajeLectura(0);
    setPuntajeSoloTotal(0);
    setEstadoSeleccionado('todos');
    setCiudadSeleccionada('todas');
    setExigirSAT('todos');
    setNivelesSAT([]);
    setTiposUniversidad([]);
    setPrecioMaximo(PRECIO_MAXIMO_SLIDER);
  }, []);

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

  // "Top universidades": ranking U.S. News y, si no alcanza, SAT promedio más alto.
  // 8 en todo el país; 5 con un estado elegido, porque arriba va también su resumen.
  const topUniversidades = useMemo(
    () => elegirTop(universidadesFiltradas, filtros.estado !== 'todos' ? 5 : 8),
    [universidadesFiltradas, filtros.estado]
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
      const tooltip = `<div style="padding:8px 10px; line-height:1.35; color:#26292b; font-family:Lexend, sans-serif;">
      <strong style="font-size:15px;">${nombreEstado}</strong><br />
      <span style="font-size:13px; color:#5d6467;">${conteoPorEstado[estado]} universidades · clic para ver condados</span>
    </div>`;

      // Con un estado elegido, el valor solo marca "elegido (1) / resto (0)" para
      // pintar ese estado y dejar los demás en gris. El tooltip conserva el conteo real.
      const valor = filtros.estado === 'todos'
        ? conteoPorEstado[estado]
        : estado === filtros.estado ? 1 : 0;

      filas.push([`US-${estado}`, valor, tooltip]);
    });

    return filas;
  }, [universidadesSinUbicacion, filtros.estado]);

  // El mapa de Google y el de condados son lo más caro de redibujar y no se pueden
  // interrumpir: mientras un filtro cambia seguido, esperan a que se quede quieto.
  const mapa = useValorEstable(
    useMemo(() => ({ datos: datosMapaGeoEstados, universidades: universidadesFiltradas, estado: filtros.estado }),
      [datosMapaGeoEstados, universidadesFiltradas, filtros.estado]),
    250,
  );

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
    // Solo se recuerda el scroll de la lista principal, no el de otra ficha o de Mi lista.
    if (window.history.state?.detalleId == null && window.history.state?.vista == null) {
      scrollDeLista.current = window.scrollY;
    }
    window.history.pushState({ detalleId: uni._id }, '');
    setUniversidadSeleccionada(uni);
    window.scrollTo(0, 0);
  }, []);

  // "Mi lista" también es una entrada del historial: "atrás" vuelve a donde estaba.
  const abrirMiLista = useCallback(() => {
    if (window.history.state?.vista !== 'mi-lista' && window.history.state?.detalleId == null) {
      scrollDeLista.current = window.scrollY;
    }
    window.history.pushState({ vista: 'mi-lista' }, '');
    setUniversidadSeleccionada(null);
    setViendoMiLista(true);
    window.scrollTo(0, 0);
  }, []);

  const volverDeMiLista = useCallback(() => {
    if (window.history.state?.vista === 'mi-lista') window.history.back();
    else setViendoMiLista(false);
  }, []);

  // Las guardadas, en el orden en que se guardaron (las que ya no existen en la data se ignoran).
  const universidadesGuardadas = useMemo(() => {
    const porClave = new Map(universidades.map(u => [claveUniversidad(u), u]));
    return miLista.claves.map(c => porClave.get(c)).filter((u): u is Universidad => u != null);
  }, [universidades, miLista.claves]);

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
          setUniversidadSeleccionada(uni);
          window.scrollTo(0, 0);
        }
      } else if (e.state?.vista === 'mi-lista') {
        setUniversidadSeleccionada(null);
        setViendoMiLista(true);
        window.scrollTo(0, 0);
      } else {
        restaurarScroll.current = true;
        setUniversidadSeleccionada(null);
        setViendoMiLista(false);
      }
    };
    window.addEventListener('popstate', alNavegar);
    return () => window.removeEventListener('popstate', alNavegar);
  }, [universidades]);

  // El logo y "College Finder" de la barra llevan a la vista principal (con los filtros
  // como estaban). Desde una ficha o Mi lista es una entrada nueva: "atrás" vuelve ahí.
  useEffect(() => {
    const alInicio = () => {
      const estado = window.history.state;
      if (estado?.detalleId != null || estado?.vista != null) window.history.pushState(null, '');
      setUniversidadSeleccionada(null);
      setViendoMiLista(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener(EVENTO_INICIO, alInicio);
    return () => window.removeEventListener(EVENTO_INICIO, alInicio);
  }, []);

  // Al volver a la lista, se recupera la posición donde estaba el usuario.
  useLayoutEffect(() => {
    if (universidadSeleccionada == null && !viendoMiLista && restaurarScroll.current) {
      restaurarScroll.current = false;
      window.scrollTo(0, scrollDeLista.current);
    }
  }, [universidadSeleccionada, viendoMiLista]);

  // Contenido de la vista actual: ficha, Mi lista o la página principal.
  const vista = (() => {
    if (universidadSeleccionada) {
      return (
        <DetalleUniversidad
          uni={universidadSeleccionada}
          onVolver={volverDelDetalle}
          guardada={miLista.guardadas.has(claveUniversidad(universidadSeleccionada))}
          onAlternarGuardada={miLista.alternar}
          cantidadMiLista={universidadesGuardadas.length}
          onVerMiLista={abrirMiLista}
          universidades={universidades}
          onSeleccionar={seleccionarUniversidad}
        />
      );
    }

    if (viendoMiLista) {
      return (
        <ComparadorUniversidades
          universidades={universidadesGuardadas}
          onSeleccionar={seleccionarUniversidad}
          onQuitar={miLista.quitar}
          onVaciar={miLista.vaciar}
          onVolver={volverDeMiLista}
        />
      );
    }

    // Lo que se muestra junto a los resultados va con los filtros ya aplicados (diferidos).
    const hayFiltrosUbicacion = filtros.estado !== 'todos';

    return (
      <>
        <header className="cabecera">
          <div>
            <h1>Educa College Finder</h1>
            <button type="button" className="boton boton-mi-lista" onClick={abrirMiLista}>
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3.2z" /></svg>
              Mi lista y comparar
              <span className="contador numero">{universidadesGuardadas.length}</span>
            </button>
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
            puntajeSoloTotal={puntajeSoloTotal} setPuntajeSoloTotal={setPuntajeSoloTotal}
            puntajeTotal={puntajeTotal} exigirSAT={exigirSAT} setExigirSAT={setExigirSAT}
            tiposUniversidad={tiposUniversidad} setTiposUniversidad={setTiposUniversidad}
            precioMaximo={precioMaximo} setPrecioMaximo={setPrecioMaximo}
            nombresEstados={NOMBRES_ESTADOS}
            filtrosActivos={filtrosActivos} onLimpiar={limpiarFiltros}
            conteoNiveles={conteoNiveles}
            conteoPolitica={conteoPolitica}
            nivelesSAT={nivelesSAT} setNivelesSAT={setNivelesSAT}
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
                {hayFiltrosUbicacion && ` · en ${NOMBRES_ESTADOS[filtros.estado] ?? filtros.estado}`}
                {filtros.ciudad !== 'todas' && `, ${filtros.ciudad}`}
                {filtrosActivos.length > 0 && (
                  <>
                    {' · '}
                    <button type="button" className="boton-limpiar boton-limpiar-enlace" onClick={limpiarFiltros}
                      title={`Quita: ${filtrosActivos.join(', ')}`}>
                      Quitar filtros
                    </button>
                  </>
                )}
              </span>
            </div>

            <section className="tablero">
              <MapaGeo
                datosMapaGeoEstados={mapa.datos}
                universidadesFiltradas={mapa.universidades}
                estadoSeleccionado={mapa.estado}
                onSeleccionarEstado={seleccionarEstadoDesdeMapa}
                onSeleccionarCiudad={seleccionarCiudadDesdeMapa}
              />

              {/* El gráfico conserva su alto natural y, con un estado elegido, debajo
                  va el resumen en vez de estirar las barras. */}
              <div className="tablero-lateral">
                {/* Primero lo que se sabe del lugar elegido; debajo, las mejores de ahí. */}
                {hayFiltrosUbicacion && (
                  <ResumenEstado
                    universidades={universidadesFiltradas}
                    estadoSeleccionado={filtros.estado}
                  />
                )}
                <TopUniversidades
                  universidades={topUniversidades}
                  lugar={hayFiltrosUbicacion ? (filtros.ciudad !== 'todas' ? filtros.ciudad : NOMBRES_ESTADOS[filtros.estado] ?? filtros.estado) : null}
                  onSeleccionar={seleccionarUniversidad}
                />
              </div>
            </section>

            <ListaUniversidades
              universidadesFiltradas={universidadesFiltradas} universidadesOrdenadas={universidadesOrdenadas}
              faltantesPorId={faltantesPorId}
              totalUniversidades={universidades.length} ordenarPor={ordenarPor} setOrdenarPor={setOrdenarPor}
              ordenDireccion={ordenDireccion} setOrdenDireccion={setOrdenDireccion}
              onSeleccionar={seleccionarUniversidad}
              guardadas={miLista.guardadas} onAlternarGuardada={miLista.alternar}
              puntajeSAT={filtros.sat}
            />
          </main>
        </div>
      </>
    );
  })();

  return (
    <>
      {vista}
      <AvisoFuentes />
    </>
  );
}
