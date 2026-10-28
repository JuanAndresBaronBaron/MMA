import * as S from "../store.js";
import {icon, avatar, belt, empty, toast} from "../ui.js";
import {esc, today, fmtDate, addDays, norm} from "../util.js";
import {t, tn, locale} from "../i18n.js";

const st = {fecha: today(), sede: "", disc: "", q: ""};

export function render(el){
  const ss = S.sedes();
  st.sede = S.curSede() || (ss.find(s => s.id === st.sede) ? st.sede : ss[0]?.id || "");
  const discs = S.discsOfSede(st.sede);
  if(!discs.find(d => d.id === st.disc)) st.disc = discs[0]?.id || "";
  if(!st.sede || !st.disc){ el.innerHTML = empty("calendar", t("Falta configurar"), t("Necesitas al menos una sede con una disciplina."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  const d = S.get("disciplinas", st.disc);
  const rec = S.all("asistencias").find(a => a.fecha === st.fecha && a.sedeId === st.sede && a.disciplinaId === st.disc);
  const pres = new Set(rec?.presentes || []);
  const q = norm(st.q);
  const als = S.alumnos({sede: st.sede}).filter(a => a.estado === "activo" && (a.disciplinaIds || []).includes(st.disc) && (!q || norm(a.nombre).includes(q)))
    .sort((x, y) => x.nombre.localeCompare(y.nombre, locale()));
  /* últimas clases registradas */
  const hist = S.all("asistencias").filter(a => a.sedeId === st.sede && a.disciplinaId === st.disc).sort((x, y) => y.fecha.localeCompare(x.fecha)).slice(0, 8);

  el.innerHTML = `
  <section class="card">
    <div class="att-bar">
      <div class="month-nav"><button class="icon-btn" data-day="-1" aria-label="${t("Día anterior")}">${icon("back")}</button><input type="date" id="aFecha" value="${st.fecha}"><button class="icon-btn" data-day="1" aria-label="${t("Día siguiente")}">${icon("chevron")}</button></div>
      ${!S.curSede() && ss.length > 1 ? `<select id="aSede">${ss.map(s => `<option value="${s.id}" ${s.id === st.sede ? "selected" : ""}>${esc(s.nombre)}</option>`).join("")}</select>` : ""}
      <select id="aDisc">${discs.map(x => `<option value="${x.id}" ${x.id === st.disc ? "selected" : ""}>${esc(t(x.nombre))}</option>`).join("")}</select>
      <div class="att-count"><b>${pres.size}</b><span>${tn(pres.size, "presente", "presentes")}</span></div>
    </div>
    <div class="toolbar"><label class="search">${icon("search")}<input id="aq" type="search" placeholder="${t("Buscar")}" value="${esc(st.q)}"></label>
      <button class="btn ghost small" data-all>${t("Marcar todos")}</button></div>
    ${als.length ? `<div class="att-grid">${als.map(a => { const g = S.rangoActual(a.id, d.id); return `<button class="att ${pres.has(a.id) ? "on" : ""}" data-a="${a.id}">
      ${avatar(a, 52)}<b>${esc(a.nombre)}</b>${g ? belt(d, g.rank, g.grado, {w: 64, h: 12}) : ""}<span class="att-check">${icon("check")}</span></button>`; }).join("")}</div>`
    : empty("users", t("Sin alumnos"), t("No hay alumnos activos de esta disciplina en la sede."))}
  </section>
  ${hist.length ? `<section class="card"><header class="card-h"><h3>${icon("calendar")} ${t("Últimas clases")}</h3></header><div class="list">${hist.map(h => `<button class="li" data-go="${h.fecha}">${icon("calendar")}<div class="li-main"><b>${fmtDate(h.fecha, true)}</b></div><span class="tag">${tn((h.presentes || []).length, "{n} presente", "{n} presentes")}</span></button>`).join("")}</div></section>` : ""}`;

  const save = set => {
    S.put("asistencias", {id: rec?.id, academiaId: S.academy().id, fecha: st.fecha, sedeId: st.sede, disciplinaId: st.disc, presentes: [...set]});
  };
  el.onclick = e => {
    const tg = e.target;
    const b = tg.closest("[data-a]"); if(b){ const id = b.dataset.a; pres.has(id) ? pres.delete(id) : pres.add(id); b.classList.toggle("on"); save(pres); return; }
    const dd = tg.closest("[data-day]"); if(dd){ st.fecha = addDays(st.fecha, +dd.dataset.day); render(el); return; }
    const go = tg.closest("[data-go]"); if(go){ st.fecha = go.dataset.go; window.scrollTo(0, 0); render(el); return; }
    if(tg.closest("[data-all]")){ for(const a of als) pres.add(a.id); save(pres); toast(tn(als.length, "{n} presente", "{n} presentes")); }
  };
  el.querySelector("#aFecha").onchange = e => { st.fecha = e.target.value || today(); render(el); };
  el.querySelector("#aDisc").onchange = e => { st.disc = e.target.value; render(el); };
  const sedeSel = el.querySelector("#aSede"); if(sedeSel) sedeSel.onchange = e => { st.sede = e.target.value; render(el); };
  const aq = el.querySelector("#aq"); aq.oninput = e => { st.q = e.target.value; st.f = true; render(el); };
  if(st.f){ st.f = false; aq.focus(); aq.setSelectionRange(st.q.length, st.q.length); }
}
