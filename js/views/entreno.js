/* Entrenamiento: rutina personal, sesión del día y caminos de aprendizaje por arte. */
import * as E from "../entreno/index.js";
import {icon, toast, modal, confirmDlg} from "../ui.js";
import {esc, today, fmtDate, addDays, h} from "../util.js";
import {t, tn, lang} from "../i18n.js";

const PLAT = {youtube: ["YouTube", "#ff0033"], tiktok: ["TikTok", "#25f4ee"], udemy: ["Udemy", "#a435f0"], instagram: ["Instagram", "#e1306c"], articulo: [t("Artículo"), "#d4a73c"], web: ["Web", "#8a8a8a"]};
const st = {dia: today(), filtro: "todas"};

export function render(el, [artId, modId]){
  if(artId && E.arte(artId)) return conCarga(el, [artId], () => modId ? vistaModulo(el, artId, modId) : vistaArte(el, artId));
  const r = E.rutina();
  const ids = E.ARTES.map(a => a.id);
  return conCarga(el, ids, () => vistaHub(el, r));
}

/* carga el contenido que haga falta y luego pinta */
function conCarga(el, ids, pintar){
  const falta = ids.filter(id => !E.cargado(id));
  if(!falta.length) return pintar();
  const hash = location.hash;
  el.innerHTML = `<div class="card"><p class="muted">${icon("sync", "spin")} ${t("Cargando…")}</p></div>`;
  Promise.all(falta.map(E.cargar)).then(() => { if(location.hash === hash) pintar(); })
    .catch(e => { console.error(e); el.innerHTML = `<div class="card"><p>${t("No se pudo cargar el contenido. Revisa tu conexión.")}</p></div>`; });
}

const ring = (p, s = 52, color = "var(--accent)") => { const r = s / 2 - 4.5, c = 2 * Math.PI * r;
  return `<svg class="en-ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="bg"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="fg" style="stroke:${color}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle">${p}%</text></svg>`; };
const chk = (k, label = "", cls = "") => `<label class="en-chk ${cls}"><input type="checkbox" data-k="${esc(k)}" ${E.hecho(k) ? "checked" : ""}><span class="box"></span>${label}</label>`;
const nivelT = n => t((E.NIVELES.find(x => x[0] === n) || [, n])[1]);
const esNota = () => lang() === "en" ? `<p class="muted small en-note">${icon("info", "inline")} ${t("El contenido de los caminos está en español.")}</p>` : "";

