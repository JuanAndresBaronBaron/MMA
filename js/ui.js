/* Piezas de interfaz: iconos, modales, avisos, cinturones, avatares y formularios. */
import {esc, initials, h, $, $$} from "./util.js";
import * as S from "./store.js";
import {t, tn} from "./i18n.js";

/* ---------- iconos (trazo 2, 24×24) ---------- */
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="7" r="2.7"/><path d="M16.5 13.2c2.6.2 4.4 1.9 5 4.8"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.8"/><path d="M6 9.5v.01M18 14.5v.01"/>',
  belt: '<path d="M2 10h20v4H2z"/><path d="M10 9h4v6h-4z"/><path d="m11 15-2 6M13 15l2 6"/>',
  trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v4M8 21h8M9.5 18h5"/>',
  check: '<path d="m4.5 12.5 5 5L19.5 7"/>',
  calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>',
  building: '<path d="M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16"/><path d="M15 9h4a1 1 0 0 1 1 1v11"/><path d="M8 8h3M8 12h3M8 16h3M3 21h18"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  whatsapp: '<path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/><path d="M9 9.5c.3 2.3 2.2 4.2 4.5 4.5l1-1.2 1.8.8-.3 1.6c-3.6.3-7.4-3.5-7.1-7.1l1.6-.3.8 1.8z"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.01"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-1 9z"/>',
  cloudOff: '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 1.5-2.5M11 5.2A6 6 0 0 1 18 9a4.5 4.5 0 0 1 2.6 7.5M17 18H7"/><path d="m3 3 18 18"/>',
  sync: '<path d="M20 12a8 8 0 0 1-14 5.3M4 12a8 8 0 0 1 14-5.3"/><path d="M18 3v4h-4M6 21v-4h4"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  back: '<path d="m15 6-6 6 6 6"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 16V5M7 10l5-5 5 5M5 20h14"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8c-1-3-5-4-5-1.5S12 8 12 8zM12 8c1-3 5-4 5-1.5S12 8 12 8z"/>',
  bag: '<path d="M5 8h14l-1 13H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  cake: '<path d="M4 21h16v-8H4zM4 16c2 1.5 4-1.5 6 0s4-1.5 6 0 4 0 4 0M12 13V9M12 6v.01"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  medal: '<circle cx="12" cy="15" r="5.5"/><path d="M8.5 10.5 6 3h4l2 4 2-4h4l-2.5 7.5"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  map: '<path d="M12 21s7-6.2 7-11.5a7 7 0 0 0-14 0C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  heart: '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 8 2.5C20 15.3 12 20 12 20z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  fist: '<path d="M7 11V7.5a1.5 1.5 0 0 1 3 0V11M10 10V6.5a1.5 1.5 0 0 1 3 0V10M13 10V7a1.5 1.5 0 0 1 3 0v3.5M16 10a1.5 1.5 0 0 1 3 0v3.5c0 4-2.5 7.5-6.5 7.5H11a5 5 0 0 1-5-5v-2.5A1.5 1.5 0 0 1 7.5 11H10a2 2 0 0 1 0 4H8.5"/>',
};
export const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || P.info}</svg>`;

/* ---------- cinturón ---------- */
export function belt(disc, rankIdx, grado = 0, opts = {}){
  const r = S.rankDef(disc, rankIdx);
  const w = opts.w || 120, hh = opts.h || 22;
  const tipW = Math.round(w * 0.3), tipX = w - tipW - Math.round(w * 0.08);
  const tip = r.tip || (r.c === "#111111" ? "#c1121f" : "#111111");
  const maxG = Math.max(r.g || 0, grado || 0);
  const sw = Math.max(3, Math.min(6, Math.floor(tipW / (maxG * 1.8 + 1.2) || 5)));
  const gap = maxG ? (tipW - sw * maxG) / (maxG + 1) : 0;
  let stripes = "";
  for(let i = 0; i < (grado || 0); i++){
    const x = tipX + gap * (i + 1) + sw * i;
    stripes += `<rect x="${x.toFixed(1)}" y="2" width="${sw}" height="${hh - 4}" fill="#fff"/>`;
  }
  let mid = "";
  if(r.c2 && r.stripes){
    const n = 6, sw2 = (tipX) / (n * 2);
    for(let i = 0; i < n; i++) mid += `<rect x="${(i * 2 + 1) * sw2}" y="0" width="${sw2}" height="${hh}" fill="${r.c2}"/>`;
  }else if(r.c2) mid = `<rect x="0" y="${hh * 0.36}" width="${w}" height="${hh * 0.28}" fill="${r.c2}"/>`;
  const light = ["#f4f4f4", "#ffffff"].includes(r.c);
  const hasTip = r.g > 0 || grado > 0 || opts.tip;
  return `<svg class="belt" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" role="img" aria-label="${esc(t(r.n))}${grado ? " " + esc(tn(grado, "1 grado", "{n} grados")) : ""}">
    <rect x="0" y="0" width="${w}" height="${hh}" rx="3" fill="${r.c}" ${light ? 'stroke="#cfcfcf" stroke-width="1"' : ""}/>
    ${mid}
    ${hasTip ? `<rect x="${tipX}" y="0" width="${tipW}" height="${hh}" fill="${tip}"/>${stripes}` : ""}
    <rect x="0" y="0" width="${w}" height="${hh}" rx="3" fill="url(#beltShade)"/>
  </svg>`;
}
export const beltDefs = `<svg width="0" height="0" style="position:absolute"><defs><linearGradient id="beltShade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient></defs></svg>`;
export function rankLabel(disc, g){
  if(!g) return t("Sin grado");
  const r = S.rankDef(disc, g.rank);
  return t(r.n) + (g.grado ? " · " + (disc.ranks[g.rank]?.g ? tn(g.grado, "1° grado", "{n}° grado") : t("{n}° dan", {n: g.grado})) : "");
}

