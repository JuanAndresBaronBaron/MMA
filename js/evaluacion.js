/* Evaluación del currículo por cinturón: qué requisitos domina el alumno y si está listo para subir.
   El currículo vive en js/entreno/curriculos.js (se carga solo cuando hace falta).
   Niveles por requisito: 0 no visto, 1 aprendiendo, 2 en drill, 3 en vivo. */
import * as S from "./store.js";
import {today, daysBetween, norm, esc, waUrl, fmtDate} from "./util.js";
import {modal, avatar, icon, toast, rankLabel} from "./ui.js";
import {t, tn} from "./i18n.js";

let CUR = null, KEY = null, carga = null;
/* carga el currículo una vez; devuelve true si quedó disponible */
export function precargar(){
  if(CUR) return Promise.resolve(true);
  return carga || (carga = import("./entreno/curriculos.js").then(m => { CUR = m.CURRICULOS || null; KEY = m.curriculoKey || null; return !!CUR; }).catch(() => { carga = null; return false; }));
}
export const listo = () => !!CUR;
export const NIVELES = ["No visto", "Aprendiendo", "En drill", "En vivo"];

/* clave del currículo de una disciplina: bjj, bjjkids, muaythai, lucha, boxeo, mma */
export function claveDe(disc){
  if(!CUR || !disc) return null;
  try{ const k = KEY && KEY(disc); if(k && CUR[k]) return k; }catch(e){}
  const s = disc.sistema, n = norm(disc.nombre);
  const k = s && s !== "niveles" && CUR[s] ? s : /lucha|wrestl/.test(n) ? "lucha" : /box/.test(n) ? "boxeo" : /mma|mixt/.test(n) ? "mma"
    : /jiu|bjj/.test(n) ? (/kid|infantil/.test(n) ? "bjjkids" : "bjj") : /muay|thai/.test(n) ? "muaythai" : null;
  return k && CUR[k] ? k : null;
}
/* rango del currículo para el cinturón rankIdx: por índice si el nombre coincide; si no, por nombre */
export function curriculo(disc, rankIdx){
  const k = claveDe(disc); if(!k) return null;
  const rs = CUR[k].rangos || [], nom = norm(S.rankDef(disc, rankIdx).n);
  const byI = rs[rankIdx];
  if(byI && (!nom || nom === "—" || norm(byI.rank) === nom)) return byI;
  return rs.find(r => norm(r.rank) === nom) || byI || null;
}
/* requisitos en lista plana, cada uno con su bloque de grado (g) */
export const reqsDe = rango => !rango ? [] : (rango.grados || []).flatMap(b => (b.req || []).map(r => Object.assign({g: b.g, bloque: b.titulo}, r)));

export const evalId = (alumnoId, discId, rankIdx) => `${alumnoId}:${discId}:${rankIdx}`;
export const evaluacion = (alumnoId, discId, rankIdx) => S.get("evaluaciones", evalId(alumnoId, discId, rankIdx));
export function guardarEval(alumnoId, discId, rankIdx, items, nota = "", por = ""){
  return S.put("evaluaciones", {id: evalId(alumnoId, discId, rankIdx), academiaId: S.academy()?.id, alumnoId, discId, rank: +rankIdx, items: Object.assign({}, items), nota, fecha: today(), por});
}

/* estado de requisitos. hastaG: solo los bloques hasta ese grado (para una raya); sin él, todo el cinturón */
export function estadoReq(alumnoId, disc, rankIdx, hastaG){
  const rango = curriculo(disc, rankIdx);
  let reqs = reqsDe(rango);
  if(hastaG != null){ const sub = reqs.filter(r => r.g == null || +r.g <= hastaG); if(sub.length) reqs = sub; }
  if(!reqs.length) return null;
  const it = evaluacion(alumnoId, disc.id, rankIdx)?.items || {};
  const ok = reqs.filter(r => (it[r.id] || 0) >= 2).length;
  const criticosPend = reqs.filter(r => r.critico && (it[r.id] || 0) < 3);
  const pct = Math.round(ok / reqs.length * 100);
  return {total: reqs.length, ok, pct, criticosPend, pend: reqs.filter(r => (it[r.id] || 0) < 2), listo: ok / reqs.length >= 0.8 && !criticosPend.length, rango};
}

