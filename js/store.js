/* Datos de la app. Todo vive en este aparato (localStorage + IndexedDB para las fotos) y, si la persona entró con
   Google, se copia a su Google Drive (js/sync.js). Cada colección es un mapa id → registro con _u (última
   modificación, ms). Borrar deja una lápida {_d: true} para que el borrado viaje a los demás aparatos: al mezclar dos
   copias gana, registro a registro, el _u más reciente. */
import {uid, now, isObj, today, addMonths, addDays, daysBetween, monthsBetween, parseISO} from "./util.js";
import {planById} from "./catalog.js";
import {t, tn, lang} from "./i18n.js";

const KEY = "mma:data", PREFS = "mma:prefs";
export const COLS = ["academias", "sedes", "disciplinas", "alumnos", "pagos", "grados", "asistencias", "productos", "progreso", "rutinas", "sesiones"];
export const APP = "mma-academia", VER = 1;

const empty = () => ({app: APP, v: VER, col: Object.fromEntries(COLS.map(c => [c, {}]))});
let db = empty();
const subs = new Set();

function readLocal(){
  try{
    const o = JSON.parse(localStorage.getItem(KEY) || "null");
    if(isObj(o) && isObj(o.col)){ const d = empty(); for(const c of COLS) if(isObj(o.col[c])) d.col[c] = o.col[c]; return d; }
  }catch(e){}
  return empty();
}
export function load(){ db = readLocal(); if(dedupeAsistencias() + fijarAsistencias()) persist(); }
export function snapshot(){ return JSON.parse(JSON.stringify(db)); }

let saveT = 0;
function persist(){
  try{ localStorage.setItem(KEY, JSON.stringify(db)); }
  catch(e){ console.error("No se pudo guardar en este aparato", e); window.dispatchEvent(new CustomEvent("mma:quota")); }
}
function changed(local = true){
  clearTimeout(saveT); saveT = setTimeout(persist, 50);
  for(const fn of subs) try{ fn({local}); }catch(e){ console.error(e); }
}
export const flush = () => { clearTimeout(saveT); persist(); };
export const subscribe = fn => { subs.add(fn); return () => subs.delete(fn); };

/* ---------- CRUD ---------- */
export function put(col, rec){
  const prev = db.col[col][rec.id] || {};
  const r = Object.assign({}, prev._d ? {} : prev, rec, {id: rec.id || uid(), _u: Math.max(now(), (prev._u || 0) + 1)});
  if(!r._c) r._c = now();
  delete r._d;
  if(col === "asistencias") fijarAsis(r);
  db.col[col][r.id] = r;
  changed();
  return r;
}
export function del(col, id){
  if(!db.col[col][id]) return;
  db.col[col][id] = {id, _u: Math.max(now(), (db.col[col][id]._u || 0) + 1), _d: true};
  changed();
}
export const get = (col, id) => { const r = db.col[col][id]; return r && !r._d ? r : null; };
export const all = col => Object.values(db.col[col]).filter(r => !r._d);
/* hay lápida de este registro (borrado a propósito, no solo ausente) */
export const isDeleted = (col, id) => !!(db.col[col] && db.col[col][id] && db.col[col][id]._d);

/* ---------- mezclar con la copia de Google ---------- */
export function merge(remote, local = false){
  if(!isObj(remote) || !isObj(remote.col)) return false;
  let any = false;
  for(const c of COLS){
    const R = remote.col[c]; if(!isObj(R)) continue;
    const L = db.col[c];
    for(const id in R){
      const r = R[id]; if(!isObj(r) || typeof r._u !== "number") continue;
      /* misma clase viva en los dos lados: se mezcla alumno por alumno */
      if(c === "asistencias" && L[id] && !L[id]._d && !r._d){ const m = unirAsis(L[id], r); if(m){ L[id] = m; any = true; } continue; }
      if(!L[id] || (L[id]._u || 0) < r._u){ L[id] = r; any = true; }
    }
  }
  if(any){ dedupeAsistencias(); fijarAsistencias(); changed(local); }
  return any;
}
/* ¿la copia local tiene algo que la remota no? */
export function aheadOf(remote){
  const R = isObj(remote) && isObj(remote.col) ? remote.col : {};
  for(const c of COLS){
    const rc = R[c] || {};
    for(const id in db.col[c]) if(!rc[id] || (rc[id]._u || 0) < db.col[c][id]._u) return true;
  }
  return false;
}
export function replaceAll(data){
  const d = empty();
  if(isObj(data) && isObj(data.col)) for(const c of COLS) if(isObj(data.col[c])) d.col[c] = data.col[c];
  db = d; dedupeAsistencias(); fijarAsistencias(); changed();
}
/* lápidas de más de 120 días: ya viajaron a todos los aparatos */
export function compact(){
  const lim = now() - 120 * 864e5;
  for(const c of COLS) for(const id in db.col[c]){ const r = db.col[c][id]; if(r._d && r._u < lim) delete db.col[c][id]; }
}

