/* Idiomas: español (base) e inglés.
   - t("Texto en español", {n: 3}) devuelve el texto en el idioma elegido; las claves son el propio texto en español
     y las variables van entre llaves: t("Vencido hace {n} días", {n}).
   - tn(n, "1 día", "{n} días") elige singular o plural y traduce.
   - Si una clave no tiene traducción se muestra el español: así un nombre que puso el usuario (una sede, un cinturón
     personalizado) pasa tal cual, y los nombres por defecto del catálogo («Blanco», «Mensual»…) sí se traducen.
   - Cambiar de idioma recarga la página. */
import app from "./i18n/en-app.js";
import ui from "./i18n/en-ui.js";
import util from "./i18n/en-util.js";
import store from "./i18n/en-store.js";
import sync from "./i18n/en-sync.js";
import forms from "./i18n/en-forms.js";
import catalog from "./i18n/en-catalog.js";
import dashboard from "./i18n/en-dashboard.js";
import alumnos from "./i18n/en-alumnos.js";
import alumno from "./i18n/en-alumno.js";
import pagos from "./i18n/en-pagos.js";
import grados from "./i18n/en-grados.js";
import ranking from "./i18n/en-ranking.js";
import asistencia from "./i18n/en-asistencia.js";
import tienda from "./i18n/en-tienda.js";
import academia from "./i18n/en-academia.js";
import ajustes from "./i18n/en-ajustes.js";
import entreno from "./i18n/en-entreno.js";

export const EN = Object.assign({}, catalog, util, store, sync, ui, forms, app, dashboard, alumnos, alumno, pagos, grados, ranking, asistencia, tienda, academia, ajustes, entreno);
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
