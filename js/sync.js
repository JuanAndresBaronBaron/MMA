/* Sincronización con Google Drive, sin servidor.
   - Google Identity Services (modelo de token) con el permiso drive.appdata y nada más: la app solo ve su carpeta
     privada dentro del Drive de quien entra; no puede leer los demás archivos de la persona.
   - "mma-academia.json": todos los datos (store.js). Al sincronizar se baja, se mezcla registro a registro (gana el
     cambio más reciente) y, si este aparato tenía algo nuevo, se sube la mezcla.
   - "foto-<idAlumno>.json": una por foto, para no subir todas cada vez. El alumno guarda fotoU (cuándo cambió su foto).
   - El permiso dura ~1 hora; renovarlo abre (y cierra sola) una ventanita de Google, que el navegador solo deja abrir
     dentro de un toque. Se renueva de paso en un toque normal (como mucho cada 45 min) o con «Reconectar». */
import * as S from "./store.js";
import {GOOGLE_CLIENT_ID} from "./config.js";
import {isObj, now} from "./util.js";

const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const GSI = "https://accounts.google.com/gsi/client";
const API = "https://www.googleapis.com/drive/v3/files", UP = "https://www.googleapis.com/upload/drive/v3/files";
const ABOUT = "https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName,photoLink)";
const NAME = "mma-academia.json";
const MKEY = "mma:sync", TKEY = "mma:tok", QKEY = "mma:fotoQ";
const MIN = 6e4;

class SErr extends Error { constructor(code, status){ super(code); this.code = code; this.status = status || 0; } }
const online = () => navigator.onLine !== false;
const rd = (k, d) => { try{ const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; }catch(e){ return d; } };
const wr = (k, v) => { try{ v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); }catch(e){} };

export const clientId = () => S.pref("clientId", "") || GOOGLE_CLIENT_ID;
const meta = () => Object.assign({connected: false, email: "", name: "", photo: "", fileId: null, lastSync: 0, dirty: false, renewAt: 0}, rd(MKEY, {}));
const setMeta = p => { const m = Object.assign(meta(), p); wr(MKEY, m); return m; };
export const connected = () => meta().connected;

/* ---------- estado visible ---------- */
let phase = connected() ? "pending" : "off", errMsg = "";
const subs = new Set();
export function status(){ const m = meta(); return {phase, msg: errMsg, email: m.email, name: m.name, photo: m.photo, lastSync: m.lastSync, dirty: m.dirty}; }
export const onStatus = fn => { subs.add(fn); fn(status()); return () => subs.delete(fn); };
function setPhase(p, msg = ""){ phase = p; errMsg = msg; const s = status(); for(const f of subs) try{ f(s); }catch(e){} }

/* ---------- token ---------- */
let tok = rd(TKEY, null);
const tokOk = () => tok && typeof tok.t === "string" && tok.exp - 2 * MIN > now();
function setTok(t, sec){ tok = {t, exp: now() + (sec > 0 ? sec : 3600) * 1000}; wr(TKEY, tok); }
function dropTok(){ tok = null; wr(TKEY, null); }

let gisP = null, client = null, clientFor = "", pend = null;
const gisReady = () => { try{ return !!(window.google && google.accounts && google.accounts.oauth2); }catch(e){ return false; } };
function loadGis(){
  if(gisReady()) return Promise.resolve();
  if(!online()) return Promise.reject(new SErr("offline"));
  if(!gisP) gisP = new Promise((res, rej) => {
    const s = document.createElement("script"); s.src = GSI; s.async = true;
    s.onload = () => gisReady() ? res() : (gisP = null, rej(new SErr("gis")));
    s.onerror = () => { s.remove(); gisP = null; rej(new SErr("gis")); };
    document.head.appendChild(s);
  });
  return gisP;
}
function tokenClient(){
  if(client && clientFor === clientId()) return client;
  clientFor = clientId();
  client = google.accounts.oauth2.initTokenClient({client_id: clientFor, scope: SCOPE,
    callback: r => {
      const p = pend; pend = null;
      const got = !!(r && !r.error && r.access_token);
      let ok = got; if(got) try{ ok = google.accounts.oauth2.hasGrantedAllScopes(r, SCOPE); }catch(e){}
      if(!p){ if(ok){ setTok(r.access_token, +r.expires_in); sync(); } return; }
      if(!got) return p.rej(new SErr(r && r.error === "access_denied" ? "denied" : "auth"));
      if(!ok) return p.rej(new SErr("scope"));
      setTok(r.access_token, +r.expires_in); p.res();
    },
    error_callback: e => { const p = pend; pend = null; if(p) p.rej(new SErr(e && e.type === "popup_closed" ? "closed" : "blocked")); }});
  return client;
}
/* llamar SIEMPRE dentro de un manejador de click */
function askToken(interactive){
  const go = () => new Promise((res, rej) => {
    if(pend){ pend.rej(new SErr("superseded")); pend = null; }
    pend = {res, rej};
    const m = meta(), o = {prompt: interactive && !m.email ? "select_account" : ""};
    if(m.email) o.login_hint = m.email;
    try{ tokenClient().requestAccessToken(o); }catch(e){ pend = null; rej(new SErr("gis")); }
  });
  return gisReady() ? go() : loadGis().then(go);
}

