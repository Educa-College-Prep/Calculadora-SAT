import type { Universidad } from '../types';
import { clasificar, rangoSAT } from '../utils/nivelSAT';
import type { Nivel } from '../utils/nivelSAT';
import { CONTACTO } from './BarraEduca';

/**
 * Qué decir según tu probabilidad: con probabilidad baja, el curso SAT (lo que más la mueve)
 * y la consejería; con media o alta, la consejería, con lo que importa en cada caso. Nunca se
 * promete una admisión ni un puntaje (decisión de Educa).
 */
function mensaje(nivel: Nivel | null, conRango: boolean, nombre: string): { titulo: string; texto: string } {
  if (nivel === 'Probabilidad baja') return {
    titulo: `¿Probabilidad baja en ${nombre}? Todavía puedes acercarte.`,
    texto: 'Con un mejor puntaje SAT cambia tu probabilidad. En el curso SAT de Educa te preparas para subirlo, y un consejero te ayuda a armar una lista equilibrada, con universidades donde tienes más posibilidades.',
  };
  if (nivel === 'Probabilidad media') return {
    titulo: `Tienes posibilidades reales en ${nombre}.`,
    texto: 'Con tu puntaje en el rango de sus admitidos, lo que más pesa ahora es tu postulación: ensayos, actividades y cartas. Un consejero de Educa te acompaña para que destaque.',
  };
  if (nivel === 'Probabilidad alta') return {
    titulo: `En ${nombre}, tu puntaje supera al de la mayoría de sus admitidos.`,
    texto: 'El puntaje no lo es todo: un consejero de Educa te ayuda a preparar tu postulación y a armar una lista equilibrada para no depender de una sola universidad.',
  };
  // Sin rango SAT no hay con qué comparar: no se habla del puntaje, solo de la postulación.
  if (!conRango) return {
    titulo: `¿Te interesa ${nombre}?`,
    texto: 'Un consejero de Educa te ayuda a armar tu lista de universidades y a preparar una postulación que muestre lo mejor de ti.',
  };
  return {
    titulo: `¿Quieres saber si te alcanza para ${nombre}?`,
    texto: 'En el curso SAT de Educa te preparas para el examen, y un consejero te ayuda a armar tu lista de universidades y a preparar tu postulación.',
  };
}

/**
 * Cierre de la ficha: el siguiente paso con Educa, al final, antes de las similares. Va en
 * todas las fichas (también en las que no tienen videos de Educa) y cambia según tu
 * probabilidad de entrar. Lleva a la misma página de contacto que la barra de arriba.
 */
export function CierreEduca({ uni, puntaje, nombre }: { uni: Universidad; puntaje: number; nombre: string }) {
  const nivel = puntaje > 0 ? clasificar(uni, puntaje) : null;
  const { titulo, texto } = mensaje(nivel, rangoSAT(uni) != null, nombre);
  return (
    <section className="banda banda-contacto" aria-labelledby="cierre-educa-titulo">
      <div className="in cierre-educa">
        <div className="cierre-educa-texto">
          <h2 id="cierre-educa-titulo" className="banda-titulo">{titulo}</h2>
          <p>{texto}</p>
        </div>
        <div className="cierre-educa-accion">
          <a className="boton-sol" href={CONTACTO} target="_blank" rel="noopener noreferrer">
            Habla con un consejero de Educa
            <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
          </a>
          <p className="cierre-educa-nota">Admission Counseling y curso SAT · Educa College Prep</p>
        </div>
      </div>
    </section>
  );
}
