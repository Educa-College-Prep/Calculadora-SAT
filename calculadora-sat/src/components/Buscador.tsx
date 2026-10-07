import { memo, useEffect, useRef } from 'react';
import type { Universidad } from '../types';

interface Props {
  busquedaNombre: string;
  setBusquedaNombre: (valor: string) => void;
  mostrarSugerencias: boolean;
  setMostrarSugerencias: (valor: boolean) => void;
  /** Ya ordenadas por relevancia (alias, siglas, errores de tipeo): ver utils/busqueda. */
  sugerencias: Universidad[];
  /** true cuando no hubo coincidencia exacta y se muestran nombres parecidos. */
  sonAproximadas: boolean;
  /** Abre el detalle de la universidad (lo mismo que hacer clic en la tabla). */
  onSeleccionar: (uni: Universidad) => void;
}

export const Buscador = memo(function Buscador({ busquedaNombre, setBusquedaNombre, mostrarSugerencias, setMostrarSugerencias, sugerencias, sonAproximadas, onSeleccionar }: Props) {
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

  const abierto = mostrarSugerencias && busquedaNombre.length > 0;

  return (
    <div ref={contenedorRef} className="buscador">
      <label htmlFor="buscador-universidad" className="buscador-etiqueta">Busca una universidad</label>
      <div className="buscador-campo">
        <svg className="buscador-icono" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id="buscador-universidad"
          type="text"
          autoComplete="off"
          value={busquedaNombre}
          onChange={(e) => { setBusquedaNombre(e.target.value); setMostrarSugerencias(true); }}
          onFocus={() => setMostrarSugerencias(true)}
          onKeyDown={(e) => { if (e.key === 'Escape') setMostrarSugerencias(false); }}
          placeholder="Nombre o sigla: Harvard, MIT, UCLA…"
          aria-expanded={abierto}
          aria-controls="buscador-sugerencias"
        />
        {busquedaNombre && (
          <button
            type="button"
            className="buscador-borrar"
            onClick={() => { setBusquedaNombre(''); setMostrarSugerencias(false); }}
            aria-label="Borrar búsqueda"
          >
            ×
          </button>
        )}
      </div>

      {abierto && (
        <ul id="buscador-sugerencias" className="sugerencias">
          {sugerencias.length > 0 && sonAproximadas && (
            <li className="sugerencias-nota">¿Quisiste decir…?</li>
          )}
          {sugerencias.length > 0 ? (
            sugerencias.map((uni, idx) => (
              <li key={uni._id ?? idx}>
                <button
                  type="button"
                  className="sugerencia"
                  onClick={() => {
                    // El nombre queda en el buscador: al volver del detalle, la lista ya está filtrada.
                    setBusquedaNombre(uni.INSTNM);
                    setMostrarSugerencias(false);
                    onSeleccionar(uni);
                  }}
                >
                  <span className="sugerencia-nombre">{uni.INSTNM}</span>
                  <span className="sugerencia-lugar">{uni.CITY}, {uni.STABBR}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="sugerencias-nota">Sin coincidencias. Prueba con otra palabra o una sigla.</li>
          )}
        </ul>
      )}
    </div>
  );
});
