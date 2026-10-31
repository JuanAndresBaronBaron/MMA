/* Alumnos de ejemplo para probar la app (Inicio › Probar con datos de ejemplo, Ajustes › Cargar alumnos de ejemplo).
   Todo registro creado aquí lleva demo:true para poder quitarlo después sin tocar los datos reales. */
import * as S from "./store.js";
import {today, addMonths, addDays} from "./util.js";
import {BLOOD, planById} from "./catalog.js";
import {t} from "./i18n.js";

const NOMBRES = ["Santiago Restrepo", "Valentina Gómez", "Mateo Rodríguez", "Isabella Martínez", "Sebastián López", "Camila Hernández", "Nicolás García", "Mariana Torres",
  "Samuel Ramírez", "Daniela Vargas", "Alejandro Castro", "Sofía Moreno", "Juan David Rojas", "Luciana Ortiz", "Tomás Jiménez", "Gabriela Ruiz", "Emilio Suárez", "Antonella Díaz"];
/* estado de pago por índice: días hasta el vencimiento (negativo = vencido). ~11 al día, 3 pronto, 3 vencidos */
const VENC = {3: -4, 8: -12, 13: -35}, PRONTO = {1: 0, 6: 2, 11: 4};
/* alumnos que dejaron de venir: días desde la última clase */
const AUSENTES = {4: 16, 9: 23, 14: 31};

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
    const plan = i % 7 === 0 ? "trimestral" : "mensual", pm = planById(plan).meses;
    const al = S.put("alumnos", {academiaId: acad.id, nombre, sedeId: sede.id, estado: i === 17 ? "inactivo" : "activo", plan,
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
    for(let k = 0; k < 4; k++){
      const hasta = addMonths(fin, -k * pm), desde = addMonths(fin, -(k + 1) * pm);
      if(desde < inicio) break;
      const f = addDays(desde, rnd(4));
      S.put("pagos", {alumnoId: al.id, academiaId: acad.id, sedeId: sede.id, concepto: "Mensualidad", monto: al.valor, fecha: f > hoy ? hoy : f,
        metodo: ["Efectivo", "Nequi", "Transferencia"][rnd(3)], plan, desde, hasta, demo});
    }
  });
  /* asistencia de las últimas 5 semanas, día de por medio */
  const ids = new Map(S.alumnos({todos: true, sede: ""}).filter(a => a.demo).map(a => [a.id, NOMBRES.indexOf(a.nombre)]));
  for(const s of sedes) for(const d of S.discsOfSede(s.id)) for(let k = 1; k < 36; k += 2){
    const als = S.alumnos({sede: s.id}).filter(a => ids.has(a.id) && (a.disciplinaIds || []).includes(d.id));
    const pres = als.filter(a => { const aus = AUSENTES[ids.get(a.id)]; return aus ? k >= aus && Math.random() < 0.8 : Math.random() < 0.7; }).map(a => a.id);
    if(!pres.length) continue;
    /* id fijo por clase; si ya hay una clase real ese día se suman los de ejemplo sin marcarla demo */
    const f = addDays(hoy, -k), prev = S.asistenciaDe(f, s.id, d.id);
    if(prev && !prev.demo) S.setPresentes({fecha: f, sedeId: s.id, disciplinaId: d.id}, [...(prev.presentes || []), ...pres]);
    else S.put("asistencias", {id: S.asisId(f, s.id, d.id), academiaId: acad.id, fecha: f, sedeId: s.id, disciplinaId: d.id, presentes: pres, demo});
  }
  return NOMBRES.length;
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
