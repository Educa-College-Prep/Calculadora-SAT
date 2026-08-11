/**
 * Coordenadas pre-calculadas de ciudades principales de USA
 * Para usar como fallback cuando Nominatim falla
 */
export const COORDENADAS_CIUDADES: Record<string, [number, number]> = {
  // CALIFORNIA
  'Los Angeles': [34.0522, -118.2437],
  'San Francisco': [37.7749, -122.4194],
  'San Diego': [32.7157, -117.1611],
  'Sacramento': [38.5816, -121.4944],
  'Fresno': [36.7469, -119.7726],
  'Long Beach': [33.7701, -118.1937],
  'Oakland': [37.8044, -122.2712],
  'Bakersfield': [35.3733, -119.0187],
  'Anaheim': [33.8354, -117.9985],
  'Riverside': [33.9425, -117.3550],
  
  // NEW YORK
  'New York': [40.7128, -74.0060],
  'Buffalo': [42.8864, -78.8784],
  'Rochester': [43.1566, -77.6088],
  'Syracuse': [43.0481, -76.1474],
  'Albany': [42.6526, -73.7562],
  
  // TEXAS
  'Houston': [29.7604, -95.3698],
  'San Antonio': [29.4241, -98.4936],
  'Dallas': [32.7767, -96.7970],
  'Austin': [30.2672, -97.7431],
  'Fort Worth': [32.7555, -97.3308],
  'El Paso': [31.7619, -106.4850],
  
  // FLORIDA
  'Jacksonville': [30.3322, -81.6557],
  'Miami': [25.7617, -80.1918],
  'Tampa': [27.9506, -82.4572],
  'Orlando': [28.5421, -81.3723],
  'Miami Beach': [25.7907, -80.1300],
  
  // PENNSYLVANIA
  'Philadelphia': [39.9526, -75.1652],
  'Pittsburgh': [40.4406, -79.9959],
  'Allentown': [40.6084, -75.4902],
  'Erie': [42.1280, -80.0850],
  
  // ILLINOIS
  'Chicago': [41.8781, -87.6298],
  'Aurora': [41.7658, -88.3201],
  'Rockford': [42.2711, -89.0937],
  
  // OHIO
  'Columbus': [39.9612, -82.9988],
  'Cleveland': [41.4993, -81.6944],
  'Cincinnati': [39.1031, -84.5120],
  'Toledo': [41.6639, -83.5552],
  
  // MASSACHUSETTS
  'Boston': [42.3601, -71.0589],
  'Worcester': [42.2690, -71.8022],
  'Springfield': [42.1015, -72.5898],
  
  // MICHIGAN
  'Detroit': [42.3314, -83.0458],
  'Grand Rapids': [42.9633, -85.6749],
  
  // NORTH CAROLINA
  'Charlotte': [35.2271, -80.8431],
  'Raleigh': [35.7796, -78.6382],
  'Greensboro': [36.0726, -79.7920],
  'Durham': [35.9940, -78.8986],
  
  // GEORGIA
  'Atlanta': [33.7490, -84.3880],
  'Athens': [33.9519, -83.3576],
  'Savannah': [32.0809, -81.0912],
  
  // VIRGINIA
  'Richmond': [37.5407, -77.4360],
  'Arlington': [38.8816, -77.1043],
  'Virginia Beach': [36.8529, -75.9780],
  
  // WASHINGTON
  'Seattle': [47.6062, -122.3321],
  'Spokane': [47.6587, -117.4260],
  'Tacoma': [47.2529, -122.4443],
  
  // COLORADO
  'Denver': [39.7392, -104.9903],
  'Boulder': [40.0150, -105.2705],
  'Colorado Springs': [38.8339, -104.8202],
  
  // ARIZONA
  'Phoenix': [33.4484, -112.0742],
  'Tempe': [33.4255, -111.9400],
  'Mesa': [33.4148, -111.8313],
  'Tucson': [32.2217, -110.9265],
  
  // UTAH
  'Salt Lake City': [40.7608, -111.8910],
  
  // NEVADA
  'Las Vegas': [36.1699, -115.1398],
  
  // TENNESSEE
  'Memphis': [35.1495, -90.0490],
  'Nashville': [36.1627, -86.7816],
  'Knoxville': [35.9606, -83.9207],
  
  // ALABAMA
  'Birmingham': [33.5186, -86.8104],
  'Montgomery': [32.3792, -86.3077],
  'Huntsville': [34.7304, -86.5881],
  
  // LOUISIANA
  'New Orleans': [29.9511, -90.2623],
  'Baton Rouge': [30.4515, -91.1871],
  'Lafayette': [30.2240, -92.0198],
  
  // KENTUCKY
  'Louisville': [38.2527, -85.7585],
  'Lexington': [38.0297, -84.4784],
  
  // OKLAHOMA
  'Oklahoma City': [35.4676, -97.5164],
  'Tulsa': [36.1540, -95.9928],
  
  // KANSAS
  'Kansas City': [39.0997, -94.5786],
  'Topeka': [39.0473, -95.6752],
  
  // MISSOURI
  'St. Louis': [38.6270, -90.1994],
  'Kansas City, MO': [39.0997, -94.5786],
  
  // MINNESOTA
  'Minneapolis': [44.9778, -93.2650],
  'St. Paul': [44.9537, -93.0900],
  
  // WISCONSIN
  'Milwaukee': [43.0389, -87.9065],
  'Madison': [43.0731, -89.4012],
  
  // IOWA
  'Des Moines': [41.5868, -93.6250],
  'Cedar Rapids': [41.9639, -91.6654],
  
  // NEBRASKA
  'Omaha': [41.2565, -95.9345],
  'Lincoln': [40.8258, -96.6852],
  
  // SOUTH DAKOTA
  'Sioux Falls': [43.5460, -96.7313],
  
  // NORTH DAKOTA
  'Bismarck': [46.8083, -100.7837],
  
  // MONTANA
  'Billings': [45.7833, -103.9987],
  
  // IDAHO
  'Boise': [43.6150, -116.2023],
  
  // WYOMING
  'Cheyenne': [41.1400, -104.8202],
  
  // NEW MEXICO
  'Albuquerque': [35.0844, -106.6504],
  'Las Cruces': [32.3195, -106.4650],
  
  // CONNECTICUT
  'Hartford': [41.7658, -72.6734],
  'New Haven': [41.3083, -72.9279],
  
  // NEW JERSEY
  'Newark': [40.7357, -74.1724],
  'Jersey City': [40.7178, -74.0431],
  
  // DELAWARE
  'Wilmington': [39.7390, -75.5453],
  
  // MARYLAND
  'Baltimore': [39.2904, -76.6122],
  'Annapolis': [38.9784, -76.4922],
  
  // WEST VIRGINIA
  'Charleston': [38.3498, -81.6326],
  
  // SOUTH CAROLINA
  'Charleston, SC': [32.7765, -79.9318],
  'Columbia': [34.0007, -81.0348],
  
  // ARKANSAS
  'Little Rock': [34.7465, -92.2896],
  'Fayetteville': [36.0626, -94.2181],
  
  // MISSISSIPPI
  'Jackson': [32.2988, -90.1848],
  
  // VERMONT
  'Burlington': [44.4759, -73.2121],
  
  // NEW HAMPSHIRE
  'Manchester': [42.9956, -71.4548],
  
  // MAINE
  'Portland': [43.6591, -70.2568],
  
  // RHODE ISLAND
  'Providence': [41.8240, -71.4128],
  
  // HAWAI'I
  'Honolulu': [21.3099, -157.8581],
  
  // ALASKA
  'Anchorage': [61.2181, -149.9003],
  'Juneau': [58.3019, -134.4197],
  
  // PUERTO RICO
  'San Juan': [18.4861, -69.9312],
  'Aguadilla': [18.4861, -67.1551],
  'Ponce': [17.9735, -66.6101],
};

export function obtenerCoordenadasFallback(
  ciudad: string,
  _estado: string
): [number, number] | null {
  // Intenta encontrar la ciudad exacta
  if (COORDENADAS_CIUDADES[ciudad]) {
    return COORDENADAS_CIUDADES[ciudad];
  }

  // Intenta buscar parcialmente
  for (const [nombreCiudad, coords] of Object.entries(COORDENADAS_CIUDADES)) {
    if (
      nombreCiudad.toLowerCase().includes(ciudad.toLowerCase()) ||
      ciudad.toLowerCase().includes(nombreCiudad.toLowerCase())
    ) {
      return coords;
    }
  }

  return null;
}
