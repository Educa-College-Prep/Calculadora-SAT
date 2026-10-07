import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Universidad } from '../types';
import { formatDinero } from '../utils/formatters';
import { calcularCostoVida } from '../utils/costos';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { CostoVida } from './CostoVida';
import { MiniBarChart } from './MiniBarChart';

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

const fuente: CSSProperties = { fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' };
const filaCosto: CSSProperties = { display: 'flex', justifyContent: 'space-between', margin: '0 0 6px 0' };

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
      <h4 style={{ margin: '0 0 12px 0', color: 'var(--text-main)' }}>Costos y financiamiento</h4>

      {/* Pestañas de perfil */}
      <div role="tablist" style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {perfiles.map((x) => {
          const sel = x.id === activo;
          return (
            <button
              key={x.id}
              role="tab"
              aria-selected={sel}
              onClick={() => setActivo(x.id)}
              style={{
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '999px',
                border: `1px solid ${sel ? 'var(--brand-blue, #0284c7)' : 'var(--border-subtle, #cbd5e1)'}`,
                background: sel ? 'var(--brand-blue, #0284c7)' : 'transparent',
                color: sel ? '#fff' : 'var(--text-muted)',
              }}
            >
              {x.label}
            </button>
          );
        })}
      </div>

      {/* Costos del perfil */}
      {p.matricula != null && (
        <p style={filaCosto}>
          <span><strong>Matrícula</strong></span>
          <span>{formatDinero(p.matricula)}</span>
        </p>
      )}
      <CostoVida uni={uni} />
      {total != null && (
        <>
          <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle, #444)', margin: '10px 0' }} />
          <p style={{ ...filaCosto, fontSize: '1.05rem' }}>
            <span><strong>Costo total anual</strong>
              <InfoTooltip texto={glosarioCampos.COSTO_TOTAL_ANUAL} />
            </span>
            <span><strong>{cv?.estimado && '~'}{formatDinero(total)}</strong></span>
          </p>
        </>
      )}

      {/* Después de becas: dato real o aproximado */}
      {p.netoReal != null ? (
        <p style={{ ...filaCosto, color: 'var(--brand-blue, #0284c7)' }}>
          <span><strong>Costo promedio después de becas</strong>
            <InfoTooltip texto={glosarioCampos.NPT4_PUB} />
          </span>
          <span><strong>{formatDinero(p.netoReal)}</strong></span>
        </p>
      ) : aprox != null && aprox > 0 ? (
        <p style={{ ...filaCosto, color: 'var(--brand-blue, #0284c7)' }}>
          <span><strong>Costo aprox. con beca de la universidad</strong>
            <InfoTooltip texto={glosarioCampos.COSTO_APROX_BECA} />
          </span>
          <span><strong>~{formatDinero(aprox)}</strong></span>
        </p>
      ) : null}

      {p.nota && <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0 0', lineHeight: 1.4 }}>{p.nota}</p>}

      {calculadora && (
        <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
          <a href={calculadora} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-blue, #0284c7)', fontWeight: 600 }}>
            Calcula tu costo exacto en la universidad →
          </a>
        </p>
      )}

      {/* Becas de la universidad (aplica a todos los perfiles) */}
      {uni.IGRNT_P != null && (
        <>
          <hr style={{ border: 0, borderTop: '1px solid var(--border-subtle, #444)', margin: '12px 0' }} />
          <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            Becas de la universidad
            <InfoTooltip texto={glosarioCampos.BECAS_1ER_ANIO} />
          </p>
          <p style={{ margin: 0, fontSize: '13px' }}>
            <strong>{uni.IGRNT_P}%</strong> de los alumnos de 1er año la recibe
            {uni.IGRNT_A != null && <> · promedio <strong>{formatDinero(uni.IGRNT_A)}</strong></>}
          </p>
          {p.id === 'intl' && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Dato general de todos los alumnos; los internacionales suelen recibir menos.
            </p>
          )}
          <div style={fuente}>Año 2023-24 · Fuente: IPEDS</div>
        </>
      )}

      {/* Precio neto por ingreso: solo donde hay dato real */}
      {p.netoPorIngreso.length > 0 && (
        <>
          <p style={{ margin: '14px 0 6px 0', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            Precio neto por ingreso familiar
            <InfoTooltip texto={glosarioCampos.NPT_INGRESO} />
          </p>
          <MiniBarChart datos={p.netoPorIngreso} color="#f9c74f" formato="dinero" pisoCero />
        </>
      )}
    </div>
  );
}
