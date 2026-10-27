import * as S from "../store.js";
import {icon, belt, formModal, modal, toast, confirmDlg} from "../ui.js";
import {esc, money, h} from "../util.js";
import {sedeModal, disciplineModal} from "../forms.js";
import {DISCIPLINE_PRESETS, CURRENCIES} from "../catalog.js";
import {createAcademy} from "../app.js";

export function render(el){
  const a = S.academy(), cur = a.moneda || "COP";
  const sedes = S.sedes(), discs = S.disciplinas();
  const nAl = sid => S.alumnos({sede: sid}).filter(x => x.estado === "activo").length;
  const nDisc = did => S.alumnos({sede: ""}).filter(x => x.estado === "activo" && (x.disciplinaIds || []).includes(did)).length;

  el.innerHTML = `
  <section class="card acad-card">
    <div class="acad-h"><div><h2>${esc(a.nombre)}</h2><span class="muted">${esc(a.ciudad || "")}${a.ciudad ? " · " : ""}${esc(cur)} · Mensualidad base ${money(a.valorMensual || 0, cur)}</span></div>
      <button class="btn ghost" data-edit-acad>${icon("edit")} Editar</button></div>
    ${a.lema ? `<p class="muted">${esc(a.lema)}</p>` : ""}
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("map")} Sedes <span class="count-b">${sedes.length}</span></h3><button class="btn small primary" data-new-sede>${icon("plus")} Sede</button></header>
    <div class="cards-grid">${sedes.map(s => `<button class="mini-card" data-sede="${s.id}">
      <b>${esc(s.nombre)}</b><span class="muted small">${esc([s.direccion, s.ciudad].filter(Boolean).join(", ") || "Sin dirección")}</span>
      <span class="small">${nAl(s.id)} alumnos activos${s.encargado ? " · " + esc(s.encargado) : ""}</span>
      <div class="mini-tags">${S.discsOfSede(s.id).map(d => `<span class="tag" style="--dc:${d.color}"><span class="dot" style="background:${d.color}"></span>${esc(d.nombre)}</span>`).join("") || `<span class="muted small">Sin disciplinas</span>`}</div>
      ${s.horario ? `<pre class="small muted sched">${esc(s.horario)}</pre>` : ""}
    </button>`).join("")}</div>
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("belt")} Disciplinas y sistemas de grados <span class="count-b">${discs.length}</span></h3><button class="btn small primary" data-new-disc>${icon("plus")} Disciplina</button></header>
    <p class="muted small">Cada disciplina tiene su lista de cinturones o niveles, cuántos grados lleva cada uno y el tiempo mínimo recomendado. La app usa esos tiempos para avisar cuando una promoción llega demasiado pronto.</p>
    <div class="list">${discs.map(d => `<button class="li" data-disc="${d.id}"><span class="dot big" style="background:${d.color}"></span>
      <div class="li-main"><b>${esc(d.nombre)}</b><span class="muted small">${d.ranks.length} cinturones/niveles · ${nDisc(d.id)} alumnos · ${(d.sedeIds || []).map(id => esc(S.get("sedes", id)?.nombre || "")).filter(Boolean).join(", ") || "sin sede"}</span></div>
      <span class="belt-strip hide-s">${d.ranks.map((r, i) => belt(d, i, 0, {w: 26, h: 10})).join("")}</span>${icon("chevron", "muted")}</button>`).join("")}</div>
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("building")} Academias</h3><button class="btn small ghost" data-new-acad>${icon("plus")} Otra academia</button></header>
    <p class="muted small">Si manejas más de una academia (marcas distintas), cada una tiene sus propias sedes, alumnos y pagos.</p>
    <div class="list">${S.academies().map(x => `<button class="li" data-acad="${x.id}">${icon(x.id === a.id ? "check" : "building")}<div class="li-main"><b>${esc(x.nombre)}</b><span class="muted small">${S.inAcad("alumnos", x.id).length} alumnos</span></div>${x.id === a.id ? `<span class="tag">Actual</span>` : `<span class="btn-link">Abrir</span>`}</button>`).join("")}</div>
  </section>`;

  el.onclick = e => {
    const t = e.target;
    if(t.closest("[data-edit-acad]")) return formModal({title: "Datos de la academia", values: a, fields: [
      {k: "nombre", label: "Nombre", req: true}, {k: "ciudad", label: "Ciudad", half: true},
      {k: "moneda", label: "Moneda", type: "select", opts: CURRENCIES, half: true},
      {k: "valorMensual", label: "Mensualidad por defecto", type: "number", half: true, hint: "Se usa para alumnos nuevos."},
      {k: "avisoDias", label: "Avisar pagos con (días)", type: "number", half: true, def: 5},
      {k: "telefono", label: "Teléfono", type: "tel", half: true}, {k: "instagram", label: "Instagram", half: true},
      {k: "lema", label: "Lema / descripción"},
    ], danger: S.academies().length > 1 ? {label: "Eliminar academia", fn: async () => {
      if(!await confirmDlg(`Se eliminará ${a.nombre} con todas sus sedes, alumnos y pagos. No se puede deshacer.`)) return false;
      for(const c of ["sedes", "disciplinas", "alumnos", "pagos", "asistencias"]) for(const r of S.inAcad(c, a.id)) S.del(c, r.id);
      S.del("academias", a.id); S.setPref("academia", ""); S.setPref("sede", ""); return true;
    }} : null, onSave: v => { S.put("academias", Object.assign({id: a.id}, v)); toast("Academia actualizada"); }});
    if(t.closest("[data-new-sede]")) return sedeModal();
    const s = t.closest("[data-sede]"); if(s) return sedeModal(S.get("sedes", s.dataset.sede));
    const d = t.closest("[data-disc]"); if(d) return disciplineModal(S.get("disciplinas", d.dataset.disc));
    if(t.closest("[data-new-disc]")) return pickPreset();
    if(t.closest("[data-new-acad]")) return createAcademy();
    const ac = t.closest("[data-acad]"); if(ac && ac.dataset.acad !== a.id){ S.setPref("academia", ac.dataset.acad); S.setPref("sede", ""); location.hash = "#/inicio"; }
  };
}

function pickPreset(){
  const body = h(`<div class="preset-grid">${DISCIPLINE_PRESETS.map((p, i) => `<button class="preset" data-i="${i}"><b>${esc(p.nombre)}</b></button>`).join("")}<button class="preset custom" data-i="-1"><b>Otra (personalizada)</b></button></div>`);
  const m = modal({title: "¿Qué disciplina agregas?", body, foot: false});
  body.onclick = e => {
    const b = e.target.closest("[data-i]"); if(!b) return;
    m.close();
    const i = +b.dataset.i;
    setTimeout(() => disciplineModal(null, i >= 0 ? DISCIPLINE_PRESETS[i] : null), 220);
  };
}
