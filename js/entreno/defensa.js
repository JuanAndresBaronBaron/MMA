/* Defensa personal: prevención, distancia, escapes de agarres y suelo, y el marco legal colombiano
   (legítima defensa, artículo 32 numeral 6 del Código Penal, Ley 599 de 2000, modificado por la Ley 2197 de 2022).
   No es asesoría legal. Enlaces verificados antes de agregarlos. Ids estables: no reordenar drills, recursos ni hitos. */
const R = (titulo, url, plataforma, autor, idioma, nivel, por_que) => ({titulo, url, plataforma, autor, idioma, nivel, por_que});
const D = (nombre, como, dosis, min, solo, tipo = "tecnica", nivel = "basico") => ({nombre, como, dosis, nivel, min, solo, tipo});
const C = (titulo, explicacion, puntos, errores) => ({titulo, explicacion, puntos, errores});

const V = {
  mann: R("Knowledge Base Skills to Avoid 90% of Violence", "https://fightingarts.com/knowledge-base-skills-to-avoid-90-of-violence/", "articulo", "W.R. Mann (FightingArts.com)", "en", "basico",
    "Conciencia, desescalada verbal, límites y rutas de salida: lo que evita la mayoría de las peleas."),
  rcn: R("¿Cuáles son los límites de la legítima defensa en Colombia? Esto dice la ley", "https://www.noticiasrcn.com/colombia/legitima-defensa-en-colombia-hasta-donde-es-permitida-465881", "articulo", "Noticias RCN", "es", "basico",
    "Explica en lenguaje sencillo los cinco requisitos de la legítima defensa según la Corte Suprema."),
  ley: R("Ley 599 de 2000 (Código Penal), artículo 32", "https://normograma.supersalud.gov.co/compilacion/docs/ley_0599_2000.htm", "web", "Normograma de la Superintendencia Nacional de Salud", "es", "intermedio",
    "Texto oficial vigente del Código Penal, con el numeral 6 del artículo 32 modificado por la Ley 2197 de 2022."),
  bullying: R("Hostigamiento (bullying): generalidades", "https://espanol.nichd.nih.gov/salud/temas/bullying", "articulo", "NICHD (Institutos Nacionales de la Salud de EE. UU.)", "es", "basico",
    "Para profesores y padres: qué es el acoso y cómo responder sin violencia."),
  standup: R("BJJ Self Defense Lesson 4: The Technical Standup", "https://www.youtube.com/watch?v=Thp7ipnjyTI", "youtube", "Stephan Kesting", "en", "basico",
    "Cómo levantarte del suelo protegiéndote y creando distancia."),
  jeffries: R("Basics of Boxing - Training for Beginners at Home", "https://www.youtube.com/watch?v=kKDHdsVN0b8", "youtube", "Tony Jeffries", "en", "basico",
    "Postura, guardia y golpes rectos básicos que sirven como base de la defensa de pie."),
  vitonica: R("Los golpes básicos de boxeo: ¡al ataque!", "https://www.vitonica.com/entrenamiento/los-golpes-basicos-de-boxeo-al-ataque", "articulo", "Vitónica", "es", "basico",
    "Los golpes básicos explicados en español."),
  kesting3: R("The three most important jiu-jitsu moves for self-defense", "https://mixedmartialarts.com/vault/stephan-kestings-three-most-important-jiu-jitsu-moves-for-self-defense/", "articulo", "MixedMartialArts.com (Stephan Kesting)", "en", "intermedio",
    "Por qué la guillotina de pie es clave contra el intento de derribo de alguien sin entrenamiento."),
  sng: R("Tecnicas de Jiu Jitsu en ESPAÑOL sumision Mata leon (rear naked choke)", "https://www.youtube.com/watch?v=-RgJYOD9lFs", "youtube", "JiuJitsu Brasileño Y Defensa Personal SNG", "es", "intermedio",
    "El control de espalda y el mataleón explicados en español, con enfoque de defensa personal."),
};

