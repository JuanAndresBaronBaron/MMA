/* Currículos por cinturón o nivel, alineados por índice con SYSTEMS de js/catalog.js (rangos[i] ↔ ranks[i]).
   CURRICULOS[clave] = {sistema, rangos: [{rank, edadMin, tiempo, grados: [{g, titulo, req: [{id, txt, cat, mod?, critico?}]}], conducta: [{id, txt}]}]}
   - Ids estables: `${pref}.${grado}.${nn}` y `${pref}.c.${nn}` según la posición. Para no renumerar, solo se AGREGA al final
     de cada lista; nunca se reordena ni se borra (si algo sobra, se cambia el texto conservando el tema).
   - g = número de grado (raya) que se gana con ese bloque; g = 0 en sistemas sin rayas (requisitos del cinturón).
   - mod: módulo del camino de entreno donde se estudia (bjj, muaythai, lucha, boxeo o mma según la clave).
   - Los rangos que faltan al final (por ejemplo, coral y rojo en BJJ) no tienen currículo. */
import {SYSTEMS} from "../catalog.js";

const pad = n => String(n).padStart(2, "0");
/* q(txt, cat, mod?, critico?) → requisito sin id; el id se pone por posición */
const q = (txt, cat, mod = null, critico = false) => ({txt, cat, mod, critico});
const req = (pref, g, lista) => lista.map((x, i) => Object.assign({id: `${pref}.${g}.${pad(i + 1)}`, txt: x.txt, cat: x.cat}, x.mod ? {mod: x.mod} : {}, x.critico ? {critico: true} : {}));
/* rango(sistema, i, pref, edadMin, [[titulo, [q...]], ...], [conducta...], g0) */
function rango(sis, i, pref, edadMin, bloques, conducta = [], g0 = 1){
  const r = SYSTEMS[sis]?.ranks?.[i] || {};
  return {rank: r.n || "", edadMin, m: r.m || 0, tiempo: r.m ? `${r.m} meses` : "",
    grados: bloques.map(([titulo, lista], k) => ({g: g0 === 0 ? 0 : k + g0, titulo, req: req(pref, g0 === 0 ? 0 : k + g0, lista)})),
    conducta: conducta.map((txt, k) => ({id: `${pref}.c.${pad(k + 1)}`, txt}))};
}
const CONDUCTA = ["Se rinde a tiempo y suelta sus llaves al primer tap", "Asiste con constancia y avisa sus lesiones antes de entrenar", "Cuida la higiene: uñas cortas, equipo limpio y chanclas fuera del tapiz"];

