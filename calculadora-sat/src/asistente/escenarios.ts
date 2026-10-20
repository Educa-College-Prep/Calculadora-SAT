import type { Universidad } from '../types';
import { calcularCostoVida } from '../utils/costos';
import type { Contexto, Escenario, PasoAgente, PerfilDetectado, RespuestaAgente } from './tipos';
import {
  usd, pct, miles, nombreEstado, esPublica, esPrivada, esCuatroAnios, rangoSAT, netoIngresoBajo,
  netoPromedio, mediana, clasificar, esTradicional, encontrarPorNombre, datosBasicos, ficha, describirArgumentos,
  repartirSAT,
} from './herramientas';
import type { Nivel } from './herramientas';

/**
 * Las ~20 preguntas de la demo. Cada una arma su respuesta consultando la data real:
 * el texto está escrito a mano, pero las cifras y las universidades se calculan.
 */

const salario = (u: Universidad) => u.MD_EARN_WNE_4YR ?? 0;
const porSalario = (a: Universidad, b: Universidad) => salario(b) - salario(a);
const TERRITORIOS = new Set(['PR', 'GU', 'VI', 'AS', 'FM', 'MH', 'MP', 'PW']);

const IVY_LEAGUE = [
  'Harvard University', 'Yale University', 'Princeton University',
  'Columbia University in the City of New York', 'Brown University', 'Dartmouth College',
  'Cornell University', 'University of Pennsylvania',
];

/** Filtro y texto opcionales por estado, para las preguntas que lo admiten ("...en Texas"). */
const lugar = (p: PerfilDetectado) => ({
  ok: (u: Universidad) => !p.estado || u.STABBR === p.estado,
  texto: p.estado ? ` en ${nombreEstado(p.estado)}` : '',
  arg: p.estado ? `estado=${p.estado} · ` : '',
});

const pensar = (texto: string): PasoAgente => ({ tipo: 'pensamiento', texto });
const usar = (nombre: string, argumentos: string, resultado: string): PasoAgente =>
  ({ tipo: 'herramienta', nombre, argumentos, resultado });

/* ------------------------------------------------------------------ */
/* Recomendación por perfil: la usan las preguntas con puntaje/estado/presupuesto
   y cualquier pregunta libre donde se detecten esos datos. */
/* ------------------------------------------------------------------ */

export function recomendarPorPerfil({ universidades, perfil: p }: Contexto): RespuestaAgente {
  const entendido = [
    p.sat && `un SAT de **${p.sat}**`,
    p.estado && `estudiar en **${nombreEstado(p.estado)}**`,
    p.presupuesto && `una matrícula de hasta **${usd(p.presupuesto)}** al año`,
    p.tipo && `una universidad **${p.tipo === 'publica' ? 'pública' : 'privada'}**`,
  ].filter(Boolean) as string[];

  const pasos: PasoAgente[] = [
    pensar(`El estudiante busca ${entendido.join(', ').replace(/\*\*/g, '')}. Primero filtro por esos criterios y después clasifico qué tan alcanzable es cada opción.`),
  ];

  const candidatas = universidades.filter(u =>
    esCuatroAnios(u)
    && (!p.estado || u.STABBR === p.estado)
    && (!p.tipo || (p.tipo === 'publica' ? esPublica(u) : esPrivada(u)))
    && (!p.presupuesto || (u.TUITIONFEE_OUT != null && u.TUITIONFEE_OUT <= p.presupuesto))
  );
  pasos.push(usar('buscar_universidades', describirArgumentos({ ...p, sat: undefined }, ['nivel=4 años']), `${miles(candidatas.length)} universidades`));

  const filtros = {
    estado: p.estado,
    precioMaximo: p.presupuesto,
    tipo: p.tipo,
    ...(p.sat ? repartirSAT(p.sat) : {}),
  };

  if (candidatas.length === 0) {
    pasos.push(pensar('No quedó ninguna. Lo más probable es que el presupuesto sea muy bajo para universidades de 4 años en ese estado.'));
    return {
      pasos,
      texto: `No encontré universidades de 4 años que cumplan todo a la vez (${entendido.join(', ')}).\n\nTe sugiero **subir un poco el presupuesto** o **mirar estados vecinos**. Ojo: muchas universidades dan becas que bajan bastante el precio final.`,
    };
  }

  const sinRango = p.sat != null && !candidatas.some(u => rangoSAT(u));
  if (!p.sat || sinRango) {
    // Si ninguna publica datos SAT (p. ej. públicas de California, que no usan el SAT), se
    // cae a las de al menos 1,000 estudiantes para no mostrar escuelas muy pequeñas.
    const tradicionales = candidatas.filter(esTradicional);
    const base = tradicionales.length > 0 ? tradicionales : candidatas.filter(u => (u.UGDS ?? 0) >= 1000);
    const mejores = base.filter(u => u.MD_EARN_WNE_4YR != null).sort(porSalario).slice(0, 6);
    if (sinRango) {
      pasos.push(usar('clasificar_por_sat', `sat=${p.sat}`, '0 publican rango SAT'));
      pasos.push(pensar('Ninguna de estas publica su rango SAT: es probable que no lo usen para admitir (test-blind). No puedo clasificarlas por puntaje, así que ordeno por resultados de sus egresados.'));
    } else {
      pasos.push(pensar('No me dio puntaje SAT, así que ordeno por los resultados de sus egresados para priorizar calidad.'));
    }
    pasos.push(usar('ordenar', 'por=salario_egresados · orden=desc', `top ${mejores.length}`));
    return {
      pasos,
      texto: `Encontré **${miles(candidatas.length)} universidades de 4 años** que encajan con ${entendido.join(', ')}.\n\n${sinRango
        ? '**Ninguna publica su rango SAT**, así que tu puntaje no cambia mucho las cosas ahí: muchas no lo usan para admitir. Te muestro las de **mejores resultados de sus egresados**:'
        : 'Como no me dijiste tu puntaje SAT, te muestro las que tienen **mejores resultados de sus egresados**:'}`,
      universidades: mejores.map(u => ficha(u, [...datosBasicos(u), `Egresados ganan ${usd(u.MD_EARN_WNE_4YR)}`])),
      cierre: sinRango
        ? 'Si quieres que tu SAT sí cuente, prueba con otro estado o sube un poco el presupuesto.'
        : 'Si me dices tu puntaje SAT, te separo cuáles son **seguras**, **buenas opciones** y **difíciles** para ti.',
      filtros,
    };
  }

  const sat = p.sat;
  const grupos: Record<Nivel, Universidad[]> = { 'Segura': [], 'Buena opción': [], 'Difícil': [] };
  for (const u of candidatas) {
    const nivel = clasificar(u, sat);
    if (nivel) grupos[nivel].push(u);
  }
  const conRango = grupos['Segura'].length + grupos['Buena opción'].length + grupos['Difícil'].length;
  pasos.push(usar('clasificar_por_sat', `sat=${sat} · comparar con percentiles 25–75`,
    `${grupos['Segura'].length} seguras · ${grupos['Buena opción'].length} buenas opciones · ${grupos['Difícil'].length} difíciles`));
  pasos.push(pensar('Armo una lista balanceada como lo haría un consejero: un par de difíciles cercanas, varias buenas opciones y un par de seguras con buenos resultados.'));

  const alcance = grupos['Difícil']
    .sort((a, b) => rangoSAT(a)![0] - rangoSAT(b)![0])
    .filter(u => rangoSAT(u)![0] - sat <= 100)
    .slice(0, 2);
  const objetivo = grupos['Buena opción'].sort(porSalario).slice(0, 3);
  const seguras = grupos['Segura'].sort(porSalario).slice(0, 2);
  const lista = [
    ...alcance.map(u => ficha(u, datosBasicos(u), 'Difícil')),
    ...objetivo.map(u => ficha(u, datosBasicos(u), 'Buena opción')),
    ...seguras.map(u => ficha(u, datosBasicos(u), 'Segura')),
  ];

  return {
    pasos,
    texto: `Con ${entendido.join(', ')} encontré **${miles(candidatas.length)} universidades de 4 años**. De las ${miles(conRango)} que publican su rango SAT, tu puntaje te deja así:\n\n**${grupos['Segura'].length} seguras** (muy buenas posibilidades), **${grupos['Buena opción'].length} buenas opciones** (posibilidades reales) y **${grupos['Difícil'].length} difíciles** (puedes intentarlo).\n\nEsta es una lista balanceada para empezar:`,
    universidades: lista,
    cierre: 'Un consejo: postula a 2–3 de cada grupo. Toca cualquier universidad para ver su ficha completa.',
    filtros,
  };
}