/* ---------- preferencias de este aparato (no se sincronizan) ---------- */
let prefs = {};
try{ prefs = JSON.parse(localStorage.getItem(PREFS) || "{}") || {}; }catch(e){ prefs = {}; }
export const pref = (k, d) => (k in prefs ? prefs[k] : d);
export function setPref(k, v){ prefs[k] = v; try{ localStorage.setItem(PREFS, JSON.stringify(prefs)); }catch(e){} }

/* ---------- academia y filtros actuales ---------- */
export function academy(){
  const list = all("academias").sort((a, b) => a._c - b._c);
  return list.find(a => a.id === pref("academia")) || list[0] || null;
}
export const academies = () => all("academias").sort((a, b) => a._c - b._c);
export const inAcad = (col, acadId = academy()?.id) => all(col).filter(r => r.academiaId === acadId);
export const sedes = () => inAcad("sedes").sort((a, b) => a._c - b._c);
export const disciplinas = () => inAcad("disciplinas").sort((a, b) => (a.orden ?? a._c) - (b.orden ?? b._c));
export const discsOfSede = sedeId => disciplinas().filter(d => !sedeId || (d.sedeIds || []).includes(sedeId));
/* sede elegida arriba ("" = todas) */
export function curSede(){
  const s = pref("sede", "");
  return s && get("sedes", s) ? s : "";
}
export function alumnos(opts = {}){
  const sede = opts.sede !== undefined ? opts.sede : curSede();
  return inAcad("alumnos").filter(a => (!sede || a.sedeId === sede) && (opts.todos || a.estado !== "inactivo"));
}

/* ---------- grados ---------- */
const byDate = (a, b) => (a.fecha || "").localeCompare(b.fecha || "") || (a.rank - b.rank) || ((a.grado || 0) - (b.grado || 0)) || (a._c - b._c);
export const gradosDe = (alumnoId, discId) => all("grados").filter(g => g.alumnoId === alumnoId && (!discId || g.disciplinaId === discId)).sort(byDate);
export function rangoActual(alumnoId, discId){
  const h = gradosDe(alumnoId, discId);
  return h[h.length - 1] || null;
}
/* fecha en que recibió el cinturón actual (el primer registro con ese cinturón tras el último cambio) */
export function inicioCinturon(hist, idx = hist.length - 1){
  if(idx < 0) return null;
  const r = hist[idx].rank;
  let i = idx;
  while(i > 0 && hist[i - 1].rank === r) i--;
  return hist[i];
}
export const rankDef = (disc, i) => (disc && disc.ranks && disc.ranks[i]) || {n: "—", c: "#999", g: 0, m: 0, mg: 0};

