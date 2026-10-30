/* Caminos de entrenamiento y rutinas.
   El contenido de cada arte vive en su propio archivo y se carga cuando se abre (son pesados).
   El progreso y la rutina son registros normales del store, así que viajan a Google Drive con lo demás:
   - "progreso": id = clave del ítem marcado (arte:d:modulo:i, arte:r:url, arte:h:modulo:i).
   - "rutinas":  id "mia" = {dias: [1..7], min, artes: [...], modo: "solo"|"pareja"}.
   - "sesiones": una por entrenamiento terminado = {fecha, min, artes, hechos: [claves]}. */
import * as S from "../store.js";
import {today, parseISO, toISO, addDays} from "../util.js";

export const ARTES = [
  {id: "bjj", nombre: "Jiu-Jitsu Brasileño", corto: "BJJ", color: "#3b82f6", load: () => import("./bjj.js"),
    calor: "Movilidad de cadera y hombros, gambas, puentes y levantada técnica de un lado al otro del tatami."},
  {id: "muaythai", nombre: "Muay Thai", corto: "Muay Thai", color: "#ef3340", load: () => import("./muaythai.js"),
    calor: "Cuerda o trote suave, sombra con teeps y patadas al 50 % y movilidad de cadera."},
  {id: "lucha", nombre: "Lucha", corto: "Lucha", color: "#f59e0b", load: () => import("./lucha.js"),
    calor: "Trote, movimiento en postura, cambios de nivel, sprawls suaves y rodadas."},
  {id: "boxeo", nombre: "Boxeo · Método Mayweather", corto: "Boxeo", color: "#d4a73c", load: () => import("./boxeo.js"),
    calor: "Saltar cuerda y sombra suave revisando la guardia frente al espejo."},
  {id: "mma", nombre: "MMA", corto: "MMA", color: "#22c55e", load: () => import("./mma.js"),
    calor: "Sombra de MMA mezclando golpes, cambios de nivel y sprawls, más movilidad general."},
];
export const arte = id => ARTES.find(a => a.id === id);
export const NIVELES = [["basico", "Básico"], ["intermedio", "Intermedio"], ["avanzado", "Avanzado"]];
const NV = {basico: 0, intermedio: 1, avanzado: 2};

/* ---------- carga y normalización del contenido ---------- */
const cache = {};
export async function cargar(id){
  if(cache[id]) return cache[id];
  const m = await arte(id).load();
  const mods = (m.MODULOS || []).map((x, i) => ({...x, id: x.id || `m${i + 1}`, nivel: x.nivel || "basico",
    drills: (x.drills || []).map(d => ({...d, min: Math.max(5, Math.round(d.min || minutos(d.dosis))), solo: d.solo ?? !/compañer|pareja|manopl|sparring|rival|entrenador|partner/i.test(d.nombre + " " + d.como)})),
    recursos: x.recursos || [], hitos: x.hitos || [], conceptos: x.conceptos || []}));
  mods.sort((a, b) => NV[a.nivel] - NV[b.nivel] || mods.indexOf(a) - mods.indexOf(b));
  mods.forEach((x, i) => { x.n = i + 1; });
  return (cache[id] = {id, intro: m.INTRO || {}, plan: m.PLAN || [], semana: m.SEMANA || [], modulos: mods});
}
export const cargado = id => cache[id] || null;
/* "3 rounds x 3 min, 1 min de descanso" → 12; si no se entiende, 10 */
function minutos(dosis = ""){
  const r = dosis.match(/(\d+)\s*(?:rounds?|asaltos?|series|rondas)\D{0,6}(\d+(?:[.,]\d+)?)\s*min/i);
  if(r){ const n = +r[1], m = parseFloat(r[2].replace(",", ".")); const d = (dosis.match(/(\d+(?:[.,]\d+)?)\s*min(?:uto)?s?\s*de\s*descanso/i) || [])[1]; return Math.round(n * m + (n - 1) * (d ? parseFloat(d.replace(",", ".")) : 1)); }
  const m = dosis.match(/(\d+)\s*(?:-|a)?\s*(\d+)?\s*min/i);
  return m ? +(m[2] || m[1]) : 10;
}

/* ---------- progreso ---------- */
export const hecho = k => !!S.get("progreso", k);
export function marcar(k, on){ if(on) S.put("progreso", {id: k}); else S.del("progreso", k); }
export const kDrill = (a, m, i) => `${a}:d:${m}:${i}`;
export const kRec = (a, url) => `${a}:r:${url}`;
export const kHito = (a, m, i) => `${a}:h:${m}:${i}`;
export function itemsMod(a, m){
  return [...m.drills.map((_, i) => kDrill(a, m.id, i)), ...m.recursos.map(r => kRec(a, r.url)), ...m.hitos.map((_, i) => kHito(a, m.id, i))];
}
export const pct = keys => keys.length ? Math.round(keys.filter(hecho).length / keys.length * 100) : 0;
export const pctMod = (a, m) => pct(itemsMod(a, m));
export const pctArte = d => pct(d.modulos.flatMap(m => itemsMod(d.id, m)));
/* primer módulo sin terminar (en orden de nivel) */
export const moduloActual = d => d.modulos.find(m => pctMod(d.id, m) < 100) || d.modulos[d.modulos.length - 1];

