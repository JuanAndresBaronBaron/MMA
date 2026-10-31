import * as S from "../store.js";
import {icon, avatar, belt, empty, rankLabel, haptic} from "../ui.js";
import {esc, fmtDate, fmtDuration, addMonths, today, clamp, fmtMonths} from "../util.js";
import {promotionModal} from "../forms.js";
import {t, tn} from "../i18n.js";
import * as E from "../evaluacion.js";
import {estadoEf} from "../cobros.js";

const st = {disc: "", more: {}};
/* etiqueta corta de disciplina (BJJ, MMA, MT) en vez de solo un punto de color */
const tag = d => `<span class="disc-tag" style="--c:${d.color}">${esc(S.discCorto(d))}</span>`;
const CASI_DIAS = 45;

/* insignias de preparación: tiempo, clases (si la disciplina pide mínimo) y requisitos (si hay currículo) */
export function badges(r){
  const b = [];
  b.push(r.tiempo.ok ? `<span class="rb ok rb-t">${icon("check")}${t("Tiempo")}</span>` : `<span class="rb warn rb-t">${icon("clock")}${r.tiempo.faltanDias ? tn(r.tiempo.faltanDias, "Tiempo: 1 día", "Tiempo: {n} días") : t("Tiempo: hoy")}</span>`);
  if(r.clases.min) b.push(`<span class="rb rb-c ${r.clases.ok ? "ok" : "warn"}">${r.clases.ok ? icon("check") : ""}${t("Clases {hechas}/{min}", {hechas: r.clases.hechas, min: r.clases.min})}</span>`);
  if(r.req) b.push(`<span class="rb rb-r ${r.req.listo ? "ok" : "warn"}" title="${r.req.criticosPend.length ? esc(tn(r.req.criticosPend.length, "1 crítico pendiente", "{n} críticos pendientes")) : ""}">${r.req.listo ? icon("check") : ""}${t("Requisitos {ok}/{total}", {ok: r.req.ok, total: r.req.total})}</span>`);
  return `<span class="rbs">${b.join("")}</span>`;
}
/* anillos de preparación al estilo Actividad: tiempo (exterior), clases y requisitos (interior). Solo los que aplican. */
export function rings(r, size = 44){
  const v = [{k: "t", p: r.n?.min ? r.n.meses / r.n.min : (r.tiempo.ok ? 1 : 0)}];
  if(r.clases.min) v.push({k: "c", p: r.clases.hechas / r.clases.min});
  if(r.req) v.push({k: "r", p: r.req.ok / r.req.total});
  if(r.tiempo.ok) v[0].p = 1;
  const sw = v.length > 2 ? 5 : 6, gap = 1.5;
  const arcs = v.map((x, i) => {
    const rad = 22 - sw / 2 - i * (sw + gap), pct = Math.round(clamp(x.p, 0, 1) * 100);
    return `<g class="rg-${x.k}"><circle class="rg-track" cx="22" cy="22" r="${rad}" stroke-width="${sw}"/>${pct ? `<circle class="rg-val" cx="22" cy="22" r="${rad}" stroke-width="${sw}" pathLength="100" style="--p:${pct}" stroke-dasharray="${pct} 100"/>` : ""}</g>`;
  }).join("");
  const lbl = [t("Tiempo"), ...(r.clases.min ? [t("Clases")] : []), ...(r.req ? [t("Requisitos")] : [])].map((n, i) => `${n} ${Math.round(clamp(v[i].p, 0, 1) * 100)}%`).join(", ");
  return `<svg class="rings ${r.listo ? "done" : ""}" viewBox="0 0 44 44" width="${size}" height="${size}" role="img" aria-label="${esc(lbl)}">${arcs}</svg>`;
}
const elegible = r => r.tiempo.ok ? "" : !r.tiempo.faltanDias ? t("elegible hoy") : tn(r.tiempo.faltanDias, "elegible el {fecha} · en 1 día", "elegible el {fecha} · en {n} días", {fecha: fmtDate(r.tiempo.fecha)});
const LIM = 5;
const verMas = (k, n) => n > LIM ? `<button type="button" class="gr-more" data-more="${k}" aria-expanded="${st.more[k] ? "true" : "false"}">${st.more[k] ? t("Ver menos") : t("Ver todos ({n})", {n})}</button>` : "";
const corta = (k, xs) => st.more[k] ? xs : xs.slice(0, LIM);
const nadie = (txt, ic = "check") => `<div class="gr-none">${icon(ic)}<span>${txt}</span></div>`;

