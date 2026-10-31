import * as S from "../store.js";
import {icon, avatar, empty, toast} from "../ui.js";
import {esc, waLink} from "../util.js";
import {GEAR} from "../catalog.js";
import {t, locale} from "../i18n.js";
import {studentForm} from "../forms.js";
import {estadoEf} from "../cobros.js";

export function render(el, [k]){
  const gear = GEAR.find(g => g.k === k) || GEAR[0];
  const acad = S.academy();
  const activos = S.alumnos().filter(a => estadoEf(a) === "activo");
  const sin = activos.filter(a => !a.equipo?.[gear.k]?.tiene).sort((x, y) => x.nombre.localeCompare(y.nombre, locale()));
  const con = activos.filter(a => a.equipo?.[gear.k]?.tiene);
  const tallas = {};
  for(const a of activos){ const tl = a.equipo?.[gear.k]?.talla || a.talla; if(tl && !a.equipo?.[gear.k]?.tiene) tallas[tl] = (tallas[tl] || 0) + 1; }
  const tplKey = "msg_" + gear.k;
  const gn = t(gear.n).toLowerCase();
  const tpl = S.pref(tplKey, t("Hola {nombre}, en {academia} tenemos {producto} disponible{talla}. ¿Te separamos uno?", {academia: acad.nombre, producto: gn}));
  const msg = a => tpl.replace(/\{nombre\}/g, a.nombre.split(" ")[0]).replace(/\{talla\}/g, (a.equipo?.[gear.k]?.talla || a.talla) ? " " + t("en talla {talla}", {talla: a.equipo?.[gear.k]?.talla || a.talla}) : "");

  el.innerHTML = `
  <div class="filters tn-filters"><div class="chip-row" role="navigation" aria-label="${t("Productos")}">${GEAR.map(g => `<a class="chip ${g.k === gear.k ? "on" : ""}" href="#/tienda/${g.k}"><span>${esc(t(g.n))} <i>${activos.filter(a => !a.equipo?.[g.k]?.tiene).length}</i></span></a>`).join("")}</div></div>
  <div class="kpis three tn-kpis">
    <div class="kpi"><span class="kpi-ic c3">${icon("bag")}</span><div><b>${sin.length}</b><span>${esc(t("Sin {producto}", {producto: gn}))}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("check")}</span><div><b>${con.length}</b><span>${t("Ya tienen")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c2">${icon("list")}</span><div><span class="kpi-tallas">${Object.keys(tallas).length ? Object.entries(tallas).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tl, n]) => `<span class="tn-size"><b>${esc(tl)}</b><i>×${n}</i></span>`).join("") : "<b>—</b>"}</span><span>${t("Tallas que faltan")}</span></div></div>
  </div>
  <section class="card">
    <header class="card-h"><h3>${icon("whatsapp")} ${t("Mensaje para ofrecer")}</h3></header>
    <textarea id="tpl" rows="2" class="tpl">${esc(tpl)}</textarea>
    <p class="muted small">${t("Usa {nombre} y {talla}. Toca WhatsApp en cada alumno para enviar el mensaje.")}</p>
  </section>
  <section class="card">
    <header class="card-h"><h3>${esc(t("Alumnos sin {producto}", {producto: gn}))}</h3></header>
    ${sin.length ? `<div class="list">${sin.map(a => { const wa = waLink(a.telefono || a.acudienteTel, msg(a)); return `<div class="li tn-li">
      <a class="li-link" href="#/alumno/${a.id}">${avatar(a, 40)}<div class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${a.equipo?.[gear.k]?.talla || a.talla ? esc(t("Talla {talla}", {talla: a.equipo?.[gear.k]?.talla || a.talla})) : t("Sin talla registrada")}</span></div></a>
      <span class="li-act tn-act">${wa ? `<a class="btn small ghost" href="${esc(wa)}" target="_blank" rel="noopener" aria-label="${esc(t("WhatsApp a {nombre}", {nombre: a.nombre}))}">${icon("whatsapp")}<span>WhatsApp</span></a>` : `<span class="muted small">${t("Sin teléfono")}</span>`}
      <button class="btn small ok" data-has="${a.id}" title="${esc(t("Marcar que ya lo tiene"))}" aria-label="${esc(t("Marcar que ya lo tiene") + ": " + a.nombre)}">${icon("check")}<span>${t("Ya tiene")}</span></button></span></div>`; }).join("")}</div>`
      : empty("check", t("Todos tienen"), t("Todos los alumnos activos tienen {producto}.", {producto: gn}))}
  </section>`;
  el.querySelector("#tpl").onchange = e => { S.setPref(tplKey, e.target.value); render(el, [gear.k]); };
  el.onclick = e => {
    const b = e.target.closest("[data-has]"); if(!b) return;
    const a = S.get("alumnos", b.dataset.has);
    const eq = Object.assign({}, a.equipo || {});
    eq[gear.k] = Object.assign({}, eq[gear.k] || {}, {tiene: true});
    const prev = a.equipo || {};
    S.put("alumnos", {id: a.id, equipo: eq});
    toast(t("{nombre} ya tiene {producto}", {nombre: a.nombre.split(" ")[0], producto: gn}), "ok", {label: t("Deshacer"), fn: () => S.put("alumnos", {id: a.id, equipo: prev})});
  };
}
