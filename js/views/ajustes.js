import * as S from "../store.js";
import * as Sync from "../sync.js";
import {icon, toast, confirmDlg, formModal, haptic} from "../ui.js";
import {esc, download, today, fmtDate} from "../util.js";
import {themePref, setTheme, gIcon} from "../shell.js";
import {loadDemo, removeDemo, hasDemo} from "../demo.js";
import {GOOGLE_CLIENT_ID} from "../config.js";
import {installState, promptInstall, iosStepsHTML} from "../install.js";
import {t, tn, lang, locale, setLang, LANGS} from "../i18n.js";

/* globo (idioma); no está en el set de iconos compartido */
const GLOBE = `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"/></svg>`;

export function render(el){
  const st = Sync.status();
  const n = c => S.all(c).length;
  const inst = installState();
  const last = st.lastSync ? new Date(st.lastSync).toLocaleString(locale(), {dateStyle: "medium", timeStyle: "short"}) : t("nunca");

  const ic = (n, rc) => `<span class="row-ic" style="--rc:var(--chip-${rc})">${n === "globe" ? GLOBE : icon(n)}</span>`;
  const conn = Sync.connected();
  const theme = themePref();
  const themeOpt = (k, l) => `<label class="aj-ap aj-ap-${k}"><input type="radio" name="theme" value="${k}" data-set-theme ${theme === k ? "checked" : ""}>
    <span class="aj-ap-shot" aria-hidden="true"><i></i><i></i><i></i></span><span class="aj-ap-l">${esc(l)}</span><span class="aj-ap-ck" aria-hidden="true"></span></label>`;

  const cuenta = conn ? `
    <h3 class="section-header">${t("Cuenta y sincronización")}</h3>
    <section class="grouped aj-grp">
      <div class="row-inset aj-me">${st.photo ? `<img class="aj-av" src="${esc(st.photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="aj-av">${icon("cloud")}</span>`}
        <div class="aj-me-t"><b>${esc(st.name || t("Cuenta de Google"))}</b><span>${esc(st.email || "")}</span></div></div>
      <div class="row-inset">${ic(st.phase === "ok" ? "check" : "sync", st.phase === "ok" ? "olive" : st.phase === "reconnect" ? "burnt" : "steel")}<span class="aj-l aj-wrap">${st.phase === "ok" ? esc(t("Sincronizado · última vez {fecha}", {fecha: last})) : esc(st.msg || t("Sincronizando…"))}</span></div>
      ${st.phase === "reconnect" ? `<button type="button" class="row-inset aj-act" data-reconnect>${ic("sync", "burnt")}<span class="aj-l">${t("Reconectar")}</span></button>`
        : `<button type="button" class="row-inset aj-act" data-sync>${ic("sync", "steel")}<span class="aj-l">${t("Sincronizar ahora")}</span></button>`}
      <button type="button" class="row-inset aj-act aj-red" data-disconnect>${ic("logout", "graphite")}<span class="aj-l">${t("Desconectar")}</span></button>
    </section>
    <p class="section-footer">${t("Los datos se guardan en una carpeta privada de la app dentro de tu Google Drive (no se ve entre tus archivos y la app no puede leer nada más). Entra con la misma cuenta en el celular o el computador y verás lo mismo.")}</p>`
  : `
    <h3 class="section-header">${t("Cuenta y sincronización")}</h3>
    <section class="grouped aj-grp">
      <div class="row-inset aj-me"><span class="aj-av off">${icon("cloudOff")}</span>
        <div class="aj-me-t"><b>Google Drive</b><span>${t("Ahora tus datos están")} ${t("solo en este aparato")}.</span></div></div>
      <button type="button" class="row-inset aj-act aj-google" data-connect><span class="aj-g">${gIcon()}</span><span class="aj-l">${t("Entrar con Google")}</span></button>
    </section>
    <p class="section-footer">${st.msg ? `<span class="err-t">${esc(st.msg)}</span><br>` : ""}${t("Conecta Google para tener copia en tu Drive y usar la app en varios dispositivos.")}</p>`;

  const prefs = `
    <h3 class="section-header">${t("Preferencias")}</h3>
    <section class="grouped aj-grp">
      <div class="row-inset aj-ctl">${ic("globe", "steel")}<span class="aj-l">${t("Idioma")}</span>
        <div class="seg small" role="radiogroup" aria-label="${t("Idioma / Language")}">${LANGS.map(([k, l]) => `<label><input type="radio" name="lang" value="${k}" data-lang ${lang() === k ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div></div>
      <div class="aj-theme" role="radiogroup" aria-label="${t("Tema")}">${themeOpt("system", t("Sistema"))}${themeOpt("light", t("Claro"))}${themeOpt("dark", t("Oscuro"))}</div>
    </section>
    <h3 class="section-header">${t("Datos de ejemplo")}</h3>
    <section class="grouped aj-grp">
      ${hasDemo() ? `<button type="button" class="row-inset aj-act aj-red" data-undemo>${ic("trash", "graphite")}<span class="aj-l">${t("Quitar datos de ejemplo")}</span></button>`
        : `<button type="button" class="row-inset aj-act" data-demo>${ic("users", "brass")}<span class="aj-l">${t("Cargar alumnos de ejemplo")}</span></button>`}
      ${S.academy() && S.pref("setupHide:" + S.academy().id, false) ? `<button type="button" class="row-inset aj-act" data-setup-show>${ic("check", "olive")}<span class="aj-l">${t("Mostrar primeros pasos")}</span></button>` : ""}
    </section>`;

  const copia = `
    <h3 class="section-header">${t("Copia de seguridad")}</h3>
    <section class="grouped aj-grp">
      <button type="button" class="row-inset aj-act" data-export>${ic("download", "olive")}<span class="aj-l">${t("Descargar copia (.json)")}</span></button>
      <label class="row-inset aj-act" tabindex="0" role="button">${ic("upload", "steel")}<span class="aj-l">${t("Restaurar copia")}</span><input type="file" accept=".json,application/json" data-import hidden></label>
    </section>
    <p class="section-footer">${t("Descarga todos los datos en un archivo (sin fotos) o restaura uno descargado antes. Al restaurar se mezcla con lo que ya hay.")}<br>
      <span class="tnum">${tn(n("alumnos"), "1 alumno", "{n} alumnos")} · ${tn(n("pagos"), "1 pago", "{n} pagos")} · ${tn(n("grados"), "1 registro de grado", "{n} registros de grado")} · ${tn(n("asistencias"), "1 clase", "{n} clases")} · ${tn(S.fotoIds().length, "1 foto", "{n} fotos")}</span></p>`;

  const instalar = `
    <h3 class="section-header">${t("Instalar app")}</h3>
    <section class="grouped aj-grp">
      ${inst === "installed" ? `<div class="row-inset">${ic("check", "olive")}<span class="aj-l">AcademiaPro</span><span class="row-val">${t("Instalada")}</span></div>`
      : inst === "ios" ? `<div class="row-inset">${ic("share", "steel")}<span class="aj-l aj-wrap">${t("En iPhone o iPad se instala desde Safari:")}</span></div><div class="aj-steps">${iosStepsHTML()}</div>`
      : `<button type="button" class="row-inset aj-act" data-install>${ic("download", "crimson")}<span class="aj-l">${t("Instalar app")}</span></button>`}
    </section>
    <p class="section-footer">${inst === "installed" ? t("Ya usas AcademiaPro como app en este aparato.") : t("Ábrela como una app: ícono en tu pantalla, pantalla completa y funciona sin internet.")}</p>`;

  const atajos = `
    <h3 class="section-header">${t("Atajos y búsqueda")}</h3>
    <section class="grouped aj-grp">
      <button type="button" class="row-inset chev" data-palette>${ic("search", "steel")}<span class="aj-l">${t("Abrir buscador")}</span><kbd class="aj-kbd hide-s">Ctrl K</kbd></button>
      <button type="button" class="row-inset chev" data-keys>${ic("keyboard", "gunmetal")}<span class="aj-l">${t("Ver atajos")}</span></button>
    </section>
    <p class="section-footer">${t("Busca alumnos, pagos, técnicas y acciones desde cualquier pantalla con Ctrl+K (o Cmd+K en Mac) o la lupa de arriba.")}</p>`;

  const avanzado = `
    <h3 class="section-header">${t("Avanzado")}</h3>
    <section class="grouped aj-grp">
      <button type="button" class="row-inset chev" data-client>${ic("info", "gunmetal")}<span class="aj-l">${t("Cambiar ID de cliente")}</span></button>
    </section>
    <p class="section-footer">${t("ID de cliente de Google en uso:")} <code class="break aj-code">${esc(Sync.clientId())}</code></p>
    <section class="grouped aj-grp">
      <button type="button" class="row-inset aj-act aj-red aj-center" data-wipe><span class="aj-l">${t("Borrar datos de este aparato")}</span></button>
    </section>
    <p class="section-footer aj-legal"><a href="privacy.html" target="_blank">${t("Privacidad")}</a> · AcademiaPro · ${t("Gratis y de código abierto")}</p>`;

  el.innerHTML = `<div class="aj">
    <div class="aj-col">${cuenta}${prefs}${copia}</div>
    <div class="aj-col">${instalar}${atajos}${avanzado}</div>
  </div>`;

  el.onclick = async e => {
    const tg = e.target;
    if(tg.closest("[data-connect]")){ try{ await Sync.connect(); toast(t("Conectado con Google Drive")); }catch(err){ toast(Sync.errText(err.code), "error"); } render(el); return; }
    if(tg.closest("[data-reconnect]")){ await Sync.reconnect(); render(el); return; }
    if(tg.closest("[data-sync]")){ await Sync.sync(); toast(Sync.status().phase === "ok" ? t("Sincronizado") : Sync.status().msg, Sync.status().phase === "ok" ? "ok" : "warn"); render(el); return; }
    if(tg.closest("[data-disconnect]")){ if(await confirmDlg(t("Los datos quedan en este aparato y en tu Drive. Podrás volver a conectar cuando quieras."), {ok: t("Desconectar"), danger: false})){ Sync.disconnect(); render(el); } return; }
    if(tg.closest("[data-install]")){ if(await promptInstall()) render(el); return; }
    if(tg.closest("[data-palette]")){ import("../palette.js").then(m => m.openPalette()).catch(() => {}); return; }
    if(tg.closest("[data-keys]")){ import("../palette.js").then(m => m.atajos()).catch(() => {}); return; }
    if(tg.closest("[data-export]")){ download(`academia-copia-${today()}.json`, JSON.stringify(S.snapshot())); return; }
    if(tg.closest("[data-demo]")){ const k = loadDemo(); k ? toast(t("Alumnos de ejemplo agregados")) : toast(t("Primero crea una sede y una disciplina en Academia."), "warn"); render(el); return; }
    if(tg.closest("[data-undemo]")){
      if(!await confirmDlg(t("Se borran los alumnos, pagos, grados y asistencias de ejemplo. Tus datos reales no se tocan."), {ok: t("Quitar datos de ejemplo"), title: t("¿Quitar datos de ejemplo?")})) return;
      removeDemo(); toast(t("Datos de ejemplo quitados")); render(el); return;
    }
    if(tg.closest("[data-setup-show]")){ S.setPref("setupHide:" + S.academy().id, false); toast(t("Primeros pasos visibles en Inicio")); render(el); return; }
    if(tg.closest("[data-client]")) return formModal({title: t("ID de cliente de Google"), values: {id: S.pref("clientId", "")}, fields: [
      {k: "id", label: t("ID de cliente OAuth (termina en .apps.googleusercontent.com)"), ph: GOOGLE_CLIENT_ID, hint: t("Déjalo vacío para usar el de la app.")}],
      onSave: v => { S.setPref("clientId", v.id); toast(t("Guardado. Vuelve a conectar Google.")); render(el); }});
    if(tg.closest("[data-wipe]")){
      if(!await confirmDlg(Sync.connected() ? t("Se borran los datos de este aparato y se desconecta Google. La copia en tu Drive NO se borra: al volver a entrar con Google se recupera.") : t("Se borrarán TODOS los datos de este aparato. Descarga una copia antes si la necesitas."), {ok: t("Borrar todo")})) return;
      Sync.disconnect(); localStorage.clear(); indexedDB.deleteDatabase("mma-fotos"); location.reload();
    }
  };
  el.querySelectorAll("[data-set-theme]").forEach(r => r.onchange = () => { if(r.checked){ haptic("selection"); setTheme(r.value); } });
  /* la fila de restaurar es un label: Enter o espacio abren el selector de archivo */
  const rest = el.querySelector("label.aj-act");
  if(rest) rest.onkeydown = e => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); rest.querySelector("input").click(); } };
  el.querySelectorAll("[data-lang]").forEach(r => r.onchange = () => { if(r.checked && r.value !== lang()) setLang(r.value); });
  const imp = el.querySelector("[data-import]");
  imp.onchange = async () => {
    const f = imp.files[0]; if(!f) return;
    try{ const o = JSON.parse(await f.text()); if(!o.col) throw 0; S.merge(o, true); S.flush(); toast(t("Copia restaurada")); }
    catch(err){ toast(t("El archivo no es una copia válida"), "error"); }
  };
}
