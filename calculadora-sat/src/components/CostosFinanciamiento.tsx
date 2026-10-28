import { useState } from 'react';
import type { Universidad } from '../types';
import { formatDinero } from '../utils/formatters';
import { calcularCostoVida } from '../utils/costos';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { CostoVida } from './CostoVida';
import { MiniBarChart } from './MiniBarChart';
import { Pestanas } from './Pestanas';
import { useFuentesDatos } from '../utils/fuentesDatos';

type PerfilId = 'in' | 'out' | 'us' | 'intl';

interface Perfil {
  id: PerfilId;
  label: string;
  matricula: number | null;
  /** Costo después de becas, dato real (solo residentes del estado / EE.UU.). */
  netoReal: number | null;
  /** Precio neto por ingreso familiar, dato real; mismo caso que netoReal. */
  netoPorIngreso: { label: string; valor: number }[];
  /** Aclaración de qué recibe este perfil. */
  nota: string | null;
}

function porIngreso(uni: Universidad, suf: 'PUB' | 'PRIV') {
  return [
    { label: 'Hasta $30k', valor: suf === 'PUB' ? uni.NPT41_PUB : uni.NPT41_PRIV },
    { label: '$48k–$75k', valor: suf === 'PUB' ? uni.NPT43_PUB : uni.NPT43_PRIV },
    { label: 'Más de $110k', valor: suf === 'PUB' ? uni.NPT45_PUB : uni.NPT45_PRIV },
  ].filter((d): d is { label: string; valor: number } => d.valor != null);
}

/**
 * Costos y financiamiento por perfil de estudiante, en pestañas.
 * El gobierno de EE.UU. solo publica el "después de becas" para residentes del estado
 * (públicas) o para todos (privadas). Para otros estados e internacionales ese dato no
 * existe: se muestra un aproximado = costo total − beca típica de la universidad.
 * Por defecto se abre "Internacional" (el público de esta web).
 */
