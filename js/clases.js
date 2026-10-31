/* Horario semanal, clases de hoy, tiqueteras y check-in. Sin DOM salvo qrCardHTML (texto HTML). */
import * as S from "./store.js";
import {today, parseISO, addDays, esc, toISO} from "./util.js";
import {t, tn, locale} from "./i18n.js";
import {estadoPago} from "./cobros.js";
import {qrSvg} from "./qr.js";
import {avatar, belt, rankLabel} from "./ui.js";

export const DIAS = [0, 1, 2, 3, 4, 5, 6];
/* lunes primero (Colombia); getDay: 0 = domingo */
export const SEMANA = [1, 2, 3, 4, 5, 6, 0];
export const diaNombre = (d, corto) => { try{ return new Intl.DateTimeFormat(locale(), {weekday: corto ? "short" : "long"}).format(new Date(2024, 0, 7 + d)); }catch(e){ return String(d); } };
export const durDe = c => Number(c?.dur) > 0 ? Number(c.dur) : 60;
export const nombreClase = (c, disc = S.get("disciplinas", c?.disciplinaId)) => (c?.nombre || "").trim() || (disc ? t(disc.nombre) : t("Clase"));
const enFecha = (fecha, hora) => { const d = parseISO(fecha) || new Date(); const [h, m] = String(hora || "00:00").split(":").map(Number); d.setHours(h || 0, m || 0, 0, 0); return d; };

/* clases de un día en una sede ("" = todas), con hora de inicio y fin */
export function clasesHoy(fecha = today(), sedeId = S.curSede()){
  const d = parseISO(fecha); if(!d) return [];
  const dia = d.getDay();
  return S.clases().filter(c => c.dia === dia && (!sedeId || c.sedeId === sedeId)).map(clase => {
    const disc = S.get("disciplinas", clase.disciplinaId), inicio = enFecha(fecha, clase.hora);
    return {clase, disc, inicio, fin: new Date(inicio.getTime() + durDe(clase) * 6e4)};
  }).filter(x => x.disc).sort((a, b) => a.inicio - b.inicio);
}
/* la siguiente de hoy (incluye la que está corriendo) */
export function proximaClase(sedeId = S.curSede(), ahora = new Date()){
  const x = clasesHoy(toISO(ahora), sedeId).find(c => c.fin > ahora);
  return x ? Object.assign({}, x, {enMin: Math.round((x.inicio - ahora) / 6e4)}) : null;
}
/* la que está pasando: desde 15 min antes de empezar hasta que termina */
export function claseActual(sedeId = S.curSede(), ahora = new Date()){
  return clasesHoy(toISO(ahora), sedeId).find(c => ahora >= c.inicio.getTime() - 15 * 6e4 && ahora < c.fin) || null;
}
export const descClase = c => ({fecha: c.fecha, sedeId: c.sedeId, disciplinaId: c.disciplinaId, claseId: c.id});
export function presentesClase(fecha, clase){
  return (S.asistenciaDe(fecha, clase.sedeId, clase.disciplinaId, clase.id)?.presentes || []).length;
}

/* ---------- tiqueteras: pagos con concepto Tiquetera y número de clases ---------- */
function calcTiq(al, pago, asis){
  const desde = pago.desde || pago.fecha || "", hasta = pago.vence || "";
  const total = Number(pago.clases) || 0;
  const usadas = asis.filter(a => a.fecha >= desde && (!hasta || a.fecha <= hasta)).length;
  return {pago, total, usadas, saldo: Math.max(0, total - usadas), vence: hasta || null, vencida: !!hasta && hasta < today()};
}
const pagosTiq = al => S.pagosDe(al.id).filter(p => p.concepto === "Tiquetera" && Number.isFinite(Number(p.clases)) && Number(p.clases) > 0);
const asisAl = al => S.all("asistencias").filter(a => (a.presentes || []).includes(al.id));
export function tiqueteras(al){
  if(!al) return [];
  const asis = asisAl(al);
  return pagosTiq(al).map(p => calcTiq(al, p, asis));
}
/* la más reciente (pagosDe viene de la más nueva a la más vieja) */
export function saldoTiquetera(al){
  const p = al && pagosTiq(al)[0];
  return p ? calcTiq(al, p, asisAl(al)) : null;
}
export function msgRenovar(al, s = saldoTiquetera(al)){
  const acad = S.academy(), n = (al?.nombre || "").split(" ")[0];
  if(s?.vencida) return t("Hola {nombre}, tu tiquetera en {academia} venció el {fecha}. ¿Te la renovamos para seguir entrenando?", {nombre: n, academia: acad?.nombre || "", fecha: s.vence});
  if(s && s.saldo > 0) return tn(s.saldo, "Hola {nombre}, te queda 1 clase de tu tiquetera en {academia}. ¿Te la renovamos para que no pares?", "Hola {nombre}, te quedan {n} clases de tu tiquetera en {academia}. ¿Te la renovamos para que no pares?", {nombre: n, academia: acad?.nombre || ""});
  return t("Hola {nombre}, ya usaste todas las clases de tu tiquetera en {academia}. ¿Te la renovamos para seguir entrenando?", {nombre: n, academia: acad?.nombre || ""});
}

