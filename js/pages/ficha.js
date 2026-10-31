/* ficha.html: ficha de solo lectura que la academia comparte con el alumno por WhatsApp.
   Los datos vienen dentro del enlace (#d=… comprimido o #j=…): no hay servidor ni datos de la app. */
import {t, tn} from "../i18n.js";
import {esc, fmtDate, waUrl, initials, daysBetween, today} from "../util.js";
import {decodeFicha} from "../ficha-link.js";

const $m = document.getElementById("ficha");
const ST = {vencido: "Pago vencido", pronto: "Pago próximo", aldia: "Al día", congelado: "Congelado", inactivo: "Inactivo", sin: "Sin pagos"};

/* cinturón en SVG (misma idea que ui.belt, sin depender de la app) */
function belt(d, w = 220, h = 32){
  const tipW = Math.round(w * .3), tipX = w - tipW - Math.round(w * .08), mx = Math.max(d.mx || 0, d.gr || 0);
  const tip = d.tp || (d.c === "#111111" ? "#c1121f" : "#111111");
  const sw = Math.max(3, Math.min(7, Math.floor(tipW / (mx * 1.8 + 1.2) || 5))), gap = mx ? (tipW - sw * mx) / (mx + 1) : 0;
  let s = "";
  for(let i = 0; i < (d.gr || 0); i++) s += `<rect x="${(tipX + gap * (i + 1) + sw * i).toFixed(1)}" y="3" width="${sw}" height="${h - 6}" fill="#fff"/>`;
  const light = /^#f[0-9a-f]{5}$/i.test(d.c || "");
  return `<svg class="fc-belt" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(t(d.r))}">
    <rect width="${w}" height="${h}" rx="4" fill="${esc(d.c || "#888")}" ${light ? 'stroke="#cfcfcf"' : ""}/>
    ${d.c2 ? `<rect y="${h * .36}" width="${w}" height="${h * .28}" fill="${esc(d.c2)}"/>` : ""}
    ${mx || d.gr ? `<rect x="${tipX}" width="${tipW}" height="${h}" fill="${esc(tip)}"/>${s}` : ""}</svg>`;
}
const grTxt = d => d.gr ? " · " + (d.mx ? tn(d.gr, "1° grado", "{n}° grado") : t("{n}° dan", {n: d.gr})) : "";

function pinta(o){
  const s = o.s, a = o.a || {};
  document.title = `${s.n} · ${a.n || "AcademiaPro"}`;
  const p = s.p, dias = p?.vence ? daysBetween(today(), p.vence) : null;
  const wa = a.w ? waUrl(a.w, t("Hola, soy {nombre}. Vi mi ficha de la academia y quería preguntar algo.", {nombre: s.n.split(" ")[0]})) : "";
  const sec = (titulo, cuerpo, cls = "") => `<h2 class="fc-sh">${titulo}</h2><section class="fc-card ${cls}">${cuerpo}</section>`;
  $m.innerHTML = `
  <header class="fc-h"><span>${t("Ficha del alumno")}</span><b>${esc(a.n || "")}</b></header>
  <section class="fc-who">
    <span class="fc-av">${s.f ? `<img src="${esc(s.f)}" alt="">` : `<span>${esc(initials(s.n))}</span>`}</span>
    <h1>${esc(s.n)}</h1>
  </section>
  ${(s.d || []).length ? sec(t("Cinturones"), s.d.map(d => `<div class="fc-disc">
      <span class="fc-dn">${esc(t(d.n))}</span>${belt(d)}
      <b>${esc(t(d.r))}${esc(grTxt(d))}</b>
      <span class="fc-mut">${t("Desde {fecha}", {fecha: fmtDate(d.desde)})}</span>
      ${d.prox ? `<span class="fc-next">${t("Siguiente: {rank}", {rank: esc(d.prox.rank)})}${d.prox.fecha > today() ? " · " + t("elegible el {fecha}", {fecha: fmtDate(d.prox.fecha)}) : " · " + t("ya cumple el tiempo")}</span>` : ""}
    </div>`).join("")) : ""}
  ${s.req ? sec(t("Requisitos del próximo grado"), `
    <div class="fc-req"><b class="fc-big">${Math.max(0, Math.min(100, s.req.pct))}<small>%</small></b><span class="fc-mut">${t("dominado")}</span></div>
    <div class="fc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.max(0, Math.min(100, s.req.pct))}"><span style="width:${Math.max(0, Math.min(100, s.req.pct))}%"></span></div>
    ${(s.req.pend || []).length ? `<p>${t("Te falta trabajar:")}</p><ul class="fc-list">${s.req.pend.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="fc-ok">${t("¡Cumples los requisitos!")}</p>`}`) : ""}
  <h2 class="fc-sh">${t("Asistencia")}</h2><div class="fc-kpis">
    <div><b>${s.as?.mes ?? 0}</b><span>${tn(s.as?.mes ?? 0, "clase este mes", "clases este mes")}</span></div>
    <div><b>${s.as?.total ?? 0}</b><span>${t("en total")}</span></div>
    <div><b>${s.as?.racha ?? 0}</b><span>${tn(s.as?.racha ?? 0, "semana seguida", "semanas seguidas")}</span></div></div>
  ${p ? sec(t("Pagos"), `<div class="fc-pay-r"><span>${p.vence ? (dias < 0 ? t("Venció el {fecha}", {fecha: fmtDate(p.vence)}) : t("Próximo pago: {fecha}", {fecha: fmtDate(p.vence)})) : esc(t(ST[p.estado] || p.estado))}</span><span class="pill ${esc(p.estado)}">${esc(t(ST[p.estado] || p.estado))}</span></div>`, `fc-pay ${esc(p.estado)}`) : ""}
  ${wa ? `<a class="btn primary big block fc-wa" href="${esc(wa)}" target="_blank" rel="noopener"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>${t("Escribir a la academia")}</a>` : ""}
  <footer class="fc-f">${t("Generado el {fecha}", {fecha: fmtDate(o.g)})} · ${t("Es una foto de ese día: la academia la actualiza al enviarte un enlace nuevo.")}<br><a href="./">AcademiaPro</a></footer>`;
}
function error(){
  $m.innerHTML = `<section class="fc-err"><span class="fc-err-ic" aria-hidden="true"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/><path d="M4 4l16 16"/></svg></span><h1>${t("Enlace no válido")}</h1><p>${t("Este enlace está incompleto o dañado. Pídele a tu academia que te lo envíe de nuevo.")}</p><a class="btn ghost" href="./">AcademiaPro</a></section>`;
}
async function go(){ try{ const o = await decodeFicha(location.hash); o ? pinta(o) : error(); }catch(e){ error(); } }
window.addEventListener("hashchange", go);
go();
