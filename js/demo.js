/* Alumnos de ejemplo para probar la app (Inicio › Probar con datos de ejemplo, Ajustes › Cargar alumnos de ejemplo).
   Todo registro creado aquí lleva demo:true para poder quitarlo después sin tocar los datos reales. */
import * as S from "./store.js";
import {today, addMonths, addDays, parseISO} from "./util.js";
import {BLOOD, planById} from "./catalog.js";
import {t} from "./i18n.js";

const NOMBRES = ["Santiago Restrepo", "Valentina Gómez", "Mateo Rodríguez", "Isabella Martínez", "Sebastián López", "Camila Hernández", "Nicolás García", "Mariana Torres",
  "Samuel Ramírez", "Daniela Vargas", "Alejandro Castro", "Sofía Moreno", "Juan David Rojas", "Luciana Ortiz", "Tomás Jiménez", "Gabriela Ruiz", "Emilio Suárez", "Antonella Díaz"];
/* estado de pago por índice: días hasta el vencimiento (negativo = vencido). ~11 al día, 3 pronto, 3 vencidos */
const VENC = {3: -4, 8: -12, 13: -35}, PRONTO = {1: 0, 6: 2, 11: 4};
/* alumnos que dejaron de venir: días desde la última clase */
const AUSENTES = {4: 16, 9: 23, 14: 31};
/* alumnos con tiquetera (plan por clase): clases del paquete */
const TIQ = {7: 8, 12: 12};

export const hasDemo = () => S.COLS.some(c => S.all(c).some(r => r.demo));

