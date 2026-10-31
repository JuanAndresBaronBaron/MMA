import * as S from "../store.js";
import {icon, belt, formModal, modal, toast, confirmDlg} from "../ui.js";
import {esc, money, h} from "../util.js";
import {sedeModal, disciplineModal} from "../forms.js";
import {DISCIPLINE_PRESETS, CURRENCIES} from "../catalog.js";
import {createAcademy} from "../shell.js";
import {t, tn} from "../i18n.js";
import {estadoEf} from "../cobros.js";

export function render(el){
  const a = S.academy(), cur = a.moneda || "COP";
  const sedes = S.sedes(), discs = S.disciplinas(), clases = S.clases();
  const nAl = sid => S.alumnos({sede: sid}).filter(x => estadoEf(x) === "activo").length;
  const nAc = id => S.inAcad("alumnos", id).length;
  const nDisc = did => S.alumnos({sede: ""}).filter(x => estadoEf(x) === "activo" && (x.disciplinaIds || []).includes(did)).length;

  const ini = String(a.nombre || "").trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "A";
  const nActivos = S.alumnos({sede: ""}).filter(x => estadoEf(x) === "activo").length;
  const ic = (n, rc) => `<span class="row-ic" style="--rc:var(--chip-${rc})">${icon(n)}</span>`;
  const add = (attr, label) => `<button type="button" class="row-inset ac-add" ${attr}><span class="ac-plus">${icon("plus")}</span><span>${esc(label)}</span></button>`;

  const perfil = `
    <section class="grouped ac-grp">
      <button type="button" class="row-inset chev ac-me" data-edit-acad aria-label="${t("Editar")}: ${esc(a.nombre)}">
        <span class="ac-logo" aria-hidden="true">${esc(ini)}</span>
        <span class="ac-me-t"><b>${esc(a.nombre)}</b><span>${esc(a.ciudad || "")}${a.ciudad ? " · " : ""}${esc(cur)} · ${t("Mensualidad base {valor}", {valor: money(a.valorMensual || 0, cur)})}</span>${a.lema ? `<span class="ac-lema">${esc(a.lema)}</span>` : ""}</span>
      </button>
    </section>
    <div class="ac-stats">
      <div class="ac-stat"><b class="tnum">${sedes.length}</b><span>${t("Sedes")}</span></div>
      <div class="ac-stat"><b class="tnum">${discs.length}</b><span>${t("Disciplinas")}</span></div>
      <div class="ac-stat"><b class="tnum">${nActivos}</b><span>${t("Alumnos activos")}</span></div>
    </div>`;

  const sedesH = `
    <h3 class="section-header">${t("Sedes")}</h3>
    <section class="grouped ac-grp">
      ${sedes.map(s => `<button type="button" class="row-inset chev ac-row" data-sede="${s.id}">${ic("map", "crimson")}
        <span class="ac-main"><b>${esc(s.nombre)}</b>
          <span class="ac-sub">${esc([s.direccion, s.ciudad].filter(Boolean).join(", ") || t("Sin dirección"))}</span>
          <span class="ac-sub">${tn(nAl(s.id), "1 alumno activo", "{n} alumnos activos")}${s.encargado ? " · " + esc(s.encargado) : ""}</span>
          <span class="ac-dots">${S.discsOfSede(s.id).map(d => `<span class="ac-dt"><span class="dot" style="background:${esc(d.color)}"></span>${esc(t(d.nombre))}</span>`).join("") || `<span class="ac-sub">${t("Sin disciplinas")}</span>`}</span>
          ${s.horario ? `<pre class="ac-sub sched">${esc(s.horario)}</pre>` : ""}
        </span></button>`).join("")}
      ${add("data-new-sede", t("Agregar sede"))}
    </section>`;

  const horario = `
    <h3 class="section-header hz-acad">${t("Horario de clases")}${clases.length ? `<a class="btn-link" href="#/horario">${t("Ver horario")}</a>` : ""}</h3>
    <section class="grouped ac-grp hz-acad">
      ${clases.length ? sedes.map(s => { const n = clases.filter(c => c.sedeId === s.id).length; return `<a class="row-inset ac-row" href="#/horario" data-hz-sede="${s.id}">${ic("clock", "burnt")}<span class="ac-main"><b>${esc(s.nombre)}</b><span class="ac-sub ac-hz-s">${n ? tn(n, "1 clase por semana", "{n} clases por semana") : t("Sin clases en el horario")}</span></span><span class="row-val ac-hz-v">${n ? tn(n, "1 clase por semana", "{n} clases por semana") : t("Sin clases en el horario")}</span></a>`; }).join("")
        : `<a class="row-inset ac-row" href="#/horario">${ic("clock", "burnt")}<span class="ac-main"><b>${t("Crear horario")}</b></span></a>`}
    </section>
    ${clases.length ? "" : `<p class="section-footer">${t("Arma el horario semanal de cada sede: la asistencia abre sola la clase que está empezando y puedes usar el modo kiosco para que los alumnos se registren al llegar.")}</p>`}`;

  const discH = `
    <h3 class="section-header">${t("Disciplinas y sistemas de grados")}</h3>
    <section class="grouped ac-grp">
      ${discs.map(d => `<button type="button" class="row-inset chev ac-row" data-disc="${d.id}"><span class="ac-disc" style="--dc:${esc(d.color)}" aria-hidden="true"></span>
        <span class="ac-main"><b>${esc(t(d.nombre))}</b><span class="ac-sub">${tn(d.ranks.length, "1 cinturón/nivel", "{n} cinturones/niveles")} · ${tn(nDisc(d.id), "1 alumno", "{n} alumnos")} · ${(d.sedeIds || []).map(id => esc(S.get("sedes", id)?.nombre || "")).filter(Boolean).join(", ") || t("sin sede")}</span></span>
        <span class="belt-strip hide-s">${d.ranks.slice(0, 9).map((r, i) => belt(d, i, 0, {w: 22, h: 9})).join("")}</span></button>`).join("")}
      ${add("data-new-disc", t("Agregar disciplina"))}
    </section>
    <p class="section-footer">${t("Cada disciplina tiene su lista de cinturones o niveles, cuántos grados lleva cada uno y el tiempo mínimo recomendado. La app usa esos tiempos para avisar cuando una promoción llega demasiado pronto.")}</p>`;

  const acads = `
    <h3 class="section-header">${t("Academias")}</h3>
    <section class="grouped ac-grp">
      ${S.academies().map(x => { const on = x.id === a.id; return `<button type="button" class="row-inset ac-row ${on ? "" : "chev"}" data-acad="${x.id}" ${on ? 'aria-current="true"' : ""}>${ic("building", on ? "crimson" : "graphite")}<span class="ac-main"><b>${esc(x.nombre)}</b><span class="ac-sub">${tn(nAc(x.id), "1 alumno", "{n} alumnos")}</span></span>${on ? `<span class="ac-cur">${icon("check")}<span class="ld-sr">${t("Actual")}</span></span>` : ""}</button>`; }).join("")}
      ${add("data-new-acad", t("Otra academia"))}
    </section>
    <p class="section-footer">${t("Si manejas más de una academia (marcas distintas), cada una tiene sus propias sedes, alumnos y pagos.")}</p>`;

  el.innerHTML = `<div class="aj ac">
    <div class="aj-col">${perfil}${sedesH}${horario}</div>
    <div class="aj-col">${discH}${acads}</div>
  </div>`;

  el.onclick = e => {
    const tg = e.target;
    if(tg.closest("[data-edit-acad]")) return formModal({title: t("Datos de la academia"), values: a, fields: [
      {k: "nombre", label: t("Nombre"), req: true}, {k: "ciudad", label: t("Ciudad"), half: true},
      {k: "moneda", label: t("Moneda"), type: "select", opts: CURRENCIES, half: true},
      {k: "valorMensual", label: t("Mensualidad por defecto"), type: "number", half: true, hint: t("Se usa para alumnos nuevos.")},
      {k: "avisoDias", label: t("Avisar pagos con (días)"), type: "number", half: true, def: 5},
      {k: "telefono", label: t("Teléfono"), type: "tel", half: true}, {k: "instagram", label: "Instagram", half: true},
      {k: "lema", label: t("Lema / descripción")},
    ], danger: S.academies().length > 1 ? {label: t("Eliminar academia"), fn: async () => {
      if(!await confirmDlg(t("Se eliminará {nombre} con todas sus sedes, alumnos y pagos. No se puede deshacer.", {nombre: a.nombre}))) return false;
      for(const c of ["sedes", "disciplinas", "alumnos", "pagos", "asistencias", "clases", "leads", "evaluaciones", "notas"]) for(const r of S.inAcad(c, a.id)) S.del(c, r.id);
      S.del("academias", a.id); S.setPref("academia", ""); S.setPref("sede", ""); return true;
    }} : null, onSave: v => { S.put("academias", Object.assign({id: a.id}, v)); toast(t("Academia actualizada")); }});
    const hz = tg.closest("[data-hz-sede]"); if(hz && sedes.length > 1) S.setPref("sede", hz.dataset.hzSede);
    if(tg.closest("[data-new-sede]")) return sedeModal();
    const s = tg.closest("[data-sede]"); if(s) return sedeModal(S.get("sedes", s.dataset.sede));
    const d = tg.closest("[data-disc]"); if(d) return disciplineModal(S.get("disciplinas", d.dataset.disc));
    if(tg.closest("[data-new-disc]")) return pickPreset();
    if(tg.closest("[data-new-acad]")) return createAcademy();
    const ac = tg.closest("[data-acad]"); if(ac && ac.dataset.acad !== a.id){ S.setPref("academia", ac.dataset.acad); S.setPref("sede", ""); location.hash = "#/inicio"; }
  };
}

function pickPreset(){
  const body = h(`<div class="preset-grid">${DISCIPLINE_PRESETS.map((p, i) => `<button class="preset" data-i="${i}"><b>${esc(t(p.nombre))}</b></button>`).join("")}<button class="preset custom" data-i="-1"><b>${t("Otra (personalizada)")}</b></button></div>`);
  const m = modal({title: t("¿Qué disciplina agregas?"), body, foot: false});
  body.onclick = e => {
    const b = e.target.closest("[data-i]"); if(!b) return;
    m.close();
    const i = +b.dataset.i;
    setTimeout(() => disciplineModal(null, i >= 0 ? DISCIPLINE_PRESETS[i] : null), 220);
  };
}
