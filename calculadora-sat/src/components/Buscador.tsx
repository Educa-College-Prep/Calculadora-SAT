import { memo, useDeferredValue, useEffect, useMemo, useRef } from 'react';
import type { Universidad } from '../types';

interface Props {
  busquedaNombre: string;
  setBusquedaNombre: (valor: string) => void;
  mostrarSugerencias: boolean;
  setMostrarSugerencias: (valor: boolean) => void;
  universidades: Universidad[];
}

export const Buscador = memo(function Buscador({ busquedaNombre, setBusquedaNombre, mostrarSugerencias, setMostrarSugerencias, universidades }: Props) {
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function manejarClicFuera(evento: MouseEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setMostrarSugerencias(false);
      }
    }
    document.addEventListener('mousedown', manejarClicFuera);
    return () => document.removeEventListener('mousedown', manejarClicFuera);
  }, [setMostrarSugerencias]);

  // El cálculo de sugerencias recorre las 4300 universidades: se difiere y se
  // memoiza para que escribir en el input no bloquee la interfaz.
  const busquedaDiferida = useDeferredValue(busquedaNombre);

  const sugerencias = useMemo(() => {
    if (busquedaDiferida.length === 0) return [];
    const texto = busquedaDiferida.toLowerCase();
    const encontradas: Universidad[] = [];
    for (const uni of universidades) {
      if (uni.INSTNM.toLowerCase().includes(texto)) {
        encontradas.push(uni);
        if (encontradas.length === 8) break; // corta apenas junta 8, no recorre el resto
      }
    }
    return encontradas;
  }, [universidades, busquedaDiferida]);

  return (
    <div
      ref={contenedorRef}
      style={{ position: 'relative', padding: '15px 20px', border: '1px solid #444', borderRadius: '8px', backgroundColor: '#1a1a1a' }}
    >
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        🔍 Buscar por Nombre de Universidad:
      </label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          value={busquedaNombre}
          onChange={(e) => { setBusquedaNombre(e.target.value); setMostrarSugerencias(true); }}
          onFocus={() => setMostrarSugerencias(true)}
          placeholder="Ej. Harvard University, California..."
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #555', backgroundColor: '#222', color: '#fff' }}
        />
        {busquedaNombre && (
          <button
            onClick={() => { setBusquedaNombre(''); setMostrarSugerencias(false); }}
            style={{ padding: '10px 15px', backgroundColor: '#e63946', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Limpiar
          </button>
        )}
      </div>

      {mostrarSugerencias && busquedaNombre.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: '20px', right: '20px', zIndex: 1000,
          backgroundColor: '#222', border: '1px solid #444', borderRadius: '0 0 8px 8px',
          listStyle: 'none', padding: 0, margin: 0, maxHeight: '250px', overflowY: 'auto',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          {sugerencias.length > 0 ? (
            sugerencias.map((uni, idx) => (
              <li
                key={uni._id ?? idx}
                onClick={() => { setBusquedaNombre(uni.INSTNM); setMostrarSugerencias(false); }}
                style={{ padding: '10px 15px', borderBottom: '1px solid #333', cursor: 'pointer', textAlign: 'left', transition: '0.2s' }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#333'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#222'}
              >
                <strong style={{ color: '#4cc9f0' }}>{uni.INSTNM}</strong>{' '}
                <small style={{ color: '#aaa' }}>({uni.CITY}, {uni.STABBR})</small>
              </li>
            ))
          ) : (
            <li style={{ padding: '10px 15px', color: '#888', fontStyle: 'italic', textAlign: 'left' }}>No se encontraron coincidencias</li>
          )}
        </ul>
      )}
    </div>
  );
});
