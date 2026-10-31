/* Estadísticas de entreno: SVG en línea, sin librerías.
   Colores por arte en orden fijo (validados para daltonismo en claro y oscuro: azul, rojo, aqua, amarillo, violeta);
   los complementos van juntos en «Otros» (gris). Cada gráfico tiene aviso al pasar o enfocar y una tabla. */
import * as E from "./index.js";
import {icon} from "../ui.js";
import {esc, today, addDays, fmtDate, debounce} from "../util.js";
import {t, tn, locale} from "../i18n.js";
import {volver, resT} from "../views/entreno.js";

const SLOT = {bjj: 1, muaythai: 2, lucha: 3, boxeo: 4, mma: 5};
const color = a => SLOT[a] ? `var(--cv${SLOT[a]})` : "var(--cvo)";
const nomArte = a => a === "_otros" ? t("Otros") : t(E.arte(a)?.corto || a);
const fmtN = n => Math.round(n).toLocaleString(locale());
const corto = iso => new Intl.DateTimeFormat(locale(), {day: "numeric", month: "short"}).format(new Date(iso + "T12:00"));

function datos(){
  const hs = E.hechas(), hoy = today(), l0 = E.lunes(hoy);
  const sem = Array.from({length: 12}, (_, i) => addDays(l0, -7 * (11 - i)));
  const W = sem.map(l => ({l, min: 0, por: {}, rpe: [], n: 0}));
  const dia = {};
  for(const s of hs){
    const m = +s.min || 0;
    dia[s.fecha] = (dia[s.fecha] || 0) + m;
    const w = W.find(x => s.fecha >= x.l && s.fecha < addDays(x.l, 7)); if(!w) continue;
    w.min += m; w.n++;
    if(s.rpe) w.rpe.push(+s.rpe);
    const as = (s.artes || []).length ? s.artes : ["_otros"];
    for(const a of as){ const k = SLOT[a] ? a : "_otros"; w.por[k] = (w.por[k] || 0) + m / as.length; }
  }
  for(const w of W) w.rpeM = w.rpe.length ? w.rpe.reduce((a, b) => a + b, 0) / w.rpe.length : null;
  const artes = [...Object.keys(SLOT), "_otros"].filter(a => W.some(w => w.por[a] > 0));
  /* rollos */
  const rs = hs.flatMap(s => s.rollos || []), gan = {}, per = {}, res = {};
  for(const r of rs){
    res[r.resultado] = (res[r.resultado] || 0) + 1;
    const k = (r.tecnica || "").trim(); if(!k) continue;
    if(r.resultado === "gane_sub" || r.resultado === "pase" || r.resultado === "raspe") gan[k] = (gan[k] || 0) + 1;
    if(r.resultado === "perdi_sub" || r.resultado === "me_pasaron") per[k] = (per[k] || 0) + 1;
  }
  const top = o => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const tot = hs.reduce((a, s) => a + (+s.min || 0), 0), rpes = hs.filter(s => s.rpe).map(s => +s.rpe);
  return {hs, W, artes, dia, rs, gan: top(gan), per: top(per), res, tot, rpe: rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null};
}

