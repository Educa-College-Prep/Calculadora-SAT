import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import { obtenerCoordenadasFallback } from '../utils/coordenadasFallback';
import type { Universidad } from '../types';

interface Props {
  universidades: Universidad[];
  estadoSeleccionado: string;
}

interface CiudadAgrupada {
  nombre: string;
  count: number;
  coords: [number, number];
}

export function MapaCiudades({ universidades, estadoSeleccionado }: Props) {
  const [ciudadesAgrupadas, setCiudadesAgrupadas] = useState<CiudadAgrupada[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    
    // Agrupar universidades por ciudad
    const ciudadMap = new Map<string, { count: number; nombre: string }>();
    
    universidades.forEach(uni => {
      if (uni.CITY) {
        const ciudadNormalizada = uni.CITY.trim();
        const key = ciudadNormalizada.toLowerCase();
        
        if (!ciudadMap.has(key)) {
          ciudadMap.set(key, { count: 0, nombre: ciudadNormalizada });
        }
        const entry = ciudadMap.get(key)!;
        entry.count += 1;
      }
    });

    // Convertir a array con coordenadas
    const resultados: CiudadAgrupada[] = [];
    ciudadMap.forEach(({ count, nombre }) => {
      const coords = obtenerCoordenadasFallback(nombre, estadoSeleccionado);
      if (coords) {
        resultados.push({ nombre, count, coords });
      }
    });

    // Ordenar por cantidad descendente
    resultados.sort((a, b) => b.count - a.count);

    console.log(`📍 ${resultados.length} ciudades con ${universidades.length} universidades`);
    setCiudadesAgrupadas(resultados);
    setCargando(false);
  }, [universidades, estadoSeleccionado]);

  if (cargando) {
    return (
      <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        <div style={{ textAlign: 'center' }}>
          <div>🔄 Preparando mapa de calor...</div>
        </div>
      </div>
    );
  }

  if (ciudadesAgrupadas.length === 0) {
    return (
      <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>
        <div style={{ textAlign: 'center' }}>
          <div>⚠️ No hay datos para este estado</div>
        </div>
      </div>
    );
  }

  // Calcular centroide y valores min/max para normalizar
  const lats = ciudadesAgrupadas.map(c => c.coords[0]);
  const lons = ciudadesAgrupadas.map(c => c.coords[1]);
  const counts = ciudadesAgrupadas.map(c => c.count);
  
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const maxCount = Math.max(...counts);

  // Función para mapear conteo a radio (5-30px) y color
  const getRadioYColor = (count: number) => {
    const normalized = count / maxCount;
    const radio = 5 + normalized * 25; // 5-30px
    
    // Gradiente de color: azul claro -> azul oscuro
    let color: string;
    if (normalized < 0.33) {
      color = '#38bdf8'; // Azul claro
    } else if (normalized < 0.66) {
      color = '#0284c7'; // Azul medio
    } else {
      color = '#075985'; // Azul oscuro
    }
    
    return { radio, color };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '280px' }}>
      <MapContainer
        center={[centerLat, centerLon] as [number, number]}
        zoom={6}
        style={{ height: '100%', width: '100%', borderRadius: '4px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution={String('&copy; OpenStreetMap contributors')}
        />
        
        {ciudadesAgrupadas.map((ciudad, idx) => {
          const { radio, color } = getRadioYColor(ciudad.count);
          return (
            <CircleMarker
              key={idx}
              center={ciudad.coords}
              radius={radio}
              pathOptions={{
                fillColor: color,
                fillOpacity: 0.7,
                weight: 2,
                opacity: 0.9,
                color: '#fff'
              }}
            >
              <Popup>
                <div style={{ fontSize: '13px', minWidth: '150px' }}>
                  <strong>{ciudad.nombre}</strong><br />
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                    {ciudad.count} universidad{ciudad.count !== 1 ? 's' : ''}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      
      {/* Leyenda */}
      <div style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        backgroundColor: '#fff',
        padding: '12px',
        borderRadius: '4px',
        fontSize: '11px',
        boxShadow: '0 0 5px rgba(0,0,0,0.2)',
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '6px' }}>
          Concentración ({ciudadesAgrupadas.length} ciudades)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#38bdf8', borderRadius: '50%' }} />
          <span>Bajo</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <div style={{ width: '14px', height: '14px', backgroundColor: '#0284c7', borderRadius: '50%' }} />
          <span>Medio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '20px', height: '20px', backgroundColor: '#075985', borderRadius: '50%' }} />
          <span>Alto</span>
        </div>
      </div>
    </div>
  );
}