/* ---------- inicio de Entrenamiento ---------- */
function vistaHub(el, r){
  const hoy = today();
  const sem = E.semana(st.dia);
  const ses = r ? E.sesion(r, st.dia) : null;
  const reg = E.sesionDe(st.dia);
  const hechasSem = E.semana(hoy).filter(d => E.sesionDe(d)).length;
  const mes = hoy.slice(0, 7), minMes = E.sesiones().filter(s => s.fecha.startsWith(mes)).reduce((a, s) => a + (s.min || 0), 0);
  const racha = E.racha(r);

  el.innerHTML = `
  ${esNota()}
  ${r ? `<div class="kpis">
    <div class="kpi"><span class="kpi-ic c2">${icon("check")}</span><div><b>${hechasSem}/${r.dias.length}</b><span>${t("Sesiones esta semana")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c1">${icon("clock")}</span><div><b>${tn(minMes, "1 min", "{n} min")}</b><span>${t("Entrenados este mes")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c4">${icon("star")}</span><div><b>${tn(racha, "1 semana", "{n} semanas")}</b><span>${t("Racha cumpliendo tu rutina")}</span></div></div>
    <div class="kpi"><span class="kpi-ic c3">${icon("fist")}</span><div><b>${tn(E.sesiones().length, "1 sesión", "{n} sesiones")}</b><span>${t("En total")}</span></div></div>
  </div>` : `<section class="card en-cta">
    <div><h2>${t("Arma tu rutina de entrenamiento")}</h2><p class="muted">${t("Elige los días, cuánto tiempo tienes cada día y qué artes quieres entrenar: una, varias o todas. La app te arma cada sesión con los drills del nivel en el que vas y guarda tu progreso.")}</p></div>
    <button class="btn primary big" data-rutina>${icon("calendar")} ${t("Crear mi rutina")}</button></section>`}

  ${r ? `<section class="card">
    <header class="card-h"><h3>${icon("calendar")} ${t("Tu semana")}</h3><div class="row gap"><span class="muted small hide-s">${esc(rutinaTxt(r))}</span><button class="btn small ghost" data-rutina>${icon("edit")} ${t("Rutina")}</button></div></header>
    <div class="en-week">${sem.map(d => { const a = E.artesDelDia(r, d), s = E.sesionDe(d);
      return `<button class="en-day ${d === st.dia ? "on" : ""} ${d === hoy ? "hoy" : ""} ${s ? "done" : a.length ? "plan" : "rest"}" data-dia="${d}">
        <span class="en-dn">${t(E.DIAS_C[E.diaSemana(d) - 1])}</span><b>${+d.slice(8)}</b>
        <span class="en-dots">${s ? icon("check") : a.map(x => `<i style="background:${E.arte(x).color}"></i>`).join("")}</span></button>`; }).join("")}</div>
    <div class="en-weeknav"><button class="btn small ghost" data-sem="-7">${icon("back")}</button><button class="btn small ghost" data-hoy>${t("Hoy")}</button><button class="btn small ghost" data-sem="7">${icon("chevron")}</button></div>
  </section>

  <section class="card en-today">
    <header class="card-h"><h3>${icon("fist")} ${st.dia === hoy ? t("Sesión de hoy") : t("Sesión del {fecha}", {fecha: fmtDate(st.dia)})}</h3>
      ${ses ? `<span class="muted small">${tn(ses.min, "1 min", "{n} min")} · ${ses.artes.map(a => `<span class="en-tag" style="--c:${E.arte(a).color}">${esc(t(E.arte(a).corto))}</span>`).join(" ")}</span>` : ""}</header>
    ${reg ? `<div class="en-done">${icon("check")} <div><b>${t("Sesión completada")}</b><span class="muted small">${tn(reg.min, "1 min", "{n} min")} · ${tn(reg.hechos?.length || 0, "1 bloque marcado", "{n} bloques marcados")}</span></div><button class="btn small ghost" data-deshacer="${reg.id}">${t("Deshacer")}</button></div>` : ""}
    ${ses ? `<ol class="en-blocks">${ses.bloques.map(bloque).join("")}</ol>
      ${!reg ? `<div class="en-actions"><button class="btn primary" data-terminar>${icon("check")} ${t("Terminé la sesión")}</button><span class="muted small">${t("Marca los bloques que hiciste: los drills cuentan para tu progreso.")}</span></div>` : ""}`
      : `<div class="empty">${icon("heart", "big")}<h3>${t("Día de descanso")}</h3><p>${t("Recuperarse también es entrenar: camina, estira o mira uno de los videos pendientes.")}</p></div>`}
  </section>` : ""}

  <section class="card">
    <header class="card-h"><h3>${icon("belt")} ${t("Caminos de aprendizaje")}</h3><span class="muted small">${t("De lo más básico a lo más avanzado")}</span></header>
    <div class="en-arts">${E.ARTES.map(a => { const d = E.cargado(a.id), p = E.pctArte(d), m = E.moduloActual(d), enRut = r?.artes?.includes(a.id);
      return `<a class="en-art" href="#/entreno/${a.id}" style="--c:${a.color}">
        <div class="en-art-h">${ring(p, 54, a.color)}<div><b>${esc(t(a.nombre))}</b><span class="muted small">${tn(d.modulos.length, "1 módulo", "{n} módulos")} · ${tn(d.modulos.reduce((s, x) => s + x.recursos.length, 0), "1 video o curso", "{n} videos y cursos")}</span></div></div>
        <span class="en-art-now"><span class="muted small">${p ? t("Vas en") : t("Empiezas con")}</span> ${esc(m.titulo)} <span class="lvl ${m.nivel}">${nivelT(m.nivel)}</span></span>
        ${enRut ? `<span class="en-in">${icon("calendar")} ${t("En tu rutina")}</span>` : ""}</a>`; }).join("")}</div>
  </section>

  ${E.sesiones().length ? `<section class="card"><header class="card-h"><h3>${icon("list")} ${t("Historial")}</h3></header><div class="list">${E.sesiones().slice(0, 8).map(s => `<div class="li"><span class="li-ic">${icon("check")}</span><div class="li-main"><b>${fmtDate(s.fecha, true)}</b><span class="muted small">${tn(s.min, "1 min", "{n} min")} · ${(s.artes || []).map(a => esc(t(E.arte(a)?.corto || a))).join(", ")}</span></div></div>`).join("")}</div></section>` : ""}`;

  el.onclick = async e => {
    const tg = e.target;
    if(tg.closest(".en-b p")){ tg.closest(".en-b").classList.toggle("open"); return; }
    if(tg.closest("[data-rutina]")) return editarRutina();
    const d = tg.closest("[data-dia]"); if(d){ st.dia = d.dataset.dia; return vistaHub(el, r); }
    const sm = tg.closest("[data-sem]"); if(sm){ st.dia = addDays(st.dia, +sm.dataset.sem); return vistaHub(el, r); }
    if(tg.closest("[data-hoy]")){ st.dia = today(); return vistaHub(el, r); }
    if(tg.closest("[data-terminar]")){
      const hechos = [...el.querySelectorAll(".en-blocks input[data-b]:checked")].map(x => x.dataset.b).filter(Boolean);
      if(!el.querySelector(".en-blocks input[data-b]:checked") && !await confirmDlg(t("No marcaste ningún bloque. ¿Registrar la sesión igual?"), {ok: t("Registrar"), danger: false, title: t("Terminar sesión")})) return;
      E.terminar(ses, hechos); toast(t("¡Sesión registrada! Buen trabajo.")); return;
    }
    const u = tg.closest("[data-deshacer]"); if(u){ (await import("../store.js")).del("sesiones", u.dataset.deshacer); return; }
  };
  el.onchange = e => { if(e.target.dataset.k) E.marcar(e.target.dataset.k, e.target.checked); };
}

function bloque(b){
  const a = b.arte && E.arte(b.arte);
  const tag = a ? `<span class="en-tag" style="--c:${a.color}">${esc(t(a.corto))}</span>` : "";
  if(b.tipo === "video") return `<li class="en-b video"><span class="en-bmin">${icon("star")}</span><div><div class="en-bt">${tag}<span class="muted small">${t("Video del día")}</span></div>
    <a href="${esc(b.url)}" target="_blank" rel="noopener"><b>${esc(b.t)}</b></a><p>${esc(b.d)}</p>${chk(b.k, t("Visto"))}</div></li>`;
  const marca = b.k ? `<input type="checkbox" data-b="${esc(b.k)}" aria-label="${t("Hecho")}">` : `<input type="checkbox" data-b="" aria-label="${t("Hecho")}">`;
  return `<li class="en-b ${b.tipo}"><label class="en-bchk">${marca}<span class="box"></span></label><span class="en-bmin">${b.min}'</span><div>
    <div class="en-bt">${tag}${b.modT ? `<a class="muted small" href="#/entreno/${b.arte}/${b.mod}">${esc(b.modT)}</a>` : ""}${b.repaso ? `<span class="pill info">${t("Repaso")}</span>` : ""}</div>
    <b>${esc(t(b.t))}</b>${b.dosis ? ` <span class="en-dose">${esc(b.dosis)}</span>` : ""}<p>${esc(b.tipo === "drill" || b.tipo === "libre" ? b.d : t(b.d))}</p></div></li>`;
}

const rutinaTxt = r => `${r.dias.map(d => t(E.DIAS_C[d - 1])).join(", ")} · ${tn(r.min, "1 min", "{n} min")} · ${r.artes.map(a => t(E.arte(a)?.corto)).join(", ")}`;

function editarRutina(){
  const r = E.rutina() || {dias: [1, 3, 5], min: 60, artes: [], modo: "pareja"};
  const body = h(`<form class="form" novalidate>
    <div class="field"><span class="lbl">${t("¿Qué días entrenas?")}</span><div class="chips en-dias">${E.DIAS.map((d, i) => `<label class="chip"><input type="checkbox" name="dias" value="${i + 1}" ${r.dias.includes(i + 1) ? "checked" : ""}><span>${t(E.DIAS_C[i])}</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">${t("¿Cuánto tiempo por día?")}</span><div class="seg">${[30, 45, 60, 75, 90, 120].map(m => `<label><input type="radio" name="min" value="${m}" ${r.min === m ? "checked" : ""}><span>${m} min</span></label>`).join("")}</div></div>
    <div class="field"><span class="lbl">${t("¿Qué quieres entrenar?")}</span><div class="en-pick">${E.ARTES.map(a => `<label class="en-pk" style="--c:${a.color}"><input type="checkbox" name="artes" value="${a.id}" ${r.artes.includes(a.id) ? "checked" : ""}><span><b>${esc(t(a.nombre))}</b></span></label>`).join("")}</div>
      <small class="hint">${t("Con varias artes, se turnan entre tus días. Con sesiones de 90 minutos o más, se combinan dos por día.")}</small></div>
    <div class="field"><span class="lbl">${t("¿Con quién entrenas?")}</span><div class="seg"><label><input type="radio" name="modo" value="pareja" ${r.modo !== "solo" ? "checked" : ""}><span>${t("En academia o con compañero")}</span></label><label><input type="radio" name="modo" value="solo" ${r.modo === "solo" ? "checked" : ""}><span>${t("Solo")}</span></label></div>
      <small class="hint">${t("Si entrenas solo, la rutina usa solo drills que no necesitan compañero.")}</small></div>
  </form>`);
  const m = modal({title: t("Tu rutina"), body, foot: `${E.rutina() ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${t("Borrar rutina")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Guardar rutina")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = {dias: [...body.querySelectorAll("[name=dias]:checked")].map(x => +x.value), min: +(body.querySelector("[name=min]:checked")?.value || 60),
      artes: [...body.querySelectorAll("[name=artes]:checked")].map(x => x.value), modo: body.querySelector("[name=modo]:checked")?.value || "pareja"};
    if(!v.dias.length) return toast(t("Elige al menos un día"), "warn");
    if(!v.artes.length) return toast(t("Elige al menos un arte"), "warn");
    E.guardarRutina(v); st.dia = today(); m.close(); toast(t("Rutina guardada"));
  };
  m.foot.querySelector("[data-del]")?.addEventListener("click", async () => { if(await confirmDlg(t("Se borra la rutina. Tu progreso y tu historial se conservan."))){ (await import("../store.js")).del("rutinas", "mia"); m.close(); } });
}

/* ---------- camino de un arte ---------- */
function vistaArte(el, id){
  const a = E.arte(id), d = E.cargado(id), p = E.pctArte(d), act = E.moduloActual(d);
  el.innerHTML = `
  <a class="btn ghost small en-back" href="#/entreno">${icon("back")} ${t("Entrenamiento")}</a>
  ${esNota()}
  <section class="en-hero" style="--c:${a.color}">
    <div><span class="en-eye">${t("Camino de aprendizaje")}</span><h2>${esc(d.intro.titulo || a.nombre)}</h2><p>${esc(d.intro.sub || "")}</p></div>
    ${ring(p, 84, a.color)}
  </section>
  ${d.intro.reglas?.length ? `<div class="en-rules">${d.intro.reglas.map(x => `<div><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`).join("")}</div>` : ""}
  ${E.NIVELES.map(([k, n]) => { const ms = d.modulos.filter(m => m.nivel === k); if(!ms.length) return "";
    return `<h3 class="en-lvl"><span class="lvl ${k}">${t(n)}</span><span class="muted small">${tn(ms.length, "1 módulo", "{n} módulos")}</span></h3>
    <div class="en-mods">${ms.map(m => { const pm = E.pctMod(id, m);
      return `<a class="en-mod ${m === act ? "now" : ""} ${pm === 100 ? "full" : ""}" href="#/entreno/${id}/${m.id}" style="--c:${a.color}">
        <span class="en-mn">${String(m.n).padStart(2, "0")}</span><div class="en-mt"><b>${esc(m.titulo)}</b><span class="muted small">${esc(m.sub || "")}</span>
        <span class="small en-mc">${tn(m.conceptos.length, "1 concepto", "{n} conceptos")} · ${tn(m.drills.length, "1 drill", "{n} drills")} · ${tn(m.recursos.length, "1 video", "{n} videos")}</span></div>
        ${ring(pm, 44, a.color)}${m === act ? `<span class="en-now">${t("Vas aquí")}</span>` : ""}</a>`; }).join("")}</div>`; }).join("")}
  ${d.plan.length ? `<h3 class="en-lvl">${icon("calendar")} ${t("Plan sugerido")}</h3>
    <div class="en-phases">${d.plan.map(f => `<div class="en-ph" style="--c:${a.color}"><span class="en-eye">${esc(f.semanas)}</span><b>${esc(f.fase)}</b><p class="muted small">${esc(f.foco)}</p><ul>${f.puntos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>` : ""}
  ${d.semana.length ? `<h3 class="en-lvl">${icon("clock")} ${t("Clase tipo")}</h3><div class="card flush"><div class="list">${d.semana.map(b => `<div class="li"><span class="en-bmin wide">${esc(b.min)}</span><div class="li-main"><b>${esc(b.t)}</b><span class="muted small en-wrap">${esc(b.d)}</span></div></div>`).join("")}</div></div>` : ""}`;
  el.onclick = null; el.onchange = null;
}

/* ---------- un módulo ---------- */
function vistaModulo(el, id, modId){
  const a = E.arte(id), d = E.cargado(id), m = d.modulos.find(x => x.id === modId);
  if(!m){ location.hash = `#/entreno/${id}`; return; }
  const i = d.modulos.indexOf(m), prev = d.modulos[i - 1], next = d.modulos[i + 1];
  const plats = ["todas", ...Object.keys(PLAT).filter(k => m.recursos.some(r => r.plataforma === k))];
  if(!plats.includes(st.filtro)) st.filtro = "todas";
  const recs = m.recursos.filter(r => st.filtro === "todas" || r.plataforma === st.filtro);
  const yt = u => (u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
  el.innerHTML = `
  <a class="btn ghost small en-back" href="#/entreno/${id}">${icon("back")} ${esc(t(a.nombre))}</a>
  ${esNota()}
  <section class="en-hero sm" style="--c:${a.color}">
    <div><span class="en-eye">${t("Módulo {n}", {n: m.n})} · <span class="lvl ${m.nivel}">${nivelT(m.nivel)}</span></span><h2>${esc(m.titulo)}</h2><p>${esc(m.resumen || m.sub || "")}</p></div>
    <span data-ring>${ring(E.pctMod(id, m), 76, a.color)}</span>
  </section>

  <h3 class="en-sec">${t("Conceptos")}</h3>
  <div class="en-concepts">${m.conceptos.map((c, j) => `<details class="en-c" ${j === 0 ? "open" : ""}><summary><span class="en-ci" style="--c:${a.color}">${j + 1}</span><b>${esc(c.titulo)}</b>${icon("chevron", "chev")}</summary>
    <div class="en-cb"><p>${esc(c.explicacion)}</p><div class="en-cols">
      ${(c.puntos || c.puntos_clave)?.length ? `<div class="ok"><h4>${t("Claves")}</h4><ul>${(c.puntos || c.puntos_clave).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
      ${(c.errores || c.errores_comunes)?.length ? `<div class="bad"><h4>${t("Errores comunes")}</h4><ul>${(c.errores || c.errores_comunes).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div></div></details>`).join("")}</div>

  <h3 class="en-sec">${t("Drills")}</h3>
  <div class="en-drills">${m.drills.map((x, j) => { const k = E.kDrill(id, m.id, j); return `<div class="en-drill ${E.hecho(k) ? "done" : ""}">
    <div class="en-dh">${chk(k)}<b>${esc(x.nombre)}</b><span class="lvl ${x.nivel}">${nivelT(x.nivel)}</span></div>
    <p>${esc(x.como)}</p><div class="en-dm"><span class="en-dose">${icon("clock", "inline")} ${esc(x.dosis)}</span>${x.solo ? `<span class="muted small">${t("Se puede solo")}</span>` : `<span class="muted small">${t("Con compañero")}</span>`}</div></div>`; }).join("")}</div>

  ${m.recursos.length ? `<h3 class="en-sec">${t("Videos y cursos")} <span class="count-b">${m.recursos.length}</span></h3>
  ${plats.length > 2 ? `<div class="en-filter">${plats.map(k => `<button class="chip-btn ${st.filtro === k ? "on" : ""}" data-f="${k}">${k === "todas" ? t("Todas") : PLAT[k][0]}</button>`).join("")}</div>` : ""}
  <div class="en-res">${recs.map(r => { const k = E.kRec(id, r.url), v = r.plataforma === "youtube" && yt(r.url), [pn, pc] = PLAT[r.plataforma] || PLAT.web;
    return `<article class="en-r ${E.hecho(k) ? "done" : ""}"><a class="en-rm ${v ? "" : "noimg"}" href="${esc(r.url)}" target="_blank" rel="noopener" style="--pc:${pc}">
      ${v ? `<img loading="lazy" src="https://i.ytimg.com/vi/${v}/mqdefault.jpg" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">` : ""}<span class="en-rp">${esc(pn)}</span></a>
      <div class="en-rb"><a class="en-rt" href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.titulo)}</a>
      <span class="muted small">${esc(r.autor || "")}${r.idioma ? ` · ${r.idioma === "es" ? t("Español") : t("Inglés")}` : ""} · ${nivelT(r.nivel)}</span>
      <p>${esc(r.por_que || "")}</p>${chk(k, t("Visto"))}</div></article>`; }).join("")}</div>` : ""}

  ${m.hitos.length ? `<h3 class="en-sec">${t("Lo domino cuando…")}</h3><div class="en-hitos">${m.hitos.map((x, j) => chk(E.kHito(id, m.id, j), `<span>${esc(x)}</span>`, "row")).join("")}</div>` : ""}

  <div class="en-pager">${prev ? `<a class="btn ghost" href="#/entreno/${id}/${prev.id}">${icon("back")} ${esc(prev.titulo)}</a>` : "<span></span>"}${next ? `<a class="btn primary" href="#/entreno/${id}/${next.id}">${esc(next.titulo)} ${icon("chevron")}</a>` : ""}</div>`;

  el.onclick = e => { const f = e.target.closest("[data-f]"); if(f){ st.filtro = f.dataset.f; vistaModulo(el, id, modId); } };
  el.onchange = e => {
    const k = e.target.dataset.k; if(!k) return;
    E.marcar(k, e.target.checked);
    e.target.closest(".en-drill,.en-r")?.classList.toggle("done", e.target.checked);
  };
}
