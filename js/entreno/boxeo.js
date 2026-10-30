/* Boxeo: reutiliza el camino Mayweather (philly/data.js) y le asigna nivel a cada módulo. */
import {INTRO, MODULOS as M, PLAN, SEMANA} from "../../philly/data.js";
const NIVEL = {guardia: "basico", defensa: "basico", pies: "intermedio", ofensiva: "intermedio", entrenamiento: "intermedio", peleas: "avanzado", biblioteca: "avanzado"};
const MAP = {principiante: "basico"};
export const MODULOS = M.map(m => ({...m, nivel: NIVEL[m.id] || "intermedio", drills: m.drills.map(d => ({...d, nivel: MAP[d.nivel] || d.nivel}))}));
export {INTRO, PLAN, SEMANA};