/* devuelve cuántos alumnos agregó (0 si falta sede/disciplina o ya hay datos de ejemplo) */
export function loadDemo(){
  const acad = S.academy(), sedes = S.sedes(), discs = S.disciplinas();
  if(!acad || !sedes.length || !discs.length || hasDemo()) return 0;
  const rnd = n => Math.floor(Math.random() * n);
  const hoy = today(), base = acad.valorMensual || 150000, demo = true;
  NOMBRES.forEach((nombre, i) => {
    const sede = sedes[i % sedes.length];
    const ds = S.discsOfSede(sede.id).length ? S.discsOfSede(sede.id) : discs;
    const mine = ds.filter((d, j) => j === i % ds.length || Math.random() < 0.35);
    const inicio = addMonths(hoy, -(3 + rnd(60)));
    const plan = TIQ[i] ? "clase" : i % 7 === 0 ? "trimestral" : "mensual", pm = planById(plan).meses;
    const al = S.put("alumnos", {academiaId: acad.id, nombre, sedeId: sede.id, estado: i === 17 ? "inactivo" : i === 11 ? "congelado" : "activo", plan,
      ...(i === 17 ? {inactivoDesde: addDays(hoy, -40)} : i === 11 ? {congelado: {desde: addDays(hoy, -12), hasta: addDays(hoy, 18)}} : {}),
      valor: plan === "trimestral" ? Math.round(base * 2.7 / 1000) * 1000 : base, fechaInicio: inicio, nacimiento: nacer(i, hoy, rnd),
      telefono: "3" + String(100000000 + rnd(899999999)), sangre: BLOOD[rnd(BLOOD.length)], eps: ["Sura", "Sanitas", "Nueva EPS", "Compensar"][rnd(4)],
      emergencia: t("Familiar"), emergenciaTel: "3" + String(100000000 + rnd(899999999)), genero: i % 2 ? "F" : "M",
      disciplinaIds: mine.map(d => d.id), equipo: {gi: {tiene: Math.random() < 0.6, talla: ["A1", "A2", "A3"][rnd(3)]}, bucal: {tiene: Math.random() < 0.5}, guantes: {tiene: Math.random() < 0.7, talla: "12 oz"}}, demo});
    for(const d of mine){
      let fecha = inicio, rank = 0, grado = 0;
      S.put("grados", {alumnoId: al.id, disciplinaId: d.id, rank, grado, fecha, inicial: true, nota: "Grado al ingresar", demo});
      for(;;){
        const rd = d.ranks[rank];
        const fast = Math.random() < 0.12;
        let step;
        if(rd.g && grado < rd.g){ step = Math.max(1, (rd.mg || 2) * (fast ? 0.4 : 1 + Math.random() * 0.6)); grado++; }
        else if(rank < d.ranks.length - 2){ step = Math.max(1, (rd.m || 6) * (fast ? 0.5 : 1 + Math.random() * 0.4) - (rd.g || 0) * (rd.mg || 0)); rank++; grado = 0; }
        else break;
        const nf = addDays(fecha, Math.round(step * 30.4));
        if(nf > hoy) break;
        fecha = nf;
        S.put("grados", {alumnoId: al.id, disciplinaId: d.id, rank, grado, fecha, profesor: "Profe", demo});
      }
    }
    /* pagos: hasta 4 períodos hacia atrás desde el vencimiento elegido */
    const dias = i === 17 ? -120 : VENC[i] ?? PRONTO[i] ?? 6 + rnd(23);
    const fin = addDays(hoy, dias);
    for(let k = 0; k < 4 && pm; k++){
      const hasta = addMonths(fin, -k * pm), desde = addMonths(fin, -(k + 1) * pm);
      if(desde < inicio) break;
      const f = addDays(desde, rnd(4));
      S.put("pagos", {alumnoId: al.id, academiaId: acad.id, sedeId: sede.id, concepto: "Mensualidad", monto: al.valor, fecha: f > hoy ? hoy : f,
        metodo: ["Efectivo", "Nequi", "Transferencia"][rnd(3)], plan, desde, hasta, demo});
    }
  });
  /* horario: BJJ lun/mié/vie 18:00, Muay Thai mar/jue 19:00, Kids sábado 10:00 (en cada sede) */
  const clasesDe = new Map();
  for(const s of sedes){
    const ds = S.discsOfSede(s.id).length ? S.discsOfSede(s.id) : discs;
    const bjj = ds.find(d => /jiu|bjj/i.test(d.nombre) && !/kid/i.test(d.nombre)) || ds[0];
    const mt = ds.find(d => /muay/i.test(d.nombre)) || ds[1] || ds[0];
    const kids = ds.find(d => /kid|infantil|niñ/i.test(d.nombre));
    const plan = [[bjj, [1, 3, 5], "18:00", 60, 20, ""], [mt, [2, 4], "19:00", 60, 16, ""], [kids || bjj, [6], "10:00", 60, 15, kids ? "" : t("Kids")]];
    for(const [d, dias, hora, dur, cupo, nombre] of plan) for(const dia of dias){
      const c = S.put("clases", {academiaId: acad.id, sedeId: s.id, disciplinaId: d.id, nombre, dia, hora, dur, cupo, instructor: "Profe", activa: true, demo});
      clasesDe.set(`${s.id}_${d.id}_${dia}`, c);
    }
  }
  /* asistencia de las últimas 5 semanas: en los días del horario (las de las últimas 2 semanas llevan la clase) y,
     para disciplinas sin horario, día de por medio */
  const ids = new Map(S.alumnos({todos: true, sede: ""}).filter(a => a.demo).map(a => [a.id, NOMBRES.indexOf(a.nombre)]));
  for(const s of sedes) for(const d of S.discsOfSede(s.id)) for(let k = 1; k < 36; k++){
    const f = addDays(hoy, -k), dia = parseISO(f).getDay();
    const conHorario = [...clasesDe.keys()].some(x => x.startsWith(`${s.id}_${d.id}_`));
    const clases = [...clasesDe.values()].filter(c => c.sedeId === s.id && c.dia === dia && (c.disciplinaId === d.id));
    if(conHorario ? !clases.length : k % 2 === 0) continue;
    const als = S.alumnos({sede: s.id}).filter(a => ids.has(a.id) && (a.disciplinaIds || []).includes(d.id));
    for(const c of clases.length ? clases : [null]){
      const pres = als.filter(a => { const j = ids.get(a.id), aus = AUSENTES[j]; return aus ? k >= aus && Math.random() < 0.8 : Math.random() < (TIQ[j] ? 0.9 : 0.7); }).map(a => a.id);
      if(!pres.length) continue;
      const claseId = c && k <= 14 ? c.id : undefined;
      /* id fijo por clase; si ya hay una clase real ese día se suman los de ejemplo sin marcarla demo */
      const prev = S.asistenciaDe(f, s.id, d.id, claseId);
      if(prev && !prev.demo) S.setPresentes({fecha: f, sedeId: s.id, disciplinaId: d.id, claseId}, [...(prev.presentes || []), ...pres]);
      else S.put("asistencias", Object.assign({id: S.asisId(f, s.id, d.id, claseId), academiaId: acad.id, fecha: f, sedeId: s.id, disciplinaId: d.id, presentes: pres, demo}, claseId ? {claseId} : {}));
    }
  }
  const demoAls = S.alumnos({todos: true, sede: ""}).filter(a => a.demo);
  const porIdx = j => demoAls.find(a => a.nombre === NOMBRES[j]);
  /* tiqueteras: la de 8 clases casi agotada (saldo 1), la de 12 recién comprada */
  for(const [j, n] of Object.entries(TIQ)){
    const al = porIdx(+j); if(!al) continue;
    const fechas = S.all("asistencias").filter(a => (a.presentes || []).includes(al.id)).map(a => a.fecha).sort().reverse();
    const desde = n === 8 ? (fechas[Math.min(6, fechas.length - 1)] || addDays(hoy, -20)) : addDays(hoy, -4);
    const valor = Math.round((acad.valorMensual || 150000) * (n === 8 ? 0.8 : 1.1) / 1000) * 1000;
    S.put("pagos", {alumnoId: al.id, academiaId: acad.id, sedeId: al.sedeId, concepto: "Tiquetera", clases: n, monto: valor, fecha: desde, desde, vence: addDays(desde, 30), metodo: "Nequi", plan: "clase", demo});
  }
  /* recibos numerados en orden de fecha, después del último número que exista */
  let num = Math.max(0, ...S.inAcad("pagos").map(p => Number(p.num) || 0));
  for(const p of S.inAcad("pagos").filter(p => p.demo && !p.num).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || "") || a._c - b._c)) S.put("pagos", {id: p.id, num: ++num});
  /* notas del profe: una lesión activa */
  const nota = (j, dias, tipo, texto, activa = true) => { const al = porIdx(j); if(al) S.put("notas", {academiaId: acad.id, alumnoId: al.id, fecha: addDays(hoy, -dias), tipo, texto, activa, demo}); };
  nota(0, 5, "lesion", t("Molestia en la rodilla derecha. Evitar guardia de la mariposa y derribos esta semana."));
  nota(5, 12, "tecnica", t("Mejoró mucho la defensa de la espalda. Siguiente paso: escapes de montada."));
  nota(10, 20, "conducta", t("Muy buen compañero con los nuevos. Se puede apoyar como asistente en Kids."), false);
  /* prospectos en todas las etapas; uno con prueba hoy */
  const s0 = sedes[0], d0 = S.discsOfSede(s0.id)[0] || discs[0];
  const claseHoy = [...clasesDe.values()].find(c => c.sedeId === s0.id && c.dia === parseISO(hoy).getDay());
  const lead = (nombre, dias, fuente, etapa, extra = {}) => S.put("leads", Object.assign({academiaId: acad.id, sedeId: s0.id, nombre, telefono: "3" + String(100000000 + rnd(899999999)), fuente, etapa,
    disciplinaId: d0.id, fecha: addDays(hoy, -dias), _c: Date.now() - dias * 864e5, seguimientos: [], demo}, extra));
  const wa = (dias, msg) => ({fecha: addDays(hoy, -dias), tipo: "whatsapp", nota: "", msg});
  lead("Andrés Felipe Mejía", 0, "instagram", "nuevo", {edad: 27, nota: t("Preguntó por clases en la noche")});
  lead("Paula Cárdenas", 3, "tiktok", "nuevo", {edad: 19});
  lead("Jorge Iván Quintero", 6, "referido", "contactado", {edad: 34, seguimientos: [wa(5, "contacto")]});
  lead("Natalia Ospina", 2, "facebook", "contactado", {edad: 23, email: "natalia@example.com", seguimientos: [wa(1, "contacto")]});
  lead("Kevin Arango", 4, "web", "prueba", Object.assign({edad: 16, prueba: hoy, seguimientos: [wa(3, "bienvenida")]}, claseHoy ? {claseId: claseHoy.id, disciplinaId: claseHoy.disciplinaId} : {}));
  lead("Laura Villegas", 9, "volante", "prueba", {edad: 31, prueba: addDays(hoy, -2), asistioPrueba: true, seguimientos: [wa(8, "bienvenida"), wa(3, "recordatorio")]});
  const ins = porIdx(16);
  lead(ins ? ins.nombre : "Emilio Suárez", 40, "instagram", "inscrito", {edad: 25, prueba: addDays(hoy, -35), asistioPrueba: true, alumnoId: ins?.id || "", seguimientos: [wa(39, "bienvenida"), wa(34, "dia1")]});
  lead("Ricardo Montoya", 25, "pasaba", "perdido", {edad: 41, motivoPerdido: "Horario", prueba: addDays(hoy, -20), asistioPrueba: false, seguimientos: [wa(24, "bienvenida"), wa(19, "dia1"), wa(17, "dia3")]});
  /* evaluaciones del currículo (requisitos bjj.bl.* de js/entreno/curriculos.js): llegan aparte porque el módulo se carga solo */
  import("./entreno/curriculos.js").then(m => evaluacionesDemo(m, acad, demoAls)).catch(() => {});
  return NOMBRES.length;
}
function evaluacionesDemo(m, acad, als){
  if(!hasDemo()) return;
  const disc = S.disciplinas().find(d => d.sistema === "bjj" || (/jiu|bjj/i.test(d.nombre) && !/kid/i.test(d.nombre)));
  const cur = m.CURRICULOS && (m.CURRICULOS.bjj || (m.curriculoKey && m.CURRICULOS[m.curriculoKey(disc)]));
  if(!disc || !cur || !Array.isArray(cur.rangos)) return;
  const cand = als.filter(a => (a.disciplinaIds || []).includes(disc.id) && a.estado === "activo").map(a => ({a, g: S.rangoActual(a.id, disc.id)}))
    .filter(x => x.g && cur.rangos[x.g.rank] && (cur.rangos[x.g.rank].grados || []).some(g => (g.req || []).length)).sort((x, y) => x.g.rank - y.g.rank).slice(0, 3);
  cand.forEach((x, n) => {
    const reqs = cur.rangos[x.g.rank].grados.flatMap(g => g.req || []);
    const items = {};
    /* uno casi listo, uno a la mitad y uno empezando */
    reqs.forEach((r, i) => { const p = [0.92, 0.6, 0.3][n]; items[r.id] = (i / reqs.length) < p ? (r.critico ? 3 : 2 + (i % 2)) : i % 3 === 0 ? 1 : 0; });
    S.put("evaluaciones", {id: `${x.a.id}:${disc.id}:${x.g.rank}`, academiaId: acad.id, alumnoId: x.a.id, discId: disc.id, rank: x.g.rank, items, nota: "", fecha: addDays(today(), -(n * 6 + 2)), por: "Profe", demo: true});
  });
}

