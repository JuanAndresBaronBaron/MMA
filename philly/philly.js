/* Camino Philly Shell — sección privada (no enlazada desde la app).
   El código solo protege la vista: el contenido es estático y público en el repositorio. */
import {INTRO, MODULOS, PLAN, SEMANA, PLATAFORMAS} from "./data.js";

const HASH = "909061ef7a1149e83d9a0e1bfbec6844bebb87ad2314ff22d19a187b7522ec93";
const KEY_OK = "philly:ok", KEY_P = "philly:progreso", KEY_F = "philly:filtro";

const store = {
  get(k, d){ try{ const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch{ return d; } },
  set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch{} },
};
let prog = store.get(KEY_P, {});
let filtro = store.get(KEY_F, "todas");

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

async function sha(s){
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

/* ---------- utilidades ---------- */
const ytId = u => (u.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/) || [])[1];
const plat = r => PLATAFORMAS[r.plataforma] || PLATAFORMAS.web;
function itemsDe(m){
  return [...m.drills.map((_, i) => `d:${m.id}:${i}`), ...m.recursos.map(r => `r:${r.url}`), ...m.hitos.map((_, i) => `h:${m.id}:${i}`)];
}
function pct(keys){ return keys.length ? Math.round(keys.filter(k => prog[k]).length / keys.length * 100) : 0; }
const ring = (p, s = 56) => { const r = s / 2 - 5, c = 2 * Math.PI * r;
  return `<svg class="ring" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}"><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="ring-bg"/><circle cx="${s / 2}" cy="${s / 2}" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="50%" y="50%" dy=".35em" text-anchor="middle">${p}%</text></svg>`; };