/* avisos para una promoción nueva (o ya registrada: pasar el historial anterior a ella) */
export function avisosPromocion(disc, prevHist, nuevo){
  const out = [];
  const prev = prevHist[prevHist.length - 1];
  if(!prev || !disc) return out;
  const pr = rankDef(disc, prev.rank), nr = rankDef(disc, nuevo.rank);
  const fecha = nuevo.fecha || today();
  if(daysBetween(prev.fecha, fecha) < 0) out.push({nivel: "error", txt: t("La fecha es anterior a la última promoción ({fecha}).", {fecha: prev.fecha})});
  if(nuevo.rank < prev.rank || (nuevo.rank === prev.rank && (nuevo.grado || 0) <= (prev.grado || 0)))
    out.push({nivel: "warn", txt: prev.grado ? t("No es un ascenso: ya tenía {rango} {g}°.", {rango: t(pr.n), g: prev.grado}) : t("No es un ascenso: ya tenía {rango}.", {rango: t(pr.n)})});
  if(nuevo.rank > prev.rank){
    const ini = inicioCinturon(prevHist);
    const meses = monthsBetween(ini.fecha, fecha);
    if(pr.m && meses < pr.m) out.push({nivel: "warn", txt: t("Solo lleva {tiempo} en {rango}. El mínimo recomendado es {min}.", {tiempo: fmtM(meses), rango: t(pr.n), min: fmtM(pr.m)}), faltan: pr.m - meses});
    if(nuevo.rank > prev.rank + 1) out.push({nivel: "warn", txt: tn(nuevo.rank - prev.rank - 1, "Salta 1 cinturón: de {de} a {a}.", "Salta {n} cinturones: de {de} a {a}.", {de: t(pr.n), a: t(nr.n)})});
    if(pr.g && (prev.grado || 0) < pr.g) out.push({nivel: "info", txt: t("Pasa de cinturón con {g} de {max} grados.", {g: prev.grado || 0, max: pr.g})});
  }else if(nuevo.rank === prev.rank && (nuevo.grado || 0) > (prev.grado || 0)){
    const meses = monthsBetween(prev.fecha, fecha);
    const min = (pr.mg || 0) * ((nuevo.grado || 0) - (prev.grado || 0));
    if(min && meses < min) out.push({nivel: "warn", txt: t("Solo han pasado {tiempo} desde el último grado. Lo recomendado es {min}.", {tiempo: fmtM(meses), min: fmtM(min)}), faltan: min - meses});
    if(pr.g && nuevo.grado > pr.g) out.push({nivel: "error", txt: t("{rango} tiene máximo {max} grados.", {rango: t(pr.n), max: pr.g})});
  }
  return out;
}
function fmtM(m){
  if(m < 1){ const d = Math.round(m * 30.4); return tn(d, "1 día", "{n} días"); }
  const dec = x => (lang() === "en" ? String(x) : String(x).replace(".", ","));
  const r = Math.round(m * 10) / 10;
  if(r < 12) return tn(r, "1 mes", "{n} meses", {n: dec(r)});
  const y = Math.round(r / 12 * 10) / 10;
  return tn(y, "1 año", "{n} años", {n: dec(y)});
}
export const fmtMeses = fmtM;

/* promociones del historial que se dieron antes del tiempo recomendado */
export function promocionesRapidas(alumnoId, disc){
  const h = gradosDe(alumnoId, disc.id), out = [];
  for(let i = 1; i < h.length; i++){
    const w = avisosPromocion(disc, h.slice(0, i), h[i]).filter(a => a.faltan);
    if(w.length) out.push({g: h[i], avisos: w});
  }
  return out;
}
/* ¿está listo para el siguiente grado o cinturón? */
export function siguiente(alumnoId, disc){
  const h = gradosDe(alumnoId, disc.id);
  if(!h.length) return null;
  const cur = h[h.length - 1], rd = rankDef(disc, cur.rank);
  const last = disc.ranks.length - 1;
  if(rd.g && (cur.grado || 0) < rd.g){
    const meses = monthsBetween(cur.fecha, today());
    return {tipo: "grado", txt: tn(cur.grado + 1, "1° grado de {rango}", "{n}° grado de {rango}", {rango: t(rd.n)}), listo: !rd.mg || meses >= rd.mg, meses, min: rd.mg, fecha: addDays(cur.fecha, Math.round((rd.mg || 0) * 30.44))};
  }
  if(cur.rank < last && rd.m !== undefined){
    const ini = inicioCinturon(h);
    const meses = monthsBetween(ini.fecha, today());
    return {tipo: "cinturon", txt: t(rankDef(disc, cur.rank + 1).n), listo: !rd.m || meses >= rd.m, meses, min: rd.m, fecha: addDays(ini.fecha, Math.round((rd.m || 0) * 30.44))};
  }
  return null;
}

