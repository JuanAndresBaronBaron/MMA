/* Piezas de la estructura que usan las vistas (tema, logo, icono de Google, crear academia). Sin efectos al importar. */
import * as S from "./store.js";
import {modal, field, formValues, toast} from "./ui.js";
import {h} from "./util.js";
import {DISCIPLINE_PRESETS, cloneRanks, DISC_COLORS, CURRENCIES} from "./catalog.js";
import {t} from "./i18n.js";

/* ---------- tema: "system" (por defecto), "light" o "dark" ---------- */
const mq = () => window.matchMedia ? matchMedia("(prefers-color-scheme: light)") : null;
export const themePref = () => { const p = S.pref("theme", "system"); return p === "light" || p === "dark" ? p : "system"; };
export const themeNow = () => { const p = themePref(); return p !== "system" ? p : mq()?.matches ? "light" : "dark"; };
export function applyTheme(){
  const th = themeNow();
  document.documentElement.dataset.theme = th;
  document.querySelector("meta[name=theme-color]")?.setAttribute("content", th === "dark" ? "#0b0d12" : "#f4f5f8");
}
export function setTheme(p){ S.setPref("theme", p); applyTheme(); }
export function toggleTheme(){ setTheme(themeNow() === "dark" ? "light" : "dark"); }
/* si sigue al sistema, cambia en vivo */
let mqBound = false;
export function watchSystemTheme(){
  const m = mq(); if(!m || mqBound) return;
  mqBound = true;
  const fn = () => { if(themePref() === "system") applyTheme(); };
  m.addEventListener ? m.addEventListener("change", fn) : m.addListener && m.addListener(fn);
}

let lgN = 0;
export const logo = (s = 38, g = "lg" + (++lgN)) => `<svg class="logo" width="${s}" height="${s}" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff3b3b"/><stop offset="1" stop-color="#b3001b"/></linearGradient></defs><path d="M24 3 42 10v13c0 11-7.6 19-18 22C13.6 42 6 34 6 23V10z" fill="url(#${g})"/><path d="M14 22h20v5H14z" fill="#111"/><path d="M21 20.5h6v8h-6z" fill="#111" stroke="#fff" stroke-width="1.2"/><path d="m22.5 28.5-2 7M25.5 28.5l2 7" stroke="#111" stroke-width="2.6" stroke-linecap="round"/><path d="M30 22.5h3v4h-3z" fill="#fff"/></svg>`;
export const gIcon = () => `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

/* app.js registra aquí su render() para no importarlo en círculo */
let renderFn = () => {};
export const setRenderer = fn => { renderFn = fn; };

export function createAcademy(onDone){
  const body = h(`<form class="form" novalidate>
    ${field({k: "nombre", label: t("Nombre de la academia"), req: true, ph: t("Ej: Team Bravo MMA")})}
    ${field({k: "ciudad", label: t("Ciudad"), half: true})}
    ${field({k: "moneda", label: t("Moneda"), type: "select", opts: CURRENCIES, half: true}, "COP")}
    ${field({k: "sede", label: t("Primera sede"), half: true, def: t("Sede principal")})}
    ${field({k: "valorMensual", label: t("Mensualidad por defecto"), type: "number", half: true, ph: t("Ej: 150000")})}
    ${field({k: "discs", label: t("¿Qué enseñan? (luego puedes cambiarlo)"), type: "chips", opts: DISCIPLINE_PRESETS.map(p => [p.nombre, t(p.nombre)])}, ["Brazilian Jiu-Jitsu", "MMA", "Muay Thai"])}
  </form>`);
  const m = modal({title: t("Crea tu academia"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Crear academia")}</button>`});
  const save = () => {
    const v = formValues(body);
    if(!v.nombre){ toast(t("Escribe el nombre de la academia"), "warn"); body.querySelector("[name=nombre]")?.focus(); return; }
    const a = S.put("academias", {nombre: v.nombre, ciudad: v.ciudad, moneda: v.moneda || "COP", valorMensual: v.valorMensual || 0, avisoDias: 5});
    S.setPref("academia", a.id);
    const s = S.put("sedes", {academiaId: a.id, nombre: v.sede || t("Sede principal"), ciudad: v.ciudad});
    (v.discs || []).forEach((n, i) => {
      const p = DISCIPLINE_PRESETS.find(x => x.nombre === n);
      S.put("disciplinas", {academiaId: a.id, nombre: p.nombre, sistema: p.sistema, ranks: cloneRanks(p.sistema), sedeIds: [s.id], color: DISC_COLORS[i % DISC_COLORS.length], orden: i});
    });
    m.close();
    location.hash = "#/inicio";
    document.body.innerHTML = "";
    renderFn();
    toast(t("¡Academia creada! Ahora agrega tus alumnos."));
    onDone && onDone(a);
  };
  m.foot.querySelector("[data-save]").onclick = save;
  body.addEventListener("submit", e => { e.preventDefault(); save(); });
}
