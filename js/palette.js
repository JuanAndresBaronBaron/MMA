/* Buscador global (Ctrl/Cmd+K o «/») y atajos de teclado. Busca alumnos, pagos, prospectos, técnicas, glosario y acciones. */
import * as S from "./store.js";
import {icon, modal, avatar, toast} from "./ui.js";
import {esc, norm, money, fmtDate, $} from "./util.js";
import {t, lang} from "./i18n.js";
import {estadoEf} from "./cobros.js";

let ROUTES = {}, open = null, gWait = 0;
const go = h => { location.hash = h; };

/* ---------- coincidencia ---------- */
/* todas las palabras deben aparecer; puntúa más si están al inicio de una palabra. Si no, prueba letras en orden. */
function score(hay, q, fuzzy){
  if(!q) return 1;
  const H = norm(hay), toks = q.split(/\s+/).filter(Boolean);
  let s = 0;
  for(const k of toks){
    const i = H.indexOf(k);
    if(i < 0){ s = -1; break; }
    s += (i === 0 ? 30 : /[\s·\-(/]/.test(H[i - 1]) ? 20 : 8) + Math.min(k.length, 8);
  }
  if(s > 0) return s - Math.min(H.length, 80) / 40;
  if(!fuzzy) return -1;
  /* letras en orden (p. ej. «jprz» → «Juan Pérez») */
  const c = q.replace(/\s+/g, "");
  let j = 0; for(const ch of H){ if(ch === c[j]) j++; if(j === c.length) break; }
  return c.length >= 3 && j === c.length ? 2 : -1;
}
/* resalta la primera palabra buscada en el texto (sin romper el escape) */
function mark(txt, q){
  const s = String(txt || ""); if(!q) return esc(s);
  const k = q.split(/\s+/).filter(Boolean)[0]; if(!k) return esc(s);
  const N = norm(s), i = N.indexOf(k);
  if(i < 0 || N.length !== s.length) return esc(s);
  return esc(s.slice(0, i)) + "<mark>" + esc(s.slice(i, i + k.length)) + "</mark>" + esc(s.slice(i + k.length));
}

/* ---------- fuentes ---------- */
let tecIdx = null, gloIdx = null;
function cargarTecnicas(){
  if(tecIdx) return tecIdx;
  tecIdx = import("./entreno/index.js").then(async E => {
    const out = [];
    await Promise.all(E.ARTES.map(a => E.cargar(a.id).then(d => {
      for(const m of d.modulos || []){
        const href = `#/entreno/${a.id}/${m.id}`;
        out.push({g: "tec", ic: "fist", label: m.titulo, sub: `${t(a.corto || a.nombre)} · ${t("Módulo {n}", {n: m.n})}`, href, hay: m.titulo});
        for(const d2 of m.drills || []) out.push({g: "tec", ic: "target", label: d2.nombre, sub: `${t(a.corto || a.nombre)} · ${m.titulo}`, href, hay: d2.nombre, w: -4});
      }
    }).catch(() => {})));
    return out;
  }).catch(() => []);
  return tecIdx;
}
function cargarGlosario(){
  if(gloIdx) return gloIdx;
  gloIdx = import("./entreno/glosario.js").then(m => (m.GLOSARIO || []).map(x => ({g: "glo", ic: "book",
    label: lang() === "en" && x.en ? `${x.t} · ${x.en}` : x.t, sub: x.d, hay: [x.t, x.en, x.orig].filter(Boolean).join(" "),
    href: `#/entreno/glosario?q=${encodeURIComponent(x.t)}`}))).catch(() => []);
  return gloIdx;
}
const pagoAlumno = () => ({g: "acc", ic: "cash", label: t("Registrar pago a…"), sub: t("Elige el alumno"), hay: "registrar pago cobrar mensualidad abono", mode: "pago"});
function acciones(){
  const A = [
    {ic: "check", label: t("Pasar lista"), hay: "pasar lista asistencia clase", href: "#/asistencia"},
    {ic: "userPlus", label: t("Nuevo alumno"), hay: "nuevo alumno agregar inscribir matricular", href: "#/alumnos?new=1", key: "N"},
    pagoAlumno(),
    {ic: "clock", label: t("Horario"), hay: "horario clases semana", href: "#/horario", key: "H"},
    {ic: "tablet", label: t("Modo kiosco"), hay: "modo kiosco tablet recepcion check-in registro", href: "#/kiosko"},
    {ic: "whatsapp", label: t("Mensaje masivo"), hay: "mensaje masivo difusion whatsapp todos recordatorio", fn: () => import("./difusion.js").then(m => m.openDifusion()).catch(() => toast(t("Esta sección no está disponible"), "warn"))},
    {ic: "userPlus", label: t("Nuevo prospecto"), hay: "nuevo prospecto lead interesado clase de prueba", href: "#/leads?nuevo=1"},
    {ic: "keyboard", label: t("Atajos de teclado"), hay: "atajos teclado ayuda shortcuts", fn: ayuda},
  ].map(x => ({g: "acc", ...x}));
  for(const [k, r] of Object.entries(ROUTES)) if(!r.hidden) A.push({g: "ir", ic: r.ic, label: t("Ir a {x}", {x: t(r.t)}), hay: `ir a ${t(r.t)} ${r.t}`, href: "#/" + k, w: -2});
  return A;
}
function alumnosIdx(){
  return S.inAcad("alumnos").map(a => ({g: "al", al: a, label: a.nombre, sub: [a.documento, a.telefono, estadoEf(a) !== "activo" ? t(estadoEf(a) === "congelado" ? "Congelado" : "Inactivo") : ""].filter(Boolean).join(" · "),
    hay: [a.nombre, a.documento, a.telefono, String(a.telefono || "").replace(/\D/g, "")].filter(Boolean).join(" "), href: "#/alumno/" + a.id, w: estadoEf(a) === "activo" ? 2 : 0}));
}
function pagosIdx(){
  const al = new Map(S.inAcad("alumnos").map(a => [a.id, a]));
  const cur = S.academy()?.moneda || "COP";
  return S.all("pagos").filter(p => al.has(p.alumnoId)).sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "") || b._c - a._c).slice(0, 200).map(p => {
    const a = al.get(p.alumnoId), n = p.num ? String(p.num).padStart(6, "0") : "";
    return {g: "pag", ic: "receipt", label: `${a.nombre} · ${money(p.monto, cur)}`, sub: [n && t("Recibo N.º {n}", {n}), fmtDate(p.fecha), t(p.concepto || "")].filter(Boolean).join(" · "),
      hay: [a.nombre, p.num, n, p.concepto].filter(Boolean).join(" "), href: "#/recibo/" + p.id};
  });
}
function leadsIdx(){
  return S.inAcad("leads").map(l => ({g: "lead", ic: "userPlus", label: l.nombre || t("Sin nombre"), sub: [t(ETAPA[l.etapa] || l.etapa || ""), l.telefono].filter(Boolean).join(" · "),
    hay: [l.nombre, l.telefono, l.email].filter(Boolean).join(" "), href: "#/leads?lead=" + l.id}));
}
const ETAPA = {nuevo: "Nuevo", contactado: "Contactado", prueba: "Clase de prueba", inscrito: "Inscrito", perdido: "Perdido"};
const GRUPOS = [["acc", "Acciones"], ["al", "Alumnos"], ["pag", "Pagos"], ["lead", "Prospectos"], ["tec", "Técnicas"], ["glo", "Glosario"], ["ir", "Ir a"]];
const MAX = {al: 8, pag: 5, lead: 5, tec: 6, glo: 5, acc: 6, ir: 6};

