import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, GeoJSON, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import type { Universidad } from '../types';
import { claveCiudad } from '../utils/normalizar';
import { NOMBRES_ESTADOS } from '../utils/estados';

interface Props {
  universidades: Universidad[];
  estadoSeleccionado: string;
  /** Igual que al hacer clic en un estado del mapa nacional, pero por ciudad. */
  onSeleccionarCiudad?: (ciudad: string) => void;
}

type PropiedadesCondado = { nombre: string };

/**
 * Rampa secuencial de un solo tono, de claro a oscuro, con los pasos repartidos
 * de forma pareja en luminosidad (OKLab ~0,90 → 0,29). Así la diferencia entre
 * tramos contiguos se nota: el peor par adyacente pasa de ΔE 5,9 a 14,9 en
 * visión normal y de 4,4 a 13,8 en protanopía.
 */
const ESCALA = ['#bae6fd', '#38bdf8', '#0284c7', '#075985', '#082f49'];
const SIN_DATOS = '#f1f5f9';
const TRAMOS = ESCALA.length;

/**
 * Escala por raíz cuadrada, no lineal: unos pocos condados concentran decenas de
 * universidades y el resto tiene una o dos. Con escala lineal el mapa saldría
 * casi todo del mismo color claro.
 */
function indiceTramo(cantidad: number, maximo: number): number {
  if (!cantidad) return -1;
  if (maximo <= 1) return TRAMOS - 1;
  return Math.min(TRAMOS - 1, Math.floor(TRAMOS * Math.sqrt(cantidad / maximo)));
}

/** Rango numérico de cada tramo, para poder rotularlo en la leyenda. */
function calcularTramos(maximo: number): { color: string; desde: number; hasta: number }[] {
  if (maximo < 1) return [];
  const salida: { color: string; desde: number; hasta: number }[] = [];
  for (let i = 0; i < TRAMOS; i++) {
    const desde = Math.max(1, Math.ceil(maximo * (i / TRAMOS) ** 2));
    const hasta = i === TRAMOS - 1 ? maximo : Math.ceil(maximo * ((i + 1) / TRAMOS) ** 2) - 1;
    if (hasta < desde) continue;
    const previo = salida[salida.length - 1];
    if (previo && previo.desde === desde) { previo.hasta = hasta; previo.color = ESCALA[i]; continue; }
    salida.push({ color: ESCALA[i], desde, hasta });
  }
  return salida;
}

// --- Cargas cacheadas a nivel de módulo (no se repiten entre renders ni estados) ---
/**
 * "CIUDAD|ESTADO" -> [fips del condado, latitud, longitud].
 * Se acepta también el formato viejo (solo el fips como texto) para que una
 * copia del archivo en la caché del navegador no rompa el mapa: leer [0] de
 * un texto devuelve su primera letra y todos los condados quedaban en cero.
 */
type EntradaCiudad = [string, number, number] | string;
type IndiceCiudades = Record<string, EntradaCiudad>;

function fipsDe(entrada: EntradaCiudad | undefined): string | null {
  if (!entrada) return null;
  return Array.isArray(entrada) ? entrada[0] : entrada;
}

function puntoDe(entrada: EntradaCiudad | undefined): [number, number] | null {
  return Array.isArray(entrada) && entrada.length === 3 ? [entrada[1], entrada[2]] : null;
}

let promesaCiudades: Promise<IndiceCiudades> | null = null;
function cargarCiudades(): Promise<IndiceCiudades> {
  if (!promesaCiudades) {
    promesaCiudades = fetch(`${import.meta.env.BASE_URL}geo/ubicaciones.json`)
      .then(r => r.json())
      .catch(() => ({}));
  }
  return promesaCiudades;
}

const cacheGeometrias = new Map<string, FeatureCollection<Geometry, PropiedadesCondado> | null>();
function cargarGeometria(estado: string) {
  if (cacheGeometrias.has(estado)) return Promise.resolve(cacheGeometrias.get(estado)!);
  return fetch(`${import.meta.env.BASE_URL}geo/condados/${estado}.json`)
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((geo: FeatureCollection<Geometry, PropiedadesCondado> | null) => {
      cacheGeometrias.set(estado, geo);
      return geo;
    });
}

/**
 * Toma la instancia del mapa y la encuadra al estado.
 * Va como hijo de MapContainer a propósito: useMap() garantiza que el mapa ya
 * existe. Con un ref sobre MapContainer el efecto corre antes de que el ref esté
 * asignado, el encuadre nunca se ejecuta y Leaflet recorta todos los condados
 * por quedar fuera de la vista (el mapa aparece en blanco).
 */