/* ---------- pagos ---------- */
export const pagosDe = alumnoId => all("pagos").filter(p => p.alumnoId === alumnoId).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b._c - a._c);
export function vence(al){
  let due = null;
  for(const p of all("pagos")) if(p.alumnoId === al.id && p.hasta && (!due || p.hasta > due)) due = p.hasta;
  return due || al.fechaInicio || null;
}
/* estado de pago: {k: "aldia"|"pronto"|"vencido"|"beca"|"clase"|"inactivo", dias, vence} */
export function estadoPago(al, aviso = 5){
  if(al.estado === "inactivo") return {k: "inactivo", txt: t("Inactivo")};
  if(al.estado === "congelado") return {k: "congelado", txt: t("Congelado")};
  const plan = planById(al.plan);
  if(plan.id === "beca") return {k: "beca", txt: t("Becado")};
  const v = vence(al);
  if(plan.id === "clase") return {k: "clase", txt: t("Por clase"), vence: v};
  if(!v) return {k: "vencido", txt: t("Sin pagos"), dias: 0};
  const d = daysBetween(today(), v);
  if(d < 0) return {k: "vencido", txt: tn(-d, "Vencido hace 1 día", "Vencido hace {n} días"), dias: d, vence: v};
  if(d <= aviso) return {k: "pronto", txt: d === 0 ? t("Vence hoy") : tn(d, "Vence en 1 día", "Vence en {n} días"), dias: d, vence: v};
  return {k: "aldia", txt: t("Al día"), dias: d, vence: v};
}
/* período por defecto de un pago nuevo */
export function periodoNuevo(al){
  const plan = planById(al.plan);
  const v = vence(al);
  let desde = v && daysBetween(v, today()) <= 31 ? v : today();
  if(!parseISO(desde)) desde = today();
  const hasta = plan.meses === 0.5 ? addDays(desde, 15) : plan.meses ? addMonths(desde, plan.meses) : desde;
  return {desde, hasta};
}
export const valorPlan = al => Number(al.valor ?? academy()?.valorMensual ?? 0) || 0;

/* ---------- asistencia ---------- */
/* un registro por clase: id fijo fecha_sede_disciplina, así dos toques o dos aparatos no crean copias */
export const asisId = (fecha, sedeId, discId) => `${fecha}_${sedeId}_${discId}`;
export const asistenciaDe = (fecha, sedeId, discId) => get("asistencias", asisId(fecha, sedeId, discId))
  || all("asistencias").find(a => a.fecha === fecha && a.sedeId === sedeId && a.disciplinaId === discId) || null;
/* marca (on=true) o desmarca a uno o varios alumnos leyendo siempre el registro guardado, no una copia vieja.
   Cada alumno lleva su propia marca {on, _u} en marcas: si dos aparatos pasan lista de la misma clase sin red,
   al mezclar se suman (gana por alumno el cambio más reciente). presentes = los on, para la versión anterior. */
export function marcarAsistencia({fecha, sedeId, disciplinaId}, ids, on){
  const rec = asistenciaDe(fecha, sedeId, disciplinaId), m = rec ? marcasDe(rec) : {};
  for(const id of [].concat(ids)) m[id] = {on: !!on, _u: Math.max(now(), (m[id]?._u || 0) + 1)};
  return guardarAsis({fecha, sedeId, disciplinaId}, rec, m);
}
export function setPresentes({fecha, sedeId, disciplinaId}, presentes){
  const rec = asistenciaDe(fecha, sedeId, disciplinaId), m = rec ? marcasDe(rec) : {}, set = new Set(presentes);
  const marca = (id, on) => { if(!!m[id]?.on !== on) m[id] = {on, _u: Math.max(now(), (m[id]?._u || 0) + 1)}; };
  for(const id in m) if(!set.has(id)) marca(id, false);
  for(const id of set) marca(id, true);
  return guardarAsis({fecha, sedeId, disciplinaId}, rec, m);
}
function guardarAsis({fecha, sedeId, disciplinaId}, rec, marcas){
  const id = asisId(fecha, sedeId, disciplinaId);
  if(rec && rec.id !== id) del("asistencias", rec.id);
  return put("asistencias", Object.assign({}, rec || {}, {id, academiaId: rec?.academiaId || academy()?.id, fecha, sedeId, disciplinaId, marcas,
    presentes: Object.keys(marcas).filter(x => marcas[x].on)}));
}
/* marcas de un registro, cuadradas con presentes: un registro sin marcas (o escrito por la versión anterior, que solo
   toca presentes) cuenta cada id de presentes como marcado en r._u y cada marca on que ya no está como desmarcada */
