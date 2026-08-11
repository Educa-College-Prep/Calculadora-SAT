// Cache de geocodificaciones en memoria
const cacheGeocode: Record<string, [number, number]> = {};

import { obtenerCoordenadasFallback } from './coordenadasFallback';

/**
 * Intenta geocodificar usando Google Maps Geocoding API
 * NOTA: Necesita API key, por ahora usaremos un fallback
 */
export async function geocodificarCiudadGoogle(
  _ciudad: string,
  _estado: string
): Promise<[number, number] | null> {
  try {
    // Este es un fallback - idealmente usarías tu propia API key
    // Por ahora, retorna null para forzar el uso del método alternativo
    return null;
  } catch (error) {
    console.error('Error con Google Geocoding:', error);
    return null;
  }
}

/**
 * Geocodifica una ciudad usando Nominatim (OpenStreetMap)
 * Si falla, usa coordenadas pre-calculadas como fallback
 * Retorna [lat, lng] o null si no encuentra
 */
export async function geocodificarCiudad(
  ciudad: string,
  estado: string
): Promise<[number, number] | null> {
  const cacheKey = `${ciudad}, ${estado}`;

  // Verificar caché en memoria
  if (cacheGeocode[cacheKey]) {
    return cacheGeocode[cacheKey];
  }

  try {
    // Nominatim API (gratuito, sin API key)
    const query = encodeURIComponent(`${ciudad}, ${estado}, USA`);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&addressdetails=1`,
      { 
        headers: { 
          'User-Agent': 'CalculadoraSAT/1.0',
          'Accept': 'application/json'
        },
        mode: 'cors'
      }
    );

    if (!response.ok) {
      console.warn(`HTTP ${response.status} geocodificando ${cacheKey}`);
      // Usar fallback
      const fallback = obtenerCoordenadasFallback(ciudad, estado);
      if (fallback) {
        cacheGeocode[cacheKey] = fallback;
        console.log(`✓ Fallback: ${cacheKey} -> [${fallback[0]}, ${fallback[1]}]`);
        return fallback;
      }
      return null;
    }

    const data = await response.json();

    if (data && data.length > 0) {
      const coords: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      cacheGeocode[cacheKey] = coords;
      console.log(`✓ Geocodificado: ${cacheKey} -> [${coords[0]}, ${coords[1]}]`);
      return coords;
    } else {
      console.warn(`No encontrado en Nominatim: ${cacheKey}`);
      // Usar fallback
      const fallback = obtenerCoordenadasFallback(ciudad, estado);
      if (fallback) {
        cacheGeocode[cacheKey] = fallback;
        console.log(`✓ Fallback: ${cacheKey} -> [${fallback[0]}, ${fallback[1]}]`);
        return fallback;
      }
    }
  } catch (error) {
    console.error(`Error geocodificando ${cacheKey}:`, error);
    // Usar fallback
    const fallback = obtenerCoordenadasFallback(ciudad, estado);
    if (fallback) {
      cacheGeocode[cacheKey] = fallback;
      console.log(`✓ Fallback (error): ${cacheKey} -> [${fallback[0]}, ${fallback[1]}]`);
      return fallback;
    }
  }

  return null;
}

/**
 * Geocodifica múltiples ciudades (con throttling para no sobrecargar Nominatim)
 */
export async function geocodificarCiudades(
  ciudades: Array<{ nombre: string; estado: string; count: number }>
): Promise<Map<string, [number, number]>> {
  const resultados = new Map<string, [number, number]>();

  // Throttle: máximo 1 request por 500ms para no sobrecargar Nominatim
  for (const ciudad of ciudades) {
    const coords = await geocodificarCiudad(ciudad.nombre, ciudad.estado);
    if (coords) {
      const key = `${ciudad.nombre}, ${ciudad.estado}`;
      resultados.set(key, coords);
    }
    // Esperar 500ms entre requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return resultados;
}