export const INTRO = {
 titulo: "Defensa personal: evitar, escapar y, solo si no hay otra opción, defenderse",
 sub: "La mejor defensa es no estar ahí. Esta ruta empieza por la prevención y la desescalada, sigue con postura, distancia y escapes de agarres y del suelo, y termina con lo que dice la ley colombiana sobre la legítima defensa y qué hacer después de un incidente.",
 reglas: [
  {t: "Escapar es ganar", d: "El objetivo es llegar a salvo a casa, no ganar una pelea. Si puedes irte, vete. Si te piden el celular o la billetera con un arma, entrégalos."},
  {t: "Entrena con control", d: "Las técnicas de defensa personal se practican despacio y con un compañero que colabora. Golpes a ojos, garganta o ingle se simulan, nunca se aplican."},
  {t: "No es asesoría legal", d: "La parte legal explica el marco general en Colombia. Ante un caso real, busca un abogado y denuncia ante las autoridades. En emergencias llama a la línea 123."},
 ],
};
export const PLAN = [
 {fase: "Prevención", semanas: "Semanas 1–2", foco: "Conciencia, límites y salida.", puntos: ["Practica la postura de manos arriba y la voz firme.", "Identifica salidas en los lugares a los que vas."]},
 {fase: "Escapes de pie y suelo", semanas: "Semanas 3–8", foco: "Distancia, agarres, abrazos y levantarse del suelo.", puntos: ["Cada clase: un escape de pie, uno de suelo y la levantada técnica."]},
 {fase: "Ley y después del incidente", semanas: "Semanas 9–10", foco: "Legítima defensa y qué hacer luego.", puntos: ["Repasa los cinco requisitos y el plan de qué hacer después."]},
];

