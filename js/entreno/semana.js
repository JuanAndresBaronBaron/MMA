/* Técnica de la semana: 52 fichas que rotan las artes, con salud o defensa personal cada 5 semanas.
   {id (estable), arte, mod, drill?: índice, hito?: índice, foco, claves: [3], clase: idea para la clase, pregunta, reto}.
   El profesor puede fijar una con academia.tds = {semana: 'YYYY-Www', id}. Los ids no se renumeran. */
const T = (id, arte, mod, ref, foco, claves, clase, pregunta, reto) => ({id, arte, mod, ...ref, foco, claves, clase, pregunta, reto});

const LISTA = [
 T("tds-bjj-01", "bjj", "fundamentos-1", {drill: 0}, "Escape de cadera", ["Termina de lado", "Mueve la cadera, no los hombros", "Marcos con los antebrazos"],
   "Calentamiento con escapes de cadera de punta a punta y sparring de posición desde cien kilos.", "¿Por qué terminamos de lado y no planos?", "Haz 5 largos de escape de cadera cada día de la semana."),
 T("tds-mt-01", "muaythai", "fundamentos-1", {drill: 0}, "Postura tailandesa", ["Peso atrás", "Guardia alta", "Rodilla delantera libre"],
   "Sombra con postura y teeps, luego pads lentos.", "¿Qué pierna carga el peso y por qué?", "3 rounds de sombra diarios cuidando la postura."),
 T("tds-lu-01", "lucha", "fundamentos-1", {drill: 4}, "Postura y desplazamiento", ["Cadera baja", "Cabeza arriba", "Pies nunca juntos"],
   "Desplazamientos en postura en espejo y cambios de nivel en parejas.", "¿Qué pasa si juntas los pies?", "50 cambios de nivel al día."),
 T("tds-bx-01", "boxeo", "fund-1", {drill: 0}, "La guardia", ["Mentón abajo", "Codos cerrados", "Peso repartido"],
   "Sombra frente al espejo y trabajo de guardia con compañero.", "¿Qué protegen los codos cerrados?", "Sombra diaria de 3 rounds revisando la guardia."),
 T("tds-sa-01", "salud", "movilidad", {drill: 0}, "Movilidad articular", ["Lento", "Sin dolor", "Respira"],
   "Diez minutos de movilidad al inicio de cada clase de la semana.", "¿Qué articulación sientes más rígida?", "Movilidad 5 días esta semana."),
 T("tds-mma-01", "mma", "striking-1", {drill: 0}, "Guardia de MMA", ["Postura más alta que en lucha", "Manos listas para agarrar", "Cadera lista para el sprawl"],
   "Sombra de MMA y sprawl ante la finta de derribo.", "¿En qué se diferencia de la guardia de boxeo?", "3 rounds de sombra de MMA al día."),
 T("tds-bjj-02", "bjj", "fundamentos-1", {drill: 1}, "Puente (upa)", ["Talones cerca del glúteo", "Puente en diagonal", "Mira al hombro"],
   "Escape de la montada con upa en parejas y sparring de posición desde la montada.", "¿Hacia dónde va el puente y por qué?", "3 series de 10 puentes por lado cada día."),
 T("tds-mt-02", "muaythai", "clinch-1", {drill: 1}, "Swimming en el clinch", ["Manos por dentro", "Codos juntos", "Cadera adelante"],
   "Swimming en cooperación y luego con resistencia suave.", "¿Quién gana la posición interior?", "Practica la postura de clinch frente al espejo cada día."),
 T("tds-lu-02", "lucha", "fundamentos-2", {drill: 0}, "Pelea de manos", ["Controla la muñeca", "Cabeza en contacto", "Muévete al agarrar"],
   "Pelea de manos con objetivo y entradas al terminar.", "¿Qué agarre te deja atacar primero?", "5 minutos de pelea de manos en cada clase."),
 T("tds-de-01", "defensa", "defensa-1", {drill: 0}, "Prevención y voz", ["Manos abiertas arriba", "Distancia", "Voz firme"],
   "Escenarios de conversación tensa y salida.", "¿Cuándo es mejor irse?", "Identifica las salidas de cada lugar al que entres."),
 T("tds-bx-02", "boxeo", "fund-3", {drill: 1}, "La parada del jab", ["Movimiento corto", "Desvía, no atrapes", "Responde con el jab"],
   "Parada del jab con compañero y respuesta inmediata.", "¿Por qué la parada es la defensa más económica?", "Sombra con parada y respuesta cada día."),
 T("tds-mma-02", "mma", "jaula-1", {drill: 2}, "Ganchos por debajo en la reja", ["Ganchos por debajo", "Cadera lejos", "Cabeza arriba"],
   "Pummeling contra la reja y levantadas con la espalda en la pared.", "¿Cómo te levantas cuando te tienen en la reja?", "Practica la levantada en la pared cada día."),
 T("tds-bjj-03", "bjj", "guardias-1", {drill: 0}, "Romper la postura en guardia cerrada", ["Rodillas al pecho", "Controla las mangas o las muñecas", "Ángulo con la cadera"],
   "Ruptura de postura y control de mangas, luego sparring de guardia cerrada.", "¿Qué hace el de arriba para no perder la postura?", "Repite 20 rupturas de postura por clase."),
 T("tds-mt-03", "muaythai", "fundamentos-1", {drill: 1}, "La patada circular", ["Gira el pie de apoyo", "La cadera atraviesa", "Golpea con la tibia"],
   "Patada circular por fases y luego al saco.", "¿Por qué gira el pie de apoyo?", "30 patadas lentas por lado cada día."),
 T("tds-sa-02", "salud", "piel", {drill: 0}, "Piel sana en el tatami", ["Ducha apenas terminas", "Kimono lavado en cada uso", "Lesión sospechosa: se muestra"],
   "Charla de 5 minutos sobre tiña y herpes, y limpieza del tapiz en equipo.", "¿Qué haces si ves un anillo rojo en tu piel?", "Revisa tu piel antes de cada clase."),
 T("tds-lu-03", "lucha", "fundamentos-2", {drill: 2}, "Double leg", ["Cambio de nivel", "Paso profundo", "Cabeza al costado"],
   "Blast double en sombra y con compañero.", "¿Dónde va tu cabeza en el double leg?", "20 penetraciones en sombra al día."),
 T("tds-bx-03", "boxeo", "fund-2", {drill: 1}, "Combinaciones básicas", ["Alterna manos", "Alterna niveles", "Sal con un paso"],
   "Las cinco combinaciones en sombra y luego manoplas cantadas.", "¿Por qué se alterna izquierda y derecha?", "Las cinco combinaciones 10 veces cada día."),
 T("tds-mma-03", "mma", "striking-1", {drill: 1}, "Golpea y sal", ["Combinación corta", "Sal en ángulo", "Lista para el sprawl"],
   "Golpe y sal en sombra y con compañero que intenta derribar.", "¿Por qué quedarse quieto es peligroso en MMA?", "3 rounds de golpe y sal en sombra."),
 T("tds-bjj-04", "bjj", "sumisiones-1", {drill: 1}, "Mataleón", ["Pelea de manos primero", "Codo bajo el mentón", "Ganchos puestos"],
   "Mataleón con pelea de manos desde la espalda.", "¿Qué hace la mano que no estrangula?", "Repite 15 mataleones por lado con un compañero."),
 T("tds-de-02", "defensa", "defensa-2", {drill: 1}, "Levantarse del suelo", ["Mano protege la cara", "Te levantas hacia atrás", "Quedas en guardia"],
   "Levantada técnica a ambos lados y patada de distancia desde el suelo.", "¿Por qué no te levantas hacia adelante?", "8 levantadas por lado cada día."),
 T("tds-mt-04", "muaythai", "fundamentos-2", {drill: 2}, "Chequeo de patada", ["Rodilla arriba y afuera", "Tibia vertical", "Devuelve enseguida"],
   "Chequeo a la señal con compañero.", "¿Con qué parte de la pierna recibes la patada?", "20 chequeos por lado en sombra cada día."),
 T("tds-lu-04", "lucha", "fundamentos-1", {drill: 5}, "Sprawl reactivo", ["Cadera abajo", "Piernas atrás", "Manos a la cabeza o los hombros"],
   "Sprawl a la señal y a la entrada real del compañero.", "¿Por qué la cadera es lo primero que baja?", "30 sprawls al día."),
 T("tds-bx-04", "boxeo", "fund-3", {drill: 2}, "Esquiva y rodada", ["Esquiva los rectos", "Rueda bajo los ganchos", "Ojos al frente"],
   "Cuerda de esquivas y sombra defensiva.", "¿Cuándo esquivas y cuándo ruedas?", "2 rondas diarias bajo la cuerda."),
 T("tds-mma-04", "mma", "jaula-1", {drill: 3}, "Wall walk", ["Espalda en la reja", "Ganchos por debajo", "Sube con las piernas"],
   "Wall walk desde sentado y levantadas contra un compañero que presiona.", "¿Qué haces con las manos mientras subes?", "10 wall walks al día contra una pared."),
 T("tds-sa-03", "salud", "conmocion", {drill: 0}, "Conmoción cerebral", ["Ante la duda, fuera", "Nunca vuelvas el mismo día", "Regreso por pasos"],
   "Repasar en grupo la herramienta CRT6 y el plan de la academia para un golpe en la cabeza.", "¿Hace falta desmayarse para tener una conmoción?", "Aprende de memoria las señales de alarma."),
 T("tds-bjj-05", "bjj", "fundamentos-2", {drill: 0}, "Escape de la montada", ["Upa primero", "Codo a la rodilla", "Recupera la guardia"],
   "Cadena upa y codo-rodilla con compañero, luego sparring desde la montada.", "¿Cuándo usas el upa y cuándo el codo-rodilla?", "Haz 10 escapes de cada uno por clase."),
 T("tds-mt-05", "muaythai", "clinch-2", {drill: 0}, "Rodillas en el clinch", ["Cadera adelante", "Postura erguida", "Jala la cabeza hacia la rodilla"],
   "Rodillas rectas y curvas al saco y clinch de posición controlado.", "¿Por qué se empuja la cadera adelante?", "50 rodillas al saco cada día."),
 T("tds-lu-05", "lucha", "cadenas-2", {drill: 3}, "Ankle pick", ["Mueve la cabeza del rival", "Paso en ángulo", "Atrapa el tobillo"],
   "Ankle pick reactivo cuando el compañero da un paso.", "¿Hacia dónde empujas la cabeza?", "Practica la entrada 20 veces por clase."),
 T("tds-bx-05", "boxeo", "fund-4", {drill: 0}, "Combinación y pivote", ["Golpea", "Pivota sobre la punta", "Termina en guardia"],
   "Combinación y pivote en sombra y en manoplas.", "¿Qué ganas al pivotar después de golpear?", "Termina todas tus combinaciones con un pivote esta semana."),
 T("tds-de-03", "defensa", "defensa-3", {drill: 0}, "Agarre de muñeca", ["Sal por el pulgar", "Todo el cuerpo", "Termina con distancia"],
   "Escapes de agarre de muñeca con una y dos manos.", "¿Por qué el pulgar es el punto débil?", "Practica el escape 10 veces por lado con alguien de casa."),
 T("tds-mma-05", "mma", "striking-2", {drill: 0}, "Chequear el calf kick", ["Levanta la rodilla o gira el pie", "No te quedes plano", "Devuelve"],
   "Chequeo de calf kick con espinilleras y contragolpe.", "¿Por qué el calf kick es difícil de chequear?", "Sombra con chequeos 3 rounds al día."),
 T("tds-bjj-06", "bjj", "guardias-2", {drill: 4}, "Retención de guardia", ["Marcos primero", "Gira la cadera", "Recupera las piernas"],
   "Retención de guardia con objetivo contra un pasador.", "¿Qué haces cuando el pasador llega a tu cadera?", "5 minutos de retención en cada clase."),
 T("tds-mt-06", "muaythai", "avanzado-2", {drill: 0}, "El teep", ["Mide la distancia", "Corta el avance", "Finta para entrar"],
   "Teep para medir, cortar y fintar en parejas.", "¿Cuándo usas el teep para cortar al rival?", "50 teeps al saco esta semana."),
 T("tds-lu-06", "lucha", "suelo-1", {drill: 2}, "Stand-up desde abajo", ["Controla las manos", "Cadera lejos", "Sal de frente"],
   "Stand-up técnico con compañero y lives cortos desde abajo.", "¿Qué controlas antes de levantarte?", "Practica sit-out y hip heist cada día."),
 T("tds-sa-04", "salud", "prehab", {drill: 2}, "Hombros fuertes", ["Codo pegado", "Movimiento lento", "Progresión semanal"],
   "Cinco minutos de prehabilitación de hombros al final de la clase.", "¿Qué movimientos de tu arte cargan más el hombro?", "Haz la rutina de banda elástica 3 veces esta semana."),
 T("tds-bx-06", "boxeo", "fund-2", {drill: 0}, "El recto", ["Gira el pie de atrás", "Hombro esconde el mentón", "La otra mano en la cara"],
   "Recto en sombra con giro de pie, luego manoplas.", "¿De dónde nace la fuerza del recto?", "50 rectos lentos por día frente al espejo."),
 T("tds-mma-06", "mma", "jaula-2", {drill: 2}, "Ground and pound con postura", ["Postura arriba", "Controla las muñecas", "Golpes cortos"],
   "Ground and pound con pads desde guardia y media guardia.", "¿Por qué la postura va antes que el golpe?", "3 rounds de ground and pound con pads."),
 T("tds-bjj-07", "bjj", "sumisiones-1", {drill: 3}, "Kimura y americana", ["Figura cuatro", "Codo pegado al cuerpo del rival", "Gira despacio"],
   "Kimura y americana desde el control lateral.", "¿En qué se diferencian la kimura y la americana?", "10 de cada una por lado en la clase."),
 T("tds-mt-07", "muaythai", "fundamentos-3", {drill: 0}, "Atrapar la patada", ["Brazo por debajo", "Paso atrás", "Contraataca"],
   "Atrapar la patada en cooperación y contraatacar.", "¿Qué haces apenas atrapas la pierna?", "Practica 20 atrapadas por lado."),
 T("tds-lu-07", "lucha", "fundamentos-2", {drill: 4}, "Snap down", ["Jala hacia abajo", "Muévete al lado", "Llega a la espalda"],
   "Snap down a go-behind con compañero.", "¿Qué postura del rival invita al snap down?", "15 snap downs por clase."),
 T("tds-de-04", "defensa", "defensa-4", {drill: 0}, "Legítima defensa en Colombia", ["Agresión actual o inminente", "Defensa necesaria", "Proporcionada"],
   "Discusión de casos en grupo sobre los cinco requisitos.", "¿Por qué perseguir al agresor que huye ya no es defensa?", "Explica los cinco requisitos a alguien de tu casa."),
 T("tds-bx-07", "boxeo", "pies", {drill: 2}, "Pivotes con cono", ["Punta del pie", "Guardia arriba", "Ángulo pequeño"],
   "Pivotes alrededor de un cono y salida de las cuerdas.", "¿Por qué el pivote es sobre la punta y no el talón?", "3 rondas de pivotes al día."),
 T("tds-mma-07", "mma", "striking-3", {drill: 1}, "Finta y derribo", ["Finta el recto", "Cambio de nivel", "Doble pierna"],
   "Finta de recto y derribo a dos piernas.", "¿Qué reacción del rival buscas con la finta?", "20 fintas con cambio de nivel en sombra."),
 T("tds-bjj-08", "bjj", "guardias-2", {drill: 3}, "Toreando contra knee cut", ["Controla las rodillas", "Muévete al lado", "Cambia de pase según la reacción"],
   "Pase reactivo: toreando y knee cut en parejas.", "¿Qué te dice la reacción del rival sobre qué pase usar?", "Pasa la guardia 10 veces por clase con cada pase."),
 T("tds-mt-08", "muaythai", "clinch-2", {drill: 1}, "Defensa del plum", ["Mano a la cara del rival", "Postura erguida", "Sal en ángulo"],
   "Defensa del plum: romper y salir.", "¿Por qué la postura erguida te salva en el clinch?", "Practica la ruptura del plum en cada clase."),
 T("tds-sa-05", "salud", "recuperacion", {drill: 0}, "Dormir para mejorar", ["Hora fija", "Pantallas fuera", "Siete horas o más"],
   "Charla corta sobre sueño y carga semanal; revisar el RPE de la semana en el registro.", "¿Cuántas horas dormiste la noche antes de tu peor entreno?", "Acuéstate a la misma hora los siete días."),
 T("tds-lu-08", "lucha", "cadenas-2", {drill: 6}, "Gut wrench", ["Manos cerradas en la cintura", "Cadera pegada", "Gira hacia tu lado fuerte"],
   "Par terre: gut wrench y leg lace.", "¿Por qué la cadera tiene que estar pegada?", "Haz 10 giros por clase."),
 T("tds-bx-08", "boxeo", "defensa", {drill: 3}, "Atrapar y disparar", ["Guante pegado a la cara", "Atrapa", "Responde 1-2"],
   "Catch and shoot en manoplas y con compañero.", "¿Cuánto tiempo tienes para responder?", "Sombra con atrapar y disparar cada día."),
 T("tds-mma-08", "mma", "jaula-3", {drill: 4}, "Scrambles", ["Nunca te quedes plano", "Busca la espalda o levántate", "Protege el cuello"],
   "Scrambles desde tortuga y media guardia.", "¿Cuál es tu prioridad en un scramble?", "3 rounds de scrambles en la clase."),
 T("tds-bjj-09", "bjj", "sumisiones-2", {drill: 3}, "Escapar antes de la sumisión", ["Defiende en la posición previa", "Protege cuello y brazos", "Mueve la cadera"],
   "Escapes de sumisión desde la posición previa.", "¿En qué momento es más fácil escapar de una llave?", "Pide a tu compañero que te ataque despacio 10 veces."),
 T("tds-de-05", "defensa", "defensa-3", {drill: 1}, "Abrazo por detrás", ["Baja la cadera", "Protege el cuello", "Gira o sal"],
   "Abrazo por detrás y giro, despacio y con control.", "¿Por qué bajar la cadera te hace más pesado?", "Practica el giro 10 veces por lado."),
 T("tds-mt-09", "muaythai", "avanzado-1", {drill: 0}, "Escalera puño-patada", ["Termina con patada al lado contrario", "Guardia al volver", "Ritmo constante"],
   "Escalera puño-patada en pads y sombra.", "¿Por qué la patada va al lado contrario del último golpe?", "3 rounds de escalera puño-patada al día."),
];
/* orden de la rotación: un complemento (salud o defensa) cada 5 semanas y las artes en el orden de LISTA */
const COMP = ["salud", "defensa"];
export const TDS = (() => {
  const comp = LISTA.filter(x => COMP.includes(x.arte)), artes = LISTA.filter(x => !COMP.includes(x.arte)), out = [];
  while(comp.length || artes.length) out.push((out.length % 5 === 4 && comp.length) || !artes.length ? comp.shift() : artes.shift());
  return out;
})();

