/* Ficha compartible del alumno: una foto de sus datos (cinturones, asistencia, próximo pago) metida en el enlace.
   ficha.html#d=<deflate-raw + base64url del JSON>  (o #j=<base64url del JSON> si el navegador no comprime).
   Nunca lleva documento, dirección, salud, teléfono del alumno ni notas. Se lee sin internet y sin la app. */
import {b64urlEncode, b64urlDecode, today} from "./util.js";

const enc = new TextEncoder(), dec = new TextDecoder();
async function pipe(bytes, Stream, mode){
  const s = new Blob([bytes]).stream().pipeThrough(new Stream(mode));
  return new Uint8Array(await new Response(s).arrayBuffer());
}
/* JSON → fragmento "d=…" o "j=…" */
export async function encodeFicha(obj){
  const raw = enc.encode(JSON.stringify(obj));
  if(typeof CompressionStream === "function") try{ return "d=" + b64urlEncode(await pipe(raw, CompressionStream, "deflate-raw")); }catch(e){}
  return "j=" + b64urlEncode(raw);
}
export async function decodeFicha(hash){
  const h = String(hash || "").replace(/^#/, "");
  const m = /(?:^|&)([dj])=([\w-]+)/.exec(h);
  if(!m) return null;
  const bytes = b64urlDecode(m[2]);
  const txt = m[1] === "d" ? dec.decode(await pipe(bytes, DecompressionStream, "deflate-raw")) : dec.decode(bytes);
  const o = JSON.parse(txt);
  return o && o.v === 1 && o.s ? o : null;
}

/* foto pequeña (jpeg ≤ 15 KB) a partir del dataURL guardado */
async function fotoMini(src, max = 15000){
  if(!src) return null;
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
  for(const [px, q] of [[120, .7], [96, .6], [72, .55], [56, .5]]){
    const c = document.createElement("canvas"); c.width = c.height = px;
    const s = Math.min(img.naturalWidth, img.naturalHeight);
    c.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, px, px);
    const u = c.toDataURL("image/jpeg", q);
    if(u.length <= max) return u;
  }
  return null;
}

/* arma la foto de datos con el store de la app (importado al vuelo para que ficha.html no lo cargue) */
export async function fichaData(al, {foto = false} = {}){
  const S = await import("./store.js");
  const {estadoPago} = await import("./cobros.js");
  let E = null; try{ E = await import("./evaluacion.js"); await E.precargar(); }catch(e){ E = null; }
  const acad = S.academy() || {}, sede = S.get("sedes", al.sedeId);
  const discs = (al.disciplinaIds || []).map(i => S.get("disciplinas", i)).filter(Boolean);
  const d = [];
  let req = null;
  for(const x of discs){
    const g = S.rangoActual(al.id, x.id);
    if(!g) continue;
    const r = S.rankDef(x, g.rank), n = S.siguiente(al.id, x);
    const o = {n: x.nombre, r: r.n, c: r.c, gr: g.grado || 0, mx: r.g || 0, desde: g.fecha};
    if(r.c2) o.c2 = r.c2;
    if(r.tip) o.tp = r.tip;
    if(n) o.prox = {rank: n.txt, fecha: n.fecha};
    d.push(o);
    if(!req && E){ const rd = E.readiness(al, x); if(rd?.req) req = {pct: rd.req.pct, pend: rd.req.pend.slice(0, 8).map(q => q.txt)}; }
  }
  const st = S.asistenciaStats(al.id);
  const s = {n: al.nombre, d, as: {mes: st.mes, total: st.total, racha: st.rachaSemanas}};
  if(foto){ const f = await fotoMini(S.foto(al.id)).catch(() => null); if(f) s.f = f; }
  const e = estadoPago(al, acad.avisoDias ?? 5);
  if(e && !["beca", "clase", "inactivo"].includes(e.k)) s.p = {vence: e.vence || null, estado: e.k};
  if(req) s.req = req;
  const a = {n: acad.nombre || ""};
  const w = acad.telefono || sede?.telefono || acad.whatsapp;
  if(w) a.w = w;
  return {v: 1, g: today(), a, s};
}

export async function fichaUrl(al, opts = {}){
  const frag = await encodeFicha(await fichaData(al, opts));
  return new URL("ficha.html", location.href.split("#")[0]).href + "#" + frag;
}
