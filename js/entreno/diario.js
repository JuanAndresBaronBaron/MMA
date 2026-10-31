/* Diario de entreno: todas las sesiones con sus notas, etiquetas, rollos y aprendizajes; filtros por arte y etiqueta y búsqueda. */
import * as E from "./index.js";
import * as S from "../store.js";
import {icon} from "../ui.js";
import {esc, fmtDate, norm} from "../util.js";
import {t, tn} from "../i18n.js";
import {volver, registrarModal, metaSesion, tipoT, resT} from "../views/entreno.js";

const st = {a: "", tag: "", q: "", n: 30};
export function render(el){
  const hs = E.hechas();
  const artes = E.ARTES.filter(a => hs.some(s => (s.artes || []).includes(a.id)));
  const cuenta = {};
  for(const s of hs) for(const x of s.tags || []) cuenta[x] = (cuenta[x] || 0) + 1;
  const tags = Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, 16).map(x => x[0]);
  if(st.tag && !cuenta[st.tag]) st.tag = "";
  el.innerHTML = `${volver()}
  <section class="card en-dia">
    <header class="card-h"><h3>${icon("edit")} ${t("Diario")}</h3><button class="btn small primary" data-nuevo>${icon("plus")} ${t("Registrar entreno")}</button></header>
    ${hs.length ? `<label class="en-search">${icon("search")}<input id="dq" type="search" value="${esc(st.q)}" placeholder="${esc(t("Buscar en notas, técnicas y compañeros"))}" aria-label="${esc(t("Buscar en el diario"))}" autocomplete="off"></label>
    ${artes.length > 1 ? `<div class="chip-row"><button class="chip-btn ${!st.a ? "on" : ""}" data-fa="">${t("Todas")}</button>${artes.map(a => `<button class="chip-btn ${st.a === a.id ? "on" : ""}" data-fa="${a.id}">${esc(t(a.corto))}</button>`).join("")}</div>` : ""}
    ${tags.length ? `<div class="chip-row en-dia-tags">${tags.map(x => `<button class="chip-btn ${st.tag === x ? "on" : ""}" data-ft="${esc(x)}">#${esc(x)}</button>`).join("")}</div>` : ""}
    <div class="en-dia-l" aria-live="polite"></div>`
    : `<div class="empty">${icon("edit", "big")}<h3>${t("Tu diario está vacío")}</h3><p>${t("Registra cada entreno con lo que salió bien, lo que debes mejorar y tus rollos. Releerlo es la forma más rápida de mejorar.")}</p></div>`}
  </section>`;
  const lista = el.querySelector(".en-dia-l");
  const pintar = () => {
    if(!lista) return;
    const nq = norm(st.q.trim());
    const xs = hs.filter(s => (!st.a || (s.artes || []).includes(st.a)) && (!st.tag || (s.tags || []).includes(st.tag))
      && (!nq || norm([s.nota, s.bien, s.mal, ...(s.tags || []), ...(s.rollos || []).flatMap(r => [r.pareja, r.tecnica])].join(" ")).includes(nq)));
    lista.innerHTML = xs.length ? xs.slice(0, st.n).map(entrada).join("") + (xs.length > st.n ? `<button class="btn ghost block" data-mas>${t("Ver más")}</button>` : "")
      : `<p class="muted">${t("Nada coincide con el filtro.")}</p>`;
  };
  pintar();
  const q = el.querySelector("#dq"); if(q) q.oninput = e => { st.q = e.target.value; st.n = 30; pintar(); };
  el.onclick = e => {
    const tg = e.target;
    if(tg.closest("[data-nuevo]")) return registrarModal();
    const ed = tg.closest("[data-ed]"); if(ed){ const s = S.get("sesiones", ed.dataset.ed); if(s) registrarModal({ses: s}); return; }
    const fa = tg.closest("[data-fa]"); if(fa){ st.a = fa.dataset.fa; return render(el); }
    const ft = tg.closest("[data-ft]"); if(ft){ st.tag = st.tag === ft.dataset.ft ? "" : ft.dataset.ft; return render(el); }
    if(tg.closest("[data-mas]")){ st.n += 30; pintar(); }
  };
  el.onchange = null;
}
function entrada(s){
  const a = E.arte(s.artes?.[0]);
  const tit = s.plan ? t("Sesión de rutina") : s.tipo ? tipoT(s.tipo) : t("Sesión completada");
  return `<article class="en-ent" style="--c:${a?.color || "var(--line2)"}">
    <header><div><b>${fmtDate(s.fecha, true)}</b><span class="muted small"> · ${esc(tit)}</span></div><button class="icon-btn" data-ed="${esc(s.id)}" aria-label="${t("Editar diario")}">${icon("edit")}</button></header>
    ${metaSesion(s, true)}
    ${s.tags?.length ? `<div class="en-ent-tags">${s.tags.map(x => `<span>#${esc(x)}</span>`).join("")}</div>` : ""}
    ${s.bien || s.mal ? `<div class="en-cols">${s.bien ? `<div class="ok"><h4>${t("Salió bien")}</h4><p>${esc(s.bien)}</p></div>` : ""}${s.mal ? `<div class="bad"><h4>${t("Por mejorar")}</h4><p>${esc(s.mal)}</p></div>` : ""}</div>` : ""}
    ${s.rollos?.length ? `<ul class="en-ent-r">${s.rollos.map(r => `<li><b>${esc(resT(r.resultado))}</b>${r.tecnica ? ` · ${esc(r.tecnica)}` : ""}${r.pareja ? ` <span class="muted small">${esc(t("con {p}", {p: r.pareja}))}${r.cinturon ? ` (${esc(t(r.cinturon))})` : ""}</span>` : ""}</li>`).join("")}</ul>` : ""}
  </article>`;
}
