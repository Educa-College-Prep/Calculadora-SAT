import { EDICION_USNEWS } from '../data/rankingUSNews';

/** Pie de todas las vistas: de dónde salen los datos y que hay que confirmarlos con cada universidad. */
export function AvisoFuentes() {
  return (
    <footer className="aviso-fuentes">
      <p className="aviso-fuentes-titulo">Usa esta información como guía, no como dato final</p>
      <p>
        Los datos salen de fuentes públicas de EE.&nbsp;UU.:{' '}
        <a href="https://collegescorecard.ed.gov/" target="_blank" rel="noopener noreferrer">College Scorecard</a>{' '}
        del Departamento de Educación (costos, puntajes SAT, salarios) e{' '}
        <a href="https://nces.ed.gov/ipeds/" target="_blank" rel="noopener noreferrer">IPEDS</a>{' '}
        (admisión, becas y política de puntajes). El ranking es de U.S. News {EDICION_USNEWS} y las fotos, de Wikimedia Commons.
      </p>
      <p>
        Estas cifras se publican con uno o dos años de atraso y cada universidad puede cambiar sus requisitos,
        costos y becas. Analízalas con cuidado y confírmalas siempre en la web oficial de cada universidad
        o con su oficina de admisión antes de tomar una decisión.
      </p>
    </footer>
  );
}
