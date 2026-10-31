/* Boxeo: primero los fundamentos (boxeo-fund.js) y después la especialización Mayweather (philly/data.js).
   Las claves de progreso usan el id del módulo, así que sumar FUND delante no mueve el progreso ya marcado. */
import {INTRO as I, MODULOS as M, PLAN as P, SEMANA} from "../../philly/data.js";
import {FUND} from "./boxeo-fund.js";
const NIVEL = {guardia: "intermedio", defensa: "intermedio", pies: "intermedio", ofensiva: "intermedio", entrenamiento: "avanzado", peleas: "avanzado", biblioteca: "avanzado"};
const MAP = {principiante: "basico"};
const MAY = M.map(m => ({...m, nivel: NIVEL[m.id] || "intermedio", drills: m.drills.map(d => ({...d, nivel: MAP[d.nivel] || d.nivel}))}));
export const MODULOS = [...FUND, ...MAY];
export const PILARES = {fund: "Fundamentos", especial: "Especialización Mayweather"};
export const INTRO = {...I, titulo: "Boxeo: de la guardia básica al estilo Mayweather",
  sub: "Empieza por los fundamentos (guardia, golpes, defensa y sparring técnico) y después entra a la especialización Mayweather: la guardia Philly Shell, la defensa en capas, el contragolpe y la lectura de peleas, en unas 16 semanas."};
export const PLAN = [{fase: "Fundamentos del boxeo", semanas: "Antes de la especialización (8 a 12 semanas)",
  foco: "Guardia, paso arrastrado, los seis golpes, las cuatro defensas y el sparring técnico seguro.",
  puntos: ["Haz los módulos de fundamentos en orden: guardia y jab, golpes y combinaciones, defensa básica y ángulos con sparring.",
    "Empieza la especialización Mayweather cuando completes los hitos de defensa básica.",
    "El sparring de cabeza llega solo cuando el entrenador lo indique."]}, ...P];
export {SEMANA};
