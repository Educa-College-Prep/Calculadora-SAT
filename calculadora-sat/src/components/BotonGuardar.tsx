import { useState } from 'react';

/** Estrella para guardar o quitar una universidad de "Mi lista". */
export function BotonGuardar({ guardada, nombre, onAlternar, conTexto = false, etiqueta = false }: {
  guardada: boolean;
  nombre: string;
  onAlternar: () => void;
  /** En la ficha se muestra con texto ("Guardar en Mi lista"); en la lista, solo la estrella. */
  conTexto?: boolean;
  /** En la lista: "Guardar" chico bajo la estrella (mientras Mi lista está vacía). */
  etiqueta?: boolean;
}) {
  // Solo anima lo que la persona toca: al cargar la lista, las estrellas no se mueven.
  const [tocado, setTocado] = useState(false);
  const cambia = (clase: string) => tocado ? ` ${clase}` : '';
  return (
    <button
      type="button"
      className={`boton-guardar${conTexto ? ' boton-guardar-texto boton' : ''}${guardada ? ' boton-guardar-activo' : ''}`}
      onClick={() => { setTocado(true); onAlternar(); }}
      aria-pressed={guardada}
      aria-label={guardada ? `Quitar ${nombre} de Mi lista` : `Guardar ${nombre} en Mi lista`}
      title={guardada ? 'Quitar de Mi lista' : 'Guardar en Mi lista'}
    >
      <svg key={`icono-${guardada}`} className={cambia('icono-cambia').trim() || undefined} width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"
        fill={guardada ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
        <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8L12 3.2z" />
      </svg>
      {conTexto && <span key={`texto-${guardada}`} className={cambia('texto-cambia').trim() || undefined}>{guardada ? 'En Mi lista' : 'Guardar en Mi lista'}</span>}
      {etiqueta && !conTexto && <span key={`etiqueta-${guardada}`} className={`boton-guardar-etiqueta${cambia('texto-cambia')}`} aria-hidden="true">{guardada ? 'Guardada' : 'Guardar'}</span>}
    </button>
  );
}
