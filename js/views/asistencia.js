import * as S from "../store.js";
import {icon, avatar, belt, emptyState, toast} from "../ui.js";
import {esc, today, fmtDate, addDays, norm, parseISO, waLink} from "../util.js";
import {t, tn, locale} from "../i18n.js";
import {estadoPago, estadoEf} from "../cobros.js";
import {clasesHoy, claseActual, proximaClase, nombreClase, saldoTiquetera, msgRenovar, durDe} from "../clases.js";

/* fecha "" = hoy, resuelta al pintar (la app puede quedar abierta pasada la medianoche). dia/pint = el día y la hora del último pintado.
   modo: "auto" (elige la clase del horario que está pasando), "clase" (eligió una) o "libre" (sin horario, por disciplina) */
const st = {fecha: "", sede: "", disc: "", clase: "", modo: "auto", q: "", dia: "", pint: 0};

const fmtDia = iso => { const d = parseISO(iso); try{ return new Intl.DateTimeFormat(locale(), {weekday: "short", day: "numeric", month: "short"}).format(d).replace(/[.,]/g, ""); }catch(e){ return fmtDate(iso); } };
const hhmm = d => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export function render(el, params, ctx, query){
  query = query || ctx?.query;
  const ss = S.sedes();
  /* enlaces #/asistencia?clase=…&fecha=…: se aplican una vez y se limpia la dirección */
  if(query && (query.get("clase") || query.get("fecha") || query.get("marcar") || query.get("nuevo"))){
    const c = S.get("clases", query.get("clase") || "");
    const f = query.get("fecha");
    if(f && parseISO(f)) setFecha(f);
    if(c){ st.clase = c.id; st.modo = "clase"; st.sede = c.sedeId; st.disc = c.disciplinaId; }
    st.marcar = query.get("marcar") || query.get("nuevo") || "";
    try{ history.replaceState(null, "", "#/asistencia"); }catch(e){}
  }
  st.sede = S.curSede() || (ss.find(s => s.id === st.sede) ? st.sede : ss[0]?.id || "");
  const discs = S.discsOfSede(st.sede);
  if(!discs.find(d => d.id === st.disc)){ const p = S.pref("asisDisc", ""); st.disc = discs.find(d => d.id === p) ? p : discs[0]?.id || ""; }
  if(!st.sede || !st.disc){ el.innerHTML = emptyState({icon: "calendar", title: t("Falta configurar"), text: t("Necesitas al menos una sede con una disciplina."), cta: {label: t("Ir a Academia"), href: "#/academia"}}); return; }
  /* pasó la medianoche con la vista abierta y una clase a medio pasar: se queda en ese día (sale «Volver a hoy») */
  if(!st.fecha && st.dia && st.dia !== today() && Date.now() - st.pint < 3 * 36e5 && S.asistenciaDe(st.dia, st.sede, st.disc, st.clase || undefined)?.presentes?.length) st.fecha = st.dia;
  const fecha = st.fecha || today(), esHoy = fecha === today();
  st.dia = fecha; st.pint = Date.now();

  /* clases del horario para ese día */
  const delDia = clasesHoy(fecha, st.sede);
  let cl = st.clase ? S.get("clases", st.clase) : null;
  /* la clase elegida no se dicta el día que se ve (p. ej. la vista quedó abierta de un día para otro) y no tiene lista
     ese día: vuelve a elegir sola, para no guardar las marcas en la clase de otro día */
  if(st.modo === "clase" && (!cl || cl.activa === false || (cl.dia !== parseISO(fecha).getDay() && S.asistenciaDe(fecha, cl.sedeId, cl.disciplinaId, cl.id)?.claseId !== cl.id))){ st.modo = "auto"; st.clase = ""; cl = null; }
  if(st.modo === "auto"){
    const conMarcas = delDia.find(x => S.asistenciaDe(fecha, x.clase.sedeId, x.clase.disciplinaId, x.clase.id)?.presentes?.length);
    const ahora = new Date();
    const elegida = esHoy ? (claseActual(st.sede) || proximaClase(st.sede) || [...delDia].reverse().find(x => x.inicio <= ahora)) : (conMarcas || delDia[0]);
    cl = elegida?.clase || null;
  }else if(st.modo === "libre") cl = null;
  if(cl){ st.disc = cl.disciplinaId; }
  const claseId = cl?.id || undefined;
  const acad = S.academy();
  const d = S.get("disciplinas", st.disc);
  const clase = {fecha, sedeId: st.sede, disciplinaId: st.disc, claseId};
  const rec = S.asistenciaDe(fecha, st.sede, st.disc, claseId);
  const pres = new Set(rec?.presentes || []);
  if(st.marcar){ const al = S.get("alumnos", st.marcar); st.marcar = ""; if(al && !pres.has(al.id)){ S.marcarAsistencia(clase, al.id, true); pres.add(al.id); } }
  const q = norm(st.q);
  /* frecuencia de las últimas 4 semanas en esta disciplina: los que más vienen, primero */
  const hace28 = addDays(today(), -27), frec = new Map();
  for(const a of S.all("asistencias")) if(a.disciplinaId === st.disc && a.fecha >= hace28) for(const id of a.presentes || []) frec.set(id, (frec.get(id) || 0) + 1);
  const todos = S.alumnos({sede: st.sede}).filter(a => estadoEf(a) === "activo" && (a.disciplinaIds || []).includes(st.disc));
  const als = todos.filter(a => !q || norm(a.nombre).includes(q))
    .sort((x, y) => (frec.get(y.id) || 0) - (frec.get(x.id) || 0) || x.nombre.localeCompare(y.nombre, locale()));
  const vistaPref = S.pref("asisVista", "");
  const lista = vistaPref ? vistaPref === "lista" : todos.length > 12;
  const nPres = als.filter(a => pres.has(a.id)).length;
  const lesion = new Set(S.inAcad("notas").filter(n => n.tipo === "lesion" && n.activa !== false && n.alumnoId).map(n => n.alumnoId));
  const tiq = new Map(todos.map(a => [a.id, saldoTiquetera(a)]));
  /* últimas clases registradas en la sede */
  const hist = S.all("asistencias").filter(a => a.sedeId === st.sede && a.fecha <= today() && (a.presentes || []).length).sort((x, y) => y.fecha.localeCompare(x.fecha) || (y._u || 0) - (x._u || 0)).slice(0, 8);
  const badges = a => {
    const out = [];
    if(estadoPago(a, acad.avisoDias ?? 5).k === "vencido") out.push(`<span class="att-bd err" title="${t("Pago vencido")}" aria-label="${t("Pago vencido")}">$</span>`);
    const s = tiq.get(a.id);
    if(s && (s.saldo <= 2 || s.vencida)) out.push(`<span class="att-bd ${s.saldo === 0 || s.vencida ? "err" : "warn"}" title="${esc(s.vencida ? t("Tiquetera vencida") : tn(s.saldo, "Le queda 1 clase", "Le quedan {n} clases"))}">${icon("receipt")}${s.vencida ? "!" : s.saldo}</span>`);
    if(lesion.has(a.id)) out.push(`<span class="att-bd info" title="${t("Lesión activa")}" aria-label="${t("Lesión activa")}">${icon("alert")}</span>`);
    return out.length ? `<span class="att-bds">${out.join("")}</span>` : "";
  };
  const card = a => {
    const g = S.rangoActual(a.id, d.id), on = pres.has(a.id);
    return `<button class="att ${on ? "on" : ""}" data-a="${a.id}" aria-pressed="${on}">
      ${avatar(a, lista ? 36 : 52)}<b>${esc(a.nombre)}</b>${g ? belt(d, g.rank, g.grado, {w: 64, h: 12}) : ""}
      ${badges(a)}<span class="att-check">${icon("check")}</span></button>`;
  };
  const chipClase = x => {
    const on = cl?.id === x.clase.id, n = (S.asistenciaDe(fecha, x.clase.sedeId, x.clase.disciplinaId, x.clase.id)?.presentes || []).length;
    const ahora = esHoy && Date.now() >= x.inicio - 15 * 6e4 && Date.now() < x.fin;
    return `<button class="att-cl ${on ? "on" : ""}" data-cl="${x.clase.id}" aria-pressed="${on}" style="--dc:${esc(x.disc.color || "#888")}"><b>${hhmm(x.inicio)}</b><span>${esc(nombreClase(x.clase, x.disc))}</span>${ahora ? `<i class="att-now">${t("Ahora")}</i>` : n ? `<i>${n}</i>` : ""}</button>`;
  };
  const extra = cl && !delDia.find(x => x.clase.id === cl.id) ? [{clase: cl, disc: S.get("disciplinas", cl.disciplinaId), inicio: new Date(`${fecha}T${cl.hora}`), fin: new Date(new Date(`${fecha}T${cl.hora}`).getTime() + durDe(cl) * 6e4)}] : [];
  const chips = [...delDia, ...extra].filter(x => x.disc);
  const cupo = cl?.cupo || 0, n = pres.size;
  const hoyTxt = esHoy ? t("Hoy") : fecha === addDays(today(), -1) ? t("Ayer") : "";

  el.innerHTML = `
  <section class="card att-card">
    <div class="att-top">
      <label class="att-date" title="${t("Cambiar fecha")}">${icon("calendar")}<span>${hoyTxt ? `<b>${hoyTxt}</b> · ` : ""}${esc(fmtDia(fecha))}</span><input type="date" id="aFecha" value="${fecha}" max="${addDays(today(), 7)}" aria-label="${t("Fecha")}"></label>
      <div class="att-qd">${!esHoy ? `<button class="chip-b" data-hoy>${t("Hoy")}</button>` : ""}${fecha !== addDays(today(), -1) ? `<button class="chip-b" data-ayer>${t("Ayer")}</button>` : ""}</div>
      ${!S.curSede() && ss.length > 1 ? `<select id="aSede" aria-label="${t("Sede")}">${ss.map(s => `<option value="${s.id}" ${s.id === st.sede ? "selected" : ""}>${esc(s.nombre)}</option>`).join("")}</select>` : ""}
      <a class="btn ghost small att-kiosk" href="#/kiosko">${icon("tablet")}<span>${t("Modo kiosco")}</span></a>
    </div>
    ${chips.length ? `<div class="chip-row att-cls" role="group" aria-label="${t("Clases del día")}">${chips.map(chipClase).join("")}<button class="att-cl libre ${!cl ? "on" : ""}" data-libre aria-pressed="${!cl}"><b>${icon("list")}</b><span>${t("Sin horario")}</span></button></div>` : ""}
    ${!cl ? `<div class="att-libre">${chips.length ? "" : `<span class="muted small">${t("Sin clases en el horario este día")} · <a class="btn-link" href="#/horario">${t("Armar horario")}</a></span>`}
      <select id="aDisc" aria-label="${t("Disciplina")}">${discs.map(x => `<option value="${x.id}" ${x.id === st.disc ? "selected" : ""}>${esc(t(x.nombre))}</option>`).join("")}</select></div>`
    : `<p class="att-info small muted">${esc(t(d.nombre))} · ${esc(cl.hora)}–${esc(hhmm(new Date(new Date(`${fecha}T${cl.hora}`).getTime() + durDe(cl) * 6e4)))}${cl.instructor ? " · " + esc(cl.instructor) : ""}${cupo ? " · " + t("Cupo {n}", {n: cupo}) : ""}</p>`}
    ${fecha !== today() ? `<p class="att-otro small">${icon("calendar")} ${t("Registrando el {fecha}", {fecha: fmtDate(fecha, true)})} · <button class="btn-link" data-hoy>${t("Volver a hoy")}</button></p>` : ""}
    ${todos.length ? `<div class="toolbar att-tools"><label class="search">${icon("search")}<input id="aq" type="search" placeholder="${t("Buscar")}" value="${esc(st.q)}" aria-label="${t("Buscar")}"></label>
      ${als.length && nPres < als.length ? `<button class="btn ghost small" data-all>${icon("check")}<span>${t("Marcar todos")}</span></button>` : ""}
      ${nPres ? `<button class="btn ghost small" data-none>${icon("x")}<span>${t("Desmarcar todos")}</span></button>` : ""}
      <button class="icon-btn" data-lista aria-pressed="${lista}" aria-label="${lista ? t("Ver como cuadrícula") : t("Ver como lista")}" title="${lista ? t("Ver como cuadrícula") : t("Ver como lista")}">${icon(lista ? "grid" : "list")}</button></div>` : ""}
    ${als.length ? `<div class="att-grid ${lista ? "att-list" : ""}">${als.map(card).join("")}</div>`
    : todos.length ? `<p class="muted center">${t("Nadie coincide con la búsqueda.")}</p>`
    : emptyState({icon: "users", title: t("Sin alumnos"), text: t("No hay alumnos activos de esta disciplina en la sede."), cta: {label: t("Agregar alumno"), href: "#/alumnos?new=1&volver=asistencia", icon: "plus"}})}
    ${todos.length ? `<div class="att-foot ${cupo && n > cupo ? "lleno" : ""}"><div class="att-count" aria-live="polite">${cuentaTxt(n, cupo)}</div><a class="btn primary" href="#/inicio" data-listo>${icon("check")}<span>${t("Listo")}</span></a></div>` : ""}
  </section>
  ${hist.length ? `<section class="card"><header class="card-h"><h3>${icon("calendar")} ${t("Últimas clases")}</h3></header><div class="list">${hist.map(r => {
    const c = r.claseId && S.get("clases", r.claseId), dd = S.get("disciplinas", r.disciplinaId), ps = (r.presentes || []).map(id => S.get("alumnos", id)).filter(Boolean);
    const on = r.fecha === fecha && (r.claseId || "") === (claseId || "") && r.disciplinaId === st.disc;
    return `<button class="li att-h ${on ? "on" : ""}" data-go="${r.fecha}" data-gocl="${esc(r.claseId || "")}" data-godisc="${esc(r.disciplinaId)}"><span class="att-h-d"><b>${esc(fmtDia(r.fecha).split(" ")[0])}</b><span>${esc(r.fecha.slice(8))}</span></span>
      <div class="li-main"><b>${esc(c ? nombreClase(c, dd) : t(dd?.nombre || ""))}${c ? ` <span class="muted small">${esc(c.hora)}</span>` : ""}</b><span class="att-stack">${ps.slice(0, 5).map(a => avatar(a, 24)).join("")}${ps.length > 5 ? `<i>+${ps.length - 5}</i>` : ""}</span></div>
      <span class="tag">${tn(ps.length, "{n} presente", "{n} presentes")}</span></button>`;
  }).join("")}</div></section>` : ""}`;

  /* lo que se guarde sigue en el día que se ve, aunque sea ya mañana */
  const fijarDia = () => { if(!st.fecha && clase.fecha !== today()) st.fecha = clase.fecha; if(st.modo === "auto" && cl){ st.modo = "clase"; st.clase = cl.id; } };
  /* varios a la vez, con deshacer: solo se revierten los que cambió este botón (no lo marcado después) */
  const masivo = (ids, on) => {
    const antes = new Set(S.asistenciaDe(clase.fecha, clase.sedeId, clase.disciplinaId, clase.claseId)?.presentes || []);
    const cambiados = ids.filter(id => on ? !antes.has(id) : antes.has(id));
    fijarDia();
    S.marcarAsistencia(clase, ids, on);
    toast(on ? tn(ids.length, "{n} marcado", "{n} marcados") : tn(ids.length, "{n} desmarcado", "{n} desmarcados"), "ok", {label: t("Deshacer"), fn: () => S.marcarAsistencia(clase, cambiados, !on)});
  };
  el.onclick = e => {
    const tg = e.target;
    const b = tg.closest("[data-a]");
    if(b){
      const id = b.dataset.a, on = !b.classList.contains("on");
      b.classList.toggle("on", on); b.setAttribute("aria-pressed", on);
      const ck = b.querySelector(".att-check"); if(on && ck){ ck.classList.remove("pop"); void ck.offsetWidth; ck.classList.add("pop"); }
      fijarDia();
      const k = S.marcarAsistencia(clase, id, on).presentes.length;
      const c = el.querySelector(".att-count"); if(c) c.innerHTML = cuentaTxt(k, cupo);
      el.querySelector(".att-foot")?.classList.toggle("lleno", !!cupo && k > cupo);
      navigator.vibrate?.(10);
      /* tiquetera casi agotada: ofrecer el mensaje de renovación */
      const al = S.get("alumnos", id), s = on && al && saldoTiquetera(al);
      if(s && (s.saldo <= 2 || s.vencida)){
        const wa = waLink(al.telefono || al.acudienteTel, msgRenovar(al, s));
        toast(s.vencida ? t("{nombre}: tiquetera vencida", {nombre: al.nombre.split(" ")[0]}) : s.saldo === 0 ? t("{nombre}: se acabó la tiquetera", {nombre: al.nombre.split(" ")[0]}) : tn(s.saldo, "{nombre}: le queda 1 clase", "{nombre}: le quedan {n} clases", {nombre: al.nombre.split(" ")[0]}),
          s.saldo === 0 || s.vencida ? "error" : "warn", wa ? {label: t("Renovar"), fn: () => window.open(wa, "_blank", "noopener")} : null, {key: "tiq"});
      }
      return;
    }
    const cc = tg.closest("[data-cl]"); if(cc){ st.modo = "clase"; st.clase = cc.dataset.cl; render(el); return; }
    if(tg.closest("[data-libre]")){ st.modo = "libre"; st.clase = ""; render(el); return; }
    const go = tg.closest("[data-go]"); if(go){ setFecha(go.dataset.go); if(go.dataset.gocl){ st.modo = "clase"; st.clase = go.dataset.gocl; } else { st.modo = "libre"; st.clase = ""; st.disc = go.dataset.godisc; } window.scrollTo(0, 0); render(el); return; }
    if(tg.closest("[data-hoy]")){ setFecha(""); render(el); return; }
    if(tg.closest("[data-ayer]")){ setFecha(addDays(today(), -1)); render(el); return; }
    if(tg.closest("[data-all]")) return masivo(als.filter(a => !pres.has(a.id)).map(a => a.id), true);
    if(tg.closest("[data-none]")) return masivo(als.filter(a => pres.has(a.id)).map(a => a.id), false);
    if(tg.closest("[data-lista]")){ S.setPref("asisVista", lista ? "grid" : "lista"); render(el); }
    if(tg.closest("[data-listo]")) toast(tn(n, "{n} presente guardado", "{n} presentes guardados"), "ok", null, {key: "asis"});
  };
  const fi = el.querySelector("#aFecha");
  fi.onchange = e => { if(e.target.value) setFecha(e.target.value); render(el); };
  fi.onclick = () => { try{ fi.showPicker?.(); }catch(e){} };
  const ds = el.querySelector("#aDisc"); if(ds) ds.onchange = e => { st.disc = e.target.value; st.dia = ""; S.setPref("asisDisc", st.disc); render(el); };
  const sedeSel = el.querySelector("#aSede"); if(sedeSel) sedeSel.onchange = e => { st.sede = e.target.value; st.dia = ""; st.modo = "auto"; st.clase = ""; render(el); };
  const aq = el.querySelector("#aq");
  if(aq){ aq.oninput = e => { st.q = e.target.value; st.f = true; render(el); };
    if(st.f){ st.f = false; aq.focus(); aq.setSelectionRange(st.q.length, st.q.length); } }
}
const cuentaTxt = (n, cupo) => `<b>${n}</b><span>${cupo ? t("de {cupo} · {presentes}", {cupo, presentes: tn(n, "presente", "presentes")}) : tn(n, "presente", "presentes")}</span>`;
/* hoy se guarda como "" para que siga siendo "hoy" mañana. Cambiar de día vuelve a elegir la clase sola */
const setFecha = v => { st.fecha = !v || v === today() ? "" : v; st.dia = ""; st.modo = "auto"; st.clase = ""; };
