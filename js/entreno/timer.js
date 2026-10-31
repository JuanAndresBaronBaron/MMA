/* Temporizador de rounds a pantalla completa: verde = trabajo, rojo = descanso.
   Pita con WebAudio (aviso a 10 s del final del round), vibra y mantiene la pantalla encendida (wakeLock).
   Usa la hora real (Date.now) para no atrasarse si el navegador frena los intervalos. */
import {icon} from "../ui.js";
import {esc, h} from "../util.js";
import {t} from "../i18n.js";

export const PRESETS = [
  {id: "3x3", n: 3, trabajo: 180, descanso: 60, t: "3 × 3 min / 1"},
  {id: "5x5", n: 5, trabajo: 300, descanso: 60, t: "5 × 5 min / 1"},
  {id: "12x3", n: 12, trabajo: 180, descanso: 60, t: "12 × 3 min / 1"},
  {id: "tabata", n: 8, trabajo: 20, descanso: 10, t: "Tabata 8 × 20 s / 10"},
];
const PREP = 10;
const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
export const fmtRondas = c => `${c.n} × ${c.trabajo % 60 ? c.trabajo + " s" : c.trabajo / 60 + " min"} / ${c.descanso % 60 ? c.descanso + " s" : c.descanso / 60 + " min"}`;

