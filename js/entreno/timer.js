/* Temporizador de rounds a pantalla completa, al estilo del temporizador del Reloj de iOS:
   cifra enorme de trazo fino, anillo que se vacía y botones redondos (verde = empezar o seguir, naranja = pausa).
   Fase: verde = trabajo, rojo = descanso, ámbar = prepárate.
   Pita con WebAudio (aviso a 10 s del final del round), vibra y mantiene la pantalla encendida (wakeLock).
   Usa la hora real (Date.now) para no atrasarse si el navegador frena los intervalos. */
import {icon, haptic} from "../ui.js";
import {esc, h} from "../util.js";
import {t} from "../i18n.js";

export const PRESETS = [
  {id: "3x3", n: 3, trabajo: 180, descanso: 60, t: "3 × 3 min / 1"},
  {id: "5x5", n: 5, trabajo: 300, descanso: 60, t: "5 × 5 min / 1"},
  {id: "12x3", n: 12, trabajo: 180, descanso: 60, t: "12 × 3 min / 1"},
  {id: "tabata", n: 8, trabajo: 20, descanso: 10, t: "Tabata 8 × 20 s / 10"},
];
const PREP = 10;
const R = 46, C = 2 * Math.PI * R;   // anillo (viewBox 100 × 100)
const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
export const fmtRondas = c => `${c.n} × ${c.trabajo % 60 ? c.trabajo + " s" : c.trabajo / 60 + " min"} / ${c.descanso % 60 ? c.descanso + " s" : c.descanso / 60 + " min"}`;

let abierto = null;
/* abrir({titulo, cfg: {n, trabajo, descanso}, onDone}); sin cfg muestra los presets */
export function abrir({titulo = "", cfg = null, onDone} = {}){
  abierto?.cerrar();
  let c = cfg || PRESETS[0], fases = [], i = 0, fin = 0, quedan = 0, pausa = false, iv = 0, lock = null, ac = null, avisado = false, termino = false, ultimo = 0;
  const el = h(`<div class="tm" role="dialog" aria-modal="true" aria-label="${esc(t("Temporizador"))}" data-f="setup">
    <div class="tm-top"><button class="tm-x" data-x aria-label="${t("Cerrar")}">${icon("x")}</button><span class="tm-tt">${esc(titulo || t("Temporizador"))}</span><span class="tm-sp" aria-hidden="true"></span></div>
    <div class="tm-mid">
      <div class="tm-dial">
        <svg class="tm-ring" viewBox="0 0 100 100" aria-hidden="true"><circle class="tm-trk" cx="50" cy="50" r="${R}"/><circle class="tm-arc" cx="50" cy="50" r="${R}" stroke-dasharray="${C}" stroke-dashoffset="0"/></svg>
        <div class="tm-in">
          <span class="tm-ph" aria-live="polite"></span>
          <b class="tm-time">0:00</b>
          <span class="tm-rd"></span>
        </div>
      </div>
      <div class="tm-pre" role="group" aria-label="${esc(t("Temporizador"))}">${cfg ? "" : PRESETS.map(p => `<button class="tm-chip ${p === c ? "on" : ""}" data-p="${p.id}" aria-pressed="${p === c}">${esc(t(p.t))}</button>`).join("")}</div>
    </div>
    <div class="tm-bot"><button class="tm-btn ghost" data-skip>${t("Saltar")}</button><button class="tm-btn main go" data-go>${t("Empezar")}</button></div>
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
    const go = $("[data-go]");
    go.textContent = termino ? t("Cerrar") : !fases.length ? t("Empezar") : pausa ? t("Seguir") : t("Pausa");
    go.classList.toggle("go", !termino && (!fases.length || pausa));
    go.classList.toggle("pause", !termino && !!fases.length && !pausa);
    go.classList.toggle("done", termino);
    $("[data-skip]").hidden = !fases.length || termino;
    $(".tm-pre").hidden = !!fases.length;
    /* anillo: lo que queda de la fase actual (lleno antes de empezar, vacío al terminar) */
    const total = fz.s || 0, frac = termino ? 0 : !fases.length || !total ? 1 : Math.max(0, Math.min(1, (rest ?? total) / total));
    el.classList.toggle("tm-paused", pausa && !!fases.length && !termino);
    $(".tm-arc").style.strokeDashoffset = String(C * (1 - frac));
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
    el.classList.add("tm-jump"); requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove("tm-jump")));   // el anillo se rellena sin animar hacia atrás
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
    if(el.classList.contains("tm-out")) return;
    clearInterval(iv); iv = 0;
    try{ lock?.release(); }catch(e){} lock = null;
    try{ ac?.close(); }catch(e){}
    document.removeEventListener("visibilitychange", onVis);
    document.removeEventListener("keydown", onKey, true);
    window.removeEventListener("hashchange", cerrar);
    /* sale hacia abajo como una pantalla presentada; se quita al terminar (o enseguida si no hay animación) */
    el.classList.add("tm-out"); document.body.classList.remove("tm-on");
    const quitar = () => el.remove();
    el.addEventListener("animationend", quitar, {once: true}); setTimeout(quitar, 450);
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
    if(p && !fases.length){ haptic("selection"); c = PRESETS.find(x => x.id === p.dataset.p); el.querySelectorAll("[data-p]").forEach(x => { x.classList.toggle("on", x === p); x.setAttribute("aria-pressed", x === p); }); return pinta(); }
    if(tg.closest("[data-skip]") && fases.length && !termino) return entrar(i + 1);
    if(tg.closest("[data-go]")){
      if(termino) return cerrar();
      haptic("medium");
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
