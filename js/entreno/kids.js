/* Clases para niños: guía para el profesor por edades (4 a 6, 7 a 10 y 11 a 15 años).
   Juegos con objetivo técnico, seguridad y manejo del grupo. Enlaces verificados antes de agregarlos.
   Ids estables: no reordenar drills, recursos ni hitos. */
const R = (titulo, url, plataforma, autor, idioma, nivel, por_que) => ({titulo, url, plataforma, autor, idioma, nivel, por_que});
const D = (nombre, como, dosis, min, solo = false, tipo = "tecnica", nivel = "basico") => ({nombre, como, dosis, nivel, min, solo, tipo});
const C = (titulo, explicacion, puntos, errores) => ({titulo, explicacion, puntos, errores});

const V = {
  hcEs: R("Artes marciales para niños: guía para los padres", "https://www.healthychildren.org/Spanish/healthy-living/sports/Paginas/martial-arts.aspx", "articulo", "HealthyChildren.org (Academia Americana de Pediatría)", "es", "basico",
    "Recomendaciones de los pediatras: primero habilidades sin contacto, buena supervisión y equipo limpio."),
  hcEn: R("Martial Arts for Kids: A Parent's Guide", "https://www.healthychildren.org/English/healthy-living/sports/Pages/Martial-Arts.aspx", "articulo", "HealthyChildren.org (Academia Americana de Pediatría)", "en", "basico",
    "Versión en inglés, actualizada en 2025, con beneficios, riesgos y por qué el contacto llega después."),
  oms: R("Actividad física", "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity", "articulo", "Organización Mundial de la Salud", "es", "basico",
    "Cuánta actividad física necesitan niños y adultos según la OMS."),
  tina: R("Infecciones por tiña (tiña, pie de atleta, tiña inguinal)", "https://www.healthychildren.org/Spanish/health-issues/conditions/skin/Paginas/Tinea-Infections-Ringworm-Athletes-Foot-Jock-Itch.aspx", "articulo", "HealthyChildren.org (Academia Americana de Pediatría)", "es", "basico",
    "Para explicar a padres y niños cómo prevenir la tiña en el tatami."),
  bullying: R("Hostigamiento (bullying): generalidades", "https://espanol.nichd.nih.gov/salud/temas/bullying", "articulo", "NICHD (Institutos Nacionales de la Salud de EE. UU.)", "es", "basico",
    "Qué es el acoso escolar, sus formas y cómo pueden ayudar los adultos."),
  cdc: R("Returning to Sports (HEADS UP)", "https://cdc.gov/heads-up/guidelines/returning-to-sports.html", "articulo", "CDC HEADS UP", "en", "basico",
    "El regreso gradual al deporte después de una conmoción, pensado también para jóvenes."),
  teen: R("Entrenamiento de fuerza (para adolescentes)", "https://kidshealth.org/NAPNAP/es/teens/strength-training.html", "articulo", "KidsHealth (NAPNAP)", "es", "basico",
    "Fuerza segura en la adolescencia: técnica, supervisión y descanso."),
};

export const INTRO = {
 titulo: "Clases para niños: enseñar jugando y con seguridad",
 sub: "Una guía para el profesor por grupos de edad. Cada clase tiene calentamiento con juego, una técnica, un juego que la aplica y un cierre con un valor. Los niños aprenden más cuando se divierten y se sienten seguros.",
 reglas: [
  {t: "Seguridad primero", d: "Primero caídas, rendirse y respeto al compañero. El contacto y el sparring llegan después, por etapas y siempre supervisados. Los pediatras no recomiendan las MMA de competencia para niños."},
  {t: "Juego con objetivo", d: "Cada juego entrena algo: equilibrio, caídas, agarres, postura o reacción. Explica en una frase qué se aprende con él."},
  {t: "Pocas palabras, mucha acción", d: "Explicaciones de menos de un minuto, demostración y a moverse. Con los más pequeños, una sola instrucción a la vez."},
 ],
};
export const PLAN = [
 {fase: "Estructura de clase", semanas: "Cada clase", foco: "45 a 60 minutos con la misma estructura.", puntos: ["Saludo y reglas (3 min).", "Calentamiento con juego (10 min).", "Técnica del día (15 min).", "Juego que aplica la técnica (15 min).", "Cierre con un valor y saludo (5 min)."]},
];

