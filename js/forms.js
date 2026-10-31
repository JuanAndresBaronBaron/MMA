/* Formularios compartidos: alumno, pago, promoción de grado, disciplina. */
import * as S from "./store.js";
import {field, formValues, modal, toast, icon, belt, avatar, pickPhoto, confirmDlg, rankLabel} from "./ui.js";
import {BLOOD, METHODS, PLANS, GEAR, SIZES, STATUS, planById, SYSTEMS, cloneRanks, DISC_COLORS} from "./catalog.js";
import {esc, today, h, money, fmtDate, fmtDuration, now} from "./util.js";
import {queueFoto} from "./sync.js";
import {t, tn} from "./i18n.js";
import {deuda, finPeriodo, txtCuotas, periodoNuevo} from "./cobros.js";

/* borra con aviso «Deshacer» en vez de pedir confirmación: guarda una copia y la vuelve a poner */
function delUndo(col, rec, msg){
  const snap = Object.assign({}, S.get(col, rec.id) || rec);
  S.del(col, rec.id);
  toast(msg, "warn", {label: t("Deshacer"), fn: () => { S.put(col, snap); toast(t("Restaurado")); }});
}

/* ---------- alumno ---------- */
export function studentForm(al, opts = {}){
  const isNew = !al;
  al = al || {sedeId: opts.sedeId || S.curSede() || S.sedes()[0]?.id, estado: "activo", plan: "mensual", fechaInicio: today(), disciplinaIds: [], equipo: {}, valor: S.academy()?.valorMensual ?? ""};
  let photo = S.foto(al.id || "") || null, photoChanged = false;
  const sedes = S.sedes(), sedesOpts = sedes.map(s => [s.id, s.nombre]);
  const eq = al.equipo || {};
  const gearHtml = GEAR.map(g => `<div class="gear-row"><label class="check"><input type="checkbox" name="eq_${g.k}" ${eq[g.k]?.tiene ? "checked" : ""}><span>${esc(t(g.n))}</span></label>${g.talla ? `<input class="gear-size" name="eqt_${g.k}" placeholder="${esc(t("Talla"))}" list="sizes" value="${esc(eq[g.k]?.talla || "")}" aria-label="${esc(t("Talla") + " · " + t(g.n))}">` : ""}</div>`).join("");
  /* secciones plegables: se abren solas si ya tienen datos */
  const has = ks => ks.some(k => al[k] !== undefined && al[k] !== null && String(al[k]).trim() !== "");
  const fold = (txt, ic, open, inner) => `<details class="fsec" ${open ? "open" : ""}><summary>${icon(ic)}<span>${esc(txt)}</span>${icon("chevron", "fsec-chev")}</summary><div class="fsec-b">${inner}</div></details>`;
  const sedeHtml = sedes.length > 1 ? field({k: "sedeId", label: t("Sede"), type: "select", opts: sedesOpts, req: true, half: true}, al.sedeId) : `<input type="hidden" name="sedeId" value="${esc(al.sedeId || "")}">`;
  const estadoHtml = !isNew ? field({k: "estado", label: t("Estado"), type: "select", opts: Object.entries(STATUS).map(([k, v]) => [k, t(v)]), half: true}, al.estado) : `<input type="hidden" name="estado" value="${esc(al.estado || "activo")}">`;
  const body = h(`<form class="form student-form" novalidate>
    <div class="photo-pick">
      <button type="button" class="photo-btn" data-photo aria-label="${esc(t("Foto del alumno"))}">${photo ? `<img src="${photo}" alt="">` : icon("camera", "big")}<span class="photo-badge">${icon("camera")}</span></button>
      <div class="photo-txt"><b>${t("Foto del alumno")}</b><span class="muted small">${t("Toca para subir o tomar una foto. Se recorta en cuadrado.")}</span>
      <button type="button" class="btn-link danger small" data-nophoto ${photo ? "" : "hidden"}>${t("Quitar foto")}</button></div>
    </div>
    ${field({k: "nombre", label: t("Nombre completo"), req: true, ph: t("Ej: Juan Pérez")}, al.nombre)}
    ${field({k: "telefono", label: t("Teléfono / WhatsApp"), type: "tel"}, al.telefono)}
    ${sedeHtml}${estadoHtml}
    <div class="field" data-discs></div>
    <div data-ranks class="ranks-init"></div>
    ${field({k: "plan", label: t("Plan"), type: "select", opts: PLANS.map(p => [p.id, t(p.nombre)]), half: true}, al.plan)}
    ${field({k: "valor", label: t("Valor del plan ({moneda})", {moneda: S.academy()?.moneda || "COP"}), type: "number", half: true}, al.valor)}
    ${field({k: "fechaInicio", label: t("Fecha de ingreso"), type: "date", hint: t("Si no tiene pagos, el primer cobro vence este día.")}, al.fechaInicio)}
    ${fold(t("Datos personales"), "users", has(["documento", "nacimiento", "genero", "talla"]), `
      ${field({k: "documento", label: t("Documento de identidad"), half: true}, al.documento)}
      ${field({k: "nacimiento", label: t("Fecha de nacimiento"), type: "date", half: true}, al.nacimiento)}
      ${field({k: "genero", label: t("Género"), type: "seg", opts: [["M", t("Masculino")], ["F", t("Femenino")], ["O", t("Otro")]]}, al.genero)}
      ${field({k: "talla", label: t("Talla de ropa"), half: true, list: SIZES}, al.talla)}`)}
    ${fold(t("Contacto y acudiente"), "phone", has(["email", "direccion", "acudiente", "acudienteTel"]), `
      ${field({k: "email", label: t("Correo"), type: "email", half: true}, al.email)}
      ${field({k: "direccion", label: t("Dirección"), half: true}, al.direccion)}
      ${field({k: "acudiente", label: t("Acudiente (menores)"), half: true}, al.acudiente)}
      ${field({k: "acudienteTel", label: t("Teléfono del acudiente"), type: "tel", half: true}, al.acudienteTel)}`)}
    ${fold(t("Salud y emergencia"), "heart", has(["sangre", "eps", "peso", "estatura", "alergias", "lesiones", "emergencia", "emergenciaTel"]), `
      ${field({k: "sangre", label: t("Tipo de sangre (RH)"), type: "select", opts: [["", "—"], ...BLOOD], half: true}, al.sangre)}
      ${field({k: "eps", label: t("EPS / seguro médico"), half: true}, al.eps)}
      ${field({k: "peso", label: t("Peso (kg)"), type: "number", step: "0.1", half: true}, al.peso)}
      ${field({k: "estatura", label: t("Estatura (cm)"), type: "number", half: true}, al.estatura)}
      ${field({k: "alergias", label: t("Alergias"), half: true, ph: t("Ninguna")}, al.alergias)}
      ${field({k: "lesiones", label: t("Lesiones / condiciones médicas"), half: true}, al.lesiones)}
      ${field({k: "emergencia", label: t("Contacto de emergencia"), half: true}, al.emergencia)}
      ${field({k: "emergenciaTel", label: t("Teléfono de emergencia"), type: "tel", half: true}, al.emergenciaTel)}`)}
    ${fold(t("Equipo (para ofrecer productos)"), "bag", Object.values(eq).some(x => x?.tiene || x?.talla), `<div class="gear">${gearHtml}</div>`)}
    ${fold(t("Notas"), "edit", has(["notas"]), field({k: "notas", label: t("Notas del profesor"), type: "textarea"}, al.notas))}
    <datalist id="sizes">${SIZES.map(s => `<option value="${s}">`).join("")}</datalist>
  </form>`);

  const discBox = body.querySelector("[data-discs]"), ranksBox = body.querySelector("[data-ranks]");
  let checked = new Set(al.disciplinaIds || []);
  const renderDiscs = () => {
    const sid = body.querySelector("[name=sedeId]").value;
    const ds = S.discsOfSede(sid);
    discBox.innerHTML = `<span class="lbl">${t("Disciplinas que entrena")}</span><div class="chips">${ds.map(d => `<label class="chip" style="--dc:${d.color}"><input type="checkbox" name="disc" value="${d.id}" ${checked.has(d.id) ? "checked" : ""}><span>${esc(t(d.nombre))}</span></label>`).join("") || `<span class="muted small">${t("Esta sede aún no tiene disciplinas. Agrégalas en Academia.")}</span>`}</div>`;
    renderRanks();
  };
  /* grados posibles según el cinturón elegido (ranks[i].g); sin grados = select deshabilitado */
  const gradeOpts = (d, rk, g = 0) => Array.from({length: (S.rankDef(d, rk).g || 0) + 1}, (_, i) => `<option value="${i}" ${i === +g ? "selected" : ""}>${i ? tn(i, "1° grado", "{n}° grado") : t("Sin grados")}</option>`).join("");
  const renderRanks = () => {
    const keep = {};
    for(const x of ranksBox.querySelectorAll("select,input")) keep[x.name] = x.value;
    const ds = [...discBox.querySelectorAll("input[name=disc]:checked")].map(i => S.get("disciplinas", i.value)).filter(Boolean);
    const rows = ds.filter(d => !al.id || !S.gradosDe(al.id, d.id).length);
    ranksBox.innerHTML = rows.length ? `<span class="lbl">${t("Cinturón o nivel con el que empieza")}</span>` + rows.map(d => {
      const rk = Math.min(+(keep["rk_" + d.id] ?? 0) || 0, d.ranks.length - 1), sinG = !(S.rankDef(d, rk).g > 0);
      return `<div class="rank-init"><span class="dot" style="background:${d.color}"></span><b>${esc(t(d.nombre))}</b>
        <select name="rk_${d.id}" aria-label="${esc(t("Cinturón / nivel"))}">${d.ranks.map((r, i) => `<option value="${i}" ${i === rk ? "selected" : ""}>${esc(t(r.n))}</option>`).join("")}</select>
        <select name="gr_${d.id}" aria-label="${esc(t("Grado"))}" ${sinG ? "disabled" : ""}>${gradeOpts(d, rk, keep["gr_" + d.id] || 0)}</select>
        <input type="date" name="fd_${d.id}" value="${esc(keep["fd_" + d.id] || body.querySelector("[name=fechaInicio]")?.value || today())}" title="${esc(t("Desde cuándo tiene ese grado"))}" aria-label="${esc(t("Desde cuándo tiene ese grado"))}"></div>`;
    }).join("") + `<small class="hint">${t("La fecha es desde cuándo tiene ese grado: sirve para calcular el tiempo hasta la siguiente promoción.")}</small>` : "";
  };
  discBox.addEventListener("change", e => { if(e.target.name === "disc"){ e.target.checked ? checked.add(e.target.value) : checked.delete(e.target.value); renderRanks(); } });
  ranksBox.addEventListener("change", e => {
    if(!e.target.name?.startsWith("rk_")) return;
    const d = S.get("disciplinas", e.target.name.slice(3)), gs = ranksBox.querySelector(`[name="gr_${d.id}"]`);
    gs.innerHTML = gradeOpts(d, +e.target.value); gs.disabled = !(S.rankDef(d, +e.target.value).g > 0);
  });
  body.querySelector("[name=sedeId]").addEventListener("change", renderDiscs);
  renderDiscs();

  const pbtn = body.querySelector("[data-photo]"), nop = body.querySelector("[data-nophoto]");
  pbtn.onclick = async () => {
    const d = await pickPhoto(); if(!d) return;
    photo = d; photoChanged = true;
    pbtn.innerHTML = `<img src="${d}" alt=""><span class="photo-badge">${icon("camera")}</span>`; nop.hidden = false;
  };
  nop.onclick = () => { photo = null; photoChanged = true; pbtn.innerHTML = `${icon("camera", "big")}<span class="photo-badge">${icon("camera")}</span>`; nop.hidden = true; };

  const m = modal({title: isNew ? t("Nuevo alumno") : t("Editar alumno"), body, wide: true,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${t("Eliminar")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button>${isNew ? `<button class="btn ghost" data-savepay>${icon("cash")} ${t("Agregar y registrar pago")}</button>` : ""}<button class="btn primary" data-save>${isNew ? t("Agregar alumno") : t("Guardar")}</button>`});
  const save = async pay => {
    const v = formValues(body);
    if(!v.nombre){ const n = body.querySelector("[name=nombre]"); n.focus(); n.classList.add("bad"); toast(t("Escribe el nombre del alumno"), "warn"); return; }
    if(!v.sedeId){ toast(t("Primero crea una sede en Academia"), "warn"); return; }
    const equipo = {};
    for(const g of GEAR) equipo[g.k] = {tiene: !!v["eq_" + g.k], talla: v["eqt_" + g.k] || ""};
    const rec = {
      id: al.id, academiaId: S.academy().id,
      nombre: v.nombre, documento: v.documento, nacimiento: v.nacimiento, genero: v.genero || "",
      telefono: v.telefono, email: v.email, direccion: v.direccion, acudiente: v.acudiente, acudienteTel: v.acudienteTel,
      sangre: v.sangre, eps: v.eps, peso: v.peso, estatura: v.estatura, alergias: v.alergias, lesiones: v.lesiones,
      emergencia: v.emergencia, emergenciaTel: v.emergenciaTel,
      sedeId: v.sedeId, estado: v.estado || "activo", disciplinaIds: v.disc || [], fechaInicio: v.fechaInicio || today(),
      plan: v.plan, valor: v.valor, talla: v.talla, equipo, notas: v.notas,
    };
    if(photoChanged){ rec.fotoU = now(); rec.foto = !!photo; }
    /* vuelve a cobrarse (de congelado/inactivo, o de beca/clase a un plan pago): la deuda cuenta desde hoy */
    if(!isNew && rec.estado === "activo" && planById(rec.plan).meses && (al.estado !== "activo" || !planById(al.plan).meses)) rec.activoDesde = today();
    const saved = S.put("alumnos", rec);
    if(photoChanged){ await S.setFoto(saved.id, photo, rec.fotoU); queueFoto(saved.id); }
    for(const did of rec.disciplinaIds){
      if(S.gradosDe(saved.id, did).length) continue;
      const rk = v["rk_" + did];
      if(rk === undefined) continue;
      S.put("grados", {alumnoId: saved.id, disciplinaId: did, rank: Number(rk), grado: Number(v["gr_" + did] || 0), fecha: v["fd_" + did] || rec.fechaInicio, inicial: true, nota: "Grado al ingresar"});
    }
    toast(isNew ? t("Alumno agregado") : t("Cambios guardados"));
    m.close();
    opts.onSaved && opts.onSaved(saved);
    if(pay) paymentModal(saved);
  };
  m.foot.querySelector("[data-save]").onclick = () => save(false);
  if(isNew) m.foot.querySelector("[data-savepay]").onclick = () => save(true);
  body.addEventListener("submit", e => { e.preventDefault(); save(false); });
  if(!isNew) m.foot.querySelector("[data-del]").onclick = () => deleteStudent(al, m, opts);
  return m;
}
/* borrar alumno: lo primero que se ofrece es «Marcar inactivo» (conserva historial) */
function deleteStudent(al, form, opts){
  const d = modal({title: t("¿Eliminar a {nombre}?", {nombre: al.nombre}), body: `<p class="muted">${esc(t("Se eliminará a {nombre} con sus pagos, grados y asistencias. Si solo dejó de venir, mejor márcalo como inactivo: conservas su historial.", {nombre: al.nombre}))}</p>`,
    foot: `<button class="btn danger ghost left" data-hard>${icon("trash")} ${t("Eliminar definitivamente")}</button><button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-inact>${t("Marcar inactivo")}</button>`});
  d.foot.querySelector("[data-inact]").onclick = () => {
    S.put("alumnos", {id: al.id, estado: "inactivo"});
    toast(t("{nombre} quedó inactivo", {nombre: al.nombre.split(" ")[0]})); d.close(); form.close();
  };
  d.foot.querySelector("[data-hard]").onclick = async () => {
    for(const p of S.pagosDe(al.id)) S.del("pagos", p.id);
    for(const g of S.gradosDe(al.id)) S.del("grados", g.id);
    /* sin asistencias huérfanas: este alumno y, de paso, ids de alumnos ya borrados que volvieron con un merge */
    for(const a of S.all("asistencias")){
      const pres = a.presentes || [], keep = pres.filter(x => x !== al.id && !S.isDeleted("alumnos", x));
      if(keep.length !== pres.length) S.put("asistencias", {id: a.id, presentes: keep});
    }
    S.del("alumnos", al.id);
    await S.setFoto(al.id, null); queueFoto(al.id);
    toast(t("Alumno eliminado")); d.close(); form.close();
    opts.onDeleted && opts.onDeleted();
  };
}

/* ---------- pagos ---------- */
export function paymentModal(al, pago){
  const acad = S.academy(), cur = acad?.moneda || "COP";
  const isNew = !pago;
  const per = periodoNuevo(al);
  pago = pago || {fecha: today(), monto: S.valorPlan(al), metodo: S.pref("metodo", METHODS[0]), concepto: "Mensualidad", desde: per.desde, hasta: per.hasta, plan: al.plan};
  const body = h(`<form class="form" novalidate>
    <div class="pay-head">${avatar(al, 44)}<div><b>${esc(al.nombre)}</b><span class="muted small">${esc(t(planById(al.plan).nombre))} · ${money(S.valorPlan(al), cur)}</span></div></div>
    ${field({k: "concepto", label: t("Concepto"), type: "select", opts: [["Mensualidad", t("Mensualidad")], ["Inscripción", t("Inscripción")], ["Clase suelta", t("Clase suelta")], ["Tiquetera", t("Tiquetera")], ["Producto", t("Producto")], ["Examen de grado", t("Examen de grado")], ["Torneo", t("Torneo")], ["Otro", t("Otro")]], half: true}, pago.concepto)}
    ${field({k: "monto", label: t("Valor ({moneda})", {moneda: cur}), type: "number", req: true, half: true}, pago.monto)}
    ${field({k: "fecha", label: t("Fecha de pago"), type: "date", half: true}, pago.fecha)}
    ${field({k: "metodo", label: t("Método"), type: "select", opts: METHODS.map(x => [x, t(x)]), half: true}, pago.metodo)}
    <div class="period" data-period>
      ${field({k: "plan", label: t("Cubre"), type: "select", opts: PLANS.filter(p => p.meses).map(p => [p.id, t(p.nombre)]), third: true}, pago.plan || al.plan)}
      ${field({k: "desde", label: t("Desde"), type: "date", third: true}, pago.desde)}
      ${field({k: "hasta", label: t("Próximo pago"), type: "date", third: true, hint: ""}, pago.hasta)}
    </div>
    ${field({k: "nota", label: t("Nota"), ph: t("Opcional")}, pago.nota)}
  </form>`);
  const q = n => body.querySelector(`[name=${n}]`);
  const toggle = () => { body.querySelector("[data-period]").hidden = !["Mensualidad", "Tiquetera"].includes(q("concepto").value); };
  q("concepto").onchange = toggle; toggle();
  const recalc = () => { q("hasta").value = finPeriodo(q("desde").value, q("plan").value); };
  q("desde").onchange = recalc; q("plan").onchange = recalc;
  const m = modal({title: isNew ? t("Registrar pago") : t("Editar pago"), body,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${icon("check")} ${isNew ? t("Registrar pago") : t("Guardar")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.monto && v.monto !== 0){ toast(t("Escribe el valor"), "warn"); return; }
    const periodic = !body.querySelector("[data-period]").hidden;
    if(v.metodo) S.setPref("metodo", v.metodo);
    S.put("pagos", {id: pago.id, alumnoId: al.id, academiaId: al.academiaId, sedeId: al.sedeId, concepto: v.concepto, monto: v.monto, fecha: v.fecha || today(), metodo: v.metodo,
      plan: periodic ? v.plan : null, desde: periodic ? v.desde : null, hasta: periodic ? v.hasta : null, nota: v.nota});
    toast(isNew ? t("Pago de {nombre} registrado", {nombre: al.nombre}) : t("Pago actualizado"));
    m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = () => { m.close(); delUndo("pagos", pago, t("Pago eliminado")); };
}
/* «check» de pagado en un toque: registra el plan con los valores por defecto, con deshacer.
   Si debe varias cuotas, primero pregunta qué hacer con el atraso (cobrar todo, solo una o perdonar). */
const QUICK_METHODS = ["Efectivo", "Nequi", "Transferencia"];
export function quickPay(al){
  const d = deuda(al);
  if(d.cuotas > 1) return deudaSheet(al, d);
  /* periodoNuevo de cobros: con 1 cuota vencida usa esa cuota (el de store arrancaría hoy y perdería el atraso en planes largos) */
  const per = periodoNuevo(al);
  registrar(al, {monto: S.valorPlan(al), desde: per.desde, hasta: per.hasta});
}
function registrar(al, {monto, desde, hasta, nota}){
  const metodo = S.pref("metodo", METHODS[0]);
  const p = S.put("pagos", {alumnoId: al.id, academiaId: al.academiaId, sedeId: al.sedeId, concepto: "Mensualidad", monto, fecha: today(), metodo, plan: al.plan, desde, hasta, nota: nota || ""});
  S.setPref("qpUsado", true);
  toast(t("{nombre}: pagado hasta {fecha}", {nombre: al.nombre.split(" ")[0], fecha: fmtDate(hasta)}), "ok", {label: t("Deshacer"), fn: () => { S.del("pagos", p.id); toast(t("Pago deshecho"), "warn"); }});
  /* chips de método en el mismo aviso: cambian el pago recién creado */
  const el = document.querySelector("#toasts")?.lastElementChild;
  if(!el) return p;
  el.classList.add("has-chips");
  const box = h(`<div class="toast-chips" role="group" aria-label="${esc(t("Método"))}">${QUICK_METHODS.map(x => `<button type="button" class="toast-chip ${x === metodo ? "on" : ""}" data-m="${esc(x)}" aria-pressed="${x === metodo}">${esc(t(x === "Transferencia" ? "Transf." : x))}</button>`).join("")}</div>`);
  box.onclick = e => {
    const b = e.target.closest("[data-m]"); if(!b || !S.get("pagos", p.id)) return;
    S.put("pagos", {id: p.id, metodo: b.dataset.m}); S.setPref("metodo", b.dataset.m);
    for(const c of box.children){ c.classList.toggle("on", c === b); c.setAttribute("aria-pressed", c === b); }
  };
  el.appendChild(box);
  return p;
}
/* hoja: debe N cuotas. Cada opción deja una nota en el pago para que el historial lo explique */
function deudaSheet(al, d){
  const cur = S.academy()?.moneda || "COP", valor = S.valorPlan(al), n = d.cuotas, nc = txtCuotas(al, n);
  const body = h(`<div class="debt-sheet">
    <div class="pay-head">${avatar(al, 44)}<div><b>${esc(al.nombre)}</b><span class="muted small">${esc(t("Debe {cuotas} · {monto}", {cuotas: nc, monto: money(d.monto, cur)}))}</span></div></div>
    <p class="muted small">${esc(t("Su último pago cubría hasta el {fecha}. ¿Qué pagó hoy?", {fecha: fmtDate(d.desde)}))}</p>
    <div class="debt-opts">
      <button type="button" class="debt-opt primary" data-opt="todo"><b>${esc(t("Cobrar los {n}", {n}))} · ${money(d.monto, cur)}</b><span>${esc(t("Queda al día hasta el {fecha}", {fecha: fmtDate(d.hasta)}))}</span></button>
      <button type="button" class="debt-opt" data-opt="uno"><b>${esc(t("Solo este mes"))} · ${money(valor, cur)}</b><span>${esc(t("Cubre la cuota más vieja y sigue debiendo {cuotas}", {cuotas: txtCuotas(al, n - 1)}))}</span></button>
      <button type="button" class="debt-opt" data-opt="perdonar"><b>${esc(t("Perdonar atraso"))} · ${money(valor, cur)}</b><span>${esc(t("Cobra un período desde hoy y olvida lo atrasado"))}</span></button>
    </div></div>`);
  const m = modal({title: t("Pago con atraso"), body, foot: `<button class="btn ghost" data-close>${t("Cancelar")}</button>`});
  /* un solo registro aunque toquen dos veces mientras la hoja se cierra */
  let hecho = false;
  body.onclick = e => {
    const b = e.target.closest("[data-opt]"); if(!b || hecho) return;
    hecho = true;
    const o = b.dataset.opt;
    if(o === "todo") registrar(al, {monto: d.monto, desde: d.desde, hasta: d.hasta, nota: t("Cobro de {cuotas} atrasados", {cuotas: nc})});
    else if(o === "uno") registrar(al, {monto: valor, desde: d.desde, hasta: finPeriodo(d.desde, al.plan), nota: t("Pagó 1 de {n} cuotas atrasadas; sigue debiendo", {n})});
    else { const hoy = today(); registrar(al, {monto: valor, desde: hoy, hasta: finPeriodo(hoy, al.plan), nota: t("Atraso perdonado: {cuotas} ({monto})", {cuotas: txtCuotas(al, n - 1), monto: money(d.monto - valor, cur)})}); }
    m.close();
  };
  return m;
}

/* ---------- promoción de grado ---------- */
export function promotionModal(al, discId, grado){
  const discs = (al.disciplinaIds || []).map(id => S.get("disciplinas", id)).filter(Boolean);
  if(!discs.length){ toast(t("Este alumno no tiene disciplinas asignadas"), "warn"); return; }
  const isNew = !grado;
  let disc = S.get("disciplinas", grado?.disciplinaId || discId) || discs[0];
  const body = h(`<form class="form" novalidate>
    <div class="pay-head">${avatar(al, 44)}<div><b>${esc(al.nombre)}</b><span class="muted small" data-cur></span></div></div>
    ${field({k: "disciplinaId", label: t("Disciplina"), type: "select", opts: discs.map(d => [d.id, t(d.nombre)]), half: true}, disc.id)}
    ${field({k: "fecha", label: t("Fecha"), type: "date", half: true}, grado?.fecha || today())}
    <div class="field half"><label class="lbl">${t("Cinturón / nivel")}</label><select name="rank"></select></div>
    <div class="field half"><label class="lbl">${t("Grado")}</label><select name="grado"></select></div>
    <div class="belt-preview" data-prev></div>
    <div data-warn></div>
    ${field({k: "profesor", label: t("Otorgado por"), half: true, list: [...new Set(S.all("grados").map(g => g.profesor).filter(Boolean))]}, grado?.profesor || S.pref("profesor", ""))}
    ${field({k: "nota", label: t("Nota"), half: true, ph: t("Ej: examen de diciembre")}, grado?.nota)}
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
    q("rank").innerHTML = disc.ranks.map((x, i) => `<option value="${i}" ${i === r ? "selected" : ""}>${esc(t(x.n))}</option>`).join("");
    fillGrados(g);
    body.querySelector("[data-cur]").textContent = cur ? t("Actual: {grado} · hace {tiempo}", {grado: rankLabel(disc, cur), tiempo: fmtDuration(cur.fecha)}) : t("Sin grado registrado en esta disciplina");
  };
  const fillGrados = g => {
    const rd = S.rankDef(disc, +q("rank").value), max = Math.max(rd.g || 0, 0);
    q("grado").innerHTML = Array.from({length: max + 1}, (_, i) => `<option value="${i}" ${i === (g || 0) ? "selected" : ""}>${i ? i + "°" : t("Sin grados")}</option>`).join("");
    q("grado").disabled = !max;
    update();
  };
  const saveBtn = () => m.foot.querySelector("[data-save]");
  const update = () => {
    const n = {rank: +q("rank").value, grado: +q("grado").value || 0, fecha: q("fecha").value};
    body.querySelector("[data-prev]").innerHTML = belt(disc, n.rank, n.grado, {w: 220, h: 34});
    const w = S.avisosPromocion(disc, hist(), n);
    body.querySelector("[data-warn]").innerHTML = w.map(a => `<div class="alert ${a.nivel}">${icon(a.nivel === "info" ? "info" : "alert")}<span>${esc(a.txt)}</span></div>`).join("");
    if(m) saveBtn().textContent = w.some(a => a.nivel !== "info") ? t("Guardar de todos modos") : (isNew ? t("Registrar promoción") : t("Guardar"));
    if(m) saveBtn().classList.toggle("warn", w.some(a => a.nivel !== "info"));
  };
  let m = null;
  q("disciplinaId").onchange = () => { disc = S.get("disciplinas", q("disciplinaId").value); fillRanks(); };
  q("rank").onchange = () => fillGrados(0);
  q("grado").onchange = update; q("fecha").onchange = update;
  m = modal({title: isNew ? t("Promoción de grado") : t("Editar promoción"), body,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Registrar promoción")}</button>`});
  fillRanks(grado ? {rank: grado.rank, grado: grado.grado} : undefined);
  saveBtn().onclick = () => {
    const v = formValues(body);
    if(v.profesor) S.setPref("profesor", v.profesor);
    S.put("grados", {id: grado?.id, alumnoId: al.id, disciplinaId: disc.id, rank: +v.rank, grado: +(v.grado || 0), fecha: v.fecha || today(), profesor: v.profesor, nota: v.nota, inicial: grado?.inicial});
    toast(isNew ? t("¡{nombre} ahora es {grado}!", {nombre: al.nombre.split(" ")[0], grado: t(S.rankDef(disc, +v.rank).n) + (+v.grado ? " " + v.grado + "°" : "")}) : t("Promoción actualizada"));
    m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = () => { m.close(); delUndo("grados", grado, t("Promoción eliminada")); };
}

/* ---------- disciplina con su sistema de grados ---------- */
export function disciplineModal(d, preset){
  const isNew = !d;
  d = d ? JSON.parse(JSON.stringify(d)) : {nombre: preset?.nombre || "", sistema: preset?.sistema || "niveles", ranks: cloneRanks(preset?.sistema || "niveles"), sedeIds: S.sedes().map(s => s.id), color: DISC_COLORS[S.disciplinas().length % DISC_COLORS.length]};
  const body = h(`<form class="form" novalidate>
    ${field({k: "nombre", label: t("Nombre"), req: true, half: true, ph: t("Ej: Brazilian Jiu-Jitsu")}, d.nombre)}
    ${field({k: "color", label: t("Color"), type: "color", half: true}, d.color)}
    ${field({k: "sedeIds", label: t("Se enseña en"), type: "chips", opts: S.sedes().map(s => [s.id, s.nombre]), empty: t("Crea una sede primero")}, d.sedeIds)}
    ${field({k: "sistema", label: t("Sistema de grados (plantilla)"), type: "select", opts: Object.entries(SYSTEMS).map(([k, s]) => [k, t(s.nombre)]), hint: t("Cambiar la plantilla reemplaza la lista de abajo.")}, d.sistema)}
    <p class="small muted" data-nota></p>
    <div class="ranks-edit"><div class="re-head"><span>${t("Cinturón / nivel")}</span><span>${t("Color")}</span><span title="${esc(t("Grados o rayas máximas"))}">${t("Grados máx.")}</span><span title="${esc(t("Meses mínimos en este cinturón antes de pasar al siguiente"))}">${t("Meses mín.")}</span><span title="${esc(t("Meses mínimos entre grados"))}">${t("Meses/grado")}</span><span></span></div><div data-ranks></div>
    <button type="button" class="btn ghost small" data-add>${icon("plus")} ${t("Agregar cinturón")}</button></div>
  </form>`);
  const list = body.querySelector("[data-ranks]");
  const nota = () => { body.querySelector("[data-nota]").textContent = t(SYSTEMS[body.querySelector("[name=sistema]").value]?.nota || ""); };
  const render = () => {
    list.innerHTML = d.ranks.map((r, i) => `<div class="re-row" data-i="${i}">
      <input data-f="n" value="${esc(t(r.n))}" aria-label="${esc(t("Nombre"))}">
      <input data-f="c" type="color" value="${esc(r.c)}" aria-label="${esc(t("Color"))}">
      <input data-f="g" type="number" min="0" max="12" value="${r.g || 0}" aria-label="${esc(t("Grados máx."))}">
      <input data-f="m" type="number" min="0" step="0.5" value="${r.m || 0}" aria-label="${esc(t("Meses mínimos"))}">
      <input data-f="mg" type="number" min="0" step="0.5" value="${r.mg || 0}" aria-label="${esc(t("Meses por grado"))}">
      <span class="re-act"><button type="button" class="icon-btn" data-up title="${esc(t("Subir"))}">▲</button><button type="button" class="icon-btn" data-rm title="${esc(t("Quitar"))}">${icon("x")}</button></span>
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
  const m = modal({title: isNew ? t("Nueva disciplina") : t("Editar disciplina"), body, wide: true,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${t("Eliminar")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Guardar")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.nombre){ toast(t("Escribe el nombre"), "warn"); return; }
    S.put("disciplinas", {id: d.id, academiaId: S.academy().id, nombre: v.nombre, color: v.color, sedeIds: v.sedeIds || [], sistema: v.sistema, ranks: d.ranks});
    toast(t("Disciplina guardada")); m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => {
    const n = S.all("alumnos").filter(a => (a.disciplinaIds || []).includes(d.id)).length;
    if(!await confirmDlg(n ? tn(n, "Se eliminará {nombre} y se quitará de 1 alumno. Su historial de grados en esta disciplina también se borrará.", "Se eliminará {nombre} y se quitará de {n} alumnos. Su historial de grados en esta disciplina también se borrará.", {nombre: t(d.nombre)}) : t("Se eliminará {nombre}.", {nombre: t(d.nombre)}))) return;
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
    ${field({k: "nombre", label: t("Nombre de la sede"), req: true, ph: t("Ej: Sede Norte")}, s.nombre)}
    ${field({k: "direccion", label: t("Dirección"), half: true}, s.direccion)}
    ${field({k: "ciudad", label: t("Ciudad"), half: true}, s.ciudad ?? S.academy()?.ciudad)}
    ${field({k: "telefono", label: t("Teléfono"), type: "tel", half: true}, s.telefono)}
    ${field({k: "encargado", label: t("Profesor encargado"), half: true}, s.encargado)}
    ${field({k: "horario", label: t("Horarios"), type: "textarea", ph: t("Lun-Mié-Vie 6:00 pm BJJ\nMar-Jue 7:00 pm Muay Thai")}, s.horario)}
    ${field({k: "discs", label: t("Disciplinas que se enseñan aquí"), type: "chips", opts: S.disciplinas().map(d => [d.id, t(d.nombre)]), empty: t("Aún no hay disciplinas")}, isNew ? S.disciplinas().map(d => d.id) : S.discsOfSede(s.id).map(d => d.id))}
  </form>`);
  const m = modal({title: isNew ? t("Nueva sede") : t("Editar sede"), body,
    foot: `${!isNew ? `<button class="btn danger ghost left" data-del>${icon("trash")} ${t("Eliminar")}</button>` : ""}<button class="btn ghost" data-close>${t("Cancelar")}</button><button class="btn primary" data-save>${t("Guardar")}</button>`});
  m.foot.querySelector("[data-save]").onclick = () => {
    const v = formValues(body);
    if(!v.nombre){ toast(t("Escribe el nombre"), "warn"); return; }
    const discs = v.discs || []; delete v.discs;
    const r = S.put("sedes", Object.assign({id: s.id, academiaId: S.academy().id}, v));
    for(const d of S.disciplinas()){
      const has = (d.sedeIds || []).includes(r.id), want = discs.includes(d.id);
      if(has !== want) S.put("disciplinas", {id: d.id, sedeIds: want ? [...(d.sedeIds || []), r.id] : d.sedeIds.filter(x => x !== r.id)});
    }
    toast(t("Sede guardada")); m.close();
  };
  if(!isNew) m.foot.querySelector("[data-del]").onclick = async () => {
    const n = S.alumnos({sede: s.id, todos: true}).length;
    if(n){ toast(tn(n, "La sede tiene 1 alumno. Muévelo a otra sede antes de eliminarla.", "La sede tiene {n} alumnos. Muévelos a otra sede antes de eliminarla."), "warn"); return; }
    if(await confirmDlg(t("¿Eliminar la sede {nombre}?", {nombre: s.nombre}))){ S.del("sedes", s.id); if(S.pref("sede") === s.id) S.setPref("sede", ""); m.close(); }
  };
}
