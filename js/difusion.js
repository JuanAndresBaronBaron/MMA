/* Mensaje masivo por WhatsApp: se elige a quién (segmento), se escribe la plantilla y se envía uno por uno.
   WhatsApp no deja enviar en lote desde la web, así que es una cola: «Abrir WhatsApp (3/24)» → enviado → siguiente.
   El avance queda en la preferencia «difusion» para seguir después de recargar. */
import * as S from "./store.js";
import {sheet, icon, toast} from "./ui.js";
import {esc, waUrl, today, parseISO, phoneDigits} from "./util.js";
import {estadoPago, diasSinVenir, ultimasAsistencias, estadoEf} from "./cobros.js";
import {t, tn} from "./i18n.js";

export const SEGMENTOS = [
  ["activos", "Todos los activos"], ["sede", "Por sede"], ["disc", "Por disciplina"], ["vencido", "Pago vencido"],
  ["ausentes", "Sin venir 14+ días"], ["cumple", "Cumplen este mes"], ["leads", "Prospectos"], ["riesgo", "En riesgo"]];
const ETAPAS = [["nuevo", "Nuevo"], ["contactado", "Contactado"], ["prueba", "Clase de prueba"], ["inscrito", "Inscrito"], ["perdido", "Perdido"]];
const VARS = ["nombre", "academia", "sede", "disciplina"];
const PLANT = {
  activos: "Hola {nombre}, te escribimos de {academia}. ",
  sede: "Hola {nombre}, aviso para la sede {sede} de {academia}: ",
  disc: "Hola {nombre}, novedades de {disciplina} en {academia}: ",
  vencido: "Hola {nombre}, te recordamos que tu mensualidad en {academia} está pendiente. Si ya pagaste, ignora este mensaje. ¡Gracias!",
  ausentes: "Hola {nombre}, te extrañamos en {academia}. ¿Todo bien? Te esperamos en la próxima clase.",
  cumple: "¡Hola {nombre}! Este mes cumples años y en {academia} queremos celebrarlo contigo. ¡Te esperamos en clase!",
  leads: "Hola {nombre}, te escribimos de {academia}. ¿Te gustaría venir a una clase de prueba esta semana?",
  riesgo: "Hola {nombre}, te extrañamos en {academia}. ¿Cómo vas? Cuéntanos si podemos ayudarte a volver a entrenar.",
};
const nom1 = n => String(n || "").trim().split(/\s+/)[0] || "";
const telDe = r => r.telefono || r.acudienteTel || "";

/* destinatarios de un segmento: [{id, nombre, tel, sede, disciplina}] */
export function destinatarios(seg, sub){
  const discN = id => { const d = S.get("disciplinas", id); return d ? t(d.nombre) : ""; };
  const sedeN = id => S.get("sedes", id)?.nombre || "";
  const al = a => ({id: a.id, nombre: a.nombre, tel: telDe(a), sede: sedeN(a.sedeId), disciplina: (a.disciplinaIds || []).map(discN).filter(Boolean).join(", ")});
  const activos = S.alumnos({sede: ""}).filter(a => estadoEf(a) === "activo");
  const acad = S.academy();
  let list;
  if(seg === "sede") list = activos.filter(a => !sub || a.sedeId === sub).map(al);
  else if(seg === "disc") list = activos.filter(a => !sub || (a.disciplinaIds || []).includes(sub)).map(a => Object.assign(al(a), sub ? {disciplina: discN(sub)} : {}));
  else if(seg === "vencido") list = activos.filter(a => estadoPago(a, acad?.avisoDias ?? 5).k === "vencido").map(al);
  else if(seg === "ausentes"){
    const ult = ultimasAsistencias();
    list = !S.all("asistencias").length ? [] : activos.filter(a => (diasSinVenir(a, ult) ?? 0) >= 14).map(al);
  }else if(seg === "cumple"){
    const m = today().slice(5, 7);
    list = activos.filter(a => parseISO(a.nacimiento) && a.nacimiento.slice(5, 7) === m).map(al);
  }else if(seg === "leads"){
    list = S.inAcad("leads").filter(l => sub ? l.etapa === sub : !["inscrito", "perdido"].includes(l.etapa))
      .map(l => ({id: l.id, nombre: l.nombre, tel: l.telefono || "", sede: sedeN(l.sedeId), disciplina: discN(l.disciplinaId), lead: true}));
  }else if(seg === "riesgo") return import("./retencion.js").then(m => m.listaRiesgo(200, "").filter(x => x.nivel !== "bajo").map(x => al(x.al))).catch(() => []);
  else list = activos.map(al);
  return list.sort((a, b) => a.nombre.localeCompare(b.nombre));
}
export function rellenar(tpl, r){
  const v = {nombre: nom1(r.nombre), academia: S.academy()?.nombre || "", sede: r.sede || "", disciplina: r.disciplina || ""};
  return String(tpl || "").replace(/\{(nombre|academia|sede|disciplina)\}/g, (_, k) => v[k]);
}
/* +57 300 1234567 para listas de difusión */
const telFmt = tel => { const raw = String(tel).trim(); let d = phoneDigits(raw); if(!raw.startsWith("+") && d.length === 10) d = "57" + d; return "+" + d; };

