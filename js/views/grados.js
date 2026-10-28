import * as S from "../store.js";
import {icon, avatar, belt, empty, rankLabel} from "../ui.js";
import {esc, fmtDate, fmtDuration, addMonths, today, daysBetween, clamp, fmtMonths} from "../util.js";
import {promotionModal} from "../forms.js";
import {t} from "../i18n.js";

const st = {disc: ""};

export function render(el){
  const discs = S.discsOfSede(S.curSede());
  if(!discs.length){ el.innerHTML = empty("belt", t("Sin disciplinas"), t("Crea disciplinas en Academia para llevar los grados."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  if(st.disc && !discs.find(d => d.id === st.disc)) st.disc = "";
  const ds = st.disc ? discs.filter(d => d.id === st.disc) : discs;
  const activos = S.alumnos().filter(a => a.estado === "activo");
  const listos = [], cerca = [], recientes = [], rapidas = [], sinGrado = [];
  const hoy = today(), hace90 = addMonths(hoy, -3), hace12 = addMonths(hoy, -12);
  for(const d of ds) for(const a of S.alumnos({todos: true})){
    if(!(a.disciplinaIds || []).includes(d.id)) continue;
    const h = S.gradosDe(a.id, d.id);
    if(a.estado === "activo"){
      if(!h.length) sinGrado.push({a, d});
      const n = S.siguiente(a.id, d);
      if(n){ if(n.listo) listos.push({a, d, n}); else if(daysBetween(hoy, n.fecha) <= 45) cerca.push({a, d, n}); }
    }
    for(const g of h) if(!g.inicial && g.fecha >= hace90) recientes.push({a, d, g});
    for(const r of S.promocionesRapidas(a.id, d)) if(r.g.fecha >= hace12) rapidas.push({a, d, ...r});
  }
  listos.sort((x, y) => x.n.fecha.localeCompare(y.n.fecha));
  cerca.sort((x, y) => x.n.fecha.localeCompare(y.n.fecha));
  recientes.sort((x, y) => y.g.fecha.localeCompare(x.g.fecha));
  rapidas.sort((x, y) => y.g.fecha.localeCompare(x.g.fecha));

  const cand = (x, desde) => {
    const g = S.rangoActual(x.a.id, x.d.id);
    const pct = x.n.min ? clamp(x.n.meses / x.n.min * 100, 0, 100) : 100;
    return `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 40)}<div class="li-main"><b>${esc(x.a.nombre)}</b>
      <span class="muted small"><span class="dot" style="background:${x.d.color}"></span>${esc(rankLabel(x.d, g))} → <b>${esc(x.n.txt)}</b> · ${desde ? t("desde {fecha}", {fecha: fmtDate(x.n.fecha)}) + " · " : ""}${fmtDuration(x.n.tipo === "grado" ? g.fecha : S.inicioCinturon(S.gradosDe(x.a.id, x.d.id)).fecha)}</span>
      <div class="progress thin"><span style="width:${pct}%"></span></div></div></a>
      <span class="li-belt hide-s">${belt(x.d, g.rank, g.grado, {w: 80, h: 14})}</span>
      <button class="btn small ${x.n.listo ? "primary" : "ghost"}" data-promo="${x.a.id}" data-d="${x.d.id}">${t("Promover")}</button></div>`;
  };

  el.innerHTML = `
  <div class="filters"><div class="chips">
    <label class="chip"><input type="radio" name="disc" value="" ${!st.disc ? "checked" : ""}><span>${t("Todas")}</span></label>
    ${discs.map(d => `<label class="chip" style="--dc:${d.color}"><input type="radio" name="disc" value="${d.id}" ${st.disc === d.id ? "checked" : ""}><span>${esc(t(d.nombre))}</span></label>`).join("")}
  </div></div>
  <div class="grid2">
    <section class="card"><header class="card-h"><h3>${icon("check")} ${t("Listos para promoción")} <span class="count-b">${listos.length}</span></h3></header>
      <p class="muted small">${t("Ya cumplen el tiempo mínimo en su grado o cinturón actual.")}</p>
      ${listos.length ? `<div class="list">${listos.map(cand).join("")}</div>` : `<p class="muted">${t("Nadie por ahora.")}</p>`}</section>
    <section class="card"><header class="card-h"><h3>${icon("clock")} ${t("Próximos 45 días")} <span class="count-b">${cerca.length}</span></h3></header>
      ${cerca.length ? `<div class="list">${cerca.map(x => cand(x, true)).join("")}</div>` : `<p class="muted">${t("Nadie cumple tiempo en las próximas semanas.")}</p>`}</section>
    <section class="card ${rapidas.length ? "warn-card" : ""}"><header class="card-h"><h3>${icon("alert")} ${t("Promociones antes de tiempo")} <span class="count-b">${rapidas.length}</span></h3></header>
      <p class="muted small">${t("Grados del último año que se dieron con menos tiempo del recomendado.")}</p>
      ${rapidas.length ? `<div class="list">${rapidas.map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)} · ${esc(rankLabel(x.d, x.g))}</b><span class="small warn-t">${esc(x.avisos.map(w => w.txt).join(" "))}</span></div><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>` : `<p class="muted">${t("Todo en orden")} 👌</p>`}</section>
    <section class="card"><header class="card-h"><h3>${icon("medal")} ${t("Promociones recientes (90 días)")}</h3></header>
      ${recientes.length ? `<div class="list">${recientes.map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${esc(t(x.d.nombre))} · ${esc(rankLabel(x.d, x.g))}${x.g.profesor ? " · " + esc(x.g.profesor) : ""}</span></div><span class="li-belt">${belt(x.d, x.g.rank, x.g.grado, {w: 64, h: 12})}</span><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>` : `<p class="muted">${t("Sin promociones recientes.")}</p>`}</section>
    ${sinGrado.length ? `<section class="card"><header class="card-h"><h3>${icon("info")} ${t("Sin grado registrado")} <span class="count-b">${sinGrado.length}</span></h3></header>
      <div class="list">${sinGrado.map(x => `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 36)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${esc(t(x.d.nombre))}</span></div></a><button class="btn small ghost" data-promo="${x.a.id}" data-d="${x.d.id}">${t("Registrar")}</button></div>`).join("")}</div></section>` : ""}
    <section class="card"><header class="card-h"><h3>${icon("belt")} ${t("Tiempos mínimos configurados")}</h3><a class="btn-link" href="#/academia">${t("Editar")}</a></header>
      ${ds.map(d => `<h4 class="grp"><span class="dot" style="background:${d.color}"></span> ${esc(t(d.nombre))}</h4><table class="tbl"><thead><tr><th>${t("Cinturón")}</th><th>${t("Grados")}</th><th>${t("Tiempo mín.")}</th><th>${t("Entre grados")}</th></tr></thead><tbody>
        ${d.ranks.map((r, i) => `<tr><td>${belt(d, i, 0, {w: 50, h: 10})} ${esc(t(r.n))}</td><td>${r.g || "—"}</td><td>${i < d.ranks.length - 1 ? fmtMonths(r.m) : "—"}</td><td>${r.g ? fmtMonths(r.mg) : "—"}</td></tr>`).join("")}</tbody></table>`).join("")}
    </section>
  </div>`;
  el.onchange = e => { if(e.target.name === "disc"){ st.disc = e.target.value; render(el); } };
  el.onclick = e => { const p = e.target.closest("[data-promo]"); if(p) promotionModal(S.get("alumnos", p.dataset.promo), p.dataset.d); };
}
