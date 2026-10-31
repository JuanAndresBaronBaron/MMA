/* Cobros: cuánto debe de verdad un alumno (cuotas atrasadas desde su vencimiento), textos y plantilla de recordatorio. */
import * as S from "./store.js";
import {planById} from "./catalog.js";
import {today, addMonths, addDays, daysBetween, money, parseISO, fmtDate} from "./util.js";
import {t, tn} from "./i18n.js";

/* fin de un período que empieza en «desde» según el plan */
export const finPeriodo = (desde, planId, n = 1) => {
  const p = planById(planId);
  return p.meses === 0.5 ? addDays(desde, 15 * n) : p.meses ? addMonths(desde, p.meses * n) : desde;
};

/* vencimiento real: nunca antes de activoDesde (volvió de congelado/inactivo o pasó de beca/clase a un plan pago),
   así los meses sin cobrar no se vuelven deuda. Usar este y no S.vence para cobrar. */
export function vence(al){
  const v = venceCongelado(al, S.vence(al));
  return al?.activoDesde && (!v || v < al.activoDesde) ? al.activoDesde : v;
}
export const venceReal = al => vence(al);

/* ---------- congelado con fechas: congelado = {desde, hasta} (hasta es el último día congelado) ---------- */
export const diasCongelado = al => { const c = al?.congelado; return c?.desde && c?.hasta && c.hasta >= c.desde ? daysBetween(c.desde, c.hasta) + 1 : 0; };
/* estado efectivo: si el congelamiento ya terminó cuenta como activo (sin escribir nada al pintar) */
export function estadoEf(al){
  if(!al) return "inactivo";
  return al.estado === "congelado" && al.congelado?.hasta && al.congelado.hasta < today() ? "activo" : al.estado || "activo";
}
/* los días congelados corren el vencimiento una sola vez: deja de sumarse en cuanto hay un pago que ya empieza en la
   fecha corrida (o después del congelamiento). base = lo que había pagado al congelar; sin base (registros viejos)
   solo cuenta el pago que empieza después del congelamiento */
