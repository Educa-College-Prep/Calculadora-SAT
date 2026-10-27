import { useRef } from 'react';
import type { ReactNode } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, formatNivel, formatPoliticaSAT } from '../utils/formatters';
import { calcularCostoVida } from '../utils/costos';
import { glosarioCampos } from '../utils/glosarioCampos';
import { posicionUSNews, NOMBRE_LISTA, FUENTE_USNEWS } from '../data/rankingUSNews';
import { InfoTooltip } from './InfoTooltip';
import { BarraFlotante } from './BarraFlotante';
import { useALaVista, useSubiendo } from '../utils/useDesplazamiento';

interface Props {
  universidades: Universidad[];
  onSeleccionar: (uni: Universidad) => void;
  onQuitar: (uni: Universidad) => void;
  onVaciar: () => void;
  onVolver: () => void;
}

interface Fila {
  etiqueta: string;
  ayuda?: string;
  /** Valor numérico para decidir cuál es la mejor (si aplica). */
  numero?: (u: Universidad) => number | null | undefined;
  /** Cómo se muestra. Si no se da, se usa `numero` con `formato`. */
  texto?: (u: Universidad) => ReactNode;
  formato?: 'dinero' | 'porcentaje' | 'numero';
  /** Qué valor se resalta como el mejor. Sin esto, la fila no resalta nada. */
  mejor?: 'menor' | 'mayor';
}

interface Grupo { titulo: string; filas: Fila[] }

const matriculaDe = (u: Universidad) => u.TUITIONFEE_OUT ?? u.TUITIONFEE_IN ?? null;
const netoDe = (u: Universidad) => u.NPT4_PUB ?? u.NPT4_PRIV ?? null;
const totalAnual = (u: Universidad) => {
  const m = matriculaDe(u);
  const v = calcularCostoVida(u);
  return m != null && v ? m + v.valor : u.COSTT4_A ?? null;
};
const rangoSAT = (u: Universidad) =>
  u.SATVR25 != null && u.SATMT25 != null && u.SATVR75 != null && u.SATMT75 != null
    ? `${u.SATVR25 + u.SATMT25}–${u.SATVR75 + u.SATMT75}`
    : null;

const GRUPOS: Grupo[] = [
  {
    titulo: 'Lo básico',
    filas: [
      {
        etiqueta: 'Ranking U.S. News 2027',
        ayuda: `Fuente: ${FUENTE_USNEWS}. Solo se muestran las primeras ~50 de cada lista.`,
        numero: u => posicionUSNews(u)?.puesto,
        texto: u => {
          const p = posicionUSNews(u);
          return p ? <>#{p.puesto}<span className="comparar-sub">{NOMBRE_LISTA[p.lista]}</span></> : 'No está en el top 50';
        },
      },
      { etiqueta: 'Tipo', texto: u => u.CONTROL ?? null },
      { etiqueta: 'Carreras', texto: u => formatNivel(u.ICLEVEL) },
      { etiqueta: 'Alumnos de pregrado', ayuda: glosarioCampos.UGDS, numero: u => u.UGDS, formato: 'numero' },
      { etiqueta: 'Alumnos por profesor', ayuda: glosarioCampos.STUFACR, numero: u => u.STUFACR, texto: u => u.STUFACR != null ? `${u.STUFACR}:1` : null, mejor: 'menor' },
    ],
  },
  {
    titulo: 'Admisión y SAT',
    filas: [
      { etiqueta: 'Tasa de admisión', ayuda: glosarioCampos.ADM_RATE, numero: u => u.ADM_RATE, formato: 'porcentaje' },
      { etiqueta: 'Rango SAT (25–75%)', ayuda: glosarioCampos.SAT_RANGO, texto: rangoSAT },
      { etiqueta: 'SAT promedio', ayuda: glosarioCampos.SAT_AVG, numero: u => u.SAT_AVG, texto: u => u.SAT_AVG != null ? String(u.SAT_AVG) : null },
      { etiqueta: 'Política SAT', ayuda: glosarioCampos.ADMCON7, texto: u => formatPoliticaSAT(u.ADMCON7) },
    ],
  },
  {
    titulo: 'Costos al año',
    filas: [
      { etiqueta: 'Matrícula', ayuda: glosarioCampos.TUITIONFEE_OUT, numero: matriculaDe, formato: 'dinero', mejor: 'menor' },
      { etiqueta: 'Costo de vida', numero: u => calcularCostoVida(u)?.valor, formato: 'dinero', mejor: 'menor' },
      { etiqueta: 'Total (matrícula + vida)', numero: totalAnual, formato: 'dinero', mejor: 'menor' },
      { etiqueta: 'Precio neto promedio', ayuda: 'Lo que pagan en promedio, después de becas, los alumnos de EE. UU. con ayuda federal.', numero: netoDe, formato: 'dinero', mejor: 'menor' },
      { etiqueta: 'Reciben beca de la universidad', numero: u => u.IGRNT_P != null ? u.IGRNT_P / 100 : null, formato: 'porcentaje', mejor: 'mayor' },
      { etiqueta: 'Beca promedio de la universidad', numero: u => u.IGRNT_A, formato: 'dinero', mejor: 'mayor' },
    ],
  },
  {
    titulo: 'Después de graduarse',
    filas: [
      { etiqueta: 'Salario a 4 años', ayuda: glosarioCampos.MD_EARN_4YR, numero: u => u.MD_EARN_WNE_4YR, formato: 'dinero', mejor: 'mayor' },
    ],
  },
];

