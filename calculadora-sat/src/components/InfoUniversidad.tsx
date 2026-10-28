import type { Universidad } from '../types';
import { formatPorcentaje } from '../utils/formatters';
import { glosarioCampos } from '../utils/glosarioCampos';
import { useFuentesDatos } from '../utils/fuentesDatos';
import { InfoTooltip } from './InfoTooltip';
import { urlAyudaFinanciera } from '../utils/enlacesUniversidad';
import { LICENCIA_WIKIPEDIA, urlArticulo, useDescripcion } from '../utils/descripciones';

/** "Ciudad grande" → "una ciudad grande"; "Suburbio mediano" → "un suburbio mediano". */
function conArticulo(entorno: string): string {
  const femenino = /^(Ciudad|Zona)/.test(entorno);
  return `${femenino ? 'una' : 'un'} ${entorno.charAt(0).toLowerCase()}${entorno.slice(1)}`;
}

/** "2129981212" → "(212) 998-1212". Si no son 10 dígitos, se deja como viene. */
function formatTelefono(digitos: string): string {
  const d = digitos.replace(/\D/g, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : digitos;
}

/** IPEDS y Scorecard guardan muchas direcciones sin "https://" ("www.auburn.edu/"). */
const conProtocolo = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/** "https://www.nyu.edu/" → "nyu.edu", para mostrar el enlace corto. */
const dominio = (url: string) => url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '');

/**
 * Tasa de graduación de la universidad: en 6 años si es de 4 años (C150_4) o en 3 si es de 2
 * (C150_L4), es decir, en 150% del tiempo normal. null si no la publica.
 */
function graduacion(uni: Universidad): { tasa: number; anios: number } | null {
  if (uni.C150_4 != null) return { tasa: uni.C150_4, anios: 6 };
  if (uni.C150_L4 != null) return { tasa: uni.C150_L4, anios: 3 };
  return null;
}

/**
 * Resumen escrito a partir de los datos, no copiado de otro sitio: "New York University es una
 * universidad privada sin fines de lucro de 4 años, en una ciudad grande…". Solo dice lo que
 * se sabe: cada frase aparece si está su dato.
 */
function resumen(uni: Universidad): string {
  const tipo = uni.CONTROL === 'Pública' ? 'pública' : uni.CONTROL ? 'privada sin fines de lucro' : null;
  const duracion = uni.ICLEVEL === '4-Year' ? 'de 4 años' : uni.ICLEVEL === '2-Year' ? 'de 2 años' : null;
  const grad = graduacion(uni);
  const frases = [
    `${uni.INSTNM} es una universidad${tipo ? ` ${tipo}` : ''}${duracion ? ` ${duracion}` : ''}`
      + `${uni.LOCALE ? `, en ${conArticulo(uni.LOCALE)}` : ''}`
      + `${uni.UGDS ? `, con ${uni.UGDS.toLocaleString('en-US')} alumnos de pregrado` : ''}.`,
    uni.HIGHDEG && uni.HIGHDEG !== 'Sin título'
      ? `Otorga títulos hasta ${uni.HIGHDEG === 'Posgrado' ? 'posgrado (maestría o doctorado)' : uni.HIGHDEG.toLowerCase()}.`
      : null,
    uni.ADM_RATE != null ? `Admite al ${formatPorcentaje(uni.ADM_RATE)} de quienes postulan.` : null,
    // Con el mismo decimal que las cajas y las filas, para que los números coincidan.
    grad ? `El ${formatPorcentaje(grad.tasa)} de sus alumnos se gradúa en ${grad.anios} años o menos.` : null,
  ];
  return frases.filter(Boolean).join(' ');
}

/**
 * "Sobre la universidad", en la banda Resumen: a la izquierda el texto de Wikipedia si lo hay
 * y, si no, el resumen escrito a partir de los datos; a la derecha, filas de un vistazo
 * (entorno, alumnos, hispanos, alumnos por profesor y graduación). Cada fila aparece solo si
 * está su dato.
 */
