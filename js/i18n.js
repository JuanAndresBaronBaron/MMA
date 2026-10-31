/* Idiomas: español (base) e inglés.
   - t("Texto en español", {n: 3}) devuelve el texto en el idioma elegido; las claves son el propio texto en español
     y las variables van entre llaves: t("Vencido hace {n} días", {n}).
   - tn(n, "1 día", "{n} días") elige singular o plural y traduce.
   - Si una clave no tiene traducción se muestra el español: así un nombre que puso el usuario (una sede, un cinturón
     personalizado) pasa tal cual, y los nombres por defecto del catálogo («Blanco», «Mensual»…) sí se traducen.
   - Cambiar de idioma recarga la página. */
/* cada vista trae su archivo en-*.js; si uno falta o falla, la app sigue (en español) */
const NAMES = ["app", "ui", "util", "store", "sync", "forms", "catalog", "dashboard", "alumnos", "alumno", "pagos", "grados", "ranking", "asistencia", "tienda", "academia", "ajustes", "entreno", "clases", "leads", "inscripcion", "recibo", "reportes", "certificado", "evaluacion", "ficha", "palette", "frases"];
const mods = await Promise.all(NAMES.map(n => import(`./i18n/en-${n}.js`).catch(() => ({default: {}}))));
/* el catálogo y lo común primero (como antes), para que los textos de cada pantalla los pisen */
const FIRST = ["catalog", "util", "store", "sync", "ui", "forms"];
const order = [...FIRST, ...NAMES.filter(n => !FIRST.includes(n))];
export const EN = Object.assign({}, ...order.map(n => mods[NAMES.indexOf(n)].default || {}));
export const LANGS = [["es", "Español"], ["en", "English"]];
const KEY = "mma:lang";

let cur = (() => {
  try{ const s = localStorage.getItem(KEY); if(s === "es" || s === "en") return s; }catch(e){}
  return /^es\b/i.test(navigator.language || "es") ? "es" : "en";
})();
document.documentElement.lang = cur;

export const lang = () => cur;
/* para Intl (fechas, números, moneda) */
export const locale = () => (cur === "en" ? "en-US" : "es-CO");
export function setLang(l){
  if(l !== "es" && l !== "en") return;
  try{ localStorage.setItem(KEY, l); }catch(e){}
  location.reload();
}
export function t(es, vars){
  let s = cur === "en" && Object.prototype.hasOwnProperty.call(EN, es) ? EN[es] : es;
  if(vars) s = String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
  return s;
}
export const tn = (n, one, many, vars) => t(n === 1 ? one : many, Object.assign({n}, vars));
