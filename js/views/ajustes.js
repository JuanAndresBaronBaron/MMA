import * as S from "../store.js";
import * as Sync from "../sync.js";
import {icon, toast, confirmDlg, formModal} from "../ui.js";
import {esc, download, today, fmtDate} from "../util.js";
import {toggleTheme, gIcon} from "../app.js";
import {GOOGLE_CLIENT_ID} from "../config.js";
import {t, tn, lang, locale, setLang, LANGS} from "../i18n.js";

export function render(el){
  const st = Sync.status();
  const n = c => S.all(c).length;
  const last = st.lastSync ? new Date(st.lastSync).toLocaleString(locale(), {dateStyle: "medium", timeStyle: "short"}) : t("nunca");

  el.innerHTML = `
  <section class="card">
    <header class="card-h"><h3>${icon("cloud")} Google Drive</h3></header>
    ${Sync.connected() ? `
      <div class="acct big">${st.photo ? `<img src="${esc(st.photo)}" alt="" referrerpolicy="no-referrer">` : icon("cloud")}<div><b>${esc(st.name || t("Cuenta de Google"))}</b><span class="muted">${esc(st.email)}</span></div></div>
      <p class="small">${st.phase === "ok" ? `${icon("check", "inline ok-t")} ${esc(t("Sincronizado · última vez {fecha}", {fecha: last}))}` : esc(st.msg || t("Sincronizando…"))}</p>
      <div class="row gap wrap">
        ${st.phase === "reconnect" ? `<button class="btn primary" data-reconnect>${icon("sync")} ${t("Reconectar")}</button>` : `<button class="btn primary" data-sync>${icon("sync")} ${t("Sincronizar ahora")}</button>`}
        <button class="btn ghost" data-disconnect>${icon("logout")} ${t("Desconectar")}</button>
      </div>
      <p class="muted small">${t("Los datos se guardan en una carpeta privada de la app dentro de tu Google Drive (no se ve entre tus archivos y la app no puede leer nada más). Entra con la misma cuenta en el celular o el computador y verás lo mismo.")}</p>`
    : `<p>${t("Ahora tus datos están")} <b>${t("solo en este aparato")}</b>. ${t("Conecta Google para tener copia en tu Drive y usar la app en varios dispositivos.")}</p>
      <button class="btn primary big" data-connect>${gIcon()} ${t("Entrar con Google")}</button>
      ${st.msg ? `<p class="small err-t">${esc(st.msg)}</p>` : ""}`}
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("download")} ${t("Copia de seguridad")}</h3></header>
    <p class="muted small">${t("Descarga todos los datos en un archivo (sin fotos) o restaura uno descargado antes. Al restaurar se mezcla con lo que ya hay.")}</p>
    <div class="row gap wrap">
      <button class="btn ghost" data-export>${icon("download")} ${t("Descargar copia (.json)")}</button>
      <label class="btn ghost">${icon("upload")} ${t("Restaurar copia")}<input type="file" accept=".json,application/json" data-import hidden></label>
    </div>
    <p class="muted small">${tn(n("alumnos"), "1 alumno", "{n} alumnos")} · ${tn(n("pagos"), "1 pago", "{n} pagos")} · ${tn(n("grados"), "1 registro de grado", "{n} registros de grado")} · ${tn(n("asistencias"), "1 clase", "{n} clases")} · ${tn(S.fotoIds().length, "1 foto", "{n} fotos")}</p>
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("settings")} ${t("Preferencias")}</h3></header>
    <div class="row gap wrap">
      <div class="seg" role="radiogroup" aria-label="${t("Idioma / Language")}" title="${t("Idioma / Language")}">${LANGS.map(([k, l]) => `<label><input type="radio" name="lang" value="${k}" data-lang ${lang() === k ? "checked" : ""}><span>${esc(l)}</span></label>`).join("")}</div>
      <button class="btn ghost" data-theme>${icon(S.pref("theme", "dark") === "dark" ? "sun" : "moon")} ${S.pref("theme", "dark") === "dark" ? t("Tema claro") : t("Tema oscuro")}</button>
      <button class="btn ghost" data-demo>${icon("users")} ${t("Cargar alumnos de ejemplo")}</button>
    </div>
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("info")} ${t("Avanzado")}</h3></header>
    <p class="muted small">${t("ID de cliente de Google en uso:")} <code class="break">${esc(Sync.clientId())}</code></p>
    <div class="row gap wrap">
      <button class="btn ghost small" data-client>${t("Cambiar ID de cliente")}</button>
      <button class="btn danger ghost small" data-wipe>${icon("trash")} ${t("Borrar datos de este aparato")}</button>
    </div>
    <p class="muted small"><a href="privacy.html" target="_blank">${t("Privacidad")}</a> · AcademiaPro · ${t("Gratis y de código abierto")}</p>
  </section>`;

  el.onclick = async e => {
    const tg = e.target;
    if(tg.closest("[data-connect]")){ try{ await Sync.connect(); toast(t("Conectado con Google Drive")); }catch(err){ toast(Sync.errText(err.code), "error"); } render(el); return; }
    if(tg.closest("[data-reconnect]")){ await Sync.reconnect(); render(el); return; }
    if(tg.closest("[data-sync]")){ await Sync.sync(); toast(Sync.status().phase === "ok" ? t("Sincronizado") : Sync.status().msg, Sync.status().phase === "ok" ? "ok" : "warn"); render(el); return; }
    if(tg.closest("[data-disconnect]")){ if(await confirmDlg(t("Los datos quedan en este aparato y en tu Drive. Podrás volver a conectar cuando quieras."), {ok: t("Desconectar"), danger: false})){ Sync.disconnect(); render(el); } return; }
    if(tg.closest("[data-export]")){ download(`academia-copia-${today()}.json`, JSON.stringify(S.snapshot())); return; }
    if(tg.closest("[data-theme]")){ toggleTheme(); render(el); return; }
    if(tg.closest("[data-demo]")){ const {loadDemo} = await import("../demo.js"); loadDemo(); toast(t("Alumnos de ejemplo agregados")); return; }
    if(tg.closest("[data-client]")) return formModal({title: t("ID de cliente de Google"), values: {id: S.pref("clientId", "")}, fields: [
      {k: "id", label: t("ID de cliente OAuth (termina en .apps.googleusercontent.com)"), ph: GOOGLE_CLIENT_ID, hint: t("Déjalo vacío para usar el de la app.")}],
      onSave: v => { S.setPref("clientId", v.id); toast(t("Guardado. Vuelve a conectar Google.")); render(el); }});
    if(tg.closest("[data-wipe]")){
      if(!await confirmDlg(Sync.connected() ? t("Se borran los datos de este aparato y se desconecta Google. La copia en tu Drive NO se borra: al volver a entrar con Google se recupera.") : t("Se borrarán TODOS los datos de este aparato. Descarga una copia antes si la necesitas."), {ok: t("Borrar todo")})) return;
      Sync.disconnect(); localStorage.clear(); indexedDB.deleteDatabase("mma-fotos"); location.reload();
    }
  };
  el.querySelectorAll("[data-lang]").forEach(r => r.onchange = () => { if(r.checked && r.value !== lang()) setLang(r.value); });
  const imp = el.querySelector("[data-import]");
  imp.onchange = async () => {
    const f = imp.files[0]; if(!f) return;
    try{ const o = JSON.parse(await f.text()); if(!o.col) throw 0; S.merge(o, true); S.flush(); toast(t("Copia restaurada")); }
    catch(err){ toast(t("El archivo no es una copia válida"), "error"); }
  };
}
