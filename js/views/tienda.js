import * as S from "../store.js";
import {icon, avatar, empty} from "../ui.js";
import {esc, waLink} from "../util.js";
import {GEAR} from "../catalog.js";
import {studentForm} from "../forms.js";

export function render(el, [k]){
  const gear = GEAR.find(g => g.k === k) || GEAR[0];
  const acad = S.academy();
  const activos = S.alumnos().filter(a => a.estado === "activo");
  const sin = activos.filter(a => !a.equipo?.[gear.k]?.tiene).sort((x, y) => x.nombre.localeCompare(y.nombre, "es"));
  const con = activos.filter(a => a.equipo?.[gear.k]?.tiene);
  const tallas = {};
  for(const a of activos){ const t = a.equipo?.[gear.k]?.talla || a.talla; if(t && !a.equipo?.[gear.k]?.tiene) tallas[t] = (tallas[t] || 0) + 1; }
  const tplKey = "msg_" + gear.k;
  const tpl = S.pref(tplKey, `Hola {nombre}, en ${acad.nombre} tenemos ${gear.n.toLowerCase()} disponible{talla}. ¿Te separamos uno?`);
  const msg = a => tpl.replace(/\{nombre\}/g, a.nombre.split(" ")[0]).replace(/\{talla\}/g, (a.equipo?.[gear.k]?.talla || a.talla) ? ` en talla ${a.equipo?.[gear.k]?.talla || a.talla}` : "");

  el.innerHTML = `
  <div class="filters"><div class="chips">${GEAR.map(g => `<a class="chip ${g.k === gear.k ? "on" : ""}" href="#/tienda/${g.k}"><span>${esc(g.n)} <i>${activos.filter(a => !a.equipo?.[g.k]?.tiene).length}</i></span></a>`).join("")}</div></div>
  <div class="kpis three">
    <div class="kpi"><span class="kpi-ic c3">${icon("bag")}</span><div><b>${sin.length}</b><span>Sin ${esc(gear.n.toLowerCase())}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("check")}</span><div><b>${con.length}</b><span>Ya tienen</span></div></div>
    <div class="kpi"><span class="kpi-ic c2">${icon("list")}</span><div><b>${Object.keys(tallas).length ? Object.entries(tallas).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${esc(t)}×${n}`).join(" ") : "—"}</b><span>Tallas más pedidas</span></div></div>
  </div>
  <section class="card">
    <header class="card-h"><h3>${icon("whatsapp")} Mensaje para ofrecer</h3></header>
    <textarea id="tpl" rows="2" class="tpl">${esc(tpl)}</textarea>
    <p class="muted small">Usa {nombre} y {talla}. Toca WhatsApp en cada alumno para enviar el mensaje.</p>
  </section>
  <section class="card">
    <header class="card-h"><h3>Alumnos sin ${esc(gear.n.toLowerCase())}</h3></header>
    ${sin.length ? `<div class="list">${sin.map(a => { const wa = waLink(a.telefono || a.acudienteTel, msg(a)); return `<div class="li">
      <a class="li-link" href="#/alumno/${a.id}">${avatar(a, 40)}<div class="li-main"><b>${esc(a.nombre)}</b><span class="muted small">${a.equipo?.[gear.k]?.talla || a.talla ? "Talla " + esc(a.equipo?.[gear.k]?.talla || a.talla) : "Sin talla registrada"}</span></div></a>
      ${wa ? `<a class="btn small ghost" href="${esc(wa)}" target="_blank" rel="noopener">${icon("whatsapp")} WhatsApp</a>` : `<span class="muted small">Sin teléfono</span>`}
      <button class="btn small ok" data-has="${a.id}" title="Marcar que ya lo tiene">${icon("check")} Ya tiene</button></div>`; }).join("")}</div>`
      : empty("check", "Todos tienen", `Todos los alumnos activos tienen ${gear.n.toLowerCase()}.`)}
  </section>`;
  el.querySelector("#tpl").onchange = e => { S.setPref(tplKey, e.target.value); render(el, [gear.k]); };
  el.onclick = e => {
    const b = e.target.closest("[data-has]"); if(!b) return;
    const a = S.get("alumnos", b.dataset.has);
    const eq = Object.assign({}, a.equipo || {});
    eq[gear.k] = Object.assign({}, eq[gear.k] || {}, {tiene: true});
    S.put("alumnos", {id: a.id, equipo: eq});
  };
}
