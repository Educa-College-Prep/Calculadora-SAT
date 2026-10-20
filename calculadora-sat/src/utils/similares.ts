import type { Universidad } from '../types';

/**
 * Universidades parecidas a una dada, para la sección "Universidades similares".
 *
 * Se compara en cinco rasgos que importan al elegir: nivel SAT, selectividad, tamaño,
 * matrícula y salario de los egresados. Cada diferencia se divide por una "escala"
 * (cuánto se considera parecido) para que todos pesen igual, y se promedian.
 * Ser de otro tipo (pública / privada) suma una penalización: se permiten, pero
 * solo aparecen si son muy parecidas en lo demás.
 */

interface Rasgo {
  nombre: string;
  valor: (u: Universidad) => number | null | undefined;
  /** Diferencia que se considera "una unidad" de distancia. */
  escala: number;
}

const puntoMedioSAT = (u: Universidad) =>
  u.SAT_AVG ?? (u.SATVR25 != null && u.SATMT25 != null && u.SATVR75 != null && u.SATMT75 != null
    ? (u.SATVR25 + u.SATMT25 + u.SATVR75 + u.SATMT75) / 2
    : null);

const RASGOS: Rasgo[] = [
  { nombre: 'SAT', valor: puntoMedioSAT, escala: 80 },
  { nombre: 'selectividad', valor: u => u.ADM_RATE, escala: 0.12 },
  { nombre: 'tamaño', valor: u => (u.UGDS ? Math.log10(u.UGDS) : null), escala: 0.3 },
  { nombre: 'matrícula', valor: u => u.TUITIONFEE_OUT, escala: 8000 },
  { nombre: 'salario de egresados', valor: u => u.MD_EARN_WNE_4YR, escala: 12000 },
];

const PENALIZA_OTRO_TIPO = 0.35;
const PENALIZA_RASGO_FALTANTE = 0.2;

/** "Keiser University-Tampa" → "keiser university": para no sugerir sedes de la misma universidad. */
const familia = (u: Universidad) => u.INSTNM.split(/\s*-\s*/)[0].trim().toLowerCase();

const grupo = (u: Universidad) =>
  u.CONTROL === 'Pública' ? 'publica' : u.CONTROL === 'Privada con fines de lucro' ? 'lucro' : 'privada';

export interface Similar {
  uni: Universidad;
  /** Rasgos en los que se parece mucho (diferencia menor a media escala). */
  parecidaEn: string[];
}

export function universidadesSimilares(uni: Universidad, todas: Universidad[], cantidad = 6): Similar[] {
  const propios = RASGOS.map(r => r.valor(uni));
  const disponibles = propios.filter(v => v != null).length;
  // Con menos de dos datos no hay base para decir que algo se le parece.
  if (disponibles < 2) return [];
  const minimoCompartido = Math.min(3, disponibles);

  const candidatos: { uni: Universidad; distancia: number; parecidaEn: string[] }[] = [];
  for (const otra of todas) {
    if (otra === uni || otra.ICLEVEL !== uni.ICLEVEL || familia(otra) === familia(uni)) continue;
    // Las con fines de lucro solo se sugieren para otras con fines de lucro.
    if (grupo(otra) === 'lucro' && grupo(uni) !== 'lucro') continue;

    let suma = 0;
    let compartidos = 0;
    const parecidaEn: string[] = [];
    RASGOS.forEach((rasgo, i) => {
      const a = propios[i];
      const b = rasgo.valor(otra);
      if (a == null || b == null) return;
      const d = (a - b) / rasgo.escala;
      suma += d * d;
      compartidos++;
      if (Math.abs(d) < 0.5) parecidaEn.push(rasgo.nombre);
    });
    if (compartidos < minimoCompartido) continue;

    const distancia = Math.sqrt(suma / compartidos)
      + (grupo(otra) !== grupo(uni) ? PENALIZA_OTRO_TIPO : 0)
      + (disponibles - compartidos) * PENALIZA_RASGO_FALTANTE;
    candidatos.push({ uni: otra, distancia, parecidaEn });
  }

  // Una sola sede por universidad entre las sugerencias.
  const vistas = new Set<string>();
  return candidatos
    .sort((a, b) => a.distancia - b.distancia)
    .filter(c => !vistas.has(familia(c.uni)) && vistas.add(familia(c.uni)))
    .slice(0, cantidad)
    .map(({ uni, parecidaEn }) => ({ uni, parecidaEn }));
}

/** 4 llena sin huecos la grilla de la ficha: 4, 2 o 1 columnas. */
const CANTIDAD_FICHA = 4;

/**
 * Las similares que muestra la ficha. Si hay menos de 4 (raro), se deja un número par
 * para que la grilla de 2 columnas no quede con un hueco.
 */
export function similaresParaFicha(uni: Universidad, todas: Universidad[]): Similar[] {
  const lista = universidadesSimilares(uni, todas, CANTIDAD_FICHA);
  return lista.length > 1 ? lista.slice(0, lista.length - (lista.length % 2)) : lista;
}
