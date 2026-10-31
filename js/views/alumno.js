import * as S from "../store.js";
import {icon, avatar, belt, emptyState, pill, rankLabel, confirmDlg, toast, modal, shareOrDownload, haptic} from "../ui.js";
import {esc, age, fmtDate, fmtDuration, money, waLink, today, addDays, daysBetween, relDays, clamp} from "../util.js";
import {studentForm, paymentModal, promotionModal, quickPay} from "../forms.js";
import {STATUS, planById, GEAR} from "../catalog.js";
import {t, tn, lang} from "../i18n.js";
import {deuda, pillTxt, estadoPago, estadoEf} from "../cobros.js";
import * as E from "../evaluacion.js";
import {badges} from "./grados.js";
import {fichaUrl} from "../ficha-link.js";

/* módulos opcionales (tiquetera y carné, riesgo): si faltan, la ficha sigue sin esas tarjetas */
const M = {};
function opcionales(el, id, ctx){
  const again = () => { if(el.isConnected && location.hash.startsWith("#/alumno/" + id)) render(el, [id], ctx); };
  for(const [k, f] of [["clases", () => import("../clases.js")], ["ret", () => import("../retencion.js")]])
    if(!(k in M)){ M[k] = null; f().then(m => { M[k] = m; again(); }).catch(() => {}); }
  if(!E.listo()) E.precargar().then(ok => ok && again());
}
const TIPOS = {general: "General", tecnica: "Técnica", lesion: "Lesión", conducta: "Conducta"};
const notasDe = id => S.all("notas").filter(n => n.alumnoId === id).sort((x, y) => (y.fecha || "").localeCompare(x.fecha || "") || y._c - x._c);

/* pestaña elegida y historiales abiertos: se reinician al cambiar de alumno */
let tab = "", tabDe = "", abiertos = new Set();
/* cambio de pestaña: el deslizador viaja desde la pestaña anterior y el panel entra con un fundido corto */
let anim = false, fromRect = null;
const TABS = [["grados", "Grados", "belt"], ["asistencia", "Asistencia", "calendar"], ["pagos", "Pagos", "cash"], ["notas", "Notas", "book"], ["info", "Ficha", "users"], ["equipo", "Equipo", "bag"]];
const TL_MAX = 5;

