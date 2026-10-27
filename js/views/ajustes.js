import * as S from "../store.js";
import * as Sync from "../sync.js";
import {icon, toast, confirmDlg, formModal} from "../ui.js";
import {esc, download, today, fmtDate} from "../util.js";
import {toggleTheme, gIcon} from "../app.js";
import {GOOGLE_CLIENT_ID} from "../config.js";

export function render(el){
  const st = Sync.status();
  const n = c => S.all(c).length;
  const last = st.lastSync ? new Date(st.lastSync).toLocaleString("es-CO", {dateStyle: "medium", timeStyle: "short"}) : "nunca";

  el.innerHTML = `
  <section class="card">
    <header class="card-h"><h3>${icon("cloud")} Google Drive</h3></header>
    ${Sync.connected() ? `
      <div class="acct big">${st.photo ? `<img src="${esc(st.photo)}" alt="" referrerpolicy="no-referrer">` : icon("cloud")}<div><b>${esc(st.name || "Cuenta de Google")}</b><span class="muted">${esc(st.email)}</span></div></div>
      <p class="small">${st.phase === "ok" ? `${icon("check", "inline ok-t")} Sincronizado · última vez ${esc(last)}` : esc(st.msg || "Sincronizando…")}</p>
      <div class="row gap wrap">
        ${st.phase === "reconnect" ? `<button class="btn primary" data-reconnect>${icon("sync")} Reconectar</button>` : `<button class="btn primary" data-sync>${icon("sync")} Sincronizar ahora</button>`}
        <button class="btn ghost" data-disconnect>${icon("logout")} Desconectar</button>
      </div>
      <p class="muted small">Los datos se guardan en una carpeta privada de la app dentro de tu Google Drive (no se ve entre tus archivos y la app no puede leer nada más). Entra con la misma cuenta en el celular o el computador y verás lo mismo.</p>`
    : `<p>Ahora tus datos están <b>solo en este aparato</b>. Conecta Google para tener copia en tu Drive y usar la app en varios dispositivos.</p>
      <button class="btn primary big" data-connect>${gIcon()} Entrar con Google</button>
      ${st.msg ? `<p class="small err-t">${esc(st.msg)}</p>` : ""}`}
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("download")} Copia de seguridad</h3></header>
    <p class="muted small">Descarga todos los datos en un archivo (sin fotos) o restaura uno descargado antes. Al restaurar se mezcla con lo que ya hay.</p>
    <div class="row gap wrap">
      <button class="btn ghost" data-export>${icon("download")} Descargar copia (.json)</button>
      <label class="btn ghost">${icon("upload")} Restaurar copia<input type="file" accept=".json,application/json" data-import hidden></label>
    </div>
    <p class="muted small">${n("alumnos")} alumnos · ${n("pagos")} pagos · ${n("grados")} registros de grado · ${n("asistencias")} clases · ${S.fotoIds().length} fotos</p>
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("settings")} Preferencias</h3></header>
    <div class="row gap wrap">
      <button class="btn ghost" data-theme>${icon(S.pref("theme", "dark") === "dark" ? "sun" : "moon")} Tema ${S.pref("theme", "dark") === "dark" ? "claro" : "oscuro"}</button>
      <button class="btn ghost" data-demo>${icon("users")} Cargar alumnos de ejemplo</button>
    </div>
  </section>

  <section class="card">
    <header class="card-h"><h3>${icon("info")} Avanzado</h3></header>
    <p class="muted small">ID de cliente de Google en uso: <code class="break">${esc(Sync.clientId())}</code></p>
    <div class="row gap wrap">
      <button class="btn ghost small" data-client>Cambiar ID de cliente</button>
      <button class="btn danger ghost small" data-wipe>${icon("trash")} Borrar datos de este aparato</button>
    </div>
    <p class="muted small"><a href="privacy.html" target="_blank">Privacidad</a> · AcademiaPro · Gratis y de código abierto</p>
  </section>`;

  el.onclick = async e => {
    const t = e.target;
    if(t.closest("[data-connect]")){ try{ await Sync.connect(); toast("Conectado con Google Drive"); }catch(err){ toast(Sync.errText(err.code), "error"); } render(el); return; }
    if(t.closest("[data-reconnect]")){ await Sync.reconnect(); render(el); return; }
    if(t.closest("[data-sync]")){ await Sync.sync(); toast(Sync.status().phase === "ok" ? "Sincronizado" : Sync.status().msg, Sync.status().phase === "ok" ? "ok" : "warn"); render(el); return; }
    if(t.closest("[data-disconnect]")){ if(await confirmDlg("Los datos quedan en este aparato y en tu Drive. Podrás volver a conectar cuando quieras.", {ok: "Desconectar", danger: false})){ Sync.disconnect(); render(el); } return; }
    if(t.closest("[data-export]")){ download(`academia-copia-${today()}.json`, JSON.stringify(S.snapshot())); return; }
    if(t.closest("[data-theme]")){ toggleTheme(); render(el); return; }
    if(t.closest("[data-demo]")){ const {loadDemo} = await import("../demo.js"); loadDemo(); toast("Alumnos de ejemplo agregados"); return; }
    if(t.closest("[data-client]")) return formModal({title: "ID de cliente de Google", values: {id: S.pref("clientId", "")}, fields: [
      {k: "id", label: "ID de cliente OAuth (termina en .apps.googleusercontent.com)", ph: GOOGLE_CLIENT_ID, hint: "Déjalo vacío para usar el de la app."}],
      onSave: v => { S.setPref("clientId", v.id); toast("Guardado. Vuelve a conectar Google."); render(el); }});
    if(t.closest("[data-wipe]")){
      if(!await confirmDlg(Sync.connected() ? "Se borran los datos de este aparato y se desconecta Google. La copia en tu Drive NO se borra: al volver a entrar con Google se recupera." : "Se borrarán TODOS los datos de este aparato. Descarga una copia antes si la necesitas.", {ok: "Borrar todo"})) return;
      Sync.disconnect(); localStorage.clear(); indexedDB.deleteDatabase("mma-fotos"); location.reload();
    }
  };
  const imp = el.querySelector("[data-import]");
  imp.onchange = async () => {
    const f = imp.files[0]; if(!f) return;
    try{ const o = JSON.parse(await f.text()); if(!o.col) throw 0; S.merge(o, true); S.flush(); toast("Copia restaurada"); }
    catch(err){ toast("El archivo no es una copia válida", "error"); }
  };
}