/* ------------------------------------------------------------------ */

export const ESCENARIOS: Escenario[] = [
  // ---------------- Tu perfil ----------------
  {
    id: 'perfil-florida',
    categoria: 'Tu perfil',
    pregunta: 'Tengo 1300 en el SAT, quiero estudiar en Florida y puedo pagar unos $30k al año. ¿Qué universidades me convienen?',
    claves: [],
    resolver: recomendarPorPerfil,
  },
  {
    id: 'posibilidades',
    categoria: 'Tu perfil',
    pregunta: 'Con 1200 de SAT, ¿a qué universidades tengo buenas posibilidades de entrar?',
    claves: ['posibilidades', 'chances', 'probabilidad', 'me acepten', 'me aceptan', 'me admitan', 'entrar'],
    resolver: ({ universidades, perfil }) => {
      const sat = perfil.sat ?? 1200;
      const l = lugar(perfil);
      const con = universidades.filter(u => esCuatroAnios(u) && rangoSAT(u) && l.ok(u));
      const seguras = con.filter(u => clasificar(u, sat) === 'Segura');
      const objetivo = con.filter(u => clasificar(u, sat) === 'Buena opción');
      const top = seguras.filter(u => u.MD_EARN_WNE_4YR != null).sort(porSalario).slice(0, 6);
      return {
        pasos: [
          pensar(`Tiene ${sat} de SAT. "Buenas posibilidades" significa que su puntaje esté por encima del percentil 75 de los admitidos: ahí se considera una universidad segura.`),
          usar('buscar_universidades', `${l.arg}nivel=4 años · con_rango_sat=sí`, `${miles(con.length)} universidades`),
          usar('clasificar_por_sat', `sat=${sat}`, `${seguras.length} seguras · ${objetivo.length} buenas opciones`),
          pensar('Entre las seguras, priorizo las que mejores resultados dan a sus egresados, para que "segura" no signifique "peor".'),
          usar('ordenar', 'por=salario_egresados · orden=desc', `top ${top.length}`),
        ],
        texto: `Con **${sat}** estás por encima del 75% de los admitidos en **${seguras.length} universidades**${l.texto} (tus opciones seguras), y dentro del rango en otras **${objetivo.length}**.\n\nEstas son las seguras con **mejores resultados** de sus egresados:`,
        universidades: top.map(u => ficha(u, [...datosBasicos(u), `Egresados ganan ${usd(u.MD_EARN_WNE_4YR)}`], 'Segura')),
        cierre: '"Segura" no es garantía: también cuentan tus notas, ensayos y actividades. Pero con este puntaje, tu SAT juega a favor.',
        filtros: { ...repartirSAT(sat), estado: perfil.estado },
      };
    },
  },
  {
    id: 'ivy-league',
    categoria: 'Tu perfil',
    pregunta: 'Saqué 1450, ¿estoy en el rango de las Ivy League?',
    claves: ['ivy', 'ivies'],
    resolver: ({ universidades, perfil }) => {
      const sat = perfil.sat ?? 1450;
      const ivies = IVY_LEAGUE.map(n => universidades.find(u => u.INSTNM === n)).filter((u): u is Universidad => !!u);
      const niveles = ivies.map(u => ({ u, nivel: clasificar(u, sat), r: rangoSAT(u) }));
      const enRango = niveles.filter(x => x.nivel === 'Buena opción' || x.nivel === 'Segura').length;
      const minimo25 = Math.min(...niveles.map(x => x.r?.[0] ?? Infinity));
      return {
        pasos: [
          pensar(`Son 8 universidades concretas. Busco cada una y comparo ${sat} con su rango SAT (percentil 25 a 75 de los admitidos).`),
          usar('ver_detalle', 'Harvard, Yale, Princeton, Columbia, Brown, Dartmouth, Cornell, Penn', `${ivies.length} fichas`),
          usar('clasificar_por_sat', `sat=${sat}`, `${enRango} dentro del rango · ${ivies.length - enRango} por debajo`),
          pensar('También miro la tasa de admisión: aunque el puntaje alcance, en estas universidades casi todos los postulantes tienen puntajes altos.'),
        ],
        texto: enRango > 0
          ? `Con **${sat}** estás **dentro del rango en ${enRango} de las 8** Ivy League. Eso significa que tu SAT no te descarta, pero ojo: todas admiten **menos del ${pct(Math.max(...ivies.map(u => u.ADM_RATE ?? 0)) + 0.01)}** de postulantes, así que siempre son difíciles.`
          : `Con **${sat}** estás **por debajo del rango en las 8** Ivy League (la más accesible empieza en **${minimo25}**). No es imposible —el 25% de sus admitidos tiene menos que ese número— pero tu SAT no te ayudaría. Si puedes, vale la pena volver a rendirlo.\n\nAdemás, todas admiten **menos del ${pct(Math.max(...ivies.map(u => u.ADM_RATE ?? 0)) + 0.01)}** de postulantes.`,
        universidades: niveles
          .sort((a, b) => (a.r?.[0] ?? 0) - (b.r?.[0] ?? 0))
          .map(({ u, nivel }) => ficha(u, [...datosBasicos(u)].slice(0, 2), nivel === 'Difícil' ? 'Por debajo' : 'En rango')),
        cierre: 'En universidades así de selectivas el SAT abre la puerta, pero deciden el ensayo, las actividades y las cartas de recomendación.',
      };
    },
  },
  {
    id: 'math-fuerte',
    categoria: 'Tu perfil',
    pregunta: 'Mi Math es 750 pero mi Reading es 600, ¿dónde destaca más mi Math?',
    claves: ['math', 'matematica', 'reading', 'lectura', 'destaca'],
    resolver: ({ universidades, perfil }) => {
      const math = perfil.math ?? 750;
      const lectura = perfil.lectura ?? 600;
      const encaja = universidades.filter(u =>
        esCuatroAnios(u) && u.SATMT75 != null && u.SATVR25 != null
        && math >= u.SATMT75 && lectura >= u.SATVR25);
      const top = [...encaja].sort((a, b) => (b.SATMT75 ?? 0) - (a.SATMT75 ?? 0) || porSalario(a, b)).slice(0, 6);
      return {
        pasos: [
          pensar(`Tiene un perfil desbalanceado: Math ${math} y Reading ${lectura}. Busco universidades donde su Math esté en el 25% superior y su Reading al menos dentro del rango.`),
          usar('buscar_universidades', `math≥percentil_75 · reading≥percentil_25`, `${miles(encaja.length)} universidades`),
          pensar('Ordeno por el nivel de Math de la universidad: las de arriba son las más exigentes en matemáticas donde aún destacaría.'),
          usar('ordenar', 'por=math_percentil_75 · orden=desc', `top ${top.length}`),
        ],
        texto: `Con Math **${math}** y Reading **${lectura}**, hay **${miles(encaja.length)} universidades** donde tu Math está en el **25% superior** de los admitidos y tu Reading no te deja fuera.\n\nLas más exigentes en matemáticas donde todavía destacas:`,
        universidades: top.map(u => ficha(u, [
          `Math ${u.SATMT25}–${u.SATMT75}`, `Reading ${u.SATVR25}–${u.SATVR75}`,
          u.ADM_RATE != null ? `Admite ${pct(u.ADM_RATE)}` : '',
        ])),
        cierre: 'Si te interesa ingeniería o ciencias, tu Math pesa más que el total. Subir Reading 50–80 puntos abriría muchas más opciones.',
        filtros: { math, lectura },
      };
    },
  },
  {
    id: 'selectivas',
    categoria: 'Tu perfil',
    pregunta: '¿Cuáles son las universidades más difíciles de entrar?',
    claves: ['selectivas', 'dificiles', 'dificil de entrar', 'mas dificil', 'exigentes', 'prestigiosas', 'mejores universidades'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const con = universidades.filter(u => u.ADM_RATE != null && u.ADM_RATE > 0 && (u.UGDS ?? 0) >= 1000 && l.ok(u));
      const top = [...con].sort((a, b) => a.ADM_RATE! - b.ADM_RATE!).slice(0, 6);
      const bajo10 = con.filter(u => u.ADM_RATE! < 0.1).length;
      return {
        pasos: [
          pensar('"Difícil de entrar" lo mido con la tasa de admisión. Descarto universidades muy pequeñas porque su tasa puede ser engañosa.'),
          usar('buscar_universidades', `${l.arg}tasa_admision=con_dato · estudiantes≥1,000`, `${miles(con.length)} universidades`),
          usar('ordenar', 'por=tasa_admision · orden=asc', `top ${top.length}`),
          usar('contar', 'tasa_admision<10%', `${bajo10} universidades`),
        ],
        texto: `${bajo10 > 0 ? `Solo **${bajo10} universidades**${l.texto} admiten a menos del 10% de quienes postulan.` : `Ninguna universidad${l.texto} admite a menos del 10%.`} Las más selectivas${l.texto || ' del país'}:`,
        universidades: top.map(u => ficha(u, datosBasicos(u))),
        cierre: 'En universidades así, incluso un puntaje perfecto no asegura la admisión: son difíciles para casi cualquier estudiante.',
      };
    },
  },
  {
    id: 'test-optional',
    categoria: 'Tu perfil',
    pregunta: '¿Qué universidades buenas no me exigen el SAT?',
    claves: ['no exigen', 'no me exigen', 'no piden', 'no requieren', 'test optional', 'sin sat', 'sin el sat', 'opcional'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const opcional = universidades.filter(u => esCuatroAnios(u) && l.ok(u)
        && (u.ADMCON7 === 'Considerado pero no requerido' || u.ADMCON7 === 'Ni requerido ni recomendado'));
      const considerado = opcional.filter(u => u.ADMCON7 === 'Considerado pero no requerido').length;
      const top = opcional.filter(u => u.ADM_RATE != null && u.ADM_RATE > 0 && (u.UGDS ?? 0) >= 1000)
        .sort((a, b) => a.ADM_RATE! - b.ADM_RATE!).slice(0, 6);
      return {
        pasos: [
          pensar('Busco universidades de 4 años cuya política dice que el SAT no es obligatorio. Para mostrar "buenas", ordeno por selectividad.'),
          usar('buscar_universidades', `${l.arg}politica_sat=opcional · nivel=4 años`, `${miles(opcional.length)} universidades`),
          usar('contar', 'politica_sat="considerado pero no requerido"', `${miles(considerado)} lo consideran si lo envías`),
          usar('ordenar', 'por=tasa_admision · orden=asc', `top ${top.length}`),
        ],
        texto: `**${miles(opcional.length)} universidades de 4 años**${l.texto} no te exigen el SAT. De ellas, **${miles(considerado)}** lo toman en cuenta si decides enviarlo.\n\nAlgunas de las más reconocidas:`,
        universidades: top.map(u => ficha(u, [...datosBasicos(u).slice(0, 2), 'SAT opcional'])),
        cierre: '**"Opcional" no es "irrelevante"**: si tu puntaje está dentro o por encima del rango de la universidad, envíalo; si está por debajo, mejor no.',
        filtros: { exigirSAT: 'opcional', estado: perfil.estado },
      };
    },
  },
  {
    id: 'sat-obligatorio',
    categoria: 'Tu perfil',
    pregunta: '¿Qué universidades exigen sí o sí el SAT?',
    claves: ['exigen', 'obligatorio', 'requieren', 'si o si', 'piden el sat', 'necesito el sat'],
    resolver: ({ universidades }) => {
      const req = universidades.filter(u => u.ADMCON7 === 'Requerido');
      const top = [...req].filter(u => u.SAT_AVG != null).sort((a, b) => b.SAT_AVG! - a.SAT_AVG!).slice(0, 6);
      return {
        pasos: [
          pensar('Filtro por la política de admisión "Requerido".'),
          usar('buscar_universidades', 'politica_sat=requerido', `${req.length} universidades`),
          usar('ordenar', 'por=sat_promedio · orden=desc', `top ${top.length}`),
        ],
        texto: `Solo **${req.length} universidades** de la base exigen el SAT de forma obligatoria. Varias de las más prestigiosas volvieron a pedirlo en los últimos años:`,
        universidades: top.map(u => ficha(u, [`SAT prom. ${u.SAT_AVG}`, u.ADM_RATE != null ? `Admite ${pct(u.ADM_RATE)}` : '', 'SAT obligatorio'])),
        cierre: 'Si apuntas a alguna de estas, planifica rendir el SAT con tiempo para poder repetirlo.',
        filtros: { exigirSAT: 'requerido' },
      };
    },
  },

  // ---------------- Costos y becas ----------------
  {
    id: 'baratas-buenas',
    categoria: 'Costos y becas',
    pregunta: '¿Cuáles son las universidades más baratas que igual tienen buenos resultados?',
    claves: ['baratas', 'barata', 'economicas', 'economica', 'menos cuestan', 'bajo costo', 'mas barato'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const buenas = universidades.filter(u => esTradicional(u) && l.ok(u) && (u.UGDS ?? 0) >= 1000
        && u.TUITIONFEE_OUT != null && (u.MD_EARN_WNE_4YR ?? 0) >= 60000);
      const top = [...buenas].sort((a, b) => a.TUITIONFEE_OUT! - b.TUITIONFEE_OUT!).slice(0, 6);
      return {
        pasos: [
          pensar('"Barata pero buena": defino "buena" como egresados que ganan $60k o más a los 4 años de graduarse. Luego ordeno por matrícula.'),
          usar('buscar_universidades', `${l.arg}con_datos_sat=sí · salario_egresados≥$60,000 · estudiantes≥1,000`, `${miles(buenas.length)} universidades`),
          usar('ordenar', 'por=matricula · orden=asc', `top ${top.length}`),
        ],
        texto: `Hay **${miles(buenas.length)} universidades**${l.texto} cuyos egresados ganan **$60,000 o más** a los 4 años. Estas son las que cobran **menos matrícula**:`,
        universidades: top.map(u => ficha(u, [`Matrícula ${usd(u.TUITIONFEE_OUT)}`, `Egresados ganan ${usd(u.MD_EARN_WNE_4YR)}`, u.ADM_RATE != null ? `Admite ${pct(u.ADM_RATE)}` : ''])),
        cierre: 'La matrícula no es todo: suma alojamiento y comida (el costo de vida) para saber el total anual. Lo ves en la ficha de cada una.',
      };
    },
  },
  {
    id: 'ingresos-bajos',
    categoria: 'Costos y becas',
    pregunta: 'Mi familia tiene ingresos bajos, ¿dónde pagaría menos de verdad?',
    claves: ['ingresos bajos', 'pocos recursos', 'gana poco', 'bajos recursos', 'no tenemos dinero', 'pagaria menos'],
    resolver: ({ universidades }) => {
      const selectivas = universidades.filter(u => u.ADM_RATE != null && u.ADM_RATE > 0 && u.ADM_RATE <= 0.25 && netoIngresoBajo(u) != null);
      const top = [...selectivas].sort((a, b) => netoIngresoBajo(a)! - netoIngresoBajo(b)!).slice(0, 6);
      const harvard = universidades.find(u => u.INSTNM === 'Harvard University');
      return {
        pasos: [
          pensar('La matrícula publicada engaña: lo que importa es el precio neto (lo que paga la familia después de becas). El dato existe por rango de ingreso familiar; uso el rango más bajo (hasta $30k al año).'),
          usar('buscar_universidades', 'tasa_admision≤25% · precio_neto_ingreso_bajo=con_dato', `${selectivas.length} universidades`),
          usar('ordenar', 'por=precio_neto_ingreso_bajo · orden=asc', `top ${top.length}`),
          ...(harvard ? [usar('ver_detalle', 'Harvard University', `matrícula ${usd(harvard.TUITIONFEE_OUT)} · neto ingreso bajo ${usd(netoIngresoBajo(harvard))}`)] : []),
          pensar('Debo aclarar que este dato aplica a familias de EE. UU.; para estudiantes internacionales las becas dependen de cada universidad.'),
        ],
        texto: `Algo que sorprende: **las universidades más selectivas suelen ser las más baratas para familias de ingresos bajos**, porque tienen fondos enormes para becas.${harvard ? ` Por ejemplo, Harvard publica una matrícula de **${usd(harvard.TUITIONFEE_OUT)}**, pero una familia de ingresos bajos paga en promedio **${usd(netoIngresoBajo(harvard))}** al año.` : ''}\n\nLas que tienen el **precio neto más bajo** para ese grupo:`,
        universidades: top.map(u => ficha(u, [`Pagan ${usd(netoIngresoBajo(u))}/año`, `Matrícula publicada ${usd(u.TUITIONFEE_OUT)}`, `Admite ${pct(u.ADM_RATE)}`])),
        cierre: '**Importante:** estos promedios son de familias en EE. UU. con ayuda federal. Si eres estudiante internacional, usa la **calculadora de costo neto** de cada universidad (está en su ficha) para ver tu caso.',
      };
    },
  },
  {
    id: 'costo-total',
    categoria: 'Costos y becas',
    pregunta: '¿Cuánto cuesta realmente estudiar en NYU, con todo incluido?',
    claves: ['cuanto cuesta', 'costo total', 'todo incluido', 'cuanto sale', 'cuanto me costaria', 'cuanto cuestaria', 'precio de'],
    resolver: ({ universidades, indice, texto }) => {
      const nombre = texto.match(/\ben ([^,?¿.]+)/)?.[1] ?? '';
      const uni = (nombre && encontrarPorNombre(indice, nombre))
        || universidades.find(u => u.INSTNM === 'New York University')!;
      const vida = calcularCostoVida(uni);
      const matricula = uni.TUITIONFEE_OUT ?? uni.TUITIONFEE_IN;
      const total = matricula != null && vida ? matricula + vida.valor : uni.COSTT4_A;
      const beca = uni.IGRNT_P != null && uni.IGRNT_A != null ? { p: uni.IGRNT_P, a: uni.IGRNT_A } : null;
      return {
        pasos: [
          pensar(`Necesito la ficha de ${uni.INSTNM} y sumar matrícula + costo de vida (alojamiento, comida, libros y gastos personales).`),
          usar('ver_detalle', uni.INSTNM, `matrícula ${usd(matricula)} · vida ${usd(vida?.valor)}`),
          usar('calcular_costo_total', 'matricula + alojamiento + comida + libros + otros', usd(total)),
          beca ? usar('ver_becas', uni.INSTNM, `${beca.p}% recibe beca propia · promedio ${usd(beca.a)}`) : pensar('No hay dato de becas propias para esta universidad.'),
        ],
        texto: `Estudiar en **${uni.INSTNM}** cuesta aproximadamente **${usd(total)} al año** con todo incluido:\n\n• Matrícula: **${usd(matricula)}**\n• Costo de vida (alojamiento, comida, libros y otros): **${usd(vida?.valor)}**${vida?.estimado ? ' (estimado)' : ''}\n\nEn 4 años serían unos **${usd(total != null ? total * 4 : null)}**.${beca ? `\n\nLa buena noticia: el **${beca.p}%** de sus alumnos de primer año recibe una beca de la universidad, de **${usd(beca.a)}** en promedio.` : ''}${netoPromedio(uni) != null ? ` Después de becas, el precio neto promedio es **${usd(netoPromedio(uni))}** al año.` : ''}`,
        universidades: [ficha(uni, datosBasicos(uni))],
        cierre: 'Abre la ficha para ver el desglose y el enlace a su calculadora oficial de costo neto.',
      };
    },
  },
  {
    id: 'becas-grandes',
    categoria: 'Costos y becas',
    pregunta: '¿Qué universidades dan las becas más grandes?',
    claves: ['becas', 'beca', 'ayuda economica', 'financiamiento'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const con = universidades.filter(u => u.IGRNT_A != null && (u.IGRNT_P ?? 0) >= 50 && (u.UGDS ?? 0) >= 1000 && l.ok(u));
      const top = [...con].sort((a, b) => b.IGRNT_A! - a.IGRNT_A!).slice(0, 6);
      return {
        pasos: [
          pensar('Busco becas que da la propia universidad (no del gobierno), porque son las que también pueden llegar a estudiantes internacionales. Exijo que al menos la mitad de los alumnos la reciba, para que sea algo común y no excepcional.'),
          usar('buscar_universidades', `${l.arg}beca_propia_recibe≥50% · estudiantes≥1,000`, `${miles(con.length)} universidades`),
          usar('ordenar', 'por=monto_beca_propia · orden=desc', `top ${top.length}`),
        ],
        texto: `Encontré **${miles(con.length)} universidades**${l.texto} donde **la mayoría** de los alumnos de primer año recibe una beca de la propia universidad. Las que dan los **montos más altos**:`,
        universidades: top.map(u => ficha(u, [`Beca prom. ${usd(u.IGRNT_A)}`, `${u.IGRNT_P}% la recibe`, `Matrícula ${usd(u.TUITIONFEE_OUT)}`])),
        cierre: 'Fíjate en la diferencia entre la matrícula y la beca: en varias, la beca promedio cubre más de la mitad.',
      };
    },
  },
  {
    id: 'estado-barato',
    categoria: 'Costos y becas',
    pregunta: '¿En qué estado es más barato estudiar en una universidad pública?',
    claves: ['estado mas barato', 'que estado', 'estados mas baratos', 'en que estado'],
    resolver: ({ universidades }) => {
      const publicas = universidades.filter(u => esPublica(u) && esTradicional(u) && u.TUITIONFEE_OUT != null && !TERRITORIOS.has(u.STABBR));
      const porEstado = new Map<string, number[]>();
      for (const u of publicas) porEstado.set(u.STABBR, [...(porEstado.get(u.STABBR) ?? []), u.TUITIONFEE_OUT!]);
      const ranking = [...porEstado.entries()].filter(([, v]) => v.length >= 3)
        .map(([st, v]) => ({ st, med: mediana(v)! })).sort((a, b) => a.med - b.med);
      const baratos = ranking.slice(0, 5);
      const caro = ranking[ranking.length - 1];
      const ejemplos = baratos.slice(0, 3).map(({ st }) =>
        publicas.filter(u => u.STABBR === st).sort((a, b) => a.TUITIONFEE_OUT! - b.TUITIONFEE_OUT!)[0]);
      return {
        pasos: [
          pensar('Agrupo las universidades públicas que usan el SAT por estado y comparo la matrícula típica (mediana) para estudiantes de fuera del estado.'),
          usar('buscar_universidades', 'tipo=publica · con_datos_sat=sí', `${miles(publicas.length)} universidades`),
          usar('estadisticas_por_grupo', 'agrupar=estado · medida=mediana(matricula)', `${ranking.length} estados comparados`),
          pensar('Muestro la más barata de cada uno de los 3 primeros como ejemplo.'),
        ],
        texto: `Los estados donde las universidades públicas cobran **menos matrícula** a estudiantes de fuera:\n\n${baratos.map((b, i) => `${i + 1}. **${nombreEstado(b.st)}**: ${usd(b.med)} típico`).join('\n')}\n\nEn el otro extremo está **${nombreEstado(caro.st)}**, con ${usd(caro.med)}.\n\nLa opción más barata en cada uno de los tres primeros:`,
        universidades: ejemplos.map(u => ficha(u, datosBasicos(u))),
        cierre: 'Toca un estado en el mapa para ver todas sus universidades.',
        filtros: { estado: baratos[0].st, tipo: 'publica' },
      };
    },
  },

  // ---------------- Resultados ----------------
  {
    id: 'salarios',
    categoria: 'Resultados',
    pregunta: '¿En qué universidades ganan más los egresados?',
    claves: ['ganan', 'salario', 'salarios', 'sueldo', 'egresados', 'ganar mas', 'mejor pagados'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const con = universidades.filter(u => esTradicional(u) && l.ok(u) && u.MD_EARN_WNE_4YR != null && (u.COUNT_WNE_4YR ?? 0) >= 100);
      const top = [...con].sort(porSalario).slice(0, 6);
      const med = mediana(con.map(salario));
      return {
        pasos: [
          pensar('Uso el salario mediano 4 años después de graduarse (College Scorecard). Exijo al menos 100 egresados medidos para que el dato sea confiable, y dejo fuera escuelas de salud y posgrado que no admiten con SAT.'),
          usar('buscar_universidades', `${l.arg}con_datos_sat=sí · egresados_medidos≥100`, `${miles(con.length)} universidades`),
          usar('estadisticas', 'mediana(salario_egresados)', usd(med)),
          usar('ordenar', 'por=salario_egresados · orden=desc', `top ${top.length}`),
        ],
        texto: `El egresado típico${l.texto} gana **${usd(med)}** al año, 4 años después de graduarse. Estas son las universidades donde más ganan:`,
        universidades: top.map(u => ficha(u, [`Ganan ${usd(u.MD_EARN_WNE_4YR)}`, ...datosBasicos(u).slice(0, 2)])),
        cierre: 'Mucho depende de las carreras que ofrecen: las universidades con fuerte foco en ingeniería y tecnología encabezan la lista.',
      };
    },
  },
  {
    id: 'retorno',
    categoria: 'Resultados',
    pregunta: '¿Qué universidades públicas dan el mejor retorno por lo que pagas?',
    claves: ['retorno', 'vale la pena', 'inversion', 'roi', 'rentable', 'conviene pagar'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const con = universidades.filter(u => esPublica(u) && esTradicional(u) && l.ok(u) && (u.UGDS ?? 0) >= 2000
        && u.TUITIONFEE_OUT != null && u.MD_EARN_WNE_4YR != null);
      const ratio = (u: Universidad) => u.MD_EARN_WNE_4YR! / u.TUITIONFEE_OUT!;
      const top = [...con].sort((a, b) => ratio(b) - ratio(a)).slice(0, 6);
      return {
        pasos: [
          pensar('Defino "retorno" de forma simple: cuánto gana el egresado al año dividido entre la matrícula anual. Solo públicas con al menos 2,000 estudiantes.'),
          usar('buscar_universidades', `${l.arg}tipo=publica · con_datos_sat=sí · estudiantes≥2,000`, `${miles(con.length)} universidades`),
          usar('calcular', 'retorno = salario_egresados ÷ matricula', `${miles(con.length)} calculados`),
          usar('ordenar', 'por=retorno · orden=desc', `top ${top.length}`),
        ],
        texto: `Comparé **${miles(con.length)} universidades públicas**${l.texto}. En las mejores, **un año de salario del egresado paga varios años de matrícula**:`,
        universidades: top.map(u => ficha(u, [`Pagas ${usd(u.TUITIONFEE_OUT)}/año`, `Ganan ${usd(u.MD_EARN_WNE_4YR)}`, `Retorno ×${ratio(u).toFixed(1)}`])),
        cierre: 'Es una medida simple (no incluye costo de vida ni becas), pero sirve para detectar universidades que rinden mucho más de lo que cuestan.',
        filtros: { tipo: 'publica', estado: perfil.estado },
      };
    },
  },
  {
    id: 'comparar',
    categoria: 'Resultados',
    pregunta: 'Compara MIT, Stanford y Harvard',
    claves: ['compara', 'comparar', 'comparame', 'versus', ' vs ', 'diferencia entre'],
    resolver: ({ universidades, indice, texto }) => {
      const despues = texto.split(/compar[a-z]*/)[1] ?? '';
      const nombres = despues.replace(/[?¿.]/g, '').split(/,|\by\b|\bvs\b|\bcon\b|\bo\b|\be\b/).map(s => s.trim()).filter(Boolean);
      let unis = [...new Set(nombres.map(n => encontrarPorNombre(indice, n)).filter((u): u is Universidad => !!u))];
      if (unis.length < 2) {
        unis = ['Massachusetts Institute of Technology', 'Stanford University', 'Harvard University']
          .map(n => universidades.find(u => u.INSTNM === n)!).filter(Boolean);
      }
      const mejor = (f: (u: Universidad) => number | null | undefined, menor = false) =>
        [...unis].filter(u => f(u) != null).sort((a, b) => (menor ? f(a)! - f(b)! : f(b)! - f(a)!))[0];
      const masSelectiva = mejor(u => u.ADM_RATE, true);
      const masBarata = mejor(netoPromedio, true);
      const ganaMas = mejor(u => u.MD_EARN_WNE_4YR);
      const corto = (u?: Universidad) => u ? u.INSTNM.replace('Massachusetts Institute of Technology', 'MIT') : '—';
      return {
        pasos: [
          pensar(`Pidió comparar ${unis.length} universidades. Traigo la ficha de cada una y comparo selectividad, costo después de becas y resultados.`),
          ...unis.map(u => usar('ver_detalle', u.INSTNM, `admite ${pct(u.ADM_RATE)} · neto ${usd(netoPromedio(u))}`)),
          usar('comparar', 'tasa_admision · precio_neto · salario_egresados', `${unis.length} universidades`),
        ],
        texto: `Comparando **${unis.map(corto).join(', ')}**:\n\n• **Más selectiva:** ${corto(masSelectiva)} (admite ${pct(masSelectiva?.ADM_RATE)})\n• **Más barata después de becas:** ${corto(masBarata)} (${usd(masBarata && netoPromedio(masBarata))} al año en promedio)\n• **Egresados que más ganan:** ${corto(ganaMas)} (${usd(ganaMas?.MD_EARN_WNE_4YR)} a los 4 años)`,
        universidades: unis.map(u => ficha(u, [`Admite ${pct(u.ADM_RATE)}`, `Neto ${usd(netoPromedio(u))}`, `Ganan ${usd(u.MD_EARN_WNE_4YR)}`])),
        cierre: 'Las diferencias de cifras entre universidades de este nivel son pequeñas: elige por la carrera, la ciudad y el ambiente.',
      };
    },
  },

  // ---------------- Vida universitaria ----------------
  {
    id: 'pequena',
    categoria: 'Vida universitaria',
    pregunta: 'Quiero una universidad pequeña donde los profesores me conozcan',
    claves: ['pequena', 'pequenas', 'chica', 'clases', 'profesores', 'personalizada', 'pocos alumnos'],
    resolver: ({ universidades, perfil }) => {
      const l = lugar(perfil);
      const con = universidades.filter(u => esTradicional(u) && l.ok(u) && u.UGDS != null && u.UGDS >= 800 && u.UGDS <= 5000
        && u.STUFACR != null && u.STUFACR <= 8);
      const top = [...con].filter(u => u.MD_EARN_WNE_4YR != null).sort(porSalario).slice(0, 6);
      return {
        pasos: [
          pensar('"Que los profesores me conozcan" se traduce en pocos alumnos por profesor. Busco universidades de 800 a 5,000 estudiantes con 8 alumnos o menos por profesor.'),
          usar('buscar_universidades', `${l.arg}estudiantes=800–5,000 · alumnos_por_profesor≤8`, `${miles(con.length)} universidades`),
          usar('ordenar', 'por=salario_egresados · orden=desc', `top ${top.length}`),
        ],
        texto: `Encontré **${miles(con.length)} universidades pequeñas**${l.texto} con **8 alumnos o menos por profesor** (el promedio en EE. UU. ronda los 15). Muchas son *liberal arts colleges*, donde las clases suelen ser de 10–20 personas.\n\nLas de mejores resultados:`,
        universidades: top.map(u => ficha(u, [`${miles(u.UGDS!)} estudiantes`, `${u.STUFACR} alumnos/profesor`, u.ADM_RATE != null ? `Admite ${pct(u.ADM_RATE)}` : ''])),
        cierre: 'En estas universidades las cartas de recomendación de tus profesores pesan mucho más después, para posgrados y trabajos.',
      };
    },
  },
  {
    id: 'latinos',
    categoria: 'Vida universitaria',
    pregunta: '¿En qué universidades hay más estudiantes latinos?',
    claves: ['latinos', 'latino', 'latinas', 'hispanos', 'hispano', 'comunidad latina', 'espanol'],
    resolver: ({ universidades }) => {
      const con = universidades.filter(u => esTradicional(u) && (u.UGDS ?? 0) >= 3000 && u.UGDS_HISP != null && !TERRITORIOS.has(u.STABBR));
      const top = [...con].sort((a, b) => b.UGDS_HISP! - a.UGDS_HISP!).slice(0, 6);
      const mayoria = con.filter(u => u.UGDS_HISP! >= 0.5).length;
      return {
        pasos: [
          pensar('Uso el porcentaje de estudiantes hispanos de pregrado. Excluyo Puerto Rico y territorios, y pido al menos 3,000 estudiantes.'),
          usar('buscar_universidades', 'con_datos_sat=sí · estudiantes≥3,000', `${miles(con.length)} universidades`),
          usar('contar', 'estudiantes_hispanos≥50%', `${mayoria} universidades`),
          usar('ordenar', 'por=porcentaje_hispanos · orden=desc', `top ${top.length}`),
        ],
        texto: `En **${mayoria} universidades** grandes **más de la mitad** de los estudiantes son latinos. Están concentradas en Texas, California, Florida y Nuevo México:`,
        universidades: top.map(u => ficha(u, [`${pct(u.UGDS_HISP)} latinos`, `${miles(u.UGDS!)} estudiantes`, u.TUITIONFEE_OUT != null ? `Matrícula ${usd(u.TUITIONFEE_OUT)}` : ''])),
        cierre: 'Muchas tienen la designación *Hispanic-Serving Institution*, que da acceso a programas y becas extra para estudiantes latinos.',
      };
    },
  },
  {
    id: 'grandes',
    categoria: 'Vida universitaria',
    pregunta: '¿Cuáles son las universidades más grandes de Texas?',
    claves: ['grandes', 'mas grande', 'mas grandes', 'campus grande', 'vida universitaria'],
    resolver: ({ universidades, perfil }) => {
      const st = perfil.estado ?? 'TX';
      const del = universidades.filter(u => u.STABBR === st && esCuatroAnios(u) && u.UGDS != null);
      const top = [...del].sort((a, b) => b.UGDS! - a.UGDS!).slice(0, 6);
      const total = del.reduce((s, u) => s + (u.UGDS ?? 0), 0);
      return {
        pasos: [
          pensar(`Busco las universidades de 4 años de ${nombreEstado(st)} y las ordeno por número de estudiantes de pregrado.`),
          usar('buscar_universidades', `estado=${st} · nivel=4 años`, `${del.length} universidades`),
          usar('ordenar', 'por=estudiantes · orden=desc', `top ${top.length}`),
        ],
        texto: `${nombreEstado(st)} tiene **${del.length} universidades de 4 años** con unos **${miles(total)} estudiantes** de pregrado en total. Las más grandes:`,
        universidades: top.map(u => ficha(u, [`${miles(u.UGDS!)} estudiantes`, ...datosBasicos(u).slice(0, 2)])),
        cierre: 'Las universidades grandes ofrecen más carreras, deportes y clubes, pero las clases de primer año pueden tener cientos de alumnos.',
        filtros: { estado: st },
      };
    },
  },
  {
    id: 'nueva-york',
    categoria: 'Vida universitaria',
    pregunta: 'Quiero estudiar en Nueva York con menos de $40,000 al año, ¿qué opciones tengo?',
    claves: [],
    resolver: recomendarPorPerfil,
  },
  {
    id: 'publica-privada',
    categoria: 'Vida universitaria',
    pregunta: '¿Qué conviene más: universidad pública o privada?',
    claves: ['publica o privada', 'privada o publica', 'publicas o privadas', 'privadas o publicas', 'publica vs privada'],
    resolver: ({ universidades }) => {
      const grupo = (f: (u: Universidad) => boolean) => {
        const g = universidades.filter(u => esCuatroAnios(u) && f(u));
        const med = (k: (u: Universidad) => number | null | undefined) =>
          mediana(g.map(k).filter((v): v is number => v != null));
        return { n: g.length, matricula: med(u => u.TUITIONFEE_OUT), neto: med(netoPromedio), salario: med(u => u.MD_EARN_WNE_4YR), admision: med(u => u.ADM_RATE) };
      };
      const pub = grupo(esPublica);
      const priv = grupo(u => u.CONTROL === 'Privada sin fines de lucro');
      return {
        pasos: [
          pensar('No hay una respuesta única; lo útil es comparar con datos. Calculo la mediana de cada indicador para públicas y privadas sin fines de lucro (de 4 años).'),
          usar('estadisticas_por_grupo', 'grupo=públicas · medidas=matrícula, neto, salario', `${miles(pub.n)} universidades`),
          usar('estadisticas_por_grupo', 'grupo=privadas sin fines de lucro · medidas=matrícula, neto, salario', `${miles(priv.n)} universidades`),
          pensar('El dato clave es la diferencia entre la matrícula publicada y el precio neto: en las privadas las becas cambian mucho el panorama.'),
        ],
        texto: `Comparando la universidad **típica** de cada tipo:\n\n**Públicas** (${miles(pub.n)}): matrícula ${usd(pub.matricula)} · después de becas ${usd(pub.neto)} · egresados ganan ${usd(pub.salario)}\n\n**Privadas sin fines de lucro** (${miles(priv.n)}): matrícula ${usd(priv.matricula)} · después de becas ${usd(priv.neto)} · egresados ganan ${usd(priv.salario)}\n\nLa matrícula de las privadas parece mucho más alta, pero **después de becas la diferencia se achica bastante**. Y los resultados de los egresados son parecidos.`,
        cierre: 'Mi recomendación: no descartes privadas por el precio publicado. Compara el **precio neto** de cada una en su ficha.',
      };
    },
  },
];

/** Respuesta cuando la pregunta no encaja con nada de la demo. */
export function respuestaSinCoincidencia(): RespuestaAgente {
  return {
    pasos: [
      pensar('No encuentro en la pregunta un puntaje SAT, un estado, un presupuesto ni un tema de los que tengo preparados para esta demo.'),
    ],
    texto: 'En esta demo respondo un conjunto de **preguntas preparadas** y también preguntas libres que incluyan tu **puntaje SAT**, un **estado** o un **presupuesto** (por ejemplo: "Tengo 1300 y quiero ir a Florida").\n\nCon la IA real conectada podría responder cualquier pregunta. Mientras tanto, prueba con alguna de las sugerencias de abajo.',
  };
}