export function render(el){
  const D = datos(), rc = E.rachas();
  const card = (k, ic, tt, sub = "") => `<section class="card en-ch" data-ch="${k}"><header class="card-h"><h3>${icon(ic)} ${tt}</h3>${sub}</header><div class="cv" data-cv="${k}"></div></section>`;
  el.innerHTML = `${volver()}
  <div class="en-tiles">
    <div class="en-tile"><span class="kpi-ic c3">${icon("fist")}</span><div><b>${fmtN(D.hs.length)}</b><span>${t("Sesiones en total")}</span></div></div>
    <div class="en-tile"><span class="kpi-ic c1">${icon("clock")}</span><div><b>${fmtN(D.tot / 60)} h</b><span>${t("Horas entrenadas")}</span></div></div>
    <div class="en-tile"><span class="kpi-ic c4">${icon("flame")}</span><div><b>${tn(rc.record, "1 día", "{n} días")}</b><span>${t("Mejor racha")}</span></div></div>
    <div class="en-tile"><span class="kpi-ic c2">${icon("zap")}</span><div><b>${D.rpe ? D.rpe.toFixed(1) : "–"}</b><span>${t("RPE promedio")}</span></div></div>
  </div>
  ${!D.hs.length ? `<div class="card"><div class="empty">${icon("chart", "big")}<h3>${t("Todavía no hay datos")}</h3><p>${t("Registra tus entrenos y aquí verás tus minutos por semana, tu esfuerzo y tus días activos.")}</p><a class="btn primary" href="#/entreno">${t("Ir a Entrenamiento")}</a></div></div>` : `
  <div class="en-charts">
    ${card("min", "chart", t("Minutos por semana"), `<span class="muted small">${t("Últimas 12 semanas")}</span>`)}
    ${card("arte", "grid", t("Minutos por arte"), `<span class="muted small">${t("Últimas 12 semanas")}</span>`)}
    ${card("rpe", "zap", t("Esfuerzo (RPE)"), `<span class="muted small hide-s">${t("Promedio semanal")}</span>`)}
    ${card("heat", "calendar", t("Días activos"), `<span class="muted small">${t("Últimas 16 semanas")}</span>`)}
  </div>
  <section class="card en-ch"><header class="card-h"><h3>${icon("target")} ${t("Rollos y sparring")}</h3><span class="muted small">${tn(D.rs.length, "1 rollo", "{n} rollos")}</span></header>
    ${D.rs.length ? `<div class="en-res-sum">${Object.entries(D.res).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="tag">${esc(resT(k))} <b>${n}</b></span>`).join("")}</div>
    <div class="en-hb2">${hbars(t("Lo que mejor te funciona"), D.gan, "var(--cv1)")}${hbars(t("Donde más pierdes"), D.per, "var(--cv2)")}</div>`
    : `<p class="muted">${t("Anota tus rollos al registrar un entreno (en «Diario») para ver tus mejores técnicas y dónde más pierdes.")}</p>`}
  </section>
  <details class="card en-tabla"><summary>${icon("list")} ${t("Ver datos en tabla")}</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${t("Semana")}</th><th>${t("Sesiones")}</th><th>${t("Minutos")}</th>${D.artes.map(a => `<th>${esc(nomArte(a))}</th>`).join("")}<th>RPE</th></tr></thead>
    <tbody>${D.W.map(w => `<tr><td>${corto(w.l)}</td><td>${w.n}</td><td>${fmtN(w.min)}</td>${D.artes.map(a => `<td>${fmtN(w.por[a] || 0)}</td>`).join("")}<td>${w.rpeM ? w.rpeM.toFixed(1) : "–"}</td></tr>`).join("")}</tbody></table></div></details>`}`;
  el.onclick = el.onchange = null;
  if(!D.hs.length) return;
  const pintar = () => {
    if(!el.isConnected) return;
    for(const box of el.querySelectorAll("[data-cv]")){
      const w = Math.max(260, Math.floor(box.clientWidth || 320)), k = box.dataset.cv;
      box.innerHTML = k === "min" ? colMin(D, w) : k === "arte" ? colArte(D, w) : k === "rpe" ? lineRpe(D, w) : heat(D, w);
      tips(box);
    }
  };
  pintar();
  /* al cambiar el ancho se redibuja (el texto no se estira) */
  /* uno solo a la vez: cada repintado de la vista (p. ej. tras sincronizar) reemplaza al anterior */
  if(prevOnR) removeEventListener("resize", prevOnR);
  const onR = prevOnR = debounce(() => { if(!el.isConnected || !el.querySelector("[data-cv]")){ removeEventListener("resize", onR); if(prevOnR === onR) prevOnR = null; return; } pintar(); }, 150);
  addEventListener("resize", onR);
  return () => { removeEventListener("resize", onR); if(prevOnR === onR) prevOnR = null; };
}

/* ---------- piezas ---------- */
const H = 180, PAD = {l: 34, r: 8, t: 12, b: 24};
const niceMax = v => { if(v <= 0) return 60; const p = 10 ** Math.floor(Math.log10(v)), n = v / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; };
/* barra con la punta redondeada (4px) y la base recta */
const bar = (x, y, w, h, r = 4) => { if(h <= 0) return ""; r = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`; };
function ejes(w, max, n = 12, lbl = i => ""){
  const ih = H - PAD.t - PAD.b, ticks = [0, max / 2, max];
  return ticks.map(v => { const y = PAD.t + ih - v / max * ih; return `<line class="cv-grid" x1="${PAD.l}" x2="${w - PAD.r}" y1="${y}" y2="${y}"/><text class="cv-ax" x="${PAD.l - 6}" y="${y}" dy=".32em" text-anchor="end">${fmtN(v)}</text>`; }).join("")
    + Array.from({length: n}, (_, i) => lbl(i)).join("");
}
const xLbl = (D, w) => i => { const bw = (w - PAD.l - PAD.r) / 12; return i % 3 === 0 ? `<text class="cv-ax" x="${PAD.l + bw * i + bw / 2}" y="${H - 6}" text-anchor="middle">${esc(corto(D.W[i].l))}</text>` : ""; };
const svg = (w, body, lab) => `<svg class="cv-svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="${esc(lab)}">${body}</svg><div class="cv-tip" hidden></div>`;
/* zona de toque por columna (más grande que la barra) */
const hit = (D, w, i, txt) => { const bw = (w - PAD.l - PAD.r) / 12;
  return `<rect class="cv-hit" x="${PAD.l + bw * i}" y="${PAD.t}" width="${bw}" height="${H - PAD.t - PAD.b}" tabindex="0" data-tip="${esc(txt)}"/>`; };
