/* Alumnos de ejemplo para probar la app (Ajustes › Cargar alumnos de ejemplo). */
import * as S from "./store.js";
import {today, addMonths, addDays} from "./util.js";
import {BLOOD} from "./catalog.js";

const NOMBRES = ["Santiago Restrepo", "Valentina Gómez", "Mateo Rodríguez", "Isabella Martínez", "Sebastián López", "Camila Hernández", "Nicolás García", "Mariana Torres",
  "Samuel Ramírez", "Daniela Vargas", "Alejandro Castro", "Sofía Moreno", "Juan David Rojas", "Luciana Ortiz", "Tomás Jiménez", "Gabriela Ruiz", "Emilio Suárez", "Antonella Díaz"];

export function loadDemo(){
  const acad = S.academy(), sedes = S.sedes(), discs = S.disciplinas();
  if(!sedes.length || !discs.length) return;
  const rnd = n => Math.floor(Math.random() * n);
  const t = today();
  NOMBRES.forEach((nombre, i) => {
    const sede = sedes[i % sedes.length];
    const ds = S.discsOfSede(sede.id);
    const mine = ds.filter((d, j) => j === i % ds.length || Math.random() < 0.35);
    const inicio = addMonths(t, -(3 + rnd(60)));
    const al = S.put("alumnos", {academiaId: acad.id, nombre, sedeId: sede.id, estado: i === 17 ? "inactivo" : "activo", plan: i % 7 === 0 ? "trimestral" : "mensual",
      valor: acad.valorMensual || 150000, fechaInicio: inicio, nacimiento: `${1985 + rnd(25)}-${String(1 + rnd(12)).padStart(2, "0")}-${String(1 + rnd(28)).padStart(2, "0")}`,
      telefono: "3" + String(100000000 + rnd(899999999)), sangre: BLOOD[rnd(BLOOD.length)], eps: ["Sura", "Sanitas", "Nueva EPS", "Compensar"][rnd(4)],
      emergencia: "Familiar", emergenciaTel: "3" + String(100000000 + rnd(899999999)), genero: i % 2 ? "F" : "M",
      disciplinaIds: mine.map(d => d.id), equipo: {gi: {tiene: Math.random() < 0.6, talla: ["A1", "A2", "A3"][rnd(3)]}, bucal: {tiene: Math.random() < 0.5}, guantes: {tiene: Math.random() < 0.7, talla: "12 oz"}}});
    for(const d of mine){
      let fecha = inicio, rank = 0, grado = 0;
      S.put("grados", {alumnoId: al.id, disciplinaId: d.id, rank, grado, fecha, inicial: true, nota: "Grado al ingresar"});
      for(;;){
        const rd = d.ranks[rank];
        const fast = Math.random() < 0.12;
        let step;
        if(rd.g && grado < rd.g){ step = Math.max(1, (rd.mg || 2) * (fast ? 0.4 : 1 + Math.random() * 0.6)); grado++; }
        else if(rank < d.ranks.length - 2){ step = Math.max(1, (rd.m || 6) * (fast ? 0.5 : 1 + Math.random() * 0.4) - (rd.g || 0) * (rd.mg || 0)); rank++; grado = 0; }
        else break;
        const nf = addDays(fecha, Math.round(step * 30.4));
        if(nf > t) break;
        fecha = nf;
        S.put("grados", {alumnoId: al.id, disciplinaId: d.id, rank, grado, fecha, profesor: "Profe"});
      }
    }
    /* pagos: los últimos meses, algunos atrasados */
    const atraso = [0, 0, 0, 1, 2, -1][rnd(6)];
    let desde = addMonths(t, -4);
    for(let k = 0; k < 4 - atraso; k++){
      const hasta = addMonths(desde, 1);
      S.put("pagos", {alumnoId: al.id, academiaId: acad.id, sedeId: sede.id, concepto: "Mensualidad", monto: al.valor, fecha: addDays(desde, rnd(4)), metodo: ["Efectivo", "Nequi", "Transferencia"][rnd(3)], plan: "mensual", desde, hasta});
      desde = hasta;
    }
  });
  /* asistencia de las últimas 3 semanas */
  for(const s of sedes) for(const d of S.discsOfSede(s.id)) for(let k = 1; k < 21; k += 2){
    const als = S.alumnos({sede: s.id}).filter(a => (a.disciplinaIds || []).includes(d.id));
    S.put("asistencias", {academiaId: acad.id, fecha: addDays(t, -k), sedeId: s.id, disciplinaId: d.id, presentes: als.filter(() => Math.random() < 0.7).map(a => a.id)});
  }
}