export async function openDifusion(opts = {}){
  const prev = S.pref("difusion", null);
  const st = {paso: "elegir", seg: opts.segmento || "activos", sub: opts.sub || "", tpl: "", list: [], i: 0, sent: []};
  /* una cola sin terminar: se ofrece seguir */
  const pendiente = prev && Array.isArray(prev.list) && prev.i < prev.list.length && !opts.segmento ? prev : null;
  const sh = sheet({title: t("Mensaje masivo"), body: `<div class="dif"></div>`, cls: "dif-sheet"});
  const box = sh.body.querySelector(".dif");
  const guardar = () => S.setPref("difusion", {seg: st.seg, sub: st.sub, tpl: st.tpl, list: st.list, i: st.i, sent: st.sent, ts: Date.now()});
  const tplDe = seg => S.pref("msg_dif_" + seg, null) || t(PLANT[seg] || PLANT.activos);

  async function cargar(){ st.list = await destinatarios(st.seg, st.sub); }
  const subOpts = () => st.seg === "sede" ? S.sedes().map(s => [s.id, s.nombre])
    : st.seg === "disc" ? S.disciplinas().map(d => [d.id, t(d.nombre)])
    : st.seg === "leads" ? [["", t("Abiertos (sin inscritos ni perdidos)")], ...ETAPAS.map(([k, n]) => [k, t(n)])] : null;

  async function paint(){
    if(st.paso === "elegir"){
      await cargar();
      const so = subOpts();
      if(so && st.seg !== "leads" && !so.some(o => o[0] === st.sub)) { st.sub = so[0]?.[0] || ""; await cargar(); }
      if(!st.tpl || st.tplSeg !== st.seg){ st.tpl = tplDe(st.seg); st.tplSeg = st.seg; }
      const con = st.list.filter(r => r.tel), sin = st.list.length - con.length;
      const ej = con[0] || st.list[0] || {nombre: t("Ana María"), sede: S.sedes()[0]?.nombre || "", disciplina: ""};
      box.innerHTML = `${pendiente && !st.descartado ? `<div class="dif-cont"><span>${icon("repeat")} ${t("Tienes un envío sin terminar ({a}/{b})", {a: pendiente.i, b: pendiente.list.length})}</span><div class="row gap"><button type="button" class="btn primary small" data-seguir>${t("Continuar")}</button><button type="button" class="btn ghost small" data-descartar>${t("Descartar")}</button></div></div>` : ""}
        <span class="lbl">${t("¿A quién le escribes?")}</span>
        <div class="chip-row dif-segs" role="radiogroup" aria-label="${t("Segmento")}">${SEGMENTOS.map(([k, n]) => `<button type="button" role="radio" aria-checked="${k === st.seg}" class="dif-seg ${k === st.seg ? "on" : ""}" data-seg="${k}">${esc(t(n))}</button>`).join("")}</div>
        ${so ? `<label class="field"><span class="lbl">${st.seg === "sede" ? t("Sede") : st.seg === "disc" ? t("Disciplina") : t("Etapa")}</span><select data-sub>${so.map(([v, n]) => `<option value="${esc(v)}" ${v === st.sub ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>` : ""}
        <p class="dif-count"><b>${tn(con.length, "1 persona con WhatsApp", "{n} personas con WhatsApp")}</b>${sin ? ` <span class="muted small">· ${tn(sin, "1 sin teléfono", "{n} sin teléfono")}</span>` : ""}</p>
        <label class="lbl" for="difTpl">${t("Mensaje")}</label>
        <div class="dif-vars">${VARS.map(v => `<button type="button" class="tag" data-var="${v}">{${v}}</button>`).join("")}</div>
        <textarea id="difTpl" class="tpl" rows="4">${esc(st.tpl)}</textarea>
        <div class="dif-prev"><span class="muted small">${t("Vista previa")}</span><p class="dif-bubble" data-prev>${esc(rellenar(st.tpl, ej))}</p></div>
        <div class="dif-foot">
          <button type="button" class="btn ghost" data-copiar ${con.length ? "" : "disabled"}>${icon("copy")} ${t("Copiar números")}</button>
          <button type="button" class="btn primary" data-empezar ${con.length ? "" : "disabled"}>${icon("whatsapp")} ${t("Empezar envío")}</button>
        </div>
        <p class="muted small">${t("Para una lista de difusión: copia los números, guárdalos en tus contactos y crea la lista en WhatsApp.")}</p>`;
      const ta = box.querySelector("#difTpl"), pv = box.querySelector("[data-prev]");
      ta.oninput = () => { st.tpl = ta.value; pv.textContent = rellenar(st.tpl, ej); };
      return;
    }
    /* cola */
    const r = st.list[st.i];
    if(!r){
      box.innerHTML = `<div class="dif-fin">${icon("check")}<h3>${t("¡Listo!")}</h3><p class="muted">${tn(st.sent.length, "Enviaste 1 mensaje.", "Enviaste {n} mensajes.")}</p><button type="button" class="btn primary" data-cerrar>${t("Cerrar")}</button></div>`;
      S.setPref("difusion", null);
      return;
    }
    const msg = rellenar(st.tpl, r), n = st.list.length;
    box.innerHTML = `<div class="dif-q">
      <div class="dif-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${st.i}"><span style="width:${Math.round(st.i / n * 100)}%"></span></div>
      <p class="muted small">${t("Mensaje {a} de {b}", {a: st.i + 1, b: n})}</p>
      <h3 class="dif-who">${esc(r.nombre)}</h3><p class="muted small">${esc(r.tel)}${r.sede ? " · " + esc(r.sede) : ""}</p>
      <p class="dif-bubble">${esc(msg)}</p>
      <a class="btn primary big block" data-abrir target="_blank" rel="noopener" href="${esc(waUrl(r.tel, msg))}">${icon("whatsapp")} ${t("Abrir WhatsApp ({a}/{b})", {a: st.i + 1, b: n})}</a>
      <div class="dif-foot">
        <button type="button" class="btn ghost" data-saltar>${t("Saltar")}</button>
        <button type="button" class="btn ok" data-enviado ${st.abierto ? "" : "disabled"}>${icon("check")} ${t("Enviado · siguiente")}</button>
      </div>
      <button type="button" class="btn-link" data-volver>${t("Cambiar mensaje o segmento")}</button></div>`;
  }

  box.addEventListener("click", async e => {
    const tg = e.target;
    const sg = tg.closest("[data-seg]"); if(sg){ st.seg = sg.dataset.seg; st.sub = ""; return paint(); }
    const v = tg.closest("[data-var]"); if(v){
      const ta = box.querySelector("#difTpl"), s = ta.selectionStart ?? ta.value.length, txt = `{${v.dataset.var}}`;
      ta.value = ta.value.slice(0, s) + txt + ta.value.slice(ta.selectionEnd ?? s); ta.focus(); ta.setSelectionRange(s + txt.length, s + txt.length);
      ta.dispatchEvent(new Event("input")); return;
    }
    if(tg.closest("[data-seguir]")){ Object.assign(st, pendiente, {paso: "cola"}); st.tplSeg = st.seg; return paint(); }
    if(tg.closest("[data-descartar]")){ st.descartado = true; S.setPref("difusion", null); return paint(); }
    if(tg.closest("[data-copiar]")){
      const nums = st.list.filter(r => r.tel).map(r => telFmt(r.tel)).join("\n");
      try{ await navigator.clipboard.writeText(nums); toast(tn(st.list.filter(r => r.tel).length, "1 número copiado", "{n} números copiados")); }
      catch(err){ toast(t("No se pudo copiar"), "warn"); }
      return;
    }
    if(tg.closest("[data-empezar]")){
      st.list = st.list.filter(r => r.tel); st.i = 0; st.sent = []; st.paso = "cola"; st.abierto = false;
      if(st.tpl !== t(PLANT[st.seg] || "")) S.setPref("msg_dif_" + st.seg, st.tpl);
      guardar(); return paint();
    }
    if(tg.closest("[data-abrir]")){ st.abierto = true; setTimeout(() => { const b = box.querySelector("[data-enviado]"); if(b) b.disabled = false; }, 300); return; }
    if(tg.closest("[data-enviado]")){ st.sent.push(st.list[st.i].id); st.i++; st.abierto = false; guardar(); return paint(); }
    if(tg.closest("[data-saltar]")){ st.i++; st.abierto = false; guardar(); return paint(); }
    if(tg.closest("[data-volver]")){ st.paso = "elegir"; return paint(); }
    if(tg.closest("[data-cerrar]")) sh.close();
  });
  box.addEventListener("change", e => { if(e.target.matches("[data-sub]")){ st.sub = e.target.value; paint(); } });
  await paint();
  return sh;
}
