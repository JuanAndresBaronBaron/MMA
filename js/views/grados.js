import * as S from "../store.js";
import {icon, avatar, belt, empty, rankLabel} from "../ui.js";
import {esc, fmtDate, fmtDuration, addMonths, today, clamp, fmtMonths} from "../util.js";
import {promotionModal} from "../forms.js";
import {t, tn} from "../i18n.js";
import * as E from "../evaluacion.js";
import {estadoEf} from "../cobros.js";

const st = {disc: ""};
/* etiqueta corta de disciplina (BJJ, MMA, MT) en vez de solo un punto de color */
const tag = d => `<span class="disc-tag" style="--c:${d.color}">${esc(S.discCorto(d))}</span>`;
const CASI_DIAS = 45;

/* insignias de preparación: tiempo, clases (si la disciplina pide mínimo) y requisitos (si hay currículo) */
export function badges(r){
  const b = [];
  b.push(r.tiempo.ok ? `<span class="rb ok">${icon("check")}${t("Tiempo")}</span>` : `<span class="rb warn">${icon("clock")}${r.tiempo.faltanDias ? tn(r.tiempo.faltanDias, "Tiempo: 1 día", "Tiempo: {n} días") : t("Tiempo: hoy")}</span>`);
  if(r.clases.min) b.push(`<span class="rb ${r.clases.ok ? "ok" : "warn"}">${r.clases.ok ? icon("check") : ""}${t("Clases {hechas}/{min}", {hechas: r.clases.hechas, min: r.clases.min})}</span>`);
  if(r.req) b.push(`<span class="rb ${r.req.listo ? "ok" : "warn"}" title="${r.req.criticosPend.length ? esc(tn(r.req.criticosPend.length, "1 crítico pendiente", "{n} críticos pendientes")) : ""}">${r.req.listo ? icon("check") : ""}${t("Requisitos {ok}/{total}", {ok: r.req.ok, total: r.req.total})}</span>`);
  return `<span class="rbs">${b.join("")}</span>`;
}
const elegible = r => r.tiempo.ok ? "" : !r.tiempo.faltanDias ? t("elegible hoy") : tn(r.tiempo.faltanDias, "elegible el {fecha} · en 1 día", "elegible el {fecha} · en {n} días", {fecha: fmtDate(r.tiempo.fecha)});

