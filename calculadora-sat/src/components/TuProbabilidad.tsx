import { useState } from 'react';
import type { MouseEvent } from 'react';
import type { Universidad } from '../types';
import { NIVELES, clasificar, rangoSAT } from '../utils/nivelSAT';
import { BarrasNivel } from './EtiquetaNivel';
import { InputTotalSAT } from './Filtros';

/**
 * Comparación de tu puntaje con la mitad central de los admitidos, en palabras: dentro del
 * rango, por encima o cuántos puntos te faltan para el 25%.
 */
function comparacion(sat: number, [p25, p75]: [number, number]): string {
  const rango = `La mitad central de sus admitidos sacó aproximadamente entre ${p25} y ${p75}`;
  if (sat >= p75) return `${rango}: estás por encima de ese rango.`;
  if (sat >= p25) return `${rango}: estás dentro de ese rango.`;
  return `${rango}: estás ${p25 - sat} puntos por debajo.`;
}

/**
 * "Tu probabilidad": la respuesta a "¿me alcanza mi SAT?" al empezar la ficha, con la misma
 * clasificación de la lista (utils/nivelSAT). Sin puntaje, un campo para escribirlo aquí
 * mismo (es el mismo puntaje de la portada: al cambiarlo, cambia también la lista). Si la
 * universidad no publica el rango SAT, se dice por qué no se puede calcular; si ni siquiera
 * hay puntaje, no se muestra nada (no hay con qué comparar).
 */
export function TuProbabilidad({ uni, puntaje, onCambiarPuntaje, onVerAdmision }: {
  uni: Universidad;
  /** Tu SAT total (0 = sin puntaje). */
  puntaje: number;
  onCambiarPuntaje: (total: number) => void;
  onVerAdmision: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const [cambiando, setCambiando] = useState(false);
  const rango = rangoSAT(uni);
  const nivel = puntaje > 0 ? clasificar(uni, puntaje) : null;

  if (puntaje > 0 && !rango) {
    return (
      <p className="tu-prob-sin-rango">
        Con tu SAT de <strong className="numero">{puntaje}</strong> no podemos calcular tu probabilidad aquí:{' '}
        {uni.ADMCON7 === 'Ni requerido ni recomendado'
          ? 'esta universidad no toma en cuenta el SAT para admitir.'
          : 'esta universidad no publica el rango SAT de sus admitidos.'}
      </p>
    );
  }
  if (!rango) return null;

  // El campo: sin puntaje, o al tocar "Cambiar mi puntaje". Un número inválido o vacío no
  // borra el puntaje que ya tenías: el campo explica el problema y se queda abierto.
  if (!nivel || cambiando) {
    return (
      <section className="tu-prob tu-prob-pregunta" aria-labelledby="tu-prob-titulo">
        <div className="tu-prob-texto">
          <h2 id="tu-prob-titulo" className="tu-prob-titulo">¿Te alcanza tu SAT para entrar?</h2>
          <p className="tu-prob-detalle">Escribe tu puntaje total y lo comparamos con el de sus admitidos.</p>
        </div>
        <div className="tu-prob-campo">
          <InputTotalSAT id="sat-total-ficha" etiqueta="Tu SAT total" total={puntaje} autoFocus={cambiando}
            onEscribir={() => {}}
            setSoloTotal={v => { if (v > 0) { onCambiarPuntaje(v); setCambiando(false); } }} />
          {cambiando && (
            <button type="button" className="tu-prob-enlace" onClick={() => setCambiando(false)}>Cancelar</button>
          )}
        </div>
      </section>
    );
  }

  const info = NIVELES.find(n => n.nivel === nivel)!;
  return (
    <section className={`tu-prob tu-prob-${info.clase}`} aria-labelledby="tu-prob-titulo">
      <div className="tu-prob-texto">
        <p className="tu-prob-con">Con tu SAT de <strong className="numero">{puntaje}</strong></p>
        <h2 id="tu-prob-titulo" className="tu-prob-titulo">
          <BarrasNivel barras={info.barras} />{nivel}
        </h2>
        <p className="tu-prob-detalle">{info.explicacion} {comparacion(puntaje, rango)}</p>
        {/* Que el puntaje no se lea como una promesa (decisión de Educa: nada está garantizado). */}
        <p className="fuente">Solo compara tu puntaje: también cuentan tus notas, ensayos y actividades. Rango SAT: College Scorecard.</p>
      </div>
      <div className="tu-prob-acciones">
        <a className="tu-prob-enlace" href="#admision" onClick={onVerAdmision}>Ver tu puntaje frente a los admitidos</a>
        <button type="button" className="tu-prob-enlace" onClick={() => setCambiando(true)}>Cambiar mi puntaje</button>
      </div>
    </section>
  );
}
