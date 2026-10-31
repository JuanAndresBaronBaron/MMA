/* Repaso espaciado: lo que ya marcaste vuelve a los 1, 3, 7, 21 y 60 días.
   «Lo recuerdo» lo pasa al siguiente intervalo; «Repasar otra vez» lo trae mañana. Las claves de progreso no se tocan. */
import * as E from "./index.js";
import * as S from "../store.js";
import {icon, toast} from "../ui.js";
import {esc, today, addDays, fmtDate} from "../util.js";
import {t, tn} from "../i18n.js";
import {volver, esNota} from "../views/entreno.js";

export function render(el){
  const hoy = today(), cola = E.pendientesRepaso(hoy);
  const todos = S.all("repasos").filter(r => E.hecho(r.id) && E.itemDe(r.id));
  const prox = todos.filter(r => r.prox > hoy).sort((a, b) => a.prox.localeCompare(b.prox));
  const manana = prox.filter(r => r.prox === addDays(hoy, 1)).length, sem = prox.filter(r => r.prox <= addDays(hoy, 7)).length;
  const x = cola[0];
  el.innerHTML = `${volver()}${esNota()}
  <section class="card en-rep">
    <header class="card-h"><h3>${icon("repeat")} ${t("Repaso de hoy")}</h3><span class="muted small">${tn(cola.length, "1 pendiente", "{n} pendientes")}</span></header>
    ${x ? tarjeta(x, cola.length) : `<div class="empty">${icon("check", "big")}<h3>${todos.length ? t("Todo repasado") : t("Aún no hay nada para repasar")}</h3>
      <p>${todos.length ? t("Mañana vuelven {n}. Repasar poco y seguido es lo que fija la técnica.", {n: manana}) : t("Cuando marques un drill o un hito como hecho, vuelve aquí al día siguiente para repasarlo.")}</p>
      ${!todos.length ? `<a class="btn primary" href="#/entreno">${t("Ir a los caminos")}</a>` : ""}</div>`}
  </section>
  ${todos.length ? `<div class="en-tiles">
    <div class="en-tile"><span class="kpi-ic c1">${icon("calendar")}</span><div><b>${manana}</b><span>${t("Mañana")}</span></div></div>
    <div class="en-tile"><span class="kpi-ic c2">${icon("clock")}</span><div><b>${sem}</b><span>${t("Próximos 7 días")}</span></div></div>
    <div class="en-tile"><span class="kpi-ic c3">${icon("star")}</span><div><b>${todos.filter(r => (r.n || 0) >= E.INTERVALOS.length - 1).length}</b><span>${t("Bien fijados")}</span></div></div>
    <div class="en-tile"><span class="kpi-ic c4">${icon("book")}</span><div><b>${todos.length}</b><span>${t("En repaso")}</span></div></div>
  </div>` : ""}
  ${cola.length > 1 ? `<section class="card"><header class="card-h"><h3>${t("En la cola")}</h3></header><div class="list">${cola.slice(1, 13).map(({it}) => fila(it)).join("")}</div></section>` : ""}
  ${prox.length ? `<section class="card"><header class="card-h"><h3>${t("Próximos repasos")}</h3></header><div class="list">${prox.slice(0, 8).map(r => fila(E.itemDe(r.id), r.prox)).join("")}</div></section>` : ""}`;
  el.onclick = e => {
    const b = e.target.closest("[data-ok],[data-otra]"); if(!b) return;
    const k = b.dataset.ok || b.dataset.otra;
    if(b.dataset.ok){ E.repasoOk(k); toast(t("¡Bien! Vuelve en {n} días", {n: E.INTERVALOS[Math.min((S.get("repasos", k)?.n || 1), E.INTERVALOS.length - 1)]}), "ok", null, {key: "rep"}); }
    else { E.repasoOtraVez(k); toast(t("Vuelve mañana"), "ok", null, {key: "rep"}); }
  };
  el.onchange = null;
}
const tag = a => { const x = E.arte(a); return x ? `<span class="en-tag" style="--c:${x.color}">${esc(t(x.corto))}</span>` : ""; };
function tarjeta({r, it}, n){
  const desc = it.tipo === "d" ? it.x.como : "";
  return `<article class="en-rep-c" style="--c:${E.arte(it.arte).color}">
    <div class="en-bt">${tag(it.arte)}<a class="muted small" href="#/entreno/${it.arte}/${it.m.id}">${esc(it.m.titulo)}</a><span class="pill info">${it.tipo === "d" ? t("Drill") : t("Hito")}</span></div>
    <h4>${esc(it.texto)}</h4>
    ${desc ? `<details class="en-rep-d"><summary>${t("Ver cómo se hace")}</summary><p>${esc(desc)}</p>${it.x.dosis ? `<span class="en-dose">${icon("clock", "inline")} ${esc(it.x.dosis)}</span>` : ""}</details>` : ""}
    <p class="muted small">${it.tipo === "d" ? t("Hazlo 2 o 3 veces en sombra o con un compañero. ¿Te sale fluido y sin pensar?") : t("¿Lo sigues cumpliendo en el entreno?")}
      ${r.ultimo ? ` · ${t("Último repaso: {f}", {f: fmtDate(r.ultimo)})}` : ""}</p>
    <div class="en-rep-b"><button class="btn ghost" data-otra="${esc(r.id)}">${icon("repeat")} ${t("Repasar otra vez")}</button><button class="btn primary" data-ok="${esc(r.id)}">${icon("check")} ${t("Lo recuerdo")}</button></div>
    <span class="muted small">${t("{a} de {b}", {a: 1, b: n})}</span></article>`;
}
const fila = (it, f) => it ? `<a class="li" href="#/entreno/${it.arte}/${it.m.id}"><div class="li-main"><b class="en-1l">${esc(it.texto)}</b><span class="muted small">${tag(it.arte)} ${esc(it.m.titulo)}</span></div>${f ? `<span class="muted small">${fmtDate(f)}</span>` : ""}</a>` : "";