/* ---------- Drive REST v3 ---------- */
async function drive(method, url, opt = {}, again){
  if(!online()) throw new SErr("offline");
  if(!tokOk()) throw new SErr("reconnect");
  let r;
  try{ r = await fetch(url, {method, headers: Object.assign({Authorization: "Bearer " + tok.t}, opt.headers || {}), body: opt.body, cache: "no-store"}); }
  catch(e){ throw new SErr(online() ? "net" : "offline"); }
  if(r.status === 401){ dropTok(); throw new SErr("reconnect", 401); }
  if(!r.ok){
    let reason = "";
    try{ const j = await r.json(); reason = (((j.error || {}).errors || [])[0] || {}).reason || ""; }catch(e){}
    if(r.status === 403 && /storageQuota/i.test(reason)) throw new SErr("full", 403);
    if(r.status === 403 && !/rate|limit/i.test(reason)){ dropTok(); throw new SErr("reconnect", 403); }
    if(r.status === 404) throw new SErr("gone", 404);
    throw new SErr(r.status === 429 || r.status === 403 ? "rate" : "server", r.status);
  }
  if(opt.text) return r.text();
  if(r.status === 204) return null;
  try{ return await r.json(); }catch(e){ return null; }
}
async function listFiles(){
  const out = [];
  let page = "";
  do{
    const r = await drive("GET", `${API}?spaces=appDataFolder&pageSize=1000&fields=nextPageToken,files(id,name,modifiedTime,appProperties)${page ? "&pageToken=" + page : ""}`);
    out.push(...((r && r.files) || []));
    page = r && r.nextPageToken;
  }while(page);
  return out;
}
function upload(id, name, obj, props = {}){
  const md = {appProperties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, String(v)]))};
  if(!id) Object.assign(md, {name, parents: ["appDataFolder"], mimeType: "application/json"});
  const B = "mma" + Math.random().toString(36).slice(2);
  const body = `--${B}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(md)}\r\n--${B}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(obj)}\r\n--${B}--`;
  const url = id ? `${UP}/${encodeURIComponent(id)}?uploadType=multipart&fields=id,modifiedTime` : `${UP}?uploadType=multipart&fields=id,modifiedTime`;
  return drive(id ? "PATCH" : "POST", url, {body, headers: {"Content-Type": `multipart/related; boundary=${B}`}});
}
const download = async id => { const t = await drive("GET", `${API}/${encodeURIComponent(id)}?alt=media`, {text: true}); try{ return JSON.parse(t); }catch(e){ throw new SErr("bad"); } };
const remove = id => drive("DELETE", `${API}/${encodeURIComponent(id)}`).catch(e => { if(e.code !== "gone") throw e; });

/* ---------- fotos pendientes de subir ---------- */
const fotoQ = () => new Set(rd(QKEY, []));
export function queueFoto(id){ const q = fotoQ(); q.add(id); wr(QKEY, [...q]); markDirty(); }

