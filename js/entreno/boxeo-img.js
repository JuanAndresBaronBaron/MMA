/* Imágenes de técnica del boxeo (diagramas en img/boxeo/). El contenido es posicional: MAP dice, para cada módulo,
   qué imágenes van con cada concepto y cada drill por su índice. No se cachean al instalar: el service worker las guarda
   la primera vez que se ven. */
import {lang} from "../i18n.js";

export const IMG = {
 "base-pies": {
  "files": [
   "img/boxeo/base-pies.svg"
  ],
  "capEs": [
   "Pies en diagonal, nunca en la misma línea"
  ],
  "capEn": [
   "Feet on a diagonal, never on one line"
  ]
 },
 "step-drag": {
  "files": [
   "img/boxeo/step-drag.svg"
  ],
  "capEs": [
   "El pie más cercano a la dirección se mueve primero"
  ],
  "capEn": [
   "The foot closest to the direction moves first"
  ]
 },
 "pivote-adelante": {
  "files": [
   "img/boxeo/pivote-adelante-1.svg",
   "img/boxeo/pivote-adelante-2.svg"
  ],
  "capEs": [
   "1. Guardia frente al rival",
   "2. Gira sobre la planta izquierda, el pie derecho barre"
  ],
  "capEn": [
   "1. Stance facing the opponent",
   "2. Pivot on the lead ball, rear foot sweeps"
  ]
 },
 "pivote-atras": {
  "files": [
   "img/boxeo/pivote-atras.svg"
  ],
  "capEs": [
   "Gira sobre la planta derecha hacia tu derecha"
  ],
  "capEn": [
   "Pivot on the rear ball toward your right"
  ]
 },
 "salida-angulo": {
  "files": [
   "img/boxeo/salida-angulo.svg"
  ],
  "capEs": [
   "Golpea y sal de la línea, nunca recto atrás"
  ],
  "capEn": [
   "Hit and step off the line, never straight back"
  ]
 },
 "distancias": {
  "files": [
   "img/boxeo/distancias.svg"
  ],
  "capEs": [
   "Larga, media y corta: entra o sal, no te quedes"
  ],
  "capEn": [
   "Long, mid, short: get in or get out"
  ]
 },
 "cortar-ring": {
  "files": [
   "img/boxeo/cortar-ring.svg"
  ],
  "capEs": [
   "Corta su salida en diagonal, no lo persigas"
  ],
  "capEn": [
   "Cut off the escape diagonally, do not chase"
  ]
 },
 "salida-cuerdas": {
  "files": [
   "img/boxeo/salida-cuerdas.svg"
  ],
  "capEs": [
   "Sal en ángulo o gira al rival contra las cuerdas"
  ],
  "capEn": [
   "Angle out or turn him onto the ropes"
  ]
 },
 "movimiento-lateral": {
  "files": [
   "img/boxeo/movimiento-lateral.svg"
  ],
  "capEs": [
   "Cada lado te aleja de una mano y te acerca a la otra"
  ],
  "capEn": [
   "Each side moves you away from one hand, toward the other"
  ]
 },
 "pie-afuera-zurdo": {
  "files": [
   "img/boxeo/pie-afuera-zurdo.svg"
  ],
  "capEs": [
   "Gana el pie de afuera y la derecha entra por el centro"
  ],
  "capEn": [
   "Win the outside foot, the right goes down the middle"
  ]
 },
 "escalera": {
  "files": [
   "img/boxeo/escalera.svg"
  ],
  "capEs": [
   "Step-drag por la escalera sin cruzar los pies"
  ],
  "capEn": [
   "Step-drag through the ladder, never cross feet"
  ]
 }
};

export const MAP = {"fund-1": {"conceptos": [["base-pies"], ["step-drag"], [], ["distancias"]], "drills": [[], ["step-drag"], [], [], [], ["distancias"]]}, "fund-2": {"conceptos": [[], [], [], ["salida-angulo"]], "drills": [[], ["salida-angulo"]]}, "fund-4": {"conceptos": [["pivote-adelante", "salida-angulo"]], "drills": [["pivote-adelante", "salida-angulo"], [], ["salida-angulo"]]}, "guardia": {"conceptos": [["base-pies"]], "drills": [[], [], [], [], [], ["pivote-adelante"]]}, "defensa": {"conceptos": [[], [], [], [], [], [], [], ["salida-cuerdas"]], "drills": [[], [], [], [], [], [], [], [], ["salida-cuerdas"]]}, "pies": {"conceptos": [["base-pies"], ["step-drag"], ["pivote-adelante", "pivote-atras"], ["distancias"], ["movimiento-lateral"], ["cortar-ring", "salida-cuerdas"]], "drills": [["step-drag"], [], ["pivote-adelante", "pivote-atras"], ["escalera"], ["salida-angulo"], ["salida-cuerdas"], ["cortar-ring"]]}, "ofensiva": {"conceptos": [["pie-afuera-zurdo"], [], [], [], [], [], [], [], ["salida-angulo", "pivote-adelante"]], "drills": [[], [], ["salida-angulo"]]}, "peleas": {"conceptos": [[], [], [], ["pivote-adelante"], [], [], ["pie-afuera-zurdo"]], "drills": [[], [], [], ["pie-afuera-zurdo"], ["salida-cuerdas"]]}};

/* imágenes de un concepto o drill: [{src, cap}] con el pie en el idioma actual */
export function imgsFor(moduleId, kind, index){
  const keys = MAP[moduleId]?.[kind]?.[index] || [];
  const en = lang() === "en";
  return keys.flatMap(k => { const it = IMG[k]; return it ? it.files.map((src, i) => ({src, cap: (en ? it.capEn : it.capEs)[i] || it.capEs[i] || ""})) : []; });
}