/* ---------- BJJ adultos: blanco a negro, 4 bloques de rayas por cinturón ---------- */
const bjj = {sistema: "bjj", rangos: [
 rango("bjj", 0, "bjj.bl", 16, [
  ["Supervivencia y movimientos base", [
   q("Escape de cadera de punta a punta del tatami", "fundamentos", "fundamentos-1", true),
   q("Caídas hacia atrás y laterales sin golpear la cabeza", "fundamentos", "fundamentos-1", true),
   q("Levantada técnica a ambos lados", "fundamentos", "fundamentos-1"),
   q("Puente (upa) hacia ambos hombros", "fundamentos", "fundamentos-1"),
   q("Explica la jerarquía de posiciones y por qué posición antes que sumisión", "conocimiento", "fundamentos-1"),
   q("Se rinde con tap claro y a tiempo", "actitud", "fundamentos-1", true),
   q("Sprawl y regreso a la guardia", "fundamentos", "fundamentos-1"),
   q("Marcos con antebrazos y codos dentro, sin estirar los brazos", "fundamentos", "fundamentos-1"),
  ]],
  ["Escapes de las inmovilizaciones", [
   q("Escape de la montada con upa", "escape", "fundamentos-2", true),
   q("Escape de la montada con codo-rodilla", "escape", "fundamentos-2", true),
   q("Escape de cien kilos recuperando la guardia", "escape", "fundamentos-2"),
   q("Escape de la espalda con defensa de cuello", "escape", "fundamentos-2"),
   q("Aguanta un minuto bajo cien kilos respirando con calma", "vivo", "fundamentos-1"),
   q("Mantiene montada y cien kilos 30 segundos contra resistencia", "vivo", "fundamentos-1"),
   q("Desde la tortuga vuelve a la guardia o se sienta", "escape", "fundamentos-1"),
   q("Pasa de media guardia plana a media guardia útil", "guardia", "fundamentos-2"),
  ]],
  ["Guardia cerrada y barridas", [
   q("Mantiene la postura arriba en la guardia cerrada", "guardia", "fundamentos-2", true),
   q("Rompe la postura y controla mangas o muñecas desde abajo", "guardia", "guardias-1"),
   q("Barrida de tijera", "guardia", "guardias-1"),
   q("Barrida de cadera (hip bump)", "guardia", "guardias-1"),
   q("Abre la guardia cerrada de rodillas o de pie", "pase", "guardias-1"),
   q("Recupera la guardia con escape de cadera y marco", "guardia", "guardias-1"),
   q("Un derribo básico de pie (osoto gari o double leg)", "derribo", "guardias-1"),
   q("Sparring de posición en guardia cerrada", "vivo", "guardias-1"),
  ]],
  ["Sumisiones de alto porcentaje", [
   q("Mataleón desde la espalda con ganchos", "sumision", "sumisiones-1", true),
   q("Llave de brazo desde la guardia cerrada", "sumision", "sumisiones-1"),
   q("Triángulo desde la guardia cerrada", "sumision", "sumisiones-1"),
   q("Kimura desde la guardia o desde cien kilos", "sumision", "sumisiones-1"),
   q("Americana desde cien kilos", "sumision", "sumisiones-1"),
   q("Llave de brazo desde la montada", "sumision", "sumisiones-1"),
   q("Defensa básica de la guillotina y del triángulo", "defensa", "sumisiones-1"),
   q("Un pase de guardia básico (toreando o de rodillas)", "pase", "guardias-2"),
   q("Rueda a ritmo moderado con control y sin lesionar a nadie", "vivo", null, true),
   q("Conoce las reglas básicas de puntuación de competición", "conocimiento", "sumisiones-3"),
  ]],
 ], CONDUCTA),
 rango("bjj", 1, "bjj.az", 16, [
  ["Media guardia y guardias abiertas", [
   q("Gana el gancho por debajo en media guardia y sale a la espalda o a la barrida", "guardia", "guardias-2", true),
   q("Barrida desde media guardia", "guardia", "guardias-2"),
   q("Elevación desde guardia mariposa", "guardia", "guardias-2"),
   q("Retención de guardia con marcos y giro de cadera", "guardia", "guardias-2", true),
   q("Guardia De la Riva básica y una barrida", "guardia", "guardias-3"),
   q("Una guardia de agarres (araña, lazo o de solapa) con una barrida", "guardia", "guardias-3"),
   q("Levantarse desde la guardia (wrestle-up o levantada técnica)", "derribo", "guardias-2"),
   q("Sparring de retención de guardia con objetivo", "vivo", "guardias-2"),
  ]],
  ["Pases de guardia", [
   q("Pase toreando", "pase", "guardias-2", true),
   q("Pase knee cut", "pase", "guardias-2"),
   q("Un pase de presión (over-under o de doble gancho)", "pase", "guardias-2"),
   q("Pasa la media guardia hasta cien kilos", "pase", "guardias-2"),
   q("Estabiliza 3 segundos en cien kilos después de pasar", "pase", "guardias-2", true),
   q("Encadena dos pases según la reacción del rival", "pase", "guardias-2"),
   q("Transición de cien kilos a montada y a rodilla en el vientre", "fundamentos", "fundamentos-1"),
   q("Sparring de pase de guardia", "vivo", "guardias-2"),
  ]],
  ["Espalda y estrangulaciones", [
   q("Toma la espalda desde la tortuga", "sumision", "sumisiones-2"),
   q("Retiene la espalda contra un compañero que intenta escapar", "vivo", "sumisiones-2", true),
   q("Estrangulación cruzada desde la montada (con gi)", "sumision", "sumisiones-2"),
   q("Guillotina desde la guardia y de pie", "sumision", "sumisiones-2"),
   q("D'Arce", "sumision", "sumisiones-2"),
   q("Anaconda", "sumision", "sumisiones-2"),
   q("Una estrangulación con solapa desde la espalda (gi)", "sumision", "sumisiones-2"),
   q("Defiende la espalda protegiendo el cuello y escapa hacia el lado correcto", "escape", "fundamentos-2", true),
  ]],
  ["Cadenas y piernas básicas", [
   q("Cadena triángulo, llave de brazo y omoplata", "sumision", "sumisiones-1"),
   q("Escapa de las sumisiones desde la posición previa", "escape", "sumisiones-2", true),
   q("Control en ashi garami y llave de tobillo recta", "sumision", "sumisiones-2"),
   q("Defensa de llaves de pierna básicas", "defensa", "sumisiones-2", true),
   q("Un derribo propio confiable", "derribo", "guardias-1"),
   q("Explica su juego: guardia, pase y sumisión favoritos", "conocimiento"),
   q("Rueda con cinturones blancos cuidándolos y ayudándolos a aprender", "actitud", null, true),
   q("Compite o hace un simulacro de competición", "vivo", "sumisiones-3"),
  ]],
 ], ["Ayuda a enseñar a los cinturones blancos", "Mantiene el control en la rodada con compañeros más livianos", "Asiste con constancia y avisa sus lesiones antes de entrenar"]),
 rango("bjj", 2, "bjj.mo", 16, [
  ["Guardias modernas", [
   q("Entradas a single leg X y X-guard con barrida", "guardia", "guardias-3", true),
   q("De la Riva con barrida y toma de espalda", "guardia", "guardias-3"),
   q("Retención avanzada con inversión", "guardia", "guardias-3"),
   q("Juego de guardia contra pasadores de presión", "guardia", "guardias-3"),
   q("Adapta su guardia a gi y a no-gi", "conocimiento", "guardias-3"),
  ]],
  ["Pases y presión", [
   q("Body lock a la caminata de piernas", "pase", "guardias-3", true),
   q("Leg drag con toma de espalda", "pase", "guardias-3"),
   q("Encadena pases con transición directa a la espalda o la montada", "pase", "guardias-3"),
   q("Rodilla en el vientre con transiciones y ataques", "fundamentos", "fundamentos-1"),
   q("Sparring de pase contra guardias abiertas", "vivo", "guardias-3"),
  ]],
  ["Escapar como sistema", [
   q("Escapa en la transición, antes de que el rival estabilice", "escape", "fundamentos-3", true),
   q("Encadena escapes en inferioridad", "escape", "fundamentos-3"),
   q("Contraataca desde el escape (barrida o espalda)", "escape", "fundamentos-3"),
   q("Escapes de llaves de pierna con protocolo de seguridad", "escape", "sumisiones-3", true),
   q("Ciclos de puente y escape de cadera en solitario", "fisico", "fundamentos-3"),
  ]],
  ["Ataque encadenado y enseñanza", [
   q("Cadenas de ataque desde la espalda y la montada", "sumision", "sumisiones-3"),
   q("Transiciones de piernas con protocolo de seguridad", "sumision", "sumisiones-3", true),
   q("Conoce las reglas de competición por categoría y cinturón", "conocimiento", "sumisiones-3"),
   q("Enseña una clase de fundamentos a cinturones blancos", "conocimiento", null, true),
   q("Planea y dirige sparring situacional", "conocimiento"),
  ]],
 ], ["Es ejemplo de control y respeto en el tapiz", "Ayuda al profesor con los alumnos nuevos", "Asiste con constancia"]),
 rango("bjj", 3, "bjj.ma", 18, [
  ["Juego completo de pie a sumisión", [
   q("Derribo o halada a guardia con paso inmediato a una posición de control", "derribo", "guardias-3", true),
   q("Pasa y estabiliza contra rivales de su nivel", "pase", "guardias-3"),
   q("Finaliza desde la espalda, la montada y la guardia", "sumision", "sumisiones-3"),
   q("Escapa de las posiciones malas contra cinturones de su nivel", "escape", "fundamentos-3"),
  ]],
  ["Timing y contraataques", [
   q("Contraataca pases con barridas o tomas de espalda", "guardia", "guardias-3"),
   q("Contraataca sumisiones con inversión de posición", "escape", "fundamentos-3"),
   q("Usa fintas y amenazas dobles para abrir ataques", "sumision", "sumisiones-3"),
  ]],
  ["Estrategia y competición", [
   q("Gestiona puntos y tiempo en una lucha de competición", "conocimiento", "sumisiones-3"),
   q("Prepara un plan de juego para un rival", "conocimiento", "sumisiones-3"),
   q("Analiza su propio video y corrige errores", "conocimiento"),
  ]],
  ["Preparación para el negro", [
   q("Enseña el currículo del cinturón blanco completo", "conocimiento", null, true),
   q("Corrige técnica de cinturones azules y morados", "conocimiento"),
   q("Mantiene un juego seguro y duradero, sin lesiones por ego", "actitud", null, true),
  ]],
 ], ["Es referente técnico y humano de la academia", "Representa a la academia con respeto dentro y fuera del tapiz"]),
 rango("bjj", 4, "bjj.ne", 19, [
  ["Maestría y enseñanza", [
   q("Diseña y enseña un currículo por cinturones", "conocimiento", null, true),
   q("Forma instructores y cuida la seguridad de toda la clase", "conocimiento", null, true),
   q("Sigue aprendiendo: estudia, compite o investiga técnica", "actitud"),
  ]],
 ], ["Transmite los valores del arte a la siguiente generación"]),
]};