export function CostosFinanciamiento({ uni }: { uni: Universidad }) {
  const cv = calcularCostoVida(uni);
  const anios = useFuentesDatos();
  const anioCostos = anios?.scorecard.anios.matricula_y_costo_de_vida;
  const anioBecas = anios?.ipeds.anios.becas_primer_anio;
  const anioNeto = anios?.scorecard.anios.precio_neto;
  const matIn = uni.TUITIONFEE_IN ?? null;
  const matOut = uni.TUITIONFEE_OUT ?? null;
  const matUS = matOut ?? matIn; // privadas/sin distinción: la matrícula que haya
  const hayDistincionEstado = matIn != null && matOut != null && matIn !== matOut;

  // Sin dato de becas no se muestra el aviso de internacionales del bloque de becas: va aquí.
  const notaIntl = uni.IGRNT_P == null ? 'Los internacionales no reciben ayuda del gobierno de EE.UU.; solo becas de la universidad, si las otorga.' : null;

  const perfiles: Perfil[] = hayDistincionEstado
    ? [
        { id: 'in', label: 'Residente del estado', matricula: matIn, netoReal: uni.NPT4_PUB ?? null, netoPorIngreso: porIngreso(uni, 'PUB'), nota: null },
        { id: 'out', label: 'Otro estado (EE.UU.)', matricula: matOut, netoReal: null, netoPorIngreso: [], nota: 'Los alumnos de otros estados pagan la matrícula más alta y no reciben becas estatales.' },
        { id: 'intl', label: 'Internacional', matricula: matOut, netoReal: null, netoPorIngreso: [], nota: notaIntl },
      ]
    : [
        { id: 'us', label: 'EE.UU.', matricula: matUS, netoReal: uni.NPT4_PRIV ?? uni.NPT4_PUB ?? null, netoPorIngreso: porIngreso(uni, 'PRIV').length ? porIngreso(uni, 'PRIV') : porIngreso(uni, 'PUB'), nota: null },
        { id: 'intl', label: 'Internacional', matricula: matUS, netoReal: null, netoPorIngreso: [], nota: notaIntl },
      ];

  const [activo, setActivo] = useState<PerfilId>('intl');
  const p = perfiles.find((x) => x.id === activo) ?? perfiles[0];

  const total = p.matricula != null && cv != null ? p.matricula + cv.valor : null;
  // Aproximado para perfiles sin dato real: resta la beca típica de la universidad.
  const aprox = p.netoReal == null && total != null && uni.IGRNT_A != null ? total - uni.IGRNT_A : null;

  return (
    <div>
      <p className="ficha-intro">Elige cómo postularías: los dos cuadros cambian según tu perfil.</p>
      <Pestanas
        etiqueta="Perfil de estudiante"
        idBase="costos"
        activa={p.id}
        onCambio={setActivo}
        opciones={perfiles.map((x) => ({ id: x.id, label: x.label }))}
      />

      <div id="costos-panel" role="tabpanel" aria-labelledby={`costos-tab-${p.id}`} className="costos-grillas">

        {/* Cuadrícula 1: el precio de lista del año */}
        <div className="costos-columna">
          <h3 className="subtitulo">Lo que cuesta al año</h3>
          {p.matricula != null && (
            <div className="dato-fila">
              <span>Matrícula</span>
              <span className="numero"><strong>{formatDinero(p.matricula)}</strong></span>
            </div>
          )}
          <CostoVida uni={uni} />
          {total != null && (
            <div className="dato-fila costo-total">
              <span className="con-ayuda">Costo total anual
                <InfoTooltip sobre="Costo total anual" texto={glosarioCampos.COSTO_TOTAL_ANUAL} />
              </span>
              <span className="numero">{cv?.estimado && '~'}{formatDinero(total)}</span>
            </div>
          )}
          <p className="fuente">{anioCostos && `Año ${anioCostos}. `}Fuente: College Scorecard</p>
        </div>

        {/* Cuadrícula 2: primero la beca de la universidad y debajo lo que pagarías con ella,
            para que se vea de dónde sale ese número sin tener que hacer la cuenta. */}
        <div className="costos-columna costos-pagarias">
          {uni.IGRNT_P != null && (
            <div className="costos-beca">
              <div className="titulo-con-ayuda titulo-con-ayuda-chico">
                <h3 className="subtitulo">Becas de la universidad</h3>
                <InfoTooltip sobre="Becas de la universidad" texto={glosarioCampos.BECAS_1ER_ANIO} />
              </div>
              <p>
                <strong className="numero">{uni.IGRNT_P}%</strong> de los alumnos de 1er año la recibe
                {uni.IGRNT_A != null && <>, con un promedio de <strong className="numero">{formatDinero(uni.IGRNT_A)}</strong> al año</>}.
              </p>
              <p className="fuente">{anioBecas && `Año ${anioBecas}. `}Fuente: IPEDS</p>
              {/* El gobierno no publica becas por nacionalidad: para extranjeros el % no es su probabilidad. */}
              {p.id === 'intl' && (
                <p className="nota-alerta costos-intl">
                  <strong>Si eres internacional:</strong> no recibes ayuda del gobierno de EE.UU., solo becas de la
                  universidad. Ese {uni.IGRNT_P}% es de todos los alumnos: la universidad no publica cuántos
                  extranjeros la reciben, y suelen ser bastantes menos. Confírmalo con su oficina de admisión.
                </p>
              )}
            </div>
          )}

          <div className={uni.IGRNT_P != null ? 'ficha-bloque' : undefined}>
            <h3 className="subtitulo">Lo que pagarías</h3>
            {/* Después de becas: dato real o aproximado */}
            {p.netoReal != null ? (
              <div className="cifra-destacada">
                <span className="cifra-destacada-valor numero">{formatDinero(p.netoReal)}</span>
                <span className="cifra-destacada-texto">
                  al año en promedio, después de becas y ayudas
                  <InfoTooltip sobre="el precio neto" texto={glosarioCampos.NPT4_PUB} />
                </span>
                <p className="fuente"><strong>Dato oficial</strong> de College Scorecard (Departamento de Educación de EE.UU.){anioNeto && `, año ${anioNeto}`}.</p>
              </div>
            ) : p.id === 'intl' && total != null ? (
              // Internacional: no se sabe si le darán beca, así que lo grande es el costo total sin
              // beca (el mismo de la izquierda, a propósito) y la beca promedio va como posibilidad.
              <div className="cifra-destacada">
                <span className="cifra-destacada-valor numero">{cv?.estimado && '~'}{formatDinero(total)}</span>
                <span className="cifra-destacada-texto">
                  al año, sin beca
                  <InfoTooltip sobre="Costo total anual" texto={glosarioCampos.COSTO_TOTAL_ANUAL} />
                </span>
                {aprox != null && aprox > 0 ? (
                  <>
                    <span className="costos-sin-beca">
                      Si recibes la beca promedio de {formatDinero(uni.IGRNT_A)}, bajaría hasta{' '}
                      <strong className="numero">~{formatDinero(aprox)}</strong> al año.
                      <InfoTooltip sobre="el costo con la beca promedio" texto={glosarioCampos.COSTO_APROX_BECA} />
                    </span>
                    <p className="fuente"><strong>Valor calculado</strong>, no oficial: costo total menos la beca promedio de la universidad (IPEDS).</p>
                  </>
                ) : (
                  <p className="fuente">Precio de lista: matrícula y costo de vida, antes de cualquier beca.</p>
                )}
              </div>
            ) : aprox != null && aprox > 0 ? (
              <div className="cifra-destacada">
                <span className="cifra-destacada-valor numero">~{formatDinero(aprox)}</span>
                <span className="cifra-destacada-texto">
                  al año si recibes la beca promedio de {formatDinero(uni.IGRNT_A)}
                  <InfoTooltip sobre="el costo con la beca promedio" texto={glosarioCampos.COSTO_APROX_BECA} />
                </span>
                {/* La beca no está garantizada: también el escenario sin ella. */}
                <span className="costos-sin-beca">Sin beca: <strong className="numero">{cv?.estimado && '~'}{formatDinero(total)}</strong> al año</span>
                {/* Que no se confunda con el dato oficial de la otra pestaña. */}
                <p className="fuente"><strong>Valor calculado</strong>, no oficial: costo total menos la beca promedio de la universidad (IPEDS).</p>
              </div>
            ) : (
              <p className="ayuda">No hay un costo después de becas publicado para este perfil.</p>
            )}
          </div>

          {p.nota && <p className="nota-alerta costos-nota">{p.nota}</p>}

          {/* Precio neto por ingreso: solo donde hay dato real */}
          {p.netoPorIngreso.length > 0 && (
            <div className="ficha-bloque">
              <p className="con-ayuda"><strong>Precio neto según ingreso familiar</strong>
                <InfoTooltip sobre="Precio neto según ingreso familiar" texto={glosarioCampos.NPT_INGRESO} />
              </p>
              <MiniBarChart datos={p.netoPorIngreso} color="#2a3f8f" formato="dinero" pisoCero />
            </div>
          )}

          {/* La calculadora de la universidad va debajo, en el bloque amarillo de la banda
              Costos (components/DetalleUniversidad). */}
        </div>
      </div>
    </div>
  );
}