const semTxt = w => t("Semana del {f}", {f: corto(w.l)});

function colMin(D, w){
  const max = niceMax(Math.max(...D.W.map(x => x.min))), ih = H - PAD.t - PAD.b, bw = (w - PAD.l - PAD.r) / 12, cw = Math.min(24, bw - 6);
  const iMax = D.W.reduce((b, x, i) => x.min > D.W[b].min ? i : b, 0);
  return svg(w, ejes(w, max, 12, xLbl(D, w)) + D.W.map((x, i) => { const hh = x.min / max * ih, xx = PAD.l + bw * i + (bw - cw) / 2;
    return `<path class="cv-bar" d="${bar(xx, PAD.t + ih - hh, cw, hh)}" style="fill:var(--cv1)"/>${i === iMax && x.min ? `<text class="cv-val" x="${xx + cw / 2}" y="${PAD.t + ih - hh - 4}" text-anchor="middle">${fmtN(x.min)}</text>` : ""}`; }).join("")
    + D.W.map((x, i) => hit(D, w, i, `${semTxt(x)}|${t("{n} min", {n: fmtN(x.min)})}|${tn(x.n, "1 sesión", "{n} sesiones")}`)).join(""), t("Minutos por semana"));
}
function colArte(D, w){
  const max = niceMax(Math.max(...D.W.map(x => x.min))), ih = H - PAD.t - PAD.b, bw = (w - PAD.l - PAD.r) / 12, cw = Math.min(24, bw - 6);
  const legend = `<div class="cv-leg">${D.artes.map(a => `<span><i style="background:${color(a)}"></i>${esc(nomArte(a))}</span>`).join("")}</div>`;
  return legend + svg(w, ejes(w, max, 12, xLbl(D, w)) + D.W.map((x, i) => {
    let y = PAD.t + ih; const xx = PAD.l + bw * i + (bw - cw) / 2, segs = D.artes.filter(a => x.por[a] > 0);
    return segs.map((a, j) => { const hh = x.por[a] / max * ih; y -= hh; const top = j === segs.length - 1;
      /* 2px de separación (color de la superficie) entre segmentos */
      const g = j ? 2 : 0;
      return top ? `<path class="cv-bar" d="${bar(xx, y, cw, Math.max(0, hh - g))}" style="fill:${color(a)}"/>` : `<rect class="cv-bar" x="${xx}" y="${y}" width="${cw}" height="${Math.max(0, hh - g)}" style="fill:${color(a)}"/>`; }).join("");
  }).join("") + D.W.map((x, i) => hit(D, w, i, [semTxt(x), ...D.artes.filter(a => x.por[a] > 0).map(a => `${fmtN(x.por[a])} min · ${nomArte(a)}~${color(a)}`), t("Total {n} min", {n: fmtN(x.min)})].join("|"))).join(""), t("Minutos por arte"));
}
function lineRpe(D, w){
  const ih = H - PAD.t - PAD.b, bw = (w - PAD.l - PAD.r) / 12, X = i => PAD.l + bw * i + bw / 2, Y = v => PAD.t + ih - v / 10 * ih;
  const pts = D.W.map((x, i) => x.rpeM != null ? [X(i), Y(x.rpeM), i] : null);
  let d = "", on = false;
  for(const p of pts){ if(!p){ on = false; continue; } d += `${on ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`; on = true; }
  const last = [...pts].reverse().find(Boolean);
  const body = [0, 5, 10].map(v => `<line class="cv-grid" x1="${PAD.l}" x2="${w - PAD.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="cv-ax" x="${PAD.l - 6}" y="${Y(v)}" dy=".32em" text-anchor="end">${v}</text>`).join("")
    + D.W.map((_, i) => xLbl(D, w)(i)).join("")
    + `<path class="cv-line" d="${d}" style="stroke:var(--cv1)"/>`
    + pts.filter(Boolean).map(p => `<circle class="cv-dot" cx="${p[0]}" cy="${p[1]}" r="4" style="fill:var(--cv1)"/>`).join("")
    + (last ? `<text class="cv-val" x="${Math.min(last[0], w - PAD.r - 12)}" y="${last[1] - 10}" text-anchor="middle">${D.W[last[2]].rpeM.toFixed(1)}</text>` : "")
    + `<line class="cv-cross" y1="${PAD.t}" y2="${PAD.t + ih}" x1="0" x2="0" hidden/>`
    + D.W.map((x, i) => hit(D, w, i, `${semTxt(x)}|${x.rpeM != null ? t("RPE {n}", {n: x.rpeM.toFixed(1)}) : t("Sin RPE")}|${x.rpe.length ? tn(x.rpe.length, "1 sesión", "{n} sesiones") : ""}`).replace("<rect", `<rect data-cx="${X(i)}"`)).join("");
  return (pts.some(Boolean) ? "" : `<p class="muted small">${t("Marca el RPE al terminar cada sesión para ver la tendencia.")}</p>`) + svg(w, body, t("Esfuerzo percibido (RPE)"));
}
/* mapa de calor de 16 semanas: una sola tonalidad, de claro a oscuro según los minutos del día */
function heat(D, w){
  const l0 = E.lunes(today()), cols = 16, lw = 30, gap = 3;
  const cs = Math.max(10, Math.min(22, Math.floor((w - lw) / cols) - gap)), hh = 7 * (cs + gap) + 22;
  const nivel = m => !m ? 0 : m < 30 ? 1 : m < 60 ? 2 : m < 90 ? 3 : 4;
  let body = "";
  [0, 2, 4].forEach(r => { body += `<text class="cv-ax" x="0" y="${r * (cs + gap) + cs / 2}" dy=".32em">${esc(t(E.DIAS_C[r]))}</text>`; });
  for(let c = 0; c < cols; c++){
    const lu = addDays(l0, -7 * (cols - 1 - c));
    if(c % 4 === 0) body += `<text class="cv-ax" x="${lw + c * (cs + gap)}" y="${7 * (cs + gap) + 12}">${esc(corto(lu))}</text>`;
    for(let r = 0; r < 7; r++){
      const f = addDays(lu, r); if(f > today()) continue;
      const m = D.dia[f] || 0;
      body += `<rect class="cv-hc h${nivel(m)}" x="${lw + c * (cs + gap)}" y="${r * (cs + gap)}" width="${cs}" height="${cs}" rx="3" tabindex="-1" data-tip="${esc(`${fmtDate(f)}|${m ? t("{n} min", {n: fmtN(m)}) : t("Sin entreno")}`)}"/>`;
    }
  }
  const leg = `<div class="cv-leg hm"><span>${t("Menos")}</span>${[0, 1, 2, 3, 4].map(n => `<i class="h${n}"></i>`).join("")}<span>${t("Más")}</span></div>`;
  return `<svg class="cv-svg" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" role="img" aria-label="${esc(t("Días activos"))}">${body}</svg><div class="cv-tip" hidden></div>${leg}`;
}
function hbars(tt, xs, c){
  const max = Math.max(1, ...xs.map(x => x[1]));
  return `<div class="en-hb"><h4>${esc(tt)}</h4>${xs.length ? xs.map(([k, n]) => `<div class="en-hb-r"><span class="en-hb-l">${esc(k)}</span><span class="en-hb-t"><i style="width:${n / max * 100}%;background:${c}"></i></span><b>${n}</b></div>`).join("")
    : `<p class="muted small">${t("Sin datos todavía")}</p>`}</div>`;
}

