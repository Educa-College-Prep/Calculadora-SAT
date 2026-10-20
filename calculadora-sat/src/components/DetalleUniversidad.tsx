import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, formatNivel } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { calcularCostoVida } from '../utils/costos';
import { similaresParaFicha } from '../utils/similares';
import { InfoTooltip } from './InfoTooltip';
import { BotonGuardar } from './BotonGuardar';
import { FotoUniversidad, CreditoFoto } from './FotoUniversidad';
import { UniversidadesSimilares } from './UniversidadesSimilares';
import { posicionUSNews, textoPuesto, NOMBRE_LISTA, FUENTE_USNEWS, EDICION_USNEWS } from '../data/rankingUSNews';
import { RangosSAT } from './RangosSAT';
import { DemografiaAdmision } from './DemografiaAdmision';
import { CostosFinanciamiento } from './CostosFinanciamiento';

interface Props {
  uni: Universidad;
  onVolver: () => void;
  guardada: boolean;
  onAlternarGuardada: (uni: Universidad) => void;
  cantidadMiLista: number;
  onVerMiLista: () => void;
  /** Todas las universidades, para buscar las similares. */
  universidades: Universidad[];
  onSeleccionar: (uni: Universidad) => void;
}

/** Casilla de "Lo esencial": un dato clave con su explicación a un toque. */
function Esencial({ etiqueta, valor, ayuda }: { etiqueta: string; valor: string | null; ayuda: string }) {
  return (
    <div className="esencial">
      <dt className="esencial-etiqueta">
        {etiqueta}
        <InfoTooltip texto={ayuda} />
      </dt>
      <dd className={`esencial-valor numero${valor == null ? ' esencial-vacio' : ''}`}>{valor ?? 'Sin dato'}</dd>
    </div>
  );
}

/** Sección de la ficha: título (con tooltip opcional) y contenido. */
function Seccion({ titulo, ayuda, ancha, children }: { titulo: ReactNode; ayuda?: string; ancha?: boolean; children: ReactNode }) {
  return (
    <section className={`panel ficha-seccion${ancha ? ' ficha-ancha' : ''}`}>
      <h2 className="titulo-seccion ficha-titulo">
        {titulo}
        {ayuda && <InfoTooltip texto={ayuda} />}
      </h2>
      {children}
    </section>
  );
}

const claseControl = (control: string | null) =>
  control === 'Pública' ? 'marca marca-publica'
    : control === 'Privada con fines de lucro' ? 'marca marca-lucro'
    : 'marca marca-privada';

