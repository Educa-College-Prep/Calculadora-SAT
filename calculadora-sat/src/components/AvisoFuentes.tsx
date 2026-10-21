import { fechaLarga, mesLargo, useFuentesDatos } from '../utils/fuentesDatos';

/** Pie de todas las vistas: de dónde salen los datos, cuándo se publicaron y que hay que confirmarlos. */
export function AvisoFuentes() {
  const scorecard = useFuentesDatos()?.scorecard;
  const fecha = scorecard?.publicado ? `publicado el ${fechaLarga(scorecard.publicado)}`
    : scorecard?.actualizado ? `actualizado en ${mesLargo(scorecard.actualizado)}` : null;
  return (
    <footer className="aviso-fuentes">
      <p>
        Datos de{' '}
        <a href="https://collegescorecard.ed.gov/" target="_blank" rel="noopener noreferrer">College Scorecard</a>
        {fecha && ` (${fecha})`}{' '}
        e <a href="https://nces.ed.gov/ipeds/" target="_blank" rel="noopener noreferrer">IPEDS</a>{' '}
        (gobierno de EE.&nbsp;UU.). Son referenciales: analízalos con cuidado y confírmalos con cada universidad.
      </p>
    </footer>
  );
}
