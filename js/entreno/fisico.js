/* Preparación física para artes marciales: base, potencia e intervalos, y trabajo específico.
   Las dosis están escritas para el temporizador ("8 rondas de 20 s con 40 s de descanso").
   Enlaces verificados antes de agregarlos. Ids estables: no reordenar drills, recursos ni hitos. */
const R = (titulo, url, plataforma, autor, idioma, nivel, por_que) => ({titulo, url, plataforma, autor, idioma, nivel, por_que});
const D = (nombre, como, dosis, min, solo, nivel = "basico", tipo = "fisico") => ({nombre, como, dosis, nivel, min, solo, tipo});
const C = (titulo, explicacion, puntos, errores) => ({titulo, explicacion, puntos, errores});

const V = {
  mayoFuerza: R("Fortalecimiento muscular: adquirir fuerza, delgadez y salud", "https://mayoclinic.org/es/healthy-lifestyle/fitness/in-depth/strength-training/art-20046670", "articulo", "Mayo Clinic", "es", "basico",
    "Por qué entrenar fuerza, con qué frecuencia y cómo empezar con tu propio peso."),
  oms: R("Actividad física", "https://www.who.int/es/news-room/fact-sheets/detail/physical-activity", "articulo", "Organización Mundial de la Salud", "es", "basico",
    "Las recomendaciones de la OMS: al menos 150 minutos semanales de actividad moderada más fuerza muscular."),
  tristar: R("New to MMA? A quick guide on how to get started! Exercises for MMA conditioning!", "https://www.youtube.com/watch?v=gt0l3jW_Wy4", "youtube", "Tristar Gym", "en", "basico",
    "Ejercicios de acondicionamiento para quien empieza en MMA, del gimnasio de Firas Zahabi."),
  mayoHiit: R("Siete motivos para probar el entrenamiento con descanso", "https://www.mayoclinic.org/es/connected-care/7-reasons-to-try-interval-training/vid-20314214", "web", "Mayo Clinic", "es", "intermedio",
    "Video en español sobre el entrenamiento por intervalos y sus beneficios."),
  cuerda: R("Jump Rope for Beginners Tutorial: Mayweather Training", "https://www.youtube.com/watch?v=3G4eP7Hyc4Y", "youtube", "Rush Athletics TV", "en", "basico",
    "La técnica de cuerda para usarla en intervalos sin tropezar."),
  barras: R("On Pull-Ups & Strength Conditioning for Thai Clinch | Sylvie von Duuglas-Ittu", "https://www.youtube.com/watch?v=eWqiWcx7zuc", "youtube", "Sylvie von Duuglas-Ittu", "en", "avanzado",
    "Fuerza de tracción y de agarre aplicada al clinch tailandés."),
  princeton: R("CONDITIONING WORKOUT WITH PRINCETON WRESTLING #training", "https://www.youtube.com/watch?v=59R1VNBjxzA", "youtube", "Princeton Wrestling", "en", "avanzado",
    "Un acondicionamiento real de lucha universitaria para copiar la estructura."),
  bjjee: R("Stay Injury-Free In BJJ With These Prehab & Injury Prevention Exercises", "https://www.bjjee.com/strength-conditioning/stay-injury-free-in-bjj-with-these-prehab-injury-prevention-exercises/", "articulo", "BJJEE", "en", "basico",
    "Ejercicios de control y prehabilitación que acompañan al trabajo de fuerza."),
  teen: R("Entrenamiento de fuerza (para adolescentes)", "https://kidshealth.org/NAPNAP/es/teens/strength-training.html", "articulo", "KidsHealth (NAPNAP)", "es", "basico",
    "Fuerza segura para adolescentes: técnica antes que peso, supervisión y descanso."),
};