export const MODULOS = [
 {
  id: "kids-1", nivel: "basico", corto: "4 a 6 años",
  titulo: "Kids 1: juegos de movimiento, caídas y reglas (4 a 6 años)",
  sub: "Coordinación, caídas seguras, escuchar al profesor y respetar al compañero.",
  resumen: "A esta edad el objetivo no es la técnica de competencia sino el movimiento: rodar, caer, gatear, equilibrarse, empujar y jalar jugando. La atención dura pocos minutos, así que se cambia de actividad seguido y se usan imágenes de animales y personajes.",
  conceptos: [
   C("Cómo aprende un niño de 4 a 6 años", "Aprende imitando y jugando. Necesita instrucciones de una sola acción, demostraciones claras y cambios de actividad cada 5 a 8 minutos. Los nombres de animales (oso, cangrejo, cocodrilo) ayudan a recordar movimientos.",
    ["Una instrucción a la vez.", "Demuestra antes de explicar.", "Felicita el esfuerzo, no solo el resultado."],
    ["Explicaciones largas con todos sentados.", "Corregir a todos al mismo tiempo."]),
   C("Caídas y rendirse", "Lo primero es caer bien: mentón al pecho y palmada al tapiz, empezando sentado y luego desde cuclillas. También aprenden a rendirse con dos palmadas o diciendo \"para\", y que el compañero suelta de inmediato.",
    ["Mentón al pecho siempre.", "Dos palmadas o decir \"para\" y el otro suelta.", "Caídas desde sentado antes que de pie."],
    ["Hacer caídas de pie sin progresión.", "Juegos de agarre sin enseñar a rendirse."]),
   C("Reglas y valores", "Pocas reglas, siempre las mismas: escuchar al profesor, cuidar al compañero, no salir del tapiz sin permiso y saludar al empezar y al terminar. Cada clase cierra con un valor en una frase: respeto, paciencia, valentía, amistad.",
    ["Tres o cuatro reglas que se repiten en cada clase.", "Un valor por semana.", "Saludo al inicio y al final."],
    ["Castigar con ejercicio físico.", "Comparar a los niños entre ellos."]),
  ],
  drills: [
   D("Juego de los animales", "Los niños cruzan el tapiz como oso (manos y pies), cangrejo (boca arriba), cocodrilo (arrastrándose) y conejo (saltos). El profesor cambia de animal con una palmada.", "8 minutos", 8),
   D("Caídas desde sentado con canción", "Sentados, ruedan hacia atrás con el mentón al pecho y palmean el tapiz al ritmo de una cuenta o canción corta. Luego desde cuclillas.", "6 minutos", 6),
   D("Las tortugas", "Un niño en cuatro apoyos (la tortuga) y otro intenta darlo vuelta empujando suave. La tortuga baja la cadera y abre la base. Cambian de rol.", "5 rondas de 30 s con 30 s de descanso", 7),
   D("Estatuas de equilibrio", "Con música, los niños se mueven por el tapiz; cuando para, quedan en un pie o en guardia sin moverse. El que se cae hace una rodada y vuelve a jugar.", "6 minutos", 6),
   D("Cierre con un valor", "Sentados en círculo, el profesor dice el valor de la semana en una frase y pregunta a dos niños cuándo lo usaron. Saludo final.", "5 minutos", 5, false, "estudio"),
  ],
  recursos: [V.hcEs, V.oms, V.tina],
  hitos: [
   "Los niños caen hacia atrás con el mentón al pecho y palmean el tapiz.",
   "Saben rendirse con dos palmadas o diciendo \"para\" y sueltan cuando el otro se rinde.",
   "La clase tiene siempre la misma estructura y las mismas reglas.",
   "Cada actividad dura menos de 8 minutos y todos están en movimiento.",
  ],
 },
 {
  id: "kids-2", nivel: "intermedio", corto: "7 a 10 años",
  titulo: "Kids 2: técnica básica con juegos y primeros combates (7 a 10 años)",
  sub: "Posiciones, agarres y golpes a manoplas a través de juegos con reglas, y cómo hablar del acoso escolar.",
  resumen: "A esta edad pueden aprender técnicas reales si vienen dentro de un juego con reglas claras. Se introducen las posiciones básicas, el control y los primeros combates de posición muy controlados. También es la edad para hablar de acoso escolar y de cómo pedir ayuda.",
  conceptos: [
   C("Técnica dentro del juego", "Enseña la técnica en su forma básica y luego un juego que obligue a usarla: por ejemplo, la montada y después \"quédate arriba 20 segundos\". El juego da la repetición sin que parezca repetición.",
    ["Técnica, juego, técnica corregida, juego.", "Reglas simples con un ganador claro.", "Parejas de tamaño y edad parecidos."],
    ["Enseñar técnicas sueltas sin aplicarlas.", "Emparejar niños de pesos muy distintos."]),
   C("Contacto por etapas", "El contacto llega por pasos: primero sin contacto (sombra, manoplas, formas), luego combates de posición con objetivo limitado y, más adelante, combates más libres. En golpeo, los niños no hacen sparring a la cabeza con potencia; en grappling no hay llaves de cuello ni de piernas peligrosas.",
    ["Combates de posición de 30 a 60 segundos.", "Siempre un adulto mirando cada pareja.", "Protector bucal en cualquier trabajo de golpeo con contacto."],
    ["Combates libres sin supervisión.", "Permitir que un niño siga después de un golpe en la cabeza."]),
   C("Acoso escolar y confianza", "Las artes marciales ayudan a la confianza, pero la primera respuesta al acoso es hablar con un adulto, alejarse y usar la voz. La técnica física es el último recurso y solo para protegerse. Enséñalo con juegos de rol cortos.",
    ["Voz firme: \"para, no me gusta\".", "Alejarse y contarle a un adulto.", "La técnica es para protegerse, nunca para atacar."],
    ["Enseñar que la solución es pelear.", "Ignorar a un niño que cuenta que lo molestan."]),
  ],
  drills: [
   D("Rey de la montada", "Un niño empieza en la montada y el otro intenta escapar con el puente. Gana el de arriba si se mantiene 20 segundos. Cambian de rol.", "6 rondas de 20 s con 40 s de descanso", 7),
   D("Toca la rodilla", "De pie y en guardia, cada niño intenta tocar la rodilla del otro sin que le toquen la suya. Entrena postura, cambio de nivel y distancia.", "5 rondas de 30 s con 30 s de descanso", 7),
   D("Manoplas con números", "El profesor o un compañero canta 1 y 2 y el niño golpea las manoplas con jab y recto, volviendo a guardia. Se suma el 3 cuando sale limpio.", "4 rondas de 1 minuto con 30 s de descanso", 7),
   D("Juego de rol de acoso", "En parejas, uno hace de compañero que molesta (solo con palabras, sin tocar) y el otro practica la voz firme, alejarse y buscar a un adulto. El profesor da la señal de inicio y fin.", "8 minutos", 8, false, "estudio"),
   D("Combate de posición desde rodillas", "De rodillas, cada niño intenta llevar al otro de espaldas al tapiz con control. Sin agarres al cuello. Se para a la primera señal del profesor.", "5 rondas de 45 s con 45 s de descanso", 9, false, "vivo"),
  ],
  recursos: [V.hcEn, V.bullying, V.oms],
  hitos: [
   "Los niños hacen combates de posición con objetivo y respetan la señal de parar.",
   "Cada técnica nueva viene con un juego que la aplica.",
   "Los niños saben qué hacer ante el acoso: voz firme, alejarse y avisar a un adulto.",
   "Las parejas son de tamaño y edad parecidos y siempre hay un adulto mirando.",
  ],
 },
 {
  id: "kids-3", nivel: "avanzado", corto: "11 a 15 años",
  titulo: "Kids 3: adolescentes, técnica completa, fuerza segura y competencia (11 a 15 años)",
  sub: "Más técnica y más contacto con control, fuerza con buena forma y una competencia sana.",
  resumen: "Los adolescentes pueden seguir clases cercanas a las de adultos, con más técnica, combates más libres y competencia, pero con cuidados propios de la edad: crecimiento, conmociones, peso y presión. El profesor sigue siendo responsable del clima del grupo.",
  conceptos: [
   C("Contacto controlado y conmociones", "El sparring y la rodada se hacen con compañeros de nivel y tamaño parecidos y potencia controlada. Ante cualquier golpe en la cabeza con síntomas, el adolescente para ese día y vuelve solo con autorización médica y siguiendo los pasos de regreso, que en jóvenes son más lentos.",
    ["Potencia acordada y respetada.", "Golpe en la cabeza con síntomas: fuera ese día.", "El regreso sigue pasos de al menos 24 horas."],
    ["Sparring fuerte frecuente.", "Dejar que vuelva \"porque se siente bien\"."]),
   C("Fuerza y crecimiento", "El entrenamiento de fuerza es seguro en adolescentes si se aprende la técnica primero, con supervisión, cargas progresivas y descanso entre sesiones. Durante los estirones de crecimiento algunas zonas (rodillas, talones) molestan más: se ajusta la carga, no se ignora.",
    ["Técnica con peso corporal antes que con pesas.", "Dos o tres sesiones cortas por semana.", "Molestia en rodillas o talones: avisar y ajustar."],
    ["Cargas máximas sin supervisión.", "Suplementos o sustancias para crecer más rápido."]),
   C("Competencia sana", "La competencia enseña a manejar nervios, ganar y perder. Se compite en categorías de edad y peso, sin cortes de peso, y se celebra el esfuerzo y lo aprendido. Después de cada torneo se revisa qué salió bien y qué entrenar.",
    ["Sin cortes de peso en menores.", "Revisión después de cada torneo.", "El objetivo es aprender, no solo ganar medallas."],
    ["Presión excesiva de padres o profesores.", "Retirar el saludo o el respeto al perder."]),
  ],
  drills: [
   D("Rodada o sparring técnico con tema", "Rondas con un objetivo (solo pasar guardia, solo jab y defensa) al 50 % de potencia y con parejas de tamaño parecido. El profesor puede parar cualquier pareja.", "4 rondas de 2 minutos con 1 minuto de descanso", 13, false, "vivo", "avanzado"),
   D("Circuito de fuerza con peso corporal", "10 sentadillas, 8 flexiones, 10 zancadas y 30 segundos de plancha, con la forma revisada por el profesor.", "3 rondas de 3 minutos con 1 minuto de descanso", 11, true, "fisico", "avanzado"),
   D("Simulacro de torneo", "Combates de reglas reducidas con árbitro (otro alumno avanzado), saludo y tiempo real, para practicar los nervios del día de competencia.", "4 rondas de 2 minutos con 1 minuto de descanso", 13, false, "vivo", "avanzado"),
   D("Diario de aprendizaje", "Al final de la semana cada adolescente escribe una técnica que aprendió, algo que le salió mal y qué quiere practicar. El profesor lo revisa una vez al mes.", "10 minutos", 10, true, "estudio", "avanzado"),
  ],
  recursos: [V.teen, V.bullying, V.cdc],
  hitos: [
   "Los adolescentes hacen sparring o rodada técnica con potencia controlada.",
   "Conocen la regla de conmoción: fuera ese día y regreso por pasos con autorización.",
   "Entrenan fuerza con buena técnica y supervisión.",
   "Compiten en su categoría sin cortes de peso y revisan cada torneo.",
  ],
 },
];