export const MODULOS = [
 {
  id: "defensa-1", nivel: "basico", corto: "Prevención",
  titulo: "Prevención, conciencia y límites",
  sub: "Reconocer el riesgo antes de que empiece, desescalar con la voz y saber irse a tiempo.",
  resumen: "La mayoría de las situaciones violentas se pueden evitar. Este módulo trabaja la conciencia del entorno, las señales de que algo va a pasar, la postura de manos abiertas arriba, la voz firme y los límites claros, y la decisión de irse. Son las habilidades que más se usan en la vida real.",
  conceptos: [
   C("Conciencia del entorno", "Camina con la cabeza arriba, no con la mirada en el celular, y fíjate en las salidas cuando entras a un lugar. Las señales de alarma son alguien que se acerca demasiado, te sigue, te pregunta algo para distraerte o cambia de tono de repente.",
    ["Mira alrededor y ubica salidas.", "Celular guardado en zonas de riesgo.", "Confía en tu intuición: si algo se siente mal, aléjate."],
    ["Caminar distraído con audífonos de noche.", "Quedarse por vergüenza cuando algo se siente mal."]),
   C("La postura de manos abiertas", "Si alguien se acerca de forma agresiva, pon las manos abiertas al frente a la altura del pecho, como diciendo \"tranquilo\". Parece una postura de calma, pero protege la cara y te deja listo para bloquear o empujar. Mantén un brazo y medio de distancia.",
    ["Manos abiertas arriba, nunca puños.", "Un pie atrás, como en guardia.", "Mantén la distancia retrocediendo en ángulo."],
    ["Cruzar los brazos o tener las manos en los bolsillos.", "Acercarse para discutir cara a cara."]),
   C("Desescalada y límites", "Habla poco, firme y calmado: \"No quiero problemas\", \"Atrás\". No respondas a insultos, no humilles al otro y deja que salve la cara. Si piden algo material con amenaza, entrégalo. Tu objetivo es crear la oportunidad de irte.",
    ["Frases cortas y repetidas.", "Voz firme y alta si hace falta que otros escuchen.", "Las cosas se reemplazan, tú no."],
    ["Responder con insultos.", "Pelear por el celular o la billetera."]),
  ],
  drills: [
   D("Postura de manos arriba y voz firme", "Con las manos abiertas al frente, retrocede en ángulo mientras dices en voz alta: \"Atrás, no quiero problemas\". Practica frente al espejo y luego con un compañero que avanza despacio.", "3 rondas de 2 minutos con 1 minuto de descanso", 10, false),
   D("Escenarios de conversación tensa", "Un compañero hace de persona agresiva (solo con palabras). Tú practicas mantener la distancia, frases cortas y buscar la salida. Cambien de rol.", "4 rondas de 2 minutos con 1 minuto de descanso", 13, false, "vivo"),
   D("Mapa de salidas", "Durante una semana, cada vez que entres a un lugar nuevo, ubica dos salidas y anótalas en tu diario de entreno.", "5 minutos", 5, true, "estudio"),
  ],
  recursos: [V.mann, V.bullying, V.rcn],
  hitos: [
   "Ubico las salidas cuando entro a un lugar nuevo.",
   "Adopto la postura de manos abiertas y mantengo la distancia sin pensarlo.",
   "Uso frases cortas y firmes para desescalar sin insultar.",
   "Tengo claro que entregar algo material es mejor que pelear por ello.",
  ],
 },
 {
  id: "defensa-2", nivel: "basico", corto: "Distancia y escape",
  titulo: "Postura, distancia, golpes de escape y levantarse del suelo",
  sub: "Lo mínimo físico para crear espacio y salir corriendo.",
  resumen: "Si la situación se vuelve física y no hay salida, se usa lo mínimo para crear espacio y escapar: empujar, golpes simples y cortos, rodilla o patada baja y correr. También aprendes a levantarte del suelo de forma segura, porque quedarse abajo en la calle es peligroso.",
  conceptos: [
   C("Golpes simples", "Bajo estrés las técnicas complicadas desaparecen. Golpes rectos con la palma o el puño, codazos cortos a corta distancia, rodillazos y patadas bajas a la pierna sirven para crear el espacio de huir. No se trata de una pelea larga: golpear, empujar y salir.",
    ["Palma o puño recto a la cara para crear espacio.", "Patada baja a la pierna para frenar el avance.", "Después de golpear, corre."],
    ["Lanzar patadas altas.", "Quedarse a pelear después de crear espacio."]),
   C("La levantada técnica", "Desde el suelo, apoya una mano atrás, un pie plantado y la otra mano protegiendo la cara. Levanta la cadera, pasa la pierna de abajo hacia atrás y queda de pie en guardia, lejos de la persona. Es la forma de levantarse sin exponer la cabeza.",
    ["Una mano siempre protege la cara.", "Te levantas hacia atrás, alejándote.", "Si la persona está cerca, patada al muslo o la rodilla desde el suelo para mantener distancia."],
    ["Levantarse hacia adelante con la cabeza baja.", "Darle la espalda a la persona."]),
   C("Huir con criterio", "Huye hacia lugares con gente y luz: tiendas, porterías, una estación de policía. Llama a la línea 123 cuando estés a salvo. Si estás con otras personas, acuerden de antemano un punto de encuentro.",
    ["Corre hacia la gente, no hacia lugares solos.", "Llama al 123 cuando estés a salvo.", "Acuerda un punto de encuentro con tu familia o amigos."],
    ["Correr hacia un callejón o un parqueadero vacío.", "Volver al lugar para \"terminar\" la discusión."]),
  ],
  drills: [
   D("Empujar, golpear y salir", "Con un compañero con escudo o manoplas: empuje con las dos palmas, dos golpes rectos y corre tres pasos fuera en ángulo, mirando atrás.", "4 rondas de 1 minuto con 1 minuto de descanso", 9, false),
   D("Levantada técnica hacia ambos lados", "Desde sentado, levántate con una mano protegiendo la cara hacia atrás y queda en guardia. 8 por lado.", "3 series de 1 minuto con 30 s de descanso", 5, true),
   D("Patada de mantener distancia desde el suelo", "Sentado o de espaldas, gira sobre la cadera para tener los pies hacia el compañero que camina alrededor. Patada controlada al escudo cuando se acerca y levantada técnica cuando se aleja.", "4 rondas de 1 minuto con 30 s de descanso", 8, false),
   D("Sombra de defensa", "En sombra: postura de manos arriba, palma recta, codazo corto, rodilla y salida corriendo en ángulo. Repite a ambos lados.", "3 rondas de 2 minutos con 1 minuto de descanso", 8, true),
  ],
  recursos: [V.standup, V.jeffries, V.vitonica],
  hitos: [
   "Creo espacio con un empujón y dos golpes simples y salgo en ángulo.",
   "Me levanto del suelo con la levantada técnica a ambos lados.",
   "Mantengo la distancia desde el suelo girando sobre la cadera.",
   "Sé hacia dónde huir y a qué línea llamar.",
  ],
 },
 {
  id: "defensa-3", nivel: "intermedio", corto: "Agarres y suelo",
  titulo: "Escapes de agarres, abrazos y del suelo",
  sub: "Agarre de muñeca, de ropa, abrazo por delante y por detrás, candado de cuello y quedar abajo.",
  resumen: "Muchas agresiones empiezan con un agarre: de la muñeca, de la camisa, un abrazo o un candado de cuello. Aquí aprendes escapes sencillos que funcionan sin fuerza, basados en palancas, en bajar la cadera y en proteger el cuello. También qué hacer si terminas en el suelo con la persona encima.",
  conceptos: [
   C("Agarres de muñeca y ropa", "La muñeca se escapa girando hacia el pulgar del que agarra, que es el punto débil de la mano. Con la ropa, controla la mano que agarra contra tu pecho y crea espacio con un golpe o un paso atrás. Siempre termina con distancia.",
    ["Sal por el lado del pulgar.", "Usa todo el cuerpo, no solo el brazo.", "Escapa y aléjate."],
    ["Jalar en línea recta contra la fuerza del otro.", "Quedarse cerca después de soltarse."]),
   C("Abrazos y candado de cuello", "Ante un abrazo por detrás, baja la cadera para ser pesado, protege el cuello y gira para quedar de frente. Contra el candado de cuello (headlock) de pie, gira el mentón hacia el pecho del otro para respirar, baja la cadera y sal por detrás. Contra alguien que se lanza a las piernas, la guillotina de pie es una defensa conocida en grappling, pero en la calle lo prioritario es frenar el derribo y salir.",
    ["Baja la cadera: pesas más y no te levantan.", "El cuello se protege primero.", "Gira hasta quedar de frente o sal por detrás."],
    ["Dejar que te levanten del suelo.", "Pelear con los brazos mientras te estrangulan sin proteger el cuello."]),
   C("Abajo con la persona encima", "Si te tumban, cubre la cabeza con los antebrazos, mete los codos, usa el puente (upa) para sacarla por encima de tu hombro y escapa con la cadera hacia la guardia o hacia la levantada técnica. En el suelo de la calle no se busca finalizar: se busca levantarse y salir.",
    ["Cabeza protegida y codos dentro.", "Upa hacia el hombro para quitártelo de encima.", "Objetivo: levantarte, no someter."],
    ["Quedarse plano sobre la espalda.", "Buscar una llave mientras recibes golpes."]),
  ],
  drills: [
   D("Escape de agarre de muñeca", "El compañero agarra tu muñeca con una o dos manos. Gira hacia su pulgar con todo el cuerpo, da un paso atrás y adopta la postura de manos arriba. Alterna lados.", "3 rondas de 2 minutos con 1 minuto de descanso", 10, false),
   D("Abrazo por detrás y giro", "El compañero te abraza por detrás. Bajas la cadera, proteges el cuello, das un paso al lado y giras para quedar de frente o salir. Despacio y con control.", "4 rondas de 1 minuto con 1 minuto de descanso", 9, false),
   D("Escape del candado de cuello de pie", "Con el compañero aplicando el candado sin apretar, gira el mentón, baja la cadera, pasa por detrás y sal con distancia. El compañero suelta a la primera señal.", "4 rondas de 1 minuto con 1 minuto de descanso", 9, false),
   D("Upa y levantada con golpes simulados", "El compañero en la montada simula golpes lentos con guantes. Tú te cubres, haces upa, pasas a su guardia o te levantas con la levantada técnica.", "4 rondas de 1 minuto con 1 minuto de descanso", 9, false, "vivo", "intermedio"),
  ],
  recursos: [V.kesting3, V.sng, V.standup],
  hitos: [
   "Escapo del agarre de muñeca saliendo por el pulgar y terminando con distancia.",
   "Ante un abrazo por detrás bajo la cadera y giro sin que me levanten.",
   "Salgo del candado de cuello de pie protegiendo la respiración.",
   "Desde la montada con golpes simulados me cubro, hago upa y me levanto.",
  ],
 },
 {
  id: "defensa-4", nivel: "avanzado", corto: "Ley y después",
  titulo: "La ley en Colombia: legítima defensa, exceso y qué hacer después",
  sub: "Cuándo la ley reconoce que te defendiste, por qué la proporción importa y cómo actuar luego de un incidente.",
  resumen: "En Colombia, el Código Penal (Ley 599 de 2000, artículo 32, numeral 6, modificado por la Ley 2197 de 2022) dice que no hay responsabilidad penal cuando se obra por la necesidad de defender un derecho propio o ajeno contra una injusta agresión actual o inminente, siempre que la defensa sea proporcionada. Saber esto cambia cómo entrenas: la defensa personal es salir a salvo, no castigar al agresor. Esto es información general y no reemplaza a un abogado.",
  conceptos: [
   C("Los cinco requisitos", "Según la Corte Suprema, para que haya legítima defensa debe existir: 1) una agresión injusta que ponga en peligro un derecho; 2) que sea actual o inminente, es decir, que esté pasando o a punto de pasar; 3) que la defensa sea necesaria para detenerla; 4) que sea proporcionada a la agresión y a los medios usados; y 5) que la agresión no haya sido provocada por quien se defiende.",
    ["Actual o inminente: no vale \"vengarse\" después.", "Necesaria: si podías irte con seguridad, eso pesa.", "Proporcionada: la respuesta va acorde al ataque.", "No provocada: si buscaste la pelea, no aplica."],
    ["Seguir golpeando a alguien que ya está en el suelo y no ataca.", "Responder a un insulto con golpes.", "Perseguir al agresor que huye."]),
   C("Defensa privilegiada y exceso", "El numeral 6.1 presume legítima la defensa contra quien entra o permanece sin autorización en tu vivienda, sus dependencias o un vehículo ocupado, aunque la fuerza letal solo se acepta de forma excepcional. Cuando la defensa va más allá de lo necesario y proporcionado, la ley puede considerarla un exceso y castigarlo. Por eso el entrenamiento enfatiza control y salida.",
    ["La protección de la vivienda tiene reglas propias, pero no es carta blanca.", "Pasarse de la proporción puede traer responsabilidad penal.", "Controlar la fuerza es parte de la técnica."],
    ["Creer que \"en mi casa todo vale\".", "Usar un arte marcial para lastimar de más."]),
   C("Qué hacer después", "Cuando estés a salvo: llama a la línea 123 y busca atención médica si estás herido. Anota lo que pasó, la hora y el lugar, y busca testigos o cámaras cercanas. Denuncia ante la Policía o la Fiscalía. No publiques el incidente en redes sociales y habla con un abogado antes de dar declaraciones largas.",
    ["Primero tu seguridad y tu salud.", "Llama al 123 y denuncia.", "Anota detalles y busca testigos o cámaras.", "Consulta a un abogado."],
    ["Huir del lugar sin avisar a nadie cuando hubo heridos.", "Publicar videos o comentarios en redes.", "Volver al lugar a buscar a la persona."]),
  ],
  drills: [
   D("Estudio de los cinco requisitos", "Lee el artículo 32 del Código Penal y la nota de prensa sobre sus límites. Escribe con tus palabras los cinco requisitos y un ejemplo de cada uno.", "20 minutos", 20, true, "estudio", "avanzado"),
   D("Análisis de casos en grupo", "El profesor plantea situaciones cortas (alguien empuja y se va, alguien amenaza con un arma, alguien sigue atacando en el suelo). El grupo discute si hay agresión actual, necesidad y proporción, y qué habría sido lo más seguro.", "20 minutos", 20, false, "estudio", "avanzado"),
   D("Escenario con control y salida", "Escenario a baja velocidad: el agresor ataca, tú te defiendes con lo mínimo y, apenas el agresor deja de atacar, sales y simulas la llamada al 123 diciendo lugar y lo que pasó.", "4 rondas de 1 minuto con 1 minuto de descanso", 9, false, "vivo", "avanzado"),
  ],
  recursos: [V.ley, V.rcn, V.mann],
  hitos: [
   "Puedo explicar los cinco requisitos de la legítima defensa con un ejemplo.",
   "Entiendo por qué la proporción y la salida importan y qué es un exceso.",
   "Sé qué hacer después de un incidente: 123, atención médica, testigos, denuncia y abogado.",
   "En los escenarios dejo de actuar apenas el agresor deja de atacar.",
  ],
 },
];