/* ---------- check-in (kiosco, QR) ---------- */
export function checkIn(al, {fecha = today(), sedeId, disciplinaId, claseId} = {}){
  const c = {fecha, sedeId: sedeId || al.sedeId, disciplinaId, claseId: claseId || undefined};
  const ya = (S.asistenciaDe(c.fecha, c.sedeId, c.disciplinaId, c.claseId)?.presentes || []).includes(al.id);
  if(!ya) S.marcarAsistencia(c, al.id, true);
  return {ya, saldo: saldoTiquetera(al), pago: estadoPago(al, S.academy()?.avisoDias ?? 5)};
}

/* ---------- carné con QR ---------- */
export const qrPayload = al => "AP1:" + al.id;
export const leerQr = txt => { const m = /^AP1:([\w-]+)$/.exec(String(txt || "").trim()); return m ? S.get("alumnos", m[1]) : null; };
export function qrCardHTML(al){
  const acad = S.academy();
  const d = (al.disciplinaIds || []).map(id => S.get("disciplinas", id)).find(Boolean);
  const g = d && S.rangoActual(al.id, d.id);
  return `<div class="qr-card">
    <div class="qr-card-h"><b>${esc(acad?.nombre || "")}</b><span>${t("Carné de alumno")}</span></div>
    <div class="qr-card-b">${avatar(al, 72)}<div class="qr-card-i"><b>${esc(al.nombre)}</b>${d ? `<span>${esc(t(d.nombre))}</span>${g ? `${belt(d, g.rank, g.grado, {w: 96, h: 16})}<small>${esc(rankLabel(d, g))}</small>` : ""}` : ""}</div></div>
    <div class="qr-card-q">${qrSvg(qrPayload(al), {size: 168, margin: 2})}</div>
    <small class="qr-card-f">${t("Muestra este código al llegar a clase")}</small></div>`;
}

/* ---------- calendario .ics (usa js/ics.js de entreno) ---------- */
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export async function clasesIcs(list = S.clases()){
  const {icsEvento, icsCalendario} = await import("./ics.js");
  const hoy = today(), acad = S.academy();
  const ev = list.map(c => {
    const disc = S.get("disciplinas", c.disciplinaId), sede = S.get("sedes", c.sedeId);
    const d0 = parseISO(hoy), delta = (c.dia - d0.getDay() + 7) % 7;
    return icsEvento({uid: `${c.id}@academiapro`, titulo: nombreClase(c, disc), inicio: enFecha(addDays(hoy, delta), c.hora), durMin: durDe(c),
      rrule: `FREQ=WEEKLY;BYDAY=${BYDAY[c.dia]}`, alarmaMin: 30, lugar: [sede?.nombre, sede?.direccion].filter(Boolean).join(", "), desc: c.instructor ? t("Instructor: {n}", {n: c.instructor}) : ""});
  });
  return icsCalendario(ev, acad?.nombre || "AcademiaPro");
}
/* texto del horario agrupado por día, para WhatsApp */
export function horarioTexto(list = S.clases(), sedeNombre = ""){
  const acad = S.academy();
  const lines = [`*${t("Horario de {academia}", {academia: acad?.nombre || ""})}*${sedeNombre ? " · " + sedeNombre : ""}`];
  for(const d of SEMANA){
    const cs = list.filter(c => c.dia === d);
    if(!cs.length) continue;
    const dn = diaNombre(d);
    lines.push("", `*${dn[0].toUpperCase() + dn.slice(1)}*`);
    for(const c of cs) lines.push(`${c.hora} · ${nombreClase(c)}${c.instructor ? ` (${c.instructor})` : ""}`);
  }
  return lines.join("\n");
}
/* imprime solo el carné (css/clases.css oculta lo demás mientras body tiene .print-qr) */
export function printQr(al){
  const box = document.createElement("div");
  box.className = "qr-print"; box.innerHTML = qrCardHTML(al);
  document.body.appendChild(box); document.body.classList.add("print-qr");
  const fin = () => { box.remove(); document.body.classList.remove("print-qr"); window.removeEventListener("afterprint", fin); };
  window.addEventListener("afterprint", fin);
  setTimeout(() => { window.print(); setTimeout(fin, 1500); }, 60);
}
