/* Formularios compartidos: alumno, pago, promoción de grado, disciplina. */
import * as S from "./store.js";
import {field, formValues, modal, toast, icon, belt, avatar, pickPhoto, confirmDlg, rankLabel} from "./ui.js";
import {BLOOD, METHODS, PLANS, GEAR, SIZES, STATUS, planById, SYSTEMS, cloneRanks, DISC_COLORS} from "./catalog.js";
import {esc, today, addMonths, addDays, h, money, fmtDate, fmtDuration, uid, now} from "./util.js";
import {queueFoto} from "./sync.js";

const sec = (t, ic) => `<div class="form-sec">${icon(ic)}<span>${esc(t)}</span></div>`;

/* ---------- alumno ---------- */
export function studentForm(al, opts = {}){
  const isNew = !al;
  al = al || {sedeId: opts.sedeId || S.curSede() || S.sedes()[0]?.id, estado: "activo", plan: "mensual", fechaInicio: today(), disciplinaIds: [], equipo: {}, valor: S.academy()?.valorMensual ?? ""};
  let photo = S.foto(al.id || "") || null, photoChanged = false;
  const sedesOpts = S.sedes().map(s => [s.id, s.nombre]);
  const eq = al.equipo || {};
  const gearHtml = GEAR.map(g => `<div class="gear-row"><label class="check"><input type="checkbox" name="eq_${g.k}" ${eq[g.k]?.tiene ? "checked" : ""}><span>${esc(g.n)}</span></label>${g.talla ? `<input class="gear-size" name="eqt_${g.k}" placeholder="Talla" list="sizes" value="${esc(eq[g.k]?.talla || "")}">` : ""}</div>`).join("");
  const body = h(`<form class="form student-form" novalidate>
    <div class="photo-pick">
      <button type="button" class="photo-btn" data-photo>${photo ? `<img src="${photo}" alt="">` : icon("camera", "big")}<span class="photo-badge">${icon("camera")}</span></button>
      <div class="photo-txt"><b>Foto del alumno</b><span class="muted small">Toca para subir o tomar una foto. Se recorta en cuadrado.</span>
      <button type="button" class="btn-link danger small" data-nophoto ${photo ? "" : "hidden"}>Quitar foto</button></div>
    </div>
    ${field({k: "nombre", label: "Nombre completo", req: true, ph: "Ej: Juan Pérez"}, al.nombre)}
    ${field({k: "documento", label: "Documento de identidad", half: true}, al.documento)}
    ${field({k: "nacimiento", label: "Fecha de nacimiento", type: "date", half: true}, al.nacimiento)}
    ${field({k: "genero", label: "Género", type: "seg", opts: [["M", "Masculino"], ["F", "Femenino"], ["O", "Otro"]]}, al.genero)}
    ${sec("Contacto", "phone")}
    ${field({k: "telefono", label: "Teléfono / WhatsApp", type: "tel", half: true}, al.telefono)}
    ${field({k: "email", label: "Correo", type: "email", half: true}, al.email)}
    ${field({k: "direccion", label: "Dirección"}, al.direccion)}
    ${field({k: "acudiente", label: "Acudiente (menores)", half: true}, al.acudiente)}
    ${field({k: "acudienteTel", label: "Teléfono del acudiente", type: "tel", half: true}, al.acudienteTel)}
    ${sec("Salud y emergencias", "heart")}
    ${field({k: "sangre", label: "Tipo de sangre (RH)", type: "select", opts: [["", "—"], ...BLOOD], half: true}, al.sangre)}
    ${field({k: "eps", label: "EPS / seguro médico", half: true}, al.eps)}
    ${field({k: "peso", label: "Peso (kg)", type: "number", step: "0.1", half: true}, al.peso)}
    ${field({k: "estatura", label: "Estatura (cm)", type: "number", half: true}, al.estatura)}
    ${field({k: "alergias", label: "Alergias", half: true, ph: "Ninguna"}, al.alergias)}
    ${field({k: "lesiones", label: "Lesiones / condiciones médicas", half: true}, al.lesiones)}
    ${field({k: "emergencia", label: "Contacto de emergencia", half: true}, al.emergencia)}
    ${field({k: "emergenciaTel", label: "Teléfono de emergencia", type: "tel", half: true}, al.emergenciaTel)}
    ${sec("Academia y plan", "building")}
    ${field({k: "sedeId", label: "Sede", type: "select", opts: sedesOpts, req: true, half: true}, al.sedeId)}
    ${field({k: "estado", label: "Estado", type: "select", opts: Object.entries(STATUS), half: true}, al.estado)}
    <div class="field" data-discs></div>
    <div data-ranks class="ranks-init"></div>
    ${field({k: "fechaInicio", label: "Fecha de ingreso", type: "date", half: true, hint: "Si no tiene pagos, el primer cobro vence este día."}, al.fechaInicio)}
    ${field({k: "plan", label: "Plan", type: "select", opts: PLANS.map(p => [p.id, p.nombre]), half: true}, al.plan)}
    ${field({k: "valor", label: `Valor del plan (${S.academy()?.moneda || "COP"})`, type: "number", half: true}, al.valor)}
    ${field({k: "talla", label: "Talla de ropa", half: true, list: SIZES}, al.talla)}
    ${sec("Equipo (para ofrecer productos)", "bag")}
    <div class="gear">${gearHtml}</div>
    <datalist id="sizes">${SIZES.map(s => `<option value="${s}">`).join("")}</datalist>
    ${sec("Notas", "edit")}
    ${field({k: "notas", label: "Notas del profesor", type: "textarea"}, al.notas)}
  </form>`);

  const discBox = body.querySelector("[data-discs]"), ranksBox = body.querySelector("[data-ranks]");
  let checked = new Set(al.disciplinaIds || []);
  const renderDiscs = () => {
    const sid = body.querySelector("[name=sedeId]").value;
    const ds = S.discsOfSede(sid);
    discBox.innerHTML = `<span class="lbl">Disciplinas que entrena</span><div class="chips">${ds.map(d => `<label class="chip" style="--dc:${d.color}"><input type="checkbox" name="disc" value="${d.id}" ${checked.has(d.id) ? "checked" : ""}><span>${esc(d.nombre)}</span></label>`).join("") || `<span class="muted small">Esta sede aún no tiene disciplinas. Agrégalas en Academia.</span>`}</div>`;
    renderRanks();
  };
  const renderRanks = () => {
    const ds = [...discBox.querySelectorAll("input[name=disc]:checked")].map(i => S.get("disciplinas", i.value)).filter(Boolean);
    const rows = ds.filter(d => !al.id || !S.gradosDe(al.id, d.id).length);
    ranksBox.innerHTML = rows.length ? `<span class="lbl">Cinturón o nivel con el que empieza</span>` + rows.map(d => {
      const prev = ranksBox.querySelector(`[name="rk_${d.id}"]`);
      return `<div class="rank-init"><span class="dot" style="background:${d.color}"></span><b>${esc(d.nombre)}</b>
        <select name="rk_${d.id}">${d.ranks.map((r, i) => `<option value="${i}">${esc(r.n)}</option>`).join("")}</select>
        <select name="gr_${d.id}">${[0, 1, 2, 3, 4, 5, 6].map(g => `<option value="${g}">${g ? g + "° grado" : "Sin grados"}</option>`).join("")}</select>
        <input type="date" name="fd_${d.id}" value="${body.querySelector("[name=fechaInicio]")?.value || today()}" title="Desde cuándo tiene ese grado"></div>`;
    }).join("") + `<small class="hint">La fecha es desde cuándo tiene ese grado: sirve para calcular el tiempo hasta la siguiente promoción.</small>` : "";
  };
  discBox.addEventListener("change", e => { if(e.target.name === "disc"){ e.target.checked ? checked.add(e.target.value) : checked.delete(e.target.value); renderRanks(); } });
  body.querySelector("[name=sedeId]").addEventListener("change", renderDiscs);
  renderDiscs();

  const pbtn = body.querySelector("[data-photo]"), nop = body.querySelector("[data-nophoto]");
  pbtn.onclick = async () => {
    const d = await pickPhoto(); if(!d) return;
    photo = d; photoChanged = true;
    pbtn.innerHTML = `<img src="${d}" alt=""><span class="photo-badge">${icon("camera")}</span>`; nop.hidden = false;
  };
  nop.onclick = () => { photo = null; photoChanged = true; pbtn.innerHTML = `${icon("camera", "big")}<span class="photo-badge">${icon("camera")}</span>`; nop.hidden = true; };

  const m = modal({title: isNew ? "Nuevo alumno" : "Editar alumno", body, wide: true,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")} Eliminar</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" data-save>${isNew ? "Agregar alumno" : "Guardar"}</button>`});
  m.foot.querySelector("[data-save]").onclick = async () => {
    const v = formValues(body);
    if(!v.nombre){ body.querySelector("[name=nombre]").focus(); toast("Escribe el nombre del alumno", "warn"); return; }
    if(!v.sedeId){ toast("Primero crea una sede en Academia", "warn"); return; }
    const equipo = {};
    for(const g of GEAR) equipo[g.k] = {tiene: !!v["eq_" + g.k], talla: v["eqt_" + g.k] || ""};
    const rec = {
      id: al.id, academiaId: S.academy().id,
      nombre: v.nombre, documento: v.documento, nacimiento: v.nacimiento, genero: v.genero || "",
      telefono: v.telefono, email: v.email, direccion: v.direccion, acudiente: v.acudiente, acudienteTel: v.acudienteTel,
      sangre: v.sangre, eps: v.eps, peso: v.peso, estatura: v.estatura, alergias: v.alergias, lesiones: v.lesiones,
      emergencia: v.emergencia, emergenciaTel: v.emergenciaTel,
      sedeId: v.sedeId, estado: v.estado, disciplinaIds: v.disc || [], fechaInicio: v.fechaInicio || today(),
      plan: v.plan, valor: v.valor, talla: v.talla, equipo, notas: v.notas,
    };
    if(photoChanged){ rec.fotoU = now(); rec.foto = !!photo; }
    const saved = S.put("alumnos", rec);
    if(photoChanged){ await S.setFoto(saved.id, photo, rec.fotoU); queueFoto(saved.id); }
    for(const did of rec.disciplinaIds){
      if(S.gradosDe(saved.id, did).length) continue;
      const rk = v["rk_" + did];
      if(rk === undefined) continue;
      S.put("grados", {alumnoId: saved.id, disciplinaId: did, rank: Number(rk), grado: Number(v["gr_" + did] || 0), fecha: v["fd_" + did] || rec.fechaInicio, inicial: true, nota: "Grado al ingresar"});
    }
    toast(isNew ? "Alumno agregado" : "Cambios guardados");
    m.close();
    opts.onSaved && opts.onSaved(saved);
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => {
    if(!await confirmDlg(`Se eliminará a ${al.nombre} con sus pagos, grados y asistencias. Si solo dejó de venir, mejor cámbialo a «Inactivo».`)) return;
    for(const p of S.pagosDe(al.id)) S.del("pagos", p.id);
    for(const g of S.gradosDe(al.id)) S.del("grados", g.id);
    S.del("alumnos", al.id);
    await S.setFoto(al.id, null); queueFoto(al.id);
    toast("Alumno eliminado"); m.close();
    opts.onDeleted && opts.onDeleted();
  };
  return m;
}

/* ---------- pagos ---------- */
const periodo = (desde, planId) => { const p = planById(planId); return p.meses === 0.5 ? addDays(desde, 15) : p.meses ? addMonths(desde, p.meses) : desde; };
export function paymentModal(al, pago){
  const acad = S.academy(), cur = acad?.moneda || "COP";
  const isNew = !pago;
  const per = S.periodoNuevo(al);
  pago = pago || {fecha: today(), monto: S.valorPlan(al), metodo: METHODS[0], concepto: "Mensualidad", desde: per.desde, hasta: per.hasta, plan: al.plan};
  const body = h(`<form class="form" novalidate>
    <div class="pay-head">${avatar(al, 44)}<div><b>${esc(al.nombre)}</b><span class="muted small">${esc(planById(al.plan).nombre)} · ${money(S.valorPlan(al), cur)}</span></div></div>
    ${field({k: "concepto", label: "Concepto", type: "select", opts: ["Mensualidad", "Inscripción", "Clase suelta", "Tiquetera", "Producto", "Examen de grado", "Torneo", "Otro"], half: true}, pago.concepto)}
    ${field({k: "monto", label: `Valor (${cur})`, type: "number", req: true, half: true}, pago.monto)}
    ${field({k: "fecha", label: "Fecha de pago", type: "date", half: true}, pago.fecha)}
    ${field({k: "metodo", label: "Método", type: "select", opts: METHODS, half: true}, pago.metodo)}
    <div class="period" data-period>
      ${field({k: "plan", label: "Cubre", type: "select", opts: PLANS.filter(p => p.meses).map(p => [p.id, p.nombre]), third: true}, pago.plan || al.plan)}
      ${field({k: "desde", label: "Desde", type: "date", third: true}, pago.desde)}
      ${field({k: "hasta", label: "Próximo pago", type: "date", third: true, hint: ""}, pago.hasta)}
    </div>
    ${field({k: "nota", label: "Nota", ph: "Opcional"}, pago.nota)}
  </form>`);
  const q = n => body.querySelector(`[name=${n}]`);
  const toggle = () => { body.querySelector("[data-period]").hidden = !["Mensualidad", "Tiquetera"].includes(q("concepto").value); };
  q("concepto").onchange = toggle; toggle();
  const recalc = () => { q("hasta").value = periodo(q("desde").value, q("plan").value); };
  q("desde").onchange = recalc; q("plan").onchange = recalc;
  const m = modal({title: isNew ? "Registrar pago" : "Editar pago", body,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")}</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" data-save>${icon("check")} ${isNew ? "Registrar pago" : "Guardar"}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.monto && v.monto !== 0){ toast("Escribe el valor", "warn"); return; }
    const periodic = !body.querySelector("[data-period]").hidden;
    S.put("pagos", {id: pago.id, alumnoId: al.id, academiaId: al.academiaId, sedeId: al.sedeId, concepto: v.concepto, monto: v.monto, fecha: v.fecha || today(), metodo: v.metodo,
      plan: periodic ? v.plan : null, desde: periodic ? v.desde : null, hasta: periodic ? v.hasta : null, nota: v.nota});
    toast(isNew ? `Pago de ${al.nombre} registrado` : "Pago actualizado");
    m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => { if(await confirmDlg("¿Eliminar este pago?")){ S.del("pagos", pago.id); toast("Pago eliminado"); m.close(); } };
}
/* «check» de pagado en un toque: registra el plan con los valores por defecto, con deshacer */
export function quickPay(al){
  const per = S.periodoNuevo(al);
  const p = S.put("pagos", {alumnoId: al.id, academiaId: al.academiaId, sedeId: al.sedeId, concepto: "Mensualidad", monto: S.valorPlan(al), fecha: today(), metodo: METHODS[0], plan: al.plan, desde: per.desde, hasta: per.hasta});
  toast(`${al.nombre.split(" ")[0]}: pagado hasta ${fmtDate(per.hasta)}`, "ok", {label: "Deshacer", fn: () => { S.del("pagos", p.id); toast("Pago deshecho", "warn"); }});
}

/* ---------- promoción de grado ---------- */
export function promotionModal(al, discId, grado){
  const discs = (al.disciplinaIds || []).map(id => S.get("disciplinas", id)).filter(Boolean);
  if(!discs.length){ toast("Este alumno no tiene disciplinas asignadas", "warn"); return; }
  const isNew = !grado;
  let disc = S.get("disciplinas", grado?.disciplinaId || discId) || discs[0];
  const body = h(`<form class="form" novalidate>
    <div class="pay-head">${avatar(al, 44)}<div><b>${esc(al.nombre)}</b><span class="muted small" data-cur></span></div></div>
    ${field({k: "disciplinaId", label: "Disciplina", type: "select", opts: discs.map(d => [d.id, d.nombre]), half: true}, disc.id)}
    ${field({k: "fecha", label: "Fecha", type: "date", half: true}, grado?.fecha || today())}
    <div class="field half"><label class="lbl">Cinturón / nivel</label><select name="rank"></select></div>
    <div class="field half"><label class="lbl">Grado</label><select name="grado"></select></div>
    <div class="belt-preview" data-prev></div>
    <div data-warn></div>
    ${field({k: "profesor", label: "Otorgado por", half: true, list: [...new Set(S.all("grados").map(g => g.profesor).filter(Boolean))]}, grado?.profesor || S.pref("profesor", ""))}
    ${field({k: "nota", label: "Nota", half: true, ph: "Ej: examen de diciembre"}, grado?.nota)}
  </form>`);
  const q = n => body.querySelector(`[name=${n}]`);
  const hist = () => S.gradosDe(al.id, disc.id).filter(g => !grado || g.id !== grado.id).filter(g => !grado || g.fecha <= grado.fecha);
  const fillRanks = (sel) => {
    const h0 = hist(), cur = h0[h0.length - 1];
    let r = sel?.rank, g = sel?.grado;
    if(r === undefined){
      if(!cur){ r = 0; g = 0; }
      else { const rd = S.rankDef(disc, cur.rank); if(rd.g && cur.grado < rd.g){ r = cur.rank; g = cur.grado + 1; } else { r = Math.min(cur.rank + 1, disc.ranks.length - 1); g = 0; } }
    }
    q("rank").innerHTML = disc.ranks.map((x, i) => `<option value="${i}" ${i === r ? "selected" : ""}>${esc(x.n)}</option>`).join("");
    fillGrados(g);
    body.querySelector("[data-cur]").textContent = cur ? `Actual: ${rankLabel(disc, cur)} · hace ${fmtDuration(cur.fecha)}` : "Sin grado registrado en esta disciplina";
  };
  const fillGrados = g => {
    const rd = S.rankDef(disc, +q("rank").value), max = Math.max(rd.g || 0, 0);
    q("grado").innerHTML = Array.from({length: max + 1}, (_, i) => `<option value="${i}" ${i === (g || 0) ? "selected" : ""}>${i ? i + "°" : "Sin grados"}</option>`).join("");
    q("grado").disabled = !max;
    update();
  };
  const saveBtn = () => m.foot.querySelector("[data-save]");
  const update = () => {
    const n = {rank: +q("rank").value, grado: +q("grado").value || 0, fecha: q("fecha").value};
    body.querySelector("[data-prev]").innerHTML = belt(disc, n.rank, n.grado, {w: 220, h: 34});
    const w = S.avisosPromocion(disc, hist(), n);
    body.querySelector("[data-warn]").innerHTML = w.map(a => `<div class="alert ${a.nivel}">${icon(a.nivel === "info" ? "info" : "alert")}<span>${esc(a.txt)}</span></div>`).join("");
    if(m) saveBtn().textContent = w.some(a => a.nivel !== "info") ? "Guardar de todos modos" : (isNew ? "Registrar promoción" : "Guardar");
    if(m) saveBtn().classList.toggle("warn", w.some(a => a.nivel !== "info"));
  };
  let m = null;
  q("disciplinaId").onchange = () => { disc = S.get("disciplinas", q("disciplinaId").value); fillRanks(); };
  q("rank").onchange = () => fillGrados(0);
  q("grado").onchange = update; q("fecha").onchange = update;
  m = modal({title: isNew ? "Promoción de grado" : "Editar promoción", body,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")}</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" data-save>Registrar promoción</button>`});
  fillRanks(grado ? {rank: grado.rank, grado: grado.grado} : undefined);
  saveBtn().onclick = () => {
    const v = formValues(body);
    if(v.profesor) S.setPref("profesor", v.profesor);
    S.put("grados", {id: grado?.id, alumnoId: al.id, disciplinaId: disc.id, rank: +v.rank, grado: +(v.grado || 0), fecha: v.fecha || today(), profesor: v.profesor, nota: v.nota, inicial: grado?.inicial});
    toast(isNew ? `¡${al.nombre.split(" ")[0]} ahora es ${S.rankDef(disc, +v.rank).n}${+v.grado ? " " + v.grado + "°" : ""}!` : "Promoción actualizada");
    m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => { if(await confirmDlg("¿Eliminar este registro del historial?")){ S.del("grados", grado.id); m.close(); } };
}

/* ---------- disciplina con su sistema de grados ---------- */
export function disciplineModal(d, preset){
  const isNew = !d;
  d = d ? JSON.parse(JSON.stringify(d)) : {nombre: preset?.nombre || "", sistema: preset?.sistema || "niveles", ranks: cloneRanks(preset?.sistema || "niveles"), sedeIds: S.sedes().map(s => s.id), color: DISC_COLORS[S.disciplinas().length % DISC_COLORS.length]};
  const body = h(`<form class="form" novalidate>
    ${field({k: "nombre", label: "Nombre", req: true, half: true, ph: "Ej: Brazilian Jiu-Jitsu"}, d.nombre)}
    ${field({k: "color", label: "Color", type: "color", half: true}, d.color)}
    ${field({k: "sedeIds", label: "Se enseña en", type: "chips", opts: S.sedes().map(s => [s.id, s.nombre]), empty: "Crea una sede primero"}, d.sedeIds)}
    ${field({k: "sistema", label: "Sistema de grados (plantilla)", type: "select", opts: Object.entries(SYSTEMS).map(([k, s]) => [k, s.nombre]), hint: "Cambiar la plantilla reemplaza la lista de abajo."}, d.sistema)}
    <p class="small muted" data-nota></p>
    <div class="ranks-edit"><div class="re-head"><span>Cinturón / nivel</span><span>Color</span><span title="Grados o rayas máximas">Grados</span><span title="Meses mínimos en este cinturón antes de pasar al siguiente">Meses mín.</span><span title="Meses mínimos entre grados">Meses/grado</span><span></span></div><div data-ranks></div>
    <button type="button" class="btn ghost small" data-add>${icon("plus")} Agregar cinturón</button></div>
  </form>`);
  const list = body.querySelector("[data-ranks]");
  const nota = () => { body.querySelector("[data-nota]").textContent = SYSTEMS[body.querySelector("[name=sistema]").value]?.nota || ""; };
  const render = () => {
    list.innerHTML = d.ranks.map((r, i) => `<div class="re-row" data-i="${i}">
      <input data-f="n" value="${esc(r.n)}" aria-label="Nombre">
      <input data-f="c" type="color" value="${esc(r.c)}" aria-label="Color">
      <input data-f="g" type="number" min="0" max="12" value="${r.g || 0}" aria-label="Grados">
      <input data-f="m" type="number" min="0" step="0.5" value="${r.m || 0}" aria-label="Meses mínimos">
      <input data-f="mg" type="number" min="0" step="0.5" value="${r.mg || 0}" aria-label="Meses por grado">
      <span class="re-act"><button type="button" class="icon-btn" data-up title="Subir">▲</button><button type="button" class="icon-btn" data-rm title="Quitar">${icon("x")}</button></span>
    </div>`).join("");
  };
  list.addEventListener("input", e => {
    const row = e.target.closest(".re-row"); if(!row) return;
    const r = d.ranks[+row.dataset.i], f = e.target.dataset.f;
    r[f] = f === "n" || f === "c" ? e.target.value : Number(e.target.value) || 0;
  });
  list.addEventListener("click", e => {
    const row = e.target.closest(".re-row"); if(!row) return;
    const i = +row.dataset.i;
    if(e.target.closest("[data-rm]")){ if(d.ranks.length > 1){ d.ranks.splice(i, 1); render(); } }
    if(e.target.closest("[data-up]") && i > 0){ [d.ranks[i - 1], d.ranks[i]] = [d.ranks[i], d.ranks[i - 1]]; render(); }
  });
  body.querySelector("[data-add]").onclick = () => { d.ranks.push({n: "Nuevo", c: "#888888", g: 0, m: 6, mg: 0}); render(); };
  body.querySelector("[name=sistema]").onchange = e => { d.ranks = cloneRanks(e.target.value); render(); nota(); };
  render(); nota();
  const m = modal({title: isNew ? "Nueva disciplina" : "Editar disciplina", body, wide: true,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")} Eliminar</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.nombre){ toast("Escribe el nombre", "warn"); return; }
    S.put("disciplinas", {id: d.id, academiaId: S.academy().id, nombre: v.nombre, color: v.color, sedeIds: v.sedeIds || [], sistema: v.sistema, ranks: d.ranks});
    toast("Disciplina guardada"); m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => {
    const n = S.all("alumnos").filter(a => (a.disciplinaIds || []).includes(d.id)).length;
    if(!await confirmDlg(`Se eliminará ${d.nombre}${n ? ` y se quitará de ${n} alumno(s). Su historial de grados en esta disciplina también se borrará` : ""}.`)) return;
    for(const a of S.all("alumnos")) if((a.disciplinaIds || []).includes(d.id)) S.put("alumnos", {id: a.id, disciplinaIds: a.disciplinaIds.filter(x => x !== d.id)});
    for(const g of S.all("grados")) if(g.disciplinaId === d.id) S.del("grados", g.id);
    S.del("disciplinas", d.id); m.close();
  };
}

/* ---------- sede ---------- */
export function sedeModal(s){
  const isNew = !s;
  s = s || {};
  const body = h(`<form class="form" novalidate>
    ${field({k: "nombre", label: "Nombre de la sede", req: true, ph: "Ej: Sede Norte"}, s.nombre)}
    ${field({k: "direccion", label: "Dirección", half: true}, s.direccion)}
    ${field({k: "ciudad", label: "Ciudad", half: true}, s.ciudad ?? S.academy()?.ciudad)}
    ${field({k: "telefono", label: "Teléfono", type: "tel", half: true}, s.telefono)}
    ${field({k: "encargado", label: "Profesor encargado", half: true}, s.encargado)}
    ${field({k: "horario", label: "Horarios", type: "textarea", ph: "Lun-Mié-Vie 6:00 pm BJJ\nMar-Jue 7:00 pm Muay Thai"}, s.horario)}
    ${field({k: "discs", label: "Disciplinas que se enseñan aquí", type: "chips", opts: S.disciplinas().map(d => [d.id, d.nombre]), empty: "Aún no hay disciplinas"}, isNew ? S.disciplinas().map(d => d.id) : S.discsOfSede(s.id).map(d => d.id))}
  </form>`);
  const m = modal({title: isNew ? "Nueva sede" : "Editar sede", body,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")} Eliminar</button>` : ""}<button class="btn ghost" data-close>Cancelar</button><button class="btn primary" data-save>Guardar</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.nombre){ toast("Escribe el nombre", "warn"); return; }
    const discs = v.discs || []; delete v.discs;
    const r = S.put("sedes", Object.assign({id: s.id, academiaId: S.academy().id}, v));
    for(const d of S.disciplinas()){
      const has = (d.sedeIds || []).includes(r.id), want = discs.includes(d.id);
      if(has !== want) S.put("disciplinas", {id: d.id, sedeIds: want ? [...(d.sedeIds || []), r.id] : d.sedeIds.filter(x => x !== r.id)});
    }
    toast("Sede guardada"); m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => {
    const n = S.alumnos({sede: s.id, todos: true}).length;
    if(n){ toast(`La sede tiene ${n} alumno(s). Muévelos a otra sede antes de eliminarla.`, "warn"); return; }
    if(await confirmDlg(`¿Eliminar la sede ${s.nombre}?`)){ S.del("sedes", s.id); if(S.pref("sede") === s.id) S.setPref("sede", ""); m.close(); }
  };
}
