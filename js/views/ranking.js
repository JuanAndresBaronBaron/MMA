import * as S from "../store.js";
import {icon, avatar, belt, empty, rankLabel} from "../ui.js";
import {esc, fmtDuration, fmtDate} from "../util.js";
import {t} from "../i18n.js";
import {estadoEf} from "../cobros.js";

const st = {disc: "", vista: "podio"};

export function render(el){
  const discs = S.discsOfSede(S.curSede());
  if(!discs.length){ el.innerHTML = empty("trophy", t("Sin disciplinas"), t("Crea disciplinas en Academia para ver el ranking."), `<a class="btn primary" href="#/academia">${t("Ir a Academia")}</a>`); return; }
  if(!discs.find(d => d.id === st.disc)) st.disc = discs[0].id;
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
  /* podio: pedestal con el puesto, más alto el 1.º; solo si hay al menos 3 con grado */
  const pod = (r, i) => `<a class="pod p${i + 1}" href="#/alumno/${r.a.id}">
      ${avatar(r.a, i === 0 ? 96 : 76)}
      <b>${esc(r.a.nombre)}</b>
      <span class="pod-belt">${belt(d, r.g.rank, r.g.grado, {w: 110, h: 18})}</span>
      <span class="muted small">${esc(rankLabel(d, r.g))}</span>
      <div class="pod-base" aria-label="${t("Puesto {n}", {n: i + 1})}"><span class="pod-n">${t(["1.º", "2.º", "3.º"][i])}</span></div></a>`;
  let lastRank = -1, n = 0;
  const list = rows.map(r => {
    n++;
    let head = "";
    const rk = r.g ? r.g.rank : -2;
    if(rk !== lastRank){
      lastRank = rk;
      const cnt = rows.filter(x => (x.g ? x.g.rank : -2) === rk).length;
      head = `<div class="rk-head" style="--bc:${r.g ? S.rankDef(d, rk).c : "#666"}"><span class="rk-chip"></span>${r.g ? esc(t(S.rankDef(d, rk).n)) : t("Sin grado registrado")} <span class="muted">· ${cnt}</span></div>`;
    }
    return head + `<a class="rk-row" href="#/alumno/${r.a.id}">
      <span class="rk-pos ${n <= 3 && r.g ? "rk-top" : ""}">${r.g ? n : "–"}</span>
      ${avatar(r.a, 44)}
      <div class="li-main"><b>${esc(r.a.nombre)}</b><span class="muted small">${r.g ? `${esc(rankLabel(d, r.g))} · ${t("hace {tiempo}", {tiempo: fmtDuration(r.g.fecha)})}` : t("Registra su grado")}${S.sedes().length > 1 && !S.curSede() ? " · " + esc(S.get("sedes", r.a.sedeId)?.nombre || "") : ""}</span></div>
      <span class="rk-belt">${r.g ? belt(d, r.g.rank, r.g.grado, {w: 110, h: 18}) : ""}</span>
    </a>`;
  }).join("");

  el.innerHTML = `
  <div class="filters"><div class="chips">
    ${discs.map(x => `<label class="chip" style="--dc:${x.color}"><input type="radio" name="disc" value="${x.id}" ${st.disc === x.id ? "checked" : ""}><span>${esc(t(x.nombre))}</span></label>`).join("")}
  </div></div>
  ${rows.length ? `
  ${top.length >= 3 ? `<section class="podium card">
    <h3 class="pod-title">${icon("trophy")} ${esc(t(d.nombre))}${S.curSede() ? " · " + esc(S.get("sedes", S.curSede()).nombre) : ""}</h3>
    <div class="pod-wrap">${pod(top[1], 1)}${pod(top[0], 0)}${pod(top[2], 2)}</div>
  </section>` : ""}
  <section class="card flush ranking">${list}</section>
  <p class="muted small">${t("Orden: cinturón, luego grado y, a igual grado, quien lo tiene desde hace más tiempo.")}</p>`
  : empty("users", t("Nadie entrena esta disciplina"), t("Asigna la disciplina a tus alumnos para verlos en el ranking."))}`;
  el.onchange = e => { if(e.target.name === "disc"){ st.disc = e.target.value; render(el); } };
}
