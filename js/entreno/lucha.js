/* Camino de Lucha: contenido investigado, con enlaces tomados de resultados reales de búsqueda.
   Duplicados pendientes para la reorganización en tres pilares (de pie, ataques, suelo); no se borran ni se mueven
   aquí porque las claves de progreso (lucha:d:modulo:i) dependen de la posición:
   - Sprawl reactivo: fundamentos-1 y cadenas-1.
   - Caídas: fundamentos-1 (Progresión de caídas seguras), cadenas-1 (Caídas básicas) y cadenas-3 (Caídas avanzadas).
   - Snap down a go-behind: fundamentos-2 (intermedio) y cadenas-1 (básico).
   - Cadenas daguestaníes: fundamentos-3, cadenas-2, suelo-3 (y mma jaula-3).
   - Clinch grecorromano contra la pared: fundamentos-3, cadenas-3 y suelo-3.
   - Gut wrench y leg lace: cadenas-2 y suelo-2.
   - Pelea de manos: fundamentos-1 (progresión de 5 pasos), fundamentos-2 y cadenas-2 (two-on-one). */
export const INTRO = {
 "titulo": "Lucha: de cero a lucha encadenada",
 "sub": "Este camino usa la lucha libre olímpica (freestyle) con el enfoque daguestaní de encadenar ataques, porque permite atacar las piernas y también proyectar desde el tronco, y es la que mejor se traslada al MMA, al BJJ y a la defensa personal. La grecorromana, que prohíbe atacar o usar las piernas, entra como complemento para el clinch: underhooks (brazo por debajo de la axila del rival), body lock (abrazo de cintura), arm drags y proyecciones.",
 "reglas": [
  {
   "t": "Avanza por nivel, no por gusto",
   "d": "Empieza por los módulos básicos de Fundamentos, Cadenas y Suelo, y pasa a los intermedios solo cuando puedas hacer los drills básicos con buena técnica y sin pensar. La lucha encadenada y las proyecciones avanzadas dependen de una base sólida de postura, cambio de nivel y caídas seguras."
  },
  {
   "t": "Video, luego drill, luego lucha en vivo",
   "d": "Mira el video de la técnica una o dos veces, repítela en drill con poca resistencia hasta que salga limpia, y solo después pruébala en situaciones con resistencia creciente. Saltar directo al sparring con una técnica nueva casi siempre termina en malos hábitos o lesiones."
  },
  {
   "t": "Seguridad, rendición y compañeros",
   "d": "Aprende las caídas seguras antes de cualquier proyección, cuida el cuello y no luches con la cabeza baja ni mirando al piso. Golpea dos veces el tatami o al compañero para detener la acción y respeta siempre esa señal. Elige compañeros de peso y nivel parecidos al principio, y practica las proyecciones con alguien que sepa caer."
  },
  {
   "t": "Si entrenas solo",
   "d": "Puedes avanzar bastante solo con motion en shadow, cambios de nivel y paso de penetración, sprawls, levantada técnica, sit-out, hip heist, wall walk y acondicionamiento. Lo que no se aprende solo es el timing contra resistencia real, así que busca un club de lucha, de MMA o de BJJ con buena lucha de pie al menos una o dos veces por semana."
  }
 ]
};

export const PLAN = [
 {
  "fase": "Arranque: moverse y caer sin lastimarse",
  "semanas": "Meses 1–2",
  "foco": "Construir la base de pie, aprender a caer y a levantarse, y entender por qué entrenamos freestyle con cadenas daguestaníes.",
  "puntos": [
   "Módulo Base de pie: guardia, desplazamiento, cambio de nivel y caídas seguras, con la Progresión de caídas seguras al inicio de cada sesión.",
   "Motion en shadow y Guardia y desplazamiento en espejo para dejar de pararse rígido.",
   "Cambios de nivel y paso de penetración en el lugar, más Sprawl reactivo todos los días de entrenamiento.",
   "Módulo Base abajo y escapes: Stand-up técnico con compañero, Sit-out y hip heist en solitario y Fortalecimiento de cuello seguro.",
   "Meta realista: moverte con postura, caer sin miedo y levantarte desde abajo; todavía no derribar a alguien que se resiste."
  ]
 },
 {
  "fase": "Primeros derribos y defensa",
  "semanas": "Meses 3–4",
  "foco": "Convertir el paso de penetración en derribos reales a las piernas y aprender a defenderlos.",
  "puntos": [
   "Módulo Bases de la lucha libre: Double leg y single leg con compañero, Snap down a go-behind con compañero y Duck under desde collar tie.",
   "Aprender la puntuación en freestyle (UWW) para saber qué vale cada acción.",
   "Módulo Agarres, derribos a las piernas y defensa activa: Pelea de manos con objetivo, Blast double en shadow y luego con compañero.",
   "Whizzer y crossface: defensa y puntuación, para no quedar solo con el sprawl.",
   "Primeros lives cortos de 1 minuto desde posiciones definidas, no sparring libre."
  ]
 },
 {
  "fase": "Pierna simple, control arriba y par terre",
  "semanas": "Meses 5–8",
  "foco": "Terminar lo que empiezas, tanto en las finalizaciones de pierna simple como en el control y los giros en el suelo.",
  "puntos": [
   "Finalizaciones de pierna simple y Snap down a go-behind encadenados con la pelea de manos.",
   "Módulo Control arriba y giros de par terre: Breakdown a tilt, Gut wrench encadenado y Leg lace con giros consecutivos.",
   "Defensa de giros boca abajo y Base y hand fighting desde abajo para no regalar puntos en par terre.",
   "Top / bottom situacional (lives cortos) y Circuito de acondicionamiento de lucha una o dos veces por semana.",
   "Hacia el mes 8 ya deberías poder sostener rondas de sparring de puntuación de 2 minutos con alguien de tu nivel."
  ]
 },
 {
  "fase": "Amarres, arm drag y primeras cadenas",
  "semanas": "Meses 9–12",
  "foco": "Pasar de técnicas sueltas a combinaciones de 2 ataques que salen de los amarres y del clinch.",
  "puntos": [
   "Módulo Cadenas daguestaníes: Pelea de manos con two-on-one (agarrar un brazo con tus dos manos), Arm drag en cadena y Ankle pick reactivo.",
   "Sombra de cadenas a diario: single a double, single a zancadilla, snap down a ankle pick.",
   "Pummeling continuo (pelea por los underhooks) como puente hacia el clinch grecorromano.",
   "Par terre: gut wrench y leg lace dentro de los lives, no solo en drill.",
   "Al cumplir un año, lo realista es tener un derribo favorito que funciona con resistencia y una defensa confiable."
  ]
 },
 {
  "fase": "Clinch grecorromano y lucha contra la pared",
  "semanas": "Año 2",
  "foco": "Sumar el trabajo de tronco y la pared para que la lucha sirva en MMA, BJJ y defensa personal.",
  "puntos": [
   "Módulo Lucha encadenada daguestaní y clinch grecorromano: Clinch grecorromano contra la pared o la jaula, Body lock y zancadillas y Retornos al tatami.",
   "Módulo Proyecciones de tronco: Caídas avanzadas antes de la Progresión de proyecciones, siempre con compañero que sepa caer.",
   "Wall walk en solitario y Situacional de pared o jaula con body lock.",
   "Módulo Cadenas daguestaníes y suelo de MMA: Wrestle-up contra la pared (MMA) y Clinch de grecorromana contra la pared.",
   "Lucha encadenada de 2 a 3 ataques en cada sesión de drill."
  ]
 },
 {
  "fase": "Avanzado: cadenas completas, contras y presión",
  "semanas": "Año 3 en adelante",
  "foco": "Encadenar ataques de pie y en el suelo bajo fatiga, contraatacar y competir o hacer sparring duro con criterio.",
  "puntos": [
   "Cadena daguestaní de 3 ataques y Cadenas daguestaníes en el suelo hasta que salgan sin pensar.",
   "Contra y ataque para castigar cada derribo fallido del rival.",
   "Shark tank de suelo (entrar fresco contra alguien cansado y rotar rivales) y Sparring de puntuación freestyle.",
   "Estudiar a los atletas sugeridos en el módulo de suelo de MMA y copiar una cadena por mes.",
   "Ser un luchador avanzado de verdad suele tomar de 3 a 5 años de práctica constante, igual que un cinturón de BJJ toma años; el progreso depende de la frecuencia y de tener buenos compañeros."
  ]
 }
];

export const SEMANA = [
 {
  "min": "0–10'",
  "t": "Calentamiento y caídas",
  "d": "Trote, motion en shadow, movilidad de cadera y cuello sin cargarlo, y la Progresión de caídas seguras. Termina con 5 levantadas técnicas por lado."
 },
 {
  "min": "10–20'",
  "t": "Movimiento y cambio de nivel",
  "d": "Cambios de nivel y paso de penetración en el lugar, luego Guardia y desplazamiento en espejo con un compañero. Cierra con 3 series de 20 segundos de Sprawl reactivo."
 },
 {
  "min": "20–35'",
  "t": "Técnica del día",
  "d": "Mira la técnica una vez y repítela en drill con poca resistencia, por ejemplo Blast double con compañero o Finalizaciones de pierna simple. Busca de 30 a 50 repeticiones limpias por lado."
 },
 {
  "min": "35–45'",
  "t": "Pelea de manos y cadena",
  "d": "Pelea de manos con objetivo o Pelea de manos con two-on-one, y agrega un segundo ataque cuando el primero falla, por ejemplo snap down que termina en go-behind o ankle pick."
 },
 {
  "min": "45–55'",
  "t": "Suelo y par terre",
  "d": "Base y hand fighting desde abajo, Stand-up técnico con compañero, y de arriba Breakdown a tilt o Gut wrench encadenado según tu nivel."
 },
 {
  "min": "55–70'",
  "t": "Lucha en vivo situacional",
  "d": "Rondas cortas de 1 minuto: Top / bottom situacional, una ronda desde el clinch con underhooks y, si eres intermedio o avanzado, rondas de Sparring de puntuación freestyle de 2 minutos."
 },
 {
  "min": "70–80'",
  "t": "Acondicionamiento",
  "d": "Circuito de acondicionamiento de lucha: sprawls, entradas de penetración, arrastres de compañero y Fortalecimiento de cuello seguro con carga ligera."
 },
 {
  "min": "80–90'",
  "t": "Vuelta a la calma y notas",
  "d": "Estiramientos de cadera, espalda y hombros. Anota qué técnica funcionó en vivo, cuál falló y qué drill vas a repetir la próxima sesión."
 }
];