/* ¿listo para subir? tiempo (mínimos del cinturón), clases desde la última promoción (rank.cl) y requisitos */
export function readiness(al, disc){
  const h = S.gradosDe(al.id, disc.id);
  if(!h.length) return null;
  const cur = h[h.length - 1], n = S.siguiente(al.id, disc);
  if(!n) return null;
  const rd = S.rankDef(disc, cur.rank);
  const tiempo = {ok: !!n.listo, faltanDias: n.listo ? 0 : Math.max(0, daysBetween(today(), n.fecha)), fecha: n.fecha};
  const min = Number(rd.cl) || 0, hechas = S.asistenciasDe(al.id, cur.fecha, disc.id);
  const clases = {ok: !min || hechas >= min, hechas, min, faltan: Math.max(0, min - hechas)};
  const req = estadoReq(al.id, disc, cur.rank, n.tipo === "grado" ? (cur.grado || 0) + 1 : null);
  return {tiempo, clases, req, n, cur, listo: tiempo.ok && clases.ok && (!req || req.listo)};
}

/* ---------- modal «Evaluar» ---------- */

export const CATS = {fundamentos: "Fundamentos", guardia: "Guardia", pase: "Pases", sumision: "Sumisiones", derribo: "Derribos", escape: "Escapes", vivo: "En vivo", golpeo: "Golpeo", defensa: "Defensa", clinch: "Clinch", conocimiento: "Conocimiento", actitud: "Actitud", fisico: "Físico"};
const NIV_C = ["n0", "n1", "n2", "n3"];

/* texto de WhatsApp con lo que le falta */
export function msgFaltan(al, disc, est, rankTxt){
  const pend = est.pend.slice(0, 8).map(r => "• " + r.txt).join("\n");
  return t("Hola {nombre}, te faltan {n} requisitos para {rank}:", {nombre: al.nombre.split(" ")[0], n: est.pend.length, rank: rankTxt}) + "\n" + pend + (est.pend.length > 8 ? "\n…" : "") + "\n" + t("¡Vamos con toda en las próximas clases!");
}

