import { useState } from 'react';
import type { Universidad } from '../types';
import { formatDinero } from '../utils/formatters';
import { calcularCostoVida } from '../utils/costos';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { CostoVida } from './CostoVida';
import { MiniBarChart } from './MiniBarChart';
import { Pestanas } from './Pestanas';

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

/** NPCURL a veces viene sin protocolo ("www.uni.edu/..."); se antepone https:// y se descarta lo inválido. */
function urlCalculadora(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim();
  if (!v) return null;
  const url = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try { return new URL(url).href; } catch { return null; }
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
  const matIn = uni.TUITIONFEE_IN ?? null;
  const matOut = uni.TUITIONFEE_OUT ?? null;
  const matUS = matOut ?? matIn; // privadas/sin distinción: la matrícula que haya
  const hayDistincionEstado = matIn != null && matOut != null && matIn !== matOut;

  const perfiles: Perfil[] = hayDistincionEstado
    ? [
        { id: 'in', label: 'Residente del estado', matricula: matIn, netoReal: uni.NPT4_PUB ?? null, netoPorIngreso: porIngreso(uni, 'PUB'), nota: null },
        { id: 'out', label: 'Otro estado (EE.UU.)', matricula: matOut, netoReal: null, netoPorIngreso: [], nota: 'Los alumnos de otros estados pagan la matrícula más alta y no reciben becas estatales.' },
        { id: 'intl', label: 'Internacional', matricula: matOut, netoReal: null, netoPorIngreso: [], nota: 'Los internacionales no reciben ayuda del gobierno de EE.UU.; solo becas de la universidad, si las otorga.' },
      ]
    : [
        { id: 'us', label: 'EE.UU.', matricula: matUS, netoReal: uni.NPT4_PRIV ?? uni.NPT4_PUB ?? null, netoPorIngreso: porIngreso(uni, 'PRIV').length ? porIngreso(uni, 'PRIV') : porIngreso(uni, 'PUB'), nota: null },
        { id: 'intl', label: 'Internacional', matricula: matUS, netoReal: null, netoPorIngreso: [], nota: 'Los internacionales no reciben ayuda del gobierno de EE.UU.; solo becas de la universidad, si las otorga.' },
      ];

  const [activo, setActivo] = useState<PerfilId>('intl');
  const p = perfiles.find((x) => x.id === activo) ?? perfiles[0];

  const total = p.matricula != null && cv != null ? p.matricula + cv.valor : null;
  // Aproximado para perfiles sin dato real: resta la beca típica de la universidad.
  const aprox = p.netoReal == null && total != null && uni.IGRNT_A != null ? total - uni.IGRNT_A : null;
  const calculadora = urlCalculadora(uni.NPCURL);

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
                <InfoTooltip texto={glosarioCampos.COSTO_TOTAL_ANUAL} />
              </span>
              <span className="numero">{cv?.estimado && '~'}{formatDinero(total)}</span>
            </div>
          )}
        </div>

        {/* Cuadrícula 2: lo que pagarías tras becas, según el perfil */}
        <div className="costos-columna costos-pagarias">
          <h3 className="subtitulo">Lo que pagarías</h3>

          {/* Después de becas: dato real o aproximado */}
          {p.netoReal != null ? (
            <div className="cifra-destacada">
              <span className="cifra-destacada-valor numero">{formatDinero(p.netoReal)}</span>
              <span className="cifra-destacada-texto">
                al año en promedio, después de becas
                <InfoTooltip texto={glosarioCampos.NPT4_PUB} />
              </span>
            </div>
          ) : aprox != null && aprox > 0 ? (
            <div className="cifra-destacada">
              <span className="cifra-destacada-valor numero">~{formatDinero(aprox)}</span>
              <span className="cifra-destacada-texto">
                al año con la beca típica de la universidad
                <InfoTooltip texto={glosarioCampos.COSTO_APROX_BECA} />
              </span>
            </div>
          ) : (
            <p className="ayuda">No hay un costo después de becas publicado para este perfil.</p>
          )}

          {p.nota && <p className="nota-alerta costos-nota">{p.nota}</p>}

          {/* Becas de la universidad (aplica a todos los perfiles) */}
          {uni.IGRNT_P != null && (
            <div className="ficha-bloque">
              <p className="con-ayuda"><strong>Becas de la universidad</strong>
                <InfoTooltip texto={glosarioCampos.BECAS_1ER_ANIO} />
              </p>
              <p>
                <strong className="numero">{uni.IGRNT_P}%</strong> de los alumnos de 1er año la recibe
                {uni.IGRNT_A != null && <>, con un promedio de <strong className="numero">{formatDinero(uni.IGRNT_A)}</strong></>}.
              </p>
              {p.id === 'intl' && (
                <p className="ayuda">Dato general de todos los alumnos; los internacionales suelen recibir menos.</p>
              )}
              <p className="fuente">Año 2023-24. Fuente: IPEDS</p>
            </div>
          )}

          {/* Precio neto por ingreso: solo donde hay dato real */}
          {p.netoPorIngreso.length > 0 && (
            <div className="ficha-bloque">
              <p className="con-ayuda"><strong>Precio neto según ingreso familiar</strong>
                <InfoTooltip texto={glosarioCampos.NPT_INGRESO} />
              </p>
              <MiniBarChart datos={p.netoPorIngreso} color="#2e7d62" formato="dinero" pisoCero />
            </div>
          )}

          {calculadora && (
            <a className="boton boton-primario costos-enlace" href={calculadora} target="_blank" rel="noopener noreferrer">
              Calcula tu costo exacto en su web
              <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
