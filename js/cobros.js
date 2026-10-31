/* Cobros: cuánto debe de verdad un alumno (cuotas atrasadas desde su vencimiento), textos y plantilla de recordatorio. */
import * as S from "./store.js";
import {planById} from "./catalog.js";
import {today, addMonths, addDays, daysBetween, money, parseISO} from "./util.js";
import {t, tn} from "./i18n.js";

/* fin de un período que empieza en «desde» según el plan */
export const finPeriodo = (desde, planId, n = 1) => {
  const p = planById(planId);
  return p.meses === 0.5 ? addDays(desde, 15 * n) : p.meses ? addMonths(desde, p.meses * n) : desde;
};

/* vencimiento real: nunca antes de activoDesde (volvió de congelado/inactivo o pasó de beca/clase a un plan pago),
   así los meses sin cobrar no se vuelven deuda. Usar este y no S.vence para cobrar. */
export function vence(al){
  const v = S.vence(al);
  return al?.activoDesde && (!v || v < al.activoDesde) ? al.activoDesde : v;
}
/* estadoPago de store con el vencimiento ajustado */
export function estadoPago(al, aviso = 5){
  const e = S.estadoPago(al, aviso), v = vence(al);
  if(!v || v === e.vence || !["vencido", "pronto", "aldia"].includes(e.k)) return e;
  const d = daysBetween(today(), v);
  if(d < 0) return {k: "vencido", txt: tn(-d, "Vencido hace 1 día", "Vencido hace {n} días"), dias: d, vence: v};
  if(d <= aviso) return {k: "pronto", txt: d === 0 ? t("Vence hoy") : tn(d, "Vence en 1 día", "Vence en {n} días"), dias: d, vence: v};
  return {k: "aldia", txt: t("Al día"), dias: d, vence: v};
}
/* período por defecto de un pago nuevo: si debe una sola cuota, esa cuota (no se pierden días en planes largos);
   si no, la regla de store (desde el vencimiento si lleva ≤31 días, si no desde hoy) con el vencimiento ajustado */
export function periodoNuevo(al){
  const d = deuda(al);
  if(d.cuotas === 1 && d.desde) return {desde: d.desde, hasta: d.hasta};
  const v = vence(al), hoy = today();
  let desde = v && daysBetween(v, hoy) <= 31 ? v : hoy;
  if(!parseISO(desde)) desde = hoy;
  return {desde, hasta: finPeriodo(desde, al.plan)};
}

/* deuda real: {cuotas, meses, monto, desde, hasta, dias}
   cuotas = períodos vencidos sin pagar, contando el que está corriendo hoy (62 días tarde en plan mensual = 3).
   desde = primer día sin pagar; hasta = fecha a la que queda al día pagando todas. */
export function deuda(al){
  const plan = planById(al?.plan);
  const nada = {cuotas: 0, meses: 0, monto: 0, desde: null, hasta: null, dias: 0};
  if(!al || al.estado !== "activo" || !plan.meses) return nada;
  const hoy = today(), v = vence(al), valor = S.valorPlan(al);
  if(!v) return {cuotas: 1, meses: plan.meses, monto: valor, desde: hoy, hasta: finPeriodo(hoy, plan.id), dias: 0};
  if(v > hoy) return Object.assign(nada, {desde: v, dias: daysBetween(hoy, v)});
  /* sin tope: hasta siempre queda después de hoy (el 1200 solo frena una fecha rota) */
  let n = 1;
  while(n < 1200 && finPeriodo(v, plan.id, n) <= hoy) n++;
  return {cuotas: n, meses: n * plan.meses, monto: n * valor, desde: v, hasta: finPeriodo(v, plan.id, n), dias: daysBetween(hoy, v)};
}

/* «3 meses» en planes mensuales, «3 cuotas» en el resto */
export const txtCuotas = (al, n) => planById(al.plan).meses === 1 ? tn(n, "1 mes", "{n} meses") : tn(n, "1 cuota", "{n} cuotas");

/* texto de la píldora con lo que debe cuando son varias cuotas */
export function pillTxt(al, e, d = deuda(al)){
  return e.k === "vencido" && d.cuotas > 1 ? t("{estado} · debe {cuotas}", {estado: e.txt, cuotas: txtCuotas(al, d.cuotas)}) : e.txt;
}

/* recordatorio de cobro en lote: plantilla editable con {nombre} {valor} {dias} {academia} {fecha} */
export const tplCobro = () => S.pref("msg_cobro", t("Hola {nombre}, te recordamos que tu mensualidad en {academia} está vencida hace {dias} días. Valor pendiente: {valor}. ¡Gracias!"));
export function msgCobro(tpl, al){
  const acad = S.academy(), d = deuda(al), e = estadoPago(al, acad.avisoDias ?? 5);
  const vars = {nombre: (al.nombre || "").split(" ")[0], academia: acad.nombre || "", valor: money(d.monto || S.valorPlan(al), acad.moneda || "COP"), dias: String(Math.max(0, -(e.dias || 0))), fecha: e.vence || ""};
  return tpl.replace(/\{(nombre|academia|valor|dias|fecha)\}/g, (_, k) => vars[k]);
}
/* días desde el último recordatorio, o null */
export const diasRecordado = al => al.recordado ? daysBetween(al.recordado, today()) : null;

/* última asistencia por alumno (local: no depende de helpers del store) */
export function ultimasAsistencias(){
  const m = new Map();
  for(const a of S.all("asistencias")) for(const id of a.presentes || []) if(!m.has(id) || a.fecha > m.get(id)) m.set(id, a.fecha);
  return m;
}
/* días sin venir: desde la última clase, o desde el ingreso si nunca ha venido */
export function diasSinVenir(al, ult = ultimasAsistencias()){
  const f = ult.get(al.id) || al.fechaInicio;
  return f ? daysBetween(f, today()) : null;
}