/* ---------- paleta ---------- */
export function openPalette(initial = ""){
  if(open){ open.input.focus(); return; }
  if(!S.academy() || !document.querySelector(".app")) return;
  const body = `<div class="pal-in">${icon("search")}<input type="search" id="palQ" autocomplete="off" spellcheck="false" enterkeyhint="go" placeholder="${esc(t("Busca alumnos, pagos, técnicas o acciones…"))}" aria-label="${esc(t("Buscar"))}" role="combobox" aria-expanded="true" aria-controls="palList" aria-autocomplete="list"><kbd class="hide-s">Esc</kbd></div>
    <div class="pal-list" id="palList" role="listbox" aria-label="${esc(t("Resultados"))}"></div>
    <div class="pal-foot"><span><span class="kbd">↑</span> <span class="kbd">↓</span> ${t("moverse")}</span><span><span class="kbd">Enter</span> ${t("abrir")}</span><span><span class="kbd">Esc</span> ${t("cerrar")}</span><span><span class="kbd">?</span> ${t("atajos")}</span></div>`;
  const m = modal({title: t("Buscar"), body, foot: false, cls: "pal", onClose: () => { open = null; }});
  m.el.classList.add("pal-back");
  const input = m.el.querySelector("#palQ"), list = m.el.querySelector("#palList");
  let mode = null, sel = 0, items = [], extra = {tec: [], glo: []};
  const base = {al: alumnosIdx(), pag: pagosIdx(), lead: leadsIdx(), acc: acciones()};
  const paint = () => {
    const q = norm(input.value.trim());
    let pool;
    if(mode === "pago") pool = base.al.filter(x => x.al.estado !== "inactivo").map(x => ({...x, g: "al", ic: null, pay: true}));
    else pool = q ? [...base.acc, ...base.al, ...base.pag, ...base.lead, ...extra.tec, ...extra.glo] : base.acc.filter(x => x.g === "acc").concat(base.acc.filter(x => x.g === "ir"));
    const by = {};
    for(const x of pool){
      const s = score(x.hay || x.label, q, x.g === "al"); if(s < 0) continue;
      (by[x.g] = by[x.g] || []).push({...x, s: s + (x.w || 0)});
    }
    items = [];
    let html = "";
    if(mode === "pago") html += `<div class="pal-g">${t("Registrar pago a…")}</div>`;
    for(const a of Object.values(by)) a.sort((x, y) => y.s - x.s);
    /* con texto, los grupos van por su mejor resultado (un alumno exacto sube por encima de las acciones) */
    const orden = q ? [...GRUPOS].sort((a, b) => ((by[b[0]] || [])[0]?.s || -1) - ((by[a[0]] || [])[0]?.s || -1)) : GRUPOS;
    for(const [g, n] of orden){
      const arr = (by[g] || []).slice(0, mode === "pago" ? 12 : MAX[g]);
      if(!arr.length) continue;
      if(mode !== "pago") html += `<div class="pal-g" id="pg-${g}">${t(n)}</div>`;
      for(const x of arr){
        const i = items.push(x) - 1;
        const lead = x.al ? avatar(x.al, 32) : `<span class="li-ic">${icon(x.ic)}</span>`;
        html += `<button type="button" class="pal-it" role="option" id="pi-${i}" data-i="${i}" aria-selected="false">${lead}<span><b>${mark(x.label, q)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ""}</span>${x.key ? `<span class="kbd hide-s">${x.key}</span>` : x.mode ? icon("chevron") : ""}</button>`;
      }
    }
    list.innerHTML = html || `<div class="pal-empty">${q ? t("Nada coincide con «{q}»", {q: esc(input.value.trim())}) : ""}</div>`;
    sel = Math.min(sel, Math.max(0, items.length - 1));
    hi();
  };
  const hi = () => {
    for(const b of list.querySelectorAll(".pal-it")){ const on = +b.dataset.i === sel; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); }
    const b = list.querySelector(`#pi-${sel}`);
    if(b){ input.setAttribute("aria-activedescendant", b.id); b.scrollIntoView({block: "nearest"}); }
  };
  const pick = i => {
    const x = items[i]; if(!x) return;
    if(x.mode === "pago"){ mode = "pago"; input.value = ""; input.placeholder = t("Nombre del alumno…"); sel = 0; paint(); input.focus(); return; }
    m.close();
    if(x.pay) return import("./forms.js").then(F => (F.quickPay || F.paymentModal)(x.al)).catch(() => go("#/alumno/" + x.al.id));
    if(x.fn) return setTimeout(x.fn, 220);
    if(x.href) go(x.href);
  };
  input.addEventListener("input", () => {
    sel = 0; paint();
    /* técnicas y glosario se cargan la primera vez que se escribe */
    if(input.value.trim() && !extra.loaded){
      extra.loaded = true;
      Promise.all([cargarTecnicas(), cargarGlosario()]).then(([a, b]) => { extra.tec = a; extra.glo = b; if(open) paint(); });
    }
  });
  input.addEventListener("keydown", e => {
    if(e.key === "ArrowDown"){ e.preventDefault(); sel = items.length ? (sel + 1) % items.length : 0; hi(); }
    else if(e.key === "ArrowUp"){ e.preventDefault(); sel = items.length ? (sel - 1 + items.length) % items.length : 0; hi(); }
    else if(e.key === "Enter"){ e.preventDefault(); pick(sel); }
    else if(e.key === "Backspace" && !input.value && mode){ mode = null; input.placeholder = t("Busca alumnos, pagos, técnicas o acciones…"); paint(); }
  });
  list.addEventListener("click", e => { const b = e.target.closest(".pal-it"); if(b) pick(+b.dataset.i); });
  list.addEventListener("mousemove", e => { const b = e.target.closest(".pal-it"); if(b && +b.dataset.i !== sel){ sel = +b.dataset.i; hi(); } });
  open = {m, input};
  input.value = initial;
  paint();
  input.focus();
  if(initial) input.dispatchEvent(new Event("input"));
}

