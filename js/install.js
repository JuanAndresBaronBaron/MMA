/* Instalar la app (PWA): guarda el aviso del navegador, cuenta visitas y ofrece la tarjeta de «Instalar» en Inicio. */
import * as S from "./store.js";
import {icon, toast, modal} from "./ui.js";
import {t} from "./i18n.js";

let deferred = null, inited = false;
const standalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

export function initInstall(){
  if(inited) return; inited = true;
  /* una visita por día cuenta una vez */
  const d = new Date().toISOString().slice(0, 10), v = S.pref("visitas", {n: 0, d: ""});
  if(v.d !== d) S.setPref("visitas", {n: (v.n || 0) + 1, d});
  window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; window.dispatchEvent(new Event("mma:install")); });
  window.addEventListener("appinstalled", () => { deferred = null; S.setPref("instalada", true); toast(t("¡App instalada! Ábrela desde tu pantalla de inicio.")); window.dispatchEvent(new Event("mma:install")); });
}
/* "installed" | "available" (Chrome/Android/Edge) | "ios" (Safari: a mano) | "none" */
export function installState(){
  if(standalone() || S.pref("instalada", false) && !deferred) return "installed";
  if(deferred) return "available";
  if(isIOS()) return "ios";
  return "none";
}
export async function promptInstall(){
  if(deferred){
    const e = deferred; deferred = null;
    try{ e.prompt(); const r = await e.userChoice; return r && r.outcome === "accepted"; }catch(err){ return false; }
  }
  if(isIOS()){ iosHelp(); return false; }
  toast(t("Abre el menú del navegador y elige «Instalar app» o «Agregar a la pantalla de inicio»."), "warn", null, {ms: 6000});
  return false;
}
export const iosStepsHTML = () => `<ol class="ios-steps">
  <li>${t("Toca {x} Compartir en la barra de Safari.", {x: icon("share", "inline")})}</li>
  <li>${t("Elige «Agregar a inicio».")}</li>
  <li>${t("Toca «Agregar». La app queda como un ícono más.")}</li></ol>`;
export function iosHelp(){
  modal({title: t("Instalar en iPhone o iPad"), body: `<p class="muted">${t("En Safari se instala en tres pasos:")}</p>${iosStepsHTML()}`, foot: false});
}
/* tarjeta para Inicio: desde la 3.ª visita, si se puede instalar y no se descartó */
export function installCardHTML(){
  const st = installState();
  if(st === "installed" || st === "none" || S.pref("installHide", false) || (S.pref("visitas", {n: 0}).n || 0) < 3) return "";
  return `<section class="card install-card" data-install-card><span class="li-ic">${icon("download")}</span>
    <div><b>${t("Instala AcademiaPro en este aparato")}</b><p class="muted small">${t("Ábrela como una app, a pantalla completa y sin internet.")}</p></div>
    <div class="row gap"><button type="button" class="btn primary small" data-install>${icon("download")} ${t("Instalar")}</button>
    <button type="button" class="btn ghost small" data-install-hide>${t("Ahora no")}</button></div></section>`;
}
export function bindInstallCard(el){
  const card = el && (el.matches?.("[data-install-card]") ? el : el.querySelector("[data-install-card]")); if(!card) return;
  card.querySelector("[data-install]").onclick = async () => { if(await promptInstall()) card.remove(); };
  card.querySelector("[data-install-hide]").onclick = () => { S.setPref("installHide", true); card.remove(); };
}
