import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useDeferredValue, useRef } from 'react';
import type { Universidad } from './types';
import { NOMBRES_ESTADOS } from './utils/estados';
import { crearIndiceBusqueda, buscarUniversidades } from './utils/busqueda';

import { Buscador } from './components/Buscador';
import { Filtros } from './components/Filtros';
import { tipoControl } from './utils/tipoControl';
import { calcularCostoVida } from './utils/costos';
import { leerFiltrosDeURL, escribirFiltrosEnURL, PRECIO_MAXIMO_SLIDER } from './utils/filtrosURL';
import type { FiltrosURL } from './utils/filtrosURL';
import { posicionUSNews } from './data/rankingUSNews';
import { useMiLista, claveUniversidad, publicarCantidadMiLista } from './utils/useMiLista';
import type { TipoControl } from './utils/tipoControl';
import { ListaUniversidades } from './components/ListaUniversidades';
import { FlujoPasos } from './components/FlujoPasos';
import { CARRERAS_COMUNES, TITULOS_PASOS } from './data/pasos';
import { BurbujaMapa } from './components/BurbujaMapa';
import { useArchivoCarreras, nombreCarrera } from './utils/salariosCarreras';
import { DetalleUniversidad } from './components/DetalleUniversidad';
import { ComparadorUniversidades } from './components/ComparadorUniversidades';
import type { AvisoLista } from './components/ComparadorUniversidades';
import { alcanzable, clasificar } from './utils/nivelSAT';
import type { Nivel } from './utils/nivelSAT';
import { AvisoFuentes } from './components/AvisoFuentes';
import { usePresencia } from './utils/usePresencia';
import { EVENTO_INICIO, EVENTO_MI_LISTA, ID_BUSCADOR_BARRA } from './components/BarraEduca';
import { createPortal } from 'react-dom';
import type { Sugerencia } from './components/FlujoPasos';
import { PRESUPUESTOS } from './data/pasos';

/** Opción del filtro "¿Piden el SAT?" → valor de ADMCON7 (política de puntajes de IPEDS). */
const POLITICA_SAT: Record<string, string> = {
  requerido: 'Requerido',
  opcional: 'Considerado pero no requerido',
  'no-considera': 'Ni requerido ni recomendado',
};
/** "No lo exigen" (la pregunta del paso 4): las que lo hacen opcional más las que no lo miran. */
const NO_EXIGEN_SAT = [POLITICA_SAT.opcional, POLITICA_SAT['no-considera']];


/** Convierte "123" → 123; "PS" (Privacy Suppressed), vacío o texto raro → null. */
function aNumero(valor: unknown): number | null {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== 'string' || valor.trim() === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}


