/** Pie de todas las vistas: de dónde salen los datos y que hay que confirmarlos con cada universidad. */
export function AvisoFuentes() {
  return (
    <footer className="aviso-fuentes">
      <p>
        Datos de{' '}
        <a href="https://collegescorecard.ed.gov/" target="_blank" rel="noopener noreferrer">College Scorecard</a>{' '}
        e <a href="https://nces.ed.gov/ipeds/" target="_blank" rel="noopener noreferrer">IPEDS</a>{' '}
        (gobierno de EE.&nbsp;UU.). Son referenciales: analízalos con cuidado y confírmalos con cada universidad.
      </p>
    </footer>
  );
}
