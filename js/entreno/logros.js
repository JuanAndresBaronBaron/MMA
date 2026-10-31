/* Logros: se calculan con lo que ya hay (sesiones, progreso, repasos y la técnica de la semana).
   Los vistos quedan en la preferencia «logrosVistos»: uno nuevo abre una celebración que se puede compartir como imagen.
   Una vez ganado, un logro no se pierde aunque cambien los datos (p. ej. la técnica de la semana). */
import * as E from "./index.js";
import * as S from "../store.js";
import {icon, modal, shareOrDownload} from "../ui.js";
import {esc, today, addDays} from "../util.js";
import {t, tn} from "../i18n.js";
import {volver} from "../views/entreno.js";

/* prog(c) → [actual, meta] */
export const LOGROS = [
  {id: "primera", ic: "fist", t: "Primer entreno", d: "Registraste tu primera sesión.", prog: c => [c.n, 1]},
  {id: "s10", ic: "check", t: "10 sesiones", d: "La constancia empieza a notarse.", prog: c => [c.n, 10]},
  {id: "s50", ic: "medal", t: "50 sesiones", d: "Medio centenar de entrenos.", prog: c => [c.n, 50]},
  {id: "s100", ic: "trophy", t: "100 sesiones", d: "Cien entrenos: esto ya es un hábito.", prog: c => [c.n, 100]},
  {id: "sem4", ic: "flame", t: "4 semanas seguidas", d: "Entrenaste al menos una vez por semana durante 4 semanas.", prog: c => [c.semanas, 4]},
  {id: "min1000", ic: "clock", t: "1.000 minutos", d: "Más de 16 horas de entreno.", prog: c => [c.min, 1000]},
  {id: "mod100", ic: "star", t: "Módulo completo", d: "Terminaste un módulo al 100 %.", prog: c => [c.mod100, 1]},
  {id: "arte50", ic: "belt", t: "Medio camino", d: "Llevas la mitad de un camino de aprendizaje.", prog: c => [c.arte, 50]},
  {id: "repaso7", ic: "repeat", t: "7 días de repaso", d: "Repasaste en 7 días distintos.", prog: c => [c.rep, 7]},
  {id: "meta4", ic: "target", t: "Meta cumplida 4 semanas", d: "Cumpliste tu meta semanal 4 semanas seguidas.", prog: c => [c.meta, 4]},
  {id: "tds", ic: "zap", t: "Técnica de la semana", d: "Practicaste la técnica de la semana.", prog: c => [c.tds, 1]},
];

/* semanas seguidas (máximo) en que se cumple f(lunes) */
function seguidas(f, desde){
  let cur = 0, best = 0;
  for(let l = desde; l <= E.lunes(today()); l = addDays(l, 7)){ if(f(l)) best = Math.max(best, ++cur); else if(l < E.lunes(today())) cur = 0; }
  return best;
}
export async function contexto(){
  const hs = E.hechas(), ls = new Set(hs.map(s => E.lunes(s.fecha)));
  const desde = hs.length ? E.lunes(hs[hs.length - 1].fecha) : E.lunes(today());
  const lim = addDays(E.lunes(today()), -7 * 104), d0 = desde < lim ? lim : desde;
  const r = E.rutina(), disp = E.disponibles().map(a => E.cargado(a.id));
  let tds = 0;
  try{
    const M = await import("./semana.js"), x = M.tdsActual?.({fecha: new Date(), artes: M.artesTds?.(r, E.disponibles().map(a => a.id)) || null, pin: S.academy()?.tds || null});
    const k = x && (x.drill != null ? E.kDrill(x.arte, x.mod, x.drill) : x.hito != null ? E.kHito(x.arte, x.mod, x.hito) : null);
    tds = k && E.hecho(k) ? 1 : 0;
  }catch(e){}
  return {n: hs.length, min: hs.reduce((a, s) => a + (+s.min || 0), 0), semanas: seguidas(l => ls.has(l), d0),
    mod100: disp.some(d => d.modulos.some(m => E.pctMod(d.id, m) === 100)) ? 1 : 0,
    arte: Math.max(0, ...disp.filter(d => !E.esComplemento(d.id)).map(E.pctArte)),
    rep: E.diasDeRepaso().size, meta: r && E.metaDe(r) ? seguidas(l => E.metaSemana(r, l)?.ok, d0) : 0, tds};
}
const vistos = () => S.pref("logrosVistos", null);
export async function estado(){
  const c = await contexto(), v = new Set(vistos() || []);
  return LOGROS.map(x => { const [a, b] = x.prog(c); return {...x, a: Math.min(a, b), b, ok: a >= b || v.has(x.id)}; });
}

