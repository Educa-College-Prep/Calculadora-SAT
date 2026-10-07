import { MiniBarChart } from './MiniBarChart';

interface DatoBarra {
  label: string;
  valor: number;
}

interface Props {
  /** Medido desde la graduación (1 y 5 años): solo quienes se graduaron. */
  graduados: DatoBarra[];
  /** Medido desde el ingreso (6, 8 y 10 años): incluye a quienes no se graduaron. */
  ingreso: DatoBarra[];
  color: string;
  formato: 'dinero' | 'porcentaje';
}

/**
 * College Scorecard mide a los egresados de dos formas que NO forman una línea de tiempo:
 * desde la graduación (solo graduados) y desde el ingreso (todos los que entraron, incluso
 * quienes abandonaron). Juntarlas en un solo gráfico hacía parecer que el valor "bajaba" a
 * los 6 años. Se muestran por separado, con la misma escala para poder comparar alturas.
 */
export function ParGraficosEgresados({ graduados, ingreso, color, formato }: Props) {
  const maxY = Math.max(0, ...graduados.map((d) => d.valor), ...ingreso.map((d) => d.valor));
  const grupos = [
    { titulo: 'Después de graduarse', nota: 'Solo quienes se graduaron', datos: graduados },
    { titulo: 'Después de entrar a la universidad', nota: 'Incluye a quienes no se graduaron', datos: ingreso },
  ].filter((g) => g.datos.length > 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
      {grupos.map((g) => (
        <div key={g.titulo}>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--grafito)' }}>{g.titulo}</p>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--grafito-suave)' }}>{g.nota}</p>
          <MiniBarChart datos={g.datos} color={color} formato={formato} altura={220} maxY={formato === 'porcentaje' ? 100 : maxY} />
        </div>
      ))}
    </div>
  );
}
