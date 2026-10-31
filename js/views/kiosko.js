/* Modo kiosco: una tablet en la entrada donde cada alumno se registra solo (nombre, últimos 4 del documento o QR).
   Pantalla completa sin menús (ruta bare); para salir se pide el PIN del profesor. Funciona sin conexión. */
import * as S from "../store.js";
import {icon, avatar, belt, rankLabel, modal, toast, haptic} from "../ui.js";
import {esc, norm, today, h} from "../util.js";
import {t, tn, locale} from "../i18n.js";
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
/* reloj de pantalla de bloqueo: la hora grande y «a. m.»/«p. m.» pequeño */
const hora = () => {
  try{
    const ps = new Intl.DateTimeFormat(locale(), {hour: "numeric", minute: "2-digit"}).formatToParts(new Date());
    const per = ps.find(x => x.type === "dayPeriod")?.value || "";
    const hm = ps.filter(x => x.type !== "dayPeriod").map(x => x.value).join("").replace(/[\s\u202f\u00a0]+$/, "").replace(/^[\s\u202f\u00a0]+/, "");
    return `${esc(hm)}${per ? `<small>${esc(per)}</small>` : ""}`;
  }catch(e){ return esc(new Date().toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"})); }
};
const fechaLarga = () => { try{ return new Intl.DateTimeFormat(locale(), {weekday: "long", day: "numeric", month: "long"}).format(new Date()); }catch(e){ return ""; } };
const LETRAS = {2: "ABC", 3: "DEF", 4: "GHI", 5: "JKL", 6: "MNO", 7: "PQRS", 8: "TUV", 9: "WXYZ"};

export function render(el){
  const acad = S.academy(), ss = S.sedes();
  const sede = ss.find(s => s.id === S.pref("kioskSede")) ? S.pref("kioskSede") : (S.curSede() || ss[0]?.id || "");
  if(!S.pref("kioskPin") || st.setup) return setup(el, sede);
  S.setPref("kioskOn", true);
  const fija = claseFija(sede);
  const actual = fija || claseActual(sede)?.clase || null;
  const conBarcode = "BarcodeDetector" in window;
  el.innerHTML = `<div class="ki lock">
    <div class="ki-top"><div class="ki-brand"><b>${esc(acad?.nombre || "")}</b><span>${actual ? esc(nombreClase(actual)) + " · " + esc(actual.hora) : esc(S.get("sedes", sede)?.nombre || "")}</span></div>
      <button class="ki-x" data-exit aria-label="${t("Salir del modo kiosco")}" title="${t("Salir del modo kiosco")}">${icon("x")}</button></div>
    <div class="ki-main">
      <div class="ki-hero">
        <p class="ki-date" data-date>${esc(fechaLarga())}</p>
        <div class="ki-clock" data-clock>${hora()}</div>
        <h1 class="ki-h">${t("¡Hola! Regístrate al llegar")}</h1>
      </div>
      <div class="ki-find">
        <label class="ki-search">${icon("search")}<input id="kiQ" type="search" autocomplete="off" placeholder="${t("Escribe tu nombre")}" value="${esc(st.q)}" aria-label="${t("Escribe tu nombre")}"></label>
        <div class="ki-res" data-res></div>
      </div>
      <div class="ki-pin">
        <div class="ki-or">${t("o con los últimos 4 dígitos de tu documento")}</div>
        <div class="ki-dots" data-dots></div>
        <div class="ki-pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}" aria-label="${n}"><b>${n}</b><small aria-hidden="true">${LETRAS[n] || ""}</small></button>`).join("")}<button class="vacio" tabindex="-1" aria-hidden="true"></button><button data-k="0" aria-label="0"><b>0</b></button><button class="ki-del" data-k="del" aria-label="${t("Borrar")}">${icon("back")}</button></div>
        <p class="ki-msg" data-msg aria-live="polite"></p></div>
      ${conBarcode ? `<div class="ki-foot"><button class="btn big ki-qr" data-qr>${icon("qr")}<span>${t("Escanear mi carné QR")}</span></button></div>` : ""}
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
      haptic("light");
      if(k.dataset.k === "del") st.pin = st.pin.slice(0, -1);
      else if(st.pin.length < 4) st.pin += k.dataset.k;
      if(st.pin.length === 4){
        const pin = st.pin, m = activos().filter(a => String(a.documento || "").replace(/\D/g, "").endsWith(pin));
        st.pin = "";
        if(m.length === 1) registrar(m[0], sede);
        else if(m.length > 1){ haptic("warning"); res.innerHTML = m.slice(0, 12).map(a => `<button class="ki-al" data-al="${a.id}">${avatar(a, 64)}<b>${esc(a.nombre)}</b></button>`).join(""); st.msg = t("Hay varias personas con esos números. Toca tu nombre."); }
        else { st.msg = t("No encontramos ese número. Prueba con tu nombre."); dots.classList.remove("shake"); void dots.offsetWidth; dots.classList.add("shake"); haptic("error"); }
      }
      pintarPin(); return;
    }
    const a = tg.closest("[data-al]"); if(a){ const al = S.get("alumnos", a.dataset.al); if(al) registrar(al, sede); return; }
    if(tg.closest("[data-qr]")) return escanear(sede);
    if(tg.closest("[data-exit]")) return salir();
  };
  clearInterval(reloj);
  reloj = setInterval(() => { const c = document.querySelector("[data-clock]"); if(c){ c.innerHTML = hora(); const f = document.querySelector("[data-date]"); if(f) f.textContent = fechaLarga(); } else { clearInterval(reloj); reloj = 0; } }, 5000);
  pedirWake();
  /* al salir de la ruta (no en cada repintado) se suelta todo */
  return () => { if(!location.hash.startsWith("#/kiosko")) apagar(); };
}