function formatear(valor: number | null | undefined, formato: Fila['formato']): string | null {
  if (valor == null) return null;
  if (formato === 'dinero') return formatDinero(valor);
  if (formato === 'porcentaje') return formatPorcentaje(valor);
  return valor.toLocaleString('en-US');
}

/**
 * "Mi lista": las universidades guardadas, lado a lado. En cada fila se resalta
 * la mejor opción cuando hay una mejor clara (más barata, más becas, mejor salario).
 * Con muchas universidades la tabla se desplaza hacia el costado y la columna de
 * nombres queda fija.
 */
export function ComparadorUniversidades({ universidades, onSeleccionar, onQuitar, onVaciar, onVolver }: Props) {
  const volverRef = useRef<HTMLButtonElement>(null);
  const volverALaVista = useALaVista(volverRef);
  const subiendo = useSubiendo();

  return (
    <main className="comparar">
      <button type="button" className="boton ficha-volver" onClick={onVolver} ref={volverRef}>← Volver a resultados</button>
      {/* En Mi lista no hay nada más que hacer que comparar y volver: "Volver" flota al subir. */}
      <BarraFlotante visible={subiendo && !volverALaVista}>
        <button type="button" className="boton" onClick={onVolver}>← Volver a resultados</button>
      </BarraFlotante>

      <header className="comparar-cabecera">
        <div>
          <h1 className="comparar-titulo">Mi lista</h1>
          <p className="ayuda">
            {universidades.length === 0
              ? 'Todavía no guardas universidades.'
              : `${universidades.length} ${universidades.length === 1 ? 'universidad guardada' : 'universidades guardadas'} en este navegador. En cada fila se resalta la mejor opción.`}
          </p>
        </div>
        {universidades.length > 0 && (
          <button type="button" className="boton" onClick={() => { if (window.confirm('¿Quitar todas las universidades de Mi lista?')) onVaciar(); }}>
            Vaciar lista
          </button>
        )}
      </header>

      {universidades.length === 0 ? (
        <div className="panel panel-cuerpo comparar-vacio">
          <p>
            Toca la <strong>estrella ☆</strong> en cualquier universidad de los resultados o en su ficha
            para guardarla aquí y compararla con otras.
          </p>
          <p className="ayuda">La lista se guarda en este navegador: no hace falta crear una cuenta.</p>
        </div>
      ) : (
        <div className="panel comparar-envoltura">
          <table className="comparar-tabla">
            <thead>
              <tr>
                <th scope="col" className="comparar-esquina"><span className="visualmente-oculto">Dato</span></th>
                {universidades.map(u => (
                  <th scope="col" key={`${u.INSTNM}|${u.CITY}`} className="comparar-uni">
                    <button type="button" className="comparar-nombre" onClick={() => onSeleccionar(u)}>{u.INSTNM}</button>
                    <span className="comparar-lugar">{u.CITY}, {u.STABBR}</span>
                    <button type="button" className="comparar-quitar" onClick={() => onQuitar(u)} aria-label={`Quitar ${u.INSTNM} de Mi lista`}>
                      Quitar
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            {GRUPOS.map(grupo => (
              <tbody key={grupo.titulo}>
                <tr className="comparar-grupo">
                  <th scope="rowgroup" colSpan={universidades.length + 1}>{grupo.titulo}</th>
                </tr>
                {grupo.filas.map(fila => {
                  const numeros = universidades.map(u => fila.numero?.(u) ?? null);
                  const conDato = numeros.filter((n): n is number => n != null);
                  // Solo se resalta si hay al menos dos valores y no son todos iguales.
                  const objetivo = fila.mejor && conDato.length >= 2 && new Set(conDato).size > 1
                    ? (fila.mejor === 'menor' ? Math.min(...conDato) : Math.max(...conDato))
                    : null;
                  return (
                    <tr key={fila.etiqueta}>
                      <th scope="row">
                        <span className="con-ayuda">{fila.etiqueta}{fila.ayuda && <InfoTooltip texto={fila.ayuda} />}</span>
                      </th>
                      {universidades.map((u, i) => {
                        const contenido = fila.texto ? fila.texto(u) : formatear(numeros[i], fila.formato);
                        const esMejor = objetivo != null && numeros[i] === objetivo;
                        return (
                          <td key={`${u.INSTNM}|${u.CITY}`} className={`numero${esMejor ? ' comparar-mejor' : ''}`}>
                            {contenido ?? <span className="comparar-sin-dato">Sin dato</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </main>
  );
}
