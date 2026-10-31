/* Modo kiosco: una tablet en la entrada donde cada alumno se registra solo (nombre, últimos 4 del documento o QR).
   Pantalla completa sin menús (ruta bare); para salir se pide el PIN del profesor. Funciona sin conexión. */
import * as S from "../store.js";
import {icon, avatar, belt, rankLabel, modal, toast} from "../ui.js";
import {esc, norm, today, h} from "../util.js";
import {t, tn} from "../i18n.js";
import {clasesHoy, claseActual, nombreClase, checkIn, leerQr} from "../clases.js";

const st = {q: "", pin: "", setup: false, msg: ""};
let wake = null, reloj = 0, okT = 0, cam = null;

async function pedirWake(){
  try{ if("wakeLock" in navigator && document.visibilityState === "visible" && !wake){ wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => { wake = null; }); } }catch(e){ wake = null; }
}
const onVis = () => { if(document.visibilityState === "visible" && location.hash.startsWith("#/kiosko")) pedirWake(); };
document.addEventListener("visibilitychange", onVis);
function apagar(){
  try{ wake?.release(); }catch(e){} wake = null;
  clearInterval(reloj); reloj = 0;
  pararCam();
  document.querySelector(".ki-ok")?.remove();
  if(document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}
/* la clase fija del kiosco solo vale el día y en la sede en que se dicta (la tablet puede seguir en kiosco días después) */
function claseFija(sede){
  const c = S.get("clases", S.pref("kioskClase", "") || "");
  return c && c.activa !== false && c.dia === new Date().getDay() && (!c.sedeId || c.sedeId === sede) ? c : null;
}
const hora = () => new Date().toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"});

export function render(el){
  const acad = S.academy(), ss = S.sedes();
  const sede = ss.find(s => s.id === S.pref("kioskSede")) ? S.pref("kioskSede") : (S.curSede() || ss[0]?.id || "");
  if(!S.pref("kioskPin") || st.setup) return setup(el, sede);
  S.setPref("kioskOn", true);
  const fija = claseFija(sede);
  const actual = fija || claseActual(sede)?.clase || null;
  const conBarcode = "BarcodeDetector" in window;
  el.innerHTML = `<div class="ki">
    <div class="ki-top"><div class="ki-brand"><b>${esc(acad?.nombre || "")}</b><span>${actual ? esc(nombreClase(actual)) + " · " + esc(actual.hora) : esc(S.get("sedes", sede)?.nombre || "")}</span></div>
      <span class="ki-clock" data-clock>${hora()}</span>
      <button class="icon-btn" data-exit aria-label="${t("Salir del modo kiosco")}" title="${t("Salir del modo kiosco")}">${icon("x")}</button></div>
    <div class="ki-main">
      <h1 class="ki-h">${t("¡Hola! Regístrate al llegar")}</h1>
      <label class="ki-search">${icon("search")}<input id="kiQ" type="search" autocomplete="off" placeholder="${t("Escribe tu nombre")}" value="${esc(st.q)}" aria-label="${t("Escribe tu nombre")}"></label>
      <div class="ki-res" data-res></div>
      <div class="ki-or">${t("o con los últimos 4 dígitos de tu documento")}</div>
      <div class="ki-pin"><div class="ki-dots" data-dots></div>
        <div class="ki-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join("")}<button data-k="del" aria-label="${t("Borrar")}">${icon("back")}</button><button data-k="0">0</button><button class="vacio" tabindex="-1" aria-hidden="true"></button></div>
        <p class="ki-msg" data-msg aria-live="polite"></p></div>
      ${conBarcode ? `<div class="ki-foot"><button class="btn ghost big" data-qr>${icon("qr")}<span>${t("Escanear mi carné QR")}</span></button></div>` : ""}
    </div></div>`;
  const res = el.querySelector("[data-res]"), dots = el.querySelector("[data-dots]"), msg = el.querySelector("[data-msg]");
  const activos = () => S.alumnos({sede}).filter(a => a.estado !== "inactivo");
  const pintarRes = () => {
    const q = norm(st.q.trim());
    const r = q.length < 2 ? [] : activos().filter(a => norm(a.nombre).split(/\s+/).some(w => w.startsWith(q)) || norm(a.nombre).includes(q)).slice(0, 12);
    res.innerHTML = r.map(a => `<button class="ki-al" data-al="${a.id}">${avatar(a, 64)}<b>${esc(a.nombre)}</b></button>`).join("")
      || (q.length >= 2 ? `<p class="ki-sub">${t("No encontramos ese nombre. Pregunta en recepción.")}</p>` : "");
  };
  const pintarPin = () => { dots.innerHTML = [0, 1, 2, 3].map(i => `<i class="${i < st.pin.length ? "on" : ""}"></i>`).join(""); msg.textContent = st.msg; };
  pintarRes(); pintarPin();
  const q = el.querySelector("#kiQ");
  q.oninput = () => { st.q = q.value; pintarRes(); };
  el.onclick = e => {
    const tg = e.target;
    const k = tg.closest("[data-k]");
    if(k){
      st.msg = "";
      if(k.dataset.k === "del") st.pin = st.pin.slice(0, -1);
      else if(st.pin.length < 4) st.pin += k.dataset.k;
      if(st.pin.length === 4){
        const pin = st.pin, m = activos().filter(a => String(a.documento || "").replace(/\D/g, "").endsWith(pin));
        st.pin = "";
        if(m.length === 1) registrar(m[0], sede);
        else if(m.length > 1){ res.innerHTML = m.slice(0, 12).map(a => `<button class="ki-al" data-al="${a.id}">${avatar(a, 64)}<b>${esc(a.nombre)}</b></button>`).join(""); st.msg = t("Hay varias personas con esos números. Toca tu nombre."); }
        else st.msg = t("No encontramos ese número. Prueba con tu nombre.");
      }
      pintarPin(); return;
    }
    const a = tg.closest("[data-al]"); if(a){ const al = S.get("alumnos", a.dataset.al); if(al) registrar(al, sede); return; }
    if(tg.closest("[data-qr]")) return escanear(sede);
    if(tg.closest("[data-exit]")) return salir();
  };
  clearInterval(reloj);
  reloj = setInterval(() => { const c = document.querySelector("[data-clock]"); if(c) c.textContent = hora(); else { clearInterval(reloj); reloj = 0; } }, 15000);
  pedirWake();
  /* al salir de la ruta (no en cada repintado) se suelta todo */
  return () => { if(!location.hash.startsWith("#/kiosko")) apagar(); };
}

/* primera vez (o «Configurar»): sede, clase y PIN de salida */
function setup(el, sede){
  const ss = S.sedes(), hoy = clasesHoy(today(), sede), act = claseActual(sede);
  const elegida = S.pref("kioskClase", "");
  el.innerHTML = `<div class="ki"><div class="ki-setup card">
    <h2>${icon("tablet")} ${t("Configurar modo kiosco")}</h2>
    <p class="muted">${t("Deja esta pantalla en la entrada: cada alumno busca su nombre o marca los últimos 4 dígitos de su documento y queda registrado en la clase.")}</p>
    <form class="form" data-f novalidate>
      ${ss.length > 1 ? `<div class="field"><label class="lbl" for="kiSede">${t("Sede")}</label><select id="kiSede" name="sede">${ss.map(s => `<option value="${s.id}" ${s.id === sede ? "selected" : ""}>${esc(s.nombre)}</option>`).join("")}</select></div>` : ""}
      <div class="field"><span class="lbl">${t("Clase")}</span><div class="ki-clases">
        <label><input type="radio" name="clase" value="" ${!elegida ? "checked" : ""}><span><b>${t("Automática")}</b><br><small class="muted">${t("La que esté pasando según el horario; si no hay, la disciplina del alumno.")}${act ? " " + t("Ahora: {clase}", {clase: nombreClase(act.clase)}) : ""}</small></span></label>
        ${hoy.map(x => `<label><input type="radio" name="clase" value="${x.clase.id}" ${elegida === x.clase.id ? "checked" : ""}><span><b>${esc(x.clase.hora)} · ${esc(nombreClase(x.clase, x.disc))}</b></span></label>`).join("")}
      </div></div>
      <div class="field"><label class="lbl" for="kiPin">${t("PIN para salir (4 dígitos)")} <b class="req">*</b></label><input id="kiPin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" value="${esc(S.pref("kioskPin", ""))}"><small class="hint">${t("Solo lo sabe el profesor. Se pide para salir del kiosco.")}</small></div>
    </form>
    <div class="ki-foot"><a class="btn ghost" href="#/asistencia" data-cancel>${t("Cancelar")}</a><button class="btn primary big" data-start>${icon("check")}<span>${t("Empezar")}</span></button></div>
  </div></div>`;
  const sel = el.querySelector("#kiSede"); if(sel) sel.onchange = () => { S.setPref("kioskSede", sel.value); S.setPref("kioskClase", ""); setup(el, sel.value); };
  el.onclick = e => {
    /* cancelar solo desbloquea si el kiosco aún no estaba configurado; si se vino desde «Configurar» sigue en kiosco */
    if(e.target.closest("[data-cancel]")){ const ya = !!S.pref("kioskPin"); st.setup = false; if(ya){ e.preventDefault(); render(el); } else S.setPref("kioskOn", false); return; }
    if(!e.target.closest("[data-start]")) return;
    const pin = el.querySelector("#kiPin").value.trim();
    if(!/^\d{4}$/.test(pin)){ toast(t("El PIN debe tener 4 números"), "warn"); el.querySelector("#kiPin").focus(); return; }
    S.setPref("kioskPin", pin); S.setPref("kioskSede", sel ? sel.value : sede);
    S.setPref("kioskClase", el.querySelector("[name=clase]:checked")?.value || "");
    st.setup = false;
    document.documentElement.requestFullscreen?.().catch(() => {});
    render(el);
  };
}

/* registra y muestra la confirmación grande 4 s */
function registrar(al, sede){
  const fija = claseFija(sede);
  const discs = al.disciplinaIds || [];
  const ahora = Date.now(), delDia = clasesHoy(today(), sede).filter(x => discs.includes(x.clase.disciplinaId));
  const enCurso = delDia.filter(x => ahora >= x.inicio - 15 * 6e4 && ahora < x.fin);
  /* llegó antes de que abra la clase o un rato después: la de su disciplina más cercana (±60 min) */
  const cerca = delDia.filter(x => ahora >= x.inicio - 60 * 6e4 && ahora < x.fin.getTime() + 60 * 6e4)
    .sort((a, b) => Math.abs(a.inicio - ahora) - Math.abs(b.inicio - ahora))[0];
  /* la clase fija si es de su disciplina; si no, una que esté pasando (o por empezar) de su disciplina; si no, su disciplina sin horario */
  const cl = (fija && discs.includes(fija.disciplinaId) ? fija : null) || enCurso[0]?.clase || cerca?.clase || null;
  const discId = cl?.disciplinaId || discs.find(id => S.get("disciplinas", id)) || fija?.disciplinaId || S.discsOfSede(sede)[0]?.id;
  if(!discId){ toast(t("No tiene disciplina asignada"), "warn"); return; }
  const r = checkIn(al, {fecha: today(), sedeId: sede, disciplinaId: discId, claseId: cl?.id});
  st.q = ""; st.pin = ""; st.msg = "";
  const q = document.querySelector("#kiQ"); if(q) q.value = "";
  const res = document.querySelector("[data-res]"); if(res) res.innerHTML = "";
  const d = S.get("disciplinas", discId), g = d && S.rangoActual(al.id, d.id);
  const avisos = [];
  if(r.pago?.k === "vencido") avisos.push(`<div class="ki-warn err">${icon("alert")}<span>${t("Tu pago está vencido. Acércate a recepción.")}</span></div>`);
  const s = r.saldo;
  if(s && s.vencida) avisos.push(`<div class="ki-warn err">${icon("receipt")}<span>${t("Tu tiquetera venció. Pregunta por la renovación.")}</span></div>`);
  else if(s && s.saldo === 0) avisos.push(`<div class="ki-warn err">${icon("receipt")}<span>${t("Usaste todas las clases de tu tiquetera.")}</span></div>`);
  else if(s && s.saldo <= 3) avisos.push(`<div class="ki-warn warn">${icon("receipt")}<span>${tn(s.saldo, "Te queda 1 clase en tu tiquetera.", "Te quedan {n} clases en tu tiquetera.")}</span></div>`);
  document.querySelector(".ki-ok")?.remove();
  clearTimeout(okT);
  const ov = h(`<div class="ki-ok ${r.ya ? "ya" : ""} ${avisos.some(a => a.includes("err")) ? "mal" : ""}" role="alertdialog" aria-live="assertive">
    <div class="ki-check">${icon("check")}</div>
    ${avatar(al, 120)}
    <h2>${r.ya ? t("Ya estabas registrado") : t("¡Bienvenido!")}</h2>
    <div class="ki-nom">${esc(al.nombre)}</div>
    ${g ? `${belt(d, g.rank, g.grado, {w: 160, h: 26})}<span class="ki-clase">${esc(rankLabel(d, g))}</span>` : ""}
    <span class="ki-clase">${esc(cl ? nombreClase(cl, d) + " · " + cl.hora : t(d?.nombre || ""))}</span>
    ${avisos.join("")}
    <div class="ki-bar"></div></div>`);
  const cerrar = () => { clearTimeout(okT); ov.remove(); document.querySelector("#kiQ")?.focus({preventScroll: true}); };
  ov.onclick = cerrar;
  document.body.appendChild(ov);
  navigator.vibrate?.(r.ya ? [20] : [15, 60, 15]);
  okT = setTimeout(cerrar, avisos.length ? 6000 : 4000);
}

/* QR del carné con la cámara de atrás (solo navegadores con BarcodeDetector) */
function pararCam(){ if(cam){ cam.stop = true; cam.stream?.getTracks().forEach(x => x.stop()); cam.m?.close(); cam = null; } }
async function escanear(sede){
  pararCam();
  const body = h(`<div><div class="ki-video"><video playsinline muted autoplay></video></div><p class="ki-sub">${t("Acerca el código QR de tu carné a la cámara")}</p></div>`);
  const m = modal({title: t("Escanear carné"), body, foot: false, onClose: () => pararCam()});
  cam = {m, stop: false};
  try{
    const stream = await navigator.mediaDevices.getUserMedia({video: {facingMode: "environment"}, audio: false});
    if(!cam || cam.stop){ stream.getTracks().forEach(x => x.stop()); return; }
    cam.stream = stream;
    const v = body.querySelector("video"); v.srcObject = stream; await v.play().catch(() => {});
    const det = new BarcodeDetector({formats: ["qr_code"]});
    const loop = async () => {
      if(!cam || cam.stop) return;
      try{
        const r = await det.detect(v);
        for(const c of r){
          const al = leerQr(c.rawValue);
          if(al){ const mm = cam.m; cam.m = null; pararCam(); mm.close(); registrar(al, sede); return; }
        }
      }catch(e){}
      setTimeout(loop, 250);
    };
    loop();
  }catch(e){ pararCam(); m.close(); toast(t("No se pudo abrir la cámara"), "error"); }
}

/* salir o reconfigurar: pide el PIN */
function salir(){
  const body = h(`<form class="form" novalidate><div class="field"><label class="lbl" for="kiOut">${t("PIN del profesor")}</label><input id="kiOut" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off"></div></form>`);
  const m = modal({title: t("Salir del modo kiosco"), body,
    foot: `<button class="btn ghost" data-cfg>${icon("settings")} ${t("Configurar")}</button><button class="btn primary" data-out>${t("Salir")}</button>`});
  const inp = body.querySelector("input");
  setTimeout(() => inp.focus(), 80);
  const ok = () => { if(inp.value === S.pref("kioskPin")) return true; inp.value = ""; inp.classList.add("bad"); toast(t("PIN incorrecto"), "error", null, {key: "kpin"}); return false; };
  m.foot.querySelector("[data-out]").onclick = () => { if(!ok()) return; m.close(); S.setPref("kioskOn", false); apagar(); location.hash = "#/asistencia"; };
  m.foot.querySelector("[data-cfg]").onclick = () => { if(!ok()) return; m.close(); st.setup = true; const main = document.querySelector("#main"); if(main) render(main); };
  body.addEventListener("submit", e => { e.preventDefault(); m.foot.querySelector("[data-out]").click(); });
}
