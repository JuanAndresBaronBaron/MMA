/* Modos de uso de este aparato. Es una app sin servidor: un modo solo cambia lo que se ve aquí, no protege los datos.
   - "estudiante": entrena por su cuenta (caminos, rutina, progreso y frases). No necesita academia.
   - "dueno": toda la app (lo de siempre).
   - "profesor": modo recortado que el dueño activa en el aparato de un profesor: pasar lista, alumnos, grados,
     horario, entrenamiento y frases, sin pagos, reportes, prospectos, tienda ni ajustes de la academia.
     Salir pide el PIN que se puso al activarlo (como el del kiosco).
   El modo vive en la preferencia "rol" de este aparato. perfil/yo (colección sincronizada, mezclada campo por campo)
   guarda el de la cuenta: dueno al crear academia, estudiante si no tiene academia. Ocultar la academia para entrenar
   y el modo profesor no viajan: son de ese aparato. Quien ya tenía academia y ningún modo queda como dueño (app.js lo fija al arrancar). */
import * as S from "./store.js";
import {modal, toast} from "./ui.js";
import {h} from "./util.js";
import {t} from "./i18n.js";

export const PERFIL = "yo";
export const ROLES = {estudiante: "Estudiante", dueno: "Dueño de academia", profesor: "Profesor"};
export const ROL_IC = {estudiante: "fist", dueno: "building", profesor: "users"};
export const perfil = () => S.get("perfil", PERFIL);

export function rol(){
  const p = S.pref("rol"), acad = !!S.academy();
  if(p === "profesor" && acad && S.pref("rolPin")) return "profesor";
  if(p === "dueno" && acad) return "dueno";
  if(p === "estudiante") return "estudiante";
  /* aparato sin modo: con academia, dueño; sin ella, el de la cuenta (perfil sincronizado) */
  if(acad) return "dueno";
  return perfil()?.rol === "estudiante" ? "estudiante" : null;
}

/* menú del estudiante: las sub-pantallas de Entrenamiento son secciones propias ([grupo, nombre, [[ruta, icono, título]]]) */
export const NAV_ESTUDIANTE = [["practica", "Práctica", [["entreno", "fist", "Entrenamiento"], ["entreno/stats", "chart", "Progreso"], ["entreno/repaso", "repeat", "Repaso"], ["entreno/diario", "edit", "Diario"]]],
  ["aprender", "Aprender", [["entreno/glosario", "book", "Glosario"], ["entreno/curriculo", "belt", "Mi cinturón"], ["entreno/logros", "award", "Logros"], ["frases", "flame", "Frases"]]]];