export function DetalleUniversidad({ uni, onVolver, guardada, onAlternarGuardada, cantidadMiLista, onVerMiLista, universidades, onSeleccionar }: Props) {
  const matricula = uni.TUITIONFEE_OUT ?? uni.TUITIONFEE_IN ?? null;
  // Lo que cuesta un año para alguien de fuera del estado (el público de esta web): matrícula + vida.
  const costoVida = calcularCostoVida(uni);
  const costoTotal = matricula != null && costoVida ? matricula + costoVida.valor : null;
  const aprox = costoVida?.estimado ? '~' : '';
  const ranking = posicionUSNews(uni);
  const similares = useMemo(() => similaresParaFicha(uni, universidades), [uni, universidades]);

  return (
    <main className="ficha">
      <button type="button" className="boton ficha-volver" onClick={onVolver}>
        ← Volver a resultados
      </button>

      {/* Banner: la foto de fondo y el nombre encima; debajo, las acciones y el crédito. */}
      <header className="ficha-cabecera">
        <div className="ficha-portada">
          <FotoUniversidad uni={uni} />
          <div className="ficha-portada-texto">
            <div className="marcas">
              {uni.CONTROL && <span className={claseControl(uni.CONTROL)}>{uni.CONTROL}</span>}
              {uni.ICLEVEL && <span className="marca">{formatNivel(uni.ICLEVEL)}</span>}
              {uni.ADMCON7 === 'Requerido' && <span className="marca marca-sat">SAT obligatorio</span>}
            </div>
            {ranking && (
              <p className="ficha-ranking" title={`Fuente: ${FUENTE_USNEWS}`}>
                <strong>{textoPuesto(ranking)}</strong> en {NOMBRE_LISTA[ranking.lista]} · U.S. News {EDICION_USNEWS}
              </p>
            )}
            <h1 className="ficha-nombre">{uni.INSTNM}</h1>
            <p className="ficha-lugar">{uni.CITY}, {uni.STABBR}</p>
          </div>
        </div>
        <div className="ficha-cabecera-pie">
          <div className="ficha-acciones">
            <BotonGuardar guardada={guardada} nombre={uni.INSTNM} onAlternar={() => onAlternarGuardada(uni)} conTexto />
            {cantidadMiLista > 0 && (
              <button type="button" className="boton" onClick={onVerMiLista}>
                Comparar Mi lista ({cantidadMiLista})
              </button>
            )}
          </div>
          <CreditoFoto uni={uni} />
        </div>
      </header>

      {/* Lo más importante, legible en pocos segundos. */}
      <dl className="esenciales" aria-label="Lo esencial">
        <Esencial etiqueta="Tasa de admisión" valor={formatPorcentaje(uni.ADM_RATE)} ayuda={glosarioCampos.ADM_RATE} />
        <Esencial etiqueta="Puntaje SAT promedio" valor={uni.SAT_AVG != null ? String(uni.SAT_AVG) : null} ayuda={glosarioCampos.SAT_AVG} />
        <Esencial etiqueta="Costo de vida al año" valor={costoVida ? aprox + formatDinero(costoVida.valor) : null}
          ayuda={costoVida?.estimado ? glosarioCampos.COSTO_VIDA_ESTIMADO : glosarioCampos.COSTO_VIDA} />
        <Esencial etiqueta="Costo anual total" valor={costoTotal != null ? aprox + formatDinero(costoTotal) : null}
          ayuda={glosarioCampos.COSTO_TOTAL_ESENCIAL} />
        <Esencial etiqueta="Salario a 4 años de graduado" valor={formatDinero(uni.MD_EARN_WNE_4YR)} ayuda={glosarioCampos.MD_EARN_4YR} />
      </dl>

      <div className="ficha-grilla">

        {/* Admisiones y SAT */}
        {(uni.ADM_RATE || uni.ADMCON7 || uni.SAT_AVG || uni.SATVR25 || uni.SATMT25) && (
          <Seccion titulo="Admisión y SAT">
            <dl className="datos">
              {uni.ADM_RATE != null && (
                <div className="dato-fila">
                  <dt>Tasa de admisión<InfoTooltip texto={glosarioCampos.ADM_RATE} /></dt>
                  <dd className="numero">{formatPorcentaje(uni.ADM_RATE)}</dd>
                </div>
              )}
              {uni.ADMCON7 && (
                <div className="dato-fila">
                  <dt>Política SAT<InfoTooltip texto={glosarioCampos.ADMCON7} /></dt>
                  <dd>{uni.ADMCON7}</dd>
                </div>
              )}
            </dl>
            {(uni.SAT_AVG || uni.SATVR25 || uni.SATMT25) && (
              <div className="ficha-bloque">
                <RangosSAT uni={uni} />
              </div>
            )}
          </Seccion>
        )}

        {/* Datos demográficos y de admisión */}
        {(uni.UGDS != null || uni.UGDS_HISP != null || uni.STUFACR != null || uni.APPLCN != null) && (
          <Seccion titulo="Estudiantes">
            <DemografiaAdmision uni={uni} />
          </Seccion>
        )}

        {/* Costos y financiamiento (pestañas por perfil) */}
        {(uni.TUITIONFEE_OUT != null || uni.TUITIONFEE_IN != null || uni.COSTT4_A != null || uni.NPT4_PUB != null || uni.NPT4_PRIV != null) && (
          <Seccion titulo="Costos y financiamiento" ancha>
            <CostosFinanciamiento uni={uni} />
          </Seccion>
        )}

        {similares.length > 0 && (
          <Seccion titulo="Universidades similares" ancha>
            <UniversidadesSimilares uni={uni} similares={similares} onSeleccionar={onSeleccionar} />
          </Seccion>
        )}

      </div>
    </main>
  );
}
