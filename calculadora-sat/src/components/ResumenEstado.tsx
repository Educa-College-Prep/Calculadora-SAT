import { memo, useMemo } from 'react';
import type { Universidad } from '../types';
import { NOMBRES_ESTADOS } from '../utils/estados';
import { formatDinero } from '../utils/formatters';

interface Props {
  universidades: Universidad[];
  estadoSeleccionado: string;
}

function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const orden = [...valores].sort((a, b) => a - b);
  const medio = Math.floor(orden.length / 2);
  return orden.length % 2 ? orden[medio] : Math.round((orden[medio - 1] + orden[medio]) / 2);
}

/** Dato suelto: número grande + etiqueta. No es un gráfico y no debe serlo. */
function Cifra({ valor, etiqueta, nota }: { valor: string; etiqueta: string; nota?: string }) {
  return (
    <div className="cifra">
      <div className="cifra-valor numero">{valor}</div>
      <div className="cifra-etiqueta">{etiqueta}</div>
      {nota && <div className="cifra-nota">{nota}</div>}
    </div>
  );
}

export const ResumenEstado = memo(function ResumenEstado({ universidades, estadoSeleccionado }: Props) {
  const resumen = useMemo(() => {
    const total = universidades.length;
    const publicas = universidades.filter(u => u.CONTROL === 'Pública').length;
    const sinFines = universidades.filter(u => u.CONTROL === 'Privada sin fines de lucro').length;
    const conFines = universidades.filter(u => u.CONTROL === 'Privada con fines de lucro').length;
    const cuatroAnios = universidades.filter(u => u.ICLEVEL === '4-Year').length;

    const matriculas = universidades.map(u => u.TUITIONFEE_OUT).filter((v): v is number => v != null);
    const sats = universidades.map(u => u.SAT_AVG).filter((v): v is number => v != null);

    const porCiudad = new Map<string, number>();
    for (const u of universidades) {
      if (u.CITY) porCiudad.set(u.CITY, (porCiudad.get(u.CITY) || 0) + 1);
    }
    const topCiudades = [...porCiudad.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    return {
      total, publicas, sinFines, conFines, cuatroAnios,
      matriculaMediana: mediana(matriculas), conMatricula: matriculas.length,
      satMediano: mediana(sats), conSat: sats.length,
      topCiudades,
    };
  }, [universidades]);

  const nombreEstado = NOMBRES_ESTADOS[estadoSeleccionado] ?? estadoSeleccionado;
  const maxCiudad = resumen.topCiudades[0]?.[1] ?? 1;
  const anchoBarra = 150;

  return (
    <div className="panel">
      <div className="panel-cabecera">
        <h2 className="titulo-seccion">{nombreEstado} en cifras</h2>
        <p className="ayuda">Calculado sobre tus resultados en este estado.</p>
      </div>

      <div className="panel-cuerpo">
        <div className="cifras">
          <Cifra
            valor={resumen.total.toLocaleString()}
            etiqueta="Universidades"
            nota={`${resumen.cuatroAnios} de bachiller, ${resumen.total - resumen.cuatroAnios} de associate`}
          />
          <Cifra
            valor={resumen.total ? `${Math.round((resumen.publicas / resumen.total) * 100)}%` : '—'}
            etiqueta="Son públicas"
            nota={`${resumen.publicas} públicas, ${resumen.sinFines + resumen.conFines} privadas`}
          />
          <Cifra
            valor={formatDinero(resumen.matriculaMediana) ?? 'Sin datos'}
            etiqueta="Matrícula mediana"
            nota={`${resumen.conMatricula} de ${resumen.total} informan precio`}
          />
          <Cifra
            valor={resumen.satMediano ? String(resumen.satMediano) : 'Sin datos'}
            etiqueta="SAT promedio (mediana)"
            nota={`solo ${resumen.conSat} de ${resumen.total} lo informan`}
          />
        </div>

        {resumen.conFines > 0 && (
          <p className="nota-alerta">
            {resumen.conFines} son privadas <strong>con fines de lucro</strong>,
            un perfil con retorno salarial habitualmente más bajo. Conviene mirarlas aparte.
          </p>
        )}

        {resumen.topCiudades.length > 0 && (
          <div className="ciudades-top">
            <h3 className="subtitulo">Ciudades con más universidades</h3>
            <svg width="100%" height={resumen.topCiudades.length * 24} role="img" aria-label="Ciudades con más universidades">
              {resumen.topCiudades.map(([ciudad, cantidad], i) => (
                <g key={ciudad} transform={`translate(0, ${i * 24})`}>
                  <text x="0" y="15" fontSize="13" fill="#26292b">
                    {ciudad.length > 16 ? ciudad.slice(0, 15) + '…' : ciudad}
                  </text>
                  <rect x="122" y="6" width={anchoBarra} height="10" rx="5" fill="#e8f2ec" />
                  <rect x="122" y="6" width={Math.max(5, (cantidad / maxCiudad) * anchoBarra)} height="10" rx="5" fill="#2e7d62" />
                  <text x={122 + anchoBarra + 8} y="15" fontSize="13" fontWeight="700" fill="#26292b">{cantidad}</text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
});