export const MODULOS = [
 {
  "titulo": "Base de pie: guardia, desplazamiento, cambio de nivel y caídas seguras",
  "corto": "Base",
  "sub": "La postura y el movimiento que sostienen todos los derribos",
  "nivel": "basico",
  "resumen": "Este módulo construye la base de pie de la lucha libre olímpica (freestyle), aplicada a MMA, BJJ y defensa personal. Primero verás en qué se diferencian los tres estilos principales y por qué este camino usa freestyle con el enfoque daguestaní. Después aprenderás a pararte y moverte sin regalar las piernas. Luego trabajarás el cambio de nivel y el paso de penetración, que abren cualquier derribo. Cierras con el sprawl básico, las caídas seguras y la forma correcta de levantarte del suelo. Domina las caídas antes de recibir derribos con intensidad. Todo se describe para guardia ortodoxa (pie izquierdo adelante). En guardia zurda se invierte.",
  "conceptos": [
   {
    "titulo": "Los tres estilos y por qué elegimos freestyle con enfoque daguestaní",
    "explicacion": "La grecorromana solo permite atacar de la cintura para arriba. No se agarran las piernas del rival y tampoco se usan las propias piernas para zancadillas o barridos. Se enfoca en el clinch, los underhooks (brazo por debajo de la axila del rival), el body lock (abrazo de cintura) y las proyecciones de tronco. El folkstyle, propio de escuelas y universidades de EE. UU., permite atacar las piernas, pero premia mucho el control en el suelo con reglas propias, como el tiempo de control, los escapes y las reversiones. La lucha libre olímpica (freestyle) permite atacar las piernas y también proyectar desde el tronco, por eso es la que más se transfiere a MMA, BJJ y defensa personal. A esto se suma el enfoque de la escuela daguestaní de freestyle: encadenar ataques sin pausa, con presión constante de manos y cabeza. Peleadores como Khabib Nurmagomedov e Islam Makhachev combinan esa lucha con el sambo de combate. La grecorromana queda como complemento para ganar el clinch contra la jaula o la pared.",
    "puntos": [
     "Freestyle combina ataques a piernas y tronco, y es el estilo que más se transfiere a MMA y defensa personal",
     "La grecorromana prohíbe agarrar las piernas y usar las propias piernas para zancadillas, por eso se usa como complemento de clinch",
     "El folkstyle aporta buen trabajo en el suelo, pero responde a reglas de EE. UU.",
     "El enfoque daguestaní busca encadenar ataques, presionar y desgastar con control de muñecas y cabeza"
    ],
    "errores": [
     "Pensar que la grecorromana es la más completa para MMA, cuando sin ataques a las piernas pierdes la mitad del arsenal",
     "Copiar las reglas de puntuación de un estilo a otro sin adaptar el juego",
     "Creer que Khabib o Makhachev son solo luchadores olímpicos, cuando su base combina lucha y sambo de combate"
    ]
   },
   {
    "titulo": "Guardia cuadrada y escalonada",
    "explicacion": "En la guardia escalonada (ortodoxa, pie izquierdo adelante) los pies quedan a lo ancho de los hombros o un poco más, con las rodillas flexionadas aproximadamente sobre la punta de los pies y la cadera baja. La espalda va recta e inclinada hacia adelante, la cabeza arriba, los codos pegados al cuerpo y las manos frente a las rodillas. La guardia cuadrada, con los pies paralelos, defiende mejor las piernas y da acceso a los dos lados. Es común en el freestyle internacional y contra rivales que atacan mucho. En MMA y en defensa personal la guardia se lleva algo más alta para no recibir rodillazos y poder golpear o cubrirte, y se baja solo en el momento del cambio de nivel.",
    "puntos": [
     "Peso en la bola del pie, nunca en los talones",
     "Rodillas aproximadamente sobre la punta de los pies, no mucho más adelante",
     "Codos adentro para negar los underhooks del rival",
     "Cabeza arriba y ojos en la cadera del rival",
     "Alternar guardia cuadrada y escalonada según el rival"
    ],
    "errores": [
     "Doblarse por la cintura en vez de flexionar las rodillas",
     "Llevar las rodillas muy por delante de los dedos, lo que carga la rodilla y quita base",
     "Estirar los brazos y regalar las muñecas"
    ]
   },
   {
    "titulo": "Desplazamiento (motion)",
    "explicacion": "El motion es moverte sin perder la guardia. Usa pasos cortos, sin cruzar nunca los pies, y avanza, retrocede o circula con la cadera siempre a la misma altura. El objetivo es crear ángulos y provocar reacciones que abran tus ataques. Al estilo daguestaní, el círculo se combina con presión constante hacia adelante para acorralar al rival.",
    "puntos": [
     "Primero se mueve el pie más cercano a la dirección del paso",
     "La cadera no sube ni baja al desplazarse",
     "Las manos siguen trabajando mientras te mueves",
     "Círculo más presión hacia adelante para acorralar al rival"
    ],
    "errores": [
     "Cruzar los pies al moverse",
     "Saltar o rebotar",
     "Dejar de usar las manos mientras te desplazas"
    ]
   },
   {
    "titulo": "Cambio de nivel y paso de penetración",
    "explicacion": "El cambio de nivel consiste en bajar la cadera flexionando las rodillas, sin agachar la cabeza ni doblar la espalda. El paso de penetración se hace con la pierna adelantada de tu guardia: esa rodilla avanza entre los pies del rival y baja al suelo justo debajo de él. En la guardia ortodoxa (pie izquierdo adelante) es la rodilla izquierda. Después empujas con el pie de atrás para seguir avanzando o volver a quedar en guardia. En MMA el cambio de nivel funciona mejor justo después de un golpe, porque el rival sube la guardia y deja las piernas descubiertas. Sobre asfalto o cemento, en defensa personal, evita apoyar la rodilla y haz el tiro quedándote sobre los pies.",
    "puntos": [
     "Primero el nivel, después el paso, sin lanzarte de lejos",
     "Se penetra con la pierna adelantada de tu guardia",
     "La rodilla toca el suelo suave, sin golpearlo",
     "Cabeza arriba y espalda recta durante todo el tiro",
     "Usar rodilleras al principio para proteger las rodillas"
    ],
    "errores": [
     "Tirar desde demasiado lejos",
     "Agachar la cabeza, lo que te expone a la guillotina y al control del rival",
     "Golpear la rodilla contra el suelo"
    ]
   },
   {
    "titulo": "Sprawl básico",
    "explicacion": "El sprawl es la defensa de cadera contra un tiro a las piernas. Lanzas las piernas hacia atrás, quedas sobre la punta de los pies y dejas caer la cadera con todo el peso sobre la cabeza y los hombros del rival. Las rodillas quedan lejos del suelo. Apenas el ataque se frena, vuelves a la guardia y circulas, porque el rival puede volver a tirar.",
    "puntos": [
     "Piernas atrás, sobre la punta de los pies, y cadera abajo sobre la cabeza y los hombros del rival",
     "Las manos bloquean primero y la cadera remata",
     "Volver a la guardia y circular en cuanto se frena el tiro"
    ],
    "errores": [
     "Hacer sprawl con las rodillas apoyadas en el suelo",
     "Reaccionar tarde, cuando el rival ya tiene las piernas agarradas",
     "Quedarse encima mirando sin volver a la guardia"
    ]
   },
   {
    "titulo": "Caídas seguras (breakfalls)",
    "explicacion": "Antes de hacer o recibir derribos hay que saber caer. En la caída hacia atrás palmeas el suelo con los brazos a unos 30 a 45 grados del cuerpo y las palmas hacia abajo. Mantén el mentón pegado al pecho durante toda la caída y la espalda redondeada para rodar. Nunca apoyes la mano estirada para frenar la caída, porque así se lesionan la muñeca, el codo y la clavícula. La progresión va de caer sentado, a caer desde cuclillas y luego desde de pie.",
    "puntos": [
     "Mentón al pecho durante toda la caída",
     "Palmear con los brazos a 30 a 45 grados y las palmas hacia abajo",
     "Exhalar al tocar el suelo",
     "Progresar de sentado a cuclillas y luego de pie"
    ],
    "errores": [
     "Poner la mano estirada para frenar la caída",
     "Dejar que la cabeza rebote contra el suelo",
     "Saltar a caídas desde de pie sin dominar las previas"
    ]
   },
   {
    "titulo": "Levantarse con técnica (technical stand-up)",
    "explicacion": "La levantada técnica es la forma segura de volver a estar de pie desde el suelo. Sentado, apoyas una mano atrás en el suelo y el pie del lado contrario. La otra mano queda adelante protegiendo la cara. Empujas con esa mano y ese pie para levantar la cadera, pasas la pierna libre por debajo hacia atrás y quedas en guardia, a distancia del rival. Es clave en MMA y en defensa personal, porque te levantas sin dar la espalda y sin dejar la cabeza expuesta.",
    "puntos": [
     "Mano de apoyo atrás y la otra protegiendo la cara",
     "Levantar la cadera antes de pasar la pierna",
     "Pasar la pierna hacia atrás, nunca hacia adelante",
     "Terminar en guardia y a distancia"
    ],
    "errores": [
     "Levantarse de frente apoyando las dos manos adelante",
     "Dar la espalda al rival al pararse",
     "Bajar la mano que protege la cara"
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Progresión de caídas seguras",
    "como": "1. Siéntate en el tatami con el mentón al pecho. 2. Rueda hacia atrás y palmea con los dos brazos a 30 a 45 grados, palmas abajo, exhalando. 3. Repite desde cuclillas. 4. Repite desde de pie, dejando caer la cadera cerca de los talones. 5. Agrega caídas laterales a cada lado palmeando con el brazo del lado de la caída.",
    "dosis": "2 series de 8 por variante, en cada calentamiento",
    "nivel": "basico",
    "min": 10,
    "solo": true
   },
   {
    "nombre": "Levantada técnica",
    "como": "1. Siéntate con una mano atrás y la otra frente a la cara. 2. Levanta la cadera empujando con la mano de atrás y el pie contrario. 3. Pasa la pierna libre por debajo hacia atrás. 4. Termina en guardia y da un paso atrás. 5. Alterna los lados.",
    "dosis": "3 series de 5 por lado, 30 s de descanso",
    "nivel": "basico",
    "min": 5,
    "solo": true
   },
   {
    "nombre": "Cambios de nivel y paso de penetración en el lugar",
    "como": "1. Desde la guardia, baja la cadera flexionando las rodillas con la cabeza arriba y vuelve a subir, sin dar el paso. 2. Marca una línea en el tatami. 3. Cambia de nivel y da el paso de penetración con la pierna adelantada, apoyando la rodilla suave al otro lado de la línea. 4. Empuja con el pie de atrás y vuelve a la guardia. 5. Cambia de guardia para trabajar el otro lado.",
    "dosis": "3 series de 15 cambios de nivel y 3 series de 10 pasos de penetración por lado",
    "nivel": "basico",
    "min": 12,
    "solo": true
   },
   {
    "nombre": "Motion en shadow",
    "como": "1. Párate en guardia escalonada. 2. Desplázate adelante, atrás y en círculo hacia ambos lados con pasos cortos, sin cruzar los pies. 3. Cada 5 a 10 segundos cambia a guardia cuadrada y vuelve. 4. Mantén la cadera a la misma altura y las manos activas todo el tiempo.",
    "dosis": "3 rondas de 1 min, 30 s de descanso",
    "nivel": "basico",
    "min": 5,
    "solo": true
   },
   {
    "nombre": "Guardia y desplazamiento en espejo",
    "como": "1. Dos compañeros frente a frente. 2. Uno guía moviéndose adelante, atrás y en círculo. 3. El otro copia sin perder la guardia ni cruzar los pies. 4. Alternen guardia cuadrada y escalonada y cambien de rol cada ronda.",
    "dosis": "4 rondas de 1 min, 30 s de descanso",
    "nivel": "basico",
    "min": 6,
    "solo": false
   },
   {
    "nombre": "Sprawl reactivo",
    "como": "1. Ponte en guardia frente al compañero. 2. Él amaga un tiro o te toca la pierna. 3. Reaccionas con sprawl, cadera abajo y rodillas lejos del suelo. 4. Vuelves a la guardia y circulas. 5. Empiecen sin resistencia y suban el ritmo de a poco. 6. Cambien de rol cada ronda.",
    "dosis": "4 rondas de 45 s, 30 s de descanso",
    "nivel": "basico",
    "min": 5,
    "solo": false
   },
   {
    "nombre": "Progresión de hand fighting en 5 pasos",
    "como": "Con un compañero, en postura y moviéndose. Una ronda por paso. 1) Posición de manos: busca la mano interior (tu mano por dentro de la suya) y mantén los codos cerca del cuerpo. 2) Collar tie y control de muñeca: agarra la nuca o la muñeca del compañero y luego aprende a romper esos mismos agarres cuando te los hace a ti. 3) Limpiar agarres: suelta cualquier agarre suyo con un golpe de mano o un giro de muñeca y vuelve a la posición neutral. 4) Two-on-one y arm drag: atrapa su brazo con tus dos manos y llévalo hacia tu cadera para pasar a su costado. 5) Juego vivo: el primero que toca las piernas del otro gana el punto. La cabeza también trabaja, como una quinta mano, apoyada en la sien o la frente del compañero. No cruces los pies y no agarres sin un propósito.",
    "dosis": "5 rondas de 2 minutos (una por paso) con 30 segundos de descanso",
    "nivel": "basico",
    "min": 14,
    "solo": false,
    "tipo": "tecnica"
   }
  ],
  "recursos": [
   {
    "titulo": "Cómo hacer el Derribo a las Dos Piernas (Double Leg Takedown) | Centro de Combate",
    "url": "https://www.youtube.com/watch?v=CT7gWORVmU0",
    "plataforma": "youtube",
    "autor": "Nicolás Peña (Centro de Combate)",
    "idioma": "es",
    "nivel": "basico",
    "por_que": "Introducción clara en español al derribo a dos piernas. Fíjate en cómo se encadenan el cambio de nivel y el paso de penetración antes del agarre."
   },
   {
    "titulo": "How to Sprawl (Wrestling Basics for MMA) - Principles, Important Details & Variations",
    "url": "https://www.youtube.com/watch?v=z4ZoTmn1Gvs",
    "plataforma": "youtube",
    "autor": "Grappling SMARTY",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Explica el sprawl pensado para MMA, con sus principios, variaciones y el side sprawl. Presta atención a la posición de la cadera y a la vuelta rápida a la guardia."
   },
   {
    "titulo": "Stance and Motion Drills For Wrestling - The School of Wrestling Technique",
    "url": "https://www.youtube.com/watch?v=tyU-QaV8MnI",
    "plataforma": "youtube",
    "autor": "The School of Wrestling",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Drills de guardia y desplazamiento de una escuela de lucha dedicada a la técnica."
   },
   {
    "titulo": "Penetration and Level Change by Henry Cejudo",
    "url": "https://www.youtube.com/watch?v=z6DKWX0YlV8",
    "plataforma": "youtube",
    "autor": "Henry Cejudo",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Campeón olímpico de freestyle y campeón de UFC explicando el cambio de nivel y el paso de penetración."
   },
   {
    "titulo": "How To Breakfall Correctly (Ukemi)",
    "url": "https://www.youtube.com/watch?v=q6FBYGpUsY8",
    "plataforma": "youtube",
    "autor": "No confirmado (canal de artes marciales)",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Base de seguridad: aprender a caer antes de practicar derribos y proyecciones."
   },
   {
    "titulo": "Wrestling Greco Roman & Freestyle wrestling explained",
    "url": "https://www.youtube.com/watch?v=Sp7hI8rbnkQ",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Explica las diferencias entre freestyle y grecorromana, la base de la elección de estilo."
   },
   {
    "titulo": "Aprende cómo hacer un SPRAWL y SIDE SPRAWL",
    "url": "https://www.youtube.com/watch?v=vS-TQotwsZA",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "es",
    "nivel": "basico",
    "por_que": "Sprawl y sprawl lateral explicados en español."
   },
   {
    "titulo": "Wrestling Powerful Grappling Certified Masterclass Course",
    "url": "https://www.udemy.com/course/wrestling-powerful-grappling-certified-masterclass-course/",
    "plataforma": "udemy",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Curso de lucha incluido en la membresía de Udemy, como apoyo estructurado.",
    "pago": true
   }
  ],
  "hitos": [
   "Explico con mis palabras la diferencia entre freestyle, grecorromana y folkstyle",
   "Me muevo adelante, atrás y en círculo un minuto completo sin cruzar los pies ni subir la cadera",
   "Cambio de nivel con la cabeza arriba y la espalda recta, sin doblarme por la cintura",
   "Doy el paso de penetración con la pierna adelantada y apoyo la rodilla sin golpear el suelo",
   "Hago sprawl ante un amago con las rodillas lejos del suelo y vuelvo a la guardia enseguida",
   "Caigo hacia atrás desde de pie palmeando y con el mentón al pecho, sin frenar con la mano",
   "Me levanto del suelo con la levantada técnica, sin dar la espalda y con una mano protegiendo la cara"
  ],
  "id": "fundamentos-1"
 },
 {
  "titulo": "Agarres, derribos a las piernas y defensa activa",
  "corto": "Derribos",
  "sub": "Pelea de manos, double, pierna simple, snap down y cómo defenderlos",
  "nivel": "intermedio",
  "resumen": "Con la base firme, este módulo te enseña a ganar la pelea de manos para abrir los ataques. Trabajarás el blast double, el high crotch y la pierna simple con cabeza adentro y afuera, junto con sus finalizaciones. Sumarás el snap down y el front headlock, que castigan al rival que baja la cabeza. También armarás una defensa en capas con bloqueos de manos, sprawl, whizzer y crossface, y la costumbre de volver a la guardia para no recibir el re-shot. Practica siempre bajando al compañero con control.",
  "conceptos": [
   {
    "titulo": "Pelea de manos y agarres",
    "explicacion": "El collar tie (mano en la nuca del rival) controla la cabeza y la postura. El control de muñeca niega los golpes y los agarres del rival. El dos contra uno (también llamado agarre ruso) toma un brazo del rival con tus dos manos para abrir la pierna simple o pasar a la espalda. El underhook controla el torso y es la base del clinch grecorromano. El overhook (brazo por encima del brazo del rival) sirve para defender el underhook y para proyectar. La lucha daguestaní vive de esta pelea: romper el agarre, atacar y volver a atacar.",
    "puntos": [
     "La mano interior gana a la mano exterior",
     "Romper el collar tie del rival antes de atacar",
     "Del dos contra uno se pasa a la pierna simple, a la espalda o a un arrastre de brazo",
     "El underhook se pelea con el codo adentro y la cadera cerca"
    ],
    "errores": [
     "Agarrar sin un propósito, con agarres que no llevan a nada",
     "Pelear con las manos sin moverse",
     "Dejar el cuello expuesto al collar tie"
    ]
   },
   {
    "titulo": "Derribo a dos piernas: blast double y high crotch",
    "explicacion": "En el blast double, como lo hace Jordan Burroughs, cambias de nivel, pisas profundo entre los pies del rival y agarras detrás de sus rodillas con la cabeza pegada al costado de su pecho. Luego empujas con la cadera y cortas en ángulo hasta tumbarlo. El high crotch entra a la pierna adelantada del rival con la cabeza afuera y el brazo metido profundo en la entrepierna. Se finaliza levantando, corriendo en ángulo o pasando al double. Sobre los slams: en freestyle y grecorromana está prohibido levantar y estrellar al rival de forma peligrosa, aunque las proyecciones de amplitud con control son legales y valen 4 o 5 puntos. En MMA, bajo las reglas unificadas, el slam es legal salvo que clave al rival de cabeza o cuello. En la práctica, siempre baja al compañero con control.",
    "puntos": [
     "La cabeza va a un costado del rival, nunca al centro",
     "Las manos detrás de las rodillas, no en los tobillos",
     "Penetrar con la cadera, no solo con los brazos",
     "Cortar el ángulo para terminar el derribo"
    ],
    "errores": [
     "Abrazar solo con los brazos sin meter la cadera",
     "Quedarse de rodillas sin seguir empujando",
     "Hacer slams sobre el compañero en la práctica"
    ]
   },
   {
    "titulo": "Pierna simple con cabeza adentro y cabeza afuera, y sus finalizaciones",
    "explicacion": "En la pierna simple con cabeza adentro, tu cabeza va contra el pecho o las costillas del rival, por dentro de su pierna atrapada. Desde ahí finalizas con run the pipe (llevar la pierna atrapada hacia afuera y abajo mientras giras en diagonal y empujas con la cabeza), cambiando al double o levantando la pierna y barriendo la otra. Esta posición no evita el whizzer, que sigue siendo la principal defensa del rival. Lo que te protege es mantener la cabeza arriba y pegada, con la postura recta. En la pierna simple con cabeza afuera (sweep single) atacas la pierna adelantada con la cabeza fuera de la cadera del rival y finalizas girando hacia afuera o levantando la pierna. Al levantar la pierna atrapada, pégala a tu cadera, apriétala entre tus muslos y endereza la espalda para recuperar la postura.",
    "puntos": [
     "Pegar la pierna atrapada al cuerpo, no sostenerla con los brazos estirados",
     "Elegir la finalización según la reacción del rival",
     "Cabeza arriba, pegada y postura recta contra el whizzer",
     "En guardia zurda, la misma mecánica en espejo"
    ],
    "errores": [
     "Quedarse colgado de la pierna sin un plan",
     "Bajar la cabeza, lo que facilita el whizzer y la guillotina",
     "Dar vueltas sin terminar el derribo"
    ]
   },
   {
    "titulo": "Snap down y front headlock",
    "explicacion": "El snap down castiga al rival que se inclina o baja la cabeza. Desde el collar tie y el control de una muñeca, tiras su cabeza hacia abajo y adelante mientras das un paso atrás. Si cae sobre las manos, lo controlas desde el front headlock: su cabeza queda bajo tu pecho, un brazo rodea su cuello y el otro pasa por debajo de su axila. Desde ahí giras a su espalda (go-behind) para puntuar. En MMA y grappling esta posición también abre la guillotina. El control se hace con el peso del pecho, no tirando del cuello. En la práctica no hagas el tirón de golpe, y si aplicas una guillotina, hazlo solo con un compañero que sepa rendirse y suelta apenas palmee.",
    "puntos": [
     "Tirar la cabeza hacia abajo y adelante mientras das un paso atrás",
     "Controlar con el peso del pecho sobre la cabeza del rival",
     "Del front headlock se pasa al go-behind",
     "Cuando tú atacas, cabeza arriba para no caer en el front headlock"
    ],
    "errores": [
     "Tirar del cuello con fuerza y de golpe",
     "Quedarse quieto en el front headlock sin girar a la espalda",
     "Apretar el cuello en la práctica como si fuera una estrangulación"
    ]
   },
   {
    "titulo": "Defensa en capas: bloqueos abajo, whizzer, crossface y re-shot",
    "explicacion": "La defensa tiene tres líneas. La primera son las manos: los bloqueos abajo (down blocks) frenan la cabeza y los hombros del tirador antes de que llegue a tus piernas. La segunda es la cadera, con el sprawl. La tercera es el whizzer: un overhook profundo sobre el brazo del rival, con tu cadera pegada y metida hacia él, presionando hacia abajo y hacia afuera sobre su hombro mientras alejas la pierna atrapada. El crossface pasa tu antebrazo por la cara del rival para girarle la cabeza y romper su postura. Después de defender, el rival puede volver a tirar enseguida (re-shot), así que recupera la guardia al instante o pasa a atacar con un go-behind. En la práctica, haz el crossface y el control de cabeza con fuerza moderada, sin golpear la cara ni torcer el cuello del compañero.",
    "puntos": [
     "Primera línea manos, segunda cadera y sprawl, tercera whizzer",
     "Whizzer con la cadera metida, presión abajo y afuera sobre el hombro y la pierna atrapada alejándose",
     "Después de defender, puntuar con go-behind o contraataque",
     "Volver a la guardia al instante para no recibir el re-shot",
     "Control de cabeza seguro, sin torcer el cuello"
    ],
    "errores": [
     "Hacer whizzer sin pegar la cadera",
     "Quedarse encima mirando y dejar que el rival tire otra vez",
     "Aplicar el crossface con fuerza excesiva en la práctica"
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Pelea de manos con objetivo",
    "como": "1. En guardia frente al compañero, sin tirar derribos. 2. Ganas un punto si consigues un dos contra uno, un underhook o rompes el collar tie del rival. 3. Cuenten los puntos en cada ronda. 4. Muévete mientras peleas las manos, no te quedes quieto.",
    "dosis": "5 rondas de 1 min, 30 s de descanso",
    "nivel": "intermedio",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Blast double en shadow",
    "como": "1. Lanza un golpe o un amago. 2. Cambia de nivel y da el paso de penetración profundo. 3. Simula el agarre detrás de las rodillas con la cabeza a un costado. 4. Empuja con la cadera y corta el ángulo. 5. Vuelve a la guardia.",
    "dosis": "4 series de 5 repeticiones por lado",
    "nivel": "intermedio",
    "min": 6,
    "solo": true
   },
   {
    "nombre": "Blast double con compañero",
    "como": "1. Desde el golpe o amago, cambia de nivel y entra al double. 2. Agarra detrás de las rodillas con la cabeza a un costado del pecho. 3. Empuja con la cadera y corta en ángulo. 4. Baja al compañero con control, sin slam. 5. Cambien de rol.",
    "dosis": "4 series de 5 repeticiones por lado",
    "nivel": "intermedio",
    "min": 10,
    "solo": false
   },
   {
    "nombre": "Finalizaciones de pierna simple",
    "como": "1. Empieza con la pierna simple ya agarrada, cabeza adentro y postura recta. 2. El compañero da resistencia progresiva. 3. Practica run the pipe una ronda. 4. Practica levantar y barrer la siguiente. 5. Practica cambiar al double la última. 6. Cambien de rol dentro de cada ronda, a mitad de tiempo.",
    "dosis": "3 rondas de 1 min por finalización, 30 s de descanso",
    "nivel": "intermedio",
    "min": 14,
    "solo": false
   },
   {
    "nombre": "Snap down a go-behind",
    "como": "1. Desde el collar tie y el control de una muñeca, haz el snap down con un paso atrás, sin tirón brusco. 2. El compañero cae sobre las manos de forma cooperativa. 3. Asegura el front headlock con el peso del pecho. 4. Gira a su espalda y termina detrás de él. 5. Cambien de rol.",
    "dosis": "3 series de 6 repeticiones por lado",
    "nivel": "intermedio",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Whizzer y crossface: defensa y puntuación",
    "como": "1. El compañero entra a la pierna simple. 2. Defiendes con whizzer, cadera metida y presión sobre su hombro. 3. Agregas crossface con fuerza moderada para girarle la cabeza. 4. Haces go-behind para puntuar. 5. Vuelves a la guardia enseguida para evitar el re-shot.",
    "dosis": "3 series de 8 repeticiones por lado",
    "nivel": "intermedio",
    "min": 12,
    "solo": false
   }
  ],
  "recursos": [
   {
    "titulo": "3 formas de FINALIZAR un DERRIBO de pierna - Técnicas de lucha olímpica",
    "url": "https://www.youtube.com/watch?v=8oeZa8SGrR8",
    "plataforma": "youtube",
    "autor": "Legion de Campeones Wrestling",
    "idioma": "es",
    "nivel": "intermedio",
    "por_que": "Un club de lucha olímpica muestra en español tres formas de terminar un derribo de pierna. Observa cómo la finalización cambia según la reacción del rival."
   },
   {
    "titulo": "Signature Move: Jordan BURROUGHS' (USA) Double Leg",
    "url": "https://www.youtube.com/watch?v=Wy-a8VfNsVo",
    "plataforma": "youtube",
    "autor": "United World Wrestling",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "El double leg del campeón olímpico de freestyle en el canal oficial de la federación mundial. Mira la profundidad del paso y cómo usa la cadera, no solo los brazos."
   },
   {
    "titulo": "How to do the blast Double Leg for BJJ",
    "url": "https://www.tiktok.com/@isakivanovicjj/video/7357670987971759368",
    "plataforma": "tiktok",
    "autor": "@isakivanovicjj",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Clip corto para repasar el blast double aplicado al grappling. Úsalo como recordatorio rápido antes de entrenar."
   },
   {
    "titulo": "Jordan Burroughs Blast Double Breakdown",
    "url": "https://www.youtube.com/watch?v=bvPUSWbczSw",
    "plataforma": "youtube",
    "autor": "No confirmado (análisis de Jordan Burroughs)",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Análisis detallado del blast double."
   },
   {
    "titulo": "Running the Pipe off the Head Inside Single Leg",
    "url": "https://www.youtube.com/watch?v=vsUwsVbK2rg",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Finalización clásica de la pierna simple con cabeza adentro."
   },
   {
    "titulo": "Clearing Collar Tie to 2 on 1 Wrestling Technique by Lenny Merkin",
    "url": "https://www.youtube.com/watch?v=t3XCH252-M8",
    "plataforma": "youtube",
    "autor": "Lenny Merkin",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Pelea de manos: romper el collar tie y pasar al dos contra uno."
   },
   {
    "titulo": "Turn Defense into Points with a Whizzer and Crossface from 2x All American Dan Vallimont",
    "url": "https://www.youtube.com/watch?v=GIR8llCEYKg",
    "plataforma": "youtube",
    "autor": "Dan Vallimont",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Whizzer y crossface para pasar de defender a puntuar."
   }
  ],
  "hitos": [
   "Gano la mano interior y consigo un dos contra uno o un underhook en la mayoría de las rondas de pelea de manos",
   "Termino el blast double con la cabeza a un costado y bajo al compañero con control",
   "Desde la pierna simple elijo entre run the pipe, levantar y barrer o cambiar al double según cómo reacciona el compañero",
   "Hago un snap down al front headlock y llego a la espalda sin tirar del cuello",
   "Defiendo una pierna simple con whizzer y crossface y termino con go-behind",
   "Después de cada defensa vuelvo a la guardia antes de que el compañero pueda tirar otra vez"
  ],
  "id": "fundamentos-2"
 },
 {
  "titulo": "Lucha encadenada daguestaní y clinch grecorromano",
  "corto": "Cadenas",
  "sub": "Encadenar ataques sin pausa, ganar el clinch y controlar arriba",
  "nivel": "avanzado",
  "resumen": "En este nivel unes todo lo anterior en cadenas de ataques, como hace la lucha daguestaní. Cada defensa del rival se convierte en la entrada del siguiente ataque. Sumas el clinch grecorromano contra la pared o la jaula, las zancadillas desde el body lock y los retornos al tatami para que el rival no se levante. Las proyecciones de tronco y los retornos son de alto riesgo y exigen supervisión, buena colchoneta y compañeros que sepan caer.",
  "conceptos": [
   {
    "titulo": "Lucha encadenada (chain wrestling)",
    "explicacion": "La lucha encadenada une los fundamentos sin pausa: un golpe o un amago, el cambio de nivel y el double. Si el rival hace sprawl, cambias a la pierna simple. Si mete whizzer, haces run the pipe o cambias al otro lado. Si baja la cabeza para defender, haces snap down. La idea es que el primer intento prepare el segundo y el tercero, con presión constante de manos y cabeza para desgastar al rival.",
    "puntos": [
     "Cada defensa del rival abre el siguiente ataque",
     "Encadenar dos o tres ataques sin volver a empezar de cero",
     "Mantener la presión de manos y cabeza entre ataques",
     "Trabajar en varios niveles: clinch, piernas y pared o jaula"
    ],
    "errores": [
     "Rendirse después del primer intento",
     "Volver a la guardia lejos y dar tiempo al rival para reacomodarse",
     "Encadenar ataques con la cabeza baja"
    ]
   },
   {
    "titulo": "Clinch grecorromano y proyecciones de tronco",
    "explicacion": "Desde el clinch grecorromano peleas por los dos underhooks, el body lock y el arrastre de brazo (arm drag: tirar del brazo del rival hacia ti y hacia abajo para pasar a su espalda). Desde ahí pasas a proyecciones o a atacar las piernas al estilo freestyle. Contra la jaula o una pared, el que tiene los underhooks y la cadera más baja controla. Las proyecciones de tronco, como el suplex y los lanzamientos de cadera, son de alto riesgo. Se practican primero con muñeco o con un compañero cooperativo, solo con entrenador, sobre colchoneta de grosor de competencia, con compañeros que sepan caer y subiendo la intensidad de a poco. Nunca sueltes al compañero en el aire.",
    "puntos": [
     "Pelear los dos underhooks con la cadera cerca y más baja que la del rival",
     "Del arrastre de brazo se pasa a la espalda o a la pierna simple",
     "Proyecciones primero con muñeco o compañero cooperativo y con entrenador",
     "Nunca soltar al compañero en el aire"
    ],
    "errores": [
     "Intentar un suplex sin base técnica ni compañero adecuado",
     "Proyectar sobre colchoneta delgada",
     "Quedarse en el clinch sin buscar la salida a las piernas"
    ]
   },
   {
    "titulo": "Body lock y zancadillas",
    "explicacion": "El body lock es un abrazo de cintura con las manos cerradas, la cabeza a un costado del rival y el pecho presionando. Desde ahí la escuela daguestaní y el sambo usan zancadillas. En la zancadilla exterior (outside trip) pones tu pierna por detrás del talón del rival y lo empujas en diagonal sobre esa pierna. En la zancadilla interior (inside trip) enganchas su pierna por dentro y lo inclinas hacia el lado contrario. Son legales en freestyle y en MMA, pero no en grecorromana, porque ahí no se pueden usar las piernas. En la práctica acompaña la caída del compañero y no caigas con todo tu peso sobre su pecho o su rodilla.",
    "puntos": [
     "Manos cerradas por debajo de las costillas y cadera pegada",
     "Romper la postura del rival antes de meter la pierna",
     "Empujar en diagonal hacia el talón bloqueado",
     "Acompañar la caída del compañero en la práctica"
    ],
    "errores": [
     "Meter la zancadilla con el rival bien plantado y la postura recta",
     "Torcer la rodilla del compañero al enganchar la pierna",
     "Caer con todo el peso sobre el compañero"
    ]
   },
   {
    "titulo": "Control arriba y retornos al tatami (mat returns)",
    "explicacion": "En MMA no basta con derribar: el rival intentará levantarse, muchas veces usando la jaula. El retorno al tatami consiste en tomarlo por la espalda con un body lock cuando intenta pararse, levantarlo un poco o romperle la base, y llevarlo de nuevo al suelo de costado. Luego controlas sus muñecas y mantienes el peso encima para que no vuelva a levantarse. Este control arriba es una marca del estilo de Khabib. Por seguridad, el retorno se hace de lado y con control, nunca dejando caer al compañero de cabeza, y se entrena primero a velocidad lenta.",
    "puntos": [
     "Body lock por la espalda apenas el rival se levanta",
     "Llevarlo al suelo de costado, nunca de cabeza",
     "Controlar las muñecas después del retorno",
     "Mantener el peso encima para que no vuelva a pararse"
    ],
    "errores": [
     "Dejar que el rival se pare sin seguirlo",
     "Levantarlo alto y soltarlo de golpe",
     "Quedarse quieto encima sin controlar las muñecas"
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Lucha encadenada de 2 a 3 ataques",
    "como": "1. Live situacional desde la guardia. 2. El atacante tiene 20 s para encadenar al menos 2 ataques seguidos, por ejemplo double, pierna simple y arrastre de brazo. 3. El defensor solo defiende, al 50 a 70 % de intensidad en las primeras semanas para evitar lesiones de rodilla y cuello por sprawls violentos. 4. Cambien de rol cada ronda.",
    "dosis": "8 rondas de 20 s de esfuerzo y 40 s de descanso",
    "nivel": "avanzado",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Clinch grecorromano contra la pared o la jaula",
    "como": "1. Empiecen en el clinch con la espalda de uno cerca de la pared. 2. Peleen por los dos underhooks, el body lock y el arrastre de brazo, sin proyecciones de amplitud. 3. Cuando ganes la posición, sal hacia un ataque a las piernas al estilo freestyle. 4. Vuelvan a empezar y cambien quién está contra la pared.",
    "dosis": "4 rondas de 2 min, 1 min de descanso",
    "nivel": "avanzado",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Body lock y zancadillas",
    "como": "1. Empieza con el body lock cerrado y la cabeza a un costado. 2. Rompe la postura del compañero empujando en diagonal. 3. Mete la zancadilla exterior y acompaña su caída. 4. En la siguiente serie, practica la zancadilla interior. 5. Cambien de rol en cada serie.",
    "dosis": "3 series de 5 repeticiones por lado y por zancadilla",
    "nivel": "avanzado",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Retornos al tatami",
    "como": "1. El compañero empieza abajo, sentado o de rodillas. 2. Intenta levantarse al 50 % de intensidad. 3. Lo tomas con body lock por la espalda y lo llevas al suelo de costado, sin soltarlo. 4. Controlas sus muñecas 3 s. 5. Él vuelve a intentarlo hasta terminar la ronda. Cambien de rol cada ronda.",
    "dosis": "4 rondas de 1 min, 1 min de descanso",
    "nivel": "avanzado",
    "min": 8,
    "solo": false
   }
  ],
  "recursos": [
   {
    "titulo": "Contraataques de Grappling: Funk Roll, Reversal, Arm Drag,..",
    "url": "https://www.udemy.com/course/contraataques-de-grappling/",
    "plataforma": "udemy",
    "autor": "Instructor del curso en Udemy",
    "idioma": "es",
    "nivel": "avanzado",
    "por_que": "Curso en español sobre contraataques y arrastre de brazo, útil cuando ya dominas la defensa básica. Enfócate en cómo cada contraataque nace de la defensa del rival.",
    "pago": true
   },
   {
    "titulo": "Whizzer Ankle Capture (Single Leg Defense) - Cary Kolat Wrestling Moves",
    "url": "https://www.youtube.com/watch?v=A5_NabqOldo",
    "plataforma": "youtube",
    "autor": "Cary Kolat",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Defensa avanzada contra la pierna simple, explicada por un entrenador de élite."
   },
   {
    "titulo": "Finishing the Single Leg - All Options and Counters (Talgat Ilyasov)",
    "url": "https://www.youtube.com/watch?v=s3Mm2PcqwpE",
    "plataforma": "youtube",
    "autor": "Talgat Ilyasov",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Entrenador de escuela rusa: un sistema completo de finalizaciones de pierna simple, con lógica de lucha encadenada."
   },
   {
    "titulo": "Far Side Arm Drag From Underhook by Sergei Beloglazov",
    "url": "https://www.youtube.com/watch?v=noNeK8qOPsU",
    "plataforma": "youtube",
    "autor": "Sergei Beloglazov",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Bicampeón olímpico soviético: arrastre de brazo desde el underhook, un puente entre el clinch y el ataque."
   }
  ],
  "hitos": [
   "Encadeno al menos dos ataques seguidos en 20 s sin volver a la guardia lejos",
   "Paso del double a la pierna simple cuando el compañero hace sprawl",
   "Gano los dos underhooks o el body lock contra la pared en la mayoría de las rondas",
   "Del arrastre de brazo llego a la espalda o a la pierna simple",
   "Termino una zancadilla desde el body lock acompañando la caída del compañero",
   "Devuelvo al suelo al compañero que se levanta, de costado y con control, y le controlo las muñecas",
   "Practico proyecciones solo con supervisión y nunca suelto al compañero en el aire"
  ],
  "id": "fundamentos-3"
 },
 {
  "titulo": "Bases de la lucha libre: estilos, puntuación, seguridad y primeros ataques",
  "corto": "Bases",
  "sub": "Entiende el reglamento, aprende a caer y domina tus primeros ataques y defensas.",
  "nivel": "basico",
  "resumen": "Este módulo explica por qué trabajamos con la lucha libre olímpica (freestyle) con enfoque daguestaní y qué tomamos de la grecorromana. Aprenderás cómo se puntúa en freestyle para saber qué buscar en cada intercambio. Antes de derribar a nadie aprenderás a caer y a entrenar con seguridad. Después verás la postura, el cambio de nivel y el paso de penetración, que son la base de todos los derribos. Con eso aprenderás el double leg, el single leg, el sprawl para defenderte, el snap down y el duck under. Todo se describe para guardia ortodoxa, con el pie izquierdo adelante. Si eres zurdo, haz lo mismo con el lado contrario.",
  "conceptos": [
   {
    "titulo": "Estilos de lucha y por qué elegimos freestyle con cadenas daguestaníes",
    "explicacion": "La freestyle o lucha libre olímpica (reglas UWW) permite atacar por debajo y por encima de la cintura, así que puedes usar derribos a las piernas y proyecciones de tronco. La grecorromana prohíbe agarrar por debajo de la cintura y también usar las piernas para derribar, así que no permite zancadillas ni barridos: todo se decide en el clinch de tronco con proyecciones y peso. El folkstyle o collegiate, que se practica en escuelas y universidades de EE. UU., premia el control arriba (riding time en la universidad), las escapadas, los reversals y los near falls, y no da puntos por un rollo rápido de exposición como en la libre. Para MMA, BJJ y defensa personal conviene la libre, porque tiene el repertorio completo: piernas y tronco. La escuela daguestaní, la región rusa donde se formaron luchadores como Khabib Nurmagomedov e Islam Makhachev, destaca por encadenar ataques sin soltar al rival y por su control de cadera y de muñecas. De la grecorromana tomamos el clinch de tronco, muy útil contra la jaula y contra rivales que se quedan erguidos.",
    "puntos": [
     "En freestyle se permiten ataques a las piernas y al tronco.",
     "En grecorromana solo se ataca el tronco y no se usan las piernas para derribar, por eso es ideal para estudiar clinch y proyecciones.",
     "El folkstyle premia el control arriba, las escapadas, los reversals y los near falls.",
     "Una cadena significa que tu primer ataque prepara el segundo."
    ],
    "errores": [
     "Creer que la grecorromana es más útil para MMA, cuando renuncia a todos los derribos a las piernas.",
     "Aprender técnicas sueltas sin conectarlas entre sí.",
     "Pensar que en grecorromana se puede terminar un body lock con zancadilla."
    ]
   },
   {
    "titulo": "Puntuación en freestyle (UWW)",
    "explicacion": "Un derribo con control (takedown) vale 2 puntos, y 4 si el rival cae directo en posición de peligro, con la espalda expuesta al tapiz. Una exposición vale 2 puntos: ocurre cuando giras al rival y su espalda queda mirando al tapiz en un ángulo menor de 90 grados, por ejemplo con un gut wrench (giro de cintura). Sacar al rival del área (push out o step out) vale 1 punto. Una proyección de gran amplitud vale 5 puntos si el rival cae directo en posición de peligro y 4 si no. Si un luchador es pasivo, el árbitro le impone un periodo de actividad de 30 segundos. Si en ese tiempo ninguno de los dos puntúa, el rival recibe 1 punto. Se gana por caída, con los dos omóplatos pegados al tapiz, o por superioridad técnica: 10 puntos de ventaja en libre y 8 en grecorromana. Los valores cambian a veces, así que consulta el reglamento UWW vigente.",
    "puntos": [
     "Takedown 2 puntos, o 4 si cae directo en peligro.",
     "Exposición 2 puntos y salida del área 1 punto.",
     "Gran amplitud 4 o 5 puntos según cómo caiga el rival.",
     "Superioridad técnica a 10 puntos en libre y a 8 en grecorromana.",
     "Presionar hacia el borde obliga al rival a salir o a arriesgar, y la salida te da 1 punto."
    ],
    "errores": [
     "Rodar sobre tu propia espalda y regalar puntos de exposición.",
     "Quedarte pasivo esperando el contragolpe y recibir un periodo de actividad.",
     "Confiar en valores de memoria sin revisar el reglamento de la temporada."
    ]
   },
   {
    "titulo": "Seguridad, caídas y hábitos de entrenamiento",
    "explicacion": "Antes de practicar derribos tienes que saber caer. En la caída de lado (breakfall) llevas la barbilla al pecho, caes sobre el costado y golpeas el tapiz con el brazo extendido a unos 45 grados del cuerpo. Nunca pongas la mano estirada para frenar la caída, porque así se rompen muñecas, codos y clavículas. Calienta siempre al menos 10 minutos antes de luchar. Entrena sobre tapiz, nunca sobre suelo duro. Aumenta la intensidad poco a poco: primero sin resistencia, luego con resistencia ligera y solo al final en combate. Si algo duele en el cuello o en una articulación, para y avisa. La lucha tiene mucho contacto de piel, así que dúchate justo después de entrenar, lava la ropa cada vez, cubre las heridas y no entrenes si tienes hongos o infecciones en la piel. Los puentes de cuello solo se hacen con progresión y con apoyo de manos al principio, nunca con cargas grandes.",
    "puntos": [
     "Barbilla al pecho y caer de lado, nunca sobre la nuca.",
     "No frenes la caída con la mano estirada.",
     "Calentamiento completo y progresión de intensidad.",
     "Higiene de piel y ropa después de cada sesión."
    ],
    "errores": [
     "Practicar derribos sin haber aprendido a caer.",
     "Entrenar a máxima intensidad desde el primer día.",
     "Ir a entrenar con una infección de piel."
    ]
   },
   {
    "titulo": "Postura, cambio de nivel y paso de penetración",
    "explicacion": "La postura de lucha tiene los pies a la anchura de los hombros o un poco más, el pie izquierdo adelante, las rodillas flexionadas, la espalda recta, la cabeza arriba y los codos cerca de las costillas. Te mueves con pasos cortos, sin cruzar los pies. El cambio de nivel consiste en bajar la cadera doblando las rodillas, no la espalda, justo antes de atacar. El paso de penetración (penetration step) es la entrada a las piernas: desde el nivel bajo das un paso largo con el pie de adelante entre los pies del rival, apoyas un momento la rodilla de ese lado en el tapiz si hace falta y traes el pie de atrás para volver a la postura. Mantén la cabeza arriba y la espalda recta durante toda la entrada. Por seguridad, la rodilla apoya suave en el tapiz, no la dejes caer de golpe.",
    "puntos": [
     "Rodillas flexionadas, espalda recta y cabeza arriba.",
     "Bajas el nivel con las piernas antes de entrar.",
     "El pie de adelante entra profundo entre los pies del rival.",
     "Tu cadera queda debajo de la suya al terminar la entrada."
    ],
    "errores": [
     "Agachar la espalda y bajar la cabeza al entrar.",
     "Atacar desde lejos sin cambiar de nivel antes.",
     "Golpear el tapiz con la rodilla en cada entrada."
    ]
   },
   {
    "titulo": "Double leg y single leg básicos",
    "explicacion": "En el double leg (derribo a dos piernas) cambias de nivel, entras con el paso de penetración y pones tu cabeza pegada a su costado o a su pecho, con las manos detrás de sus rodillas. Empuja con la cadera hacia delante y gira en ángulo, como si corrieras alrededor de él, para tumbarlo de lado. No intentes levantarlo solo con los brazos. En el single leg (derribo a una pierna) atacas su pierna delantera: entras, abrazas la pierna a la altura del muslo o la rodilla con la cabeza pegada a su cuerpo, te levantas con la espalda recta y terminas, por ejemplo, girando y llevando su pierna hacia ti mientras empujas con el hombro. En los dos casos la cabeza nunca cuelga delante de su cuerpo, porque así te pueden atrapar el cuello.",
    "puntos": [
     "Cabeza pegada a su cuerpo, nunca colgando delante.",
     "En el double, empuja con la cadera y gira en ángulo.",
     "En el single, ataca la pierna delantera y levántate con la espalda recta.",
     "Termina en control encima del rival."
    ],
    "errores": [
     "Levantar al rival con la espalda en vez de empujar con la cadera.",
     "Quedarte de rodillas sin terminar el derribo.",
     "Dejar la cabeza por delante y regalar el cuello."
    ]
   },
   {
    "titulo": "Sprawl: la defensa básica contra los derribos",
    "explicacion": "El sprawl es la defensa principal contra un ataque a las piernas. Cuando el rival entra, lanzas tus piernas hacia atrás y abiertas, bajas la cadera hacia el tapiz y pones tu peso sobre su espalda o sus hombros. Al mismo tiempo usa las manos para bloquear su cabeza y sus hombros, y después da la vuelta hacia su espalda (go-behind). Quedarte con las caderas altas o con las rodillas en el tapiz le deja terminar el derribo.",
    "puntos": [
     "Piernas atrás y abiertas, cadera abajo.",
     "Tu peso cae sobre sus hombros o su espalda.",
     "Manos activas en su cabeza y sus hombros.",
     "Del sprawl pasas a su espalda."
    ],
    "errores": [
     "Hacer el sprawl con las caderas altas.",
     "Caer de rodillas en vez de lanzar las piernas atrás.",
     "Quedarte encima sin intentar pasar a la espalda."
    ]
   },
   {
    "titulo": "Snap down y front headlock con go-behind",
    "explicacion": "Desde un collar tie, que es tu mano en la nuca del rival, tira de su cabeza hacia abajo y hacia ti al mismo tiempo que das un paso atrás. Eso es el snap. Cuando el rival apoye las manos en el tapiz o quede con la cabeza baja, pasa al front headlock (control frontal de cabeza): un brazo rodea su cabeza con un chin strap, que es la mano agarrando por debajo de su barbilla, y el otro brazo controla su brazo por el tríceps o la muñeca. Pon el pecho pesado sobre su nuca. Desde ahí sal en ángulo hacia el lado del brazo que controlas y rodéalo hasta su espalda (go-behind). Por seguridad, controla con el pecho y el hombro, no torciendo el cuello, y nunca aprietes el chin strap contra la tráquea. Nada de torcer el cuello del compañero en el entrenamiento.",
    "puntos": [
     "El snap es tirón y paso atrás al mismo tiempo, no solo fuerza de brazos.",
     "Un brazo controla la cabeza y el otro controla su brazo.",
     "Pecho pesado sobre su nuca.",
     "Sal en ángulo hacia el lado del brazo atrapado."
    ],
    "errores": [
     "Ir de frente contra su cabeza en vez de salir en ángulo.",
     "Apretar el cuello o la tráquea en vez de controlar con el pecho.",
     "Controlar solo la cabeza y dejarle los dos brazos libres para agarrar tus piernas."
    ]
   },
   {
    "titulo": "Duck under",
    "explicacion": "El duck under consiste en pasar la cabeza por debajo del brazo del rival para llegar a su espalda. Funciona mejor contra rivales que empujan con collar tie o con los brazos extendidos. Con tu mano en su codo o tríceps, levanta su codo hacia arriba. Al mismo tiempo, con tu otra mano en su nuca, tira de su cabeza hacia abajo. Baja el nivel con las piernas, pasa tu cabeza por debajo de su axila y da un paso profundo con el pie del lado por el que pasas, detrás de su talón, girando la cadera. Empuja hacia arriba con la cabeza contra su hombro para despejar el brazo. Terminas a su espalda con un body lock, es decir, las manos cerradas alrededor de su cintura.",
    "puntos": [
     "Levanta su codo y tira de su cabeza hacia abajo al mismo tiempo.",
     "Bajas con las piernas, no con la espalda.",
     "El pie del lado por el que pasas entra profundo detrás de su talón.",
     "Termina cerrando las manos en su cintura."
    ],
    "errores": [
     "Agachar la espalda en vez de bajar con las piernas.",
     "Quedarte de frente sin terminar de pasar a la espalda.",
     "Usarlo contra un rival que no empuja y no te da el brazo."
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Caídas básicas (breakfalls)",
    "como": "Sobre tapiz, practica la caída de lado. Empieza sentado, luego en cuclillas. Lleva la barbilla al pecho, cae sobre el costado y golpea el tapiz con el brazo extendido a unos 45 grados del cuerpo. Nunca frenes con la mano estirada. Añade rodadas hacia delante sobre el hombro.",
    "dosis": "3 series de 8 caídas por lado más 6 rodadas",
    "nivel": "basico",
    "min": 8,
    "solo": true
   },
   {
    "nombre": "Sombra de postura, cambio de nivel y penetración",
    "como": "Adopta tu guardia con el pie izquierdo adelante, rodillas flexionadas y cabeza arriba. Muévete adelante, atrás y en círculo con pasos cortos. Cada 5 segundos baja el nivel doblando las rodillas y haz un paso de penetración, apoyando la rodilla suave, y vuelve a la postura. Alterna con un sprawl: piernas atrás, cadera abajo y vuelta a la postura.",
    "dosis": "4 rondas de 2 minutos con 30 segundos de descanso",
    "nivel": "basico",
    "min": 10,
    "solo": true
   },
   {
    "nombre": "Double leg y single leg con compañero",
    "como": "El compañero está en postura sin resistir. Cambia de nivel, entra con el paso de penetración y termina el double leg empujando con la cadera y girando en ángulo. Después repite con el single leg a su pierna delantera. El compañero cae de lado como aprendiste en las caídas.",
    "dosis": "3 series de 6 repeticiones de cada derribo",
    "nivel": "basico",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Sprawl reactivo",
    "como": "El compañero entra a tus piernas a velocidad media. Haz el sprawl con la cadera abajo, controla su cabeza y sus hombros y pasa a su espalda. Cambien de rol en cada serie.",
    "dosis": "4 series de 6 repeticiones con 30 segundos de descanso",
    "nivel": "basico",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Snap down a go-behind con compañero",
    "como": "Toma un collar tie. Haz el snap tirando y dando un paso atrás. Cuando el compañero baje la cabeza, pasa al front headlock con un brazo en su cabeza y el otro en su tríceps. Sal en ángulo y rodea hasta su espalda. El compañero da una resistencia ligera. Alterna los lados en cada serie.",
    "dosis": "3 series de 8 repeticiones por lado",
    "nivel": "basico",
    "min": 10,
    "solo": false
   },
   {
    "nombre": "Duck under desde collar tie",
    "como": "El compañero empuja con un collar tie suave. Levanta su codo con una mano y tira de su cabeza hacia abajo con la otra. Pasa la cabeza bajo su axila, da el paso profundo detrás de su talón girando la cadera y cierra las manos en su cintura a su espalda. Vuelve a la posición inicial y repite.",
    "dosis": "3 series de 8 repeticiones por lado",
    "nivel": "basico",
    "min": 10,
    "solo": false
   }
  ],
  "recursos": [
   {
    "titulo": "The Rules of Freestyle Wrestling - EXPLAINED!",
    "url": "https://www.youtube.com/watch?v=gp-hWr-opUc",
    "plataforma": "youtube",
    "autor": "No confirmado (canal no visible en el resultado)",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Explica la puntuación y las reglas de la freestyle: base para saber qué buscar en las cadenas."
   },
   {
    "titulo": "5 Olympic Wrestling Takedowns for Jiu-Jitsu & MMA ▶ THAT YOU SHOULD KNOW",
    "url": "https://www.youtube.com/watch?v=BhY7rFKBE9w",
    "plataforma": "youtube",
    "autor": "No confirmado (canal en español)",
    "idioma": "es",
    "nivel": "basico",
    "por_que": "Derribos de lucha olímpica aplicados a BJJ y MMA, en español."
   },
   {
    "titulo": "Snap and Go Behind Drill For Front Headlocks by Dan Vallimont",
    "url": "https://www.youtube.com/watch?v=OiSbknmetCo",
    "plataforma": "youtube",
    "autor": "Dan Vallimont",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Drill directo de snap down y go-behind desde front headlock."
   },
   {
    "titulo": "Duck Under Basics - Cary Kolat Wrestling Moves",
    "url": "https://www.youtube.com/watch?v=YG_TGrljpM4",
    "plataforma": "youtube",
    "autor": "Cary Kolat",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Los fundamentos del duck under explicados por Cary Kolat, entrenador de élite."
   },
   {
    "titulo": "Ankle Pick Takedown From Collar Tie with Nate Jackson",
    "url": "https://www.youtube.com/watch?v=Zgr9qNe6YSQ",
    "plataforma": "youtube",
    "autor": "Nate Jackson",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Ankle pick desde collar tie, la entrada más sencilla para empezar."
   },
   {
    "titulo": "Ankle Pick 101 (TikTok)",
    "url": "https://www.tiktok.com/@thewrestlingdad149/video/7305149541337091371",
    "plataforma": "tiktok",
    "autor": "@thewrestlingdad149",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Clip corto con ankle pick cercano y cruzado, para repasar rápido."
   },
   {
    "titulo": "Wrestling Skills and Drills - High Crotch and Single Leg",
    "url": "https://www.udemy.com/course/wrestling-skills-and-drills-high-crotch-and-single-leg/",
    "plataforma": "udemy",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Curso de Udemy centrado en single leg y high crotch, base para las cadenas; disponible con la membresía.",
    "pago": true
   }
  ],
  "hitos": [
   "Puedo explicar en voz alta qué permite y qué prohíbe cada estilo: libre, grecorromana y folkstyle.",
   "Sé cuánto vale un takedown, una exposición, una salida y una gran amplitud en libre.",
   "Caigo de lado con la barbilla al pecho, sin frenar con la mano, a los dos lados.",
   "Hago 10 pasos de penetración seguidos con la espalda recta y la cabeza arriba.",
   "Termino el double leg y el single leg contra un compañero sin resistencia, girando en ángulo.",
   "Defiendo una entrada a velocidad media con sprawl de cadera baja y paso a la espalda.",
   "Hago el snap con un paso atrás y llego al front headlock sin torcer el cuello del compañero.",
   "Completo el duck under y termino con las manos cerradas en la cintura del compañero en 8 de 10 intentos."
  ],
  "id": "cadenas-1"
 },
 {
  "titulo": "Cadenas daguestaníes: amarres, arm drag, ankle pick, single a double, underhooks y par terre",
  "corto": "Cadenas",
  "sub": "Encadena ataques sin soltar al rival, gana el clinch de tronco y puntúa en el suelo.",
  "nivel": "intermedio",
  "resumen": "Aquí está el corazón del estilo daguestaní: cada defensa del rival te abre el siguiente ataque. Primero aprenderás a ganar la pelea de manos con los amarres principales, entre ellos el two-on-one. Después verás el arm drag, el ankle pick y el low single, y cómo enlazarlos con el single, el double y la zancadilla exterior. También trabajarás el pummeling para ganar los underhooks y el body lock, que en MMA es el derribo de jaula por excelencia. Por último aprenderás a puntuar en el suelo (par terre) con el gut wrench y el leg lace. La meta es que nunca vuelvas a la guardia para reiniciar: mantienes la cabeza pegada y la cadera cerca entre ataque y ataque.",
  "conceptos": [
   {
    "titulo": "Pelea de manos y amarres: collar tie, inside tie y two-on-one",
    "explicacion": "Casi todos los ataques nacen de un amarre. El collar tie es tu mano en su nuca, con el codo pegado a su pecho para que no se acerque. El inside tie es tu mano por dentro de su brazo, en su bíceps o en su codo, y te permite levantar su brazo para entrar a las piernas o al duck under. El two-on-one, o amarre ruso, es usar tus dos manos sobre uno de sus brazos: una en la muñeca y otra en el bíceps o el tríceps, con tu pecho pegado a su hombro. Es muy típico de la escuela daguestaní porque el rival se queda con un solo brazo para defenderse y desde ahí salen el single, el arm drag y el go-behind. La pelea de manos significa ganar estos amarres y romper los suyos sin quedarte quieto.",
    "puntos": [
     "Cada ataque empieza desde un amarre ganado.",
     "En el collar tie, el codo bloquea su pecho.",
     "En el two-on-one, tus dos manos controlan uno de sus brazos y tu pecho va pegado a su hombro.",
     "Rompe sus amarres antes de que se asienten."
    ],
    "errores": [
     "Atacar sin amarre y desde lejos.",
     "Agarrar con las manos sin usar el peso del cuerpo.",
     "Quedarte quieto con un amarre sin atacar."
    ]
   },
   {
    "titulo": "Arm drag (arrastre de brazo)",
    "explicacion": "Agarra su muñeca derecha con tu mano izquierda. Tu mano derecha cruza por delante de tu cuerpo y agarra su tríceps desde detrás del brazo, justo por encima del codo. Arrastra su brazo a través de tu cuerpo mientras das un paso en ángulo hacia fuera y llevas tus caderas hacia delante. Eso te deja a su lado o a su espalda. Desde ahí encadenas a low single, a double o a body lock. Es también un movimiento clásico del clinch grecorromano.",
    "puntos": [
     "Tu mano derecha agarra el tríceps justo por encima del codo, desde detrás del brazo.",
     "Tira del tríceps, no solo de la muñeca.",
     "Tus caderas van hacia delante mientras arrastras.",
     "Encadena enseguida a una pierna o a la espalda."
    ],
    "errores": [
     "Arrastrar sin moverte, lo que le devuelve el ángulo al rival.",
     "Agarrar el antebrazo o muy lejos del codo.",
     "Arrastrar solo con la muñeca."
    ]
   },
   {
    "titulo": "Ankle pick y low single",
    "explicacion": "Ankle pick (recoger el tobillo): con un collar tie, empuja y tira para que el rival dé un paso y cargue peso en su pie delantero. Baja el nivel y recoge ese tobillo mientras empujas su cabeza hacia abajo y en diagonal hacia atrás, por encima del pie que atacas. Así no puede retirar el pie ni dar un paso para recuperar el equilibrio, y cae hacia atrás. Si empujas hacia el lado contrario, le dejas recuperarse. Low single (single bajo): entras muy bajo al tobillo o la espinilla de su pie delantero, con la cabeza por fuera de su pierna y pegada a su rodilla o su cadera, y atrapas la pierna entre tus piernas o abrazada contra tu pecho. Terminas subiendo a un single normal o pasando a la espalda. Los dos son ataques de bajo compromiso, pero en MMA tu cabeza baja queda expuesta a rodillazos, sobre todo contra la jaula, a guillotinas y a sprawl con golpes. Por eso mantén la cabeza pegada a su cuerpo y vuelve a la postura rápido si el ataque no entra.",
    "puntos": [
     "Primero haz que cargue peso en el pie que vas a atacar.",
     "En el ankle pick, empuja la cabeza hacia abajo y atrás por encima del pie atacado.",
     "En el low single, la cabeza va por fuera de su pierna y pegada a su cuerpo.",
     "Vuelve a la postura rápido si el ataque no entra."
    ],
    "errores": [
     "Ir al tobillo sin desequilibrar antes.",
     "Empujar la cabeza hacia el lado contrario y dejar que se recupere.",
     "Dejar la cabeza colgando delante de su cuerpo, lo que invita a la guillotina.",
     "Quedarte abajo con la cabeza baja frente a un rival que puede dar rodillazos."
    ]
   },
   {
    "titulo": "Cadenas daguestaníes: single, double y zancadilla",
    "explicacion": "El principio es sencillo: cada defensa del rival te abre el siguiente ataque. Ejemplo 1: entras a single y el rival retira la pierna atacada; cambias a la otra pierna o a double. Si en cambio hace un sprawl fuerte, con las caderas atrás y abajo, pasa a la otra pierna, a ankle pick o a go-behind. Ejemplo 2: el double se frena; haces zancadilla interior o exterior (inside trip u outside trip) hacia el lado donde carga su peso. En la zancadilla exterior tu pierna no barre: engancha (reap) su pantorrilla o su corva por fuera mientras empujas en diagonal hacia atrás por encima de esa pierna. Ejemplo 3: tienes el single alto y él salta sobre una pierna; haces ankle pick a la otra pierna. Ejemplo 4: haces snap down, él reacciona levantando la cabeza y entras a double. El estilo daguestaní mantiene la cabeza pegada al rival y la cadera cerca, sin soltar el contacto entre ataques.",
    "puntos": [
     "No sueltes al rival entre un ataque y el siguiente.",
     "Ataca en la dirección de su reacción.",
     "Contra un sprawl fuerte, cambia a la otra pierna, al ankle pick o al go-behind.",
     "En la zancadilla exterior, engancha su pantorrilla y empuja en diagonal sobre esa pierna."
    ],
    "errores": [
     "Volver a la guardia para reiniciar después de cada intento.",
     "Seguir tirando la cadena entera aunque el primer ataque ya funcione.",
     "Insistir con el double contra un sprawl fuerte con las caderas atrás.",
     "Barrer con la pierna en vez de enganchar."
    ]
   },
   {
    "titulo": "Clinch grecorromano: pummeling y underhooks",
    "explicacion": "El pummeling es la pelea por meter los brazos por dentro del rival para conseguir underhooks, es decir, tu brazo por debajo de su axila. Con un underhook subes su axila, le quitas base y abres el body lock, el arm drag, el duck under o el throw-by, que es empujarlo de lado para pasar a su espalda. Mantén los codos pegados y las caderas activas: el underhook se gana metiendo la cadera, no con la fuerza del bíceps.",
    "puntos": [
     "Mete la mano por dentro con la palma hacia su omóplato.",
     "Levanta el codo para cortar su base.",
     "Postura: cabeza arriba y caderas debajo de los hombros.",
     "Usa la cadera para ganar el underhook."
    ],
    "errores": [
     "Pelear el underhook solo con el brazo.",
     "Quedarte cuadrado frente al rival sin crear ángulo.",
     "Separar los codos del cuerpo y dejar que él meta sus brazos."
    ]
   },
   {
    "titulo": "Body lock y derribos de tronco",
    "explicacion": "En el body lock cierras las manos alrededor de su cintura o zona lumbar, por encima de las caderas y bajo sus costillas, con agarre de muñeca o palma con palma. Pega tu cabeza a su pecho o a su costado y aprieta los codos para que no te meta un underhook. Para derribar tienes dos opciones. Primera: body lock en ángulo con zancadilla exterior, enganchando su pierna por fuera; es legal en libre y en MMA, pero no en grecorromana. Segunda: sagging, que es apretar, pegar tu cadera a la suya, colgar tu peso hacia un lado y llevarlo al suelo; en grecorromana el body lock se termina así, con peso o con proyecciones. En MMA es el derribo de jaula por excelencia. Por seguridad, cae encima del rival y no debajo, y nunca lances la cabeza del compañero contra el tapiz.",
    "puntos": [
     "Manos bajas en la cintura y cadera pegada a él.",
     "Cabeza pegada a su pecho o costado y codos apretados.",
     "Combina el peso con la zancadilla, o solo el peso en grecorromana.",
     "Cae arriba, en posición de control."
    ],
    "errores": [
     "Cerrar las manos a la altura de la espalda alta.",
     "Levantar sin pegar la cadera.",
     "Separar los codos y dejar que el rival meta un underhook.",
     "Usar zancadilla en un contexto de grecorromana."
    ]
   },
   {
    "titulo": "Par terre: gut wrench y leg lace",
    "explicacion": "En freestyle, cuando el rival queda boca abajo en el tapiz, puedes puntuar con giros de exposición, 2 puntos por cada giro. El gut wrench (giro de cintura): desde un lado, cierra las manos alrededor de su cintura con agarre de muñeca, pega tu pecho a su espalda y tu cadera a su cadera, y gira llevándolo sobre su espalda mientras tú ruedas pegado a él. El leg lace o ankle lace (cerrojo de tobillos): atrapas sus dos tobillos cruzados con tus brazos y tu pecho, y rodas para girarlo sobre su espalda. Por seguridad, en el leg lace gira con todo el cuerpo y no tuerzas sus rodillas con fuerza: el compañero debe girar contigo, y si dice basta, sueltas enseguida. Si estás abajo, mantén los codos pegados, la cadera baja y no te quedes plano sobre las rodillas sin moverte.",
    "puntos": [
     "Cada giro de exposición en el suelo vale 2 puntos.",
     "En el gut wrench, tu cadera pegada a la suya y tu pecho en su espalda.",
     "En el leg lace, gira con todo el cuerpo, sin forzar sus rodillas.",
     "Abajo, codos pegados y cadera baja."
    ],
    "errores": [
     "Cerrar el gut wrench con las manos lejos de su cuerpo.",
     "Girar el leg lace torciendo las rodillas del compañero.",
     "Quedarte quieto abajo esperando a que te giren."
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Sombra de cadenas",
    "como": "Solo, en guardia, simula la secuencia completa: cambio de nivel, paso de penetración al single, cambio a la otra pierna, vuelta a la postura y entrada a double. Después practica el paso en ángulo del arm drag y el gesto de enganchar con la pierna en la zancadilla exterior. Mantén la espalda recta y la cabeza arriba.",
    "dosis": "4 rondas de 2 minutos con 30 segundos de descanso",
    "nivel": "intermedio",
    "min": 10,
    "solo": true
   },
   {
    "nombre": "Pelea de manos con two-on-one",
    "como": "Frente a frente, los dos buscan collar tie, inside tie y two-on-one. Cuando uno consigue el two-on-one, entra a single o a arm drag y vuelven a empezar. El otro solo puede romper amarres, no atacar.",
    "dosis": "4 rondas de 1 minuto con 30 segundos de descanso, cambiando de rol cada ronda",
    "nivel": "intermedio",
    "min": 6,
    "solo": false
   },
   {
    "nombre": "Arm drag en cadena",
    "como": "Agarra su muñeca y su tríceps y haz el arm drag con paso en ángulo. Si consigues el ángulo, entra a low single. Si el compañero gira hacia ti para recuperar la posición, entra a double. El compañero alterna sus reacciones.",
    "dosis": "4 rondas de 1 minuto con 30 segundos de descanso",
    "nivel": "intermedio",
    "min": 6,
    "solo": false
   },
   {
    "nombre": "Ankle pick reactivo",
    "como": "Toma un collar tie. El compañero da un paso adelante al azar. En cuanto apoye el peso en ese pie, baja el nivel y recoge el tobillo empujando su cabeza hacia abajo y atrás por encima del pie atacado. Vuelve a la postura y repite.",
    "dosis": "3 rondas de 2 minutos con 1 minuto de descanso",
    "nivel": "intermedio",
    "min": 9,
    "solo": false
   },
   {
    "nombre": "Pummeling continuo",
    "como": "Pecho con pecho, alternen la pelea por meter los underhooks a un ritmo constante, con codos pegados y caderas activas. Cada 10 segundos, uno de los dos intenta un body lock o un throw-by. Cambien quién ataca en cada ronda.",
    "dosis": "5 rondas de 1 minuto con 30 segundos de descanso",
    "nivel": "intermedio",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Cadena daguestaní de 3 ataques",
    "como": "Entra a single. El compañero retira la pierna atacada y tú cambias a double. Él frena el double y tú terminas con zancadilla exterior, enganchando su pantorrilla y empujando en diagonal. Primero el compañero da las reacciones en ese orden. Cuando salga fluido, las da al azar, incluido un sprawl fuerte que te obliga a pasar a la otra pierna o al go-behind.",
    "dosis": "3 series de 6 cadenas por lado",
    "nivel": "intermedio",
    "min": 15,
    "solo": false
   },
   {
    "nombre": "Par terre: gut wrench y leg lace",
    "como": "El compañero está boca abajo apoyado en manos y rodillas, con resistencia ligera. Haz el gut wrench hacia los dos lados. Después pasa al leg lace y gira despacio, con todo el cuerpo y sin forzar sus rodillas. En la última ronda el de abajo defiende de verdad a intensidad media.",
    "dosis": "3 rondas de 2 minutos con 1 minuto de descanso, cambiando de rol",
    "nivel": "intermedio",
    "min": 9,
    "solo": false
   }
  ],
  "recursos": [
   {
    "titulo": "2025 Freestyle & Greco Rules Refresher and Tactics",
    "url": "https://www.youtube.com/watch?v=scyuBov3dx8",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Actualización 2025 de las reglas de libre y grecorromana, con táctica."
   },
   {
    "titulo": "Dean Heil Fake Shot Snap-Down Go-Behind",
    "url": "https://www.youtube.com/watch?v=mWQu040Dn70",
    "plataforma": "youtube",
    "autor": "Dean Heil",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Cadena de finta de entrada, snap down y go-behind de un doble campeón NCAA."
   },
   {
    "titulo": "Keys To The Duck Under Takedown by John Smith",
    "url": "https://www.youtube.com/watch?v=qz4CbdryyJc",
    "plataforma": "youtube",
    "autor": "John Smith",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Detalles del duck under de John Smith, campeón olímpico y mundial de freestyle."
   },
   {
    "titulo": "Arm Drag to a Low Single: Wrestling Moves with Cary Kolat",
    "url": "https://www.youtube.com/watch?v=dvch4cRNGSE",
    "plataforma": "youtube",
    "autor": "Cary Kolat",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Cadena de arm drag a low single, justo lo que trabaja este módulo."
   },
   {
    "titulo": "David Taylor Technique: Outside Step Outside Reach Ankle Pick",
    "url": "https://www.youtube.com/watch?v=194gqX41S0Q",
    "plataforma": "youtube",
    "autor": "David Taylor",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Ankle pick de David Taylor, campeón olímpico de freestyle."
   },
   {
    "titulo": "Matt Lindland & Andy Bisek Technique Series: Greco-Roman Underhooks",
    "url": "https://www.youtube.com/watch?v=u9pbPpFjAuE",
    "plataforma": "youtube",
    "autor": "Matt Lindland y Andy Bisek",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Underhooks grecorromanos con un medallista olímpico (Lindland) y un medallista mundial (Bisek)."
   },
   {
    "titulo": "Henry Cejudo Wrestling Moves: Hip Toss",
    "url": "https://www.youtube.com/watch?v=HmojkDqXIK4",
    "plataforma": "youtube",
    "autor": "Henry Cejudo",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Hip toss explicado por un campeón olímpico de freestyle y de UFC."
   }
  ],
  "hitos": [
   "Gano el two-on-one en la pelea de manos y entro a un ataque desde ahí.",
   "Hago el arm drag agarrando el tríceps por encima del codo y termino a un lado o a la espalda del compañero.",
   "Recojo el tobillo en el ankle pick empujando la cabeza por encima del pie atacado, y el compañero no puede recuperar el equilibrio.",
   "Encadeno single, double y zancadilla exterior sin soltar al compañero ni volver a la guardia.",
   "Ante un sprawl fuerte, cambio a la otra pierna o al go-behind sin pensarlo.",
   "Gano el underhook en el pummeling con la cadera y paso a body lock al menos una vez por ronda.",
   "Termino el body lock cayendo encima, con zancadilla o solo con peso.",
   "Giro al compañero con el gut wrench a los dos lados con resistencia ligera."
  ],
  "id": "cadenas-2"
 },
 {
  "titulo": "Proyecciones de tronco, contraataques y lucha contra la pared",
  "corto": "Proyecciones",
  "sub": "Proyecta al rival con control, convierte cada defensa en tu ataque y levántate desde abajo.",
  "nivel": "avanzado",
  "resumen": "En este nivel trabajas las proyecciones de tronco: hip toss o headlock, lateral drop y nociones de suplex. Son técnicas de alto riesgo, así que la progresión empieza por caídas más exigentes y siempre se hace con colchoneta gruesa y entrenador. También aprenderás las contras clave contra los ataques que ya conoces, al estilo daguestaní: defiendes y atacas enseguida. Verás cómo levantarte desde abajo usando la pared, algo esencial para MMA. Por último, lo pones todo a prueba en situaciones de pared y en sparring con puntuación.",
  "conceptos": [
   {
    "titulo": "Proyecciones: hip toss o headlock, lateral drop y suplex",
    "explicacion": "Headlock o hip toss (proyección de cadera): con cabeza y brazo, o con un underhook, giras metiendo tu cadera por delante y por debajo de la suya y lo proyectas por encima. Es arriesgado: si fallas, te toman la espalda. Lateral drop: con body lock o con overhook y underhook, metes un pie entre los suyos, pegas tu cadera a la suya y caes en diagonal girando para quedar encima. Suplex: arqueo hacia atrás desde un body lock, girando en el aire para caer encima del rival. Seguridad: domina primero las caídas y practica en colchoneta gruesa, con compañeros que sepan caer y con un entrenador presente. En el hip toss, quien recibe debe saber caer de lado, y quien proyecta no debe soltar el brazo ni la cabeza para no dejarlo caer sobre el cuello. En el suplex y el lateral drop tu propia cabeza también corre riesgo: gira sobre tu hombro y nunca caigas sobre tu nuca. No hagas slams sobre la cabeza o el cuello, gira siempre para caer de lado o encima, y no hagas suplex en sparring hasta tener años de base. En la calle o sobre una superficie dura, una proyección así puede causar lesiones graves.",
    "puntos": [
     "Tu cadera va por debajo de su centro de gravedad.",
     "Gira para caer arriba del rival.",
     "No sueltes el brazo ni la cabeza del compañero durante la proyección.",
     "Gira sobre tu hombro para proteger tu propia nuca.",
     "Progresión: caídas, luego compañero estático o maniquí, luego resistencia ligera."
    ],
    "errores": [
     "Intentar el suplex sin dominar las caídas.",
     "Soltar al compañero en el aire.",
     "Caer sobre tu propia nuca en el suplex o el lateral drop.",
     "Intentar el headlock sin meter bien la cadera y regalar la espalda."
    ]
   },
   {
    "titulo": "Contras clave",
    "explicacion": "Contra el double leg: sprawl con las caderas bajas y paso a la espalda. Contra el single leg: baja la cadera, pon tu mano en su cabeza para alejarla, usa el whizzer, que es un overhook o brazo por encima del suyo, y saca la pierna hacia atrás; el crossface, que es tu antebrazo cruzando su cara para girarle la cabeza, le quita la postura. Contra el ankle pick: retira el pie y baja las caderas. Contra el body lock: baja la cadera, mete un underhook o pon el antebrazo en su cuello o su cara para separar las caderas, y rompe sus manos. Contra el headlock: baja tu cadera por debajo de la suya antes de que gire, bloquea su cadera con tu mano o rodéala por detrás y toma su espalda. Contra el duck under: brazo pegado a la costilla y cambio de ángulo. Contra el snap down: cabeza arriba, cadera debajo de los hombros y manos activas. El estilo daguestaní también encadena las contras: defiendes y atacas enseguida.",
    "puntos": [
     "Defiende con la cadera, no solo con las piernas.",
     "Cada contra debe terminar en tu propio ataque.",
     "Contra el body lock, separa las caderas antes de que cierre las manos.",
     "Contra el headlock, baja tu cadera antes de que gire."
    ],
    "errores": [
     "Hacer el sprawl con las caderas altas.",
     "Quedarte defendiendo sin pasar al contraataque.",
     "Separar el brazo de la costilla y regalar el duck under.",
     "Esperar a estar en el aire para defender el headlock."
    ]
   },
   {
    "titulo": "Levantarse desde abajo y lucha contra la pared",
    "explicacion": "En MMA y en defensa personal no puedes quedarte abajo. Si estás sentado o de rodillas contra la pared o la jaula, apoya la espalda en ella, pon una mano en el tapiz y los pies debajo de ti, y sube con las piernas mientras controlas sus manos con tu otra mano. Este movimiento se llama wall walk. Una vez de pie, consigue un underhook, saca la cadera de la pared y gira para cambiar de posición. Si el rival te sujeta con un body lock desde atrás, controla sus manos, separa sus dedos o su agarre y gira hacia él. Desde arriba, el estilo daguestaní hace lo contrario: con body lock por detrás o con control de muñecas, lleva al rival de vuelta al suelo cada vez que se levanta (mat return), cayendo con control y sin lanzarlo de cabeza.",
    "puntos": [
     "Espalda contra la pared, pies debajo de ti y sube con las piernas.",
     "Controla sus manos mientras te levantas.",
     "De pie, underhook y giro para salir de la pared.",
     "Desde arriba, devuelve al rival al suelo con control."
    ],
    "errores": [
     "Quedarte sentado esperando contra la pared.",
     "Levantarte sin controlar sus manos.",
     "Lanzar al compañero de cabeza al hacer el mat return."
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Caídas avanzadas",
    "como": "Sobre colchoneta gruesa, repasa las caídas de lado desde de pie, a los dos lados. Después practica caídas por encima de un compañero agachado en cuatro apoyos: rueda sobre él y cae de lado con la barbilla al pecho. Añade rodadas hacia delante y hacia atrás sobre el hombro. Hazlo con entrenador presente.",
    "dosis": "3 series de 8 caídas por lado",
    "nivel": "avanzado",
    "min": 10,
    "solo": false
   },
   {
    "nombre": "Progresión de proyecciones",
    "como": "Empieza con tus caídas. Luego practica el lateral drop y el hip toss con un compañero que coopera, sobre colchoneta gruesa y con entrenador presente. Gira siempre para caer encima, sin soltar el brazo ni la cabeza del compañero. No hagas suplex hasta dominar las caídas.",
    "dosis": "10 caídas más 5 proyecciones por lado, 1 o 2 veces por semana",
    "nivel": "avanzado",
    "min": 20,
    "solo": false
   },
   {
    "nombre": "Wall walk en solitario",
    "como": "Siéntate con la espalda contra una pared acolchada. Apoya una mano en el suelo, mete los pies debajo de ti y sube con las piernas manteniendo la espalda pegada a la pared, con la otra mano simulando controlar las manos del rival. Una vez de pie, gira la cadera para salir de la pared y vuelve a sentarte.",
    "dosis": "4 series de 6 repeticiones con 30 segundos de descanso",
    "nivel": "avanzado",
    "min": 8,
    "solo": true
   },
   {
    "nombre": "Situacional de pared o jaula con body lock",
    "como": "Usa una pared acolchada. Empiecen con un body lock contra la pared. Uno busca el derribo con sagging o con zancadilla exterior, y el otro defiende con underhook y cadera atrás. Si el defensor se libera, intenta su propio ataque. Si cae, intenta levantarse con el wall walk. Cambien de rol cada ronda.",
    "dosis": "6 rondas de 45 segundos con 30 segundos de descanso",
    "nivel": "avanzado",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Contra y ataque",
    "como": "El compañero ataca al azar con double, single, ankle pick, body lock o snap down a intensidad media. Tú aplicas la contra correspondiente y enseguida lanzas tu ataque, por ejemplo sprawl con crossface y go-behind. Cambien de rol cada ronda.",
    "dosis": "4 rondas de 2 minutos con 1 minuto de descanso",
    "nivel": "avanzado",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Sparring de puntuación freestyle",
    "como": "Combates cortos con la puntuación UWW: takedowns, salidas del área y exposición. Busca presionar al rival hacia el borde y encadenar ataques. Sin suplex ni proyecciones de alto riesgo en el sparring.",
    "dosis": "3 combates de 3 minutos con 1 minuto de descanso",
    "nivel": "avanzado",
    "min": 12,
    "solo": false,
    "tipo": "vivo",
    "freq": 2
   }
  ],
  "recursos": [
   {
    "titulo": "The Gadisov Duck Under - A Quick Duck Under Setup that Works!",
    "url": "https://www.youtube.com/watch?v=NACs-17Xayo",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Preparación de duck under al estilo del luchador daguestaní Gadisov."
   },
   {
    "titulo": "Pinch Headlock Hip Throw by Adam Wheeler",
    "url": "https://www.youtube.com/watch?v=wDUF0iAxUjo",
    "plataforma": "youtube",
    "autor": "Adam Wheeler",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Proyección de headlock por un medallista olímpico de grecorromana (Adam Wheeler sí existe). Practícala solo con caídas dominadas."
   },
   {
    "titulo": "Signature Move: Roman VLASOV'S (RUS) Suplex",
    "url": "https://www.youtube.com/watch?v=8ZAeKHLLhTk&vl=en",
    "plataforma": "youtube",
    "autor": "Serie 'Signature Move' (canal no confirmado; probablemente United World Wrestling)",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "El suplex del doble campeón olímpico de grecorromana Roman Vlasov. Solo para ver y entender: no se practica sin entrenador ni base de caídas."
   }
  ],
  "hitos": [
   "Caigo de lado desde de pie y por encima de un compañero, con la barbilla al pecho y sin golpear la nuca.",
   "Hago el lateral drop y el hip toss con compañero cooperativo y siempre termino encima sin soltarlo.",
   "Defiendo un single con cadera baja y whizzer y paso a mi propio ataque.",
   "Contra un body lock en la pared, consigo el underhook y salgo antes de que me derriben.",
   "Me levanto con el wall walk contra la pared controlando las manos del compañero.",
   "En sparring de puntuación, encadeno al menos dos ataques seguidos y consigo puntos por takedown o por salida."
  ],
  "id": "cadenas-3"
 },
 {
  "titulo": "Base abajo y escapes: aprende a levantarte siempre",
  "corto": "Abajo",
  "sub": "Los estilos de lucha, la postura en cuatro apoyos, la defensa de par terre y los escapes stand-up, sit-out y hip heist.",
  "nivel": "basico",
  "resumen": "Este módulo es la base de todo el trabajo en el suelo. Primero entiendes qué aporta cada estilo de lucha y por qué la ruta se basa en la lucha libre olímpica (freestyle) con el enfoque de cadenas de Daguestán, completada con el clinch de la grecorromana y la cultura de levantarse del folkstyle. Luego aprendes a mantener una postura sólida abajo, a defender los giros del freestyle y a pelear las manos antes de moverte. Por último trabajas los tres escapes clave: stand-up, sit-out y hip heist. También empiezas a fortalecer el cuello de forma segura y conoces los riesgos del corte de peso.",
  "conceptos": [
   {
    "titulo": "Los tres estilos y por qué elegimos freestyle",
    "explicacion": "Hay tres estilos principales. La grecorromana solo permite agarres de cintura para arriba: no puedes atacar las piernas del rival ni usar las tuyas para derribar. Por eso es excelente para el clinch y las proyecciones de tronco, pero te deja sin la mitad de las opciones. La lucha libre olímpica (freestyle) permite atacar las piernas y también proyectar con el tronco, así que es el estilo más completo y el que mejor se transfiere al MMA, al BJJ y a la defensa personal. El folkstyle es el estilo escolar y universitario de EE. UU. y premia el control arriba, llamado riding, y el escape o levantarse abajo. Por eso esta ruta usa el freestyle como base, con el enfoque daguestaní de encadenar técnicas; suma de la grecorromana los underhooks (brazo por debajo de la axila), el body lock (abrazo de cuerpo) y los arm drags; y toma del folkstyle la costumbre de levantarse siempre. En el suelo hay diferencias importantes. En freestyle, según las reglas actuales de la UWW, no hay par terre ordenado: se llega al suelo tras un derribo y el árbitro da muy poco tiempo, así que arriba se busca exponer la espalda rápido con giros como el gut wrench o el leg lace, que valen 2 puntos cada uno, y abajo se aguanta compacto hasta que el árbitro los pone de pie. En grecorromana la lucha puede reanudarse en par terre tras una sanción por pasividad. Como dato, la superioridad técnica se da con 10 puntos de diferencia en freestyle y con 8 en grecorromana.",
    "puntos": [
     "Freestyle: piernas y tronco, giros rápidos para exponer la espalda como el gut wrench y el leg lace.",
     "Grecorromana: sin piernas; aporta clinch, underhooks, body lock, arm drags y proyecciones.",
     "Folkstyle: riding, breakdowns, media Nelson y escapes; muy útil para el MMA.",
     "En MMA y en la calle, quedarte boca abajo y plano es peligroso por los golpes y la toma de espalda: hay que levantarse."
    ],
    "errores": [
     "Usar en MMA la defensa boca abajo del freestyle; ahí te expone a golpes y a la toma de espalda.",
     "Creer que la grecorromana es el estilo más completo; no poder usar las piernas reduce tus opciones.",
     "Ignorar el folkstyle por ser colegial: su control arriba es oro para el ground and pound (golpear desde arriba)."
    ]
   },
   {
    "titulo": "Posición abajo: base, postura y control de manos",
    "explicacion": "En la posición de referee, el de abajo está en cuatro apoyos. Pon las rodillas a la anchura de la cadera y las manos en el tapiz, un poco por delante de las rodillas. Lleva el peso un poco hacia atrás, hacia los talones, con la cabeza arriba y la espalda recta. Antes de moverte, lo primero es ganar las manos (hand fighting): pelear los dedos o la muñeca del brazo que te rodea la cintura. Sin control de manos, ningún escape funciona.",
    "puntos": [
     "Cabeza arriba y codos pegados al cuerpo para que no te metan brazos.",
     "Peso hacia atrás, no hacia adelante, para que no te aplasten.",
     "Pelea las manos del rival antes de intentar levantarte.",
     "Muévete en cuanto empieza la acción: el primero que se mueve suele ganar la posición."
    ],
    "errores": [
     "Apoyarse sobre los codos o bajar la cabeza.",
     "Intentar levantarse sin haber controlado ninguna mano.",
     "Quedarse quieto esperando a ver qué hace el de arriba."
    ]
   },
   {
    "titulo": "Defensa de par terre en freestyle: bloquear el gut wrench y el leg lace",
    "explicacion": "En freestyle, cuando caes abajo y no puedes levantarte en el momento, tu objetivo es no ser girado hasta que el árbitro los ponga de pie. Contra el gut wrench, baja la cadera, abre las rodillas, mete el codo del lado del ataque pegado a la cadera y gira la cadera hacia el tapiz, alejándola del rival. Contra el leg lace, separa los pies y no dejes que te crucen los tobillos; mantén las rodillas abiertas y la cadera pesada. Si te giran, gira con el rival en la misma dirección en lugar de quedarte trabado con la rodilla, para no lesionarte. Esta defensa es solo para las reglas de freestyle: en MMA o en la calle la prioridad es levantarte.",
    "puntos": [
     "Cadera baja y rodillas abiertas para tener una base ancha.",
     "Codo pegado a la cadera del lado que te atacan.",
     "Pies separados para que no te crucen los tobillos.",
     "Si el giro ya está hecho, acompáñalo; no bloquees con la rodilla torcida."
    ],
    "errores": [
     "Quedarse con la cadera alta, lo que deja el gut wrench servido.",
     "Juntar los pies, lo que facilita el leg lace.",
     "Resistir un giro ya cerrado torciendo la rodilla."
    ]
   },
   {
    "titulo": "Escapes: stand-up, sit-out y hip heist",
    "explicacion": "En el stand-up (levantarse) echas la espalda contra el pecho del rival, controlas su mano de la cintura y te levantas con la espalda recta. En el suelo no existe guardia ortodoxa o zurda: qué pie adelantas primero depende del lado en que está el de arriba y del sistema de tu entrenador; según la escuela se levanta primero la pierna interior, la más cercana al rival, o la exterior. Ya de pie, pelas sus manos (peeling, romper el agarre) y giras de frente hacia el rival. En el sit-out sacas una pierna y te sientas de lado para crear espacio. Desde ahí, con los codos cerrados, haces un hip heist: girar la cadera por debajo para quedar de frente o detrás del rival. El hip heist comparte la mecánica de cadera con el technical stand-up del BJJ, que es levantarse desde sentado apoyando una mano y un pie, y con el wrestle-up del MMA.",
    "puntos": [
     "Stand-up: espalda contra su pecho, cabeza atrás y la mano del rival controlada.",
     "Rompe el agarre de sus manos ya de pie y gira de frente hacia el rival.",
     "Sit-out y hip heist: busca un ángulo, nunca te sientes recto.",
     "Encadena: si falla el stand-up, ve al sit-out; si falla, al hip heist."
    ],
    "errores": [
     "Levantarse inclinado hacia adelante, lo que permite que te devuelvan al suelo.",
     "Sentarse con la espalda plana, que deja servida la media Nelson.",
     "Girar dándole la espalda al rival en vez de girar de frente hacia él."
    ]
   },
   {
    "titulo": "Corte de peso: precaución",
    "explicacion": "La deshidratación extrema con saunas, trajes de plástico, ayunos o diuréticos está asociada a golpes de calor, problemas renales y muertes en la lucha y en el MMA. Además reduce el rendimiento y la capacidad de recuperación. Lo recomendable es competir cerca de tu peso natural y controlarlo con la alimentación durante semanas. Si vas a competir, hazlo con un profesional de la nutrición deportiva o un médico. Para entrenar de forma recreativa no hace falta cortar peso.",
    "puntos": [
     "Controla el peso con semanas de margen, no con días.",
     "Evita los diuréticos, los laxantes y los trajes de sauna.",
     "Si el corte fue extremo, la rehidratación no recupera del todo el rendimiento.",
     "Consulta a un médico o nutricionista si vas a competir."
    ],
    "errores": [
     "Intentar bajar entre el 5 y el 8 % del peso en 24 a 48 horas.",
     "Entrenar deshidratado.",
     "Copiar los cortes de los profesionales del UFC sin supervisión."
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Base y hand fighting desde abajo",
    "como": "1. El de abajo se pone en cuatro apoyos, en posición de referee, con el peso hacia atrás y la cabeza arriba. 2. El de arriba intenta romper la base al 50 % de fuerza, empujando o tirando de brazos y cintura. 3. El de abajo mantiene la postura y pelea las manos del de arriba, sobre todo la que rodea la cintura. 4. Al terminar la ronda cambian de rol. Cualquiera de los dos dice alto o da dos palmadas para parar si algo duele.",
    "dosis": "4 rondas de 1 minuto por persona, con 30 segundos de descanso",
    "nivel": "basico",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Defensa de giros boca abajo",
    "como": "1. El de abajo se pone boca abajo con la cadera baja, las rodillas abiertas y los codos pegados. 2. El de arriba intenta un gut wrench o cruzar los tobillos para un leg lace al 50 % de fuerza. 3. El de abajo gira la cadera hacia el tapiz, mete el codo y separa los pies. 4. Si el giro ya está cerrado, el de abajo lo acompaña sin bloquear con la rodilla. 5. Cambian de rol.",
    "dosis": "4 rondas de 45 segundos por persona, con 30 segundos de descanso",
    "nivel": "basico",
    "min": 10,
    "solo": false
   },
   {
    "nombre": "Stand-up técnico con compañero",
    "como": "1. Empieza abajo en cuatro apoyos con el compañero arriba. 2. Controla la mano que te rodea la cintura. 3. Echa la espalda contra su pecho y levántate con la espalda recta y la cabeza atrás. 4. Ya de pie, pela sus manos y gira de frente hacia él. 5. El compañero aumenta poco a poco la resistencia, sin pasar del 50 % al principio.",
    "dosis": "3 series de 10 repeticiones por lado",
    "nivel": "basico",
    "min": 15,
    "solo": false
   },
   {
    "nombre": "Sit-out y hip heist en solitario",
    "como": "1. Ponte en cuatro apoyos sobre el tapiz. 2. Saca una pierna por debajo y siéntate de lado, en ángulo (sit-out). 3. Gira la cadera por debajo para quedar otra vez en cuatro apoyos mirando hacia el otro lado (hip heist). 4. Vuelve a la posición inicial y alterna los lados. Mantén la cabeza arriba todo el tiempo.",
    "dosis": "3 series de 30 segundos, con 30 segundos de descanso",
    "nivel": "basico",
    "min": 5,
    "solo": true
   },
   {
    "nombre": "Fortalecimiento de cuello seguro",
    "como": "1. Pon la mano en la frente y empuja la cabeza contra ella sin moverla, suave y de forma progresiva. 2. Repite con la mano detrás de la cabeza y luego a cada lado. 3. Más adelante, solo con la técnica revisada por un entrenador, pasa a puentes de luchador apoyando primero las manos, sobre tapiz blando, con poco peso y sin rotaciones bruscas. 4. Si tienes antecedentes de lesión cervical o sientes hormigueo en los brazos, no hagas puentes y consulta a un médico.",
    "dosis": "2 series de 10 segundos por dirección, 3 veces por semana",
    "nivel": "basico",
    "min": 5,
    "solo": true
   }
  ],
  "recursos": [
   {
    "titulo": "THE EASIEST ESCAPE FROM BOTTOM POSITION: Short-Sit, Change-Over, Fat-Man Stand-Up",
    "url": "https://www.tiktok.com/@pursuitwrestling/video/7343697074325556511",
    "plataforma": "tiktok",
    "autor": "@pursuitwrestling (Pursuit Wrestling)",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Clip corto con una cadena de escape desde abajo."
   },
   {
    "titulo": "Stand Up Escape: Basic Bottom Wrestling Moves and Technique For Beginners",
    "url": "https://www.youtube.com/watch?v=g6XGABVzZ4E",
    "plataforma": "youtube",
    "autor": "Fundamental Wrestling",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "El stand-up desde abajo explicado para principiantes, paso a paso. Es la técnica base del drill de stand-up técnico."
   },
   {
    "titulo": "Basics - Wrestling Bottom Moves",
    "url": "https://www.youtube.com/watch?v=DRpBx3qg6GE",
    "plataforma": "youtube",
    "autor": "David Griffiths",
    "idioma": "en",
    "nivel": "basico",
    "por_que": "Repaso de los movimientos básicos desde abajo para salir de la posición de referí. Míralo antes del sit-out y el hip heist."
   }
  ],
  "hitos": [
   "mantengo la posición de referee 1 minuto contra un compañero al 50 % sin apoyar los codos ni bajar la cabeza.",
   "controlo una mano del rival antes de iniciar cualquier escape, sin tener que pensarlo.",
   "evito ser girado con gut wrench o leg lace durante 45 segundos contra un compañero al 50 %.",
   "completo un stand-up con la espalda recta y giro de frente al rival en ambos lados.",
   "encadeno sit-out y hip heist sin sentarme con la espalda plana.",
   "explico en pocas frases qué aporta cada estilo (freestyle, grecorromana y folkstyle) y por qué la base es el freestyle."
  ],
  "id": "suelo-1"
 },
 {
  "titulo": "Control arriba y giros de par terre: aplanar, inclinar y girar",
  "corto": "Arriba",
  "sub": "Riding, breakdowns, media Nelson, gut wrench, leg lace y acondicionamiento específico.",
  "nivel": "intermedio",
  "resumen": "Una vez que sabes defenderte y levantarte, pasas a dominar desde arriba. Aprendes a aplanar al rival, a inclinarlo y a usar la media Nelson con una mecánica correcta y segura. Después sumas los dos giros clásicos del freestyle, el gut wrench y el leg lace, para exponer la espalda y sumar puntos. Todo se acompaña de un acondicionamiento específico de lucha que te da el cardio y la fuerza útil para sostener ese ritmo.",
  "conceptos": [
   {
    "titulo": "Control arriba (riding): breakdowns, tilt y media Nelson",
    "explicacion": "Arriba, el primer objetivo es aplanar al rival (breakdown). Para eso le quitas un brazo de apoyo con un chop (golpe seco por dentro del codo para doblarle el brazo) o con un control de muñeca, mientras mantienes un tight waist (brazo apretado a la cintura). También puedes quitarle una pierna agarrando su tobillo cercano y empujando con la cadera hacia adelante. Después lo inclinas de lado (tilt), cargando sobre su hombro y su cadera, para exponer la espalda. La media Nelson se aplica así: metes el brazo por debajo de su axila, pones la mano sobre su nuca y llevas su cabeza hacia abajo, hacia el tapiz. Luego caminas en perpendicular hacia su cabeza, con tu pecho encima, para girarlo de espaldas. La Nelson completa (full nelson, las dos manos en la nuca) está prohibida en folkstyle y muy restringida en las reglas de la UWW porque puede lesionar la columna cervical; no la uses en el entrenamiento. En MMA, aplanar al rival y controlarlo sin dejarle apoyar las manos mientras lo golpeas es una parte central del estilo de Khabib.",
    "puntos": [
     "Primero rompe la base y aplana, después gira.",
     "Pecho pegado a su espalda y cadera pesada; no te quedes alto.",
     "El control 2 a 1 (tus dos manos sobre una de sus muñecas) para llegar al tilt es un clásico seguro y eficaz.",
     "Media Nelson: cabeza del rival hacia el tapiz y camina en perpendicular con el pecho encima."
    ],
    "errores": [
     "Agarrarse fuerte sin moverse, lo que le da tiempo al rival para levantarse.",
     "Cargar el peso en tus rodillas en vez de cargarlo sobre el rival.",
     "Aplicar la media Nelson con un tirón brusco del cuello o usar la Nelson completa."
    ]
   },
   {
    "titulo": "Gut wrench (giro de cintura)",
    "explicacion": "Es el giro básico del par terre en freestyle y grecorromana. Te colocas al costado del rival y cierras las manos alrededor de su cintura o abdomen. Evita apretar sobre las costillas flotantes, porque puedes lesionar al compañero en el drilling. Pegas tu pecho y tu cadera a su costado, arqueas o haces un pequeño puente y lo giras sobre ti manteniendo el agarre cerrado, llevando su espalda al tapiz. Existen variantes según la altura del agarre: low gut (bajo), mid level (medio) y high gut (más alto, hacia el pecho). Trabaja desde el lado que prefieras, pero domina los dos.",
    "puntos": [
     "Agarre de mano sobre muñeca o gable grip (palma contra palma) bien cerrado y con los codos pegados.",
     "Pega la cadera al rival: el giro sale de tu cadera y tu arco, no de los brazos.",
     "Sigue girando: los giros consecutivos suman puntos.",
     "Si bloquea un lado, cambia al otro o pasa al leg lace."
    ],
    "errores": [
     "Agarrar sobre las costillas o con los brazos extendidos.",
     "Levantar con la espalda en lugar de arquear y girar, lo que arriesga la zona lumbar.",
     "Pararse después del primer giro en vez de encadenar."
    ]
   },
   {
    "titulo": "Leg lace / ankle lace (lazo de tobillos)",
    "explicacion": "Con el rival en cuatro apoyos o boca abajo, cruzas sus tobillos uno sobre el otro y cierras el lazo apretándolos contra tu pecho con los brazos o los codos. Luego ruedas sobre tu propio cuerpo para que el rival siga el giro y exponga la espalda. Rueda hacia el lado que obliga al rival a girar sobre su espalda, siguiendo la indicación de tu entrenador. Se puede repetir varias veces seguidas y es uno de los motivos por los que muchos combates de freestyle terminan por superioridad técnica. En el drilling, el compañero debe dejarse girar y no bloquear con la rodilla, porque una torsión resistida carga los ligamentos de la rodilla.",
    "puntos": [
     "Un tobillo encima del otro, bien apretados contra tu pecho.",
     "Rueda sobre tu cuerpo hacia el lado que lleva al rival sobre su espalda.",
     "Mantén la cabeza y los hombros bajos para que no te contraataquen.",
     "Entra cuando el rival queda en cuatro apoyos o boca abajo tras un derribo o tras defender con un sprawl (lanzar las piernas atrás)."
    ],
    "errores": [
     "Soltar el lazo al rodar.",
     "Girar sin tener los tobillos realmente bloqueados.",
     "Forzar contra la rodilla: la tensión va en los tobillos y la cadera, nunca torciendo la rodilla."
    ]
   },
   {
    "titulo": "Acondicionamiento específico de lucha",
    "explicacion": "La lucha se gana a menudo por cardio y fuerza útil. Hay dos bases. La primera es mucho volumen de drilling técnico, con repeticiones limpias a buen ritmo. La segunda son los lives (combates en vivo) cortos e intensos. Se completa con sprawls, cargas de compañero como el fireman's carry (llevarlo sobre los hombros) o a la espalda, subida de cuerda y trabajo de cuello progresivo. Los puentes de luchador se añaden solo con técnica supervisada, primero apoyando las manos, sobre tapiz blando y sin rotaciones bruscas. Calienta siempre antes de los lives y deja al menos un día de descanso entre sesiones muy duras.",
    "puntos": [
     "Drilling: sesiones de 15 a 25 minutos, rápidas y técnicamente limpias.",
     "Lives: asaltos de 2 a 3 minutos, con descansos de 30 a 60 segundos.",
     "Cuerda, cargas de compañero y sprawls para la potencia específica.",
     "Cuello: isométricos primero; puentes solo de forma gradual y supervisada."
    ],
    "errores": [
     "Hacer lives todos los días sin descanso, lo que lleva a lesiones.",
     "Entrenar el cuello con cargas pesadas o puentes sin progresión.",
     "Descuidar la técnica cuando aparece el cansancio."
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Breakdown a tilt",
    "como": "1. Empieza arriba con el compañero en cuatro apoyos. 2. Aplánalo con un chop sobre el brazo y tight waist, o agarrando su tobillo cercano y empujando con la cadera. 3. Toma un control 2 a 1 sobre una de sus muñecas. 4. Inclínalo de lado cargando sobre su hombro y su cadera, nunca sobre el cuello. 5. El compañero se deja llevar. Repite y cambia de lado.",
    "dosis": "3 series de 8 repeticiones por lado",
    "nivel": "intermedio",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Gut wrench encadenado",
    "como": "1. Colócate al costado del compañero en cuatro apoyos. 2. Cierra el agarre alrededor de su cintura o abdomen, no sobre las costillas. 3. Pega tu cadera a la suya, arquea y gíralo manteniendo el agarre. 4. Sigue con 2 o 3 giros seguidos mientras el compañero se deja rodar. 5. Cambia de lado.",
    "dosis": "4 series de 5 giros por lado",
    "nivel": "intermedio",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Leg lace con giros consecutivos",
    "como": "1. Con el compañero en cuatro apoyos, cruza sus tobillos, uno sobre el otro. 2. Apriétalos contra tu pecho con los brazos o los codos. 3. Rueda sobre tu cuerpo para que él siga el giro sobre su espalda. 4. Repite el giro hasta 3 veces. 5. El compañero no se resiste y no bloquea con la rodilla.",
    "dosis": "3 series de 6 repeticiones",
    "nivel": "intermedio",
    "min": 10,
    "solo": false
   },
   {
    "nombre": "Top / bottom situacional (lives cortos)",
    "como": "1. Uno empieza arriba y el otro abajo en posición de referee. 2. El de abajo intenta levantarse o escapar con stand-up, sit-out o hip heist. 3. El de arriba intenta aplanar, controlar o girar. 4. Empiecen al 50 % de resistencia y suban hasta el 80 % en las últimas rondas. 5. Al terminar cada ronda, cambian de rol.",
    "dosis": "6 rondas de 30 a 45 segundos, con 30 segundos de descanso, cambiando roles",
    "nivel": "intermedio",
    "min": 8,
    "solo": false,
    "tipo": "vivo",
    "freq": 3
   },
   {
    "nombre": "Circuito de acondicionamiento de lucha",
    "como": "1. Calienta 5 minutos antes de empezar. 2. Sprawls: baja la cadera y lanza las piernas atrás, vuelve a la guardia. 3. Carga al compañero con fireman's carry durante 20 metros, con la espalda recta. 4. Sube la cuerda o, si no tienes, haz dominadas agarrando una toalla colgada. 5. Burpees con salto. Pasa de una estación a otra sin perder la técnica.",
    "dosis": "4 vueltas, 40 segundos de trabajo y 20 segundos de descanso por estación",
    "nivel": "intermedio",
    "min": 20,
    "solo": false,
    "tipo": "fisico",
    "freq": 2
   }
  ],
  "recursos": [
   {
    "titulo": "Leg Lace KOLAT.COM Wrestling Techniques Moves Instruction",
    "url": "https://www.youtube.com/watch?v=FErwbC09ZsI",
    "plataforma": "youtube",
    "autor": "Cary Kolat (KOLAT.COM)",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Técnica base del leg lace de freestyle."
   },
   {
    "titulo": "THE LEG-LACE - Pursuit Wrestling",
    "url": "https://www.tiktok.com/@pursuitwrestling/video/7490964697349475626",
    "plataforma": "tiktok",
    "autor": "@pursuitwrestling (Pursuit Wrestling)",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Repaso rápido del leg lace en formato clip."
   },
   {
    "titulo": "Tiger Style Wrestling Drills - On the Mat",
    "url": "https://www.udemy.com/course/tiger-style-wrestling-drills-on-the-mat/",
    "plataforma": "udemy",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Curso de Udemy con drills de lucha en el tapiz; entra en la membresía anual.",
    "pago": true
   },
   {
    "titulo": "CONDITIONING WORKOUT WITH PRINCETON WRESTLING #training",
    "url": "https://www.youtube.com/watch?v=59R1VNBjxzA",
    "plataforma": "youtube",
    "autor": "Princeton Wrestling (según el título)",
    "idioma": "en",
    "nivel": "intermedio",
    "por_que": "Ejemplo real de una sesión de acondicionamiento de un equipo universitario de lucha."
   }
  ],
  "hitos": [
   "aplano a un compañero que resiste al 50 % y lo inclino con un control 2 a 1 sobre su muñeca.",
   "aplico la media Nelson llevando la cabeza al tapiz y caminando en perpendicular, sin tirones del cuello.",
   "hago 3 gut wrench seguidos con el agarre en la cintura y el giro saliendo de mi cadera, en ambos lados.",
   "cierro el leg lace con los tobillos apretados contra mi pecho y no lo suelto durante el giro.",
   "termino 4 vueltas del circuito de acondicionamiento manteniendo los sprawls técnicamente limpios."
  ],
  "id": "suelo-2"
 },
 {
  "titulo": "Cadenas daguestaníes y suelo de MMA: control, golpes y reja",
  "corto": "MMA",
  "sub": "Encadenamiento estilo Daguestán, wrestle-up contra la reja, clinch de grecorromana y estudio de campeones.",
  "nivel": "avanzado",
  "resumen": "En este módulo unes todo en cadenas, como en la escuela de Daguestán, donde cada reacción del rival abre la siguiente técnica. Luego llevas la lucha al contexto del MMA, donde el de arriba no busca puntos sino controlar y golpear, y el de abajo usa la reja para levantarse. Aprendes el control de muñeca conocido como esposa daguestaní, las reglas de los rodillazos en el suelo y cómo pasar del wrestle-up al clinch de la grecorromana. Cierras con el estudio de campeones de lucha y de MMA, viendo sus combates con un objetivo concreto.",
  "conceptos": [
   {
    "titulo": "Encadenamiento estilo Daguestán en el suelo",
    "explicacion": "La escuela daguestaní no piensa en movimientos aislados sino en cadenas: derribo, aplanar, control de muñeca, giro y vuelta a controlar. Por ejemplo: terminas un single leg (derribo a una pierna), el rival queda en cuatro apoyos y entras al leg lace; si el rival lo bloquea, cambias al gut wrench. En MMA, Khabib y Makhachev aplican la misma idea: derribo contra la reja, control de muñeca, aplanar, golpear y tomar la espalda. Cada reacción del rival abre la siguiente técnica.",
    "puntos": [
     "Piensa en términos de si hace X, voy a Y.",
     "El control de muñeca es el eje de todas las cadenas.",
     "En MMA, cada transición incluye golpes para obligar al rival a reaccionar.",
     "Practica cadenas de 3 técnicas en el drilling antes de probarlas en vivo."
    ],
    "errores": [
     "Insistir en una sola técnica que ya está bloqueada.",
     "Perder el contacto con el rival entre una técnica y otra.",
     "Encadenar sin control: la prioridad es no perder la posición."
    ]
   },
   {
    "titulo": "Lucha para MMA: el suelo con golpes y reja",
    "explicacion": "En MMA, el de arriba no busca puntos por giro sino controlar y golpear. El sistema de Khabib combina dos controles. El primero es el control de muñeca de dos sobre una, incluida la llamada esposa daguestaní (Dagestani handcuff): atrapar una muñeca del rival detrás de su espalda o debajo de su cuerpo para que no pueda apoyarse ni defenderse con ese brazo. El segundo es el control de piernas desde la espalda o la media guardia: atrapar la pierna del rival con las tuyas, por ejemplo con un leg ride (pierna metida entre las suyas) o un body triangle (triángulo de piernas alrededor del cuerpo). Con eso golpea y toma la espalda si el rival se gira. Abajo, se usa el wrestle-up: espalda contra la reja, underhook, levantarse y separarse. Makhachev añade cambios a la espalda y sumisiones. Sobre los rodillazos: con las Reglas Unificadas de EE. UU. están prohibidos a la cabeza de un rival en el suelo, pero se permiten al cuerpo; en otras organizaciones, como ONE o las antiguas reglas de PRIDE, pueden estar permitidos. En cualquier caso, quedarte en cuatro apoyos te expone a golpes y a la toma de espalda.",
    "puntos": [
     "Arriba: control de muñeca y peso sobre la cadera del rival.",
     "Abajo: la reja te ayuda a levantarte con el wrestle-up.",
     "No te quedes en cuatro apoyos: te expones a golpes y a que te tomen la espalda.",
     "Protege la cabeza al levantarte para no recibir una guillotina (estrangulación frontal)."
    ],
    "errores": [
     "Quedarse con la espalda plana en el suelo esperando.",
     "Levantarse con la cabeza baja y recibir una guillotina.",
     "Buscar giros de freestyle contra un rival que golpea."
    ]
   },
   {
    "titulo": "Del wrestle-up al clinch: el aporte de la grecorromana",
    "explicacion": "Cuando te levantas contra la reja quedas en clinch, y ahí la grecorromana es la mejor escuela. El underhook te da control del tronco y te permite girar al rival contra la reja. El body lock (abrazo de cuerpo con las manos cerradas por detrás de su espalda, a la altura de la cintura) te deja controlar su cadera y llevarlo al suelo con un trip (barrido de pierna) o una proyección. El arm drag (tirar de su brazo cruzándolo hacia ti) te lleva a su espalda. Las proyecciones grandes de grecorromana, como el suplex, solo se entrenan con un entrenador, sobre colchoneta de caídas y con un compañero que sepa caer, porque una mala caída sobre la cabeza o el cuello es muy peligrosa.",
    "puntos": [
     "Pelea siempre por el underhook y pega la cabeza a su cara o a su pecho.",
     "Body lock con las manos cerradas en su cintura, no en las costillas.",
     "El arm drag es la vía más rápida a la espalda desde el clinch.",
     "Las proyecciones altas solo con supervisión y colchoneta adecuada."
    ],
    "errores": [
     "Quedarse en clinch con los brazos por fuera (overhooks) sin control del tronco.",
     "Cerrar el body lock con la cadera lejos del rival.",
     "Practicar suplex sin entrenador ni colchoneta de caídas."
    ]
   },
   {
    "titulo": "Atletas a estudiar",
    "explicacion": "Abdulrashid Sadulaev, el Tanque Ruso: presión constante, leg lace y giros devastadores. Jordan Burroughs: double leg (derribo a dos piernas) explosivo y ritmo. Kyle Snyder: presión física y control. Buvaisar Saitiev, checheno nacido y formado en Jasavyurt (Daguestán) que compitió por Rusia y fue tres veces campeón olímpico: la fluidez y la creatividad de la escuela soviética y daguestaní. Khabib Nurmagomedov e Islam Makhachev: cómo aplicar la lucha daguestaní en MMA, sobre todo el control arriba. Mira sus combates fijándote en una sola cosa cada vez, como la posición de las manos, la cadera o las transiciones.",
    "puntos": [
     "Sadulaev para el par terre y la presión.",
     "Burroughs y Snyder para el ritmo y el acabado.",
     "Saitiev para la fluidez y la lucha encadenada.",
     "Khabib y Makhachev para el control arriba en MMA y el uso del peso."
    ],
    "errores": [
     "Ver combates sin un objetivo concreto.",
     "Intentar copiar técnicas para las que todavía no tienes base."
    ]
   }
  ],
  "drills": [
   {
    "nombre": "Cadenas daguestaníes en el suelo",
    "como": "1. Termina un single leg y deja al compañero en cuatro apoyos. 2. Pasa al leg lace y gira. 3. Si el compañero bloquea el lazo, cambia al gut wrench. 4. Si también lo bloquea, vuelve al control de muñeca, aplana y repite la cadena. 5. El compañero da una resistencia moderada para que cada reacción abra la siguiente técnica.",
    "dosis": "5 cadenas por lado, 3 rondas, con 1 minuto de descanso entre rondas",
    "nivel": "avanzado",
    "min": 15,
    "solo": false
   },
   {
    "nombre": "Wrestle-up contra la pared (MMA)",
    "como": "1. Siéntate con la espalda contra la pared y el compañero encima presionando. 2. Gana un underhook. 3. Apoya la mano libre en el suelo o en la pared y sube la espalda por la pared con los pies debajo de la cadera. 4. Levántate con la cabeza arriba, pegada al rival y protegida, sin bajarla. 5. Sepárate o pasa al clinch con underhook o body lock. Cambien de rol cada ronda.",
    "dosis": "4 rondas de 1 minuto por persona, con 30 segundos de descanso",
    "nivel": "avanzado",
    "min": 12,
    "solo": false
   },
   {
    "nombre": "Clinch de grecorromana contra la pared",
    "como": "1. Empiecen de pie en clinch, con uno de espaldas a la pared. 2. Peleen por el underhook al 50 % de fuerza. 3. Quien gana el underhook busca un arm drag a la espalda o cierra un body lock en la cintura. 4. Desde el body lock, termina con un trip suave al tapiz, sin proyecciones altas. 5. Cambien de rol.",
    "dosis": "5 rondas de 1 minuto, con 30 segundos de descanso",
    "nivel": "avanzado",
    "min": 8,
    "solo": false
   },
   {
    "nombre": "Shark tank de suelo",
    "como": "1. Solo para luchadores avanzados con base técnica sólida y bien hidratados. 2. Uno se queda en el centro, abajo o arriba según la ronda. 3. Cada 30 segundos entra un compañero fresco. 4. Un árbitro o entrenador controla la intensidad y para la acción si hay riesgo. 5. Al terminar, rota la persona del centro.",
    "dosis": "1 vez cada 1 o 2 semanas, 3 a 4 minutos por persona",
    "nivel": "avanzado",
    "min": 20,
    "solo": false,
    "tipo": "vivo",
    "freq": 1
   }
  ],
  "recursos": [
   {
    "titulo": "Gutwrench from Leg Lace KOLAT.COM Wrestling Techniques Moves Instruction",
    "url": "https://www.youtube.com/watch?v=o8QMvX1rtSg",
    "plataforma": "youtube",
    "autor": "Cary Kolat (KOLAT.COM)",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Cadena entre leg lace y gut wrench: el encadenamiento del par terre."
   },
   {
    "titulo": "Introduction to Aldatov Leg Lace - Ascend Wrestling Club Technique Instruction",
    "url": "https://www.youtube.com/watch?v=z4NznY4y4Xs",
    "plataforma": "youtube",
    "autor": "Ascend Wrestling Club",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Variante de leg lace asociada al luchador de escuela daguestaní Aldatov."
   },
   {
    "titulo": "28-0 Khabib Nurmagomedov Breakdown On His Dominant Ground Game",
    "url": "https://www.youtube.com/watch?v=gdSkYOKBF6A",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Análisis del control en el suelo de Khabib para aplicar la lucha en MMA."
   },
   {
    "titulo": "Why Islam Makhachev's Wrestling Is Unstoppable",
    "url": "https://www.youtube.com/watch?v=DyPoTqTnwJs",
    "plataforma": "youtube",
    "autor": "No confirmado",
    "idioma": "en",
    "nivel": "avanzado",
    "por_que": "Análisis de la lucha de Makhachev en MMA."
   }
  ],
  "hitos": [
   "encadeno single leg, leg lace y gut wrench sin perder el contacto con el compañero.",
   "atrapo una muñeca del rival con control de dos sobre una y lo mantengo aplanado mientras simulo golpes.",
   "hago un wrestle-up contra la pared con underhook y la cabeza protegida en 4 de cada 5 intentos.",
   "gano el underhook en el clinch y llego a la espalda con arm drag o a un body lock contra un compañero al 50 %.",
   "reacciono a la defensa del compañero cambiando de técnica en lugar de insistir en la bloqueada.",
   "veo un combate de Khabib o Makhachev y explico cómo usan el control de muñeca y el peso."
  ],
  "id": "suelo-3"
 }
];