/* ---------- rutina ---------- */
export const rutina = () => S.get("rutinas", "mia");
export const guardarRutina = v => S.put("rutinas", {id: "mia", ...v});
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DIAS_C = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const diaSemana = iso => ((parseISO(iso).getDay() + 6) % 7) + 1;   // 1 = lunes … 7 = domingo
export const lunes = iso => addDays(iso, 1 - diaSemana(iso));
const semanaN = iso => Math.floor((parseISO(lunes(iso)) - new Date(2024, 0, 1)) / 6048e5);

/* qué artes tocan ese día: con una sola arte, siempre esa; con varias se rotan entre los días de entreno
   y, si la sesión es de 90 min o más, se combinan dos por día */
export function artesDelDia(r, iso){
  if(!r || !r.artes?.length || !r.dias?.includes(diaSemana(iso))) return [];
  const dias = [...r.dias].sort((a, b) => a - b), n = r.artes.length;
  if(n === 1) return [...r.artes];
  const k = semanaN(iso) * dias.length + dias.indexOf(diaSemana(iso));
  const por = r.min >= 90 ? Math.min(2, n) : 1;
  return Array.from({length: por}, (_, j) => r.artes[(k * por + j) % n]);
}

/* arma la sesión de un día. Necesita el contenido de las artes ya cargado (cargar()). */
export function sesion(r, iso){
  const artes = artesDelDia(r, iso).filter(cargado);
  if(!artes.length) return null;
  const total = r.min || 60;
  const calor = total <= 30 ? 6 : 10, cierre = total <= 30 ? 4 : 5;
  const bloques = [{tipo: "calor", min: calor, t: "Calentamiento", d: artes.map(a => arte(a).calor).join(" ")}];
  let libre = total - calor - cierre;
  artes.forEach((a, j) => {
    const d = cargado(a);
    let resto = j === artes.length - 1 ? libre : Math.round(libre / (artes.length - j));
    libre -= resto;
    const actual = moduloActual(d), ia = d.modulos.indexOf(actual);
    const apto = x => r.modo !== "solo" || x.d.solo;
    const lista = m => m.drills.map((x, i) => ({d: x, m, i, k: kDrill(a, m.id, i)}));
    /* primero lo pendiente del módulo actual, luego repaso de lo ya hecho, luego lo que viene */
    const cand = [
      ...lista(actual).filter(x => !hecho(x.k)),
      ...d.modulos.slice(0, ia + 1).flatMap(lista).filter(x => hecho(x.k)).reverse(),
      ...d.modulos.slice(ia + 1).flatMap(lista),
    ].filter(apto);
    const usados = new Set();
    for(const x of cand){
      if(resto < 5) break;
      if(usados.has(x.k)) continue;
      const min = Math.min(x.d.min, resto);
      if(min < Math.min(x.d.min, 8) && usados.size) continue;
      usados.add(x.k); resto -= min;
      bloques.push({tipo: "drill", arte: a, mod: x.m.id, modT: x.m.titulo, k: x.k, min, t: x.d.nombre, d: x.d.como, dosis: x.d.dosis, repaso: hecho(x.k)});
    }
    if(resto >= 3) bloques.push({tipo: "libre", arte: a, min: resto, t: "Trabajo libre", d: `Repite el drill que más te costó hoy o haz rounds de sombra aplicando ${actual.titulo.toLowerCase()}.`});
    const video = actual.recursos.find(x => !hecho(kRec(a, x.url)));
    if(video) bloques.push({tipo: "video", arte: a, min: 0, k: kRec(a, video.url), t: video.titulo, d: video.por_que, url: video.url, plataforma: video.plataforma});
  });
  bloques.push({tipo: "cierre", min: cierre, t: "Vuelta a la calma", d: "Estiramientos suaves, respiración y anota en una línea qué mejoraste hoy."});
  return {fecha: iso, artes, min: total, bloques};
}

/* ---------- sesiones registradas ---------- */
export const sesiones = () => S.all("sesiones").sort((a, b) => b.fecha.localeCompare(a.fecha) || b._c - a._c);
export const sesionDe = iso => sesiones().find(x => x.fecha === iso);
export function terminar(s, hechos){
  for(const k of hechos) marcar(k, true);
  return S.put("sesiones", {id: "s" + s.fecha, fecha: s.fecha, min: s.min, artes: s.artes, hechos});
}
/* semanas seguidas (hasta la actual) cumpliendo los días de la rutina */
export function racha(r){
  if(!r?.dias?.length) return 0;
  const porSemana = {};
  for(const x of sesiones()) porSemana[lunes(x.fecha)] = (porSemana[lunes(x.fecha)] || 0) + 1;
  let n = 0, l = lunes(today());
  if((porSemana[l] || 0) >= r.dias.length) n++;
  for(l = addDays(l, -7); (porSemana[l] || 0) >= r.dias.length; l = addDays(l, -7)) n++;
  return n;
}
export const semana = (iso = today()) => Array.from({length: 7}, (_, i) => addDays(lunes(iso), i));
export {toISO};
