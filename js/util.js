/* Utilidades generales: fechas, formato, ids y DOM. */

export const DAY = 864e5;

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const now = () => Date.now();
export const isObj = v => !!v && typeof v === "object" && !Array.isArray(v);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- fechas (siempre "AAAA-MM-DD" en hora local) ---------- */
const pad = n => String(n).padStart(2, "0");
export const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toISO(new Date());
export function parseISO(s){
  if(!s || typeof s !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if(!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3]);
}
export function addMonths(iso, n){
  const d = parseISO(iso) || new Date();
  const day = d.getDate();
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate();
  r.setDate(Math.min(day, last));
  return toISO(r);
}
export function addDays(iso, n){ const d = parseISO(iso) || new Date(); d.setDate(d.getDate() + n); return toISO(d); }
export function daysBetween(a, b){
  const x = parseISO(a), y = parseISO(b);
  if(!x || !y) return 0;
  return Math.round((y - x) / DAY);
}
/* meses completos (con decimales) entre dos fechas */
export function monthsBetween(a, b){
  const x = parseISO(a), y = parseISO(b);
  if(!x || !y) return 0;
  let m = (y.getFullYear() - x.getFullYear()) * 12 + (y.getMonth() - x.getMonth());
  const anchor = new Date(x.getFullYear(), x.getMonth() + m, x.getDate());
  if(anchor > y){ m--; }
  const base = new Date(x.getFullYear(), x.getMonth() + m, x.getDate());
  const next = new Date(x.getFullYear(), x.getMonth() + m + 1, x.getDate());
  return m + (y - base) / (next - base || 1);
}
export function age(birth){
  const b = parseISO(birth); if(!b) return null;
  const t = new Date();
  let a = t.getFullYear() - b.getFullYear();
  if(t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export function fmtDate(iso, long){
  const d = parseISO(iso); if(!d) return "—";
  return long ? `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}` : `${d.getDate()} ${MES[d.getMonth()]} ${d.getFullYear()}`;
}
export const fmtMonth = ym => { const [y, m] = ym.split("-"); return `${MES[+m - 1]} ${y.slice(2)}`; };
/* "1 año y 3 meses", "5 meses", "12 días" */
export function fmtDuration(fromISO, toISOd = today()){
  const days = daysBetween(fromISO, toISOd);
  if(days < 0) return "en el futuro";
  if(days < 31) return days === 1 ? "1 día" : `${days} días`;
  const m = Math.floor(monthsBetween(fromISO, toISOd));
  const y = Math.floor(m / 12), r = m % 12;
  const ys = y ? (y === 1 ? "1 año" : `${y} años`) : "";
  const ms = r ? (r === 1 ? "1 mes" : `${r} meses`) : "";
  return [ys, ms].filter(Boolean).join(" y ") || "0 meses";
}
export function fmtMonths(m){
  if(!m) return "sin mínimo";
  if(m < 12) return m === 1 ? "1 mes" : `${m} meses`;
  const y = Math.floor(m / 12), r = m % 12;
  return (y === 1 ? "1 año" : `${y} años`) + (r ? ` y ${r === 1 ? "1 mes" : r + " meses"}` : "");
}
export function relDays(n){
  if(n === 0) return "hoy";
  if(n === 1) return "mañana";
  if(n === -1) return "ayer";
  return n > 0 ? `en ${n} días` : `hace ${-n} días`;
}

/* ---------- formato ---------- */
export function money(v, cur = "COP"){
  const n = Number(v) || 0;
  try{ return new Intl.NumberFormat("es-CO", {style: "currency", currency: cur, maximumFractionDigits: cur === "COP" || cur === "CLP" ? 0 : 2}).format(n); }
  catch(e){ return "$" + Math.round(n).toLocaleString("es"); }
}
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
export const initials = name => String(name || "?").trim().split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase() || "?";
export const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
export function phoneDigits(p){ return String(p || "").replace(/[^\d+]/g, "").replace(/^\+/, ""); }
export function waLink(phone, text, cc = "57"){
  let d = phoneDigits(phone);
  if(!d) return null;
  if(d.length === 10 && cc) d = cc + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(text || "")}`;
}

/* ---------- DOM ---------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export function h(html){ const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; }
export function debounce(fn, ms){ let t = 0; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
export function download(name, text, type = "application/json"){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type}));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
export function csv(rows){
  return "﻿" + rows.map(r => r.map(c => { const s = String(c ?? ""); return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\n");
}