let abierto = null;
/* abrir({titulo, cfg: {n, trabajo, descanso}, onDone}); sin cfg muestra los presets */
export function abrir({titulo = "", cfg = null, onDone} = {}){
  abierto?.cerrar();
  let c = cfg || PRESETS[0], fases = [], i = 0, fin = 0, quedan = 0, pausa = false, iv = 0, lock = null, ac = null, avisado = false, termino = false, ultimo = 0;
  const el = h(`<div class="tm" role="dialog" aria-modal="true" aria-label="${esc(t("Temporizador"))}" data-f="setup">
    <div class="tm-top"><span class="tm-tt">${esc(titulo || t("Temporizador"))}</span><button class="tm-x" data-x aria-label="${t("Cerrar")}">${icon("x")}</button></div>
    <div class="tm-mid">
      <span class="tm-ph" aria-live="polite"></span>
      <b class="tm-time">0:00</b>
      <span class="tm-rd"></span>
      <div class="tm-pre">${cfg ? "" : PRESETS.map(p => `<button class="tm-chip ${p === c ? "on" : ""}" data-p="${p.id}">${esc(t(p.t))}</button>`).join("")}</div>
    </div>
    <div class="tm-bot"><button class="tm-btn ghost" data-skip>${t("Saltar")}</button><button class="tm-btn main" data-go>${icon("check")} ${t("Empezar")}</button></div>
  </div>`);
  const $ = s => el.querySelector(s);
  const armar = () => {
    fases = [{f: "prep", s: PREP}];
    for(let r = 1; r <= c.n; r++){ fases.push({f: "work", s: c.trabajo, r}); if(r < c.n && c.descanso) fases.push({f: "rest", s: c.descanso, r}); }
  };
  const pinta = rest => {
    const fz = fases[i] || {};
    el.dataset.f = termino ? "fin" : fz.f || "setup";
    $(".tm-time").textContent = termino ? "0:00" : mmss(rest ?? (fz.s || c.trabajo));
    $(".tm-ph").textContent = termino ? t("¡Terminado!") : {prep: t("Prepárate"), work: t("Trabajo"), rest: t("Descanso")}[fz.f] || fmtRondas(c);
    $(".tm-rd").textContent = termino ? t("Buen trabajo") : fz.r ? t("Round {a} de {b}", {a: fz.r, b: c.n}) : fz.f ? t("Round {a} de {b}", {a: 1, b: c.n}) : "";
    $("[data-go]").innerHTML = termino ? `${icon("check")} ${t("Cerrar")}` : !fases.length ? `${icon("check")} ${t("Empezar")}` : pausa ? t("Seguir") : t("Pausa");
    $("[data-skip]").hidden = !fases.length || termino;
    $(".tm-pre").hidden = !!fases.length;
  };
  const beep = (f = 880, d = .18, n = 1) => {
    try{
      if(!ac) return;
      for(let k = 0; k < n; k++){
        const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + k * (d + .08);
        o.frequency.value = f; o.type = "square"; g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.25, t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
        o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + d + .02);
      }
    }catch(e){}
  };
  const vib = p => { try{ navigator.vibrate?.(p); }catch(e){} };
  const pedirLock = async () => { try{ if(navigator.wakeLock && !lock && document.visibilityState === "visible") lock = await navigator.wakeLock.request("screen"); lock?.addEventListener?.("release", () => { lock = null; }); }catch(e){} };
  const onVis = () => { if(document.visibilityState === "visible" && iv) pedirLock(); };
  const entrar = k => {
    i = k; avisado = false; ultimo = 0;
    const fz = fases[i];
    if(!fz){ return terminar(); }
    fin = Date.now() + fz.s * 1000;
    if(pausa) quedan = fz.s * 1000;                     // saltar en pausa: la fase nueva arranca completa
    if(fz.f === "work"){ beep(1046, .45); vib([300]); }
    else if(fz.f === "rest"){ beep(523, .45); vib([150, 80, 150]); }
    pinta(fz.s);
  };
  const tick = () => {
    if(pausa || termino) return;
    const rest = (fin - Date.now()) / 1000, fz = fases[i];
    if(fz.f === "work" && !avisado && fz.s > 15 && rest <= 10){ avisado = true; beep(1318, .12, 2); vib([80, 60, 80]); }
    const sc = Math.ceil(rest);
    if(fz.f !== "work" && sc <= 3 && sc > 0 && sc !== ultimo){ ultimo = sc; beep(660, .08); }
    if(rest <= 0) return entrar(i + 1);
    pinta(rest);
  };
  const terminar = () => {
    termino = true; clearInterval(iv); iv = 0; beep(1046, .25, 3); vib([300, 100, 300, 100, 300]);
    pinta(); onDone && onDone();
  };
  const empezar = () => {
    try{ ac = ac || new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); }catch(e){}
    armar(); pausa = false; termino = false; entrar(0);
    clearInterval(iv); iv = setInterval(tick, 200);
    pedirLock();
  };
  const cerrar = () => {
    clearInterval(iv); iv = 0;
    try{ lock?.release(); }catch(e){} lock = null;
    try{ ac?.close(); }catch(e){}
    document.removeEventListener("visibilitychange", onVis);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("hashchange", cerrar);
    el.remove(); document.body.classList.remove("tm-on");
    if(abierto === api) abierto = null;
  };
  const onKey = e => {
    if(e.key === "Escape"){ e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if(e.key === " " && fases.length && !termino){ e.preventDefault(); $("[data-go]").click(); }
  };
  el.addEventListener("click", e => {
    const tg = e.target;
    if(tg.closest("[data-x]")) return cerrar();
    const p = tg.closest("[data-p]");
    if(p && !fases.length){ c = PRESETS.find(x => x.id === p.dataset.p); el.querySelectorAll("[data-p]").forEach(x => x.classList.toggle("on", x === p)); return pinta(); }
    if(tg.closest("[data-skip]") && fases.length && !termino) return entrar(i + 1);
    if(tg.closest("[data-go]")){
      if(termino) return cerrar();
      if(!fases.length) return empezar();
      pausa = !pausa;
      if(pausa) quedan = fin - Date.now(); else fin = Date.now() + quedan;
      return pinta(pausa ? quedan / 1000 : undefined);
    }
  });
  document.addEventListener("visibilitychange", onVis);
  document.addEventListener("keydown", onKey, true);
  window.addEventListener("hashchange", cerrar);
  document.body.appendChild(el); document.body.classList.add("tm-on");
  pinta();
  setTimeout(() => $("[data-go]")?.focus(), 30);
  const api = {cerrar, el};
  return (abierto = api);
}