/* ---------- avatar ---------- */
const AV = ["#e11d48", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#db2777", "#4f46e5"];
export function avatar(al, size = 40, cls = ""){
  const f = al && S.foto(al.id);
  const col = AV[[...String(al?.id || "x")].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
  return `<span class="avatar ${cls}" data-av="${esc(al?.id || "")}" style="--s:${size}px;--c:${col}">${f ? `<img src="${f}" alt="" loading="lazy">` : `<span>${esc(initials(al?.nombre))}</span>`}</span>`;
}
/* actualizar avatares cuando llega una foto */
window.addEventListener("mma:foto", e => {
  const id = e.detail.id, f = S.foto(id);
  for(const el of $$(`[data-av="${CSS.escape(id)}"]`)){
    const al = S.get("alumnos", id);
    el.innerHTML = f ? `<img src="${f}" alt="">` : `<span>${esc(initials(al?.nombre))}</span>`;
  }
});

/* ---------- foto: recortar a cuadrado y comprimir ---------- */
export function pickPhoto(){
  return new Promise(res => {
    const inp = document.createElement("input");
    inp.type = "file"; inp.accept = "image/*";
    inp.onchange = () => { const f = inp.files && inp.files[0]; if(!f) return res(null); compress(f).then(res, () => { toast(t("No se pudo leer la imagen"), "error"); res(null); }); };
    inp.click();
  });
}
function compress(file, size = 360){
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height), c = document.createElement("canvas");
      c.width = c.height = size;
      const x = c.getContext("2d");
      x.imageSmoothingQuality = "high";
      x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      res(c.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(); };
    img.src = url;
  });
}

/* ---------- avisos ---------- */
export function toast(msg, kind = "ok", action){
  let host = $("#toasts");
  const el = h(`<div class="toast ${kind}" role="status">${icon(kind === "error" ? "alert" : kind === "warn" ? "alert" : "check")}<span>${esc(msg)}</span>${action ? `<button class="btn-link">${esc(action.label)}</button>` : ""}</div>`);
  if(action) el.querySelector("button").onclick = () => { action.fn(); el.remove(); };
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  setTimeout(() => { el.classList.remove("in"); setTimeout(() => el.remove(), 300); }, action ? 6000 : 3200);
}

/* ---------- modal ---------- */
let modalStack = [];
export function modal({title, body, foot, wide, onClose, cls = ""}){
  const el = h(`<div class="modal-back"><div class="modal ${wide ? "wide" : ""} ${cls}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="modal-h"><h2>${esc(title)}</h2><button class="icon-btn" data-close aria-label="${t("Cerrar")}">${icon("x")}</button></header>
    <div class="modal-b"></div>${foot !== false ? `<footer class="modal-f"></footer>` : ""}</div></div>`);
  const b = el.querySelector(".modal-b");
  if(typeof body === "string") b.innerHTML = body; else if(body) b.appendChild(body);
  if(foot && typeof foot === "string") el.querySelector(".modal-f").innerHTML = foot;
  const close = () => { el.classList.remove("in"); el.classList.add("closing"); setTimeout(() => { el.remove(); window.dispatchEvent(new Event("mma:modal")); }, 200); modalStack = modalStack.filter(m => m !== api); onClose && onClose(); };
  el.addEventListener("click", e => { if(e.target === el || e.target.closest("[data-close]")) close(); });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  const api = {el, body: b, foot: el.querySelector(".modal-f"), close};
  modalStack.push(api);
  setTimeout(() => { const f = b.querySelector("input:not([type=hidden]):not([type=checkbox]),select,textarea"); if(f && matchMedia("(pointer:fine)").matches) f.focus(); }, 60);
  return api;
}
document.addEventListener("keydown", e => { if(e.key === "Escape" && modalStack.length) modalStack[modalStack.length - 1].close(); });
export function confirmDlg(msg, {ok = t("Eliminar"), danger = true, title = t("¿Seguro?")} = {}){
  return new Promise(res => {
    let done = false;
    const m = modal({title, body: `<p class="muted">${esc(msg)}</p>`,
      foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn ${danger ? "danger" : "primary"}" data-ok>${esc(ok)}</button>`,
      onClose: () => { if(!done) res(false); }});
    m.foot.querySelector("[data-ok]").onclick = () => { done = true; res(true); m.close(); };
  });
}

