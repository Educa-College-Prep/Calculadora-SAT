import logoEduca from '../assets/educa-logo.png';

const WEB_EDUCA = 'https://educacollegeprep.com/pe/';
const CONTACTO = 'https://educacollegeprep.com/pe/contactanos/';
const SIMULACRO = 'https://educacollegeprep.com/pe/examen-sat/';

/**
 * Barra de Educa College Prep, como la de su web: logo, nombre de la herramienta y
 * "Contáctanos". Debajo, la franja amarilla del simulacro de SAT.
 * Va fuera de #root (ver main.tsx) para ocupar todo el ancho de la pantalla.
 */
export function BarraEduca() {
  return (
    <header className="barra-educa">
      <div className="barra-educa-interior">
        <a className="barra-educa-marca" href={WEB_EDUCA} target="_blank" rel="noopener noreferrer">
          <img src={logoEduca} alt="Educa College Prep" width="210" height="40" />
        </a>
        <span className="barra-educa-producto">College Finder</span>
        <a className="barra-educa-contacto" href={CONTACTO} target="_blank" rel="noopener noreferrer">
          Contáctanos
          <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
        </a>
      </div>
      <p className="barra-educa-aviso">
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="11" fill="#0c1f4a" />
          <path d="M12 6.5v7" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="17" r="1.25" fill="#fff" />
        </svg>
        Toma un simulacro de SAT
        <a href={SIMULACRO} target="_blank" rel="noopener noreferrer">Regístrate ahora</a>
      </p>
    </header>
  );
}