/* fecha de nacimiento: algunos cumplen pronto para que la tarjeta de cumpleaños tenga algo */
function nacer(i, hoy, rnd){
  const y = 1985 + rnd(25);
  if(i === 2 || i === 10 || i === 15){ const d = addDays(hoy, i === 2 ? 0 : i === 10 ? 6 : 19); return `${y}${d.slice(4)}`.replace(/-02-29$/, "-02-28"); }
  return `${y}-${String(1 + rnd(12)).padStart(2, "0")}-${String(1 + rnd(28)).padStart(2, "0")}`;
}

/* borra todo registro demo:true. Lo que el usuario haya creado encima de un alumno de ejemplo (pagos, grados) se va con él;
   en las clases con alumnos reales solo se quitan los de ejemplo. Devuelve cuántos registros tocó. */
export function removeDemo(){
  const ids = new Set(S.all("alumnos").filter(a => a.demo).map(a => a.id));
  let n = 0;
  for(const r of S.all("asistencias")){
    const pres = r.presentes || [];
    /* también los ids de alumnos ya borrados (p. ej. que volvieron con la copia de otro aparato) */
    const keep = pres.filter(id => !ids.has(id) && S.get("alumnos", id));
    if(r.demo && !keep.length){ S.del("asistencias", r.id); n++; }
    else if(r.demo || keep.length !== pres.length){ S.put("asistencias", Object.assign({}, r, {presentes: keep, demo: false})); n++; }
  }
  for(const c of S.COLS){
    if(c === "asistencias") continue;
    for(const r of S.all(c)) if(r.demo || (r.alumnoId && ids.has(r.alumnoId))){ S.del(c, r.id); n++; }
  }
  for(const id of ids) if(S.fotoMeta(id)) S.setFoto(id, null);
  return n;
}
