/* #/certificado/:alumnoId/:discId — certificado imprimible (A4 horizontal) del último grado
   e imagen 1080x1350 para Instagram dibujada en canvas. */
import * as S from "../store.js";
import {icon, belt, rankLabel, emptyState, shareOrDownload, toast} from "../ui.js";
import {esc, fmtDate, initials} from "../util.js";
import {t} from "../i18n.js";

let sel = {};   // grado elegido por alumno+disciplina

export function render(el, [alId, discId] = [], ctx){
  const al = S.get("alumnos", alId), d = S.get("disciplinas", discId);
  const h = al && d ? S.gradosDe(al.id, d.id) : [];
  if(!al || !d || !h.length){
    el.innerHTML = emptyState({icon: "award", title: t("No hay grado para certificar"), text: !al ? t("No encontramos a este alumno.") : t("Registra una promoción para generar su certificado."), cta: al ? {label: t("Volver a la ficha"), href: `#/alumno/${al.id}`} : {label: t("Ver grados"), href: "#/grados"}});
    return;
  }
  const k = al.id + d.id;
  const g = h.find(x => x.id === (ctx?.query?.get("g") || sel[k])) || h[h.length - 1];
  ctx?.setTitle?.(t("Certificado"));
  const acad = S.academy() || {};
  const prof = g.profesor || d.encargado || S.pref("profesor", "");
  el.innerHTML = `
  <div class="cert-bar">
    <a class="back" href="#/alumno/${al.id}">${icon("back")} ${esc(al.nombre)}</a>
    <div class="cert-act">
      ${h.length > 1 ? `<label class="cert-sel"><span class="sr">${t("Elegir grado")}</span><select data-g>${h.slice().reverse().map(x => `<option value="${x.id}" ${x.id === g.id ? "selected" : ""}>${esc(rankLabel(d, x))} · ${fmtDate(x.fecha)}</option>`).join("")}</select></label>` : ""}
      <button class="btn primary" data-print>${icon("print")}<span>${t("Imprimir")}</span></button>
      <button class="btn ghost" data-ig>${icon("camera")}<span>${t("Imagen para Instagram")}</span></button>
    </div>
  </div>
  <div class="cert-wrap"><article class="cert" data-cert>
    <div class="cert-in">
      <header class="cert-top"><img class="cert-logo" src="${esc(acad.logo || "icons/icon-192.png")}" alt=""><b>${esc(acad.nombre || "")}</b></header>
      <h1>${t("Certificado de grado")}</h1>
      <p class="cert-k">${t("Se otorga a")}</p>
      <p class="cert-name">${esc(al.nombre)}</p>
      <p class="cert-k">${t("el grado de")}</p>
      <p class="cert-rank">${esc(rankLabel(d, g))}</p>
      <div class="cert-belt">${belt(d, g.rank, g.grado, {w: 360, h: 46})}</div>
      <p class="cert-disc">${esc(t(d.nombre))} · ${fmtDate(g.fecha, true)}</p>
      <footer class="cert-sign">
        <div><i></i><b>${esc(prof || "")}</b><span>${t("Instructor")}</span></div>
        <div><i></i><b>${esc(acad.nombre || "")}</b><span>${t("Academia")}</span></div>
      </footer>
    </div>
  </article></div>
  <p class="muted small cert-tip">${t("Al imprimir, elige tamaño A4 y orientación horizontal. Puedes guardarlo como PDF.")}</p>`;
  el.onchange = e => { if(e.target.matches("[data-g]")){ sel[k] = e.target.value; render(el, [alId, discId], ctx); } };
  el.onclick = async e => {
    if(e.target.closest("[data-print]")) return imprimir(el.querySelector("[data-cert]"));
    const b = e.target.closest("[data-ig]");
    if(b){
      b.disabled = true;
      try{
        const blob = await imagenIG(al, d, g, acad);
        const name = `certificado-${al.nombre.toLowerCase().normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "")}.png`;
        await shareOrDownload({files: [new File([blob], name, {type: "image/png"})], filename: name, title: t("Certificado"), text: t("¡{nombre} ahora es {grado}!", {nombre: al.nombre.split(" ")[0], grado: rankLabel(d, g)})});
      }catch(err){ toast(t("No se pudo crear la imagen"), "error"); }
      finally{ b.disabled = false; }
    }
  };
}

