import type { Nivel } from '../utils/nivelSAT';
import { NIVELES } from '../utils/nivelSAT';

/** Tres barras como las de señal: 3 = segura, 2 = buena opción, 1 = ambiciosa. */
export function BarrasNivel({ barras }: { barras: number }) {
  return (
    <svg className="barras-nivel" width="14" height="12" viewBox="0 0 14 12" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <rect key={i} x={i * 5} y={8 - i * 4} width="3.5" height={4 + i * 4} rx="1"
          className={i < barras ? 'barra-llena' : 'barra-vacia'} />
      ))}
    </svg>
  );
}

/** Etiqueta Segura / Buena opción / Ambiciosa de una universidad según tu puntaje. */
export function EtiquetaNivel({ nivel }: { nivel: Nivel }) {
  const info = NIVELES.find(n => n.nivel === nivel)!;
  return (
    <span className={`marca marca-nivel marca-nivel-${info.clase}`} title={info.explicacion}>
      <BarrasNivel barras={info.barras} />
      {nivel}
    </span>
  );
}