export function render(el){
  const discs = S.discsOfSede(S.curSede());
  if(!discs.length){ el.innerHTML = empty("belt", t("Sin disciplinas"), t("Crea disciplinas en Academia para llevar los grados."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  /* el currículo llega aparte: al cargarse se repinta con los requisitos */
  if(!E.listo()) E.precargar().then(ok => { if(ok && el.isConnected && location.hash.startsWith("#/grados")) render(el); });
  if(st.disc && !discs.find(d => d.id === st.disc)) st.disc = "";
  const ds = st.disc ? discs.filter(d => d.id === st.disc) : discs;
  const listos = new Map(), casi = new Map(), recientes = [], rapidas = [], sinGrado = [];
  const hoy = today(), hace90 = addMonths(hoy, -3), hace12 = addMonths(hoy, -12);
  const add = (m, a, x) => { if(!m.has(a.id)) m.set(a.id, {a, xs: []}); m.get(a.id).xs.push(x); };
  for(const d of ds) for(const a of S.alumnos({todos: true})){
    if(!(a.disciplinaIds || []).includes(d.id)) continue;
    const h = S.gradosDe(a.id, d.id);
    if(estadoEf(a) === "activo"){
      if(!h.length) sinGrado.push({a, d});
      const r = E.readiness(a, d);
      if(r){ if(r.listo) add(listos, a, {d, r}); else if(r.tiempo.ok || r.tiempo.faltanDias <= CASI_DIAS) add(casi, a, {d, r}); }
    }
    for(const g of h) if(!g.inicial && g.fecha >= hace90) recientes.push({a, d, g});
    for(const r of S.promocionesRapidas(a.id, d)) if(r.g.fecha >= hace12) rapidas.push({a, d, ...r});
  }
  const minF = x => x.xs.reduce((m, y) => (y.r.tiempo.fecha < m ? y.r.tiempo.fecha : m), "9999");
  const L = [...listos.values()].sort((x, y) => x.a.nombre.localeCompare(y.a.nombre));
  const C = [...casi.values()].sort((x, y) => minF(x).localeCompare(minF(y)) || x.a.nombre.localeCompare(y.a.nombre));
  recientes.sort((x, y) => y.g.fecha.localeCompare(x.g.fecha));
  rapidas.sort((x, y) => y.g.fecha.localeCompare(x.g.fecha));

  /* una fila por alumno; dentro, una línea por disciplina con su siguiente rango, insignias y acciones */
  const fila = ({a, xs}) => `<div class="li rd-row">${avatar(a, 40)}<div class="li-main"><a class="rd-name" href="#/alumno/${a.id}"><b>${esc(a.nombre)}</b></a>
    ${xs.map(({d, r}) => {
      const g = r.cur, bc = S.rankDef(d, r.n.tipo === "grado" ? g.rank : g.rank + 1).c;
      const pct = r.n.min ? clamp(r.n.meses / r.n.min * 100, 0, 100) : 100;
      return `<div class="rd-line"><div class="rd-info">
        <span class="muted small">${tag(d)}${esc(rankLabel(d, g))} · ${fmtDuration(r.n.tipo === "grado" ? g.fecha : S.inicioCinturon(S.gradosDe(a.id, d.id)).fecha)}</span>
        <span class="next-rank small" style="--bc:${esc(bc)}"><i aria-hidden="true"></i>→ ${esc(r.n.txt)}</span>
        ${elegible(r) ? `<span class="small muted">${esc(elegible(r))}</span><div class="progress thin"><span style="width:${pct}%"></span></div>` : ""}
        ${badges(r)}</div>
        <div class="rd-act">${r.req ? `<button class="btn small ghost" data-eval="${a.id}" data-d="${d.id}">${icon("target")}<span>${t("Evaluar")}</span></button>` : ""}
        <button class="btn small ${r.listo ? "primary" : "ghost"}" data-promo="${a.id}" data-d="${d.id}">${t("Promover")}</button></div></div>`;
    }).join("")}</div></div>`;

  el.innerHTML = `
  <div class="filters"><div class="chips">
    <label class="chip"><input type="radio" name="disc" value="" ${!st.disc ? "checked" : ""}><span>${t("Todas")}</span></label>
    ${discs.map(d => `<label class="chip" style="--dc:${d.color}"><input type="radio" name="disc" value="${d.id}" ${st.disc === d.id ? "checked" : ""}><span>${esc(t(d.nombre))}</span></label>`).join("")}
  </div></div>
  <div class="grid2">
    <section class="card"><header class="card-h"><h3>${icon("check")} ${t("Listos para promoción")} <span class="count-b">${L.length}</span></h3></header>
      <p class="muted small">${t("Cumplen el tiempo mínimo, las clases y los requisitos del currículo (cuando aplican).")}</p>
      ${L.length ? `<div class="list">${L.map(fila).join("")}</div>` : `<p class="muted">${t("Nadie por ahora.")}</p>`}</section>
    <section class="card"><header class="card-h"><h3>${icon("target")} ${t("Casi listos")} <span class="count-b">${C.length}</span></h3></header>
      <p class="muted small">${t("Les falta poco: tiempo en los próximos {n} días, clases o requisitos.", {n: CASI_DIAS})}</p>
      ${C.length ? `<div class="list">${C.map(fila).join("")}</div>` : `<p class="muted">${t("Nadie cumple tiempo en las próximas semanas.")}</p>`}</section>
    <section class="card ${rapidas.length ? "warn-card" : ""}"><header class="card-h"><h3>${icon("alert")} ${t("Promociones antes de tiempo")} <span class="count-b">${rapidas.length}</span></h3></header>
      <p class="muted small">${t("Grados del último año que se dieron con menos tiempo del recomendado.")}</p>
      ${rapidas.length ? `<div class="list">${rapidas.map(x => `<a class="li" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="small">${tag(x.d)}${esc(rankLabel(x.d, x.g))}</span><span class="small warn-t">${esc(x.avisos.map(w => w.txt).join(" "))}</span></div><span class="muted small">${fmtDate(x.g.fecha)}</span></a>`).join("")}</div>` : `<p class="muted">${t("Todo en orden")}</p>`}</section>
    <section class="card"><header class="card-h"><h3>${icon("medal")} ${t("Promociones recientes (90 días)")}</h3></header>
      ${recientes.length ? `<div class="list">${recientes.map(x => `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${tag(x.d)}${esc(rankLabel(x.d, x.g))}${x.g.profesor ? " · " + esc(x.g.profesor) : ""} · ${fmtDate(x.g.fecha)}</span></div></a><span class="li-belt hide-s">${belt(x.d, x.g.rank, x.g.grado, {w: 64, h: 12})}</span><a class="icon-btn" href="#/certificado/${x.a.id}/${x.d.id}" title="${t("Certificado")}" aria-label="${t("Certificado")}">${icon("award")}</a></div>`).join("")}</div>` : `<p class="muted">${t("Sin promociones recientes.")}</p>`}</section>
    ${sinGrado.length ? `<section class="card"><header class="card-h"><h3>${icon("info")} ${t("Sin grado registrado")} <span class="count-b">${sinGrado.length}</span></h3></header>
      <div class="list">${sinGrado.map(x => `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 36)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${tag(x.d)}${esc(t(x.d.nombre))}</span></div></a><button class="btn small ghost" data-promo="${x.a.id}" data-d="${x.d.id}">${t("Registrar")}</button></div>`).join("")}</div></section>` : ""}
    <section class="card"><header class="card-h"><h3>${icon("belt")} ${t("Tiempos mínimos configurados")}</h3><a class="btn-link" href="#/academia">${t("Editar")}</a></header>
      ${ds.map(d => `<h4 class="grp gr-h">${tag(d)} ${esc(t(d.nombre))}${E.listo() && E.claveDe(d) ? `<button class="btn small ghost" data-print="${d.id}">${icon("print")}<span>${t("Imprimir currículo")}</span></button>` : ""}</h4><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t("Cinturón")}</th><th>${t("Grados")}</th><th>${t("Tiempo mín.")}</th><th>${t("Entre grados")}</th><th>${t("Clases mín.")}</th></tr></thead><tbody>
        ${d.ranks.map((r, i) => `<tr><td>${belt(d, i, 0, {w: 50, h: 10})} ${esc(t(r.n))}</td><td>${r.g || "—"}</td><td>${i < d.ranks.length - 1 ? fmtMonths(r.m) : "—"}</td><td>${r.g ? fmtMonths(r.mg) : "—"}</td><td>${Number(r.cl) || "—"}</td></tr>`).join("")}</tbody></table></div>`).join("")}
    </section>
  </div>`;
  el.onchange = e => { if(e.target.name === "disc"){ st.disc = e.target.value; render(el); } };
  el.onclick = e => {
    const p = e.target.closest("[data-promo]"); if(p) return promotionModal(S.get("alumnos", p.dataset.promo), p.dataset.d);
    const v = e.target.closest("[data-eval]"); if(v) return E.evaluarModal(S.get("alumnos", v.dataset.eval), S.get("disciplinas", v.dataset.d));
    const pr = e.target.closest("[data-print]"); if(pr) return imprimirCurriculo(S.get("disciplinas", pr.dataset.print));
  };
}

/* hoja imprimible con el currículo de cada cinturón de una disciplina (casillas para marcar a mano) */
export function imprimirCurriculo(d){
  if(!d) return;
  const acad = S.academy();
  const html = d.ranks.map((r, i) => {
    const rg = E.curriculo(d, i), reqs = E.reqsDe(rg);
    if(!reqs.length) return "";
    return `<section class="pc-rank"><h2>${belt(d, i, 0, {w: 90, h: 16})} ${esc(t(r.n))}${rg.edadMin ? ` <small>${t("desde {n} años", {n: rg.edadMin})}</small>` : ""}${rg.tiempo ? ` <small>· ${esc(rg.tiempo)}</small>` : ""}</h2>
      ${(rg.grados || []).filter(b => (b.req || []).length).map(b => `<h3>${b.g ? tn(b.g, "1° grado", "{n}° grado") + " · " : ""}${esc(b.titulo || "")}</h3>
        <ul>${b.req.map(q => `<li><i class="pc-box"></i>${esc(q.txt)} <small>${esc(t(E.CATS[q.cat] || q.cat || ""))}${q.critico ? " · " + t("Crítico") : ""}</small></li>`).join("")}</ul>`).join("")}
      ${(rg.conducta || []).length ? `<h3>${t("Conducta")}</h3><ul>${rg.conducta.map(q => `<li><i class="pc-box"></i>${esc(q.txt)}</li>`).join("")}</ul>` : ""}</section>`;
  }).join("");
  document.getElementById("print-cur")?.remove();
  const box = document.createElement("div");
  box.id = "print-cur"; box.className = "print-cur";
  box.innerHTML = `<header><b>${esc(acad?.nombre || "")}</b><h1>${t("Currículo")} · ${esc(t(d.nombre))}</h1><p>${t("Alumno")}: ____________________________</p></header>${html || `<p>${t("Sin currículo para esta disciplina.")}</p>`}`;
  document.body.appendChild(box);
  document.body.classList.add("printing-cur");
  const fin = () => { document.body.classList.remove("printing-cur"); box.remove(); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try{ window.print(); }catch(e){} }, 50);
}