/* imprime solo el certificado: se copia a un contenedor del body y lo demás se oculta */
function imprimir(cert){
  document.getElementById("print-cert")?.remove();
  const box = document.createElement("div");
  box.id = "print-cert"; box.appendChild(cert.cloneNode(true));
  document.body.appendChild(box); document.body.classList.add("printing-cert");
  const fin = () => { box.remove(); document.body.classList.remove("printing-cert"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { try{ window.print(); }catch(e){} setTimeout(fin, 1500); }, 60);
}

/* ---------- imagen 1080x1350 ---------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function rr(c, x, y, w, h, r){ c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
/* cinturón con trazos de canvas: color, franja central, punta y rayas */
function drawBelt(c, d, g, x, y, w, h){
  const r = S.rankDef(d, g.rank), mx = Math.max(r.g || 0, g.grado || 0);
  const tipW = w * .3, tipX = x + w - tipW - w * .08, tip = r.tip || (r.c === "#111111" ? "#c1121f" : "#111111");
  c.save(); rr(c, x, y, w, h, 10); c.clip();
  c.fillStyle = r.c || "#999"; c.fillRect(x, y, w, h);
  if(r.c2 && r.stripes){ const n = 6, s = (tipX - x) / (n * 2); c.fillStyle = r.c2; for(let i = 0; i < n; i++) c.fillRect(x + (i * 2 + 1) * s, y, s, h); }
  else if(r.c2){ c.fillStyle = r.c2; c.fillRect(x, y + h * .36, w, h * .28); }
  if(mx){
    c.fillStyle = tip; c.fillRect(tipX, y, tipW, h);
    const sw = Math.max(8, Math.min(18, tipW / (mx * 1.8 + 1.2))), gap = (tipW - sw * mx) / (mx + 1);
    c.fillStyle = "#fff"; for(let i = 0; i < (g.grado || 0); i++) c.fillRect(tipX + gap * (i + 1) + sw * i, y + 6, sw, h - 12);
  }
  const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, "rgba(255,255,255,.25)"); gr.addColorStop(.5, "rgba(255,255,255,0)"); gr.addColorStop(1, "rgba(0,0,0,.25)");
  c.fillStyle = gr; c.fillRect(x, y, w, h);
  c.restore();
  if(["#f4f4f4", "#ffffff"].includes(r.c)){ c.strokeStyle = "rgba(0,0,0,.25)"; c.lineWidth = 2; rr(c, x, y, w, h, 10); c.stroke(); }
}
function fit(c, txt, max, size, weight = 800){
  let s = size;
  do{ c.font = `${weight} ${s}px Inter, system-ui, sans-serif`; s -= 4; }while(c.measureText(txt).width > max && s > 24);
}
export async function imagenIG(al, d, g, acad = S.academy() || {}){
  const W = 1080, H = 1350, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), rc = S.rankDef(d, g.rank).c || "#ef3340";
  /* fondo oscuro con un halo del color del cinturón */
  c.fillStyle = "#0b0d12"; c.fillRect(0, 0, W, H);
  const halo = c.createRadialGradient(W / 2, 480, 60, W / 2, 480, 760);
  halo.addColorStop(0, rc === "#111111" ? "rgba(193,18,31,.45)" : rc + "88"); halo.addColorStop(1, "rgba(11,13,18,0)");
  c.fillStyle = halo; c.fillRect(0, 0, W, H);
  c.strokeStyle = "rgba(255,255,255,.14)"; c.lineWidth = 4; rr(c, 40, 40, W - 80, H - 80, 36); c.stroke();
  c.textAlign = "center"; c.fillStyle = "#fff";
  fit(c, (acad.nombre || "").toUpperCase(), W - 200, 46, 800); c.fillText((acad.nombre || "").toUpperCase(), W / 2, 150);
  c.fillStyle = "rgba(255,255,255,.65)"; c.font = "600 34px Inter, system-ui, sans-serif"; c.fillText(t("¡Nueva promoción!"), W / 2, 210);
  /* foto en círculo (o iniciales) */
  const cx = W / 2, cy = 520, R = 220;
  c.save(); c.beginPath(); c.arc(cx, cy, R + 12, 0, Math.PI * 2); c.fillStyle = rc === "#111111" ? "#c1121f" : rc; c.fill(); c.restore();
  c.save(); c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.closePath(); c.clip();
  const f = S.foto(al.id);
  let ok = false;
  if(f) try{ const im = await loadImg(f), s = Math.min(im.naturalWidth, im.naturalHeight); c.drawImage(im, (im.naturalWidth - s) / 2, (im.naturalHeight - s) / 2, s, s, cx - R, cy - R, R * 2, R * 2); ok = true; }catch(e){}
  if(!ok){ c.fillStyle = "#1b2030"; c.fillRect(cx - R, cy - R, R * 2, R * 2); c.fillStyle = "#fff"; c.font = "800 150px Inter, system-ui, sans-serif"; c.textBaseline = "middle"; c.fillText(initials(al.nombre), cx, cy + 8); c.textBaseline = "alphabetic"; }
  c.restore();
  c.fillStyle = "#fff"; fit(c, al.nombre, W - 160, 76, 800); c.fillText(al.nombre, W / 2, 870);
  const rl = rankLabel(d, g);
  c.fillStyle = "rgba(255,255,255,.85)"; fit(c, rl, W - 200, 52, 700); c.fillText(rl, W / 2, 945);
  drawBelt(c, d, g, 170, 990, W - 340, 88);
  c.fillStyle = "rgba(255,255,255,.6)"; c.font = "500 34px Inter, system-ui, sans-serif";
  c.fillText(`${t(d.nombre)} · ${fmtDate(g.fecha, true)}`, W / 2, 1150);
  if(g.profesor){ c.font = "500 30px Inter, system-ui, sans-serif"; c.fillText(t("Otorgado por {nombre}", {nombre: g.profesor}), W / 2, 1200); }
  c.fillStyle = "rgba(255,255,255,.35)"; c.font = "600 24px Inter, system-ui, sans-serif"; c.fillText("AcademiaPro", W / 2, H - 80);
  return new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error("png")), "image/png"));
}