/* semana ISO 'YYYY-Www' (y año ISO) */
function iso(date){
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dia = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - dia);
  const y = d.getUTCFullYear(), w = Math.ceil(((d - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return {y, w};
}
const fecha = f => f instanceof Date ? f : new Date(String(f).length === 10 ? f + "T12:00" : f);
export const isoWeek = (date = new Date()) => { const {y, w} = iso(fecha(date)); return `${y}-W${String(w).padStart(2, "0")}`; };
export const tdsPorId = id => TDS.find(x => x.id === id) || null;
/* la técnica de la semana: la fijada por el profesor (si es de esta semana) o la que toca en la rotación */
/* artes con que se elige la técnica de la semana: las de la rutina que estén disponibles (null = todas). La tarjeta
   y el logro «tds» usan esto para que sea la misma ficha */
export function artesTds(rutina, disponibles = []){
  const p = (rutina?.artes || []).filter(a => disponibles.includes(a));
  return p.length ? p : null;
}
export function tdsActual({fecha: f = new Date(), artes = null, pin = null} = {}){
  const d = fecha(f);
  if(pin && pin.semana === isoWeek(d)){ const p = tdsPorId(pin.id); if(p) return p; }
  const lista = artes?.length ? TDS.filter(x => artes.includes(x.arte)) : TDS;
  if(!lista.length) return null;
  const {y, w} = iso(d);
  return lista[(y * 53 + w) % lista.length];
}
