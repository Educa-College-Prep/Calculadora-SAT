import { fechaLarga, useFuentesDatos } from '../utils/fuentesDatos';

/** Pie de todas las vistas: de dónde salen los datos, cuándo se publicaron y que hay que confirmarlos. */
export function AvisoFuentes() {
  const publicado = useFuentesDatos()?.scorecard.publicado;
  return (
    <footer className="aviso-fuentes">
      <p>
        Datos de{' '}
        <a href="https://collegescorecard.ed.gov/" target="_blank" rel="noopener noreferrer">College Scorecard</a>
        {publicado && ` (publicado el ${fechaLarga(publicado)})`}{' '}
        e <a href="https://nces.ed.gov/ipeds/" target="_blank" rel="noopener noreferrer">IPEDS</a>{' '}
        (gobierno de EE.&nbsp;UU.). Son referenciales: analízalos con cuidado y confírmalos con cada universidad.
      </p>
    </footer>
  );
}
