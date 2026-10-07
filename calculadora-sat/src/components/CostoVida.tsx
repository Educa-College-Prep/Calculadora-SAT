import type { Universidad } from '../types';
import { formatDinero } from '../utils/formatters';
import { calcularCostoVida } from '../utils/costos';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';

// Íconos de línea (trazos de Lucide, licencia ISC) en SVG inline para no sumar dependencias.
function Icono({ trazos }: { trazos: string[] }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
      {trazos.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

const ICONO_CASA = ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'];
const ICONO_BOLSA = ['M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z', 'M3 6h18', 'M16 10a4 4 0 0 1-8 0'];
const ICONO_LIBRO = ['M4 19.5A2.5 2.5 0 0 1 6.5 17H20', 'M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'];

/** Costo de vida con desglose (dato real) o una sola línea marcada como aprox. (estimado). */
export function CostoVida({ uni }: { uni: Universidad }) {
  const desglose = [
    { label: 'Alojamiento y comida', valor: uni.ROOMBOARD_ON, icono: ICONO_CASA },
    { label: 'Otros gastos', valor: uni.OTHEREXPENSE_ON, icono: ICONO_BOLSA },
    { label: 'Libros y materiales', valor: uni.BOOKSUPPLY, icono: ICONO_LIBRO },
  ].filter((d): d is { label: string; valor: number; icono: string[] } => d.valor != null);

  const costoVida = calcularCostoVida(uni);
  if (costoVida == null) return null;

  if (!costoVida.estimado) {
    return (
      <div>
        <div className="dato-fila">
          <span className="con-ayuda">Costo de vida
            <InfoTooltip texto={glosarioCampos.COSTO_VIDA} />
          </span>
          <span className="numero"><strong>{formatDinero(costoVida.valor)}</strong></span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', margin: '0 0 8px', paddingLeft: '12px', borderLeft: '2px solid var(--tinta-suave)' }}>
          {desglose.map((d) => (
            <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', lineHeight: 1.4, color: 'var(--grafito-suave)' }}>
              <Icono trazos={d.icono} />
              <span style={{ flex: 1 }}>{d.label}</span>
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--grafito)' }}>{formatDinero(d.valor)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dato-fila">
      <span className="con-ayuda">Costo de vida <span className="ayuda" style={{ margin: '0 0 0 4px' }}>(aprox.)</span>
        <InfoTooltip texto={glosarioCampos.COSTO_VIDA_ESTIMADO} />
      </span>
      <span className="numero"><strong>~{formatDinero(costoVida.valor)}</strong></span>
    </div>
  );
}