/* rutas de cada modo; el dueño ve todas */
const ALLOW = {
  estudiante: ["entreno", "frases", "ajustes"],
  profesor: ["inicio", "asistencia", "horario", "alumnos", "alumno", "grados", "certificado", "ranking", "entreno", "frases", "ajustes", "kiosko"],
};
export const allowed = (k, r = rol()) => !ALLOW[r] || ALLOW[r].includes(k);
export const home = (r = rol()) => r === "estudiante" ? "entreno" : "inicio";
/* ¿este enlace (#/ruta/...) se puede abrir en el modo actual? */
export const allowedHref = href => allowed(String(href || "").replace(/^#\/?/, "").split(/[/?]/)[0] || home());
/* nombre de la academia para imágenes y textos; en modo estudiante la academia queda oculta */
export const nombreAcademia = () => rol() === "estudiante" ? "" : S.academy()?.nombre || "";
/* ve dinero (pagos, deudas, montos) */
export const veDinero = () => rol() === "dueno";

/* guarda campos del perfil con su hora (_f), para que store.merge los mezcle uno por uno entre aparatos */
export function guardarPerfil(datos){
  const prev = S.get("perfil", PERFIL) || {}, u = Math.max(Date.now(), (prev._u || 0) + 1), f = Object.assign({}, prev._f);
  for(const k of Object.keys(datos)) f[k] = u;
  return S.put("perfil", Object.assign({id: PERFIL}, datos, {_f: f}));
}
/* cambia el modo de este aparato. Solo viaja a la cuenta lo que vale para todos sus aparatos: dueño (tiene academia)
   o estudiante sin academia. Ocultar la academia para entrenar y el modo profesor son de este aparato */
export function setRol(r){
  if(!ROLES[r]) return;
  S.setPref("rol", r);
  if(r === "profesor") return;
  S.setPref("rolPin", "");
  const cuenta = r === "dueno" || !S.academy();
  if(cuenta && perfil()?.rol !== r) guardarPerfil({rol: r});
}
/* después de entrar con Google en la bienvenida: aplicar el modo guardado en la cuenta.
   elegido: lo que la persona eligió en la bienvenida ("estudiante" o "dueno"); manda en este aparato */
export function adoptarSincronizado(elegido){
  const r = perfil()?.rol, acad = !!S.academy();
  if(elegido === "estudiante") S.setPref("rol", "estudiante");
  else if(acad) S.setPref("rol", "dueno");
  else if(r === "estudiante" && elegido !== "dueno") S.setPref("rol", "estudiante");
  else return null;
  return rol();
}

/* ---------- PIN del modo profesor ---------- */
const pinOk = v => /^\d{4,6}$/.test(v);
const pinInput = (id, label, hint = "") => `<div class="field"><label class="lbl" for="${id}">${label}</label><input id="${id}" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="off" enterkeyhint="done">${hint ? `<small class="hint">${hint}</small>` : ""}</div>`;
/* crear el PIN y activar el modo profesor. Devuelve true si se activó */
export function activarProfesor(){
  return new Promise(res => {
    const body = h(`<form class="form" novalidate>
      <p class="muted small rol-help">${t("Este aparato mostrará solo asistencia, horario, alumnos, grados, ranking, entrenamiento y frases, sin pagos ni montos. Para salir se pide este PIN.")}</p>
      ${pinInput("rolPin1", t("PIN para salir (4 a 6 números)"), t("Solo lo sabe el dueño de la academia."))}
      ${pinInput("rolPin2", t("Repite el PIN"))}
    </form>`);
    let done = false;
    const m = modal({title: t("Activar modo profesor"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Activar")}</button>`,
      onClose: () => { if(!done) res(false); }});
    const [a, b] = body.querySelectorAll("input");
    setTimeout(() => a.focus(), 80);
    const save = () => {
      if(!pinOk(a.value)){ toast(t("El PIN debe tener de 4 a 6 números"), "warn"); a.focus(); return; }
      if(a.value !== b.value){ toast(t("Los PIN no coinciden"), "warn"); b.value = ""; b.focus(); return; }
      S.setPref("rolPin", a.value);
      setRol("profesor");
      done = true; m.close(); res(true);
    };
    m.foot.querySelector("[data-save]").onclick = save;
    body.addEventListener("submit", e => { e.preventDefault(); save(); });
  });
}
/* pedir el PIN para salir del modo profesor. Devuelve true si es correcto (y vuelve al modo dueño) */
export function salirProfesor(){
  return new Promise(res => {
    const body = h(`<form class="form" novalidate>${pinInput("rolOut", t("PIN del dueño"))}</form>`);
    let done = false;
    const m = modal({title: t("Salir del modo profesor"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-out>${t("Salir")}</button>`,
      onClose: () => { if(!done) res(false); }});
    const inp = body.querySelector("input");
    setTimeout(() => inp.focus(), 80);
    const go = () => {
      if(!inp.value || inp.value !== S.pref("rolPin")){ inp.value = ""; inp.classList.add("bad"); toast(t("PIN incorrecto"), "error", null, {key: "rpin"}); inp.focus(); return; }
      setRol("dueno");
      done = true; m.close(); res(true);
    };
    m.foot.querySelector("[data-out]").onclick = go;
    body.addEventListener("submit", e => { e.preventDefault(); go(); });
  });
}