function Controlador({
  geo, mapaRef, limitesEstado,
}: {
  geo: FeatureCollection<Geometry, PropiedadesCondado>;
  mapaRef: React.MutableRefObject<L.Map | null>;
  limitesEstado: React.MutableRefObject<L.LatLngBounds | null>;
}) {
  const mapa = useMap();
  useEffect(() => {
    mapaRef.current = mapa;
    const limites = L.geoJSON(geo as any).getBounds();
    if (!limites.isValid()) return;
    limitesEstado.current = limites;
    mapa.fitBounds(limites, { padding: [12, 12] });
  }, [geo, mapa, mapaRef, limitesEstado]);
  return null;
}

const Aviso = ({ children }: { children: React.ReactNode }) => (
  <div style={{ height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '0 20px' }}>
    <div>{children}</div>
  </div>
);

export const MapaCondados = memo(function MapaCondados({ universidades, estadoSeleccionado, onSeleccionarCiudad }: Props) {
  const [ciudades, setCiudades] = useState<IndiceCiudades | null>(null);
  const [geo, setGeo] = useState<FeatureCollection<Geometry, PropiedadesCondado> | null>(null);
  const [cargando, setCargando] = useState(true);
  const [condadoEnfocado, setCondadoEnfocado] = useState<string | null>(null);

  const mapaRef = useRef<L.Map | null>(null);
  const limitesEstado = useRef<L.LatLngBounds | null>(null);

  useEffect(() => {
    let vigente = true;
    cargarCiudades().then(c => { if (vigente) setCiudades(c); });
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    setCargando(true);
    setGeo(null);
    setCondadoEnfocado(null);
    cargarGeometria(estadoSeleccionado).then(g => {
      if (!vigente) return;
      setGeo(g);
      setCargando(false);
    });
    return () => { vigente = false; };
  }, [estadoSeleccionado]);

  const verEstadoCompleto = useCallback(() => {
    setCondadoEnfocado(null);
    if (mapaRef.current && limitesEstado.current) {
      mapaRef.current.fitBounds(limitesEstado.current, { padding: [12, 12] });
    }
  }, []);

  // Cuántas universidades caen en cada condado (clave = FIPS de 5 dígitos).
  const { conteoPorCondado, maximo, sinUbicar } = useMemo(() => {
    const conteo: Record<string, number> = {};
    let perdidas = 0;
    if (ciudades) {
      for (const uni of universidades) {
        const fips = fipsDe(ciudades[claveCiudad(uni.CITY, uni.STABBR)]);
        if (fips) conteo[fips] = (conteo[fips] || 0) + 1;
        else perdidas++;
      }
    }
    const valores = Object.values(conteo);
    return { conteoPorCondado: conteo, maximo: valores.length ? Math.max(...valores) : 0, sinUbicar: perdidas };
  }, [universidades, ciudades]);

  const tramos = useMemo(() => calcularTramos(maximo), [maximo]);
  const nombreEstado = NOMBRES_ESTADOS[estadoSeleccionado] ?? estadoSeleccionado;

  const estiloCondado = useMemo(
    () => (feature?: Feature<Geometry, PropiedadesCondado>) => {
      const id = feature?.id ? String(feature.id) : '';
      const indice = indiceTramo(conteoPorCondado[id] || 0, maximo);
      const hayEnfoque = condadoEnfocado !== null;
      const enfocado = condadoEnfocado === id;
      return {
        fillColor: indice < 0 ? SIN_DATOS : ESCALA[indice],
        // Al enfocar un condado el relleno se aclara para dejar ver las calles.
        fillOpacity: hayEnfoque ? (enfocado ? 0.3 : 0.12) : 0.92,
        color: enfocado ? '#f97316' : '#ffffff',
        weight: enfocado ? 2.5 : 1,
      };
    },
    [conteoPorCondado, maximo, condadoEnfocado]
  );

  const alCrearCondado = useMemo(
    () => (feature: Feature<Geometry, PropiedadesCondado>, capa: L.Layer) => {
      const id = feature.id ? String(feature.id) : '';
      const cantidad = conteoPorCondado[id] || 0;
      const nombre = feature.properties?.nombre ?? 'Condado';
      capa.bindTooltip(
        `<strong>${nombre}</strong><br/>${cantidad} universidad${cantidad === 1 ? '' : 'es'}` +
        `<br/><span style="color:#64748b">clic para acercar</span>`,
        { sticky: true }
      );
      capa.on('click', () => {
        const limites = (capa as L.Polygon).getBounds?.();
        if (!limites?.isValid() || !mapaRef.current) return;
        setCondadoEnfocado(id);
        mapaRef.current.fitBounds(limites, { padding: [24, 24], maxZoom: 11 });
      });
    },
    [conteoPorCondado]
  );

  /**
   * Ciudades del condado enfocado, con sus universidades. Es el nivel de detalle
   * siguiente: el condado es la unidad que se pinta, la ciudad es donde está la
   * universidad de verdad.
   */
  const { lista: ciudadesDelCondado, sinCoordenada } = useMemo(() => {
    if (!condadoEnfocado || !ciudades) return { lista: [], sinCoordenada: 0 };
    const porCiudad = new Map<string, { nombre: string; lat: number; lng: number; lista: string[] }>();
    const sinPunto = new Set<string>();
    for (const uni of universidades) {
      const entrada = ciudades[claveCiudad(uni.CITY, uni.STABBR)];
      if (fipsDe(entrada) !== condadoEnfocado) continue;
      const punto = puntoDe(entrada);
      if (!punto) { sinPunto.add(uni.CITY); continue; }
      const clave = uni.CITY;
      if (!porCiudad.has(clave)) {
        porCiudad.set(clave, { nombre: uni.CITY, lat: punto[0], lng: punto[1], lista: [] });
      }
      porCiudad.get(clave)!.lista.push(uni.INSTNM);
    }
    return {
      lista: [...porCiudad.values()].sort((a, b) => b.lista.length - a.lista.length),
      sinCoordenada: sinPunto.size,
    };
  }, [condadoEnfocado, ciudades, universidades]);

  const nombreCondado = useMemo(() => {
    if (!condadoEnfocado || !geo) return null;
    return geo.features.find(f => String(f.id) === condadoEnfocado)?.properties?.nombre ?? null;
  }, [condadoEnfocado, geo]);

  const maxCiudad = ciudadesDelCondado[0]?.lista.length ?? 1;

  if (cargando || !ciudades) return <Aviso>Cargando el mapa de {nombreEstado}…</Aviso>;

  if (!geo) {
    return (
      <Aviso>
        No hay geometría de condados disponible para {nombreEstado}.
        <div style={{ fontSize: '11px', marginTop: '6px', color: 'var(--text-muted)' }}>
          Los territorios (Guam, Samoa Americana, Islas Marianas, Islas Vírgenes,
          Micronesia, Islas Marshall y Palaos) no están divididos en condados.
        </div>
      </Aviso>
    );
  }

  const claveCapa = `${estadoSeleccionado}-${maximo}-${Object.keys(conteoPorCondado).length}-${condadoEnfocado ?? 'todo'}`;

  return (
    <div style={{ position: 'relative', width: '100%', height: '340px' }}>
      <MapContainer
        style={{ height: '100%', width: '100%', borderRadius: '6px', background: '#ffffff' }}
        scrollWheelZoom={false}
        attributionControl={false}
        minZoom={3}
        maxZoom={14}
        zoom={6}
        center={[39.5, -98.35]}
      >
        {/* El mapa base solo aparece al entrar a un condado: en la vista del
            estado estorbaría, y así no se piden teselas hasta que hacen falta. */}
        {condadoEnfocado && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution=""
            maxZoom={19}
          />
        )}

        <GeoJSON key={claveCapa} data={geo as any} style={estiloCondado as any} onEachFeature={alCrearCondado as any} />

        {/* Cada ciudad del condado, con tamaño según cuántas universidades tiene */}
        {ciudadesDelCondado.map(ciudad => {
          const cantidad = ciudad.lista.length;
          const indice = indiceTramo(cantidad, maxCiudad);
          return (
            <CircleMarker
              key={ciudad.nombre}
              center={[ciudad.lat, ciudad.lng]}
              radius={6 + Math.sqrt(cantidad / maxCiudad) * 12}
              pathOptions={{
                fillColor: ESCALA[Math.max(1, indice)],
                fillOpacity: 0.85,
                color: '#ffffff',
                weight: 2,
              }}
            >
              <Popup>
                {/* Sin <ul>/<li>: index.css le mete 16px de relleno y un borde a
                    todo <li> de la página, y el globo salía enorme. */}
                <div style={{ fontSize: '12px', minWidth: '170px', maxWidth: '230px' }}>
                  <strong style={{ fontSize: '13px' }}>{ciudad.nombre}</strong>
                  <div style={{ color: '#64748b', margin: '2px 0 6px 0' }}>
                    {cantidad} universidad{cantidad === 1 ? '' : 'es'}
                  </div>
                  <div style={{ maxHeight: '120px', overflowY: 'auto', lineHeight: 1.35 }}>
                    {ciudad.lista.slice(0, 6).map(nombre => (
                      <div key={nombre} style={{ padding: '1px 0 1px 10px', textIndent: '-10px' }}>· {nombre}</div>
                    ))}
                  </div>
                  {cantidad > 6 && (
                    <div style={{ color: '#64748b', marginTop: '4px' }}>y {cantidad - 6} más…</div>
                  )}
                  {onSeleccionarCiudad && (
                    <button
                      onClick={() => onSeleccionarCiudad(ciudad.nombre)}
                      style={{
                        marginTop: '10px', width: '100%', padding: '6px 10px',
                        fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        background: '#0284c7', color: '#ffffff',
                        border: 'none', borderRadius: '4px',
                      }}
                    >
                      Filtrar por {ciudad.nombre}
                    </button>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        <Controlador geo={geo} mapaRef={mapaRef} limitesEstado={limitesEstado} />
      </MapContainer>

      {condadoEnfocado && (
        <>
          <div style={{
            position: 'absolute', top: '10px', left: '50px', zIndex: 1000,
            background: 'rgba(255,255,255,0.94)', padding: '5px 10px',
            borderRadius: '4px', fontSize: '11px', color: '#0f172a',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)', fontWeight: 600,
          }}>
            {nombreCondado ?? 'Condado'} · {ciudadesDelCondado.length} ciudad{ciudadesDelCondado.length === 1 ? '' : 'es'}
            {sinCoordenada > 0 && (
              <span style={{ fontWeight: 400, color: '#92400e' }}> · {sinCoordenada} sin ubicar</span>
            )}
          </div>

          <button
            onClick={verEstadoCompleto}
            style={{
              position: 'absolute', top: '10px', right: '10px', zIndex: 1000,
              padding: '6px 12px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              background: '#ffffff', color: '#0f172a',
              border: '1px solid #cbd5e1', borderRadius: '4px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            ← Ver todo {nombreEstado}
          </button>

          {/* Atribución obligatoria del mapa base */}
          <div style={{
            position: 'absolute', bottom: '0', left: '0', zIndex: 1000,
            background: 'rgba(255,255,255,0.85)', padding: '1px 5px',
            fontSize: '9px', color: '#64748b',
          }}>
            © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" style={{ color: '#64748b' }}>OpenStreetMap</a>
            {' '}© <a href="https://carto.com/attributions" target="_blank" rel="noreferrer" style={{ color: '#64748b' }}>CARTO</a>
          </div>
        </>
      )}

      {/* Leyenda. Los recuadros de color son <rect> de SVG a propósito: index.css
          repinta a la fuerza cualquier div o span que lleve background-color en
          línea, y eso dejaba todos los tramos del mismo color. */}
      {/* Dentro de un condado la unidad deja de ser el condado y pasa a ser la
          ciudad, así que la leyenda cambia de escala en vez de mentir. */}
      {condadoEnfocado && ciudadesDelCondado.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000,
          background: '#ffffff', padding: '8px 10px', borderRadius: '4px',
          fontSize: '10px', color: '#334155', boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: '#0f172a' }}>Ciudades del condado</div>
          <svg width="150" height="26" role="img" aria-label="Cada círculo es una ciudad; el tamaño indica cuántas universidades tiene">
            <circle cx="10" cy="13" r="5" fill={ESCALA[1]} stroke="#ffffff" strokeWidth="2" />
            <circle cx="34" cy="13" r="9" fill={ESCALA[3]} stroke="#ffffff" strokeWidth="2" />
            <text x="50" y="11" fontSize="9" fill="#64748b">tamaño = nº de</text>
            <text x="50" y="21" fontSize="9" fill="#64748b">universidades</text>
          </svg>
        </div>
      )}

      {!condadoEnfocado && tramos.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '10px', right: '10px', zIndex: 1000,
          background: '#ffffff', padding: '8px 10px', borderRadius: '4px',
          fontSize: '10px', color: '#334155', boxShadow: '0 1px 6px rgba(0,0,0,0.25)',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px', color: '#0f172a', fontSize: '10px' }}>
            Universidades por condado
          </div>
          <svg width={(tramos.length + 1) * 38} height="30" role="img" aria-label="Escala de color por cantidad de universidades">
            <rect x="1" y="0" width="34" height="13" rx="2" fill={SIN_DATOS} stroke="#cbd5e1" />
            <text x="18" y="25" textAnchor="middle" fontSize="9" fill="#64748b">0</text>
            {tramos.map((t, i) => (
              <g key={t.color}>
                <rect x={(i + 1) * 38 + 1} y="0" width="34" height="13" rx="2" fill={t.color} />
                <text x={(i + 1) * 38 + 18} y="25" textAnchor="middle" fontSize="9" fill="#64748b">
                  {t.desde === t.hasta ? t.desde : `${t.desde}–${t.hasta}`}
                </text>
              </g>
            ))}
          </svg>
        </div>
      )}

      {sinUbicar > 0 && (
        <div style={{
          position: 'absolute', bottom: '10px', left: '10px', zIndex: 1000,
          background: 'rgba(255,255,255,0.92)', padding: '5px 8px',
          borderRadius: '4px', fontSize: '10px', color: '#64748b',
        }}>
          {sinUbicar} sin ubicación conocida
        </div>
      )}
    </div>
  );
});