function marcasDe(r){
  const m = {}, u = r._u || 0, pres = new Set(r.presentes || []);
  if(isObj(r.marcas)) for(const id in r.marcas){ const x = r.marcas[id]; if(isObj(x)) m[id] = {on: !!x.on, _u: Number(x._u) || 0}; }
  if(!Array.isArray(r.presentes)) return m;
  for(const id of pres) if(!m[id]?.on) m[id] = {on: true, _u: Math.max(u, m[id]?._u || 0)};
  for(const id in m) if(m[id].on && !pres.has(id) && !isDeleted("alumnos", id)) m[id] = {on: false, _u: Math.max(u, m[id]._u)};
  return m;
}
/* deja marcas cuadradas y presentes derivado (sin alumnos borrados). No cambia _u: es igual en todos los aparatos */
function fijarAsis(r){
  const m = marcasDe(r);
  r.marcas = m;
  r.presentes = Object.keys(m).filter(id => m[id].on && !isDeleted("alumnos", id));
  return r;
}
function fijarAsistencias(){
  let n = 0;
  for(const r of Object.values(db.col.asistencias)){
    if(r._d) continue;
    const a = JSON.stringify([r.marcas, r.presentes]);
    if(JSON.stringify([fijarAsis(r).marcas, r.presentes]) !== a) n++;
  }
  return n;
}
/* por alumno gana el _u más alto; empate: gana marcado (igual en los dos aparatos) */
const gana = (x, y) => !x ? y : !y ? x : x._u !== y._u ? (x._u > y._u ? x : y) : (y.on ? y : x);
const unirMarcas = ms => { const out = {}; for(const m of ms) for(const id in m) out[id] = gana(out[id], m[id]); return out; };
const igualMarcas = (a, b) => { const ka = Object.keys(a); return ka.length === Object.keys(b).length && ka.every(id => b[id] && b[id].on === a[id].on && b[id]._u === a[id]._u); };
/* mezcla local l con remota r de la misma clase. null si l no cambia. Si l aporta marcas que r no tiene, el _u sube
   por encima del remoto para que se suba a Drive; el resto de campos, del más reciente */
function unirAsis(l, r){
  const a = marcasDe(l), b = marcasDe(r), m = unirMarcas([a, b]);
  const lu = l._u || 0, base = lu < r._u ? r : l;
  const u = igualMarcas(m, b) ? Math.max(lu, r._u) : Math.max(lu, r._u + 1);
  if(base === l && u === lu && igualMarcas(m, a)) return null;
  return fijarAsis(Object.assign({}, base, {marcas: m, presentes: undefined, _u: u}));
}
/* junta los registros repetidos de una misma clase (unión de marcas por alumno) y los pasa al id fijo. Idempotente:
   corre al cargar y tras cada mezcla con Drive (otro aparato con la versión vieja puede traer copias). El _u sale de
   los registros juntados (máximo + 1), nunca de now(): dos aparatos que migran lo mismo dan lo mismo, y cualquier
   cambio real hecho después (aquí u otro aparato) le gana */
function dedupeAsistencias(){
  const L = db.col.asistencias, grupos = new Map();
  for(const r of Object.values(L)){
    if(r._d || !r.fecha || !r.sedeId || !r.disciplinaId) continue;
    const k = asisId(r.fecha, r.sedeId, r.disciplinaId);
    if(!grupos.has(k)) grupos.set(k, []);
    grupos.get(k).push(r);
  }
  let n = 0;
  for(const [k, rs] of grupos){
    if(rs.length === 1 && rs[0].id === k) continue;
    rs.sort((a, b) => (a._c || 0) - (b._c || 0) || (a.id < b.id ? -1 : 1));
    const u = Math.max(0, ...rs.map(x => x._u || 0)) + 1;
    const base = Object.assign({}, ...rs);
    const r = fijarAsis(Object.assign(base, {id: k, marcas: unirMarcas(rs.map(marcasDe)), presentes: undefined, _c: rs[0]._c || u, _u: u}));
    if(rs.some(x => "demo" in x)) r.demo = rs.every(x => x.demo);
    delete r._d;
    for(const x of rs) if(x.id !== k) L[x.id] = {id: x.id, _u: u, _d: true};
    L[k] = r; n++;
  }
  return n;
}
/* registros de asistencia de un alumno, opcionalmente de una disciplina */
const asisDeAlumno = (alumnoId, discId) => all("asistencias").filter(a => (a.presentes || []).includes(alumnoId) && (!discId || a.disciplinaId === discId));
/* número de clases. asistenciasDe(id, desde?, discId?) o asistenciasDe(id, {desde, disc}) */
export function asistenciasDe(alumnoId, desde, discId){
  if(isObj(desde)){ discId = desde.disc; desde = desde.desde; }
  return asisDeAlumno(alumnoId, discId).filter(a => !desde || a.fecha >= desde).length;
}
export function ultimaAsistencia(alumnoId, discId){
  let u = null;
  for(const a of asisDeAlumno(alumnoId, discId)) if(!u || a.fecha > u) u = a.fecha;
  return u;
}
/* lunes de la semana de una fecha ISO */
export function lunes(iso){
  const d = parseISO(iso); if(!d) return iso;
  return addDays(iso, -((d.getDay() + 6) % 7));
}
/* {total, mes, prom4sem, ultima, dias, rachaSemanas, fechas[] (desc, sin repetir), clases[] (desc)} en una sola pasada */
export function asistenciaStats(alumnoId, discId){
  const hoy = today(), mes0 = hoy.slice(0, 7), hace28 = addDays(hoy, -27);
  const clases = asisDeAlumno(alumnoId, discId).filter(a => a.fecha && a.fecha <= hoy)
    .sort((a, b) => b.fecha.localeCompare(a.fecha)).map(a => ({fecha: a.fecha, disciplinaId: a.disciplinaId, sedeId: a.sedeId}));
  let mes = 0, ult4 = 0;
  const semanas = new Set(), fechas = [];
  for(const c of clases){
    if(c.fecha.startsWith(mes0)) mes++;
    if(c.fecha >= hace28) ult4++;
    semanas.add(lunes(c.fecha));
    if(fechas[fechas.length - 1] !== c.fecha) fechas.push(c.fecha);
  }
  /* racha: semanas seguidas con al menos una clase; la semana en curso sin clases todavía no la rompe */
  let racha = 0, w = lunes(hoy);
  if(!semanas.has(w)) w = addDays(w, -7);
  while(semanas.has(w)){ racha++; w = addDays(w, -7); }
  const ultima = fechas[0] || null;
  return {total: clases.length, mes, prom4sem: Math.round(ult4 / 4 * 10) / 10, ultima, dias: ultima ? daysBetween(ultima, hoy) : null, rachaSemanas: racha, fechas, clases};
}