const check = (k, label) => `<label class="chk"><input type="checkbox" data-k="${esc(k)}" ${prog[k] ? "checked" : ""}><span class="box"></span>${label ? `<span>${label}</span>` : ""}</label>`;
const NIVEL = {basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado"};

/* ---------- vistas ---------- */
function recurso(r){
  const p = plat(r), id = r.plataforma === "youtube" && ytId(r.url), k = `r:${r.url}`;
  return `<article class="res ${prog[k] ? "done" : ""}" data-plat="${esc(r.plataforma)}">
    <a class="res-media ${id ? "" : "noimg"}" href="${esc(r.url)}" target="_blank" rel="noopener" style="--pc:${p.color}">
      ${id ? `<img loading="lazy" src="https://i.ytimg.com/vi/${id}/mqdefault.jpg" alt="" onerror="this.parentNode.classList.add('noimg');this.remove()">` : ""}<span class="res-logo">${p.icon}</span>
      <span class="res-badge">${p.icon}${esc(p.nombre)}</span>${id ? `<span class="play">▶</span>` : ""}
    </a>
    <div class="res-body">
      <a href="${esc(r.url)}" target="_blank" rel="noopener" class="res-t">${esc(r.titulo)}</a>
      <span class="res-meta">${esc(r.autor || "")}${r.idioma ? ` · ${r.idioma === "es" ? "Español" : "Inglés"}` : ""}${r.nivel ? ` · ${NIVEL[r.nivel] || esc(r.nivel)}` : ""}</span>
      ${r.por_que ? `<p class="res-why">${esc(r.por_que)}</p>` : ""}
      <div class="res-foot">${check(k, "Visto")}</div>
    </div>
  </article>`;
}

function modulo(m){
  const keys = itemsDe(m), p = pct(keys);
  const recs = m.recursos.filter(r => filtro === "todas" || r.plataforma === filtro);
  return `<section class="mod" id="m-${m.id}">
    <header class="mod-h">
      <div class="mod-n">${String(m.n).padStart(2, "0")}</div>
      <div class="mod-tt"><span class="eyebrow">${esc(m.fase)}</span><h2>${esc(m.titulo)}</h2><p>${esc(m.sub)}</p></div>
      <div class="mod-p" data-ring="${m.id}">${ring(p)}</div>
    </header>
    <p class="lead">${esc(m.resumen)}</p>

    <h3 class="sec">Conceptos</h3>
    <div class="concepts">${m.conceptos.map((c, i) => `<details class="concept" ${i === 0 ? "open" : ""}>
      <summary><span class="c-i">${i + 1}</span><b>${esc(c.titulo)}</b><span class="chev">⌄</span></summary>
      <div class="c-body"><p>${esc(c.explicacion)}</p>
        <div class="c-cols">
          ${c.puntos?.length ? `<div class="c-col ok"><h4>Claves</h4><ul>${c.puntos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
          ${c.errores?.length ? `<div class="c-col bad"><h4>Errores comunes</h4><ul>${c.errores.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        </div></div>
    </details>`).join("")}</div>

    <h3 class="sec">Drills</h3>
    <div class="drills">${m.drills.map((d, i) => { const k = `d:${m.id}:${i}`; return `<div class="drill ${prog[k] ? "done" : ""}">
      <div class="drill-h">${check(k)}<b>${esc(d.nombre)}</b><span class="lvl ${esc(d.nivel)}">${NIVEL[d.nivel] || esc(d.nivel)}</span></div>
      <p>${esc(d.como)}</p><span class="dose">⏱ ${esc(d.dosis)}</span></div>`; }).join("")}</div>

    <h3 class="sec">Videos y cursos <span class="cnt">${recs.length}</span></h3>
    ${recs.length ? `<div class="res-grid">${recs.map(recurso).join("")}</div>` : `<p class="muted">No hay recursos de esta plataforma en este módulo.</p>`}

    <div class="hitos"><h3 class="sec">Lo domino cuando…</h3>${m.hitos.map((x, i) => check(`h:${m.id}:${i}`, esc(x))).join("")}</div>
  </section>`;
}

function render(){
  const all = MODULOS.flatMap(itemsDe), total = pct(all);
  const plats = ["todas", ...Object.keys(PLATAFORMAS).filter(k => MODULOS.some(m => m.recursos.some(r => r.plataforma === k)))];
  const nRec = MODULOS.reduce((s, m) => s + m.recursos.length, 0);
  app.innerHTML = `
  <header class="hero">
    <div class="hero-in">
      <span class="eyebrow gold">Camino de aprendizaje privado</span>
      <h1>${esc(INTRO.titulo)}</h1>
      <p class="hero-sub">${esc(INTRO.sub)}</p>
      <div class="hero-stats">
        <div>${ring(total, 76)}<span>Progreso total</span></div>
        <div><b>${MODULOS.length}</b><span>Módulos</span></div>
        <div><b>${MODULOS.reduce((s, m) => s + m.drills.length, 0)}</b><span>Drills</span></div>
        <div><b>${nRec}</b><span>Videos y cursos</span></div>
      </div>
    </div>
  </header>
  <nav class="toc" id="toc"><div class="toc-in">${MODULOS.map(m => `<a href="#m-${m.id}" data-id="${m.id}"><i>${m.n}</i>${esc(m.corto)}</a>`).join("")}<a href="#plan" data-id="plan"><i>★</i>Plan</a></div></nav>
  <main class="wrap">
    <section class="intro card">
      <h3 class="sec">Cómo usar este camino</h3>
      <div class="intro-grid">${INTRO.reglas.map(x => `<div class="rule"><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`).join("")}</div>
      <div class="filter"><span>Mostrar recursos de:</span>${plats.map(k => `<button class="fchip ${filtro === k ? "on" : ""}" data-f="${k}">${k === "todas" ? "Todas" : PLATAFORMAS[k].icon + " " + PLATAFORMAS[k].nombre}</button>`).join("")}</div>
    </section>
    ${MODULOS.map(modulo).join("")}
    <section class="mod" id="plan">
      <header class="mod-h"><div class="mod-n">★</div><div class="mod-tt"><span class="eyebrow">Programa</span><h2>Plan de 16 semanas</h2><p>Cómo encadenar los módulos en el gimnasio.</p></div></header>
      <div class="phases">${PLAN.map(f => `<div class="phase"><span class="ph-w">${esc(f.semanas)}</span><h3>${esc(f.fase)}</h3><p>${esc(f.foco)}</p><ul>${f.puntos.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>
      <h3 class="sec">Sesión tipo (60–75 min)</h3>
      <div class="session">${SEMANA.map(s => `<div class="blk"><span class="blk-t">${esc(s.min)}</span><div><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div></div>`).join("")}</div>
    </section>
    <footer class="foot"><p>Tu progreso se guarda en este navegador.</p><button class="btn ghost" data-reset>Reiniciar progreso</button> <button class="btn ghost" data-lock>Cerrar sesión</button></footer>
  </main>`;
  spy();
}

/* ---------- eventos ---------- */
document.addEventListener("change", e => {
  const k = e.target.dataset?.k; if(!k) return;
  if(e.target.checked) prog[k] = Date.now(); else delete prog[k];
  store.set(KEY_P, prog);
  e.target.closest(".res,.drill")?.classList.toggle("done", e.target.checked);
  const mod = e.target.closest(".mod"); const m = mod && MODULOS.find(x => "m-" + x.id === mod.id);
  if(m) mod.querySelector(`[data-ring="${m.id}"]`).innerHTML = ring(pct(itemsDe(m)));
  const hs = app.querySelector(".hero-stats > div"); if(hs) hs.innerHTML = ring(pct(MODULOS.flatMap(itemsDe)), 76) + "<span>Progreso total</span>";
});
document.addEventListener("click", e => {
  const f = e.target.closest("[data-f]");
  if(f){ filtro = f.dataset.f; store.set(KEY_F, filtro); const y = scrollY; render(); scrollTo(0, y); return; }
  if(e.target.closest("[data-reset]") && confirm("¿Borrar todo tu progreso?")){ prog = {}; store.set(KEY_P, prog); render(); }
  if(e.target.closest("[data-lock]")){ localStorage.removeItem(KEY_OK); location.reload(); }
});

let io;
function spy(){
  io?.disconnect();
  const links = [...app.querySelectorAll(".toc a")];
  io = new IntersectionObserver(es => es.forEach(en => { if(en.isIntersecting){
    const id = en.target.id.replace(/^m-/, "");
    links.forEach(a => a.classList.toggle("on", a.dataset.id === id));
    const toc = app.querySelector(".toc-in"), a = toc.querySelector("a.on");
    if(a) toc.scrollTo({left: a.offsetLeft - toc.clientWidth / 2 + a.clientWidth / 2, behavior: "smooth"});
  } }), {rootMargin: "-45% 0px -50% 0px"});
  app.querySelectorAll(".mod").forEach(s => io.observe(s));
}

/* ---------- acceso ---------- */
const gate = document.getElementById("gate"), app = document.getElementById("app");
async function tryCode(c){ return (await sha(c.trim().toUpperCase().replace(/\s+/g, ""))) === HASH; }
function unlock(){ gate.remove(); app.hidden = false; render(); }
if(store.get(KEY_OK, "") === HASH) unlock();
else document.getElementById("gateForm").onsubmit = async e => {
  e.preventDefault();
  const inp = document.getElementById("code");
  if(await tryCode(inp.value)){ store.set(KEY_OK, HASH); unlock(); }
  else{ document.getElementById("gateErr").hidden = false; inp.select(); gate.querySelector(".gate-box").animate([{transform: "translateX(0)"}, {transform: "translateX(-8px)"}, {transform: "translateX(8px)"}, {transform: "translateX(0)"}], {duration: 260}); }
};
