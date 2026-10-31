/* Caminos de entrenamiento y rutinas.
   El contenido de cada arte vive en su propio archivo y se carga cuando se abre (son pesados).
   El progreso y la rutina son registros normales del store, así que viajan a Google Drive con lo demás:
   - "progreso": id = clave del ítem marcado (arte:d:modulo:i, arte:r:url, arte:h:modulo:i).
   - "rutinas":  id "mia" = {dias: [1..7], min, artes: [...], modo: "solo"|"pareja"}.
   - "sesiones": un entrenamiento = {id, fecha, estado: "en_curso"|"hecha", tipo, min (reales), artes, hechos: [ids de bloque],
       plan: [{b, tipo, min, t, k, arte, mod, modT, repaso, url}] (la sesión del día congelada al empezar),
       rpe 1-10, energia 1-3, nota, molestia, marcados: [claves de progreso que marcó al terminar], meta y dias (rutina de ese momento)}.
     Las antiguas {id: "s"+fecha, fecha, min, artes, hechos} cuentan como "hecha" sin plan. */
import * as S from "../store.js";
import {today, parseISO, toISO, addDays, uid, norm} from "../util.js";

export const ARTES = [
  {id: "bjj", nombre: "Jiu-Jitsu Brasileño", corto: "BJJ", color: "#3b82f6", load: () => import("./bjj.js"),
    calor: "Movilidad de cadera y hombros, gambas, puentes y levantada técnica de un lado al otro del tatami."},
  {id: "muaythai", nombre: "Muay Thai", corto: "Muay Thai", color: "#ef3340", load: () => import("./muaythai.js"),
    calor: "Cuerda o trote suave, sombra con teeps y patadas al 50 % y movilidad de cadera."},
  {id: "lucha", nombre: "Lucha", corto: "Lucha", color: "#f59e0b", load: () => import("./lucha.js"),
    calor: "Trote, movimiento en postura, cambios de nivel, sprawls suaves y rodadas."},
  {id: "boxeo", nombre: "Boxeo", corto: "Boxeo", color: "#d4a73c", load: () => import("./boxeo.js"),
    calor: "Saltar cuerda y sombra suave revisando la guardia frente al espejo."},
  {id: "mma", nombre: "MMA", corto: "MMA", color: "#22c55e", load: () => import("./mma.js"),
    calor: "Sombra de MMA mezclando golpes, cambios de nivel y sprawls, más movilidad general."},
  /* complementos: apoyan a las artes (salud, físico, niños y defensa personal) */
  {id: "salud", nombre: "Salud y prevención", corto: "Salud", color: "#14b8a6", grupo: "complemento", load: () => import("./salud.js"),
    calor: "Respiración, movilidad articular de cuello a tobillos y activación suave de hombros y cadera."},
  {id: "fisico", nombre: "Preparación física", corto: "Físico", color: "#f97316", grupo: "complemento", load: () => import("./fisico.js"),
    calor: "Trote o cuerda 3 minutos, movilidad dinámica y dos series suaves del primer ejercicio."},
  {id: "kids", nombre: "Clases para niños", corto: "Niños", color: "#ec4899", grupo: "complemento", load: () => import("./kids.js"),
    calor: "Juego de persecución, rodadas y equilibrio en un pie para activar a los niños."},
  {id: "defensa", nombre: "Defensa personal", corto: "Defensa", color: "#8b5cf6", grupo: "complemento", load: () => import("./defensa.js"),
    calor: "Movilidad general, desplazamientos en guardia y respiración para bajar pulsaciones."},
];
export const arte = id => ARTES.find(a => a.id === id);
export const esComplemento = a => (typeof a === "string" ? arte(a) : a)?.grupo === "complemento";
/* sub-rutas de #/entreno que no son artes */
export const RESERVADOS = ["glosario", "repaso", "stats", "logros", "diario", "curriculo"];
export const NIVELES = [["basico", "Básico"], ["intermedio", "Intermedio"], ["avanzado", "Avanzado"]];
const NV = {basico: 0, intermedio: 1, avanzado: 2};
const SOLO_RE = /compañer|pareja|manopl|sparring|rival|entrenador|partner/i;