export default function App() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [universidadSeleccionada, setUniversidadSeleccionada] = useState<Universidad | null>(null);

  // Los filtros se leen de la URL una sola vez, al abrir: así se pueden compartir, guardar en
  // marcadores y sobreviven a una recarga. Lo que no venga en la URL queda por defecto.
  const [inicial] = useState(() => leerFiltrosDeURL(window.location.search));

  const [busquedaNombre, setBusquedaNombre] = useState<string>(inicial.busqueda);
  const [mostrarSugerencias, setMostrarSugerencias] = useState<boolean>(false);

  const [estadoSeleccionado, setEstadoSeleccionado] = useState<string>(inicial.estado);
  /** Varios estados a la vez (desde los pasos o la burbuja del mapa). Con uno solo se usa estadoSeleccionado. */
  const [estadosVarios, setEstadosVarios] = useState<string[]>(inicial.estados);
  /** "Dónde no quiero estudiar": estados descartados; quedan todos los demás. */
  const [estadosExcluidos, setEstadosExcluidos] = useState<string[]>(inicial.excluidos);
  // En los resultados el panel de filtros empieza cerrado: los pasos ya preguntaron lo principal y,
  // abierto, en celular tapaba toda la lista. Se abre con "Más filtros".
  const [masFiltros, setMasFiltros] = useState(false);
  const [ciudadSeleccionada, setCiudadSeleccionada] = useState<string>(inicial.ciudad);
  /** Códigos CIP de las carreras que le interesan: quedan las que ofrecen alguna, ordenadas por salario. */
  const [carreras, setCarreras] = useState<string[]>(inicial.carreras);
  /** "Aún no lo presento" en el paso del SAT: solo cambia cómo se resume, no filtra nada. */
  const [satNoRendido, setSatNoRendido] = useState(false);

  // "Cuéntanos de ti" en 4 pasos (1 a 4) y después los resultados (5). Quien llega con filtros en
  // la URL (un enlace compartido, una recarga) ya respondió: va directo a los resultados.
  const [paso, setPaso] = useState<number>(() => (new URLSearchParams(window.location.search).toString() ? 5 : 1));
  const enPasos = paso <= 4;

  const [puntajeMath, setPuntajeMath] = useState<number>(inicial.puntajeMath);
  const [puntajeLectura, setPuntajeLectura] = useState<number>(inicial.puntajeLectura);
  /** Total escrito directamente, para quien no recuerda sus dos secciones (0 = vacío). */
  const [puntajeSoloTotal, setPuntajeSoloTotal] = useState<number>(inicial.puntajeSoloTotal);

  const [exigirSAT, setExigirSAT] = useState<string>(inicial.exigirSAT);
  /** "Tus posibilidades de entrar": niveles marcados (vacío = todos); solo con puntaje SAT. */
  const [nivelesSAT, setNivelesSAT] = useState<Nivel[]>(inicial.niveles);
  /** "Verlas": puntaje con el que se pidió ver las que piden bastante más (0 = no). Al cambiar el puntaje deja de valer solo. */
  const [verEncimaDe, setVerEncimaDe] = useState(0);
  const [tiposUniversidad, setTiposUniversidad] = useState<TipoControl[]>(inicial.tipos);
  const [precioMaximo, setPrecioMaximo] = useState<number>(inicial.precio);

  const miLista = useMiLista();
  const [viendoMiLista, setViendoMiLista] = useState(false);

  const [ordenarPor, setOrdenarPor] = useState<string>(inicial.ordenarPor);
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>(inicial.ordenDireccion);

  /** Vuelca unos filtros de la URL en los controles: se usa al volver con "atrás". */
  const aplicarFiltrosURL = useCallback((f: FiltrosURL) => {
    setBusquedaNombre(f.busqueda);
    setEstadoSeleccionado(f.estado);
    setEstadosVarios(f.estados);
    setEstadosExcluidos(f.excluidos);
    setCiudadSeleccionada(f.ciudad);
    setCarreras(f.carreras);
    setPuntajeMath(f.puntajeMath);
    setPuntajeLectura(f.puntajeLectura);
    setPuntajeSoloTotal(f.puntajeSoloTotal);
    setExigirSAT(f.exigirSAT);
    setNivelesSAT(f.niveles);
    setTiposUniversidad(f.tipos);
    setPrecioMaximo(f.precio);
    setOrdenarPor(f.ordenarPor);
    setOrdenDireccion(f.ordenDireccion);
  }, []);

  // La URL es el registro de los filtros: se reescribe al cambiar alguno, sin crear entradas
  // de historial. Con una pausa corta, para no escribir en cada tecla del buscador ni en cada
  // paso del deslizador de costo.
  useEffect(() => {
    const espera = setTimeout(() => escribirFiltrosEnURL({
      busqueda: busquedaNombre,
      estado: estadoSeleccionado,
      estados: estadosVarios,
      excluidos: estadosExcluidos,
      ciudad: ciudadSeleccionada,
      carreras,
      puntajeMath,
      puntajeLectura,
      puntajeSoloTotal,
      exigirSAT,
      niveles: nivelesSAT,
      tipos: tiposUniversidad,
      precio: precioMaximo,
      ordenarPor,
      ordenDireccion,
    }), 300);
    return () => clearTimeout(espera);
  }, [busquedaNombre, estadoSeleccionado, estadosVarios, estadosExcluidos, ciudadSeleccionada, carreras, puntajeMath, puntajeLectura,
      puntajeSoloTotal, exigirSAT, nivelesSAT, tiposUniversidad, precioMaximo, ordenarPor, ordenDireccion]);

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

  // Lo que se hace apenas llegan los datos: sumar las universidades de un enlace compartido
  // (se define más abajo, junto a Mi lista).
  const alCargarDatos = useRef<(cargadas: Universidad[]) => void>(() => {});

  useEffect(() => {
    // Un solo archivo con College Scorecard + IPEDS, unidos por UNITID. Lo genera
    // scripts/actualizar_datos.py (y cada semana el workflow actualizar-datos).
    fetch(`${import.meta.env.BASE_URL}universidades.json`)
      .then(r => r.json())
      .then((data: Universidad[]) => {
        // Se asigna un id estable una sola vez, al cargar.
        const cargadas: Universidad[] = data.map((uni, indice) => {
          const ranking = posicionUSNews(uni);
          // El mismo "Costo anual total" de la ficha: lo que de verdad paga una familia al año.
          const matricula = uni.TUITIONFEE_OUT ?? uni.TUITIONFEE_IN ?? null;
          const vida = calcularCostoVida(uni);
          return {
          ...uni,
          // Protección por si el colab vuelve a exportarlos como texto o con "PS" (dato suprimido).
          MD_EARN_WNE_4YR: aNumero(uni.MD_EARN_WNE_4YR),
          COUNT_WNE_4YR: aNumero(uni.COUNT_WNE_4YR),
          USNEWS_ORDEN: ranking ? ranking.puesto + (ranking.lista === 'liberal-arts' ? 1000 : 0) : null,
          COSTO_ANUAL: matricula != null && vida ? matricula + vida.valor : null,
          COSTO_ANUAL_ESTIMADO: vida?.estimado ?? false,
          _id: indice,
          };
        });
        setUniversidades(cargadas);
        // Un estado o una ciudad que vengan en la URL y no existan se limpian recién aquí: antes
        // de tener los datos no hay con qué comprobar.
        const estadoValido = inicial.estado === 'todos' || cargadas.some(u => u.STABBR === inicial.estado);
        const ciudadValida = estadoValido && (inicial.ciudad === 'todas' || cargadas.some(u =>
          u.CITY === inicial.ciudad && (inicial.estado === 'todos' || u.STABBR === inicial.estado)));
        if (!estadoValido) setEstadoSeleccionado('todos');
        if (!ciudadValida) setCiudadSeleccionada('todas');
        alCargarDatos.current(cargadas);
      })
      .catch(error => console.error("Error cargando la data:", error));
  }, [inicial]);

  // El archivo de carreras se baja recién al abrir los pasos o al elegir una carrera.
  const archivoCarreras = useArchivoCarreras(enPasos || carreras.length > 0);
  /**
   * UNITID → (CIP → salario: a 4 años si lo hay, si no a 1 año; null si no lo publica). Están
   * todas las carreras de bachiller que ofrece cada universidad, publiquen salario o no.
   */
  const carrerasPorUnitid = useMemo(() => {
    const mapa = new Map<number, Map<string, number | null>>();
    if (!archivoCarreras) return mapa;
    for (const [unitid, filas] of Object.entries(archivoCarreras.universidades)) {
      mapa.set(Number(unitid), new Map(filas.map(([cip, unAnio, cuatroAnios]) => [cip, cuatroAnios ?? unAnio])));
    }
    return mapa;
  }, [archivoCarreras]);

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
    estados: estadosVarios,
    excluidos: estadosExcluidos,
    ciudad: ciudadSeleccionada,
    carreras,
    tipos: tiposUniversidad,
    precio: precioMaximo,
    politica: exigirSAT,
    sat: puntajeTotal,
    niveles: nivelesSAT,
  }), [estadoSeleccionado, estadosVarios, estadosExcluidos, ciudadSeleccionada, carreras, tiposUniversidad, precioMaximo, exigirSAT, puntajeTotal, nivelesSAT]));

  /** Salario de la carrera elegida en esta universidad (el mayor si eligió varias); null = no lo publica. */
  const salarioCarrera = useCallback((uni: Universidad): number | null => {
    const deUni = uni.UNITID != null ? carrerasPorUnitid.get(uni.UNITID) : undefined;
    if (!deUni) return null;
    let mayor: number | null = null;
    for (const cip of filtros.carreras) {
      const s = deUni.get(cip);
      if (s != null && (mayor == null || s > mayor)) mayor = s;
    }
    return mayor;
  }, [carrerasPorUnitid, filtros.carreras]);

  /**
   * ¿Ofrece alguna de las carreras elegidas? true / false / null = no se sabe.
   * Scorecard registra las carreras de bachiller según los graduados que reporta cada universidad:
   * - si le registra carreras pero ninguna de las elegidas, no la ofrece;
   * - si no le registra ninguna y su título más alto es asociado o certificado (community
   *   colleges, ~870), no da bachiller: tampoco la ofrece;
   * - si da bachiller o posgrado y aun así no le registra carreras (~20), no se sabe.
   */
  const ofreceCarrera = useCallback((uni: Universidad): boolean | null => {
    const deUni = uni.UNITID != null ? carrerasPorUnitid.get(uni.UNITID) : undefined;
    if (deUni) return filtros.carreras.some(cip => deUni.has(cip));
    return uni.HIGHDEG === 'Bachiller' || uni.HIGHDEG === 'Posgrado' ? null : false;
  }, [carrerasPorUnitid, filtros.carreras]);

  /**
   * Filtrado con manejo explícito de datos faltantes.
   *
   * Antes, una universidad sin SAT_AVG, sin matrícula o sin política de admisión
   * simplemente se colaba por todos esos filtros sin ser evaluada. Ahora cada
   * filtro activo distingue tres casos: cumple (se queda), no cumple (se descarta)
   * y no se puede saber (se queda, pero marcada y ordenada al final).
   */
  const { universidadesFiltradas, universidadesSinUbicacion, faltantesPorId, conteoNiveles, muyPorEncima, conteoPolitica } = useMemo(() => {
    const { estado, estados, excluidos, ciudad, tipos, precio, politica, sat } = filtros;
    // Un filtro solo "empuja al final" cuando el usuario realmente lo activó.
    const filtroSATActivo = sat > 0;
    // La carrera filtra por si la universidad la OFRECE, no por si publica su salario: si no,
    // "encajan 45" incluía a las que no la tienen. El salario solo ordena (universidadesOrdenadas).
    // Mientras baja el archivo de carreras no se filtra: el número se corrige cuando llega.
    const filtroCarreraActivo = filtros.carreras.length > 0 && carrerasPorUnitid.size > 0;
    const filtroPrecioActivo = precio < PRECIO_MAXIMO_SLIDER;
    const filtroPoliticaActivo = politica !== 'todos';

    const faltantes = new Map<number, string[]>();

    // El mapa nacional usa todas las que pasan los filtros MENOS estado/ciudad;
    // si no, al elegir un estado los demás quedan sin datos y no se pueden clickear.
    const sinUbicacion: Universidad[] = [];
    // Las que pasan todos los filtros menos "¿Piden el SAT?": con ellas se cuenta cuántas
    // quedarían con cada opción de ese filtro, antes de elegirla.
    const sinFiltroPolitica: Universidad[] = [];
    // Las que piden bastante más que el puntaje: no entran en los resultados, pero pasan por los
    // demás filtros para que el aviso de la portada cuente solo las del lugar y la búsqueda
    // elegidos. Los mismos tres grupos que arriba, para cuando se piden con "Verlas".
    const muyPorEncima: Universidad[] = [];
    const encimaSinUbicacion: Universidad[] = [];
    const encimaSinPolitica: Universidad[] = [];

    const lista = universidades.filter((uni) => {
      // Filtros duros: aquí no hay ambigüedad, el dato siempre existe.
      if (resultadoBusqueda && (uni._id == null || !resultadoBusqueda.posicion.has(uni._id))) return false;
      if (tipos.length > 0) {
        const tipo = tipoControl(uni.CONTROL);
        if (tipo == null || !tipos.includes(tipo)) return false;
      }

      const falta: string[] = [];

      // Quedan las de probabilidad alta, intermedia y baja; solo se apartan las prácticamente inalcanzables.
      let porEncima = false;
      if (filtroSATActivo) {
        const entra = alcanzable(uni, sat);
        if (entra == null) falta.push('Sin datos SAT');
        else porEncima = !entra;
      }

      if (filtroPrecioActivo) {
        // Costo real al año (matrícula + vida), el mismo que muestra la fila.
        if (uni.COSTO_ANUAL == null) falta.push('Sin dato de costo');
        else if (uni.COSTO_ANUAL > precio) return false;
      }

      if (filtroCarreraActivo) {
        const ofrece = ofreceCarrera(uni);
        if (ofrece === false) return false;
        if (ofrece == null) falta.push('Sin datos de carreras');
      }

      // Las que no informan su política solo aparecen en "Todos": mostrarlas bajo
      // "Obligatorio" u "Opcional" haría creer que lo son.
      const cumplePolitica = !filtroPoliticaActivo || (politica === 'no-exige'
        ? uni.ADMCON7 != null && NO_EXIGEN_SAT.includes(uni.ADMCON7)
        : uni.ADMCON7 === POLITICA_SAT[politica]);

      if (cumplePolitica) (porEncima ? encimaSinUbicacion : sinUbicacion).push(uni);
      if (estado !== 'todos' && uni.STABBR !== estado) return false;
      if (estados.length > 0 && !estados.includes(uni.STABBR)) return false;
      if (excluidos.length > 0 && excluidos.includes(uni.STABBR)) return false;
      if (ciudad !== 'todas' && uni.CITY !== ciudad) return false;
      (porEncima ? encimaSinPolitica : sinFiltroPolitica).push(uni);
      if (!cumplePolitica) return false;

      if (falta.length > 0 && uni._id != null) faltantes.set(uni._id, falta);
      if (porEncima) muyPorEncima.push(uni);
      return !porEncima;
    });

    // Cuántas quedarían con cada opción de "¿Piden el SAT?" (con los niveles marcados, si hay).
    const contarPolitica = (lista: Universidad[]): Record<string, number> => {
      const conteo: Record<string, number> = { todos: lista.length };
      for (const [opcion, valor] of Object.entries(POLITICA_SAT)) {
        conteo[opcion] = lista.filter(u => u.ADMCON7 === valor).length;
      }
      conteo['no-exige'] = conteo.opcional + conteo['no-considera'];
      return conteo;
    };

    // Cuántas hay de cada nivel, contadas ANTES de elegir uno: así el menú
    // "Tus posibilidades de entrar" muestra cuántas hay de cada una.
    if (!filtroSATActivo) {
      return {
        universidadesFiltradas: lista, universidadesSinUbicacion: sinUbicacion, faltantesPorId: faltantes,
        conteoNiveles: null, sinCalcular: 0, muyPorEncima, viendoMuyPorEncima: false, conteoPolitica: contarPolitica(sinFiltroPolitica),
      };
    }
    const conteo: Record<Nivel, number> = { 'Probabilidad alta': 0, 'Probabilidad media': 0, 'Probabilidad baja': 0 };
    // Las que quedan en la lista sin nivel: no publican puntajes SAT o solo publican el promedio,
    // que no alcanza para compararte. Se cuentan aparte para que la portada explique el total.
    let sinCalcular = 0;
    for (const uni of lista) {
      const n = clasificar(uni, sat);
      if (n) conteo[n]++;
      else sinCalcular++;
    }
    // Con niveles marcados quedan solo los de esos niveles (las sin rango SAT no se pueden clasificar).
    const delNivel = (uni: Universidad) => {
      if (filtros.niveles.length === 0) return true;
      const n = clasificar(uni, sat);
      return n != null && filtros.niveles.includes(n);
    };
    const viendoMuyPorEncima = verEncimaDe === sat && muyPorEncima.length > 0;
    const finales = viendoMuyPorEncima ? muyPorEncima : lista.filter(delNivel);
    // El aviso de la lista dice que las marcadas "están al final": solo pueden contarse las que
    // de verdad están ahí, no las que quedaron fuera por un nivel marcado o por ser muy exigentes.
    const ids = new Set(finales.map(u => u._id));
    for (const id of faltantes.keys()) if (!ids.has(id)) faltantes.delete(id);
    return {
      universidadesFiltradas: finales,
      universidadesSinUbicacion: viendoMuyPorEncima ? encimaSinUbicacion : sinUbicacion.filter(delNivel),
      faltantesPorId: faltantes,
      conteoNiveles: conteo,
      sinCalcular,
      muyPorEncima,
      viendoMuyPorEncima,
      conteoPolitica: contarPolitica(viendoMuyPorEncima ? encimaSinPolitica : sinFiltroPolitica.filter(delNivel)),
    };
  }, [universidades, resultadoBusqueda, filtros, verEncimaDe, carrerasPorUnitid, ofreceCarrera]);


  // Filtros activos, con nombre para explicar qué quita "Limpiar" (el puntaje SAT y
  // estado+ciudad cuentan como uno cada uno).
  const filtrosActivos = ([
    [puntajeMath > 0 || puntajeLectura > 0 || puntajeSoloTotal > 0, 'puntaje SAT'],
    [estadoSeleccionado !== 'todos' || estadosVarios.length > 0 || estadosExcluidos.length > 0, 'estado'],
    [carreras.length > 0, 'carrera'],
    [exigirSAT !== 'todos', '¿piden el SAT?'],
    // Marcar los tres niveles equivale a no filtrar.
    [puntajeTotal > 0 && nivelesSAT.length > 0 && nivelesSAT.length < 3, 'tus posibilidades de entrar'],
    // Marcar los tres tipos equivale a no filtrar.
    [tiposUniversidad.length === 1, 'tipo de universidad'],
    [precioMaximo < PRECIO_MAXIMO_SLIDER, 'costo máximo'],
    [busquedaNombre.trim() !== '', `búsqueda "${busquedaNombre.trim()}"`],
  ] as const).filter(([activo]) => activo).map(([, nombre]) => nombre);

  // Quitar los filtros también borra el puntaje: se puede deshacer unos segundos, como en Mi lista.
  const [filtrosAntes, setFiltrosAntes] = useState<FiltrosURL | null>(null);
  // El aviso "Quitaste tus filtros" queda un momento al cerrarse, para irse con un fundido.
  const [filtrosAntesVisible, avisoFiltrosSaliendo] = usePresencia(filtrosAntes, 150);
  useEffect(() => {
    if (!filtrosAntes) return;
    const espera = setTimeout(() => setFiltrosAntes(null), 8000);
    return () => clearTimeout(espera);
  }, [filtrosAntes]);
  const limpiarFiltros = () => {
    setFiltrosAntes({
      busqueda: busquedaNombre, estado: estadoSeleccionado, estados: estadosVarios, excluidos: estadosExcluidos, ciudad: ciudadSeleccionada, carreras,
      puntajeMath, puntajeLectura, puntajeSoloTotal, exigirSAT, niveles: nivelesSAT,
      tipos: tiposUniversidad, precio: precioMaximo, ordenarPor, ordenDireccion,
    });
    setBusquedaNombre('');
    setPuntajeMath(0);
    setPuntajeLectura(0);
    setPuntajeSoloTotal(0);
    setEstadoSeleccionado('todos');
    setEstadosVarios([]);
    setEstadosExcluidos([]);
    setCiudadSeleccionada('todas');
    setCarreras([]);
    setSatNoRendido(false);
    setExigirSAT('todos');
    setNivelesSAT([]);
    setTiposUniversidad([]);
    setPrecioMaximo(PRECIO_MAXIMO_SLIDER);
  };
  const deshacerLimpiar = () => {
    if (filtrosAntes) aplicarFiltrosURL(filtrosAntes);
    setFiltrosAntes(null);
  };

  const universidadesOrdenadas = useMemo(() => {
    // Sin orden elegido pero con búsqueda activa, se ordena por relevancia (MIT antes que Smith College).
    const posicion = resultadoBusqueda?.posicion;

    const sinDato = (u: Universidad) => (u._id != null && faltantesPorId.has(u._id) ? 1 : 0);
    // Orden recomendado: con puntaje, primero donde tienes más probabilidad; dentro de cada
    // nivel (y sin puntaje), primero las del ranking, después las de mejor salario de egresados
    // y SAT promedio más alto, y al final las que tienen menos datos, así la lista no empieza con
    // universidades llenas de "—".
    const SIN_RANKING = 1e6;
    const ORDEN_NIVEL: Record<Nivel, number> = { 'Probabilidad alta': 0, 'Probabilidad media': 1, 'Probabilidad baja': 2 };
    const nivelDe = (u: Universidad) => {
      const n = filtros.sat > 0 ? clasificar(u, filtros.sat) : null;
      return n ? ORDEN_NIVEL[n] : 3;
    };
    const datos = (u: Universidad) =>
      Number(u.ADM_RATE != null) + Number(u.SAT_AVG != null) + Number(u.COSTO_ANUAL != null);
    // Con una carrera elegida, lo primero es cuánto ganan sus egresados en cada universidad.
    const conCarrera = filtros.carreras.length > 0;
    const recomendado = (a: Universidad, b: Universidad) =>
      (conCarrera ? (salarioCarrera(b) ?? 0) - (salarioCarrera(a) ?? 0) : 0)
      || nivelDe(a) - nivelDe(b)
      || (a.USNEWS_ORDEN ?? SIN_RANKING) - (b.USNEWS_ORDEN ?? SIN_RANKING)
      || (b.MD_EARN_WNE_4YR ?? 0) - (a.MD_EARN_WNE_4YR ?? 0)
      || (b.SAT_AVG ?? 0) - (a.SAT_AVG ?? 0)
      || datos(b) - datos(a);

    return [...universidadesFiltradas].sort((a, b) => {
      // Primero las que sí se pudieron evaluar; las incompletas al final.
      const diferencia = sinDato(a) - sinDato(b);
      if (diferencia !== 0) return diferencia;

      if (ordenarPor === 'ninguno') {
        // Buscando un nombre, manda la relevancia (MIT antes que Smith College).
        return posicion ? (posicion.get(a._id ?? -1) ?? 0) - (posicion.get(b._id ?? -1) ?? 0) : recomendado(a, b);
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
  }, [universidadesFiltradas, faltantesPorId, ordenarPor, ordenDireccion, resultadoBusqueda, filtros.sat, filtros.carreras, salarioCarrera]);

  // Lo elegido en "¿Dónde?" como lista: varios estados, uno solo (con su ciudad) o ninguno.
  const seleccionEstados = useMemo(
    () => (estadosVarios.length > 0 ? estadosVarios : estadoSeleccionado !== 'todos' ? [estadoSeleccionado] : []),
    [estadosVarios, estadoSeleccionado],
  );
  /**
   * Fija la lista de estados: con uno solo se usa el filtro de siempre, así funcionan la ciudad y su
   * resumen. Elegir dónde borra los descartados: son dos modos que no se mezclan.
   */
  const elegirEstados = useCallback((lista: string[]) => {
    setCiudadSeleccionada('todas');
    setEstadosExcluidos([]);
    if (lista.length === 1) { setEstadoSeleccionado(lista[0]); setEstadosVarios([]); }
    else { setEstadoSeleccionado('todos'); setEstadosVarios(lista); }
  }, []);
  /** "Dónde no quiero estudiar": fija los descartados y borra lo elegido en el otro modo. */
  const excluirEstados = useCallback((lista: string[]) => {
    setCiudadSeleccionada('todas');
    setEstadoSeleccionado('todos');
    setEstadosVarios([]);
    setEstadosExcluidos(lista);
  }, []);
  // Universidades por estado con tus filtros (sin contar el lugar): el número de cada estado en la burbuja.
  const conteoPorEstado = useMemo(() => {
    const conteo: Record<string, number> = {};
    for (const u of universidadesSinUbicacion) if (u.STABBR) conteo[u.STABBR] = (conteo[u.STABBR] ?? 0) + 1;
    return conteo;
  }, [universidadesSinUbicacion]);

  /**
   * Cuando en los pasos quedan pocas (10 o menos), una salida: qué respuesta cambiar y cuántas
   * encajarían, con un botón que lo hace. Se prueba cada respuesta por separado y se ofrece la que
   * más suma. Mismo criterio que el filtro de arriba para los casos que importan aquí (lo que no se
   * sabe se queda), sin la búsqueda por nombre ni los niveles, que no son parte de los pasos.
   */
  const sugerencia = useMemo((): Sugerencia | null => {
    if (!enPasos || universidades.length === 0 || universidadesFiltradas.length > 10) return null;
    type Prueba = Pick<typeof filtros, 'estado' | 'estados' | 'excluidos' | 'carreras' | 'precio' | 'politica' | 'sat'>;
    const encaja = (u: Universidad, f: Prueba) => {
      if (filtros.tipos.length > 0) {
        const tipo = tipoControl(u.CONTROL);
        if (tipo == null || !filtros.tipos.includes(tipo)) return false;
      }
      if (f.sat > 0 && alcanzable(u, f.sat) === false) return false;
      if (f.precio < PRECIO_MAXIMO_SLIDER && u.COSTO_ANUAL != null && u.COSTO_ANUAL > f.precio) return false;
      if (f.politica !== 'todos' && !(f.politica === 'no-exige'
        ? u.ADMCON7 != null && NO_EXIGEN_SAT.includes(u.ADMCON7)
        : u.ADMCON7 === POLITICA_SAT[f.politica])) return false;
      if (f.estado !== 'todos' && u.STABBR !== f.estado) return false;
      if (f.estados.length > 0 && !f.estados.includes(u.STABBR)) return false;
      if (f.excluidos.length > 0 && f.excluidos.includes(u.STABBR)) return false;
      if (f.carreras.length > 0 && carrerasPorUnitid.size > 0) {
        const deUni = u.UNITID != null ? carrerasPorUnitid.get(u.UNITID) : undefined;
        if (deUni ? !f.carreras.some(c => deUni.has(c)) : !(u.HIGHDEG === 'Bachiller' || u.HIGHDEG === 'Posgrado')) return false;
      }
      return true;
    };
    const contar = (cambio: Partial<Prueba>) => {
      const f = { ...filtros, ...cambio };
      let n = 0;
      for (const u of universidades) if (encaja(u, f)) n++;
      return n;
    };

    const opciones: { n: number; texto: string; boton: string; aplicar: () => void }[] = [];
    if (filtros.precio < PRECIO_MAXIMO_SLIDER) {
      const mayor = PRESUPUESTOS.find(p => p > filtros.precio);
      const precio = mayor ?? PRECIO_MAXIMO_SLIDER;
      const n = contar({ precio });
      opciones.push({ n, texto: mayor ? `Si subes el presupuesto a $${mayor.toLocaleString('en-US')}, encajan ${n.toLocaleString('en-US')}.`
        : `Sin límite de presupuesto, encajan ${n.toLocaleString('en-US')}.`,
        boton: mayor ? 'Subirlo' : 'Quitar el límite', aplicar: () => setPrecioMaximo(precio) });
    }
    if (filtros.estado !== 'todos' || filtros.estados.length > 0) {
      const n = contar({ estado: 'todos', estados: [] });
      opciones.push({ n, texto: `En todo EE. UU., encajan ${n.toLocaleString('en-US')}.`, boton: 'Ver todo EE. UU.', aplicar: () => elegirEstados([]) });
    }
    if (filtros.excluidos.length > 0) {
      const n = contar({ excluidos: [] });
      opciones.push({ n, texto: `Sin descartar estados, encajan ${n.toLocaleString('en-US')}.`, boton: 'Volver a incluirlos', aplicar: () => excluirEstados([]) });
    }
    if (filtros.carreras.length > 0) {
      const n = contar({ carreras: [] });
      opciones.push({ n, texto: `Con cualquier carrera, encajan ${n.toLocaleString('en-US')}.`, boton: 'Quitar la carrera', aplicar: () => setCarreras([]) });
    }
    if (filtros.politica !== 'todos') {
      const n = contar({ politica: 'todos' });
      opciones.push({ n, texto: `Sumando las que piden el SAT, encajan ${n.toLocaleString('en-US')}.`, boton: 'Sumarlas', aplicar: () => setExigirSAT('todos') });
    }
    const mejor = opciones.filter(o => o.n > universidadesFiltradas.length).sort((a, b) => b.n - a.n)[0];
    if (!mejor) return null;
    return {
      texto: `${universidadesFiltradas.length === 0 ? 'Ninguna encaja por ahora.' : '¿Quieres más opciones?'} ${mejor.texto}`,
      boton: mejor.boton,
      aplicar: mejor.aplicar,
    };
  }, [enPasos, universidades, universidadesFiltradas.length, filtros, carrerasPorUnitid, elegirEstados, excluirEstados]);

  // Para "Por ahora encajan": de las que encajan (todas ofrecen la carrera, o no se sabe), cuántas publican su salario.
  const conDatoCarrera = useMemo(() => {
    if (filtros.carreras.length === 0 || carrerasPorUnitid.size === 0) return null;
    return universidadesFiltradas.filter(u => salarioCarrera(u) != null).length;
  }, [universidadesFiltradas, filtros.carreras, carrerasPorUnitid, salarioCarrera]);
  /** "Computación" o "Biología o Psicología": las carreras elegidas, agrupando las de los botones. */
  const nombreCarrerasElegidas = useMemo(
    () => [...new Set(carreras.map(c => CARRERAS_COMUNES.find(g => g.cips.includes(c))?.nombre ?? nombreCarrera(c, archivoCarreras)))].join(' o '),
    [carreras, archivoCarreras],
  );

  const listaRef = useRef<HTMLDivElement>(null);
  // Al cambiar el lugar (desde la burbuja del mapa o "Más filtros"), la lista entra suave, sin
  // volver a montarla: así conserva su página.
  const lugarFiltrado = [filtros.estado, ...filtros.estados, '-', ...filtros.excluidos].join(',');
  const lugarPrevio = useRef(lugarFiltrado);
  useEffect(() => {
    if (lugarPrevio.current === lugarFiltrado) return;
    lugarPrevio.current = lugarFiltrado;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    listaRef.current?.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }],
      { duration: 400, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    );
  }, [lugarFiltrado]);
  /** Pasar de un paso a otro (o a los resultados) empieza arriba de la página. */
  const irAPaso = useCallback((n: number) => {
    setPaso(n);
    window.scrollTo(0, 0);
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

  // La barra de Educa muestra este contador. Antes de cargar los datos no se publica: daría 0.
  useEffect(() => {
    if (universidades.length > 0) publicarCantidadMiLista(universidadesGuardadas.length);
  }, [universidades.length, universidadesGuardadas.length]);

  // La estrella de la barra. Si ya se está en Mi lista no suma otra entrada al historial.
  useEffect(() => {
    const alAbrir = () => { if (!viendoMiLista) abrirMiLista(); };
    window.addEventListener(EVENTO_MI_LISTA, alAbrir);
    return () => window.removeEventListener(EVENTO_MI_LISTA, alAbrir);
  }, [viendoMiLista, abrirMiLista]);

  // Un enlace compartido desde Mi lista (?lista=166683,170976, por UNITID): sus universidades se
  // suman a la lista de quien lo abre y se abre Mi lista, con un aviso para deshacerlo. El
  // parámetro se borra de la dirección, para que al recargar no se vuelvan a sumar.
  // Se arma en cada render (con la lista de ese momento) y la llama la carga de los datos, una vez.
  const [avisoEnlace, setAvisoEnlace] = useState<AvisoLista | null>(null);
  useEffect(() => {
    alCargarDatos.current = (cargadas: Universidad[]) => {
      const parametro = new URLSearchParams(window.location.search).get('lista');
      if (!parametro) return;
      window.history.replaceState(null, '', import.meta.env.BASE_URL);
      const porId = new Map(cargadas.map(u => [u.UNITID, u]));
      // En el orden del enlace: así se ven como las ordenó quien las compartió.
      const delEnlace = parametro.split(',').map(id => porId.get(Number(id))).filter((u): u is Universidad => u != null).map(claveUniversidad);
      if (delEnlace.length === 0) return;
      const nuevas = delEnlace.filter(c => !miLista.guardadas.has(c)).length;
      setAvisoEnlace({
        texto: nuevas === 0 ? 'Las universidades del enlace ya estaban en tu lista.'
          : `Sumamos ${nuevas} ${nuevas === 1 ? 'universidad' : 'universidades'} del enlace que te compartieron.`,
        antes: nuevas > 0 ? miLista.claves : null,
        id: -1,
      });
      miLista.agregarVarias(delEnlace);
      abrirMiLista();
    };
  });

  // El botón "Volver" de la página hace lo mismo que el "atrás" del navegador.
  const volverDelDetalle = useCallback(() => {
    if (window.history.state?.detalleId != null) window.history.back();
    else setUniversidadSeleccionada(null);
  }, []);

  useEffect(() => {
    const alNavegar = (e: PopStateEvent) => {
      // Los filtros también viajan en la URL: al volver atrás se reaplican tal como estaban.
      aplicarFiltrosURL(leerFiltrosDeURL(window.location.search));
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
  }, [universidades, aplicarFiltrosURL]);

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
          indiceBusqueda={indiceBusqueda}
          puntajeSAT={puntajeTotal}
          // Desde la ficha solo se escribe el total: como en la portada, el total manda y las
          // secciones se borran.
          onCambiarPuntajeSAT={total => { setPuntajeMath(0); setPuntajeLectura(0); setPuntajeSoloTotal(total); }}
        />
      );
    }

    if (viendoMiLista) {
      return (
        <ComparadorUniversidades
          universidades={universidadesGuardadas}
          claves={miLista.claves}
          guardadas={miLista.guardadas}
          indiceBusqueda={indiceBusqueda}
          puntajeSAT={puntajeTotal}
          onCambiarPuntajeSAT={total => { setPuntajeMath(0); setPuntajeLectura(0); setPuntajeSoloTotal(total); }}
          onSeleccionar={seleccionarUniversidad}
          onAgregar={miLista.alternar}
          onQuitar={miLista.quitar}
          onVaciar={miLista.vaciar}
          onRestaurar={miLista.restaurar}
          onVolver={volverDeMiLista}
          avisoInicial={avisoEnlace}
          onAvisoInicialVisto={() => setAvisoEnlace(null)}
        />
      );
    }

    // Los 4 pasos de "Cuéntanos de ti": quien entra por primera vez.
    if (enPasos) {
      return (
        <FlujoPasos
          paso={paso} setPaso={irAPaso} onTerminar={() => irAPaso(5)}
          universidades={universidades}
          encajan={universidadesFiltradas.length} conCarrera={conDatoCarrera}
          carreras={carreras} setCarreras={setCarreras} archivoCarreras={archivoCarreras}
          estados={seleccionEstados} setEstados={elegirEstados}
          excluidos={estadosExcluidos} setExcluidos={excluirEstados}
          conteoEstados={conteoPorEstado} sugerencia={sugerencia}
          precio={precioMaximo} setPrecio={setPrecioMaximo}
          satTotal={puntajeTotal}
          setSatTotal={total => { setPuntajeMath(0); setPuntajeLectura(0); setPuntajeSoloTotal(total); }}
          satNoRendido={satNoRendido} setSatNoRendido={setSatNoRendido}
          exigirSAT={exigirSAT} setExigirSAT={setExigirSAT} conteoPolitica={conteoPolitica}
        />
      );
    }

    const verMuyPorEncima = () => {
      setVerEncimaDe(filtros.sat);
      setNivelesSAT([]);
      requestAnimationFrame(() => listaRef.current?.scrollIntoView({ block: 'start' }));
    };

    // Lo que contó en los pasos, en una frase por paso: cada una lleva de vuelta a su paso para cambiarla.
    const nombres = (lista: string[]) => lista.length > 3 ? `${lista.length} estados` : lista.map(st => NOMBRES_ESTADOS[st] ?? st).join(', ');
    const lugar = estadosExcluidos.length > 0 ? `Todo EE. UU. menos ${nombres(estadosExcluidos)}`
      : seleccionEstados.length === 0 ? 'Todo EE. UU.'
      : nombres(seleccionEstados) + (ciudadSeleccionada !== 'todas' ? ` (${ciudadSeleccionada})` : '');
    const respuestas = [
      carreras.length ? nombreCarrerasElegidas : 'Cualquier carrera',
      lugar,
      precioMaximo < PRECIO_MAXIMO_SLIDER ? `Hasta $${precioMaximo.toLocaleString('en-US')} al año` : 'Cualquier presupuesto',
      (puntajeTotal > 0 ? `SAT ${puntajeTotal}` : satNoRendido ? 'Aún no presento el SAT' : 'SAT: no lo diste')
        + (exigirSAT === 'no-exige' ? ' · solo las que no lo exigen' : ''),
    ];

    // Lo que solo se cambia en "Más filtros" (lo demás ya está en los chips de arriba).
    const extrasActivos = filtrosActivos.filter(f =>
      f === '¿piden el SAT?' || f === 'tus posibilidades de entrar' || f === 'tipo de universidad').length;

    return (
      <>
        <div className="portada portada-resultados">
          <section className="banda banda-blanco resultados-cabecera" aria-label="Tu búsqueda">
            <div className="in resultados-cabecera-in">
              <div className="resultados-cabecera-texto">
                <h1 className="resultados-titulo" aria-live="polite">
                  <span className="numero">{universidadesFiltradas.length.toLocaleString('en-US')}</span>{' '}
                  {universidadesFiltradas.length === 1 ? 'universidad encaja' : 'universidades encajan'} contigo
                </h1>
                <div className="resultados-respuestas">
                  <span className="resultados-respuestas-etiqueta">Lo que nos contaste:</span>
                  {respuestas.map((texto, i) => (
                    <button key={TITULOS_PASOS[i]} type="button" className="resultados-respuesta" onClick={() => irAPaso(i + 1)}
                      aria-label={`Cambiar ${TITULOS_PASOS[i]}: ${texto}`}>
                      {texto}
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                    </button>
                  ))}
                  <button type="button" className={`resultados-mas-filtros${masFiltros ? ' resultados-mas-filtros-abierto' : ''}`}
                    aria-expanded={masFiltros} aria-controls="hoja-filtros" onClick={() => setMasFiltros(m => !m)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
                    {masFiltros ? 'Ocultar filtros' : 'Más filtros'}
                    {!masFiltros && extrasActivos > 0 && <span className="contador numero">{extrasActivos}</span>}
                  </button>
                  {filtrosActivos.length > 0 && (
                    <button type="button" className="boton-limpiar boton-limpiar-enlace" onClick={limpiarFiltros}
                      title={`Quita: ${filtrosActivos.join(', ')}`}>Quitar filtros</button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="banda banda-blanco resultados-cuerpo" aria-label="Resultados">
            <div className={`in cuerpo${masFiltros ? '' : ' cuerpo-sin-hoja'}`}>
              {masFiltros && <div id="hoja-filtros" className="hoja-envoltorio"><Filtros
                estadoSeleccionado={estadoSeleccionado}
                // Elegir un estado en el panel reemplaza a los varios que vengan de los pasos.
                setEstadoSeleccionado={v => { setEstadosVarios([]); setEstadosExcluidos([]); setEstadoSeleccionado(v); }}
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
                // El SAT ya está en los chips de arriba (y en su paso): aquí no se repite.
                conPuntaje={false}
                variosEstados={estadosVarios.length > 1 ? `${estadosVarios.length} estados: ${estadosVarios.map(st => NOMBRES_ESTADOS[st] ?? st).join(', ')}` : null}
                siempreAbierta
              /></div>}
              <main className="columna-principal">
                <div ref={listaRef} className="lista-ancla">
                <ListaUniversidades
                  universidadesFiltradas={universidadesFiltradas} universidadesOrdenadas={universidadesOrdenadas}
                  faltantesPorId={faltantesPorId}
                  muyPorEncima={muyPorEncima} onVerMuyPorEncima={verMuyPorEncima}
                  ordenarPor={ordenarPor} setOrdenarPor={setOrdenarPor}
                  ordenDireccion={ordenDireccion} setOrdenDireccion={setOrdenDireccion}
                  onSeleccionar={seleccionarUniversidad}
                  guardadas={miLista.guardadas} onAlternarGuardada={miLista.alternar}
                  puntajeSAT={filtros.sat}
                  busqueda={busquedaNombre} onBorrarBusqueda={() => setBusquedaNombre('')}
                  carrera={filtros.carreras.length > 0 && conDatoCarrera != null
                    ? { nombre: nombreCarrerasElegidas, salario: salarioCarrera, } : null}
                />
                </div>
              </main>
            </div>
          </section>

          {/* Vive siempre en la página (vacío): así el lector de pantalla lo anuncia al cambiar. */}
          <div className="aviso-lista-zona aviso-filtros" role="status" aria-live="polite">
            {filtrosAntesVisible && (
              <div className={`aviso-lista${avisoFiltrosSaliendo ? ' aviso-lista-saliendo' : ''}`}>
                <span>Quitaste tus filtros.</span>
                <button type="button" className="aviso-lista-deshacer" onClick={deshacerLimpiar}>Deshacer</button>
                <button type="button" className="aviso-lista-cerrar" onClick={() => setFiltrosAntes(null)} aria-label="Cerrar aviso">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>

        <BurbujaMapa conteo={conteoPorEstado} universidades={universidades} seleccion={seleccionEstados}
          excluidos={estadosExcluidos} onElegir={elegirEstados} onExcluir={excluirEstados} />
      </>
    );
  })();

  // El buscador de universidades va en la barra de arriba (fuera de #root: ver BarraEduca), en los
  // pasos y en los resultados. La ficha y Mi lista tienen su propio buscador.
  const huecoBuscador = typeof document !== 'undefined' ? document.getElementById(ID_BUSCADOR_BARRA) : null;
  const conBuscadorArriba = !universidadSeleccionada && !viendoMiLista;

  return (
    <>
      {vista}
      {/* En los pasos no hay pie: la barra de "Por ahora encajan" va pegada al borde de abajo. */}
      {!(enPasos && !universidadSeleccionada && !viendoMiLista) && <AvisoFuentes />}
      {huecoBuscador && conBuscadorArriba && createPortal(
        <Buscador
          busquedaNombre={busquedaNombre} setBusquedaNombre={setBusquedaNombre}
          mostrarSugerencias={mostrarSugerencias} setMostrarSugerencias={setMostrarSugerencias}
          sugerencias={sugerencias} sonAproximadas={resultadoBusqueda?.aproximado ?? false}
          onSeleccionar={seleccionarUniversidad}
          id="buscador-barra"
          etiqueta="¿Ya sabes a cuál quieres ir? Búscala" etiquetaOculta
          placeholder="¿Ya sabes a cuál quieres ir? Búscala"
          compacto
          // En los pasos el nombre no queda escrito: no es un filtro de los pasos y movía el contador.
          conservarTexto={!enPasos}
        />,
        huecoBuscador,
      )}
    </>
  );
}
