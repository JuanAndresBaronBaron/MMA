/* Reportes del mes: cobrado vs esperado (12 meses), indicadores, tablas por método, concepto, disciplina, clase y deudores, con CSV. */
import * as S from "../store.js";
import {icon, avatar, emptyState, toast, haptic} from "../ui.js";
import {esc, money, today, MESES, fmtMonth, downloadText} from "../util.js";
import {reporteMes, ingresos12, ymMas} from "../cobros.js";
import {t, tn, locale} from "../i18n.js";

/* mes elegido: null = el actual al pintar */
const st = {ym: null};
const FRANJA = {mañana: "Mañana (antes de 12 m)", tarde: "Tarde (12 m a 6 pm)", noche: "Noche (desde 6 pm)"};
const pct = (a, b) => b ? Math.round(a / b * 100) : null;
const nombreMes = ym => { const [y, m] = ym.split("-").map(Number); return `${MESES[m - 1]} ${y}`; };
const compact = v => { try{ return new Intl.NumberFormat(locale(), {notation: "compact", maximumFractionDigits: 1}).format(v); }catch(e){ return String(Math.round(v)); } };

/* CSV con BOM (Excel abre bien las tildes); separador ; o , según la preferencia */
function csvTxt(rows, sep = S.pref("csvSep", ";")){
  return "﻿" + rows.map(r => r.map(c => { const s = String(c ?? ""); return s.includes(sep) || /["\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(sep)).join("\r\n");
}

export function render(el, opts){
  const acad = S.academy(), cur = acad.moneda || "COP", m$ = v => money(v, cur);
  const ymHoy = today().slice(0, 7), ym = st.ym && st.ym <= ymHoy ? st.ym : ymHoy;
  const r = reporteMes(ym), serie = ingresos12(ym + "-28");
  const deuda = r.deudores.reduce((s, d) => s + d.monto, 0), rec = pct(r.cobrado, r.esperado);
  const discN = id => { const d = S.get("disciplinas", id); return d ? t(d.nombre) : t("Sin disciplina"); };
  const clase = id => S.get("clases", id);
  const claseN = id => { const c = clase(id); if(!c) return t("Clase eliminada"); const d = S.get("disciplinas", c.disciplinaId); return `${c.nombre || (d ? t(d.nombre) : t("Clase"))} · ${diaCorto(c.dia)} ${c.hora || ""}`; };
  /* tablas: {k, titulo, ic, cols, rows: [[...celdas]], vacio} ; la primera celda es texto, el resto números */
  const tablas = [
    {k: "metodo", titulo: t("Por método de pago"), ic: "cash", cols: [t("Método"), t("Valor"), "%"],
      rows: Object.entries(r.porMetodo).sort((a, b) => b[1] - a[1]).map(([k, v]) => [t(k), v, pct(v, r.cobrado)]), money: [1]},
    {k: "concepto", titulo: t("Por concepto"), ic: "receipt", cols: [t("Concepto"), t("Valor"), "%"],
      rows: Object.entries(r.porConcepto).sort((a, b) => b[1] - a[1]).map(([k, v]) => [t(k), v, pct(v, r.cobrado)]), money: [1]},
    {k: "disciplina", titulo: t("Asistencias por disciplina"), ic: "belt", cols: [t("Disciplina"), t("Asistencias")],
      rows: r.porDisciplina.map(x => [discN(x.discId), x.n])},
    {k: "clase", titulo: t("Asistencias por clase"), ic: "clock", cols: [t("Clase"), t("Asistencias"), t("Promedio")],
      rows: r.porClase.map(x => [claseN(x.claseId), x.n, x.prom]), vacio: t("Las asistencias por clase aparecen cuando pasas lista desde el horario.")},
    {k: "franja", titulo: t("Asistencias por franja"), ic: "sun", cols: [t("Franja"), t("Asistencias")],
      rows: r.porFranja.some(x => x.n) ? r.porFranja.map(x => [t(FRANJA[x.franja]), x.n]) : [], vacio: t("Las asistencias por clase aparecen cuando pasas lista desde el horario.")},
    {k: "deudores", titulo: t("Deudores hoy"), ic: "alert", cols: [t("Alumno"), t("Teléfono"), t("Debe")],
      rows: r.deudores.map(x => [x.al.nombre, x.al.telefono || x.al.acudienteTel || "", x.monto]), money: [2], ids: r.deudores.map(x => x.al.id)},
  ];
  const celda = (tb, v, i) => i === 0 ? esc(v) : tb.money?.includes(i) ? esc(m$(v)) : v === null || v === undefined ? "–" : esc(i === 2 && tb.cols[2] === "%" ? v + " %" : v);
  /* tablas como listas agrupadas de Ajustes: encabezado de sección arriba, filas con separador inset; en metodo/concepto una barra fina con el % */
  const tabla = tb => `<div class="rp-blk" data-tb="${tb.k}">
    <h3 class="section-header rp-sh"><span>${esc(tb.titulo)}</span>${tb.rows.length ? `<button type="button" class="btn-link rp-csv" data-csv="${tb.k}" aria-label="${esc(t("Descargar CSV") + ": " + tb.titulo)}">${icon("download", "inline")}<span>CSV</span></button>` : ""}</h3>
    <section class="card flush rp-card">
    ${tb.rows.length ? `<div class="rp-tw"><table class="tbl rp-tbl ${tb.cols[2] === "%" ? "rp-pct" : ""}"><thead><tr>${tb.cols.map((c, i) => `<th class="${i ? "num" : ""}" scope="col">${esc(c)}</th>`).join("")}</tr></thead>
    <tbody>${tb.rows.slice(0, tb.k === "deudores" ? 50 : 30).map((row, j) => `<tr>${row.map((v, i) => `<td class="${i ? "num" : ""}">${i === 0 && tb.ids ? `<a href="#/alumno/${tb.ids[j]}">${avatar(S.get("alumnos", tb.ids[j]), 28)}<span>${esc(v)}</span></a>`
      : i === 0 && tb.cols[2] === "%" ? `<span class="rp-lbl">${esc(v)}</span><i class="rp-meter" aria-hidden="true"><i style="width:${Math.max(2, row[2] || 0)}%"></i></i>` : celda(tb, v, i)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
      : `<p class="rp-empty">${esc(tb.vacio || t("Sin datos este mes."))}</p>`}
  </section></div>`;

  const vacio = !S.inAcad("pagos").length && !S.inAcad("alumnos").length;
  const R = 34, C = 2 * Math.PI * R, recV = Math.max(0, Math.min(100, rec || 0));
  const tono = rec === null ? "" : rec >= 90 ? "ok" : rec >= 70 ? "warn" : "err";
  const stat = (lbl, val, sub, k, href) => `<${href ? `a href="${href}"` : "div"} class="rp-stat ${k}"><span class="rp-stat-l">${esc(lbl)}</span><b class="amount">${val}</b>${sub ? `<small>${esc(sub)}</small>` : ""}${href ? `<span class="rp-chev" aria-hidden="true">${icon("chevron")}</span>` : ""}</${href ? "a" : "div"}>`;
  el.innerHTML = `
  <div class="rp-tools">
    <div class="rp-month" role="group" aria-label="${t("Mes")}">
      <button type="button" class="icon-btn" data-mes="-1" aria-label="${t("Mes anterior")}">${icon("back")}</button>
      <b aria-live="polite">${esc(nombreMes(ym))}</b>
      <button type="button" class="icon-btn" data-mes="1" aria-label="${t("Mes siguiente")}" ${ym >= ymHoy ? "disabled" : ""}><span class="rp-flip">${icon("back")}</span></button>
    </div>
    <span class="rp-sp"></span>
    <label class="rp-sep"><span>${t("Separador CSV")}</span><select id="csvSep" aria-label="${t("Separador CSV")}"><option value=";" ${S.pref("csvSep", ";") === ";" ? "selected" : ""}>; (Excel)</option><option value="," ${S.pref("csvSep", ";") === "," ? "selected" : ""}>,</option></select></label>
    <button type="button" class="btn gray small" data-csvall aria-label="${t("Todo en CSV")}">${icon("download")}<span>${t("Todo en CSV")}</span></button>
    <button type="button" class="btn primary small" data-print aria-label="${t("Imprimir")}">${icon("print")}<span>${t("Imprimir")}</span></button>
  </div>
  <h2 class="rp-print-h">${esc(acad.nombre || "")} · ${esc(t("Reporte de {mes}", {mes: nombreMes(ym)}))}</h2>
  ${vacio ? `<div class="card">${emptyState({icon: "chart", title: t("Aún no hay datos para reportar"), text: t("Agrega alumnos y registra pagos: aquí verás cuánto cobras cada mes frente a lo esperado."), cta: {label: t("Ir a Alumnos"), href: "#/alumnos"}})}</div>` : ""}
  <section class="card rp-hero">
    <div class="rp-hero-m">
      <span class="rp-eyebrow">${t("Cobrado")}</span>
      <b class="rp-big amount">${m$(r.cobrado)}</b>
      <span class="rp-hero-s">${esc(t("de {monto} esperado", {monto: m$(r.esperado)}))}</span>
    </div>
    <div class="rp-ring ${tono}" role="img" aria-label="${esc(t("Recaudo") + ": " + (rec === null ? "–" : rec + " %"))}">
      <svg viewBox="0 0 80 80" aria-hidden="true"><circle class="rp-ring-t" cx="40" cy="40" r="${R}"/>${rec ? `<circle class="rp-ring-v" cx="40" cy="40" r="${R}" stroke-dasharray="${(C * recV / 100).toFixed(1)} ${C.toFixed(1)}" style="--c:${C.toFixed(1)}"/>` : ""}</svg>
      <span><b class="amount">${rec === null ? "–" : rec + "<small>%</small>"}</b><em>${t("Recaudo")}</em></span>
    </div>
  </section>
  <section class="card rp-stats">
    ${stat(t("Deuda hoy"), esc(m$(deuda)), tn(r.deudores.length, "1 alumno", "{n} alumnos"), "err", "#/pagos")}
    ${stat(t("Pagos registrados"), r.pagos, "", "")}
    ${stat(t("Asistencias"), r.asistencias, "", "info")}
    ${stat(t("Alumnos nuevos"), r.nuevos.length, "", "ok")}
    ${stat(t("Bajas"), r.bajas.length, "", "warn")}
    ${stat(t("Esperado"), esc(m$(r.esperado)), "", "gold")}
  </section>
  <h3 class="section-header rp-sh"><span>${t("Cobrado vs esperado · 12 meses")}</span></h3>
  <section class="card rp-chart-card">
    <div class="rp-ch-h">
      <div class="rp-ch-v"><span class="rp-eyebrow">${esc(nombreMes(ym))}</span><b class="amount">${m$(r.cobrado)}</b></div>
      <div class="rp-legend" aria-hidden="true"><span><i class="lg-bar"></i>${t("Cobrado")}</span><span><i class="lg-line"></i>${t("Esperado")}</span></div>
    </div>
    <div class="rp-chart" data-chart role="group" aria-label="${esc(t("Cobrado vs esperado · 12 meses"))}"></div>
    <details class="rp-data"><summary>${t("Ver como tabla")}</summary>
      <div class="rp-tw"><table class="tbl rp-tbl"><thead><tr><th scope="col">${t("Mes")}</th><th class="num" scope="col">${t("Cobrado")}</th><th class="num" scope="col">${t("Esperado")}</th><th class="num" scope="col">${t("Recaudo")}</th></tr></thead>
      <tbody>${serie.map(x => `<tr class="${x.ym === ym ? "on" : ""}"><td>${esc(nombreMes(x.ym))}</td><td class="num">${esc(m$(x.cobrado))}</td><td class="num">${esc(m$(x.esperado))}</td><td class="num">${pct(x.cobrado, x.esperado) ?? "–"}${x.esperado ? " %" : ""}</td></tr>`).join("")}</tbody></table></div>
    </details>
  </section>
  <p class="section-footer rp-note">${t("Esperado = lo que suman los planes de los alumnos activos ese mes (un plan trimestral cuenta un tercio por mes; becas y pago por clase no suman).")}</p>
  ${r.nuevos.length || r.bajas.length ? `<div class="rp-mov">
    <div class="rp-blk"><h3 class="section-header rp-sh"><span><i class="rp-dot ok" aria-hidden="true"></i>${t("Nuevos")}</span><span class="amount">${r.nuevos.length}</span></h3><div class="card flush rp-card"><div class="list">${r.nuevos.slice(0, 12).map(a => `<a class="li rp-al" href="#/alumno/${a.id}">${avatar(a, 32)}<span>${esc(a.nombre)}</span></a>`).join("") || `<p class="rp-empty">${t("Sin datos este mes.")}</p>`}</div></div></div>
    <div class="rp-blk"><h3 class="section-header rp-sh"><span><i class="rp-dot err" aria-hidden="true"></i>${t("Bajas")}</span><span class="amount">${r.bajas.length}</span></h3><div class="card flush rp-card"><div class="list">${r.bajas.slice(0, 12).map(a => `<a class="li rp-al" href="#/alumno/${a.id}">${avatar(a, 32)}<span>${esc(a.nombre)}</span></a>`).join("") || `<p class="rp-empty">${t("Sin datos este mes.")}</p>`}</div></div></div>
  </div>` : ""}
  <div class="rp-grid">${tablas.map(tabla).join("")}</div>`;

  const box = el.querySelector("[data-chart]");
  const draw = grow => chart(box, serie, ym, m$, sel => { st.ym = sel; haptic("selection"); render(el, {keep: true}); el.querySelector(`.rp-col[data-i="${serie.findIndex(x => x.ym === sel)}"]`)?.focus({preventScroll: true}); }, grow);
  draw(!opts?.keep);
  let w0 = box.clientWidth;
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { if(Math.abs(box.clientWidth - w0) > 4){ w0 = box.clientWidth; draw(false); } }) : null;
  ro?.observe(box);

  const nombreArch = k => `${(acad.nombre || "academia").replace(/[^\wÀ-ſ]+/g, "-").toLowerCase()}-${k}-${ym}.csv`;
  const filasCsv = tb => [tb.cols, ...tb.rows];
  el.querySelector("#csvSep").onchange = e => S.setPref("csvSep", e.target.value);
  el.onclick = e => {
    const mb = e.target.closest("[data-mes]");
    if(mb){ st.ym = ymMas(ym, +mb.dataset.mes); if(st.ym > ymHoy) st.ym = ymHoy; haptic("selection"); render(el, {keep: true}); el.querySelector(`[data-mes="${mb.dataset.mes}"]`)?.focus({preventScroll: true}); return; }
    if(e.target.closest("[data-print]")) return window.print();
    const cb = e.target.closest("[data-csv]");
    if(cb){ const tb = tablas.find(x => x.k === cb.dataset.csv); downloadText(nombreArch(tb.k), "text/csv;charset=utf-8", csvTxt(filasCsv(tb))); toast(t("CSV descargado")); return; }
    if(e.target.closest("[data-csvall]")){
      const rows = [[t("Reporte de {mes}", {mes: nombreMes(ym)}), acad.nombre || ""], [],
        [t("Cobrado"), r.cobrado], [t("Esperado"), r.esperado], [t("Recaudo"), rec === null ? "" : rec + " %"], [t("Deuda hoy"), deuda], [t("Alumnos nuevos"), r.nuevos.length], [t("Bajas"), r.bajas.length], [t("Asistencias"), r.asistencias], [],
        [t("Mes"), t("Cobrado"), t("Esperado")], ...serie.map(x => [x.ym, x.cobrado, x.esperado])];
      for(const tb of tablas) if(tb.rows.length) rows.push([], [tb.titulo], ...filasCsv(tb));
      downloadText(nombreArch("reporte"), "text/csv;charset=utf-8", csvTxt(rows)); toast(t("CSV descargado"));
    }
  };
  return () => ro?.disconnect();
}

const diaCorto = d => { try{ return new Intl.DateTimeFormat(locale(), {weekday: "short"}).format(new Date(2024, 0, 7 + (+d || 0))); }catch(e){ return ""; } };

/* columnas SVG al estilo Salud/Apple Card: barras redondeadas (cobrado), marca del esperado, cuadrícula suave con el eje a la derecha;
   pasar el puntero o enfocar muestra una regla y un globo con el detalle; tocar un mes lo elige */
function chart(box, serie, ym, m$, onPick, grow){
  const W = Math.max(280, box.clientWidth || 600), H = W < 520 ? 200 : 236;
  const padL = 4, padR = 44, padT = 16, padB = 26, iw = W - padL - padR, ih = H - padT - padB;
  const max = Math.max(1, ...serie.flatMap(x => [x.cobrado, x.esperado]));
  /* escala con 3 líneas «redondas» */
  const paso = (() => { const raw = max / 3, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p; })();
  const top = paso * Math.ceil(max / paso), y = v => padT + ih - v / top * ih;
  const band = iw / serie.length, bw = Math.max(6, Math.min(22, band * .5)), tw = Math.min(30, band * .78);
  const grid = [];
  for(let v = 0; v <= top + 1e-6; v += paso) grid.push(`<line x1="${padL}" x2="${W - padR + 4}" y1="${y(v)}" y2="${y(v)}" class="${v ? "rp-grid-l" : "rp-base"}"/><text x="${W - padR + 10}" y="${y(v) + 4}" class="rp-ax">${esc(compact(v))}</text>`);
  const cols = serie.map((x, i) => {
    const cx = padL + band * i + band / 2, h = Math.max(0, y(0) - y(x.cobrado)), r = Math.min(bw / 2, 6, h);
    const xb = cx - bw / 2, yb = y(x.cobrado);
    const path = h > 0 ? `M${xb} ${y(0)}V${yb + r}Q${xb} ${yb} ${xb + r} ${yb}H${xb + bw - r}Q${xb + bw} ${yb} ${xb + bw} ${yb + r}V${y(0)}Z` : "";
    const on = x.ym === ym, p = x.esperado ? Math.round(x.cobrado / x.esperado * 100) : null;
    const lbl = `${fmtMonth(x.ym)}: ${t("Cobrado")} ${m$(x.cobrado)}, ${t("Esperado")} ${m$(x.esperado)}${p === null ? "" : `, ${p} %`}`;
    return `<g class="rp-col ${on ? "on" : ""}" data-i="${i}" tabindex="${on ? 0 : -1}" role="button" aria-pressed="${on}" aria-label="${esc(lbl)}" style="--i:${i}">
      <rect class="rp-hit" x="${padL + band * i}" y="${padT - 14}" width="${band}" height="${ih + 14 + padB}" rx="8"/>
      <line class="rp-rule" x1="${cx}" x2="${cx}" y1="${padT - 14}" y2="${y(0)}"/>
      ${path ? `<path class="rp-bar ${grow ? "grow" : ""}" d="${path}"/>` : ""}
      ${x.esperado ? `<line class="rp-exp" x1="${cx - tw / 2}" x2="${cx + tw / 2}" y1="${y(x.esperado)}" y2="${y(x.esperado)}"/>` : ""}
      <text class="rp-ax rp-mx ${on ? "on" : ""}" x="${cx}" y="${H - 6}" text-anchor="middle">${esc(mesCorto(x.ym, W))}</text></g>`;
  }).join("");
  box.innerHTML = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${grid.join("")}${cols}</svg><div class="rp-tip" role="status" hidden></div>`;
  const tip = box.querySelector(".rp-tip");
  const show = g => {
    const x = serie[+g.dataset.i], p = x.esperado ? Math.round(x.cobrado / x.esperado * 100) : null;
    tip.replaceChildren();
    const hd = document.createElement("b"); hd.textContent = nombreMes(x.ym); tip.append(hd);
    for(const [k, v, cls] of [[t("Cobrado"), m$(x.cobrado), "k-bar"], [t("Esperado"), m$(x.esperado), "k-line"]]){
      const row = document.createElement("span"); row.className = "rp-tr";
      const key = document.createElement("i"); key.className = cls;
      const lab = document.createElement("em"); lab.textContent = k;
      const val = document.createElement("strong"); val.textContent = v;
      row.append(key, lab, val); tip.append(row);
    }
    if(p !== null){ const row = document.createElement("span"); row.className = "rp-tr rp-tp"; row.textContent = t("Recaudo") + ": " + p + " %"; tip.append(row); }
    for(const o of box.querySelectorAll(".rp-col.hov")) o.classList.remove("hov");
    g.classList.add("hov");
    tip.hidden = false;
    const cx = padL + band * (+g.dataset.i) + band / 2, tw2 = tip.offsetWidth;
    tip.style.left = Math.max(0, Math.min(W - tw2, cx - tw2 / 2)) + "px";
    tip.style.top = (-tip.offsetHeight - 6) + "px";
    tip.classList.remove("in"); void tip.offsetWidth; tip.classList.add("in");
  };
  const hide = () => { tip.hidden = true; for(const o of box.querySelectorAll(".rp-col.hov")) o.classList.remove("hov"); };
  const gs = [...box.querySelectorAll(".rp-col")];
  for(const g of gs){
    g.addEventListener("pointerenter", e => { if(e.pointerType === "mouse") show(g); });
    g.addEventListener("pointerleave", e => { if(e.pointerType === "mouse") hide(); });
    g.addEventListener("focus", () => show(g));
    g.addEventListener("blur", hide);
    const pick = () => { const v = serie[+g.dataset.i].ym; if(v !== ym) onPick(v); else show(g); };
    g.addEventListener("click", pick);
    g.addEventListener("keydown", e => {
      if(e.key === "Enter" || e.key === " "){ e.preventDefault(); pick(); return; }
      /* flechas: recorre los meses como un control de gráfico de iOS (sin elegir hasta Enter) */
      const d = e.key === "ArrowLeft" ? -1 : e.key === "ArrowRight" ? 1 : e.key === "Home" ? -99 : e.key === "End" ? 99 : 0;
      if(!d) return;
      e.preventDefault();
      const n = gs[Math.max(0, Math.min(gs.length - 1, +g.dataset.i + d))];
      if(n && n !== g){ g.tabIndex = -1; n.tabIndex = 0; n.focus(); }
    });
  }
}
/* en el celular solo la inicial del mes */
const mesCorto = (ym, W) => { const s = fmtMonth(ym).split(" ")[0]; return W < 420 ? s.slice(0, 1).toUpperCase() : s; };
