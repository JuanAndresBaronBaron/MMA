/* Página pública de inscripción (inscripcion.html?a=…). No lee datos de la app: todo viene en ?a=, un JSON en
   base64url {n: academia, w: whatsapp, d: [disciplinas], s: [sedes], c?: color}. Al enviar abre WhatsApp con un
   mensaje que la academia pega en Prospectos › Pegar desde WhatsApp (js/views/leads.js parseInscripcion). */
import {t} from "../i18n.js";
import {esc, b64urlDecode, waUrl} from "../util.js";

/* mismos textos que FUENTES en js/views/leads.js */
const FUENTES = ["Instagram", "Facebook", "TikTok", "Me lo recomendaron", "Volante o afiche", "Pasaba por ahí", "Página web o Google", "Otro"];

export function leerDatos(search = location.search){
  try{
    const a = new URLSearchParams(search).get("a"); if(!a) return null;
    const o = JSON.parse(new TextDecoder().decode(b64urlDecode(a)));
    if(!o || typeof o !== "object" || !o.n || !o.w) return null;
    const lista = x => Array.isArray(x) ? x.map(String).filter(Boolean).slice(0, 30) : [];
    return {n: String(o.n).slice(0, 80), w: String(o.w).slice(0, 20), d: lista(o.d), s: lista(o.s), c: /^#[0-9a-f]{3,8}$/i.test(o.c || "") ? o.c : null};
  }catch(e){ return null; }
}
/* líneas fijas en español: así las entiende la app en cualquier idioma */
export function mensajeInscripcion(v){
  const x = s => String(s ?? "").replace(/\s+/g, " ").trim() || "-";
  return ["#inscripcion AcademiaPro", `Nombre: ${x(v.nombre)}`, `Teléfono: ${x(v.telefono)}`, `Edad: ${x(v.edad)}`, `Disciplina: ${x(v.disciplina)}`,
    `Sede: ${x(v.sede)}`, `Cómo nos conoció: ${x(v.fuente)}`, `Mensaje: ${x(v.mensaje)}`].join("\n");
}
export const urlInscripcion = (datos, v) => waUrl(datos.w, mensajeInscripcion(v));

function pintar(root){
  const D = leerDatos();
  if(!D){
    document.title = t("Página de inscripción") + " · AcademiaPro";
    root.innerHTML = `<section class="insc-card insc-bad"><h1>${t("Este link no es válido")}</h1><p class="muted">${t("Pídele a la academia que te comparta su link de inscripción de nuevo.")}</p></section>`;
    return;
  }
  document.title = `${t("Página de inscripción")} · ${D.n}`;
  if(D.c) document.documentElement.style.setProperty("--accent", D.c);
  const sel = (name, label, opts, req) => `<label class="insc-f"><span>${esc(label)}${req ? ' <b class="req">*</b>' : ""}</span><select name="${name}" ${req ? "required" : ""}><option value="">${t("Elige una opción")}</option>${opts.map(o => `<option>${esc(o)}</option>`).join("")}</select></label>`;
  root.innerHTML = `<section class="insc-card">
    <header class="insc-h"><span class="insc-badge">${t("Clase de prueba")}</span><h1>${esc(D.n)}</h1><p class="muted">${t("Déjanos tus datos y te escribimos para agendar tu primera clase.")}</p>
      ${D.d.length ? `<div class="insc-tags">${D.d.map(d => `<span class="tag">${esc(t(d))}</span>`).join("")}</div>` : ""}</header>
    <form class="insc-form" novalidate>
      <label class="insc-f"><span>${t("Nombre completo")} <b class="req">*</b></span><input name="nombre" autocomplete="name" required maxlength="80"></label>
      <div class="insc-2">
        <label class="insc-f"><span>${t("Teléfono / WhatsApp")} <b class="req">*</b></span><input name="telefono" type="tel" inputmode="tel" autocomplete="tel" required maxlength="20" placeholder="300 123 4567"></label>
        <label class="insc-f"><span>${t("Edad")}</span><input name="edad" type="number" inputmode="numeric" min="2" max="99"></label>
      </div>
      ${D.d.length ? sel("disciplina", t("¿Qué quieres entrenar?"), D.d.map(d => t(d)), false) : ""}
      ${D.s.length > 1 ? sel("sede", t("Sede"), D.s, false) : ""}
      ${sel("fuente", t("¿Cómo nos conociste?"), FUENTES.map(f => t(f)), false)}
      <label class="insc-f"><span>${t("Mensaje")}</span><textarea name="mensaje" rows="3" maxlength="400" placeholder="${t("Ej: quiero empezar en las noches, nunca he entrenado")}"></textarea></label>
      <p class="insc-err" role="alert" hidden></p>
      <button type="submit" class="btn primary big block insc-go"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>${t("Enviar por WhatsApp")}</button>
      <p class="muted small insc-nota">${t("Al enviar se abre WhatsApp con tus datos. Nada se guarda en esta página.")}</p>
    </form></section>
    <p class="insc-pie muted small">${t("Hecho con AcademiaPro")}</p>`;
  const f = root.querySelector("form"), err = root.querySelector(".insc-err");
  f.onsubmit = e => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(f));
    if(D.s.length === 1) v.sede = D.s[0];
    const falta = ["nombre", "telefono"].find(k => !String(v[k] || "").trim());
    const telOk = String(v.telefono || "").replace(/\D/g, "").length >= 7;
    if(falta || !telOk){
      err.textContent = falta ? t("Escribe tu nombre y tu teléfono.") : t("Revisa el número de teléfono.");
      err.hidden = false; f.elements[falta || "telefono"].focus(); return;
    }
    err.hidden = true;
    const url = urlInscripcion(D, v);
    f.dataset.url = url;
    location.href = url;
  };
}
const root = document.getElementById("insc");
if(root) pintar(root);