/* primera vez (o «Configurar»): sede, clase y PIN de salida */
function setup(el, sede){
  const ss = S.sedes(), hoy = clasesHoy(today(), sede), act = claseActual(sede);
  const elegida = S.pref("kioskClase", "");
  el.innerHTML = `<div class="ki ki-cfg"><div class="ki-setup">
    <div class="ki-cfg-h"><span class="ki-cfg-ic">${icon("tablet")}</span><h2>${t("Configurar modo kiosco")}</h2>
    <p>${t("Deja esta pantalla en la entrada: cada alumno busca su nombre o marca los últimos 4 dígitos de su documento y queda registrado en la clase.")}</p></div>
    <form class="form" data-f novalidate>
      ${ss.length > 1 ? `<div class="card ki-card"><div class="field"><label class="lbl" for="kiSede">${t("Sede")}</label><select id="kiSede" name="sede">${ss.map(s => `<option value="${s.id}" ${s.id === sede ? "selected" : ""}>${esc(s.nombre)}</option>`).join("")}</select></div></div>` : ""}
      <h3 class="section-header" id="kiClaseL">${t("Clase")}</h3>
      <div class="grouped ki-clases" role="radiogroup" aria-labelledby="kiClaseL">
        <label class="row-inset"><input type="radio" name="clase" value="" ${!elegida ? "checked" : ""}><span class="ki-ct"><b>${t("Automática")}</b><small>${t("La que esté pasando según el horario; si no hay, la disciplina del alumno.")}${act ? " " + t("Ahora: {clase}", {clase: nombreClase(act.clase)}) : ""}</small></span><span class="ki-ck">${icon("check")}</span></label>
        ${hoy.map(x => `<label class="row-inset" style="--dc:${esc(x.disc?.color || "#888")}"><input type="radio" name="clase" value="${x.clase.id}" ${elegida === x.clase.id ? "checked" : ""}><span class="ki-ct"><b><i class="ki-dot"></i><span><span class="tnum">${esc(x.clase.hora)}</span> · ${esc(nombreClase(x.clase, x.disc))}</span></b></span><span class="ki-ck">${icon("check")}</span></label>`).join("")}
      </div>
      <div class="card ki-card"><div class="field"><label class="lbl" for="kiPin">${t("PIN para salir (4 dígitos)")} <b class="req">*</b></label><input id="kiPin" name="pin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" value="${esc(S.pref("kioskPin", ""))}"><small class="hint">${t("Solo lo sabe el profesor. Se pide para salir del kiosco.")}</small></div></div>
    </form>
    <div class="ki-foot"><a class="btn gray big" href="#/asistencia" data-cancel>${t("Cancelar")}</a><button class="btn primary big" data-start>${icon("check")}<span>${t("Empezar")}</span></button></div>
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
    <div class="ki-bar" style="--dur:${avisos.length ? 6 : 4}s"></div></div>`);
  const cerrar = () => { clearTimeout(okT); ov.remove(); document.querySelector("#kiQ")?.focus({preventScroll: true}); };
  ov.onclick = cerrar;
  document.body.appendChild(ov);
  haptic(r.ya ? "light" : avisos.length ? "warning" : "success");
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