/* ---------- ayuda de atajos ---------- */
function ayuda(){
  const K = [["Ctrl K", t("Buscar")], ["/", t("Buscar")], ["N", t("Nuevo alumno")], ["A", t("Asistencia")], ["P", t("Pagos")], ["H", t("Horario")], ["E", t("Entrenamiento")],
    ["G I", t("Ir a {x}", {x: t("Inicio")})], ["G A", t("Ir a {x}", {x: t("Alumnos")})], ["G P", t("Ir a {x}", {x: t("Pagos")})], ["?", t("Atajos de teclado")], ["Esc", t("Cerrar")]];
  modal({title: t("Atajos de teclado"), body: `<div class="keys">${K.map(([k, d]) => `<span class="kbd">${k.split(" ").map(esc).join(" + ")}</span><span>${esc(d)}</span>`).join("")}</div>
    <p class="muted small">${t("Los atajos funcionan cuando no estás escribiendo en un campo.")}</p>`, foot: false});
}

/* ---------- atajos ---------- */
const enCampo = el => !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
function onKey(e){
  if(!S.academy() || !document.querySelector(".app")) return;
  const k = e.key;
  if((e.ctrlKey || e.metaKey) && !e.altKey && (k === "k" || k === "K")){
    if(document.body.classList.contains("bare")) return;
    e.preventDefault();
    if(open) open.m.close(); else openPalette();
    return;
  }
  if(e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
  if(enCampo(document.activeElement) || document.querySelector(".modal-back") || document.body.classList.contains("bare")) return;
  const now = Date.now();
  if(gWait && now - gWait < 1200){
    gWait = 0;
    const to = {i: "#/inicio", a: "#/alumnos", p: "#/pagos", h: "#/horario", g: "#/grados", e: "#/entreno", r: "#/reportes"}[k.toLowerCase()];
    if(to){ e.preventDefault(); go(to); }
    return;
  }
  const map = {n: "#/alumnos?new=1", a: "#/asistencia", p: "#/pagos", h: "#/horario", e: "#/entreno"};
  if(k === "/"){ e.preventDefault(); openPalette(); }
  else if(k === "?"){ e.preventDefault(); ayuda(); }
  else if(k === "g" || k === "G"){ gWait = now; }
  else if(map[k.toLowerCase()] && k.length === 1){ e.preventDefault(); go(map[k.toLowerCase()]); }
}
let bound = false;
export function initPalette({routes} = {}){
  ROUTES = routes || ROUTES;
  if(bound) return; bound = true;
  document.addEventListener("keydown", onKey);
}
export {ayuda as atajos};
