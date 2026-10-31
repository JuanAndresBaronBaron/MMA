/* Retención: qué tan probable es que un alumno deje la academia. Funciones puras (sin DOM).
   riesgo(al) → {score 0-100, nivel alto|medio|bajo, motivos[], script (texto para WhatsApp)} */
import * as S from "./store.js";
import {today, addDays, daysBetween} from "./util.js";
import {estadoPago, diasSinVenir, ultimasAsistencias, estadoEf} from "./cobros.js";
import {saldoTiquetera} from "./clases.js";
import {t, tn} from "./i18n.js";

/* datos que se reusan al calcular muchos alumnos: última clase por alumno y si la academia toma asistencia */
export function contexto(){
  const acad = S.academy();
  const asis = S.all("asistencias").filter(a => !a.academiaId || a.academiaId === acad?.id);
  let primera = null;
  for(const a of asis) if(a.fecha && (!primera || a.fecha < primera)) primera = a.fecha;
  return {hoy: today(), ult: ultimasAsistencias(), hayAsis: asis.length > 0, primera, acad};
}

export function riesgo(al, cx = contexto()){
  const out = {score: 0, nivel: "bajo", motivos: [], script: ""};
  if(!al || estadoEf(al) !== "activo") return out;
  const {hoy, ult, hayAsis, primera, acad} = cx;
  const nombre = (al.nombre || "").split(" ")[0], academia = acad?.nombre || "";
  let score = 0, main = null;
  const add = (pts, txt, k) => { if(pts <= 0) return; score += pts; out.motivos.push(txt); if(!main || pts > main.pts) main = {pts, k}; };

  /* volvió hace poco de un congelamiento (lesión, viaje): esos días no cuentan como ausencia */
  const finFrz = al.congelado?.hasta && al.congelado.hasta < hoy ? al.congelado.hasta : null;
  const trasFrz = finFrz ? daysBetween(finFrz, hoy) : null;
  if(hayAsis){
    /* últimas 4 semanas frente a las 4 anteriores (no si las ventanas pisan el congelamiento) */
    const a4 = S.asistenciasDe(al.id, addDays(hoy, -27)), a8 = S.asistenciasDe(al.id, addDays(hoy, -55));
    const prev = a8 - a4;
    if(prev >= 3 && a4 < prev && !(trasFrz !== null && trasFrz < 56)){
      const caida = (prev - a4) / prev;
      if(caida >= .3) add(Math.round(Math.min(35, caida * 40)), t("Viene menos: {a} clases en 4 semanas (antes {b})", {a: a4, b: prev}), "baja");
    }
    /* días sin venir: desde la última clase, o desde que se empezó a tomar asistencia */
    let d = diasSinVenir(al, ult);
    if(!ult.has(al.id) && primera && (!al.fechaInicio || al.fechaInicio < primera)) d = daysBetween(primera, hoy);
    if(finFrz && d !== null && (!ult.get(al.id) || ult.get(al.id) < finFrz)) d = Math.min(d, trasFrz);
    if(d !== null){
      const pts = d >= 30 ? 40 : d >= 21 ? 30 : d >= 14 ? 20 : d >= 10 ? 10 : 0;
      add(pts, ult.has(al.id) ? tn(d, "Hace 1 día no viene", "Hace {n} días no viene") : t("Sin asistencias registradas"), "ausente");
    }
    /* alumno nuevo (menos de 30 días) sin clases en su segunda semana */
    const dIn = al.fechaInicio ? daysBetween(al.fechaInicio, hoy) : null;
    if(dIn !== null && dIn >= 14 && dIn < 30){
      const desde = addDays(al.fechaInicio, 7), hasta = addDays(al.fechaInicio, 13);
      const sem2 = S.all("asistencias").filter(a => a.fecha >= desde && a.fecha <= hasta && (a.presentes || []).includes(al.id)).length;
      if(!sem2) add(20, t("Alumno nuevo sin clases en su segunda semana"), "nuevo");
    }
  }
  /* pago vencido */
  const e = estadoPago(al, acad?.avisoDias ?? 5);
  if(e.k === "vencido") add(15 + Math.min(10, Math.round(-(e.dias || 0) / 3)), e.txt, "pago");
  /* tiquetera agotada o vencida */
  try{
    const s = saldoTiquetera(al);
    if(s && (s.saldo <= 0 || s.vencida)) add(15, s.vencida ? t("Tiquetera vencida") : t("Tiquetera sin clases"), "tiquetera");
  }catch(err){}

  out.score = Math.min(100, score);
  out.nivel = out.score >= 60 ? "alto" : out.score >= 30 ? "medio" : "bajo";
  const v = {nombre, academia};
  out.script = !main ? ""
    : main.k === "pago" ? t("Hola {nombre}, ¿cómo vas? Te escribimos de {academia}. Vimos que tu mensualidad quedó pendiente. Si necesitas un acuerdo de pago, cuéntanos y lo arreglamos. ¡Te esperamos en el tatami!", v)
    : main.k === "tiquetera" ? t("Hola {nombre}, tu tiquetera en {academia} ya no tiene clases. ¿Te la renovamos para que no pierdas el ritmo?", v)
    : main.k === "nuevo" ? t("Hola {nombre}, ¿cómo te fue en tus primeras clases en {academia}? Queremos que te sientas en casa. ¿Qué horario te queda mejor esta semana?", v)
    : t("Hola {nombre}, te extrañamos en {academia}. ¿Todo bien? Si algo te impide venir (horario, lesión, trabajo), cuéntanos y buscamos cómo ayudarte. ¡Te esperamos!", v);
  return out;
}

/* alumnos activos ordenados por riesgo (solo los que tienen algún motivo) */
export function listaRiesgo(limit = 10, sede = S.curSede()){
  const cx = contexto();
  return S.alumnos({sede}).filter(a => estadoEf(a) === "activo").map(al => Object.assign({al}, riesgo(al, cx)))
    .filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.al.nombre.localeCompare(b.al.nombre)).slice(0, limit);
}
