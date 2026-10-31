import * as S from "../store.js";
import {icon, avatar, belt, empty, rankLabel} from "../ui.js";
import {esc, fmtDuration, today} from "../util.js";
import {t, tn} from "../i18n.js";
import {estadoEf} from "../cobros.js";

const st = {disc: "", vista: "podio"};

export function render(el){
  const discs = S.discsOfSede(S.curSede());
  if(!discs.length){ el.innerHTML = empty("trophy", t("Sin disciplinas"), t("Crea disciplinas en Academia para ver el ranking."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  if(!discs.find(d => d.id === st.disc)) st.disc = discs[0].id;
  /* el control segmentado queda fuera de lo que se repinta: su deslizador se mueve con resorte */
  el.innerHTML = `${discs.length > 1 ? `<div class="rk-top"><div class="seg rk-seg" role="radiogroup" aria-label="${t("Disciplina")}">
    ${discs.map(x => `<label title="${esc(t(x.nombre))}"><input type="radio" name="disc" value="${x.id}" ${st.disc === x.id ? "checked" : ""} aria-label="${esc(t(x.nombre))}"><span><i class="gr-dot" style="--c:${esc(x.color || "#888")}"></i><b class="sl">${esc(t(x.nombre))}</b><b class="ss">${esc(S.discCorto(x))}</b></span></label>`).join("")}
  </div></div>` : ""}<div class="rk-body"></div>`;
  const body = el.querySelector(".rk-body");
  paint(body);
  el.onchange = e => { if(e.target.name === "disc"){ st.disc = e.target.value; paint(body); } };
}

/* texto del grado sin el nombre del cinturón (el cinturón ya va en el encabezado del grupo) */
const gradoTxt = (d, g) => !g.grado ? "" : d.ranks[g.rank]?.g ? tn(g.grado, "1° grado", "{n}° grado") : t("{n}° dan", {n: g.grado});

function paint(body){
  const d = S.get("disciplinas", st.disc);
  /* orden: cinturón, grado y antigüedad en ese grado (quien lo tiene hace más tiempo va primero) */
  const rows = S.alumnos().filter(a => estadoEf(a) === "activo" && (a.disciplinaIds || []).includes(d.id)).map(a => {
    const h = S.gradosDe(a.id, d.id);
    const g = h[h.length - 1];
    return {a, g, ini: g ? S.inicioCinturon(h) : null};
  });
  rows.sort((x, y) => {
    if(!x.g || !y.g) return (y.g ? 1 : 0) - (x.g ? 1 : 0);
    return (y.g.rank - x.g.rank) || ((y.g.grado || 0) - (x.g.grado || 0)) || x.g.fecha.localeCompare(y.g.fecha) || x.ini.fecha.localeCompare(y.ini.fecha) || x.a.nombre.localeCompare(y.a.nombre);
  });
  const ranked = rows.filter(r => r.g);
  const top = ranked.slice(0, 3);
  const multi = S.sedes().length > 1 && !S.curSede();
  /* podio al estilo Game Center: pedestal con el puesto, más alto el 1.º; solo si hay al menos 3 con grado */
  const pod = (r, i) => `<a class="pod p${i + 1}" href="#/alumno/${r.a.id}">
      <span class="pod-av">${avatar(r.a, i === 0 ? 84 : 64)}<span class="pod-medal" aria-hidden="true">${i + 1}</span></span>
      <b>${esc(r.a.nombre)}</b>
      <span class="pod-sub">${esc(rankLabel(d, r.g))}</span>
      <span class="pod-belt">${belt(d, r.g.rank, r.g.grado, {w: 110, h: 18})}</span>
      <div class="pod-base" aria-label="${t("Puesto {n}", {n: i + 1})}"><span class="pod-n">${t(["1.º", "2.º", "3.º"][i])}</span></div></a>`;
  /* grupos por cinturón: encabezado de sección y una tarjeta con sus filas */
  const groups = [];
  for(const r of rows){
    const rk = r.g ? r.g.rank : -2;
    let gr = groups[groups.length - 1];
    if(!gr || gr.rk !== rk) groups.push(gr = {rk, xs: []});
    gr.xs.push(r);
  }
  let n = 0;
  const fila = r => {
    n++;
    const pos = r.g ? n : 0;
    const sub = r.g ? [gradoTxt(d, r.g), (r.g.fecha >= today() ? t("hoy") : t("hace {tiempo}", {tiempo: fmtDuration(r.g.fecha)}))].filter(Boolean).join(" · ") : t("Registra su grado");
    return `<a class="rk-row" href="#/alumno/${r.a.id}">
      <span class="rk-pos ${pos && pos <= 3 ? "rk-top m" + pos : ""}">${pos || "–"}</span>
      ${avatar(r.a, 40)}
      <div class="li-main"><b>${esc(r.a.nombre)}</b><span class="muted small">${esc(sub)}${multi ? " · " + esc(S.get("sedes", r.a.sedeId)?.nombre || "") : ""}</span></div>
      <span class="rk-belt">${r.g ? belt(d, r.g.rank, r.g.grado, {w: 96, h: 16}) : ""}</span>
    </a>`;
  };
  const list = groups.map(gr => {
    const rd = gr.rk >= 0 ? S.rankDef(d, gr.rk) : null;
    return `<h2 class="section-header rk-head" style="--bc:${esc(rd ? rd.c || "#888" : "#888")}"><span><span class="rk-chip" aria-hidden="true"></span>${rd ? esc(t(rd.n)) : t("Sin grado registrado")}</span><span class="rk-cnt tnum">${gr.xs.length}</span></h2>
      <section class="card flush ranking">${gr.xs.map(fila).join("")}</section>`;
  }).join("");

  body.innerHTML = rows.length ? `
  ${top.length >= 3 ? `<section class="podium card" aria-label="${esc(t(d.nombre))}">
    <p class="pod-title">${icon("trophy")}<span>${esc(t(d.nombre))}${S.curSede() ? " · " + esc(S.get("sedes", S.curSede()).nombre) : ""}</span></p>
    <div class="pod-wrap">${pod(top[1], 1)}${pod(top[0], 0)}${pod(top[2], 2)}</div>
  </section>` : ""}
  ${list}
  <p class="section-footer rk-foot">${t("Orden: cinturón, luego grado y, a igual grado, quien lo tiene desde hace más tiempo.")}</p>`
  : empty("users", t("Nadie entrena esta disciplina"), t("Asigna la disciplina a tus alumnos para verlos en el ranking."));
}