export const INTRO = {
 titulo: "Preparación física para artes marciales",
 sub: "Tres bloques: base de fuerza y resistencia, potencia e intervalos con el ritmo de los rounds, y trabajo específico de agarre, cuello y clinch. Todo con tu peso o material sencillo y con el temporizador de la app.",
 reglas: [
  {t: "La técnica va primero", d: "La preparación física complementa la academia, no la reemplaza. Si tienes poco tiempo, prioriza la clase."},
  {t: "Dos o tres sesiones por semana", d: "Fuerza dos veces por semana e intervalos una o dos, en días distintos a los de sparring fuerte cuando sea posible."},
  {t: "Forma antes que carga", d: "Cada ejercicio se hace con buena postura. Si la forma se rompe, para la serie."},
 ],
};
export const PLAN = [
 {fase: "Base", semanas: "Semanas 1–6", foco: "Fuerza con peso corporal y resistencia aeróbica.", puntos: ["Circuito de fuerza dos veces por semana.", "Trote o bicicleta suave de 20 a 30 minutos una o dos veces."]},
 {fase: "Potencia e intervalos", semanas: "Semanas 7–12", foco: "Intervalos con el ritmo de los rounds y potencia.", puntos: ["Intervalos de 20 a 40 segundos una o dos veces por semana.", "Mantén una sesión de fuerza."]},
 {fase: "Específico", semanas: "Semanas 13 en adelante", foco: "Agarre, cuello, clinch y simulación de pelea.", puntos: ["Elige los ejercicios de tu arte y ajusta el volumen antes de competir."]},
];