function venceCongelado(al, v){
  const n = diasCongelado(al);
  if(!n || !v) return v;
  const c = al.congelado, corrida = c.base ? addDays(c.base, n) : null;
  if(S.pagosDe(al.id).some(p => p.desde && (p.desde > c.hasta || (corrida && p.desde >= corrida)))) return v;
  return addDays(v, n);
}
/* copia del alumno con el estado efectivo, para las funciones del store */
const efectivo = al => { const e = estadoEf(al); return e === al.estado ? al : Object.assign({}, al, {estado: e}); };
/* estadoPago de store con el vencimiento ajustado */
export function estadoPago(al, aviso = 5){
  al = efectivo(al);
  const e = S.estadoPago(al, aviso), v = vence(al);
  if(e.k === "congelado" && al.congelado?.hasta) return Object.assign(e, {txt: t("Congelado hasta {fecha}", {fecha: fmtDate(al.congelado.hasta)}), hasta: al.congelado.hasta});
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
  if(!al || estadoEf(al) !== "activo" || !plan.meses) return nada;
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


/* ---------- recibos ---------- */
/* consecutivo por academia que nunca baja: el mayor entre el contador de la academia, los pagos (también los borrados,
   que guardan su num) + 1, y se anota en la academia. Dos aparatos sin red que den el mismo número se arreglan al
   mezclar (S.renumerarRecibos). Los pagos viejos sin num se quedan así */
export function siguienteNumRecibo(){
  const a = S.academy(); if(!a) return 1;
  const n = Math.max(Number(a.ultimoRecibo) || 0, S.maxNumRecibo(a.id)) + 1;
  S.put("academias", {id: a.id, ultimoRecibo: n});
  return n;
}
export const fmtNumRecibo = n => n ? String(n).padStart(6, "0") : "—";

/* ---------- reportes ---------- */
const ymDe = iso => String(iso || "").slice(0, 7);
const finMes = ym => { const [y, m] = ym.split("-").map(Number); return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`; };
export const ymMas = (ym, n) => addMonths(ym + "-01", n).slice(0, 7);
/* fecha de baja: inactivoDesde, o la última edición si es un registro viejo */
export const bajaDe = al => al.inactivoDesde || (al._u ? toISOms(al._u) : "");
/* valor mensual equivalente del plan (un trimestral de 300 = 100/mes); beca y por clase no suman */
export function valorMes(al){
  const p = planById(al.plan);
  return p.meses ? S.valorPlan(al) / p.meses : 0;
}
/* activo en ese mes: ya había ingresado, no está inactivo ni congelado todo el mes */
function activoEnMes(al, ym){
  if(al.fechaInicio && ymDe(al.fechaInicio) > ym) return false;
  if(al.estado === "inactivo"){ const b = ymDe(bajaDe(al)); if(!b || b <= ym) return false; }
  /* periodos de baja ya cerrados (se reactivó): bajas = [{desde, hasta}], o el último inactivoDesde → activoDesde */
  for(const p of bajasDe(al)) if(ymDe(p.desde) < ym && ym < ymDe(p.hasta)) return false;
  const c = al.congelado;
  if(al.estado === "congelado" && !c) return false;
  if(c?.desde && c?.hasta && c.desde <= ym + "-01" && c.hasta >= finMes(ym)) return false;
  return true;
}
function bajasDe(al){
  const out = Array.isArray(al.bajas) ? al.bajas.filter(p => p && p.desde && p.hasta) : [];
  if(al.estado !== "inactivo" && al.inactivoDesde && al.activoDesde && al.activoDesde > al.inactivoDesde && !out.some(p => p.desde === al.inactivoDesde)) out.push({desde: al.inactivoDesde, hasta: al.activoDesde});
  return out;
}
const esperadoMes = (als, ym) => als.reduce((s, a) => s + (activoEnMes(a, ym) ? valorMes(a) : 0), 0);
const sumMonto = ps => ps.reduce((s, p) => s + (Number(p.monto) || 0), 0);
/* últimos 12 meses (el más viejo primero): [{ym, esperado, cobrado}] */
export function ingresos12(hasta = today()){
  const als = S.inAcad("alumnos"), ps = S.inAcad("pagos"), fin = ymDe(hasta), out = [];
  for(let i = 11; i >= 0; i--){
    const ym = ymMas(fin, -i);
    out.push({ym, esperado: Math.round(esperadoMes(als, ym)), cobrado: sumMonto(ps.filter(p => ymDe(p.fecha) === ym))});
  }
  return out;
}
/* franja de una hora "HH:MM" */
export const franjaDe = hora => { const h = parseInt(hora, 10); return !Number.isFinite(h) ? null : h < 12 ? "mañana" : h < 18 ? "tarde" : "noche"; };
/* resumen de un mes "AAAA-MM" */
export function reporteMes(ym = ymDe(today())){
  const acadId = S.academy()?.id, als = S.inAcad("alumnos"), byId = new Map(als.map(a => [a.id, a]));
  const ps = S.inAcad("pagos").filter(p => ymDe(p.fecha) === ym);
  const porMetodo = {}, porConcepto = {};
  for(const p of ps){
    const m = p.metodo || "Otro", c = p.concepto || "Otro", v = Number(p.monto) || 0;
    porMetodo[m] = (porMetodo[m] || 0) + v; porConcepto[c] = (porConcepto[c] || 0) + v;
  }
  const nuevos = als.filter(a => ymDe(a.fechaInicio) === ym);
  /* bajas: inactivos con fecha de baja en el mes (o editados ese mes si no hay fecha) */
  const bajas = als.filter(a => a.estado === "inactivo" && ymDe(bajaDe(a)) === ym);
  const asis = S.all("asistencias").filter(a => ymDe(a.fecha) === ym && (!a.academiaId || a.academiaId === acadId));
  let asistencias = 0;
  const disc = new Map(), clase = new Map(), franja = new Map();
  for(const a of asis){
    const n = (a.presentes || []).filter(id => byId.has(id)).length;
    if(!n) continue;
    asistencias += n;
    disc.set(a.disciplinaId, (disc.get(a.disciplinaId) || 0) + n);
    if(a.claseId){ const x = clase.get(a.claseId) || {n: 0, s: 0}; x.n += n; x.s++; clase.set(a.claseId, x); }
    const c = a.claseId && S.get("clases", a.claseId), f = c ? franjaDe(c.hora) : null;
    if(f) franja.set(f, (franja.get(f) || 0) + n);
  }
  /* deudores: solo tiene sentido con el estado de hoy */
  const deudores = als.filter(a => estadoEf(a) === "activo").map(al => ({al, monto: deuda(al).monto})).filter(x => x.monto > 0).sort((a, b) => b.monto - a.monto);
  return {
    ym, cobrado: sumMonto(ps), esperado: Math.round(esperadoMes(als, ym)), pagos: ps.length, porMetodo, porConcepto, nuevos, bajas, asistencias,
    porDisciplina: [...disc].map(([discId, n]) => ({discId, n})).sort((a, b) => b.n - a.n),
    porClase: [...clase].map(([claseId, x]) => ({claseId, n: x.n, prom: Math.round(x.n / x.s * 10) / 10})).sort((a, b) => b.n - a.n),
    porFranja: ["mañana", "tarde", "noche"].map(f => ({franja: f, n: franja.get(f) || 0})),
    deudores,
  };
}
const toISOms = ms => { const d = new Date(ms); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
