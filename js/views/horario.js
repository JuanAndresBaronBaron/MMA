/* Horario semanal: clases fijas por sede, día y hora. En el computador, semana en 7 columnas; en el celular, un día a la vez. */
import * as S from "../store.js";
import {icon, formModal, toast, emptyState, confirmDlg} from "../ui.js";
import {esc, today, parseISO} from "../util.js";
import {t, tn} from "../i18n.js";
import {SEMANA, diaNombre, durDe, nombreClase, presentesClase, clasesIcs, horarioTexto} from "../clases.js";

const st = {dia: null};
const hm = (hora, dur) => { const [a, b] = String(hora || "0:0").split(":").map(Number), m = (a || 0) * 60 + (b || 0) + dur; return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;

export function render(el){
  const sede = S.curSede(), ss = S.sedes(), discs = S.disciplinas();
  if(!ss.length || !discs.length){ el.innerHTML = emptyState({icon: "clock", title: t("Falta configurar"), text: t("Necesitas al menos una sede con una disciplina."), cta: {label: t("Ir a Academia"), href: "#/academia"}}); return; }
  const list = S.clases().filter(c => !sede || c.sedeId === sede);
  const hoy = today(), dHoy = parseISO(hoy).getDay();
  if(st.dia === null) st.dia = dHoy;
  const multi = !sede && ss.length > 1;
  const block = c => {
    const d = S.get("disciplinas", c.disciplinaId), s = S.get("sedes", c.sedeId), dur = durDe(c);
    const esHoy = c.dia === dHoy, n = esHoy ? presentesClase(hoy, c) : 0;
    return `<article class="hz-b ${esHoy ? "hoy" : ""}" style="--dc:${esc(d?.color || "#888")}">
      <button class="hz-b-main" data-edit="${c.id}" aria-label="${esc(t("Editar {clase}", {clase: nombreClase(c, d)}))}">
        <span class="hz-t">${esc(c.hora)}–${hm(c.hora, dur)}</span><b>${esc(nombreClase(c, d))}</b>
        <span class="hz-m">${[c.nombre && d ? t(d.nombre) : "", c.instructor, multi ? s?.nombre : "", c.cupo ? t("Cupo {n}", {n: c.cupo}) : ""].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join(" · ")}</span></button>
      ${esHoy ? `<div class="hz-b-hoy"><span>${c.cupo ? t("{n}/{cupo} presentes", {n, cupo: c.cupo}) : tn(n, "{n} presente", "{n} presentes")}</span><a class="btn small primary" title="${t("Pasar lista")}" href="#/asistencia?clase=${c.id}&fecha=${hoy}">${icon("check")}<span>${t("Pasar lista")}</span></a></div>` : ""}
    </article>`;
  };
  const porDia = d => list.filter(c => c.dia === d);
  const presets = discs.slice(0, 3).map((d, i) => ({disc: d, dias: i === 1 ? [2, 4] : [1, 3, 5], hora: i === 1 ? "19:00" : "18:00"}));
  if(discs.length) presets.push({disc: discs.find(d => /kid|niñ|infantil/i.test(d.nombre)) || discs[0], dias: [6], hora: "10:00", nombre: t("Clase de sábado")});
  const presetTxt = p => `${p.nombre || t(p.disc.nombre)} · ${p.dias.map(x => diaNombre(x, true)).join(", ")} · ${p.hora}`;

  el.innerHTML = `
  <section class="card hz-top">
    <div class="hz-head"><div><h2>${t("Horario semanal")}</h2><span class="muted small">${list.length ? tn(list.length, "1 clase por semana", "{n} clases por semana") : t("Organiza tus clases fijas para pasar lista más rápido")}${sede ? " · " + esc(S.get("sedes", sede)?.nombre || "") : ""}</span></div>
      <div class="hz-act">${list.length ? `<button class="btn ghost small" data-ics>${icon("download")}<span>${t("Exportar calendario (.ics)")}</span></button>
        <a class="btn ghost small" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(horarioTexto(list, sede ? S.get("sedes", sede)?.nombre : ""))}">${icon("whatsapp")}<span>${t("Compartir por WhatsApp")}</span></a>` : ""}
        <button class="btn primary small" data-new>${icon("plus")}<span>${t("Clase")}</span></button></div></div>
  </section>
  ${!list.length ? `<section class="card">${emptyState({icon: "clock", title: t("Aún no tienes horario"), text: t("Crea tus clases una vez y cada día la app abre la clase que está empezando para pasar lista con un toque."), cta: {label: t("Crear la primera clase"), attr: "data-new", icon: "plus"}})}
    <h4 class="hz-sug">${t("Sugerencias para empezar")}</h4><div class="hz-presets">${presets.map((p, i) => `<button class="hz-preset" data-preset="${i}" style="--dc:${esc(p.disc.color || "#888")}">${icon("plus")}<span>${esc(presetTxt(p))}</span></button>`).join("")}</div></section>`
  : `<section class="hz-week" aria-label="${t("Semana")}">${SEMANA.map(d => `<div class="hz-col ${d === dHoy ? "hoy" : ""}"><h3>${esc(cap(diaNombre(d, true)))}${d === dHoy ? ` <span class="tag">${t("Hoy")}</span>` : ""}</h3>${porDia(d).map(block).join("") || `<p class="hz-nada">${t("Sin clases")}</p>`}</div>`).join("")}</section>
  <section class="hz-day">
    <div class="chip-row hz-tabs" role="tablist">${SEMANA.map(d => `<button role="tab" class="hz-tab ${d === st.dia ? "on" : ""}" aria-selected="${d === st.dia}" data-dia="${d}"><b>${esc(cap(diaNombre(d, true)))}</b><i>${porDia(d).length || "·"}</i></button>`).join("")}</div>
    <div class="hz-list">${porDia(st.dia).map(block).join("") || `<div class="card">${emptyState({icon: "clock", title: t("Sin clases este día"), cta: {label: t("Agregar clase"), attr: `data-new data-d="${st.dia}"`, kind: "ghost", icon: "plus"}})}</div>`}</div>
  </section>`}`;

  el.onclick = async e => {
    const tg = e.target;
    const dd = tg.closest("[data-dia]"); if(dd){ st.dia = +dd.dataset.dia; render(el); return; }
    const ed = tg.closest("[data-edit]"); if(ed) return claseModal(S.get("clases", ed.dataset.edit));
    const pr = tg.closest("[data-preset]"); if(pr){ const p = presets[+pr.dataset.preset]; return claseModal(null, {disciplinaId: p.disc.id, dias: p.dias, hora: p.hora, nombre: p.nombre || "", cupo: null}); }
    const nw = tg.closest("[data-new]"); if(nw) return claseModal(null, nw.dataset.d !== undefined ? {dias: [+nw.dataset.d]} : {});
    if(tg.closest("[data-ics]")){
      try{
        const txt = await clasesIcs(list);
        const m = await import("../ics.js");
        if(m.descargarIcs) await m.descargarIcs(t("horario") + ".ics", txt);
        else (await import("../util.js")).download(t("horario") + ".ics", txt, "text/calendar");
      }catch(err){ console.warn(err); toast(t("No se pudo crear el calendario"), "error"); }
    }
  };
}

/* crear o editar; al crear, un registro por cada día elegido */
export function claseModal(c, pre = {}){
  const ss = S.sedes(), sede = c?.sedeId || pre.sedeId || S.curSede() || ss[0]?.id;
  const discs = S.disciplinas();
  const v = Object.assign({nombre: "", disciplinaId: (S.discsOfSede(sede)[0] || discs[0])?.id, sedeId: sede, dias: [], hora: "18:00", dur: 60, instructor: "", cupo: null}, pre, c ? {...c, dias: [c.dia]} : {});
  const instr = [...new Set([...S.all("clases").map(x => x.instructor), ...discs.map(d => d.encargado), ...ss.map(s => s.encargado)].filter(Boolean))];
  const fields = [
    {k: "nombre", label: t("Nombre de la clase"), ph: t("Ej.: Fundamentos, Avanzados, Kids"), hint: t("Opcional. Si lo dejas vacío se usa el nombre de la disciplina.")},
    {k: "disciplinaId", label: t("Disciplina"), type: "select", req: true, opts: discs.map(d => [d.id, t(d.nombre)]), half: ss.length > 1},
    ss.length > 1 ? {k: "sedeId", label: t("Sede"), type: "select", opts: ss.map(s => [s.id, s.nombre]), half: true} : `<input type="hidden" name="sedeId" value="${esc(sede)}">`,
    {k: "dias", label: c ? t("Día (si eliges más, se crean copias)") : t("Días"), type: "chips", opts: SEMANA.map(d => [String(d), cap(diaNombre(d, true))])},
    {k: "hora", label: t("Hora de inicio"), type: "time", req: true, half: true},
    {k: "dur", label: t("Duración (min)"), type: "number", min: 15, step: 5, half: true},
    {k: "instructor", label: t("Instructor"), half: true, list: instr},
    {k: "cupo", label: t("Cupo máximo"), type: "number", min: 1, half: true, hint: t("Opcional")},
  ];
  formModal({title: c ? t("Editar clase") : t("Nueva clase"), fields, values: Object.assign({}, v, {dias: v.dias.map(String)}),
    danger: c ? {label: t("Eliminar"), fn: async () => {
      if(!await confirmDlg(t("Se elimina «{clase}» del horario. La asistencia ya registrada se conserva.", {clase: nombreClase(c)}))) return false;
      const prev = S.get("clases", c.id);
      S.del("clases", c.id);
      toast(t("Clase eliminada"), "ok", {label: t("Deshacer"), fn: () => S.put("clases", prev)});
      return true;
    }} : null,
    onSave: f => {
      const dias = (f.dias || []).map(Number).filter(n => n >= 0 && n <= 6);
      if(!dias.length){ toast(t("Elige al menos un día"), "warn"); return false; }
      if(!/^\d{1,2}:\d{2}$/.test(f.hora || "")){ toast(t("Revisa la hora"), "warn"); return false; }
      const base = {academiaId: S.academy().id, sedeId: f.sedeId || sede, disciplinaId: f.disciplinaId, nombre: f.nombre || "", hora: f.hora.padStart(5, "0"),
        dur: Math.max(15, Number(f.dur) || 60), instructor: f.instructor || "", cupo: Number(f.cupo) > 0 ? Number(f.cupo) : null, activa: true};
      const d0 = c ? (dias.includes(c.dia) ? c.dia : dias[0]) : null, resto = dias.filter(d => d !== d0);
      if(c) S.put("clases", Object.assign({id: c.id, dia: d0}, base));
      for(const d of resto) S.put("clases", Object.assign({dia: d}, base));
      const n = (c ? 1 : 0) + resto.length;
      toast(c ? t("Clase guardada") : tn(n, "1 clase creada", "{n} clases creadas"));
    }});
}