/* ---------- carga y normalización del contenido ---------- */
const cache = {};
/* si el archivo falta, falla o no trae módulos, queda {vacio: true} y el hub esconde esa arte */
export async function cargar(id){
  if(cache[id]) return cache[id];
  let m = {};
  try{ m = await arte(id).load(); }catch(e){ console.warn("[entreno]", id, e); }
  const mods = (m.MODULOS || []).map((x, i) => ({...x, id: x.id || `m${i + 1}`, nivel: x.nivel || "basico",
    drills: (x.drills || []).map(d => ({...d, min: Math.max(5, Math.round(d.min || minutos(d.dosis))),
      solo: d.solo ?? !SOLO_RE.test(d.nombre + " " + d.como), tipo: d.tipo ?? "tecnica", freq: d.freq ?? 7})),
    recursos: x.recursos || [], hitos: x.hitos || [], conceptos: x.conceptos || []}));
  mods.sort((a, b) => NV[a.nivel] - NV[b.nivel] || mods.indexOf(a) - mods.indexOf(b));
  mods.forEach((x, i) => { x.n = i + 1; });
  return (cache[id] = {id, intro: m.INTRO || {}, plan: m.PLAN || [], semana: m.SEMANA || [], pilares: m.PILARES || null, modulos: mods, vacio: !mods.length});
}
/* ya se intentó cargar (con o sin éxito) */
export const intentado = id => !!cache[id];
export const cargado = id => (cache[id] && !cache[id].vacio ? cache[id] : null);
/* artes con contenido listo, en el orden de ARTES */
export const disponibles = () => ARTES.filter(a => cargado(a.id));

/* ---------- lectura de la dosis ---------- */
const num = s => parseFloat(String(s).replace(",", "."));
const seg = (n, u) => Math.round(num(n) * (/^m/i.test(u) ? 60 : 1));
const U = "(min(?:utos?)?|seg(?:undos?)?|s)\\b";
/* "3 rounds x 3 min, 1 min de descanso", "4 x 2 min, descanso 1 min", "8 rondas de 20 s ... 40 s de descanso"
   → {n, trabajo, descanso} en segundos; null si la dosis no son rounds */