export function render(el){
  const discs = S.discsOfSede(S.curSede());
  if(!discs.length){ el.innerHTML = empty("belt", t("Sin disciplinas"), t("Crea disciplinas en Academia para llevar los grados."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  /* el currículo llega aparte: al cargarse se repinta con los requisitos */
  if(!E.listo()) E.precargar().then(ok => { if(ok && el.isConnected && location.hash.startsWith("#/grados")) render(el); });
  if(st.disc && !discs.find(d => d.id === st.disc)) st.disc = "";
  /* el selector queda fuera de lo que se repinta: así el deslizador del control segmentado se mueve con resorte */
  el.innerHTML = `${discs.length > 1 ? `<div class="gr-top"><div class="seg gr-seg" role="radiogroup" aria-label="${t("Disciplina")}">
    <label><input type="radio" name="disc" value="" ${!st.disc ? "checked" : ""}><span>${t("Todas")}</span></label>
    ${discs.map(d => `<label title="${esc(t(d.nombre))}"><input type="radio" name="disc" value="${d.id}" ${st.disc === d.id ? "checked" : ""} aria-label="${esc(t(d.nombre))}"><span><i class="gr-dot" style="--c:${esc(d.color || "#888")}"></i><b class="sl">${esc(t(d.nombre))}</b><b class="ss">${esc(S.discCorto(d))}</b></span></label>`).join("")}
  </div></div>` : ""}<div class="gr-body"></div>`;
  const body = el.querySelector(".gr-body");
  paint(body, discs);
  el.onchange = e => { if(e.target.name === "disc"){ st.disc = e.target.value; st.more = {}; paint(body, discs, true); } };
  el.onclick = e => {
    const p = e.target.closest("[data-promo]"); if(p) return promotionModal(S.get("alumnos", p.dataset.promo), p.dataset.d);
    const v = e.target.closest("[data-eval]"); if(v) return E.evaluarModal(S.get("alumnos", v.dataset.eval), S.get("disciplinas", v.dataset.d));
    const pr = e.target.closest("[data-print]"); if(pr) return imprimirCurriculo(S.get("disciplinas", pr.dataset.print));
    const m = e.target.closest("[data-more]");
    if(m){ st.more[m.dataset.more] = !st.more[m.dataset.more]; haptic("light"); paint(body, discs); body.querySelector(`[data-more="${m.dataset.more}"]`)?.focus({preventScroll: true}); return; }
    const go = e.target.closest("[data-go]");
    if(go){ const s = body.querySelector("#" + go.dataset.go); if(s){ haptic("selection"); s.scrollIntoView({behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start"}); } }
  };
}

function paint(body, discs, fade){
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

  /* una fila por alumno; dentro, una línea por disciplina con anillos, siguiente rango, insignias y acciones */
  const fila = ({a, xs}) => `<div class="li rd-row"><a class="rd-who chev" href="#/alumno/${a.id}">${avatar(a, 40)}<b class="rd-name">${esc(a.nombre)}</b></a><div class="rd-lines">
    ${xs.map(({d, r}) => {
      const g = r.cur, bc = S.rankDef(d, r.n.tipo === "grado" ? g.rank : g.rank + 1).c;
      return `<div class="rd-line">${rings(r, 40)}<div class="rd-info">
        <span class="muted small rd-cur">${tag(d)}${esc(rankLabel(d, g))} · ${fmtDuration(r.n.tipo === "grado" ? g.fecha : S.inicioCinturon(S.gradosDe(a.id, d.id)).fecha)}</span>
        <span class="next-rank" style="--bc:${esc(bc)}"><i aria-hidden="true"></i><span>${esc(r.n.txt)}</span></span>
        ${elegible(r) ? `<span class="small muted">${esc(elegible(r))}</span>` : ""}
        ${badges(r)}</div>
        <div class="rd-act">${r.req ? `<button class="btn small gray" data-eval="${a.id}" data-d="${d.id}">${icon("target")}<span>${t("Evaluar")}</span></button>` : ""}
        <button class="btn small ${r.listo ? "primary" : "tinted"}" data-promo="${a.id}" data-d="${d.id}">${t("Promover")}</button></div></div>`;
    }).join("")}</div></div>`;

  const stat = (go, ic, sc, lbl, n) => `<button type="button" class="card gr-stat press" data-go="${go}" style="--sc:var(${sc})"><span class="stat-l">${icon(ic)}${lbl}</span><span class="stat-v">${n}</span></button>`;
  const sec = (id, title, n, extra = "") => `<h2 class="section-header" id="${id}"><span>${title}${n != null ? ` <span class="gr-n">${n}</span>` : ""}</span>${extra}</h2>`;

  body.innerHTML = `
  <div class="gr-sum stagger">
    ${stat("gr-listos", "check", "--ok", t("Listos"), L.length)}
    ${stat("gr-casi", "target", "--accent2", t("Casi listos"), C.length)}
    ${stat("gr-rec", "medal", "--gold", t("Últimos 90 días"), recientes.length)}
    ${stat("gr-rap", "alert", rapidas.length ? "--warn" : "--muted", t("Antes de tiempo"), rapidas.length)}
  </div>
  <div class="gr-cols">
    <div class="gr-col">
      ${sec("gr-listos", t("Listos para promoción"), L.length)}
      <section class="card flush gr-list">${L.length ? L.map(fila).join("") : nadie(t("Nadie por ahora."), "belt")}</section>
      <p class="section-footer">${t("Cumplen el tiempo mínimo, las clases y los requisitos del currículo (cuando aplican).")}</p>
      ${sec("gr-casi", t("Casi listos"), C.length)}
      <section class="card flush gr-list">${C.length ? corta("casi", C).map(fila).join("") + verMas("casi", C.length) : nadie(t("Nadie cumple tiempo en las próximas semanas."), "clock")}</section>
      <p class="section-footer">${t("Les falta poco: tiempo en los próximos {n} días, clases o requisitos.", {n: CASI_DIAS})}</p>
      <div class="gr-legend" aria-hidden="true"><span class="lg-t">${t("Tiempo")}</span><span class="lg-c">${t("Clases")}</span><span class="lg-r">${t("Requisitos")}</span></div>
    </div>
    <div class="gr-col">
      ${sec("gr-rec", t("Promociones recientes (90 días)"), recientes.length || null)}
      <section class="card flush gr-list">${recientes.length ? corta("rec", recientes).map(x => `<div class="li gr-rec"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${tag(x.d)}${esc(rankLabel(x.d, x.g))}${x.g.profesor ? " · " + esc(x.g.profesor) : ""} · ${fmtDate(x.g.fecha)}</span></div></a><span class="li-belt hide-s">${belt(x.d, x.g.rank, x.g.grado, {w: 64, h: 12})}</span><a class="icon-btn gray gr-cert" href="#/certificado/${x.a.id}/${x.d.id}" title="${t("Certificado")}" aria-label="${t("Certificado")}">${icon("award")}</a></div>`).join("") + verMas("rec", recientes.length) : nadie(t("Sin promociones recientes."), "medal")}</section>
      ${sec("gr-rap", t("Promociones antes de tiempo"), rapidas.length)}
      <section class="card flush gr-list">${rapidas.length ? corta("rap", rapidas).map(x => `<a class="li gr-rap" href="#/alumno/${x.a.id}">${avatar(x.a, 38)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="small muted">${tag(x.d)}${esc(rankLabel(x.d, x.g))} · ${fmtDate(x.g.fecha)}</span><span class="small warn-t">${esc(x.avisos.map(w => w.txt).join(" "))}</span></div></a>`).join("") + verMas("rap", rapidas.length) : nadie(t("Todo en orden"))}</section>
      <p class="section-footer">${t("Grados del último año que se dieron con menos tiempo del recomendado.")}</p>
      ${sinGrado.length ? `${sec("gr-sin", t("Sin grado registrado"), sinGrado.length)}
      <section class="card flush gr-list">${corta("sin", sinGrado).map(x => `<div class="li"><a class="li-link" href="#/alumno/${x.a.id}">${avatar(x.a, 36)}<div class="li-main"><b>${esc(x.a.nombre)}</b><span class="muted small">${tag(x.d)}${esc(t(x.d.nombre))}</span></div></a><button class="btn small tinted" data-promo="${x.a.id}" data-d="${x.d.id}">${t("Registrar")}</button></div>`).join("") + verMas("sin", sinGrado.length)}</section>` : ""}
    </div>
  </div>
  ${sec("gr-min", t("Tiempos mínimos configurados"), null, `<a class="btn-link" href="#/academia">${t("Editar")}</a>`)}
  <div class="gr-mins">
    ${ds.map(d => `<section class="card flush gr-min"><header class="gr-min-h">${tag(d)}<b>${esc(t(d.nombre))}</b>${E.listo() && E.claveDe(d) ? `<button class="btn small gray" data-print="${d.id}">${icon("print")}<span>${t("Imprimir currículo")}</span></button>` : ""}</header>
      ${d.ranks.map((r, i) => {
        const det = [r.g ? tn(r.g, "1 grado", "{n} grados") : "", r.g && r.mg ? t("{t} entre grados", {t: fmtMonths(r.mg)}) : "", Number(r.cl) ? tn(Number(r.cl), "1 clase mín.", "{n} clases mín.") : ""].filter(Boolean).join(" · ");
        const last = i === d.ranks.length - 1;
        return `<div class="row-inset gr-mrow">${belt(d, i, 0, {w: 44, h: 10})}<div class="li-main"><b>${esc(t(r.n))}</b>${det ? `<span class="muted small">${esc(det)}</span>` : ""}</div><span class="row-val tnum">${last ? "" : esc(fmtMonths(r.m))}</span></div>`;
      }).join("")}</section>`).join("")}
  </div>`;
  if(fade){ body.classList.remove("gr-fade"); void body.offsetWidth; body.classList.add("gr-fade"); }
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