let prevOnR = null;
/* aviso flotante: valor primero, luego la etiqueta; con raya del color de la serie (texto con textContent) */
/* los manejadores se ponen una sola vez por caja (la caja es la misma en cada repintado, solo cambia su contenido)
   y buscan el aviso y la raya al momento */
function tips(box){
  if(box._tips) return;
  box._tips = true;
  const tip = () => box.querySelector(".cv-tip"), cross = () => box.querySelector(".cv-cross");
  const show = (tg, ev) => {
    const tp = tip(), cr = cross(); if(!tp) return;
    const ps = tg.dataset.tip.split("|").filter(Boolean);
    tp.replaceChildren(...ps.map((p, i) => { const [txt, col] = p.split("~"), row = document.createElement("div");
      if(i === 0) row.className = "cv-tip-h"; if(col){ const k = document.createElement("i"); k.style.background = col; row.appendChild(k); }
      row.appendChild(document.createTextNode(txt)); return row; }));
    tp.hidden = false;
    const br = box.getBoundingClientRect(), r = tg.getBoundingClientRect();
    let x = (ev?.clientX ?? r.left + r.width / 2) - br.left + 12, y = r.top - br.top;
    if(x + tp.offsetWidth > br.width) x = Math.max(0, x - tp.offsetWidth - 24);
    tp.style.left = x + "px"; tp.style.top = Math.max(0, y) + "px";
    for(const o of box.querySelectorAll(".on")) o.classList.remove("on");
    tg.classList.add("on");
    if(cr && tg.dataset.cx){ cr.setAttribute("x1", tg.dataset.cx); cr.setAttribute("x2", tg.dataset.cx); cr.removeAttribute("hidden"); }
  };
  const hide = () => { const tp = tip(); if(tp) tp.hidden = true; cross()?.setAttribute("hidden", ""); for(const o of box.querySelectorAll(".on")) o.classList.remove("on"); };
  box.addEventListener("pointermove", e => { const tg = e.target.closest("[data-tip]"); tg ? show(tg, e) : hide(); });
  box.addEventListener("pointerleave", hide);
  box.addEventListener("focusin", e => { const tg = e.target.closest("[data-tip]"); if(tg) show(tg); });
  box.addEventListener("focusout", hide);
}