/* al abrir el hub: si hay logros nuevos, celebra el primero. La primera vez solo guarda los ya ganados. */
let corriendo = false;
export async function revisar(){
  if(corriendo || document.querySelector(".modal-back")) return;
  corriendo = true;
  try{
    const es = await estado(), ganados = es.filter(x => x.ok).map(x => x.id), v = vistos();
    if(v === null){ S.setPref("logrosVistos", ganados); return; }
    const nuevos = es.filter(x => x.ok && !v.includes(x.id));
    if(!nuevos.length) return;
    S.setPref("logrosVistos", [...new Set([...v, ...ganados])]);
    celebrar(nuevos[0], nuevos.length - 1);
  }finally{ corriendo = false; }
}

export function celebrar(x, mas = 0){
  const body = `<div class="lg-cel"><div class="lg-burst" aria-hidden="true">${Array.from({length: 12}, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div>
    <span class="lg-badge big">${icon(x.ic)}</span><h3>${esc(t(x.t))}</h3><p class="muted">${esc(t(x.d))}</p>
    ${mas ? `<p class="small">${tn(mas, "Y 1 logro más", "Y {n} logros más")} · <a href="#/entreno/logros" data-close>${t("Ver todos")}</a></p>` : ""}</div>`;
  const m = modal({title: t("¡Logro desbloqueado!"), body, cls: "lg-modal", foot: `<button class="btn ghost" data-close>${t("Cerrar")}</button><button class="btn primary" data-share>${icon("share")} ${t("Compartir")}</button>`});
  m.foot.querySelector("[data-share]").onclick = () => compartir(x);
}

/* imagen 1080×1080 para redes */
async function compartir(x){
  const c = document.createElement("canvas"); c.width = c.height = 1080;
  const g = c.getContext("2d"), font = getComputedStyle(document.body).fontFamily || "sans-serif";
  const bg = g.createLinearGradient(0, 0, 1080, 1080); bg.addColorStop(0, "#1b1f2b"); bg.addColorStop(1, "#0b0d12");
  g.fillStyle = bg; g.fillRect(0, 0, 1080, 1080);
  g.fillStyle = "rgba(239,51,64,.16)"; g.beginPath(); g.arc(540, 420, 300, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#ef3340"; g.beginPath(); g.arc(540, 420, 190, 0, Math.PI * 2); g.fill();
  try{
    const src = icon(x.ic).replace('class="ic "', 'xmlns="http://www.w3.org/2000/svg" width="220" height="220"').replace(/currentColor/g, "#fff");
    const img = new Image(); img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(src);
    await img.decode(); g.drawImage(img, 430, 310, 220, 220);
  }catch(e){}
  g.textAlign = "center"; g.fillStyle = "#ff8a8f"; g.font = `700 40px ${font}`; g.fillText(t("¡Logro desbloqueado!").toUpperCase(), 540, 720);
  g.fillStyle = "#fff"; g.font = `800 76px ${font}`; g.fillText(t(x.t), 540, 815, 980);
  g.fillStyle = "#b9c0cf"; g.font = `500 40px ${font}`; g.fillText(t(x.d), 540, 885, 980);
  g.fillStyle = "#8b95a8"; g.font = `600 34px ${font}`; g.fillText([S.academy()?.nombre, "AcademiaPro"].filter(Boolean).join(" · "), 540, 1010, 980);
  const blob = await new Promise(r => c.toBlob(r, "image/png"));
  if(blob) shareOrDownload({title: t(x.t), text: t("¡Logro desbloqueado!") + " " + t(x.t), files: [new File([blob], `logro-${x.id}.png`, {type: "image/png"})], filename: `logro-${x.id}.png`});
}

export function render(el){
  el.innerHTML = `${volver()}<div class="card"><p class="muted">${icon("sync", "spin")} ${t("Cargando…")}</p></div>`;
  estado().then(es => {
    if(!el.isConnected) return;
    const n = es.filter(x => x.ok).length;
    el.innerHTML = `${volver()}
    <section class="card"><header class="card-h"><h3>${icon("award")} ${t("Logros")}</h3><span class="muted small">${t("{a} de {b}", {a: n, b: es.length})}</span></header>
      <div class="en-prog"><span style="width:${Math.round(n / es.length * 100)}%"></span></div>
      <div class="lg-grid">${es.map(x => `<button class="lg ${x.ok ? "ok" : ""}" data-lg="${x.id}" ${x.ok ? "" : "disabled"}>
        <span class="lg-badge">${icon(x.ok ? x.ic : "target")}</span><b>${esc(t(x.t))}</b><span class="muted small">${esc(t(x.d))}</span>
        ${x.ok ? `<span class="pill en-ok">${t("Ganado")}</span>` : `<span class="lg-bar"><i style="width:${Math.round(x.a / x.b * 100)}%"></i></span><span class="muted small">${x.id === "arte50" ? `${x.a}% / 50%` : `${x.a}/${x.b}`}</span>`}</button>`).join("")}</div>
    </section>`;
    el.onclick = e => { const b = e.target.closest("[data-lg]"); if(b){ const x = es.find(y => y.id === b.dataset.lg); if(x?.ok) celebrar(x); } };
  });
  el.onchange = null;
}
