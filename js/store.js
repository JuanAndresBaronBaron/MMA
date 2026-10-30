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
export function load(){ db = readLocal(); }
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

/* ---------- mezclar con la copia de Google ---------- */
export function merge(remote, local = false){
  if(!isObj(remote) || !isObj(remote.col)) return false;
  let any = false;
  for(const c of COLS){
    const R = remote.col[c]; if(!isObj(R)) continue;
    const L = db.col[c];
    for(const id in R){
      const r = R[id]; if(!isObj(r) || typeof r._u !== "number") continue;
      if(!L[id] || (L[id]._u || 0) < r._u){ L[id] = r; any = true; }
    }
  }
  if(any) changed(local);
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
  db = d; changed();
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
export function asistenciasDe(alumnoId, desde){
  return all("asistencias").filter(a => (a.presentes || []).includes(alumnoId) && (!desde || a.fecha >= desde)).length;
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