/* ---------- sincronizar ---------- */
let running = null, again = false, pushT = 0;
export function sync(){
  if(!connected()) return Promise.resolve();
  if(running){ again = true; return running; }
  running = (async () => {
    do{
      again = false;
      try{ await syncOnce(); }
      catch(e){ handleErr(e); break; }
    }while(again);
  })().finally(() => { running = null; });
  return running;
}
async function syncOnce(){
  if(!online()) throw new SErr("offline");
  if(!tokOk()) throw new SErr("reconnect");
  setPhase("syncing");
  const files = await listFiles();
  const byName = new Map(files.map(f => [f.name, f]));
  const main = byName.get(NAME);
  let remote = null;
  if(main){ remote = await download(main.id); S.merge(remote); }
  const m = meta();
  let fileId = main ? main.id : null;
  if(!main || S.aheadOf(remote)){
    S.compact();
    const snap = S.snapshot();
    const r = await upload(fileId, NAME, Object.assign(snap, {saved: new Date().toISOString()}), {v: S.VER});
    fileId = r.id;
  }
  /* fotos: subir las de este aparato, bajar las nuevas de Google */
  const q = fotoQ();
  for(const id of [...q]){
    const al = S.get("alumnos", id), fm = S.fotoMeta(id), f = byName.get(`foto-${id}.json`);
    if(fm && al) await upload(f ? f.id : null, `foto-${id}.json`, {data: fm.data, u: fm.u}, {u: fm.u});
    else if(f) await remove(f.id);
    q.delete(id); wr(QKEY, [...q]);
  }
  for(const al of S.all("alumnos")){
    if(!al.fotoU) continue;
    const fm = S.fotoMeta(al.id), f = byName.get(`foto-${al.id}.json`);
    if(al.foto === false){ if(fm) await S.setFoto(al.id, null, 0, true); continue; }
    if(f && (!fm || fm.u < al.fotoU) && Number(f.appProperties?.u || 0) > (fm?.u || 0)){
      const o = await download(f.id);
      if(o && o.data){ await S.setFoto(al.id, o.data, Number(o.u) || al.fotoU, true); window.dispatchEvent(new CustomEvent("mma:foto", {detail: {id: al.id, remote: true}})); }
    }
  }
  /* fotos de alumnos borrados */
  for(const f of files){
    const mm = /^foto-(.+)\.json$/.exec(f.name);
    if(mm && !S.get("alumnos", mm[1]) && S.all("alumnos").length) await remove(f.id);
  }
  const fresh = meta();
  setMeta({fileId, lastSync: now(), dirty: fresh.dirty && fresh.lastLocal > m.lastLocal ? true : false});
  setPhase("ok");
}
const MSG = {
  offline: "Sin conexión. Los cambios quedan guardados en este aparato y se suben al volver la red.",
  reconnect: "El permiso de Google caducó. Toca «Reconectar».",
  denied: "No se dio permiso a la app en Google.",
  scope: "Hace falta marcar la casilla de Google Drive al dar permiso.",
  closed: "Se cerró la ventana de Google antes de terminar.",
  blocked: "El navegador bloqueó la ventana de Google. Permite ventanas emergentes para este sitio.",
  gis: "No se pudo cargar el inicio de sesión de Google.",
  full: "Tu Google Drive está lleno.",
  rate: "Google pidió esperar un poco. Se reintenta solo.",
  net: "Fallo de red. Se reintenta solo.",
  server: "Google respondió con un error. Se reintenta solo.",
  bad: "La copia de Google está dañada.",
  auth: "Google rechazó el inicio de sesión.",
};
export const errText = code => MSG[code] || "Error inesperado al sincronizar.";
let retryT = 0;
function handleErr(e){
  const c = e && e.code || "server";
  if(c !== "offline" && c !== "reconnect") console.warn("[sync]", e);
  setPhase(c === "reconnect" ? "reconnect" : c === "offline" ? "offline" : "error", errText(c));
  if(["rate", "net", "server"].includes(c)){ clearTimeout(retryT); retryT = setTimeout(sync, 60e3); }
}

function markDirty(){ setMeta({dirty: true, lastLocal: now()}); if(phase === "ok") setPhase("ok"); schedulePush(); }
function schedulePush(){ clearTimeout(pushT); pushT = setTimeout(() => sync(), 4000); }

/* ---------- acciones de la interfaz (desde un click) ---------- */
export async function connect(){
  setPhase("syncing");
  try{
    await askToken(true);
    const u = await drive("GET", ABOUT);
    setMeta({connected: true, email: u?.user?.emailAddress || "", name: u?.user?.displayName || "", photo: u?.user?.photoLink || "", renewAt: now()});
    /* fotos que ya había en este aparato: a la cola */
    for(const id of S.fotoIds()) { const q = fotoQ(); q.add(id); wr(QKEY, [...q]); }
    await sync();
    return true;
  }catch(e){ handleErr(e); if(!connected()) setPhase("off", errText(e.code)); throw e; }
}
export async function reconnect(){
  try{ await askToken(true); setMeta({renewAt: now()}); await sync(); }
  catch(e){ handleErr(e); }
}
export function disconnect(){
  try{ if(tok && window.google) google.accounts.oauth2.revoke(tok.t, () => {}); }catch(e){}
  dropTok(); wr(MKEY, null); setPhase("off");
}
/* renovación de paso: en cualquier toque, si el permiso caduca pronto (como mucho cada 45 min) */
function onTap(){
  if(!connected() || !online()) return;
  const m = meta();
  const soon = !tok || tok.exp - 5 * MIN < now();
  if(soon && now() - (m.renewAt || 0) > 45 * MIN){
    setMeta({renewAt: now()});
    askToken(false).then(() => sync(), e => handleErr(e));
  }
}

export function init(){
  S.subscribe(({local}) => { if(local && connected()) markDirty(); });
  document.addEventListener("click", onTap, true);
  window.addEventListener("online", () => sync());
  window.addEventListener("offline", () => connected() && setPhase("offline", errText("offline")));
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "visible") sync();
    else if(meta().dirty){ clearTimeout(pushT); sync(); }
  });
  setInterval(() => { if(document.visibilityState === "visible") sync(); }, 2 * MIN);
  if(connected()){ if(tokOk()) sync(); else setPhase("reconnect", errText("reconnect")); }
}