/* ---------- BJJ infantil: 13 cinturones, 4 bloques de rayas cada uno ---------- */
const K = (i, pref, edad, bloques, conducta) => rango("bjjkids", i, pref, edad, bloques, conducta);
const KC = ["Escucha al profesor y respeta al compañero", "Saluda al empezar y al terminar"];
const bjjkids = {sistema: "bjjkids", rangos: [
 K(0, "bjjk.bl", 4, [
  ["Moverse y caer", [q("Caída hacia atrás con el mentón al pecho", "fundamentos", "fundamentos-1", true), q("Rodada hacia adelante por el hombro", "fundamentos")]],
  ["Moverse en el suelo", [q("Escape de cadera de un lado al otro", "fundamentos", "fundamentos-1"), q("Puente con los pies cerca del glúteo", "fundamentos", "fundamentos-1")]],
  ["Posiciones", [q("Reconoce la guardia, la montada y cien kilos", "conocimiento", "fundamentos-1"), q("Se mantiene en cuatro apoyos sin que lo den vuelta", "vivo")]],
  ["Seguridad", [q("Se rinde con dos palmadas o diciendo para", "actitud", "fundamentos-1", true), q("Suelta apenas el compañero se rinde", "actitud", null, true)]],
 ], KC),
 K(1, "bjjk.gb", 4, [
  ["Caídas", [q("Caída lateral palmeando el tapiz", "fundamentos", "fundamentos-1", true), q("Levantada técnica hacia atrás", "fundamentos", "fundamentos-1")]],
  ["Escapes 1", [q("Upa para sacar al compañero de la montada", "escape", "fundamentos-2", true), q("Escape de cadera para meter la rodilla", "escape", "fundamentos-2")]],
  ["Control", [q("Mantiene la montada 10 segundos", "vivo", "fundamentos-1"), q("Mantiene cien kilos 10 segundos", "vivo", "fundamentos-1")]],
  ["Juego", [q("Juega a la tortuga sin hacer fuerza con el cuello", "vivo"), q("Hace el calentamiento completo sin parar", "fisico")]],
 ], KC),
 K(2, "bjjk.gr", 5, [
  ["Guardia cerrada", [q("Cierra la guardia y rompe la postura", "guardia", "guardias-1", true), q("Mantiene la postura arriba en la guardia", "guardia", "fundamentos-2")]],
  ["Escapes 2", [q("Codo-rodilla para salir de la montada", "escape", "fundamentos-2"), q("Recupera la guardia desde cien kilos", "escape", "fundamentos-2")]],
  ["Barridas", [q("Barrida de tijera", "guardia", "guardias-1"), q("Barrida de cadera", "guardia", "guardias-1")]],
  ["Juego y actitud", [q("Combate de posición respetando la señal de parar", "vivo", null, true), q("Ayuda a guardar el material", "actitud")]],
 ], KC),
 K(3, "bjjk.gn", 6, [
  ["Montada", [q("Pasa de cien kilos a la montada", "fundamentos", "fundamentos-1"), q("Mantiene la montada con la cadera baja", "vivo", "fundamentos-1")]],
  ["Pase", [q("Abre la guardia de rodillas", "pase", "guardias-1"), q("Pasa la guardia a cien kilos", "pase", "guardias-2")]],
  ["Primer control de brazo", [q("Llave de brazo desde la montada, despacio y con control", "sumision", "sumisiones-1", true), q("Defiende el brazo con los codos dentro", "defensa", "sumisiones-1")]],
  ["De pie", [q("Postura de lucha y cambio de nivel", "derribo", "guardias-1"), q("Sprawl a la señal", "derribo", "fundamentos-1")]],
 ], KC),
 K(4, "bjjk.ab", 7, [
  ["Derribos seguros", [q("Double leg con caída controlada del compañero", "derribo", "guardias-1", true), q("Cae bien cuando lo derriban", "fundamentos", "fundamentos-1", true)]],
  ["Guardia", [q("Llave de brazo desde la guardia cerrada", "sumision", "sumisiones-1"), q("Kimura desde la guardia", "sumision", "sumisiones-1")]],
  ["Control lateral", [q("Americana desde cien kilos", "sumision", "sumisiones-1"), q("Escapa de cien kilos con marco y cadera", "escape", "fundamentos-2")]],
  ["Juego", [q("Combate de posición de 1 minuto desde la guardia", "vivo"), q("Explica qué posición es mejor y por qué", "conocimiento", "fundamentos-1")]],
 ], KC),
 K(5, "bjjk.am", 8, [
  ["Espalda", [q("Toma la espalda desde la tortuga", "sumision", "sumisiones-2"), q("Mantiene la espalda con los ganchos", "vivo", "sumisiones-2")]],
  ["Media guardia", [q("Gancho por debajo en media guardia", "guardia", "guardias-2"), q("Recupera la guardia desde media guardia", "guardia", "guardias-2")]],
  ["Pases", [q("Pase toreando", "pase", "guardias-2"), q("Estabiliza después de pasar", "pase", "guardias-2", true)]],
  ["Actitud", [q("Rueda con control con los más pequeños", "actitud", null, true), q("Llega puntual y con el kimono limpio", "actitud")]],
 ], KC),
 K(6, "bjjk.an", 9, [
  ["Triángulo", [q("Triángulo desde la guardia cerrada", "sumision", "sumisiones-1"), q("Defensa del triángulo con postura", "defensa", "sumisiones-1")]],
  ["Barridas 2", [q("Elevación desde la guardia mariposa", "guardia", "guardias-2"), q("Barrida desde media guardia", "guardia", "guardias-2")]],
  ["Escapes 3", [q("Escape de la espalda", "escape", "fundamentos-2"), q("Escape de rodilla en el vientre", "escape", "fundamentos-2")]],
  ["Competencia", [q("Conoce los puntos básicos de competición", "conocimiento", "sumisiones-3"), q("Hace un simulacro de torneo", "vivo")]],
 ], KC),
 K(7, "bjjk.nb", 10, [
  ["Mataleón", [q("Mataleón desde la espalda con control y suelta al tap", "sumision", "sumisiones-1", true), q("Defensa del mataleón con las manos", "defensa", "sumisiones-1")]],
  ["Omoplata", [q("Omoplata desde la guardia", "sumision", "sumisiones-1"), q("Cadena triángulo y llave de brazo", "sumision", "sumisiones-1")]],
  ["Pases 2", [q("Pase knee cut", "pase", "guardias-2"), q("Encadena dos pases", "pase", "guardias-2")]],
  ["De pie 2", [q("Single leg con caída controlada", "derribo", "guardias-1"), q("Defensa del derribo y vuelta a la guardia", "derribo", "fundamentos-1")]],
 ], KC),
 K(8, "bjjk.na", 11, [
  ["Guillotina", [q("Guillotina desde la guardia", "sumision", "sumisiones-2"), q("Defensa de la guillotina al entrar", "defensa", "sumisiones-2", true)]],
  ["Guardias abiertas", [q("Guardia De la Riva básica", "guardia", "guardias-3"), q("Retención de guardia con marcos", "guardia", "guardias-2")]],
  ["Transiciones", [q("De cien kilos a montada y a espalda", "fundamentos", "fundamentos-1"), q("Rodilla en el vientre", "fundamentos", "fundamentos-1")]],
  ["Actitud", [q("Ayuda a enseñar a los cinturones grises", "actitud"), q("Gana y pierde con respeto", "actitud", null, true)]],
 ], KC),
 K(9, "bjjk.nn", 12, [
  ["Estrangulaciones con gi", [q("Estrangulación cruzada desde la montada", "sumision", "sumisiones-2"), q("Estrangulación con solapa desde la espalda", "sumision", "sumisiones-2")]],
  ["Cadenas", [q("Encadena barrida y pase a montada", "guardia", "guardias-2"), q("Encadena dos sumisiones desde la guardia", "sumision", "sumisiones-1")]],
  ["Escapes en sumisión", [q("Escapa de la llave de brazo antes de que se cierre", "escape", "sumisiones-2", true), q("Escapa del triángulo con postura", "escape", "sumisiones-2")]],
  ["Competencia 2", [q("Compite o hace simulacro con reglas reales", "vivo", "sumisiones-3"), q("Explica su plan de juego", "conocimiento")]],
 ], KC),
 K(10, "bjjk.vb", 13, [
  ["Juego completo 1", [q("Derribo, pase y finalización en una secuencia", "derribo", "guardias-1"), q("Guardia, barrida y finalización en una secuencia", "guardia", "guardias-1")]],
  ["Espalda 2", [q("Retención de espalda contra resistencia", "vivo", "sumisiones-2"), q("Toma de espalda desde media guardia", "guardia", "guardias-2")]],
  ["Física", [q("Circuito de peso corporal con buena técnica", "fisico"), q("Movilidad antes de cada clase", "fisico")]],
  ["Actitud", [q("Rueda con control con compañeros más pequeños", "actitud", null, true), q("Es puntual y constante", "actitud")]],
 ], KC),
 K(11, "bjjk.ve", 14, [
  ["Juego completo 2", [q("Un juego personal de guardia y pase", "conocimiento", "guardias-2"), q("Escapa de las posiciones malas contra resistencia", "escape", "fundamentos-2")]],
  ["Sumisiones 2", [q("D'Arce y anaconda", "sumision", "sumisiones-2"), q("Kimura desde varias posiciones", "sumision", "sumisiones-1")]],
  ["Competencia 3", [q("Gestiona puntos y tiempo en competición", "conocimiento", "sumisiones-3"), q("Analiza su propio video", "conocimiento")]],
  ["Liderazgo", [q("Ayuda al profesor en la clase de los pequeños", "actitud"), q("Es ejemplo de respeto", "actitud")]],
 ], KC),
 K(12, "bjjk.vn", 15, [
  ["Transición a adultos", [q("Domina el currículo del cinturón blanco de adultos", "conocimiento", "fundamentos-1", true), q("Defiende llaves de pierna básicas", "defensa", "sumisiones-2")]],
  ["Juego completo 3", [q("Sparring de posición desde todas las posiciones", "vivo"), q("Encadena ataques desde la espalda y la montada", "sumision", "sumisiones-2")]],
  ["Física 2", [q("Entrena fuerza con supervisión y buena técnica", "fisico"), q("Conoce la regla de conmoción: fuera ese día", "conocimiento", null, true)]],
  ["Liderazgo 2", [q("Enseña una técnica básica a los más pequeños", "conocimiento"), q("Representa a la academia con respeto", "actitud")]],
 ], KC),
]};