export async function evaluarModal(al, disc){
  await precargar();
  const g = S.rangoActual(al.id, disc.id);
  const rankIdx = g ? g.rank : 0;
  const rango = curriculo(disc, rankIdx), reqs = reqsDe(rango);
  const n = S.siguiente(al.id, disc), rankTxt = n ? n.txt : t(S.rankDef(disc, rankIdx).n);
  const ev = evaluacion(al.id, disc.id, rankIdx);
  const items = Object.assign({}, ev?.items || {});
  let soloPend = false;
  const head = `<div class="pay-head">${avatar(al, 44)}<div><b>${esc(al.nombre)}</b><span class="muted small">${esc(t(disc.nombre))} · ${esc(rankLabel(disc, g))}</span></div></div>`;
  if(!reqs.length){
    modal({title: t("Evaluar"), body: `${head}<p class="muted">${t("Todavía no hay currículo para este cinturón. Puedes seguir usando el tiempo mínimo y las clases para decidir.")}</p>`, foot: `<button class="btn primary" data-close>${t("Entendido")}</button>`});
    return;
  }
  /* bloques de grado y, dentro, categorías */
  const bloques = (rango.grados || []).filter(b => (b.req || []).length).map(b => {
    const cats = [];
    for(const r of b.req){ let c = cats.find(x => x.cat === r.cat); if(!c) cats.push(c = {cat: r.cat, req: []}); c.req.push(r); }
    return {b, cats};
  });
  const seg = r => `<div class="ev-seg" role="radiogroup" aria-label="${esc(r.txt)}">${NIVELES.map((x, i) => `<label class="${NIV_C[i]}"><input type="radio" name="${esc(r.id)}" value="${i}" ${(items[r.id] || 0) === i ? "checked" : ""}><span>${t(x)}</span></label>`).join("")}</div>`;
  const body = `${head}
    <div class="ev-sum" data-sum></div>
    <div class="ev-tools"><label class="chip"><input type="checkbox" data-pend><span>${t("Solo pendientes")}</span></label>
      <span class="muted small">${t("Para subir: 80% en drill o más y los críticos en vivo.")}</span></div>
    <div class="ev-list">${bloques.map(({b, cats}) => `<section class="ev-blk"><h4>${b.g ? `<span class="ev-g">${tn(b.g, "1° grado", "{n}° grado")}</span>` : ""}${esc(b.titulo || "")}</h4>
      ${cats.map(c => `<h5 class="ev-cat">${esc(t(CATS[c.cat] || c.cat || ""))}</h5>${c.req.map(r => `<div class="ev-it" data-r="${esc(r.id)}"><p>${r.critico ? `<span class="ev-crit" title="${t("Crítico: debe estar en vivo")}">${icon("star")}<span class="sr">${t("Crítico")}</span></span>` : ""}${esc(r.txt)}</p>${seg(r)}</div>`).join("")}`).join("")}</section>`).join("")}</div>
    <div class="field"><label class="lbl" for="evNota">${t("Nota")}</label><textarea id="evNota" rows="2" placeholder="${t("Ej: mejorar la postura en la guardia cerrada")}">${esc(ev?.nota || "")}</textarea></div>
    ${ev?.fecha ? `<p class="muted small">${t("Última evaluación: {fecha}", {fecha: fmtDate(ev.fecha)})}${ev.por ? " · " + esc(ev.por) : ""}</p>` : ""}`;
  const tel = al.telefono || al.acudienteTel;
  const m = modal({title: t("Evaluar · {rank}", {rank: t(S.rankDef(disc, rankIdx).n)}), body, wide: true, cls: "ev-modal",
    foot: `${tel ? `<button class="btn ghost left" data-wa>${icon("whatsapp")} <span>${t("Enviar por WhatsApp")}</span></button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Guardar")}</button>`});
  const est = () => {
    const sel = n && n.tipo === "grado" ? reqs.filter(r => r.g == null || +r.g <= (g.grado || 0) + 1) : reqs;
    const L = sel.length ? sel : reqs;
    const ok = L.filter(r => (items[r.id] || 0) >= 2).length, crit = L.filter(r => r.critico && (items[r.id] || 0) < 3);
    return {total: L.length, ok, pct: Math.round(ok / L.length * 100), criticosPend: crit, pend: L.filter(r => (items[r.id] || 0) < 2), listo: ok / L.length >= .8 && !crit.length};
  };
  const pinta = () => {
    const e = est();
    m.body.querySelector("[data-sum]").innerHTML = `<div class="ev-sum-h"><b>${t("Para {rank}: {ok}/{total}", {rank: esc(rankTxt), ok: e.ok, total: e.total})}</b><span class="${e.listo ? "ok-t" : "muted"} small">${e.listo ? icon("check") + " " + t("Listo en requisitos") : e.criticosPend.length ? tn(e.criticosPend.length, "1 crítico pendiente", "{n} críticos pendientes") : t("{pct}% dominado", {pct: e.pct})}</span></div>
      <div class="progress ${e.listo ? "ok" : ""}"><span style="width:${e.pct}%"></span></div>`;
    for(const x of m.body.querySelectorAll(".ev-it")){ const v = items[x.dataset.r] || 0; x.dataset.n = v; x.hidden = soloPend && v >= 2 && !(reqs.find(r => r.id === x.dataset.r)?.critico && v < 3); }
    for(const b of m.body.querySelectorAll(".ev-blk")) b.hidden = ![...b.querySelectorAll(".ev-it")].some(x => !x.hidden);
  };
  m.body.addEventListener("change", e => {
    if(e.target.matches("[data-pend]")){ soloPend = e.target.checked; return pinta(); }
    if(e.target.type === "radio"){ items[e.target.name] = +e.target.value; pinta(); }
  });
  pinta();
  /* el modal enfoca el primer campo (la nota, al final): volver arriba */
  setTimeout(() => { m.body.scrollTop = 0; m.el.querySelector(".modal").focus({preventScroll: true}); }, 90);
  m.foot.querySelector("[data-save]").onclick = () => {
    guardarEval(al.id, disc.id, rankIdx, items, m.body.querySelector("#evNota").value.trim(), S.pref("profesor", "") || disc.encargado || "");
    const e = est();
    toast(e.listo ? t("Evaluación guardada: listo en requisitos") : t("Evaluación guardada: {ok}/{total}", {ok: e.ok, total: e.total}));
    m.close();
  };
  const wa = m.foot.querySelector("[data-wa]");
  if(wa) wa.onclick = () => { const e = est(); window.open(waUrl(tel, e.pend.length ? msgFaltan(al, disc, e, rankTxt) : t("Hola {nombre}, ya cumples los requisitos para {rank}. ¡Felicitaciones!", {nombre: al.nombre.split(" ")[0], rank: rankTxt})), "_blank", "noopener"); };
}
