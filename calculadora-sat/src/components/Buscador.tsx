import { memo, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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
  /** Prefijo de los id del campo y la lista: la ficha tiene su propio buscador. */
  id?: string;
  etiqueta?: string;
  /** La etiqueta solo para el lector de pantalla (en la ficha, el campo ya se explica solo). */
  etiquetaOculta?: boolean;
  placeholder?: string;
  /** Versión chica, para la franja de arriba de la ficha. */
  compacto?: boolean;
  /** Al elegir: true = el nombre queda escrito (portada, para filtrar la lista al volver). */
  conservarTexto?: boolean;
  autoFocus?: boolean;
}

export const Buscador = memo(function Buscador({ busquedaNombre, setBusquedaNombre, mostrarSugerencias, setMostrarSugerencias, sugerencias, sonAproximadas, onSeleccionar,
  id = 'buscador', etiqueta = 'Busca una universidad', etiquetaOculta = false,
  placeholder = 'Nombre o sigla: Harvard, MIT, UCLA…', compacto = false, conservarTexto = true, autoFocus = false }: Props) {
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

  // Opción marcada con las flechas. Se guarda junto al texto buscado: si el texto cambia,
  // la marca deja de valer sola y se vuelve a empezar desde el campo.
  const [marcada, setMarcada] = useState({ busqueda: '', indice: -1 });
  const indiceMarcado = abierto && marcada.busqueda === busquedaNombre ? marcada.indice : -1;
  const marcar = (indice: number) => {
    setMarcada({ busqueda: busquedaNombre, indice });
    document.getElementById(`${id}-sugerencia-${indice}`)?.scrollIntoView({ block: 'nearest' });
  };

  // En la portada el nombre queda en el buscador: al volver del detalle, la lista ya está
  // filtrada. En la ficha se limpia: el campo es para saltar a otra.
  const elegir = (uni: Universidad) => {
    setBusquedaNombre(conservarTexto ? uni.INSTNM : '');
    setMostrarSugerencias(false);
    onSeleccionar(uni);
  };

  const alPresionarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') setMostrarSugerencias(false);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!busquedaNombre || sugerencias.length === 0) return;
      e.preventDefault();
      if (!abierto) { setMostrarSugerencias(true); return; }
      // Abajo baja hasta la última; arriba sube hasta volver al campo (-1).
      marcar(e.key === 'ArrowDown'
        ? Math.min(indiceMarcado + 1, sugerencias.length - 1)
        : Math.max(indiceMarcado - 1, -1));
    }
    if (e.key === 'Enter' && abierto) {
      // La marcada con las flechas; o, si hay un solo resultado, ese sin tener que marcarlo.
      const uni = indiceMarcado >= 0 ? sugerencias[indiceMarcado] : sugerencias.length === 1 ? sugerencias[0] : null;
      if (uni) { e.preventDefault(); elegir(uni); }
    }
  };

  return (
    <div ref={contenedorRef} className={`buscador${compacto ? ' buscador-compacto' : ''}`}>
      <label htmlFor={`${id}-universidad`} className={etiquetaOculta ? 'visualmente-oculto' : 'buscador-etiqueta'}>{etiqueta}</label>
      <div className="buscador-campo">
        <svg className="buscador-icono" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          id={`${id}-universidad`}
          autoFocus={autoFocus}
          type="text"
          autoComplete="off"
          value={busquedaNombre}
          onChange={(e) => { setBusquedaNombre(e.target.value); setMostrarSugerencias(true); }}
          onFocus={() => setMostrarSugerencias(true)}
          onKeyDown={alPresionarTecla}
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={abierto}
          aria-controls={`${id}-sugerencias`}
          aria-activedescendant={indiceMarcado >= 0 ? `${id}-sugerencia-${indiceMarcado}` : undefined}
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
        <ul id={`${id}-sugerencias`} className="sugerencias">
          {sugerencias.length > 0 && sonAproximadas && (
            <li className="sugerencias-nota">¿Quisiste decir…?</li>
          )}
          {sugerencias.length > 0 ? (
            sugerencias.map((uni, idx) => (
              <li key={uni._id ?? idx}>
                <button
                  id={`${id}-sugerencia-${idx}`}
                  type="button"
                  className={idx === indiceMarcado ? 'sugerencia sugerencia-marcada' : 'sugerencia'}
                  onClick={() => elegir(uni)}
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