/* ---------- Muay Thai: 9 cinturones (sin rayas: g = 0) ---------- */
const T = (i, pref, edad, titulo, lista, conducta) => rango("muaythai", i, pref, edad, [[titulo, lista]], conducta, 0);
const MC = ["Respeta al kru y a los compañeros", "Controla la potencia en el sparring"];
const muaythai = {sistema: "muaythai", rangos: [
 T(0, "mt.bl", 6, "Postura y armas básicas", [
  q("Postura tailandesa con el peso atrás y la guardia alta", "fundamentos", "fundamentos-1", true), q("Desplazamiento sin cruzar los pies", "fundamentos", "fundamentos-1"),
  q("Jab y recto con la guardia arriba", "golpeo", "fundamentos-1"), q("Teep delantero", "golpeo", "fundamentos-1"),
  q("Patada circular a la pierna con la tibia", "golpeo", "fundamentos-1"), q("Wai kru básico como calentamiento", "conocimiento", "fundamentos-1"),
  q("Se venda las manos", "fundamentos", null, true)], MC),
 T(1, "mt.am", 7, "Patadas y defensa básica", [
  q("Patada circular al cuerpo por fases", "golpeo", "fundamentos-1", true), q("Teep trasero", "golpeo", "fundamentos-1"),
  q("Chequeo de patada con la tibia", "defensa", "fundamentos-2", true), q("Parada y cobertura contra el jab y el recto", "defensa", "fundamentos-1"),
  q("Combinación jab, recto y patada", "golpeo", "fundamentos-1"), q("3 rounds de sombra sin bajar la guardia", "fisico", "fundamentos-1")], MC),
 T(2, "mt.na", 8, "Rodillas, codos y clinch inicial", [
  q("Rodilla recta al saco", "golpeo", "clinch-1"), q("Codo horizontal y descendente en pads", "golpeo", "clinch-2"),
  q("Postura de clinch y swimming", "clinch", "clinch-1", true), q("Doble nuca con codos juntos", "clinch", "clinch-1"),
  q("Entrada al clinch después de un golpe", "clinch", "clinch-1"), q("Combinaciones puño-patada en escalera", "golpeo", "avanzado-1")], MC),
 T(3, "mt.ve", 10, "Combinaciones y ángulos", [
  q("Combinaciones de puño y patada con ángulo de salida", "golpeo", "fundamentos-2"), q("Switch kick", "golpeo", "fundamentos-2"),
  q("Defensa del teep y del jab con contraataque", "defensa", "fundamentos-2"), q("Sombra con desplazamiento y ángulos", "fundamentos", "fundamentos-2"),
  q("Sparring técnico liviano con control", "vivo", "avanzado-1", true), q("Patada al saco por volumen sin perder técnica", "fisico", "fundamentos-2")], MC),
 T(4, "mt.az", 12, "Clinch con rodillas y contraataques", [
  q("Rodillas rectas y curvas en el clinch", "clinch", "clinch-2"), q("Defensa del plum: romper y salir", "clinch", "clinch-2", true),
  q("Atrapar la patada y contraatacar", "defensa", "fundamentos-3"), q("Chequear y devolver", "defensa", "fundamentos-3"),
  q("Pads con el kru estilo tailandés", "golpeo", "avanzado-2"), q("Teep para medir y cortar", "golpeo", "avanzado-2")], MC),
 T(5, "mt.mo", 14, "Desequilibrios y criterio tailandés", [
  q("Giro en el clinch y rodilla", "clinch", "clinch-3"), q("Barrido después de rodilla con caída controlada", "clinch", "clinch-3", true),
  q("Codo después de atrapar la patada", "golpeo", "fundamentos-3"), q("Sparring técnico con puntuación tailandesa", "vivo", "fundamentos-3"),
  q("Explica cómo se puntúa en Muay Thai", "conocimiento", "fundamentos-3"), q("Acondicionamiento progresivo de la tibia", "fisico", "avanzado-2")], MC),
 T(6, "mt.ma", 16, "Timing, fintas y estilos", [
  q("Juego de fintas en sparring", "vivo", "avanzado-3"), q("Adapta su pelea a distintos estilos de rival", "conocimiento", "avanzado-3"),
  q("Sparring de clinch por puntos", "clinch", "clinch-3"), q("Contra estilo Saenchai: barrer la pierna de apoyo", "defensa", "fundamentos-3"),
  q("Estudia peleas y saca conclusiones", "conocimiento", "avanzado-3")], MC),
 T(7, "mt.ro", 18, "Peleador completo", [
  q("Codo giratorio controlado en pads", "golpeo", "clinch-3"), q("Gestiona los cinco rounds de una pelea", "conocimiento", "avanzado-3"),
  q("Sostiene pads para un compañero con criterio de kru", "conocimiento", "avanzado-2", true), q("Compite o hace un simulacro de pelea completo", "vivo"),
  q("Wai kru ram muay completo", "conocimiento", "avanzado-3")], MC),
 T(8, "mt.ne", 20, "Kru: enseñanza y tradición", [
  q("Enseña el currículo de los cinturones blanco a verde", "conocimiento", null, true), q("Prepara a un alumno para su primer combate", "conocimiento"),
  q("Conoce la historia y las tradiciones del Muay Thai", "conocimiento", "avanzado-3")], ["Transmite el respeto por el arte y la tradición"]),
]};

