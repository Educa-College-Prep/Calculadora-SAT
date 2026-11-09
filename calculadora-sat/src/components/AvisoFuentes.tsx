import { fechaLarga, useFuentesDatos } from '../utils/fuentesDatos';
import { CONTACTO } from './BarraEduca';

/**
 * De dónde salen los datos, cuándo se publicaron y que hay que confirmarlos. Lo usan el pie y el
 * paso 1; ahí va `corto`, en una línea, porque compite con la pregunta.
 */
export function TextoFuentes({ corto = false }: { corto?: boolean }) {
  const publicado = useFuentesDatos()?.scorecard.publicado;
  if (corto) {
    return (
      <>
        Datos referenciales de{' '}
        <a href="https://collegescorecard.ed.gov/" target="_blank" rel="noopener noreferrer">College Scorecard</a>
        {publicado && ` (${fechaLarga(publicado)})`} e{' '}
        <a href="https://nces.ed.gov/ipeds/" target="_blank" rel="noopener noreferrer">IPEDS</a>: confírmalos con cada universidad.
      </>
    );
  }
  return (
    <>
      Datos de{' '}
      <a href="https://collegescorecard.ed.gov/" target="_blank" rel="noopener noreferrer">College Scorecard</a>
      {publicado && ` (publicado el ${fechaLarga(publicado)})`}{' '}
      e <a href="https://nces.ed.gov/ipeds/" target="_blank" rel="noopener noreferrer">IPEDS</a>{' '}
      (gobierno de EE.&nbsp;UU.). Son referenciales: analízalos con cuidado y confírmalos con cada universidad.
    </>
  );
}

/**
 * Pie de las vistas (no de los pasos: ahí la barra de "Por ahora encajan" va pegada al borde).
 * Lleva también "Contáctanos": su botón de la barra de arriba se cambió por "Mi lista y comparar".
 */
export function AvisoFuentes() {
  return (
    <footer className="aviso-fuentes">
      <p><TextoFuentes /></p>
      <p>
        ¿Tienes dudas sobre tu postulación?{' '}
        <a href={CONTACTO} target="_blank" rel="noopener noreferrer">
          Contáctanos<span className="visualmente-oculto"> (se abre en otra pestaña)</span>
        </a>
      </p>
    </footer>
  );
}