export const MODULOS = [
 {
  id: "fisico-1", nivel: "basico", corto: "Base",
  titulo: "Base física: fuerza general y resistencia aeróbica",
  sub: "Seis semanas para tener un cuerpo que aguante las clases y se lesione menos.",
  resumen: "La base física tiene dos partes: fuerza general (empujar, tirar, piernas, tronco) y resistencia aeróbica, que es la que te deja recuperarte entre rounds. Con tu peso corporal y dos o tres sesiones por semana se nota la diferencia en un mes.",
  conceptos: [
   C("Los cinco patrones", "Un buen plan de fuerza cubre sentadilla, bisagra de cadera (peso muerto o puente), empuje (flexiones), tracción (remo o barras) y tronco (planchas). Con esos cinco cubres casi todo lo que usan las artes marciales.",
    ["Un ejercicio por patrón en cada sesión.", "8 a 15 repeticiones con buena forma.", "Sube repeticiones antes que dificultad."],
    ["Entrenar solo pecho y brazos.", "Olvidar la tracción y la espalda."]),
   C("Resistencia aeróbica", "La base aeróbica se construye con trabajo suave y largo: trote, bicicleta, cuerda o sombra a un ritmo en el que puedas hablar. Es la que acelera tu recuperación entre rounds y entre sesiones.",
    ["Ritmo en el que puedas hablar en frases.", "20 a 40 minutos.", "Una o dos veces por semana."],
    ["Hacer todo el cardio a máxima intensidad.", "Saltarse la base y pasar directo a los intervalos."]),
   C("Progresión y descanso", "Cada semana suma un poco: una serie, unas repeticiones o un ejercicio más difícil. Deja al menos un día entre sesiones de fuerza del mismo grupo y no hagas fuerza pesada justo antes del sparring.",
    ["Pequeños aumentos cada semana.", "Anota lo que hiciste para superarlo.", "Duerme bien los días de fuerza."],
    ["Duplicar el volumen de una semana a otra.", "Entrenar fuerza hasta el fallo todos los días."]),
  ],
  drills: [
   D("Circuito de peso corporal", "10 sentadillas, 10 flexiones (de rodillas si hace falta), 10 puentes de glúteo, 10 remos invertidos bajo una mesa firme y 30 segundos de plancha. Descansa 1 minuto entre vueltas.", "4 rondas de 3 minutos con 1 minuto de descanso", 15, true),
   D("Trote o bicicleta suave", "A un ritmo en el que puedas hablar en frases completas. Si no corres, sirve la bicicleta, la cuerda suave o caminar rápido en subida.", "25 minutos", 25, true),
   D("Cuerda continua", "Salto básico con rebote corto y respiración por la nariz, sin parar dentro de la ronda.", "5 rondas de 2 minutos con 1 minuto de descanso", 14, true),
   D("Plancha frontal y lateral", "Plancha frontal 30 segundos, lateral derecha 30 y lateral izquierda 30, con el cuerpo en línea recta.", "3 series de 90 s con 30 s de descanso", 6, true),
  ],
  recursos: [V.mayoFuerza, V.oms, V.tristar, V.teen],
  hitos: [
   "Completo el circuito de peso corporal 4 vueltas con buena forma.",
   "Hago 20 flexiones seguidas (o 20 de rodillas si empecé de cero).",
   "Troto o pedaleo 25 minutos a ritmo de conversación.",
   "Entrené fuerza dos veces por semana durante seis semanas.",
  ],
 },
 {
  id: "fisico-2", nivel: "intermedio", corto: "Intervalos",
  titulo: "Potencia e intervalos con el ritmo de los rounds",
  sub: "Trabajar fuerte, recuperar y repetir: así se pelea.",
  resumen: "Una pelea o una rodada alterna explosiones cortas con momentos de menos esfuerzo. Los intervalos copian esa estructura y la potencia te deja golpear, derribar o escapar más rápido. Usa el temporizador de la app con estas dosis.",
  conceptos: [
   C("Qué es un intervalo", "Un intervalo alterna trabajo intenso con descanso. Los cortos (10 a 20 segundos) entrenan la explosión; los medios (30 a 60 segundos) la capacidad de repetir esfuerzos; los largos (2 a 3 minutos) imitan el round completo.",
    ["Corto y explosivo: descanso largo.", "Medio: descanso igual o el doble del trabajo.", "Largo: igual que un round."],
    ["Hacer intervalos sin calentar.", "Bajar la calidad hasta que ya no es explosivo."]),
   C("Potencia", "La potencia es fuerza aplicada rápido. Saltos, lanzamientos de balón medicinal y sprints cortos la entrenan. Se hace al principio de la sesión, con pocas repeticiones y descanso completo, porque el cansancio la arruina.",
    ["Pocas repeticiones y máxima intención.", "Descanso completo entre series.", "Al inicio de la sesión, después del calentamiento."],
    ["Hacer saltos cansado y aterrizar mal.", "Convertir la potencia en cardio."]),
   C("Cuánto y cuándo", "Una o dos sesiones de intervalos por semana bastan si ya entrenas en la academia. Evita juntarlas con el día de sparring más duro. Si el registro muestra RPE muy alto varios días seguidos, quita una sesión.",
    ["Máximo dos sesiones de intervalos por semana.", "No el mismo día del sparring fuerte.", "Usa el registro para ajustar."],
    ["Intervalos todos los días.", "Sumar intervalos sin quitar nada cuando se acerca una pelea."]),
  ],
  drills: [
   D("Intervalos de saco 20/40", "Golpes rápidos y continuos al saco durante 20 segundos y 40 segundos de sombra suave o caminar.", "8 rondas de 20 s con 40 s de descanso", 7, true, "intermedio"),
   D("Sprawls y levantadas 30/30", "Sprawl, levantada y dos golpes, tantos como puedas en 30 segundos, con 30 segundos de descanso.", "6 rondas de 30 s con 30 s de descanso", 6, true, "intermedio"),
   D("Saltos al cajón o al escalón", "Salta a una superficie firme y estable, aterriza suave y baja caminando. 5 saltos por serie con máxima intención.", "4 series de 30 s con 90 s de descanso", 8, true, "intermedio"),
   D("Rounds de cuerda rápidos", "Ronda completa alternando 30 segundos normales y 30 segundos lo más rápido posible.", "4 rondas de 2 minutos con 1 minuto de descanso", 11, true, "intermedio"),
   D("Simulación de round con compañero", "Con un compañero: 30 segundos de pelea de manos o de manoplas intensas, 30 de presión controlada en la pared y 1 minuto de técnica suave.", "3 rondas de 2 minutos con 1 minuto de descanso", 10, false, "intermedio"),
  ],
  recursos: [V.mayoHiit, V.cuerda, V.tristar],
  hitos: [
   "Completo 8 intervalos de saco 20/40 sin bajar el ritmo en los últimos.",
   "Hago 6 rondas de sprawls 30/30 con buena técnica.",
   "Aterrizo los saltos suave y con las rodillas alineadas.",
   "Hago intervalos una o dos veces por semana sin juntarlos con el sparring fuerte.",
  ],
 },
 {
  id: "fisico-3", nivel: "avanzado", corto: "Específico",
  titulo: "Trabajo específico: agarre, cuello, clinch y preparación para competir",
  sub: "Lo que tu arte pide de más y cómo organizar las semanas antes de una pelea.",
  resumen: "Cada arte carga el cuerpo de forma distinta. El grappling pide agarre y tracción, el Muay Thai cuello y clinch, el boxeo hombros y piernas para los rounds. Este bloque suma ese trabajo específico y te enseña a ajustar el volumen en las semanas antes de competir.",
  conceptos: [
   C("Específico por arte", "Grappling y lucha: agarre, tracción, cadera y cuello. Muay Thai: cuello, tracción para el clinch, tibias y piernas. Boxeo: hombros, tronco rotacional y resistencia de piernas. MMA: un poco de todo, con énfasis en levantarse de la pared.",
    ["Elige 2 o 3 ejercicios propios de tu arte.", "Hazlos al final de la sesión de fuerza.", "Progresión lenta en el cuello."],
    ["Copiar el plan de otro deporte.", "Cargar el cuello con peso sin preparación previa."]),
   C("Las semanas antes de competir", "Seis a ocho semanas antes se sube el trabajo específico y los intervalos; las dos últimas semanas se baja el volumen y se mantiene la intensidad para llegar descansado. La última semana es técnica, sueño y peso controlado, sin sesiones nuevas.",
    ["Más específico lejos de la pelea, menos volumen cerca.", "La última semana no se prueba nada nuevo.", "Llegar descansado vale más que una sesión extra."],
    ["Entrenar más fuerte la última semana.", "Cortar peso a última hora."]),
   C("Escucha la carga", "El trabajo específico se suma a la academia, así que revisa el registro: si el RPE medio sube y el sueño baja, quita volumen. Las molestias en el agarre y el cuello avisan antes de lesionarse.",
    ["Revisa RPE y sueño cada semana.", "Molestia que no se va en 48 horas: baja carga."],
    ["Entrenar el agarre a diario hasta que duelen los dedos."]),
  ],
  drills: [
   D("Colgarse de la barra y remos con toalla", "Cuélgate de una barra con una toalla en cada mano el mayor tiempo posible. Luego remos con toalla en una barra baja.", "4 series de 40 s con 80 s de descanso", 8, true, "avanzado"),
   D("Cuello progresivo", "Isométricos con la mano en cuatro direcciones y, si ya llevas semanas haciéndolos, puentes suaves sobre las manos y la frente con peso parcial, sin dolor.", "3 series de 2 minutos con 1 minuto de descanso", 8, true, "avanzado"),
   D("Clinch con resistencia", "Con un compañero, 1 minuto de pelea de clinch al 70 % buscando la doble nuca o los ganchos por debajo, y 1 minuto de descanso.", "5 rondas de 1 minuto con 1 minuto de descanso", 11, false, "avanzado"),
   D("Simulación de pelea en circuito", "Por ronda: 1 minuto de saco intenso, 1 minuto de sprawls y levantadas, 1 minuto de pelea de manos o lanzamientos de balón medicinal.", "3 rondas de 3 minutos con 1 minuto de descanso", 11, true, "avanzado"),
  ],
  recursos: [V.barras, V.princeton, V.bjjee],
  hitos: [
   "Me cuelgo de la barra con toalla 40 segundos.",
   "Llevo seis semanas de trabajo de cuello progresivo sin molestias.",
   "Completo la simulación de pelea de 3 rondas manteniendo la técnica.",
   "Planeé las seis semanas antes de una competencia con una descarga al final.",
  ],
 },
];