export function render(el, [id], ctx){
  const a = S.get("alumnos", id);
  if(!a){ el.innerHTML = emptyState({icon: "users", title: t("Alumno no encontrado"), text: t("Puede que se haya eliminado."), cta: {label: t("Ver alumnos"), href: "#/alumnos"}}); return; }
  const acad = S.academy(), cur = acad.moneda || "COP";
  const e = estadoPago(a, acad.avisoDias ?? 5), dd = deuda(a), debeTxt = pillTxt(a, e, dd), monto = dd.monto || S.valorPlan(a);
  if(tabDe !== id){ tabDe = id; abiertos = new Set(); tab = e.k === "vencido" ? "pagos" : "grados"; }
  opcionales(el, id, ctx);
  if(ctx?.setTitle) ctx.setTitle(a.nombre); else { const ti = document.querySelector("#title"); if(ti) ti.textContent = a.nombre; }
  const stats = S.asistenciaStats(a.id);
  const sede = S.get("sedes", a.sedeId);
  const discs = (a.disciplinaIds || []).map(i => S.get("disciplinas", i)).filter(Boolean);
  const tel = a.telefono || a.acudienteTel;
  const wa = waLink(tel, t("Hola {nombre}, te escribimos de {academia}.", {nombre: a.nombre.split(" ")[0], academia: acad.nombre}));
  /* fila de ajustes: etiqueta a la izquierda, valor a la derecha; href hace el valor tocable (tel:, mailto:) */
  const info = (k, v, href) => v ? `<div class="row-inset pf-kv"><span class="k">${esc(k)}</span>${href ? `<a class="row-val v pf-link" href="${esc(href)}">${esc(v)}</a>` : `<span class="row-val v">${esc(v)}</span>`}</div>` : "";
  const grp = (title, rows, empty) => rows || empty ? `<div class="pf-grp"><h3 class="section-header">${esc(title)}</h3><div class="grouped">${rows || `<div class="row-inset"><span class="muted">${esc(empty)}</span></div>`}</div></div>` : "";
  const telH = x => x ? "tel:" + String(x).replace(/[^\d+]/g, "") : "";

  const gradosHtml = discs.length ? discs.map(d => {
    const h = S.gradosDe(a.id, d.id);
    const g = h[h.length - 1];
    const ini = g ? S.inicioCinturon(h) : null;
    const n = S.siguiente(a.id, d);
    const clases = g ? S.asistenciasDe(a.id, g.fecha, d.id) : 0;
    const pct = n && n.min ? clamp(n.meses / n.min * 100, 0, 100) : 100;
    const rapid = new Set(S.promocionesRapidas(a.id, d).map(r => r.g.id));
    return `<div class="disc-block">
      <div class="pf-dh"><h3><span class="disc-tag" style="--c:${d.color}">${esc(S.discCorto(d))}</span>${esc(t(d.nombre))}</h3>
        <button class="btn small tinted" data-promo="${d.id}">${icon("plus")}<span>${t("Promoción")}</span></button></div>
      ${g ? `<div class="card pf-rank">
        <div class="cur-rank">
          <div class="cur-belt">${belt(d, g.rank, g.grado, {w: 240, h: 36})}</div>
          <div class="cur-txt"><b>${esc(rankLabel(d, g))}</b>
            <span class="muted small">${t("Desde {fecha} · hace {tiempo}", {fecha: fmtDate(g.fecha), tiempo: fmtDuration(g.fecha)})}</span>
            ${ini && ini.id !== g.id ? `<span class="muted small">${t("En {cinturon} desde {fecha} ({tiempo})", {cinturon: esc(t(S.rankDef(d, g.rank).n)), fecha: fmtDate(ini.fecha), tiempo: fmtDuration(ini.fecha)})}</span>` : ""}
            <span class="muted small">${tn(clases, "1 clase registrada desde la última promoción", "{n} clases registradas desde la última promoción")}</span></div>
        </div>
        ${n ? `<div class="pf-next ${n.listo ? "ready" : ""}"><div class="next-h"><span>${n.tipo === "grado" ? t("Siguiente grado") : t("Siguiente cinturón")}: <b>${esc(n.txt)}</b></span><span class="small pf-next-s">${n.listo ? `${icon("check")} ${t("Cumple el tiempo mínimo")}` : t("Recomendado desde {fecha}", {fecha: fmtDate(n.fecha)})}</span></div>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="${esc(t("{actual} de {minimo}", {actual: S.fmtMeses(n.meses), minimo: n.min ? S.fmtMeses(n.min) : t("sin mínimo")}))}"><span style="width:${pct}%"></span></div><span class="muted small">${t("{actual} de {minimo}", {actual: S.fmtMeses(n.meses), minimo: n.min ? S.fmtMeses(n.min) : t("sin mínimo")})}</span></div>` : ""}
        ${(() => { const r = E.readiness(a, d), cur = E.listo() && E.curriculo(d, g.rank);
          return `<div class="rd-card pf-rd ${r?.listo ? "ready" : ""}">${r ? `<div class="rd-card-h"><b>${r.listo ? `${icon("check")} ${t("Listo para promoción")}` : t("Preparación para {rank}", {rank: esc(r.n.txt)})}</b></div>${badges(r)}
            ${r.req?.criticosPend.length ? `<p class="small warn-t">${icon("star")} ${t("Críticos pendientes: {lista}", {lista: esc(r.req.criticosPend.slice(0, 3).map(x => x.txt).join(" · "))})}</p>` : ""}` : ""}
            <div class="rd-act">${cur ? `<button class="btn small gray" data-eval="${d.id}">${icon("target")}<span>${t("Evaluar")}</span></button>` : ""}<a class="btn small gray" href="#/certificado/${a.id}/${d.id}">${icon("award")}<span>${t("Certificado")}</span></a></div></div>`; })()}
        </div>
        <div class="card flush pf-tl-card"><ol class="pf-tl">${h.slice().reverse().slice(0, abiertos.has(d.id) ? h.length : TL_MAX).map((x, i) => `<li class="${rapid.has(x.id) ? "fast" : ""} ${i === 0 ? "now" : ""}">
          <span class="tl-belt">${belt(d, x.rank, x.grado, {w: 64, h: 12})}</span>
          <div class="tl-main"><b>${esc(rankLabel(d, x))}</b><span class="muted small">${fmtDate(x.fecha)}${x.profesor ? " · " + esc(x.profesor) : ""}${x.inicial ? " · " + t("al ingresar") : ""}</span>
          ${x.nota && !x.inicial ? `<span class="small muted">${esc(x.nota)}</span>` : ""}
          ${rapid.has(x.id) ? `<span class="small warn-t tl-warn">${icon("alert")} ${t("Se dio antes del tiempo recomendado")}</span>` : ""}</div>
          <button class="icon-btn" data-editg="${x.id}" title="${t("Editar")}" aria-label="${esc(t("Editar") + ": " + rankLabel(d, x))}">${icon("edit")}</button></li>`).join("")}</ol>
        ${h.length > TL_MAX ? `<button class="pf-more-row tl-more" data-tl="${d.id}" aria-expanded="${abiertos.has(d.id)}">${abiertos.has(d.id) ? t("Ver menos") : t("Ver historial completo ({n})", {n: h.length})}</button>` : ""}</div>`
      : `<div class="card pf-rank"><p class="muted">${t("Sin grado registrado. Registra su cinturón actual.")}</p></div>`}
    </div>`;
  }).join("") : `<div class="card">${emptyState({icon: "belt", title: t("Sin disciplinas"), text: t("Edita al alumno y elige qué disciplinas entrena."), cta: {label: t("Editar"), kind: "tinted", icon: "edit", attr: "data-edit"}})}</div>`;

  const pagos = S.pagosDe(a.id).slice(0, 24);
  const tq = M.clases?.saldoTiquetera?.(a);
  const tiqHtml = tq ? `<div class="card pf-tiq ${tq.vencida || !tq.saldo ? "bad" : tq.saldo <= 2 ? "low" : ""}"><div><b>${t("Tiquetera: {saldo} de {total} clases", {saldo: tq.saldo, total: tq.total})}</b>
      <span class="muted small">${tn(tq.usadas, "1 usada", "{n} usadas")}${tq.vence ? " · " + (tq.vencida ? t("venció el {fecha}", {fecha: fmtDate(tq.vence)}) : t("vence el {fecha}", {fecha: fmtDate(tq.vence)})) : ""}</span>
      <div class="progress thin"><span style="width:${tq.total ? clamp(tq.saldo / tq.total * 100, 0, 100) : 0}%"></span></div></div>
      ${(tq.vencida || tq.saldo <= 2) && waLink(a.telefono || a.acudienteTel, "x") ? `<a class="btn small gray" target="_blank" rel="noopener" href="${esc(waLink(a.telefono || a.acudienteTel, M.clases.msgRenovar(a, tq)))}">${icon("whatsapp")} ${t("Renovar")}</a>` : ""}</div>` : "";
  const pagosHtml = `<div class="card pf-pay ${e.k}">
      <div class="pf-pay-h"><span class="pf-pay-ic">${icon(e.k === "aldia" || e.k === "beca" ? "check" : e.k === "vencido" ? "alert" : "clock")}</span>
        <div class="pf-pay-t">${pill(e.k, debeTxt)}<span class="muted small">${e.vence ? (e.dias < 0 ? t("Venció el {fecha}", {fecha: fmtDate(e.vence)}) : t("Próximo pago: {fecha}", {fecha: fmtDate(e.vence)})) : ""}</span></div></div>
      <div class="pf-pay-b">${["vencido", "pronto"].includes(e.k) ? `<button class="btn filled" data-quick>${icon("check")}<span>${t("Pagó {valor}", {valor: money(monto, cur)})}</span></button>` : ""}<button class="btn gray" data-pay>${icon("plus")}<span>${t("Otro pago")}</span></button></div>
    </div>
    <div class="grouped">${info(t("Plan"), `${t(planById(a.plan).nombre)} · ${money(S.valorPlan(a), cur)}`)}</div>
    ${tiqHtml}
    <h3 class="section-header">${t("Pagos")}${pagos.length ? ` <span class="count-b">${pagos.length}</span>` : ""}</h3>
    ${pagos.length ? `<div class="card flush"><div class="list pf-list">${pagos.map(p => `<div class="li" data-editp="${p.id}" role="button" tabindex="0" aria-label="${esc(t("Editar") + ": " + money(p.monto, cur) + " · " + fmtDate(p.fecha))}"><span class="li-ic pf-ic-ok">${icon("cash")}</span><div class="li-main"><b><span class="tnum">${money(p.monto, cur)}</span> · ${esc(t(p.concepto || "Pago"))}</b><span class="muted small">${fmtDate(p.fecha)} · ${esc(t(p.metodo || ""))}${p.hasta ? " · " + t("cubre hasta {fecha}", {fecha: fmtDate(p.hasta)}) : ""}${p.nota ? " · " + esc(p.nota) : ""}</span></div><a class="icon-btn" href="#/recibo/${p.id}" title="${t("Ver recibo")}" aria-label="${t("Ver recibo")}">${icon("receipt")}</a><span class="chev" aria-hidden="true"></span></div>`).join("")}</div></div>`
      : `<div class="card"><p class="muted pf-none">${t("Sin pagos registrados.")}</p></div>`}`;

  const equipoHtml = `<div class="grouped pf-gear">${GEAR.map(g => { const x = a.equipo?.[g.k]; return `<div class="row-inset ${x?.tiene ? "has" : "no"}"><span class="row-ic" style="--rc:${x?.tiene ? "var(--system-green)" : "var(--system-gray)"}">${icon(x?.tiene ? "check" : "x")}</span><span class="pf-gear-n">${esc(t(g.n))}</span><span class="row-val">${x?.tiene ? (x.talla ? t("Talla {talla}", {talla: esc(x.talla)}) : t("Tiene")) : t("No tiene")}</span></div>`; }).join("")}</div>
    ${a.talla ? `<p class="section-footer pf-foot">${t("Talla de ropa: {talla}", {talla: esc(a.talla)})}</p>` : ""}`;

  const infoHtml = `<div class="pf-info">
    ${grp(t("Datos personales"), `${info(t("Documento"), a.documento)}${info(t("Nacimiento"), a.nacimiento ? `${fmtDate(a.nacimiento)} (${tn(age(a.nacimiento), "1 año", "{n} años")})` : "")}${info(t("Género"), {M: t("Masculino"), F: t("Femenino"), O: t("Otro")}[a.genero])}${info(t("Peso"), a.peso ? a.peso + " kg" : "")}${info(t("Estatura"), a.estatura ? a.estatura + " cm" : "")}${info(t("Ingreso"), a.fechaInicio ? `${fmtDate(a.fechaInicio)} (${fmtDuration(a.fechaInicio)})` : "")}`, t("Sin registrar"))}
    ${grp(t("Contacto"), `${info(t("Teléfono"), a.telefono, telH(a.telefono))}${info(t("Correo"), a.email, a.email ? "mailto:" + a.email : "")}${info(t("Dirección"), a.direccion)}${info(t("Acudiente"), a.acudiente)}${info(t("Tel. acudiente"), a.acudienteTel, telH(a.acudienteTel))}`, t("Sin registrar"))}
    <div class="pf-grp"><h3 class="section-header">${t("Salud")}</h3><div class="grouped">
      <div class="row-inset pf-blood"><span class="row-ic" style="--rc:var(--system-red)">${icon("drop")}</span><span class="k">${t("Tipo de sangre")}</span>${a.sangre ? `<span class="row-val v">${esc(a.sangre)}</span>` : `<span class="row-val">${t("Sin registrar")}</span>`}</div>
      ${info(t("EPS / seguro"), a.eps)}${info(t("Alergias"), a.alergias)}${info(t("Lesiones"), a.lesiones)}</div></div>
    <div class="pf-grp"><h3 class="section-header">${t("Emergencia")}</h3><div class="grouped">${info(t("Contacto"), a.emergencia)}${a.emergenciaTel ? `<a class="row-inset pf-call" href="${esc(telH(a.emergenciaTel))}"><span class="row-ic" style="--rc:var(--system-green)">${icon("phone")}</span><span class="pf-link">${esc(a.emergenciaTel)}</span></a>` : `<div class="row-inset"><span class="muted">${t("Sin contacto de emergencia.")}</span></div>`}</div></div>
    ${a.notas ? `<div class="pf-grp wide"><h3 class="section-header">${t("Notas")}</h3><div class="card"><p class="pre">${esc(a.notas)}</p></div></div>` : ""}
  </div>`;

  /* asistencia: KPIs, mapa de 12 semanas (columnas = semanas, filas = lunes…domingo) y últimas clases */
  const hoy = today(), ini = addDays(S.lunes(hoy), -77);
  const porDia = {};
  for(const c of stats.clases) porDia[c.fecha] = (porDia[c.fecha] || 0) + 1;
  const celdas = Array.from({length: 84}, (_, i) => {
    const f = addDays(ini, i), n = porDia[f] || 0;
    return `<i class="${n ? (n > 1 ? "l2" : "l1") : ""}${f > hoy ? " fut" : ""}${f === hoy ? " hoy" : ""}" title="${fmtDate(f)}${n ? " · " + tn(n, "1 clase", "{n} clases") : ""}"></i>`;
  }).join("");
  const dias = [t("L"), "", t("Mi"), "", t("V"), "", t("D")];
  const ultTxt = stats.ultima ? relDays(-stats.dias) : "–";
  const stat = (ic, col, v, lbl, cls = "") => `<div class="card pf-stat ${cls}" style="--sc:${col}"><span class="stat-l">${icon(ic)}</span><b class="stat-v">${v}</b><span class="stat-s">${lbl}</span></div>`;
  const asisHtml = stats.total ? `<div class="pf-stats">
      ${stat("calendar", "var(--accent2)", stats.mes, tn(stats.mes, "clase este mes", "clases este mes"))}
      ${stat("chart", "var(--info)", lang() === "en" ? stats.prom4sem : String(stats.prom4sem).replace(".", ","), t("por semana (últimas 4)"))}
      ${stat("clock", stats.dias >= 14 ? "var(--warn)" : "var(--muted)", esc(ultTxt), t("última clase"), "txt " + (stats.dias >= 14 ? "warn" : ""))}
      ${stat("flame", stats.rachaSemanas >= 4 ? "var(--ok)" : "var(--warn)", stats.rachaSemanas, tn(stats.rachaSemanas, "semana seguida", "semanas seguidas"), stats.rachaSemanas >= 4 ? "ok" : "")}
    </div>
    <h3 class="section-header">${t("Últimas 12 semanas")}</h3>
    <div class="card pf-heat"><div class="heat-wrap"><div class="heat-days" aria-hidden="true">${dias.map(x => `<span>${x}</span>`).join("")}</div><div class="heat" role="img" aria-label="${t("{n} clases en las últimas 12 semanas", {n: stats.clases.filter(c => c.fecha >= ini).length})}">${celdas}</div></div>
    <div class="heat-leg"><span>${t("Menos")}</span><i></i><i class="l1"></i><i class="l2"></i><span>${t("Más")}</span></div></div>
    <h3 class="section-header">${t("Últimas clases")} <span class="pf-sh-n">${tn(stats.total, "1 en total", "{n} en total")}</span></h3>
    <div class="card flush"><div class="list pf-list">${stats.clases.slice(0, 10).map(c => { const d = S.get("disciplinas", c.disciplinaId), sd = S.get("sedes", c.sedeId); return `<div class="li pf-cl"><span class="li-ic">${icon("calendar")}</span><div class="li-main"><b>${fmtDate(c.fecha, true)}</b><span class="muted small">${d ? `<span class="disc-tag" style="--c:${d.color}">${esc(S.discCorto(d))}</span>${esc(t(d.nombre))}` : ""}${sd ? " · " + esc(sd.nombre) : ""}</span></div><span class="muted small pf-rel">${esc(relDays(-daysBetween(c.fecha, hoy)))}</span></div>`; }).join("")}</div></div>`
    : `<div class="card">${emptyState({icon: "calendar", tone: "ok", title: t("Todavía no tiene asistencias registradas."), cta: {label: t("Pasar lista"), href: "#/asistencia", icon: "calendar", kind: "tinted"}})}</div>`;

  /* notas del profe: línea de tiempo con fecha y tipo; las archivadas se esconden */
  const notas = notasDe(a.id), act = notas.filter(n => n.activa !== false), arch = notas.filter(n => n.activa === false);
  const lesion = act.find(n => n.tipo === "lesion");
  const notaLi = n => `<li class="nt-${esc(n.tipo || "general")}"><div class="nt-h"><span class="nt-tipo">${esc(t(TIPOS[n.tipo] || TIPOS.general))}</span><span class="muted small">${fmtDate(n.fecha)}</span>
      <button class="btn-link small" data-arch="${n.id}">${n.activa === false ? t("Reactivar") : n.tipo === "lesion" ? t("Ya se recuperó") : t("Archivar")}</button></div><p class="pre">${esc(n.texto)}</p></li>`;
  const notasHtml = `<form class="card nt-add pf-nform" data-nform>
      <div class="seg pf-ntype" role="radiogroup" aria-label="${t("Tipo de nota")}">${Object.entries(TIPOS).map(([k, v], i) => `<label><input type="radio" name="tipo" value="${k}" ${!i ? "checked" : ""}><span>${t(v)}</span></label>`).join("")}</div>
      <label class="sr" for="ntTxt">${t("Nota")}</label><textarea id="ntTxt" name="texto" rows="2" placeholder="${t("Ej: le cuesta la base en la guardia; dolor en la rodilla izquierda")}"></textarea>
      <div class="pf-nrow"><input type="date" name="fecha" value="${today()}" aria-label="${t("Fecha")}"><button class="btn filled small" type="submit">${icon("plus")}<span>${t("Agregar nota")}</span></button></div></form>
    ${act.length ? `<div class="card pf-notes"><ol class="nt-tl">${act.map(notaLi).join("")}</ol></div>` : `<p class="section-footer pf-foot">${t("Sin notas. Anota avances técnicos, lesiones o conducta para no olvidarlos.")}</p>`}
    ${arch.length ? `<details class="nt-arch pf-arch"><summary>${t("Archivadas ({n})", {n: arch.length})}</summary><div class="card pf-notes"><ol class="nt-tl">${arch.map(notaLi).join("")}</ol></div></details>` : ""}`;
  const rk = M.ret?.riesgo?.(a);
  const waRiesgo = rk && rk.nivel !== "bajo" && rk.script && waLink(tel, rk.script);

  const tabs = TABS.map(([k]) => k);
  if(!tabs.includes(tab)) tab = "grados";
  const debe = e.k === "vencido";
  const waCobro = debe && waLink(tel, t("Hola {nombre}, te recordamos que tu mensualidad en {academia} está pendiente. ¡Te esperamos!", {nombre: a.nombre.split(" ")[0], academia: acad.nombre}));
  const estado = estadoEf(a);
  const due = ["vencido", "pronto"].includes(e.k);
  /* acciones rápidas en círculo, como en Contactos: llamar, WhatsApp, pago y asistencia */
  const qa = (ic, label, attrs, off) => off ? `<span class="pf-qa-b off" aria-disabled="true">${icon(ic)}<span>${label}</span></span>` : `<${attrs.startsWith("href") ? "a" : "button type=\"button\""} class="pf-qa-b" ${attrs}>${icon(ic)}<span>${label}</span></${attrs.startsWith("href") ? "a" : "button"}>`;
  const sub = [a.nacimiento ? tn(age(a.nacimiento), "1 año", "{n} años") : "", discs.map(d => t(d.nombre)).join(", ")].filter(Boolean).join(" · ");

  el.innerHTML = `
  <a class="back" href="#/alumnos">${icon("back")} ${t("Alumnos")}</a>
  <div class="pf-view">
    <aside class="pf-side">
      <section class="pf-hero" aria-label="${esc(a.nombre)}">
        <button type="button" class="btn plain pf-edit" data-edit data-nav-act>${t("Editar")}</button>
        <div class="pf-photo">${avatar(a, 104)}</div>
        <p class="pf-name" aria-hidden="true">${esc(a.nombre)}</p>
        ${sub ? `<p class="pf-sub">${esc(sub)}</p>` : ""}
        <div class="pf-tags">${estado !== "activo" ? pill(estado, t(STATUS[estado] || "")) : ""}${pill(e.k, e.txt)}${lesion ? `<button class="tag lesion pf-lesion" data-tab="notas" title="${esc(lesion.texto)}">${icon("alert")}${t("Lesión")}</button>` : ""}</div>
        <div class="pf-qa">
          ${qa("phone", t("Llamar"), `href="${esc(telH(tel))}"`, !tel)}
          ${qa("whatsapp", "WhatsApp", `href="${esc(wa || "")}" target="_blank" rel="noopener"`, !wa)}
          ${qa("cash", t("Pago"), due ? "data-quick" : "data-pay")}
          ${qa("calendar", t("Asistencia"), `data-tab="asistencia" data-jump`)}
        </div>
      </section>
      <div class="grouped pf-facts">
        ${discs.map(d => { const g = S.rangoActual(a.id, d.id); return `<div class="row-inset pf-beltrow"><span class="k">${esc(t(d.nombre))}</span><span class="row-val">${g ? `<span class="pf-belt" title="${esc(rankLabel(d, g))}">${belt(d, g.rank, g.grado, {w: 72, h: 13})}</span>` : `<span class="muted">${t("sin grado")}</span>`}</span></div>`; }).join("")}
        <div class="row-inset"><span class="k">${t("Última clase")}</span><span class="row-val ${stats.dias >= 14 || !stats.ultima ? "warn-t" : ""}">${stats.ultima ? esc(ultTxt) : t("Sin clases registradas")}</span></div>
        ${a.sangre ? `<div class="row-inset"><span class="k">${t("Tipo de sangre")}</span><span class="row-val pf-rh">${esc(a.sangre)}</span></div>` : ""}
        ${sede && S.sedes().length > 1 ? `<div class="row-inset"><span class="k">${t("Sede")}</span><span class="row-val">${esc(sede.nombre)}</span></div>` : ""}
      </div>
      <div class="grouped pf-links">
        <button type="button" class="row-inset chev" data-share><span class="row-ic" style="--rc:var(--system-blue)">${icon("share")}</span><span>${t("Compartir ficha")}</span></button>
        ${M.clases?.qrCardHTML ? `<button type="button" class="row-inset chev" data-qr><span class="row-ic" style="--rc:var(--system-gray)">${icon("qr")}</span><span>${t("Carné QR")}</span></button>` : ""}
      </div>
    </aside>
    <div class="pf-body">
      ${debe && tab !== "pagos" ? `<div class="pf-due" role="alert"><span class="pf-due-ic">${icon("alert")}</span><b>${esc(debeTxt)}</b><div class="pf-due-b">
          <button class="btn filled small" data-quick>${icon("check")}<span>${t("Pagó {valor}", {valor: money(monto, cur)})}</span></button>
          ${waCobro ? `<a class="btn gray small" href="${esc(waCobro)}" target="_blank" rel="noopener">${icon("whatsapp")}<span>WhatsApp</span></a>` : ""}</div></div>` : ""}
      ${rk && rk.nivel !== "bajo" ? `<div class="pf-rk ${rk.nivel}"><span class="pf-due-ic">${icon("alert")}</span><div><b>${rk.nivel === "alto" ? t("Riesgo alto de abandono") : t("Riesgo medio de abandono")}</b><span class="small muted">${esc(rk.motivos.join(" · "))}</span></div>
        ${waRiesgo ? `<a class="btn gray small" href="${esc(waRiesgo)}" target="_blank" rel="noopener">${icon("whatsapp")}<span>${t("Escribirle")}</span></a>` : ""}</div>` : ""}
      <div class="pf-seg" role="tablist" aria-label="${t("Secciones de la ficha")}">${TABS.map(([k, n, ic]) => `<button class="pf-tab ${tab === k ? "on" : ""}" role="tab" id="pft-${k}" aria-selected="${tab === k}" aria-controls="pf-panel" tabindex="${tab === k ? 0 : -1}" data-tab="${k}">${icon(ic)}<span>${t(n)}</span></button>`).join("")}</div>
      <section class="pf-panel ${anim ? "pf-in" : ""}" role="tabpanel" id="pf-panel" aria-labelledby="pft-${tab}">${{grados: gradosHtml, asistencia: asisHtml, pagos: pagosHtml, notas: notasHtml, info: infoHtml, equipo: equipoHtml}[tab]}</section>
    </div>
  </div>`;
  anim = false;
  slideTab(el, fromRect);
  fromRect = null;
  alignTitle(el);
  alignWatch();

  const goTab = (k, jump) => {
    if(k === tab && !jump) return;
    if(k !== tab){ fromRect = el.querySelector(".pf-tab.on")?.getBoundingClientRect() || null; anim = true; tab = k; haptic("selection"); render(el, [id], ctx); }
    if(jump){ const sg = el.querySelector(".pf-seg"); if(sg && sg.getBoundingClientRect().top > innerHeight * .5) sg.scrollIntoView({block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"}); }
  };
  el.onclick = ev => {
    const tg = ev.target;
    if(tg.closest("a[href]")) return;
    const tb = tg.closest("[data-tab]"); if(tb){ goTab(tb.dataset.tab, tb.hasAttribute("data-jump") || !tb.closest(".pf-seg")); return; }
    const tl = tg.closest("[data-tl]"); if(tl){ const k = tl.dataset.tl; abiertos.has(k) ? abiertos.delete(k) : abiertos.add(k); render(el, [id], ctx); return; }
    if(tg.closest("[data-edit]")) return studentForm(a, {onDeleted: () => { location.hash = "#/alumnos"; }});
    const pr = tg.closest("[data-promo]"); if(pr) return promotionModal(a, pr.dataset.promo);
    const eg = tg.closest("[data-editg]"); if(eg){ const g = S.get("grados", eg.dataset.editg); return promotionModal(a, g.disciplinaId, g); }
    if(tg.closest("[data-quick]")) return quickPay(a);
    if(tg.closest("[data-pay]")) return paymentModal(a);
    const ep = tg.closest("[data-editp]"); if(ep) return paymentModal(a, S.get("pagos", ep.dataset.editp));
    const evb = tg.closest("[data-eval]"); if(evb) return E.evaluarModal(a, S.get("disciplinas", evb.dataset.eval));
    const ar = tg.closest("[data-arch]"); if(ar){ const n = S.get("notas", ar.dataset.arch); if(n) S.put("notas", {id: n.id, activa: n.activa === false}); return; }
    if(tg.closest("[data-share]")) return compartirFicha(a);
    if(tg.closest("[data-qr]")) return carne(a);
  };
  el.onsubmit = ev => {
    if(!ev.target.matches("[data-nform]")) return;
    ev.preventDefault();
    const f = ev.target, texto = f.texto.value.trim();
    if(!texto){ f.texto.focus(); return; }
    S.put("notas", {academiaId: S.academy()?.id, alumnoId: a.id, fecha: f.fecha.value || today(), tipo: f.tipo.value || "general", texto, activa: true});
    toast(t("Nota agregada"));
  };
  /* pestañas con flechas, Inicio y Fin (patrón ARIA tablist) */
  el.onkeydown = ev => {
    /* filas de pago: Enter o Espacio las abren, como un botón */
    const rp = ev.target.closest?.("[data-editp]");
    if(rp && ev.target === rp && (ev.key === "Enter" || ev.key === " ")){ ev.preventDefault(); return paymentModal(a, S.get("pagos", rp.dataset.editp)); }
    if(!ev.target.closest('[role="tab"]')) return;
    const i = tabs.indexOf(tab);
    const j = {ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1}[ev.key];
    if(j === undefined) return;
    ev.preventDefault();
    goTab(tabs[(j + tabs.length) % tabs.length]);
    el.querySelector(`#pft-${tab}`)?.focus();
  };
  return () => { el.onkeydown = null; el.onsubmit = null; document.querySelector(".lt-wrap")?.style.removeProperty("--pf-dy"); };
}

/* deslizador de las pestañas: sale de donde estaba la anterior (mismas variables que el segmentado de ui.js) */
function slideTab(el, from){
  if(!from || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const on = el.querySelector(".pf-tab.on"); if(!on) return;
  const to = on.getBoundingClientRect();
  if(!to.width || Math.abs(from.top - to.top) > 4) return;
  on.style.setProperty("--seg-dx", (from.left - to.left) + "px");
  on.style.setProperty("--seg-sx", (from.width / to.width).toFixed(3));
  on.classList.add("slide");
}
/* el nombre va bajo la foto, como en Contactos: el título grande de la barra queda invisible justo encima del nombre,
   así el título pequeño de la barra aparece cuando el nombre pasa por debajo de ella */
function alignTitle(el){
  const lt = document.querySelector(".lt-wrap"), h1 = document.querySelector("#title"), nm = el.querySelector(".pf-name");
  if(!lt || !h1 || !nm) return;
  lt.style.setProperty("--pf-dy", "0px");
  const dy = nm.getBoundingClientRect().bottom - h1.getBoundingClientRect().bottom;
  lt.style.setProperty("--pf-dy", Math.round(dy) + "px");
}
let alignBound = false;
function alignWatch(){
  if(alignBound) return;
  alignBound = true;
  let tm = 0;
  const again = () => { const m = document.querySelector("#main"); if(m?.querySelector(".pf-view")) alignTitle(m); };
  addEventListener("resize", () => { clearTimeout(tm); tm = setTimeout(again, 120); });
  document.fonts?.ready?.then(again).catch(() => {});
}

/* carné con QR para imprimir o mostrar en el kiosco */
function carne(a){
  if(!M.clases?.qrCardHTML) return;
  const m = modal({title: t("Carné QR"), body: `<div class="carne-prev">${M.clases.qrCardHTML(a)}</div><p class="muted small">${t("El alumno lo muestra en el modo kiosco para registrar su llegada.")}</p>`,
    foot: `<button class="btn ghost" data-close>${t("Cerrar")}</button><button class="btn primary" data-p>${icon("print")} ${t("Imprimir")}</button>`});
  m.foot.querySelector("[data-p]").onclick = () => { m.close(); setTimeout(() => M.clases.printQr ? M.clases.printQr(a) : window.print(), 250); };
}

/* enlace de solo lectura con cinturones, asistencia y próximo pago, para mandar por WhatsApp */
function compartirFicha(a){
  const tel = a.telefono || a.acudienteTel, conFoto = !!S.foto(a.id);
  const m = modal({title: t("Compartir ficha"), body: `<p>${t("Se crea un enlace con sus cinturones, asistencia y próximo pago. No incluye documento, teléfono, salud ni notas.")}</p>
    ${conFoto ? `<label class="check"><input type="checkbox" data-foto> <span>${t("Incluir la foto (el enlace queda más largo)")}</span></label>` : ""}
    <p class="muted small" data-len></p>`,
    foot: `<button class="btn ghost" data-copy>${icon("copy")} ${t("Copiar")}</button><button class="btn ghost" data-open>${icon("link")} ${t("Abrir")}</button>${tel ? `<button class="btn primary" data-wa>${icon("whatsapp")} WhatsApp</button>` : `<button class="btn primary" data-sh>${icon("share")} ${t("Compartir")}</button>`}`});
  let url = "";
  const gen = async () => { url = await fichaUrl(a, {foto: !!m.body.querySelector("[data-foto]")?.checked}); m.body.querySelector("[data-len]").textContent = tn(url.length, "Enlace de 1 carácter", "Enlace de {n} caracteres"); return url; };
  const txt = () => t("Hola {nombre}, esta es tu ficha en {academia}:", {nombre: a.nombre.split(" ")[0], academia: S.academy()?.nombre || ""});
  gen().catch(() => toast(t("No se pudo crear el enlace"), "error"));
  m.body.onchange = () => gen().catch(() => {});
  const q = s => m.foot.querySelector(s);
  q("[data-copy]").onclick = async () => { await gen(); try{ await navigator.clipboard.writeText(url); toast(t("Enlace copiado")); }catch(e){ shareOrDownload({text: url}); } };
  q("[data-open]").onclick = async () => { await gen(); window.open(url, "_blank", "noopener"); };
  if(q("[data-wa]")) q("[data-wa]").onclick = async () => { await gen(); window.open(waLink(tel, txt() + "\n" + url), "_blank", "noopener"); m.close(); };
  if(q("[data-sh]")) q("[data-sh]").onclick = async () => { await gen(); await shareOrDownload({title: t("Ficha del alumno"), text: txt(), url}); m.close(); };
}