/* ---------- disciplinas: etiqueta corta (BJJ, MMA, MT) para no depender solo del color ---------- */
const CORTOS = [[/kids|infantil/i, "BJJ K"], [/jiu|bjj/i, "BJJ"], [/muay/i, "MT"], [/kick/i, "KB"], [/box/i, "BOX"], [/grappling|no-?gi/i, "NOGI"], [/taekwondo/i, "TKD"], [/karate/i, "KAR"], [/judo/i, "JUDO"], [/lucha|wrestling/i, "LUCHA"], [/mma/i, "MMA"]];
export function discCorto(d){
  if(!d) return "";
  if(d.corto) return String(d.corto).slice(0, 6);
  const n = String(d.nombre || "");
  for(const [re, c] of CORTOS) if(re.test(n)) return c;
  const w = n.trim().split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w.slice(0, 3).map(x => x[0]).join("") : n.slice(0, 4)).toUpperCase();
}

/* ---------- fotos (IndexedDB) ---------- */
const fotos = new Map();
let idb = null;
function openIdb(){
  if(idb) return idb;
  idb = new Promise((res, rej) => {
    const r = indexedDB.open("mma-fotos", 1);
    r.onupgradeneeded = () => r.result.createObjectStore("fotos");
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  return idb;
}
async function tx(mode, fn){
  const d = await openIdb();
  return new Promise((res, rej) => {
    const t = d.transaction("fotos", mode), s = t.objectStore("fotos");
    const out = fn(s);
    t.oncomplete = () => res(out && out.result !== undefined ? out.result : out);
    t.onerror = () => rej(t.error);
  });
}
export async function loadFotos(){
  try{
    const d = await openIdb();
    await new Promise((res) => {
      const t = d.transaction("fotos", "readonly"), s = t.objectStore("fotos");
      const c = s.openCursor();
      c.onsuccess = () => { const cur = c.result; if(cur){ fotos.set(cur.key, cur.value); cur.continue(); } else res(); };
      c.onerror = () => res();
    });
  }catch(e){ console.warn("Sin IndexedDB para fotos", e); }
}
export const foto = id => fotos.get(id)?.data || null;
export const fotoMeta = id => fotos.get(id) || null;
export async function setFoto(id, data, u = now(), remote = false){
  if(data){ const v = {data, u}; fotos.set(id, v); try{ await tx("readwrite", s => s.put(v, id)); }catch(e){} }
  else { fotos.delete(id); try{ await tx("readwrite", s => s.delete(id)); }catch(e){} }
  if(!remote) window.dispatchEvent(new CustomEvent("mma:foto", {detail: {id}}));
}
export const fotoIds = () => [...fotos.keys()];
