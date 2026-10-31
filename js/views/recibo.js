/* Recibo de pago numerado: para imprimir (A5 o tirilla de 80 mm), compartir como imagen o mandar por WhatsApp. */
import * as S from "../store.js";
import {icon, emptyState, toast, shareOrDownload} from "../ui.js";
import {esc, money, fmtDate, waLink} from "../util.js";
import {planById} from "../catalog.js";
import {fmtNumRecibo} from "../cobros.js";
import {logo} from "../shell.js";
import {t, tn, lang} from "../i18n.js";

/* ---------- valor en letras (español) ---------- */
const U = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve", "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve"];
const D = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const C = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];
/* 0..999; corto = «un»/«veintiún» delante de mil, millón o del nombre de la moneda */
function cientos(n, corto){
  if(n === 100) return "cien";
  const c = Math.floor(n / 100), r = n % 100;
  let s = r < 30 ? U[r] : D[Math.floor(r / 10)] + (r % 10 ? " y " + U[r % 10] : "");
  if(corto) s = s.replace(/uno$/, "ún").replace(/^ún$/, "un").replace(/ y ún$/, " y un");
  return [C[c], s].filter(Boolean).join(" ");
}
function miles(n, corto){
  const m = Math.floor(n / 1000), r = n % 1000;
  const a = m === 0 ? "" : m === 1 ? "mil" : cientos(m, true) + " mil";
  return [a, r ? cientos(r, corto) : ""].filter(Boolean).join(" ");
}
export function enLetras(n, corto = true){
  n = Math.floor(Math.abs(Number(n) || 0));
  if(!n) return "cero";
  const mm = Math.floor(n / 1e6), r = n % 1e6;
  const a = mm === 0 ? "" : mm === 1 ? "un millón" : miles(mm, true) + " millones";
  return [a, r ? miles(r, corto) : ""].filter(Boolean).join(" ");
}
const MON = {COP: ["peso", "pesos"], MXN: ["peso", "pesos"], ARS: ["peso", "pesos"], CLP: ["peso", "pesos"], USD: ["dólar", "dólares"], EUR: ["euro", "euros"], PEN: ["sol", "soles"], BRL: ["real", "reales"]};
export function montoEnLetras(v, cur = "COP"){
  const n = Math.abs(Number(v) || 0), ent = Math.floor(n), cent = Math.round((n - ent) * 100);
  const [uno, varios] = MON[cur] || MON.COP;
  let s = enLetras(ent);
  /* «un millón de pesos», «dos millones de pesos» */
  s += (ent >= 1e6 && ent % 1e6 === 0 ? " de " : " ") + (ent === 1 ? uno : varios);
  if(cent) s += ` con ${String(cent).padStart(2, "0")}/100`;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ---------- datos del recibo ---------- */
function datos(p){
  const acad = S.academy() || {}, al = S.get("alumnos", p.alumnoId), sede = S.get("sedes", p.sedeId || al?.sedeId);
  const cur = acad.moneda || "COP";
  let periodo = "";
  if(p.concepto === "Tiquetera" && Number(p.clases) > 0) periodo = tn(Number(p.clases), "1 clase", "{n} clases") + (p.vence ? " · " + t("vence el {fecha}", {fecha: fmtDate(p.vence)}) : "");
  else if(p.desde && p.hasta) periodo = `${fmtDate(p.desde)} – ${fmtDate(p.hasta)}`;
  const plan = p.plan ? t(planById(p.plan).nombre) : "";
  return {acad, al, sede, cur, periodo, plan,
    num: fmtNumRecibo(p.num), fecha: fmtDate(p.fecha, true), monto: money(p.monto, cur), letras: lang() === "es" ? montoEnLetras(p.monto, cur) : "",
    contacto: [acad.nit ? `NIT ${acad.nit}` : "", acad.telefono || sede?.telefono || "", [sede?.direccion, sede?.ciudad || acad.ciudad].filter(Boolean).join(", ")].filter(Boolean),
    firma: p.recibidoPor || S.pref("profesor", "") || sede?.encargado || ""};
}

const fila = (k, v) => v ? `<div class="rc-row"><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>` : "";

let impreso = null;
export function render(el, [id], ctx, query){
  const p = id && S.get("pagos", id);
  if(!p){
    el.innerHTML = `<div class="card">${emptyState({icon: "receipt", title: t("No encontramos este recibo"), text: t("Puede que el pago se haya eliminado."), cta: {label: t("Ir a Pagos"), href: "#/pagos"}})}</div>`;
    return;
  }
  const d = datos(p), al = d.al;
  const foto = S.foto(d.acad.id);
  const ticket = S.pref("reciboFmt", "a5") === "80";
  el.innerHTML = `
  <div class="rc-tools no-print">
    <a class="btn ghost small" href="${al ? `#/alumno/${al.id}` : "#/pagos"}">${icon("back")}<span>${al ? esc(al.nombre.split(" ")[0]) : t("Pagos")}</span></a>
    <div class="seg small" role="group" aria-label="${t("Tamaño")}"><button type="button" data-fmt="a5" class="${ticket ? "" : "on"}" aria-pressed="${!ticket}">A5</button><button type="button" data-fmt="80" class="${ticket ? "on" : ""}" aria-pressed="${ticket}">${t("Tirilla 80 mm")}</button></div>
    <span class="rc-sp"></span>
    <button type="button" class="btn ghost small" data-wa>${icon("whatsapp")}<span>WhatsApp</span></button>
    <button type="button" class="btn ghost small" data-share>${icon("share")}<span>${t("Imagen")}</span></button>
    <button type="button" class="btn primary small" data-print>${icon("print")}<span>${t("Imprimir")}</span></button>
  </div>
  <article class="rc-paper ${ticket ? "ticket" : ""}" aria-label="${esc(t("Recibo N.º {n}", {n: d.num}))}">
    <header class="rc-head">
      <div class="rc-logo">${foto ? `<img src="${foto}" alt="">` : logo(44)}</div>
      <div class="rc-acad"><b>${esc(d.acad.nombre || t("Mi academia"))}</b>${d.contacto.map(c => `<span>${esc(c)}</span>`).join("")}</div>
      <div class="rc-num"><span>${t("Recibo N.º")}</span><b>${esc(d.num)}</b><span>${esc(d.fecha)}</span></div>
    </header>
    <dl class="rc-body">
      ${fila(t("Recibimos de"), al?.nombre || t("Alumno eliminado"))}
      ${fila(t("Acudiente"), al?.acudiente)}
      ${fila(t("Documento"), al?.documento)}
      ${fila(t("Concepto"), t(p.concepto || "Otro") + (d.plan && p.concepto === "Mensualidad" ? ` · ${d.plan}` : ""))}
      ${fila(p.concepto === "Tiquetera" ? t("Clases") : t("Período"), d.periodo)}
      ${fila(t("Método"), t(p.metodo || ""))}
      ${fila(t("Nota"), p.nota)}
    </dl>
    <div class="rc-total"><span>${t("Valor")}</span><b>${esc(d.monto)}</b></div>
    ${d.letras ? `<p class="rc-letras">${esc(t("Son: {letras}", {letras: d.letras.charAt(0).toLowerCase() + d.letras.slice(1)}))}</p>` : ""}
    <footer class="rc-foot">
      <div class="rc-sign"><span class="rc-line"></span><span>${t("Recibido por")}${d.firma ? ": " + esc(d.firma) : ""}</span></div>
      <p class="rc-thanks">${t("¡Gracias por entrenar con nosotros!")}</p>
    </footer>
  </article>`;
  /* tamaño de página según el formato elegido */
  const pageCss = document.createElement("style");
  pageCss.id = "rcPage";
  pageCss.textContent = ticket ? "@page{size:80mm auto;margin:3mm}" : "@page{size:A5 portrait;margin:10mm}";
  document.getElementById("rcPage")?.remove();
  document.head.appendChild(pageCss);
  document.body.classList.add("pg-recibo");
  el.onclick = e => {
    const f = e.target.closest("[data-fmt]");
    if(f){ S.setPref("reciboFmt", f.dataset.fmt); render(el, [id], ctx, query); return; }
    if(e.target.closest("[data-print]")) return window.print();
    if(e.target.closest("[data-wa]")){
      const w = waLink(al?.telefono || al?.acudienteTel, texto(p, d));
      if(w) window.open(w, "_blank", "noopener");
      else shareOrDownload({title: t("Recibo N.º {n}", {n: d.num}), text: texto(p, d)});
      return;
    }
    const sb = e.target.closest("[data-share]");
    if(sb){
      sb.disabled = true;
      imagen(p, d, foto).then(blob => shareOrDownload({title: t("Recibo N.º {n}", {n: d.num}), text: t("Recibo N.º {n}", {n: d.num}), files: [new File([blob], `recibo-${d.num}.png`, {type: "image/png"})], filename: `recibo-${d.num}.png`}))
        .catch(() => toast(t("No se pudo crear la imagen"), "error")).finally(() => { sb.disabled = false; });
    }
  };
  /* #/recibo/<id>?print=1: imprime una vez al abrir */
  if((query || ctx?.query)?.get?.("print") && impreso !== id){ impreso = id; setTimeout(() => window.print(), 350); }
  return () => { document.getElementById("rcPage")?.remove(); document.body.classList.remove("pg-recibo"); };
}

/* resumen en texto para WhatsApp */
export function texto(p, d = datos(p)){
  return [
    `*${t("Recibo N.º {n}", {n: d.num})}* · ${d.acad.nombre || ""}`,
    `${t("Fecha")}: ${d.fecha}`,
    `${t("Alumno")}: ${d.al?.nombre || ""}`,
    `${t("Concepto")}: ${t(p.concepto || "Otro")}${d.periodo ? ` (${d.periodo})` : ""}`,
    `${t("Valor")}: ${d.monto}${p.metodo ? ` · ${t(p.metodo)}` : ""}`,
    d.letras ? t("Son: {letras}", {letras: d.letras.charAt(0).toLowerCase() + d.letras.slice(1)}) : "",
    t("¡Gracias por entrenar con nosotros!"),
  ].filter(Boolean).join("\n");
}

/* ---------- imagen PNG a 2x ---------- */
const cargarImg = src => new Promise(res => { if(!src) return res(null); const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
/* parte un texto en líneas que quepan en w */
function lineas(ctx, txt, w){
  const out = []; let cur = "";
  for(const word of String(txt).split(/\s+/)){
    const n = cur ? cur + " " + word : word;
    if(ctx.measureText(n).width > w && cur){ out.push(cur); cur = word; } else cur = n;
  }
  if(cur) out.push(cur);
  return out;
}
async function imagen(p, d, foto){
  const W = 540, pad = 32, k = 2, font = (s, wt = 500) => `${wt} ${s}px Inter, system-ui, sans-serif`;
  const filas = [[t("Recibimos de"), d.al?.nombre || ""], [t("Acudiente"), d.al?.acudiente], [t("Concepto"), t(p.concepto || "Otro") + (d.plan && p.concepto === "Mensualidad" ? ` · ${d.plan}` : "")],
    [p.concepto === "Tiquetera" ? t("Clases") : t("Período"), d.periodo], [t("Método"), t(p.metodo || "")], [t("Nota"), p.nota]].filter(r => r[1]);
  const meas = document.createElement("canvas").getContext("2d");
  meas.font = font(15);
  const lv = filas.map(([, v]) => lineas(meas, v, W - pad * 2 - 130));
  meas.font = font(13, 500);
  const lt = d.letras ? lineas(meas, t("Son: {letras}", {letras: d.letras.toLowerCase()}), W - pad * 2) : [];
  const H = 150 + lv.reduce((s, l) => s + l.length * 21 + 12, 0) + 90 + lt.length * 18 + 120;
  const c = document.createElement("canvas"); c.width = W * k; c.height = H * k;
  const x = c.getContext("2d"); x.scale(k, k);
  x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
  x.fillStyle = "#c8102e"; x.fillRect(0, 0, W, 6);
  const img = await cargarImg(foto);
  let tx = pad;
  if(img){ x.save(); x.beginPath(); x.arc(pad + 24, 54, 24, 0, Math.PI * 2); x.clip(); x.drawImage(img, pad, 30, 48, 48); x.restore(); tx = pad + 60; }
  x.fillStyle = "#111827"; x.font = font(19, 800); x.textBaseline = "alphabetic";
  x.fillText(String(d.acad.nombre || "").slice(0, 34), tx, 50);
  x.fillStyle = "#6b7280"; x.font = font(12);
  d.contacto.slice(0, 2).forEach((s, i) => x.fillText(String(s).slice(0, 48), tx, 68 + i * 16));
  x.textAlign = "right"; x.fillStyle = "#6b7280"; x.font = font(12, 600); x.fillText(t("Recibo N.º").toUpperCase(), W - pad, 40);
  x.fillStyle = "#111827"; x.font = font(22, 800); x.fillText(d.num, W - pad, 66);
  x.fillStyle = "#6b7280"; x.font = font(12); x.fillText(d.fecha, W - pad, 84);
  x.textAlign = "left";
  let y = 118;
  x.strokeStyle = "#e5e7eb"; x.lineWidth = 1; x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke();
  y += 28;
  filas.forEach(([lab], i) => {
    x.fillStyle = "#6b7280"; x.font = font(13, 600); x.fillText(lab, pad, y);
    x.fillStyle = "#111827"; x.font = font(15);
    lv[i].forEach((l, j) => x.fillText(l, pad + 130, y + j * 21));
    y += lv[i].length * 21 + 12;
  });
  y += 6;
  x.fillStyle = "#f3f4f6"; x.beginPath(); x.roundRect ? x.roundRect(pad, y, W - pad * 2, 60, 12) : x.rect(pad, y, W - pad * 2, 60); x.fill();
  x.fillStyle = "#374151"; x.font = font(14, 700); x.fillText(t("Valor").toUpperCase(), pad + 16, y + 36);
  x.textAlign = "right"; x.fillStyle = "#111827"; x.font = font(26, 800); x.fillText(d.monto, W - pad - 16, y + 40); x.textAlign = "left";
  y += 84;
  x.fillStyle = "#374151"; x.font = font(13, 500);
  lt.forEach((l, j) => x.fillText(l, pad, y + j * 18));
  y += lt.length * 18 + 52;
  x.strokeStyle = "#9ca3af"; x.beginPath(); x.moveTo(pad, y); x.lineTo(pad + 220, y); x.stroke();
  x.fillStyle = "#6b7280"; x.font = font(12); x.fillText(t("Recibido por") + (d.firma ? ": " + d.firma : ""), pad, y + 18);
  x.textAlign = "right"; x.fillText("AcademiaPro", W - pad, y + 18);
  return new Promise((res, rej) => c.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png"));
}