export function SobreUniversidad({ uni }: { uni: Universidad }) {
  const grad = graduacion(uni);
  const descripcion = useDescripcion(uni.UNITID);
  return (
    <div className="sobre">
      <div>
        <h2 className="banda-titulo">Sobre la universidad</h2>
        {/* Con descripción de Wikipedia, solo ese texto y su crédito: el párrafo armado con
            datos repetiría el entorno, los alumnos y la graduación, que ya están a la derecha.
            Sin descripción, ese párrafo es la única explicación y se muestra solo. */}
        {descripcion ? (
          <>
            <p className="sobre-texto">{descripcion.texto}</p>
            <p className="fuente">
              Traducción resumida de <a href={urlArticulo(descripcion)} target="_blank" rel="noopener noreferrer">Wikipedia
              (en inglés)</a>, <a href={LICENCIA_WIKIPEDIA.url} target="_blank" rel="noopener noreferrer">{LICENCIA_WIKIPEDIA.nombre}</a>.
            </p>
          </>
        ) : (
          <p className="sobre-texto">{resumen(uni)}</p>
        )}
      </div>
      <dl className="datos sobre-datos">
        {uni.LOCALE && (
          <div className="dato-fila">
            <dt>Entorno<InfoTooltip texto={glosarioCampos.LOCALE} /></dt>
            <dd>{uni.LOCALE}</dd>
          </div>
        )}
        {uni.UGDS != null && (
          <div className="dato-fila">
            <dt>Alumnos de pregrado<InfoTooltip texto={glosarioCampos.UGDS} /></dt>
            <dd className="numero">{uni.UGDS.toLocaleString('en-US')}</dd>
          </div>
        )}
        {uni.UGDS_HISP != null && (
          <div className="dato-fila">
            <dt>Hispanos<InfoTooltip texto={glosarioCampos.UGDS_HISP} /></dt>
            <dd className="numero">{formatPorcentaje(uni.UGDS_HISP)}</dd>
          </div>
        )}
        {uni.STUFACR != null && (
          <div className="dato-fila">
            <dt>Alumnos por profesor<InfoTooltip texto={glosarioCampos.STUFACR} /></dt>
            <dd className="numero">{uni.STUFACR}:1</dd>
          </div>
        )}
        {grad && (
          <div className="dato-fila">
            <dt>Tasa de graduación<InfoTooltip texto={glosarioCampos.GRADUACION} /></dt>
            <dd className="numero">{formatPorcentaje(grad.tasa)} <span className="dato-nota">en {grad.anios} años</span></dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/**
 * Banda Contacto: dirección (abre Google Maps), teléfono (se puede tocar para llamar) y web, en
 * tres columnas; debajo, los enlaces de admisión y ayuda financiera.
 */
export function ContactoUniversidad({ uni }: { uni: Universidad }) {
  const anioDirectorio = useFuentesDatos()?.ipeds.anios.directorio;
  const zip = uni.ZIP?.slice(0, 5);
  const lugar = `${uni.CITY}, ${uni.STABBR}${zip ? ` ${zip}` : ''}`;
  const direccion = uni.ADDR ? `${uni.ADDR}, ${lugar}` : lugar;
  // Admisión y postulación suelen ser la misma página: se muestra una sola vez. "Ayuda
  // financiera" solo si es la página de becas y no una calculadora: la única calculadora es
  // la de la banda Costos, para no confundir.
  const enlaces = [
    { texto: 'Admisión', url: uni.ADMINURL },
    { texto: 'Cómo postular', url: uni.APPLURL && uni.APPLURL !== uni.ADMINURL ? uni.APPLURL : null },
    { texto: 'Ayuda financiera', url: urlAyudaFinanciera(uni) },
  ].filter((e): e is { texto: string; url: string } => !!e.url);

  return (
    <>
      <ul className="contacto">
        <li>
          <span className="contacto-etiqueta">Dirección</span>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${uni.INSTNM}, ${direccion}`)}`}
            target="_blank" rel="noopener noreferrer">{direccion}</a>
        </li>
        {uni.GENTELE && (
          <li>
            <span className="contacto-etiqueta">Teléfono</span>
            <a href={`tel:+1${uni.GENTELE.replace(/\D/g, '')}`}>{formatTelefono(uni.GENTELE)}</a>
          </li>
        )}
        {uni.INSTURL && (
          <li>
            <span className="contacto-etiqueta">Web</span>
            <a href={conProtocolo(uni.INSTURL)} target="_blank" rel="noopener noreferrer">{dominio(uni.INSTURL)}</a>
          </li>
        )}
      </ul>
      {enlaces.length > 0 && (
        <div className="contacto-enlaces">
          {enlaces.map(e => (
            <a key={e.texto} className="boton-enlace" href={conProtocolo(e.url)} target="_blank" rel="noopener noreferrer">
              {e.texto} ↗
            </a>
          ))}
        </div>
      )}
      <p className="fuente">
        Fuente: IPEDS{anioDirectorio && ` (directorio ${anioDirectorio})`} y College Scorecard.
      </p>
    </>
  );
}