/* ---------- formularios ---------- */
/* campos: {k, label, type: text|number|date|select|textarea|tel|email|color|check|chips, opts, req, ph, half, hint} */
export function field(f, v){
  const id = "f_" + f.k.replace(/\W/g, "_");
  const val = v ?? f.def ?? "";
  const attrs = `id="${id}" name="${esc(f.k)}" ${f.req ? "required" : ""} ${f.ph ? `placeholder="${esc(f.ph)}"` : ""} ${f.min !== undefined ? `min="${f.min}"` : ""} ${f.max !== undefined ? `max="${f.max}"` : ""} ${f.step ? `step="${f.step}"` : ""}`;
  let input;
  if(f.type === "select") input = `<select ${attrs}>${(f.opts || []).map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(ov)}" ${String(ov) === String(val) ? "selected" : ""}>${esc(ol)}</option>`; }).join("")}</select>`;
  else if(f.type === "textarea") input = `<textarea ${attrs} rows="${f.rows || 3}">${esc(val)}</textarea>`;
  else if(f.type === "check") return `<label class="check ${f.half ? "half" : ""}"><input type="checkbox" name="${esc(f.k)}" ${val === true || val === "true" ? "checked" : ""}><span>${esc(f.label)}</span></label>`;
  else if(f.type === "chips") return `<div class="field ${f.half ? "half" : ""}"><span class="lbl">${esc(f.label)}</span><div class="chips">${(f.opts || []).map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<label class="chip"><input type="checkbox" name="${esc(f.k)}" value="${esc(ov)}" ${(val || []).includes(ov) ? "checked" : ""}><span>${esc(ol)}</span></label>`; }).join("") || `<span class="muted small">${esc(f.empty || t("Nada para elegir"))}</span>`}</div>${f.hint ? `<small class="hint">${esc(f.hint)}</small>` : ""}</div>`;
  else if(f.type === "seg") return `<div class="field ${f.half ? "half" : ""}"><span class="lbl">${esc(f.label)}</span><div class="seg">${(f.opts || []).map(o => { const [ov, ol] = Array.isArray(o) ? o : [o, o]; return `<label><input type="radio" name="${esc(f.k)}" value="${esc(ov)}" ${String(ov) === String(val) ? "checked" : ""}><span>${esc(ol)}</span></label>`; }).join("")}</div></div>`;
  else input = `<input type="${f.type || "text"}" ${attrs} value="${esc(val)}" ${f.list ? `list="${id}_l"` : ""}>${f.list ? `<datalist id="${id}_l">${f.list.map(o => `<option value="${esc(o)}">`).join("")}</datalist>` : ""}`;
  return `<div class="field ${f.half ? "half" : ""} ${f.third ? "third" : ""}"><label for="${id}" class="lbl">${esc(f.label)}${f.req ? ' <b class="req">*</b>' : ""}</label>${input}${f.hint ? `<small class="hint">${esc(f.hint)}</small>` : ""}</div>`;
}
export function formValues(form){
  const o = {};
  for(const el of form.elements){
    if(!el.name) continue;
    if(el.type === "checkbox"){
      const group = form.querySelectorAll(`input[type=checkbox][name="${CSS.escape(el.name)}"]`);
      if(group.length > 1 || el.value !== "on"){ o[el.name] = o[el.name] || []; if(el.checked) o[el.name].push(el.value); }
      else o[el.name] = el.checked;
    }else if(el.type === "radio"){ if(el.checked) o[el.name] = el.value; }
    else if(el.type === "number") o[el.name] = el.value === "" ? null : Number(el.value);
    else o[el.name] = el.value.trim();
  }
  return o;
}
/* abre un formulario en un modal; onSave(valores) devuelve false para no cerrar */
export function formModal({title, fields, values = {}, save = t("Guardar"), onSave, extra = "", wide, danger}){
  const body = h(`<form class="form" novalidate>${fields.map(f => typeof f === "string" ? f : field(f, values[f.k])).join("")}${extra}</form>`);
  const m = modal({title, body, wide,
    foot: `${danger ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${esc(danger.label || t("Eliminar"))}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${esc(save)}</button>`});
  const submit = async () => {
    for(const el of body.querySelectorAll("[required]")) if(!el.value.trim()){ el.focus(); el.classList.add("bad"); toast(t("Completa los campos obligatorios"), "warn"); return; }
    const r = await onSave(formValues(body), m);
    if(r !== false) m.close();
  };
  m.foot.querySelector("[data-save]").onclick = submit;
  body.addEventListener("submit", e => { e.preventDefault(); submit(); });
  if(danger) m.foot.querySelector("[data-del]").onclick = async () => { if(await danger.fn()) m.close(); };
  return m;
}

export function empty(ic, title, txt, btn){
  return `<div class="empty">${icon(ic, "big")}<h3>${esc(title)}</h3><p>${esc(txt)}</p>${btn || ""}</div>`;
}
export function pill(k, txt){ return `<span class="pill ${k}">${esc(txt)}</span>`; }
