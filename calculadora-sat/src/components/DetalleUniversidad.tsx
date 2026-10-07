import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Universidad } from '../types';
import { formatDinero, formatPorcentaje, formatNivel, calcularPorcentajeDesdeConteo } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { InfoTooltip } from './InfoTooltip';
import { RangosSAT } from './RangosSAT';
import { ParGraficosEgresados } from './ParGraficosEgresados';
import { DemografiaAdmision } from './DemografiaAdmision';
import { CostosFinanciamiento } from './CostosFinanciamiento';
import { Pestanas } from './Pestanas';

interface Props {
  uni: Universidad;
  onVolver: () => void;
}

type VistaEgresados = 'salario' | 'umbral';

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

export function DetalleUniversidad({ uni, onVolver }: Props) {
  // Salarios y "% supera salario de secundaria": dos grupos distintos de personas.
  // Desde la graduación (1/5 años) = solo graduados. Desde el ingreso (6/8/10 años) = todos.
  // 1YR/5YR del umbral vienen como conteo crudo y hay que dividirlos entre el cohorte (COUNT_WNE_*).
  const conDato = (d: { label: string; valor: number | null | undefined }): d is { label: string; valor: number } => d.valor != null;
  const salariosGraduados = [
    { label: '1 año', valor: uni.MD_EARN_WNE_1YR },
    { label: '5 años', valor: uni.MD_EARN_WNE_5YR },
  ].filter(conDato);
  const salariosIngreso = [
    { label: '6 años', valor: uni.MD_EARN_WNE_P6 },
    { label: '8 años', valor: uni.MD_EARN_WNE_P8 },
    { label: '10 años', valor: uni.MD_EARN_WNE_P10 },
  ].filter(conDato);
  const umbralGraduados = [
    { label: '1 año', valor: calcularPorcentajeDesdeConteo(uni.GT_THRESHOLD_1YR, uni.COUNT_WNE_1YR) },
    { label: '5 años', valor: calcularPorcentajeDesdeConteo(uni.GT_THRESHOLD_5YR, uni.COUNT_WNE_5YR) },
  ].filter(conDato);
  const umbralIngreso = [
    { label: '6 años', valor: uni.GT_THRESHOLD_P6 != null ? uni.GT_THRESHOLD_P6 * 100 : null },
    { label: '8 años', valor: uni.GT_THRESHOLD_P8 != null ? uni.GT_THRESHOLD_P8 * 100 : null },
    { label: '10 años', valor: uni.GT_THRESHOLD_P10 != null ? uni.GT_THRESHOLD_P10 * 100 : null },
  ].filter(conDato);

  const hayEgresados = uni.MD_EARN_WNE_4YR != null || salariosGraduados.length > 0 || salariosIngreso.length > 0;
  const hayUmbral = umbralGraduados.length > 0 || umbralIngreso.length > 0;
  const [vistaEgresados, setVistaEgresados] = useState<VistaEgresados>(hayEgresados ? 'salario' : 'umbral');
  const vista: VistaEgresados = !hayEgresados ? 'umbral' : !hayUmbral ? 'salario' : vistaEgresados;

  const matricula = uni.TUITIONFEE_OUT ?? uni.TUITIONFEE_IN ?? null;
  const programas = [uni.CIPTITLE1, uni.CIPTITLE2, uni.CIPTITLE3, uni.CIPTITLE4, uni.CIPTITLE5, uni.CIPTITLE6].filter(Boolean);

  return (
    <main className="ficha">
      <button type="button" className="boton ficha-volver" onClick={onVolver}>
        ← Volver a resultados
      </button>

      <header className="ficha-cabecera">
        <div className="marcas">
          {uni.CONTROL && <span className={claseControl(uni.CONTROL)}>{uni.CONTROL}</span>}
          {uni.ICLEVEL && <span className="marca">{formatNivel(uni.ICLEVEL)}</span>}
          {uni.ADMCON7 === 'Requerido' && <span className="marca marca-sat">SAT obligatorio</span>}
        </div>
        <h1 className="ficha-nombre">{uni.INSTNM}</h1>
        <p className="ficha-lugar">{uni.CITY}, {uni.STABBR}</p>
      </header>

      {/* Lo más importante, legible en pocos segundos. */}
      <dl className="esenciales" aria-label="Lo esencial">
        <Esencial etiqueta="Admisión" valor={formatPorcentaje(uni.ADM_RATE)} ayuda={glosarioCampos.ADM_RATE} />
        <Esencial etiqueta="SAT promedio" valor={uni.SAT_AVG != null ? String(uni.SAT_AVG) : null} ayuda={glosarioCampos.SAT_AVG} />
        <Esencial etiqueta="Matrícula anual" valor={formatDinero(matricula)} ayuda={glosarioCampos.TUITIONFEE_OUT} />
        <Esencial etiqueta="Salario a 4 años" valor={formatDinero(uni.MD_EARN_WNE_4YR)} ayuda={glosarioCampos.MD_EARN_4YR} />
      </dl>

      <div className="ficha-grilla">

        {/* Admisiones y SAT */}
        {(uni.ADM_RATE || uni.ADMCON7 || uni.OPENADMP || uni.SAT_AVG || uni.SATVR25 || uni.SATMT25) && (
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
              {uni.OPENADMP && (
                <div className="dato-fila">
                  <dt>Admisión abierta<InfoTooltip texto={glosarioCampos.OPENADMP} /></dt>
                  <dd>{uni.OPENADMP}</dd>
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

        {/* Egresados: una minipestaña cambia las dos cuadrículas de gráficos. */}
        {(hayEgresados || hayUmbral) && (
          <Seccion titulo="Después de la universidad" ancha>
            {hayEgresados && hayUmbral && (
              <Pestanas
                etiqueta="Qué medir de los egresados"
                idBase="egresados"
                activa={vista}
                onCambio={setVistaEgresados}
                opciones={[
                  { id: 'salario', label: 'Salario' },
                  { id: 'umbral', label: '¿Ganan más que con secundaria?' },
                ]}
              />
            )}

            <div id="egresados-panel" role={hayEgresados && hayUmbral ? 'tabpanel' : undefined} aria-labelledby={hayEgresados && hayUmbral ? `egresados-tab-${vista}` : undefined}>
              {vista === 'salario' ? (
                <>
                  <p className="ficha-intro">
                    Salario anual mediano de los egresados.
                    <InfoTooltip texto={glosarioCampos.MD_EARN} />
                  </p>
                  {uni.MD_EARN_WNE_4YR != null && (
                    <div className="cifra-destacada">
                      <span className="cifra-destacada-valor numero">{formatDinero(uni.MD_EARN_WNE_4YR)}</span>
                      <span className="cifra-destacada-texto">
                        al año, 4 años después de graduarse
                        <InfoTooltip texto={glosarioCampos.MD_EARN_4YR} />
                      </span>
                      <span className="fuente">Medido en 2022-2023. Fuente: College Scorecard</span>
                    </div>
                  )}
                  <ParGraficosEgresados graduados={salariosGraduados} ingreso={salariosIngreso} color="#2e7d62" formato="dinero" />
                  {(salariosGraduados.length > 0 || salariosIngreso.length > 0) && (
                    <p className="fuente">Gráficos medidos en 2020-2021, en dólares de 2022. Fuente: College Scorecard</p>
                  )}
                </>
              ) : (
                <>
                  <p className="ficha-intro">
                    Porcentaje de egresados que gana más que alguien que solo terminó la secundaria.
                    <InfoTooltip texto={glosarioCampos.GT_THRESHOLD} />
                  </p>
                  <ParGraficosEgresados graduados={umbralGraduados} ingreso={umbralIngreso} color="#2d5ba8" formato="porcentaje" />
                  <p className="fuente">Medido en 2020-2021. Fuente: College Scorecard</p>
                </>
              )}
            </div>
          </Seccion>
        )}

        {/* Oferta académica */}
        {(uni.CIPTITLE1 || uni.PRGMOFR) && (
          <Seccion
            titulo={uni.PRGMOFR ? `Carreras (${uni.PRGMOFR} programas)` : 'Carreras'}
            ayuda={glosarioCampos.PRGMOFR}
            ancha
          >
            {programas.length > 0 && (
              <>
                <p className="ficha-intro">Las más populares, de mayor a menor:</p>
                <ol className="programas">
                  {programas.map((titulo) => <li key={titulo}>{titulo}</li>)}
                </ol>
              </>
            )}
          </Seccion>
        )}

      </div>
    </main>
  );
}