export function rondas(dosis = ""){
  const r = new RegExp(`(\\d+)(?:\\s*(?:a|o|-)\\s*\\d+)?\\s*(?:(?:rounds?|asaltos?|rondas?|series|peleas?)\\s*(?:de|x|×)?|x|×)\\s*(\\d+(?:[.,]\\d+)?)\\s*${U}`, "i").exec(dosis);
  if(!r) return null;
  const n = +r[1], trabajo = seg(r[2], r[3]);
  if(!n || n > 30 || trabajo < 10 || trabajo > 1200) return null;
  const d = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${U}\\s*de\\s*descanso`, "i").exec(dosis) || new RegExp(`descanso\\s*(?:de\\s*)?(\\d+(?:[.,]\\d+)?)\\s*${U}`, "i").exec(dosis);
  return {n, trabajo, descanso: d ? seg(d[1], d[2]) : 60};
}
/* minutos que ocupa una dosis; si no se entiende, 10 */
function minutos(dosis = ""){
  const r = rondas(dosis);
  if(r) return Math.round((r.n * r.trabajo + (r.n - 1) * r.descanso) / 60);
  const m = dosis.match(/(\d+)\s*(?:-|a)?\s*(\d+)?\s*min/i);
  return m ? +(m[2] || m[1]) : 10;
}

/* ---------- progreso ---------- */
export const hecho = k => !!S.get("progreso", k);
/* marcar un drill o hito lo pone en el repaso espaciado (mañana); desmarcarlo lo saca */
export function marcar(k, on){
  if(on){ S.put("progreso", {id: k}); if(repasable(k)) S.put("repasos", {id: k, n: 0, ultimo: today(), prox: addDays(today(), 1)}); }
  else { S.del("progreso", k); if(S.get("repasos", k)) S.del("repasos", k); }
}
export const kDrill = (a, m, i) => `${a}:d:${m}:${i}`;
export const kRec = (a, url) => `${a}:r:${url}`;
export const kHito = (a, m, i) => `${a}:h:${m}:${i}`;
const soloMode = () => rutina()?.modo === "solo";
/* ítems que cuentan, por grupo: drills (en modo solo, solo los que se pueden hacer solo), videos gratis e hitos */
function grupos(a, m, solo = soloMode()){
  return {d: m.drills.map((x, i) => (!solo || x.solo) && kDrill(a, m.id, i)).filter(Boolean),
    r: m.recursos.filter(r => !r.pago).map(r => kRec(a, r.url)), h: m.hitos.map((_, i) => kHito(a, m.id, i))};
}
export const itemsMod = (a, m) => { const g = grupos(a, m); return [...g.d, ...g.r, ...g.h]; };
export const pct = keys => keys.length ? Math.round(keys.filter(hecho).length / keys.length * 100) : 0;
/* drills 50 %, hitos 40 %, videos 10 % (sobre los grupos que existan); 100 solo si está todo */
const PESO = {d: 50, h: 40, r: 10};
function pctG(gs){
  let w = 0, s = 0, todo = true, algo = false;
  for(const g of Object.keys(PESO)){
    const ks = gs.flatMap(x => x[g]); if(!ks.length) continue;
    const n = ks.filter(hecho).length;
    w += PESO[g]; s += PESO[g] * n / ks.length; todo = todo && n === ks.length; algo = algo || n > 0;
  }
  if(!w) return 0;
  return todo ? 100 : Math.min(99, Math.max(algo ? 1 : 0, Math.round(s / w * 100)));
}
export const pctMod = (a, m) => pctG([grupos(a, m)]);
export const pctArte = d => pctG(d.modulos.map(m => grupos(d.id, m)));
export const pctMods = (a, ms) => pctG(ms.map(m => grupos(a, m)));

/* pilares: el prefijo del id del módulo (fundamentos-1 → fundamentos); los módulos sin número van a «especial».
   El contenido puede traer PILARES = {clave: "Nombre"} para nombrarlos. */
const PIL = {fundamentos: "Fundamentos", guardias: "Guardias", sumisiones: "Sumisiones", clinch: "Clinch", avanzado: "Combate y pads",
  cadenas: "Cadenas", suelo: "Suelo", striking: "Golpeo", jaula: "Jaula", estrategia: "Estrategia", fund: "Fundamentos", especial: "Especialización"};
export function pilares(d){
  const g = new Map();
  for(const m of d.modulos){ const k = (/^(.+)-\d+$/.exec(m.id) || [, "especial"])[1]; if(!g.has(k)) g.set(k, []); g.get(k).push(m); }
  return [...g].map(([k, ms]) => ({k, t: d.pilares?.[k] || PIL[k] || k[0].toUpperCase() + k.slice(1), mods: ms}));
}

/* ---------- repaso espaciado ---------- */
/* colección "repasos": {id: clave de progreso (drill o hito), n: repasos seguidos, ultimo, prox} */
export const INTERVALOS = [1, 3, 7, 21, 60];
const repasable = k => /^[^:]+:[dh]:/.test(k);
export function repasoOk(k){
  const r = S.get("repasos", k); if(!r) return;
  const n = (r.n || 0) + 1;
  S.put("repasos", {id: k, n, ultimo: today(), prox: addDays(today(), INTERVALOS[Math.min(n, INTERVALOS.length - 1)]), hist: histR(r)});
}
export const repasoOtraVez = k => S.put("repasos", {id: k, n: 0, ultimo: today(), prox: addDays(today(), 1), hist: histR(S.get("repasos", k))});
/* días en que se repasó (los últimos 8), para los logros */
const histR = r => [...new Set([...(r?.hist || []), today()])].slice(-8);
export const diasDeRepaso = () => new Set(S.all("repasos").flatMap(r => r.hist || []));
/* qué es una clave: {arte, m (módulo), tipo: "d"|"h", i, texto, x (drill)}; null si ya no existe o el arte no cargó */
export function itemDe(k){
  const [a, tp, mod, i] = k.split(":"), d = cargado(a), m = d?.modulos.find(x => x.id === mod);
  if(!m) return null;
  if(tp === "d"){ const x = m.drills[+i]; return x ? {k, arte: a, m, tipo: tp, i: +i, texto: x.nombre, x} : null; }
  const x = m.hitos[+i]; return x ? {k, arte: a, m, tipo: tp, i: +i, texto: x} : null;
}
/* lo que toca repasar hoy (solo lo que sigue marcado y existe); los drills de sparring o físico no se repasan */
export const pendientesRepaso = (iso = today()) => S.all("repasos").filter(r => r.prox && r.prox <= iso && hecho(r.id))
  .map(r => ({r, it: itemDe(r.id)})).filter(x => x.it && (x.it.tipo === "h" || ["tecnica", "estudio"].includes(x.it.x.tipo)))
  .sort((a, b) => a.r.prox.localeCompare(b.r.prox));
/* primer módulo sin terminar (en orden de nivel) */
export const moduloActual = d => d.modulos.find(m => pctMod(d.id, m) < 100) || d.modulos[d.modulos.length - 1];
/* recursos gratis de un módulo (para contar en el hub) */
export const gratis = m => m.recursos.filter(r => !r.pago);

/* ---------- rutina ---------- */
export const rutina = () => S.get("rutinas", "mia");
export const guardarRutina = v => S.put("rutinas", {id: "mia", ...v});
/* meta semanal: {tipo: "dias"|"min", valor}; sin meta, los días de la rutina */
export const metaDe = (r = rutina()) => r?.meta?.valor > 0 ? r.meta : r?.dias?.length ? {tipo: "dias", valor: r.dias.length} : null;
export function metaSemana(r = rutina(), iso = today()){
  const m = metaDe(r); if(!m) return null;
  const ds = semana(iso), hs = hechas().filter(s => s.fecha >= ds[0] && s.fecha <= ds[6]);
  const v = m.tipo === "min" ? hs.reduce((a, s) => a + (+s.min || 0), 0) : new Set(hs.map(s => s.fecha)).size;
  return {...m, hecho: v, pct: Math.min(100, Math.round(v / m.valor * 100)), ok: v >= m.valor};
}
/* ayer tocaba rutina y no hay nada registrado (para «Recuperar ayer») */
export function faltoAyer(r = rutina(), iso = today()){
  const ay = addDays(iso, -1), desde = r?._c ? toISO(new Date(r._c)) : ay;
  return !!r?.dias?.includes(diaSemana(ay)) && ay >= desde && !hechas().some(s => s.fecha === ay) ? ay : null;
}
export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
export const DIAS_C = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
export const diaSemana = iso => ((parseISO(iso).getDay() + 6) % 7) + 1;   // 1 = lunes … 7 = domingo
export const lunes = iso => addDays(iso, 1 - diaSemana(iso));
/* round: con el cambio de hora una semana puede durar 167 o 169 horas */
const semanaN = iso => Math.round((parseISO(lunes(iso)) - new Date(2024, 0, 1)) / 6048e5);

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

/* veces que se hizo cada drill en los 6 días anteriores */
function hechosRecientes(iso){
  const c = {}, desde = addDays(iso, -6);
  for(const s of hechas()) if(s.fecha >= desde && s.fecha < iso) for(const k of s.hechos || []) c[k] = (c[k] || 0) + 1;
  return c;
}

/* arma la sesión de un día. Necesita el contenido de las artes ya cargado (cargar()).
   Cada bloque lleva un id "b" (la clave del drill o del video, o calor / cierre / libre:arte). */
export function sesion(r, iso){
  const artes = artesDelDia(r, iso).filter(cargado);
  if(!artes.length) return null;
  const total = r.min || 60;
  const calor = total <= 30 ? 6 : 10, cierre = total <= 30 ? 4 : 5;
  const bloques = [{b: "calor", tipo: "calor", min: calor, t: "Calentamiento", artes}];
  const tareas = [];
  const rec = hechosRecientes(iso), nombres = new Set();
  let libre = total - calor - cierre, hayVivo = false;
  artes.forEach((a, j) => {
    const d = cargado(a);
    let resto = j === artes.length - 1 ? libre : Math.round(libre / (artes.length - j));
    libre -= resto;
    const cupo = Math.max(2, Math.round(resto / 11));   // unos 4 drills por arte en 60 min
    const actual = moduloActual(d), ia = d.modulos.indexOf(actual), tope = NV[actual.nivel] + 1;
    const apto = x => (r.modo !== "solo" || x.d.solo) && x.d.tipo !== "estudio"
      && !((x.d.tipo === "vivo" || x.d.freq <= 1) && rec[x.k]) && (rec[x.k] || 0) < x.d.freq;
    const lista = m => m.drills.map((x, i) => ({d: x, m, i, k: kDrill(a, m.id, i)}));
    /* primero lo pendiente del módulo actual, luego repaso de lo ya hecho, luego lo que viene (hasta un nivel más) */
    const cand = [
      ...lista(actual).filter(x => !hecho(x.k)),
      ...d.modulos.slice(0, ia + 1).flatMap(lista).filter(x => hecho(x.k)).reverse(),
      ...d.modulos.slice(ia + 1).filter(m => NV[m.nivel] <= tope).flatMap(lista),
    ].filter(apto);
    const usados = new Set();
    for(const x of cand){
      if(resto < 5 || usados.size >= cupo) break;
      const nn = norm(x.d.nombre);
      if(usados.has(x.k) || nombres.has(nn)) continue;
      if(x.d.min > resto * 1.25) continue;               // no cabe: se salta en vez de recortarlo
      if(x.d.tipo === "fisico" && hayVivo) continue;      // nada de físico el día de sparring duro
      const min = Math.min(x.d.min, resto);
      usados.add(x.k); nombres.add(nn); resto -= min;
      if(x.d.tipo === "vivo") hayVivo = true;
      bloques.push({b: x.k, tipo: "drill", arte: a, mod: x.m.id, modT: x.m.titulo, k: x.k, min, t: x.d.nombre, d: x.d.como, dosis: x.d.dosis, repaso: hecho(x.k)});
    }
    if(resto >= 3) bloques.push({b: "libre:" + a, tipo: "libre", arte: a, min: resto, t: "Trabajo libre", modT: actual.titulo});
    const video = actual.recursos.find(x => !x.pago && !hecho(kRec(a, x.url)));
    if(video) bloques.push({b: kRec(a, video.url), tipo: "video", arte: a, min: 0, k: kRec(a, video.url), t: video.titulo, d: video.por_que, url: video.url, plataforma: video.plataforma});
    /* tarea opcional para casa: el primer estudio pendiente hasta el módulo actual */
    const est = d.modulos.slice(0, ia + 1).flatMap(lista).find(x => x.d.tipo === "estudio" && !hecho(x.k));
    if(est) tareas.push({b: est.k, tipo: "tarea", arte: a, mod: est.m.id, modT: est.m.titulo, k: est.k, min: 0, t: est.d.nombre, d: est.d.como, dosis: est.d.dosis});
  });
  bloques.push({b: "cierre", tipo: "cierre", min: cierre, t: "Vuelta a la calma"});
  return {fecha: iso, artes, min: total, bloques: [...bloques, ...tareas]};
}

/* el plan guardado solo lleva lo justo; el resto se lee del contenido al pintarlo */
const CAMPOS = ["b", "tipo", "min", "t", "k", "arte", "mod", "modT", "repaso", "url", "artes"];
const compacto = b => Object.fromEntries(CAMPOS.filter(c => b[c] !== undefined && b[c] !== false).map(c => [c, b[c]]));
export function bloquesDe(s){
  return (s.plan || []).map(b => {
    if(b.tipo === "calor") return {...b, artes: b.artes || s.artes || []};
    const d = b.arte && cargado(b.arte);
    if(!d || !b.k) return b;
    if(b.tipo === "video"){ const r = d.modulos.flatMap(m => m.recursos).find(x => kRec(b.arte, x.url) === b.k); return r ? {...b, d: r.por_que, plataforma: r.plataforma, url: r.url} : b; }
    const [, , mod, i] = b.k.split(":"), x = d.modulos.find(m => m.id === mod)?.drills[+i];
    return x ? {...b, d: x.como, dosis: x.dosis} : b;
  });
}

/* ---------- sesiones registradas ---------- */
export const fin = s => (s.estado || "hecha") === "hecha";
export const sesiones = () => S.all("sesiones").sort((a, b) => b.fecha.localeCompare(a.fecha) || b._c - a._c);
export const hechas = () => sesiones().filter(fin);
/* todas las de ese día (puede haber varias: la rutina y clases o sparring registrados a mano) */
export const sesionDe = iso => sesiones().filter(x => x.fecha === iso).reverse();
/* la sesión de rutina del día (la que tiene plan) */
export const planDe = iso => sesionDe(iso).find(x => x.plan);
const metaRutina = () => { const r = rutina(); return r?.dias?.length ? {meta: r.dias.length, dias: [...r.dias]} : {}; };

/* congela la sesión del día al empezarla (primer bloque marcado, Empezar o temporizador) */
export function iniciar(ses, hechos = []){
  return planDe(ses.fecha) || S.put("sesiones", {id: uid(), fecha: ses.fecha, estado: "en_curso", tipo: "rutina", min: ses.min, artes: ses.artes, plan: ses.bloques.map(compacto), hechos, ...metaRutina()});
}
export function marcarBloque(id, b, on){
  const s = S.get("sesiones", id); if(!s || fin(s)) return;
  const h = new Set(s.hechos || []); if(on) h.add(b); else h.delete(b);
  S.put("sesiones", {id, hechos: [...h]});
}
/* termina una sesión de rutina: los drills hechos cuentan para el progreso; se guarda cuáles marcó para poder deshacer */
export function terminar(s, v = {}){
  const marcados = (s.plan || []).filter(b => b.tipo === "drill" && b.k && (s.hechos || []).includes(b.b) && !hecho(b.k)).map(b => b.k);
  for(const k of marcados) marcar(k, true);
  return S.put("sesiones", {...s, ...v, estado: "hecha", marcados, ...metaRutina()});
}
/* entreno registrado a mano: clase, sparring, open mat, cardio o app */
export const registrar = v => S.put("sesiones", {id: uid(), estado: "hecha", ...v, ...metaRutina()});
/* deshacer: quita del progreso lo que marcó; la de rutina vuelve a "en curso" y las demás se borran */
export function deshacer(s){
  for(const k of s.marcados || []) marcar(k, false);
  if(!s.plan) return S.del("sesiones", s.id);
  S.put("sesiones", {id: s.id, estado: "en_curso", marcados: []});
}
export const borrar = s => { for(const k of s.marcados || []) marcar(k, false); S.del("sesiones", s.id); };

/* racha en días: cada día entrenado suma; un día de rutina sin entrenar la corta; descansos y hoy no la cortan.
   Para cada semana se usa la rutina guardada en sus sesiones (o la actual). Devuelve la actual y el récord. */
export function rachas(r = rutina()){
  const hs = hechas();
  if(!hs.length) return {actual: 0, record: 0};
  const dias = new Set(hs.map(s => s.fecha)), plan = {};
  for(const s of hs) if(s.dias?.length && !plan[lunes(s.fecha)]) plan[lunes(s.fecha)] = s.dias;
  const hoy = today();
  let cur = 0, best = 0, d0 = hs[hs.length - 1].fecha;
  const lim = addDays(hoy, -3999); if(d0 < lim) d0 = lim;   // tope de ~11 años hacia atrás, pero siempre llega a hoy
  for(let d = d0; d <= hoy; d = addDays(d, 1)){
    if(dias.has(d)){ cur++; if(cur > best) best = cur; }
    else if(d < hoy && (plan[lunes(d)] || r?.dias || []).includes(diaSemana(d))) cur = 0;
  }
  return {actual: cur, record: best};
}
export const racha = r => rachas(r).actual;
export const semana = (iso = today()) => Array.from({length: 7}, (_, i) => addDays(lunes(iso), i));
export {toISO};