/* ---------- Niveles (Lucha, Boxeo, MMA): 6 niveles × 3 grados ---------- */
const N = (key, i, edad, bloques) => rango("niveles", i, `${key}.n${i + 1}`, edad, bloques, i < 2 ? ["Respeta al compañero y al profesor", "Controla la intensidad en el trabajo en vivo"] : ["Ayuda a los alumnos de niveles más bajos"]);
const lucha = {sistema: "niveles", rangos: [
 N("lu", 0, 6, [
  ["Seguridad y postura", [q("Caídas seguras hacia atrás y de lado", "fundamentos", "fundamentos-1", true), q("Postura de lucha con cadera baja y cabeza arriba", "fundamentos", "fundamentos-1"), q("Levantada técnica", "fundamentos", "fundamentos-1")]],
  ["Movimiento", [q("Desplazamiento en postura sin juntar los pies", "fundamentos", "fundamentos-1"), q("Cambios de nivel con la espalda recta", "fundamentos", "fundamentos-1"), q("Paso de penetración en el lugar", "derribo", "fundamentos-1")]],
  ["Primeras defensas", [q("Sprawl reactivo", "defensa", "fundamentos-1", true), q("Progresión de pelea de manos en 5 pasos", "fundamentos", "fundamentos-1"), q("Conoce los estilos y la puntuación básica", "conocimiento", "cadenas-1")]],
 ]),
 N("lu", 1, 8, [
  ["Derribos a las piernas", [q("Double leg con compañero", "derribo", "fundamentos-2", true), q("Single leg con una finalización", "derribo", "fundamentos-2"), q("Blast double en sombra", "derribo", "fundamentos-2")]],
  ["Agarres", [q("Pelea de manos con objetivo", "fundamentos", "fundamentos-2"), q("Snap down a go-behind", "derribo", "fundamentos-2"), q("Duck under desde el amarre de cuello", "derribo", "cadenas-1")]],
  ["Defensa activa", [q("Whizzer y crossface contra el single leg", "defensa", "fundamentos-2"), q("Sprawl y vuelta a la postura", "defensa", "cadenas-1"), q("Defensa de giros boca abajo", "escape", "suelo-1")]],
 ]),
 N("lu", 2, 10, [
  ["Suelo abajo", [q("Base y pelea de manos desde abajo", "escape", "suelo-1", true), q("Stand-up técnico", "escape", "suelo-1"), q("Sit-out y hip heist", "escape", "suelo-1")]],
  ["Suelo arriba", [q("Breakdown a tilt", "fundamentos", "suelo-2"), q("Gut wrench", "fundamentos", "suelo-2"), q("Control arriba sin dejar levantar", "vivo", "suelo-2")]],
  ["Cadenas iniciales", [q("Arm drag en cadena", "derribo", "cadenas-2"), q("Ankle pick reactivo", "derribo", "cadenas-2"), q("Pummeling continuo de ganchos", "clinch", "cadenas-2")]],
 ]),
 N("lu", 3, 12, [
  ["Cadenas daguestaníes", [q("Cadena de 3 ataques", "derribo", "cadenas-2", true), q("Pelea de manos con two-on-one", "fundamentos", "cadenas-2"), q("Leg lace con giros consecutivos", "fundamentos", "suelo-2")]],
  ["Clinch grecorromano", [q("Clinch contra la pared", "clinch", "fundamentos-3"), q("Body lock y zancadilla", "derribo", "fundamentos-3"), q("Retornos al tatami", "derribo", "fundamentos-3")]],
  ["En vivo", [q("Top y bottom situacional", "vivo", "suelo-2"), q("Sparring de puntuación freestyle", "vivo", "cadenas-3"), q("Circuito de acondicionamiento de lucha", "fisico", "suelo-2")]],
 ]),
 N("lu", 4, 14, [
  ["Proyecciones", [q("Progresión de proyecciones con caídas avanzadas", "derribo", "cadenas-3", true), q("Contra y ataque", "derribo", "cadenas-3"), q("Body lock situacional en la pared", "clinch", "cadenas-3")]],
  ["Competencia", [q("Gestiona puntos y tiempo en un combate", "conocimiento", "cadenas-1"), q("Compite o hace simulacro con reglas reales", "vivo"), q("Prepara su peso sin cortes peligrosos", "conocimiento")]],
  ["Suelo avanzado", [q("Cadenas daguestaníes en el suelo", "vivo", "suelo-3"), q("Wrestle-up contra la pared", "escape", "suelo-3"), q("Fortalecimiento de cuello seguro", "fisico", "suelo-1")]],
 ]),
 N("lu", 5, 16, [
  ["Élite", [q("Plan de lucha para un rival", "conocimiento", "cadenas-3"), q("Shark tank de suelo", "vivo", "suelo-3"), q("Lucha encadenada de 2 a 3 ataques bajo fatiga", "vivo", "fundamentos-3")]],
  ["Liderazgo", [q("Enseña el nivel principiante", "conocimiento", null, true), q("Analiza video propio y de rivales", "conocimiento"), q("Dirige un calentamiento completo", "conocimiento")]],
  ["Alto rendimiento", [q("Planifica una temporada de competición", "conocimiento"), q("Mantiene el peso de forma saludable", "actitud"), q("Compite a nivel nacional o equivalente", "vivo")]],
 ]),
]};
const boxeo = {sistema: "niveles", rangos: [
 N("bx", 0, 8, [
  ["Guardia", [q("Guardia con mentón abajo y codos cerrados", "fundamentos", "fund-1", true), q("Paso arrastrado en cuatro direcciones", "fundamentos", "fund-1"), q("Se venda las manos solo", "fundamentos", "fund-1")]],
  ["Jab", [q("Jab quieto, avanzando y retrocediendo", "golpeo", "fund-1", true), q("Doble jab en manoplas", "golpeo", "fund-1"), q("Explica las tres distancias", "conocimiento", "fund-1")]],
  ["Base física", [q("3 rondas de 2 minutos de cuerda", "fisico", "fund-1"), q("3 rondas de sombra sin bajar la guardia", "fisico", "fund-1"), q("Juego del jab al hombro con control", "vivo", "fund-1")]],
 ]),
 N("bx", 1, 10, [
  ["Golpes", [q("Recto con giro del pie de atrás", "golpeo", "fund-2", true), q("Gancho corto con el codo arriba", "golpeo", "fund-2"), q("Uppercut desde las piernas", "golpeo", "fund-2")]],
  ["Combinaciones", [q("Las cinco combinaciones básicas", "golpeo", "fund-2"), q("Manoplas cantadas del 1 al 6", "golpeo", "fund-2"), q("Combinaciones de dos niveles en el saco", "golpeo", "fund-2")]],
  ["Defensa 1", [q("Bloqueo de ganchos y golpes al cuerpo", "defensa", "fund-3", true), q("Parada del jab con respuesta", "defensa", "fund-3"), q("Atrapar y disparar", "defensa", "fund-3")]],
 ]),
 N("bx", 2, 12, [
  ["Defensa 2", [q("Esquiva de rectos", "defensa", "fund-3"), q("Rodada bajo el gancho con las piernas", "defensa", "fund-3"), q("Sombra defensiva", "defensa", "fund-3")]],
  ["Ángulos", [q("Combinación y pivote", "fundamentos", "fund-4", true), q("Saco con un tema por ronda", "golpeo", "fund-4"), q("Finta de jab para entrar con el recto", "golpeo", "fund-4")]],
  ["Sparring inicial", [q("Sparring de hombros y cuerpo con potencia acordada", "vivo", "fund-4", true), q("Usa protector bucal siempre", "actitud", null, true), q("Sabe cuándo parar un sparring", "conocimiento", "fund-4")]],
 ]),
 N("bx", 3, 14, [
  ["Guardia Philly Shell", [q("Construye la guardia Philly Shell en el espejo", "fundamentos", "guardia"), q("Shoulder roll en sombra", "defensa", "guardia"), q("Salida de las cuerdas con pivote", "defensa", "guardia")]],
  ["Defensa en capas", [q("Pull back sin perder la base", "defensa", "defensa", true), q("Rodada de hombro contra la derecha", "defensa", "defensa"), q("Parry y contragolpe", "defensa", "defensa")]],
  ["Pies", [q("Step-drag en cuadrado", "fundamentos", "pies"), q("Pivotes con cono", "fundamentos", "pies"), q("Cortar el ring", "fundamentos", "pies")]],
 ]),
 N("bx", 4, 16, [
  ["Contragolpe", [q("Pull counter con compañero", "golpeo", "ofensiva", true), q("Check hook contra el que avanza", "golpeo", "ofensiva"), q("Recta de derecha de frente", "golpeo", "ofensiva")]],
  ["Sparring", [q("Sparring técnico de solo contragolpes", "vivo", "ofensiva"), q("Sparring defensivo con un solo golpe", "vivo", "defensa"), q("Sparring condicionado de ritmo roto", "vivo", "pies")]],
  ["Competencia", [q("Conoce el reglamento y la puntuación", "conocimiento", "peleas"), q("Gestiona sus rounds", "conocimiento", "peleas"), q("Prepara su peso sin cortes peligrosos", "conocimiento")]],
 ]),
 N("bx", 5, 18, [
  ["Lectura de pelea", [q("Estudia una pelea en tres pasadas", "conocimiento", "peleas"), q("Ajusta el plan entre rounds", "conocimiento", "peleas"), q("Arma su propia biblioteca de estudio", "conocimiento", "biblioteca")]],
  ["Entrenamiento", [q("Sigue un plan semanal estilo Mayweather Boxing Club", "fisico", "entrenamiento"), q("Manoplas con ritmo y defensa", "golpeo", "entrenamiento"), q("Sostiene manoplas para otro con criterio", "conocimiento", "entrenamiento", true)]],
  ["Liderazgo", [q("Enseña los fundamentos a principiantes", "conocimiento", null, true), q("Compite a nivel regional o equivalente", "vivo"), q("Es ejemplo de control en el sparring", "actitud")]],
 ]),
]};
const mma = {sistema: "niveles", rangos: [
 N("mma", 0, 14, [
  ["Guardia y distancia", [q("Guardia de MMA lista para golpear y defender derribos", "fundamentos", "striking-1", true), q("Golpea y sal en ángulo", "golpeo", "striking-1"), q("Sombra de MMA con sprawl", "fundamentos", "striking-1")]],
  ["Seguridad", [q("Caídas seguras", "fundamentos", "jaula-1", true), q("Levantada técnica protegiendo la cara", "fundamentos", "jaula-1"), q("Conoce las reglas y faltas básicas", "conocimiento", "estrategia-1")]],
  ["Defensa de derribo", [q("Marco y sprawl contra entradas", "defensa", "striking-1"), q("Cambios de nivel y entradas en sombra", "derribo", "jaula-1"), q("Guardia cerrada contra golpes", "guardia", "jaula-1")]],
 ]),
 N("mma", 1, 15, [
  ["Reja 1", [q("Ganchos por debajo contra la reja", "clinch", "jaula-1", true), q("Wall walk desde sentado", "escape", "jaula-1"), q("Salida de la reja con pivote", "defensa", "striking-2")]],
  ["Golpeo 2", [q("Chequeo del calf kick", "defensa", "striking-2"), q("Combinación con patada baja en el saco", "golpeo", "striking-2"), q("Sombra con guardia larga y movimiento corto", "fundamentos", "striking-2")]],
  ["Sparring seguro", [q("Sparring posicional de bajo riesgo", "vivo", "estrategia-1", true), q("Rounds puntuados con juez interno", "vivo", "estrategia-1"), q("Base aeróbica en zona 2", "fisico", "estrategia-1")]],
 ]),
 N("mma", 2, 16, [
  ["Derribos de MMA", [q("Doble pierna contra la reja", "derribo", "jaula-2", true), q("Body lock y zancadilla en la reja", "derribo", "jaula-2"), q("Dirty boxing en la reja", "golpeo", "jaula-2")]],
  ["Suelo arriba", [q("Ground and pound con postura desde guardia y media guardia", "golpeo", "jaula-2"), q("Control de muñecas", "fundamentos", "jaula-2"), q("Sumisión desde el ground and pound", "sumision", "jaula-3")]],
  ["Suelo abajo", [q("Escapes de montada y control lateral bajo presión", "escape", "jaula-2", true), q("Levantada desde mariposa con gancho por debajo", "escape", "jaula-2"), q("Levantarse bajo golpes en la reja", "escape", "jaula-2")]],
 ]),
 N("mma", 3, 17, [
  ["Mezclar niveles", [q("Shadow de cambio de nivel", "fundamentos", "striking-3"), q("Finta de recto y derribo a dos piernas", "derribo", "striking-3", true), q("Contragolpe del patrón del rival", "golpeo", "striking-3")]],
  ["Cadenas y scrambles", [q("Cadena de derribos estilo Dagestán", "derribo", "jaula-3"), q("Scrambles desde tortuga y media guardia", "vivo", "jaula-3"), q("Defensa de guillotina al entrar", "defensa", "jaula-3", true)]],
  ["Estrategia", [q("Plan A y plan B en sparring con escenario", "conocimiento", "estrategia-2"), q("Cierre de round en los últimos 30 segundos", "vivo", "estrategia-2"), q("Circuito de fuerza para MMA", "fisico", "estrategia-2")]],
 ]),
 N("mma", 4, 18, [
  ["Peleador amateur", [q("Sparring de MMA con reglas limitadas", "vivo", "striking-3", true), q("Sparring situacional en la jaula", "vivo", "jaula-3"), q("Ride en la tortuga contra la reja", "vivo", "jaula-3")]],
  ["Campamento", [q("Planifica un campamento de pelea", "conocimiento", "estrategia-3"), q("Conoce los riesgos del corte de peso y no lo hace extremo", "conocimiento", "estrategia-3", true), q("Rounds de saco a ritmo de pelea", "fisico", "estrategia-2")]],
  ["Competencia", [q("Compite en amateur o hace simulacro de pelea completa", "vivo", "estrategia-3"), q("Estudia una pelea en tres pasadas", "conocimiento", "estrategia-3"), q("Visualización de escenarios", "conocimiento", "estrategia-3")]],
 ]),
 N("mma", 5, 18, [
  ["Profesional", [q("Plan de pelea por estilo de rival", "conocimiento", "estrategia-2"), q("Gestión de rounds en peleas de 3 y 5 asaltos", "conocimiento", "estrategia-2"), q("Simulación de pelea completa", "vivo", "estrategia-3")]],
  ["Liderazgo", [q("Enseña el nivel principiante con seguridad", "conocimiento", null, true), q("Dirige sparring con reglas y control", "conocimiento"), q("Es ejemplo de control y respeto", "actitud")]],
  ["Carrera", [q("Mantiene un peso de competencia saludable", "actitud"), q("Revisa su salud con controles médicos", "actitud", null, true), q("Analiza su propia carrera y planea la siguiente pelea", "conocimiento")]],
 ]),
]};

export const CURRICULOS = {bjj, bjjkids, muaythai, lucha, boxeo, mma};

/* clave de currículo de una disciplina: por sistema (bjj, bjjkids, muaythai) o, en "niveles", por el nombre
   (Lucha, Boxeo, MMA). Sin sistema, solo por el nombre. null si no hay currículo alineado con sus rangos. */
const NOMBRE = [[/kids|infantil|niñ|junior/i, "bjjkids"], [/jiu|bjj/i, "bjj"], [/muay|thai/i, "muaythai"], [/lucha|wrestl/i, "lucha"], [/box/i, "boxeo"], [/mma|mixt/i, "mma"]];
const NIVELES = ["lucha", "boxeo", "mma"];
export function curriculoKey(disc){
  if(!disc) return null;
  const s = disc.sistema || "", k = NOMBRE.find(([re]) => re.test(disc.nombre || ""))?.[1] || null;
  if(s === "niveles") return NIVELES.includes(k) ? k : null;
  if(s) return CURRICULOS[s] && CURRICULOS[s].sistema === s ? s : null;
  return k;
}
/* el rango de un currículo, o null */
export const rangoCurriculo = (key, i) => CURRICULOS[key]?.rangos?.[i] || null;
