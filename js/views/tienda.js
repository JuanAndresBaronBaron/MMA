import * as S from "../store.js";
import {icon, avatar, emptyState, toast} from "../ui.js";
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

  const tl = a => a.equipo?.[gear.k]?.talla || a.talla;
  const tallasTop = Object.entries(tallas).sort((a, b) => b[1] - a[1]).slice(0, 6);
  el.innerHTML = `
  <nav class="tn-chips" aria-label="${t("Productos")}"><div class="tn-scroll">${GEAR.map(g => { const n = activos.filter(a => !a.equipo?.[g.k]?.tiene).length; return `<a class="tn-chip ${g.k === gear.k ? "on" : ""}" href="#/tienda/${g.k}" ${g.k === gear.k ? `aria-current="page"` : ""}><span>${esc(t(g.n))}</span><i class="amount">${n}</i></a>`; }).join("")}</div></nav>
  <section class="card tn-stats">
    <div class="tn-st err"><span class="tn-st-l">${esc(t("Sin {producto}", {producto: gn}))}</span><b class="amount">${sin.length}</b></div>
    <div class="tn-st ok"><span class="tn-st-l">${t("Ya tienen")}</span><b class="amount">${con.length}</b></div>
    <div class="tn-st tn-st-sz"><span class="tn-st-l">${t("Tallas que faltan")}</span>${tallasTop.length ? `<span class="tn-sizes">${tallasTop.map(([z, n]) => `<span class="tn-size"><b>${esc(z)}</b><i class="amount">×${n}</i></span>`).join("")}</span>` : `<b>–</b>`}</div>
  </section>
  <h3 class="section-header"><span>${t("Mensaje para ofrecer")}</span></h3>
  <section class="card tn-msg">
    <label class="sr" for="tpl">${t("Mensaje para ofrecer")}</label>
    <textarea id="tpl" rows="3" class="tpl">${esc(tpl)}</textarea>
  </section>
  <p class="section-footer">${t("Usa {nombre} y {talla}. Toca WhatsApp en cada alumno para enviar el mensaje.")}</p>
  <h3 class="section-header"><span>${esc(t("Alumnos sin {producto}", {producto: gn}))}</span><span class="amount">${sin.length}</span></h3>
  ${sin.length ? `<section class="card flush tn-list"><div class="list">${sin.map(a => { const wa = waLink(a.telefono || a.acudienteTel, msg(a)); return `<div class="li tn-li">
      <a class="li-link" href="#/alumno/${a.id}">${avatar(a, 40)}<div class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${tl(a) ? esc(t("Talla {talla}", {talla: tl(a)})) : t("Sin talla registrada")}</span></div></a>
      <span class="li-act tn-act">${wa ? `<a class="icon-btn wa" href="${esc(wa)}" target="_blank" rel="noopener" title="WhatsApp" aria-label="${esc(t("WhatsApp a {nombre}", {nombre: a.nombre}))}">${icon("whatsapp")}</a>` : `<span class="tn-notel">${t("Sin teléfono")}</span>`}
      <button class="btn small gray tn-has" data-has="${a.id}" title="${esc(t("Marcar que ya lo tiene"))}" aria-label="${esc(t("Marcar que ya lo tiene") + ": " + a.nombre)}">${icon("check")}<span>${t("Ya tiene")}</span></button></span></div>`; }).join("")}</div></section>`
    : `<div class="card">${emptyState({icon: "check", title: t("Todos tienen"), text: t("Todos los alumnos activos tienen {producto}.", {producto: gn}), tone: "ok"})}</div>`}`;
  el.querySelector(".tn-chip.on")?.scrollIntoView?.({block: "nearest", inline: "center"});
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
