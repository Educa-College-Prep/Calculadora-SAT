import { useMemo, useState } from 'react';
import type { Universidad } from '../types';
import type { SalarioCarrera } from '../utils/salariosCarreras';
import { formatDinero } from '../utils/formatters';
import { useFuentesDatos } from '../utils/fuentesDatos';

/** Cuántas carreras se ven de entrada: las mejor pagadas. El resto, con "Ver todas" o buscando. */
const VISIBLES = 5;

/** Minúsculas y sin tildes: "Enfermería" se encuentra escribiendo "enfermeria". */
const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Salario por carrera en la ficha. De entrada, las 5 mejor pagadas; pero lo que importa es la
 * carrera que le interesa a cada estudiante, así que se puede buscar cualquiera (en español o
 * en inglés) o ver la lista completa.
 */
export function SalarioPorCarrera({ uni, carreras }: { uni: Universidad; carreras: SalarioCarrera[] }) {
  const [busqueda, setBusqueda] = useState('');
  const [verTodas, setVerTodas] = useState(false);
  const anio = useFuentesDatos()?.scorecard.anios.salario_por_carrera;

  const buscada = normalizar(busqueda.trim());
  const encontradas = useMemo(
    () => buscada ? carreras.filter(c => normalizar(`${c.nombre} ${c.nombreIngles}`).includes(buscada)) : carreras,
    [carreras, buscada]
  );
  const visibles = buscada || verTodas ? encontradas : encontradas.slice(0, VISIBLES);
  const general = uni.MD_EARN_WNE_1YR != null || uni.MD_EARN_WNE_4YR != null;

  return (
    <>
      <p className="ficha-intro">
        Lo que gana al año quien se gradúa de cada carrera (bachiller) en esta universidad. Es la mediana:
        la mitad gana más y la mitad menos. Solo cuenta a quienes trabajan y ya no estudian.
      </p>

      {/* El salario de toda la universidad, como referencia para comparar cada carrera. */}
      {general && (
        <dl className="datos salarios-general">
          {uni.MD_EARN_WNE_1YR != null && (
            <div className="dato-fila">
              <dt>Todas las carreras, a 1 año de graduarse</dt>
              <dd className="numero">{formatDinero(uni.MD_EARN_WNE_1YR)}</dd>
            </div>
          )}
          {uni.MD_EARN_WNE_4YR != null && (
            <div className="dato-fila">
              <dt>Todas las carreras, a 4 años de graduarse</dt>
              <dd className="numero">{formatDinero(uni.MD_EARN_WNE_4YR)}</dd>
            </div>
          )}
        </dl>
      )}

      <label className="campo salarios-buscar">
        <span className="campo-etiqueta">Busca tu carrera</span>
        <input
          type="search"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Ej.: enfermería, economía, computer…"
        />
      </label>

      {!buscada && (
        <h3 className="subtitulo">
          {verTodas || carreras.length <= VISIBLES
            ? `Las ${carreras.length} carreras con salario publicado`
            : `Las ${VISIBLES} carreras mejor pagadas`}
        </h3>
      )}

      {visibles.length > 0 ? (
        <table className="salarios-tabla">
          <thead>
            <tr>
              <th scope="col">Carrera</th>
              <th scope="col" className="salarios-monto">A 1 año</th>
              <th scope="col" className="salarios-monto">A 4 años</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map(c => (
              <tr key={c.cip}>
                <th scope="row">
                  <span className="salarios-carrera">{c.nombre}</span>
                  {c.graduados ? <span className="salarios-graduados numero">{c.graduados.toLocaleString('en-US')} graduados al año</span> : null}
                </th>
                <td className="salarios-monto numero">{formatDinero(c.unAnio) ?? '—'}</td>
                <td className="salarios-monto numero"><strong>{formatDinero(c.cuatroAnios) ?? '—'}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="ayuda">
          Ninguna carrera con salario publicado coincide con “{busqueda.trim()}”. Puede que la universidad
          la ofrezca pero con pocos graduados: en ese caso College Scorecard no publica el salario.
        </p>
      )}

      {!buscada && carreras.length > VISIBLES && (
        <button type="button" className="boton salarios-ver" onClick={() => setVerTodas(!verTodas)}>
          {verTodas ? `Ver solo las ${VISIBLES} mejor pagadas` : `Ver las ${carreras.length} carreras`}
        </button>
      )}

      <p className="fuente">
        {anio && `Medido en ${anio.replace(/^medido en /, '')}. `}
        Fuente: College Scorecard (Departamento de Educación de EE.UU.). “—” = no publicado (pocos graduados).
      </p>
    </>
  );
}
