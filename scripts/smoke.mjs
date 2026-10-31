/* Prueba de humo de toda la app con Playwright: crea una academia, carga los datos de ejemplo y recorre todas las rutas
   (también las ocultas con ids de ejemplo) a 390 y 1366 px, tema claro y oscuro, español e inglés.
   Luego prueba los modos de uso (js/roles.js): profesor (activar con PIN, sus rutas, sin cobros, las demás llevan a
   Inicio, salir con el PIN) y, en un aparato nuevo, estudiante (elegir «Quiero entrenar», sus rutas, las de la academia
   llevan a Entrenamiento).
   Falla si hay desbordamiento horizontal, errores de página o de consola, o #main vacío.
   Uso: node scripts/smoke.mjs [--base http://localhost:8000] [--only 390] [--quick]
   Si no hay servidor en --base, sirve los archivos del repo directamente desde el disco. */
import {createRequire} from "node:module";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);
let chromium;
try{ ({chromium} = require("playwright")); }
catch(e){ ({chromium} = require("/opt/node-tools/node_modules/playwright")); }

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("--base", "http://localhost:8000").replace(/\/$/, "");
const QUICK = process.argv.includes("--quick");
const ONLY = arg("--only", "");
const MIME = {".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".ico": "image/x-icon"};

async function serverUp(){ try{ const r = await fetch(BASE + "/index.html"); return r.ok; }catch(e){ return false; } }
/* sin servidor: responde desde el disco */
async function fromDisk(ctx){
  await ctx.route(BASE + "/**", route => {
    const u = new URL(route.request().url());
    let f = decodeURIComponent(u.pathname); if(f.endsWith("/")) f += "index.html";
    const fp = path.join(ROOT, f);
    if(!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) return route.fulfill({status: 404, body: "not found"});
    route.fulfill({status: 200, body: fs.readFileSync(fp), headers: {"content-type": MIME[path.extname(fp)] || "application/octet-stream", "cache-control": "no-store"}});
  });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function setup(p){
  await p.goto(BASE + "/");
  await p.waitForSelector("#wOwner, #wLocal, .app", {timeout: 15000});
  /* bienvenida: primero «Tengo una academia», luego «Empezar sin cuenta» */
  if(await p.$("#wOwner")){ await p.click("#wOwner"); await p.waitForSelector("#wLocal", {timeout: 5000}); }
  if(await p.$("#wLocal")){
    await p.click("#wLocal");
    await p.fill("[name=nombre]", "Team Bravo MMA");
    await p.click("[data-save]");
    await p.waitForSelector(".app", {timeout: 10000});
  }
  await p.evaluate(() => { location.hash = "#/ajustes"; });
  await p.waitForSelector("[data-demo], [data-undemo]", {timeout: 10000});
  if(await p.$("[data-demo]")) await p.click("[data-demo]");
  await sleep(500);
}
/* ids de ejemplo para las rutas ocultas */
async function demoIds(p){
  return p.evaluate(async () => {
    const S = await import("./js/store.js");
    const al = S.inAcad("alumnos");
    const pago = S.all("pagos").find(x => al.some(a => a.id === x.alumnoId));
    const g = S.all("grados").find(x => al.some(a => a.id === x.alumnoId));
    const clase = (S.clases ? S.clases() : [])[0];
    return {al: al[0]?.id, pago: pago?.id, galumno: g?.alumnoId, gdisc: g?.disciplinaId, clase: clase?.id};
  });
}
function rutas(ids){
  const R = ["inicio", "asistencia", "horario", "alumnos", "pagos", "grados", "ranking", "entreno", "leads", "reportes", "tienda", "academia", "ajustes",
    "entreno/glosario", "entreno/repaso", "entreno/stats", "entreno/logros", "entreno/diario", "entreno/bjj", "entreno/boxeo", "entreno/muaythai",
    "entreno/salud", "entreno/defensa", "entreno/kids", "entreno/fisico", "entreno/curriculo/bjj", "entreno/curriculo/muaythai", "entreno/glosario?q=kimura",
    "frases", "leads?nuevo=1", "kiosko"];
  if(ids.al) R.push("alumno/" + ids.al);
  if(ids.pago) R.push("recibo/" + ids.pago);
  if(ids.galumno) R.push(`certificado/${ids.galumno}/${ids.gdisc}`);
  if(ids.clase) R.push(`asistencia?clase=${ids.clase}`);
  R.push("recibo/no-existe", "alumno/no-existe");
  return QUICK ? R.filter(r => !r.includes("/") || r.startsWith("alumno/")) : R;
}
async function closeModals(p){
  for(let i = 0; i < 4 && await p.$(".modal-back"); i++){ await p.keyboard.press("Escape"); await sleep(260); }
}

async function combo(browser, {w, scheme, lang}){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}, colorScheme: scheme, locale: lang === "en" ? "en-US" : "es-CO", serviceWorkers: "block"});
  if(!await serverUp()) await fromDisk(ctx);
  await ctx.addInitScript(l => { try{ localStorage.setItem("mma:lang", l); }catch(e){} }, lang);
  const p = await ctx.newPage();
  const fails = [];
  let here = "setup";
  p.on("pageerror", e => fails.push({ruta: here, tipo: "pageerror", msg: String(e.message).slice(0, 300)}));
  p.on("console", m => { if(m.type() === "error") fails.push({ruta: here, tipo: "console", msg: (m.text() + " " + (m.location()?.url || "")).slice(0, 300)}); });
  p.on("requestfailed", r => { if(!/fonts\.(googleapis|gstatic)/.test(r.url())) fails.push({ruta: here, tipo: "request", msg: r.url()}); });
  try{ await setup(p); }catch(e){ fails.push({ruta: "setup", tipo: "setup", msg: e.message.slice(0, 300)}); await ctx.close(); return fails; }
  const ids = await demoIds(p);
  /* abre cada ruta y revisa desborde, #main vacío o vista sin cargar; pre: prefijo para el informe */
  const recorrer = async (lista, pre = "", extra) => {
    for(const r of lista){
      here = pre + r;
      await closeModals(p);
      await p.evaluate(h => { location.hash = h; }, "#/" + r);
      const listo = () => p.waitForFunction(() => { const m = document.querySelector("#main"); return m && m.children.length && (m.innerText || "").trim() && !m.querySelector(".view-load"); }, null, {timeout: 10000}).catch(() => {});
      await listo();
      await sleep(350);
      const mira = () => p.evaluate(() => {
        const m = document.querySelector("#main");
        return {ov: document.documentElement.scrollWidth - innerWidth, txt: (m?.innerText || "").trim().length, kids: m?.children.length || 0, na: !!m?.querySelector("[data-retry]")};
      });
      let st = await mira();
      /* con las 8 combinaciones a la vez la máquina va lenta: si quedó a medio pintar, se mira otra vez */
      if(!st.kids || !st.txt){ await listo(); await sleep(800); st = await mira(); }
      if(st.ov > 0) fails.push({ruta: here, tipo: "overflow", msg: `scrollWidth excede ${st.ov}px`});
      if(!st.kids || !st.txt) fails.push({ruta: here, tipo: "vacio", msg: "#main vacío"});
      if(st.na) fails.push({ruta: here, tipo: "no-disponible", msg: "la vista no cargó"});
      if(extra) await extra(r);
    }
  };
  /* una ruta que el modo no muestra lleva al inicio del modo */
  const redirige = async (lista, destino, pre) => {
    for(const r of lista){
      here = pre + r;
      await p.evaluate(h => { location.hash = h; }, "#/" + r);
      await sleep(250);
      const h = await p.evaluate(() => location.hash);
      if(h !== destino) fails.push({ruta: here, tipo: "rol", msg: `debía llevar a ${destino} y quedó en ${h}`});
    }
  };
  await recorrer(rutas(ids));
  /* ventanas principales: se abren llamando a cada módulo y se revisa que no desborden */
  if(!QUICK){
    const MODALES = [
      ["alumno nuevo", "./js/forms.js", "m.studentForm(null)"],
      ["alumno editar", "./js/forms.js", "m.studentForm(S.inAcad('alumnos')[0])"],
      ["pago", "./js/forms.js", "m.paymentModal(S.inAcad('alumnos')[0])"],
      ["pago con atraso", "./js/forms.js", "import('./js/cobros.js').then(C => { const a = S.inAcad('alumnos').find(x => C.deuda(x).cuotas > 1); if(!a) throw new Error('ningún alumno de ejemplo debe 2+ cuotas'); return m.quickPay(a); })"],
      ["promoción", "./js/forms.js", "m.promotionModal(S.inAcad('alumnos')[0], S.inAcad('alumnos')[0].disciplinaIds[0])"],
      ["disciplina", "./js/forms.js", "m.disciplineModal(S.disciplinas()[0])"],
      ["sede", "./js/forms.js", "m.sedeModal(S.sedes()[0])"],
      ["evaluar", "./js/evaluacion.js", "m.evaluarModal(S.inAcad('alumnos').find(a => (a.disciplinaIds || []).some(d => m.claveDe(S.get('disciplinas', d)))), S.disciplinas().find(d => m.claveDe(d)))"],
      ["difusión", "./js/difusion.js", "m.openDifusion()"],
      ["buscador", "./js/palette.js", "m.openPalette('a')"],
      ["prospecto", "./js/views/leads.js", "m.leadForm(null)"],
    ];
    for(const [n, mod, call] of MODALES){
      here = "modal " + n;
      await p.evaluate(() => { location.hash = "#/inicio"; }); await sleep(400); await closeModals(p);
      try{
        await p.evaluate(async ([mod, call]) => { const S = await import("./js/store.js"); const m = await import(mod); await new Function("m", "S", "return " + call)(m, S); }, [mod, call]);
        await sleep(500);
        const st = await p.evaluate(() => ({ov: document.documentElement.scrollWidth - innerWidth, open: !!document.querySelector(".modal-back, .sheet, .pal, [role=dialog]"),
          inner: [...document.querySelectorAll(".modal, .sheet, .modal-back > *")].reduce((m, x) => Math.max(m, x.scrollWidth - x.clientWidth), 0)}));
        if(st.ov > 0) fails.push({ruta: here, tipo: "overflow", msg: `scrollWidth excede ${st.ov}px`});
        if(st.inner > 2) fails.push({ruta: here, tipo: "overflow", msg: `el contenido de la ventana excede ${st.inner}px`});
        if(!st.open) fails.push({ruta: here, tipo: "modal", msg: "no se abrió"});
      }catch(e){ fails.push({ruta: here, tipo: "modal", msg: e.message.slice(0, 200)}); }
      await closeModals(p);
    }
    here = "modal más";
    if(w < 900){ await p.evaluate(() => { location.hash = "#/inicio"; }); await sleep(300); await p.click("#moreBtn"); await sleep(400);
      const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if(ov > 0) fails.push({ruta: here, tipo: "overflow", msg: `scrollWidth excede ${ov}px`}); await closeModals(p); }
  }
  /* ---------- modo profesor: se activa con PIN desde Ajustes ---------- */
  here = "profesor: activar";
  try{
    await closeModals(p);
    await p.evaluate(() => { location.hash = "#/ajustes"; });
    await p.waitForSelector("[data-rol-prof]", {timeout: 8000});
    await p.waitForFunction(() => !document.querySelector(".modal-back"), null, {timeout: 5000}).catch(() => {});
    await sleep(300);
    await p.click("[data-rol-prof]");
    await p.fill("#rolPin1", "2468"); await p.fill("#rolPin2", "2468");
    await p.click(".modal:has(#rolPin1) [data-save]");
    await p.waitForSelector(".app[data-rol=profesor]", {timeout: 12000});
    const PROF = ["inicio", "asistencia", "horario", "alumnos", "grados", "ranking", "entreno", "frases", "ajustes"];
    if(ids.al) PROF.push("alumno/" + ids.al);
    if(ids.galumno && !QUICK) PROF.push(`certificado/${ids.galumno}/${ids.gdisc}`);
    await recorrer(PROF, "profesor: ", async r => {
      if(!/^(inicio|alumnos|alumno\/)/.test(r)) return;
      const n = await p.evaluate(() => document.querySelectorAll("#main [data-pay], #main [data-quick], #main .dash-amt, #main [data-tab=pagos]").length);
      if(n) fails.push({ruta: here, tipo: "rol", msg: `el profesor ve ${n} controles de cobro`});
    });
    const tabs = await p.evaluate(() => [...document.querySelectorAll(".side [data-r], .bottom [data-r]")].map(a => a.dataset.r));
    for(const k of ["pagos", "reportes", "leads", "tienda", "academia"]) if(tabs.includes(k)) fails.push({ruta: "profesor: menú", tipo: "rol", msg: `muestra ${k}`});
    await redirige(QUICK ? ["pagos"] : ["pagos", "reportes", "leads", "tienda", "academia", ...(ids.pago ? ["recibo/" + ids.pago] : [])], "#/inicio", "profesor: ");
    /* formularios del alumno: sin plan ni valor, sin «Eliminar» ni «Registrar primer pago» */
    if(ids.al){
      here = "profesor: editar alumno";
      await p.evaluate(h => { location.hash = h; }, "#/alumno/" + ids.al);
      await p.waitForSelector("#main .pf-edit", {timeout: 8000, state: "attached"}); await sleep(250);
      await p.evaluate(() => document.querySelector("#main .pf-edit").click()); await p.waitForSelector(".modal .student-form", {timeout: 5000});
      const f = await p.evaluate(() => ({valor: !!document.querySelector(".modal [name=valor]"), plan: !!document.querySelector(".modal [name=plan]"), del: !!document.querySelector(".modal [data-del]")}));
      for(const [k, v] of Object.entries(f)) if(v) fails.push({ruta: here, tipo: "rol", msg: `el formulario muestra ${k}`});
      await closeModals(p);
    }
    here = "profesor: nuevo alumno";
    await p.evaluate(() => { location.hash = "#/alumnos?new=1"; });
    await p.waitForSelector(".modal .student-form", {timeout: 8000}).catch(() => {});
    if(await p.$(".modal [data-paynow]")) fails.push({ruta: here, tipo: "rol", msg: "ofrece «Registrar primer pago»"});
    await closeModals(p);
    here = "profesor: ajustes";
    await p.evaluate(() => { location.hash = "#/ajustes"; });
    await p.waitForSelector("[data-rol-salir]", {timeout: 8000});
    if(await p.$("#main [data-connect], #main [data-reconnect], #main [data-wipe], #syncBox [data-sync-cta]")) fails.push({ruta: here, tipo: "rol", msg: "deja conectar Google o borrar datos"});
    here = "profesor: salir";
    await p.evaluate(() => { location.hash = "#/ajustes"; });
    await p.waitForSelector("[data-rol-salir]", {timeout: 8000});
    await p.click("[data-rol-salir]");
    await p.fill("#rolOut", "0000"); await p.click(".modal:has(#rolOut) [data-out]"); await sleep(300);
    if(await p.$(".app[data-rol=dueno]")) fails.push({ruta: here, tipo: "rol", msg: "salió con un PIN equivocado"});
    await p.fill("#rolOut", "2468"); await p.click(".modal:has(#rolOut) [data-out]");
    await p.waitForSelector(".app[data-rol=dueno]", {timeout: 12000});
    /* dueño que oculta su academia para entrenar: no se ofrece borrar el aparato y la copia lleva la academia */
    here = "dueño: solo entrenar";
    await closeModals(p);
    await p.evaluate(() => { location.hash = "#/ajustes"; });
    await p.waitForSelector("[data-rol-est]", {timeout: 8000}); await sleep(250);
    await p.click("[data-rol-est]");
    await p.click(".modal [data-ok]");
    await p.waitForSelector(".app[data-rol=estudiante]", {timeout: 10000});
    await p.evaluate(() => { location.hash = "#/ajustes"; });
    await p.waitForSelector("[data-rol-dueno]", {timeout: 8000});
    if(await p.$("#main [data-wipe]")) fails.push({ruta: here, tipo: "rol", msg: "ofrece borrar el aparato con la academia oculta"});
    const perf = await p.evaluate(async () => { const S = await import("./js/store.js"); return S.get("perfil", "yo")?.rol || ""; });
    if(perf === "estudiante") fails.push({ruta: here, tipo: "rol", msg: "el modo de este aparato pasó a la cuenta (perfil)"});
    await p.click("[data-rol-dueno]");
    await p.waitForSelector(".app[data-rol=dueno]", {timeout: 10000});
  }catch(e){ fails.push({ruta: here, tipo: "rol", msg: e.message.slice(0, 200)}); }

  /* páginas sueltas */
  for(const pg of ["inscripcion.html", "ficha.html"]){
    here = pg;
    await p.goto(BASE + "/" + pg); await sleep(600);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    if(ov > 0) fails.push({ruta: pg, tipo: "overflow", msg: `scrollWidth excede ${ov}px`});
  }
  await ctx.close();
  return fails.concat(await estudiante(browser, {w, scheme, lang}));
}

/* ---------- modo estudiante: aparato nuevo, «Quiero entrenar», sin academia ---------- */
async function estudiante(browser, {w, scheme, lang}){
  const ctx = await browser.newContext({viewport: {width: w, height: w < 600 ? 844 : 900}, colorScheme: scheme, locale: lang === "en" ? "en-US" : "es-CO", serviceWorkers: "block"});
  if(!await serverUp()) await fromDisk(ctx);
  await ctx.addInitScript(l => { try{ localStorage.setItem("mma:lang", l); }catch(e){} }, lang);
  const p = await ctx.newPage();
  const fails = [];
  let here = "estudiante: bienvenida";
  p.on("pageerror", e => fails.push({ruta: here, tipo: "pageerror", msg: String(e.message).slice(0, 300)}));
  p.on("console", m => { if(m.type() === "error") fails.push({ruta: here, tipo: "console", msg: (m.text() + " " + (m.location()?.url || "")).slice(0, 300)}); });
  p.on("requestfailed", r => { if(!/fonts\.(googleapis|gstatic)/.test(r.url())) fails.push({ruta: here, tipo: "request", msg: r.url()}); });
  const ov = async () => { const o = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth); if(o > 0) fails.push({ruta: here, tipo: "overflow", msg: `scrollWidth excede ${o}px`}); };
  try{
    await p.goto(BASE + "/");
    await p.waitForSelector("#wTrain", {timeout: 15000}); await ov();
    await p.click("#wTrain");
    await p.waitForSelector("#wStudent", {timeout: 5000}); await ov();
    await p.fill("#wName", "Juan");
    await p.click("label.chip:has(input[value=muaythai])");
    await p.click("#wStudent");
    await p.waitForSelector(".app[data-rol=estudiante]", {timeout: 10000});
    if(await p.evaluate(() => location.hash) !== "#/entreno") fails.push({ruta: here, tipo: "rol", msg: "no entró a #/entreno"});
    if(await p.$(".modal-back")) fails.push({ruta: here, tipo: "rol", msg: "abrió una ventana (crear academia)"});
  }catch(e){ fails.push({ruta: here, tipo: "setup", msg: e.message.slice(0, 300)}); await ctx.close(); return fails; }
  const R = ["entreno", "entreno/stats", "entreno/repaso", "entreno/diario", "entreno/glosario", "entreno/logros", "entreno/curriculo", "entreno/bjj", "frases", "ajustes"];
  for(const r of QUICK ? R.filter(x => !x.includes("/")) : R){
    here = "estudiante: " + r;
    await p.evaluate(h => { location.hash = h; }, "#/" + r);
    try{ await p.waitForFunction(() => { const m = document.querySelector("#main"); return m && (m.innerText || "").trim() && !m.querySelector(".view-load, .en-skel"); }, null, {timeout: 10000}); }catch(e){}
    await sleep(300);
    const st = await p.evaluate(() => { const m = document.querySelector("#main"); return {txt: (m?.innerText || "").trim().length, na: !!m?.querySelector("[data-retry]")}; });
    await ov();
    if(!st.txt) fails.push({ruta: here, tipo: "vacio", msg: "#main vacío"});
    if(st.na) fails.push({ruta: here, tipo: "no-disponible", msg: "la vista no cargó"});
  }
  /* Progreso es raíz de pestaña: sin «atrás» en la barra ni en la vista */
  here = "estudiante: progreso";
  await p.evaluate(() => { location.hash = "#/entreno/stats"; }); await sleep(QUICK ? 600 : 1200);
  const back = await p.evaluate(() => { const vis = el => !!el && !el.hidden && el.getClientRects().length > 0; return vis(document.querySelector("#navBack")) || [...document.querySelectorAll("#main .back")].some(vis); });
  if(back) fails.push({ruta: here, tipo: "rol", msg: "muestra «atrás» en una raíz de pestaña"});
  here = "estudiante: rutina";
  await p.evaluate(() => { location.hash = "#/entreno"; });
  try{
    await p.waitForSelector("#main [data-rutina]", {timeout: 8000}); await sleep(200);
    await p.click("#main [data-rutina]"); await p.waitForSelector(".modal [name=artes]", {timeout: 5000});
    const ar = await p.evaluate(() => [...document.querySelectorAll(".modal [name=artes]:checked")].map(x => x.value));
    if(ar.join() !== "muaythai") fails.push({ruta: here, tipo: "rol", msg: `la rutina nueva no trae las artes elegidas (${ar.join() || "ninguna"})`});
    await closeModals(p);
  }catch(e){ fails.push({ruta: here, tipo: "rol", msg: e.message.slice(0, 200)}); }
  here = "estudiante: menú";
  const tabs = await p.evaluate(() => [...document.querySelectorAll(".side [data-r], .bottom [data-r]")].map(a => a.dataset.r));
  for(const k of tabs) if(!/^(entreno|frases|ajustes)/.test(k)) fails.push({ruta: here, tipo: "rol", msg: `muestra ${k}`});
  if(await p.$("#sedeSel")) fails.push({ruta: here, tipo: "rol", msg: "muestra el selector de sede"});
  for(const r of QUICK ? ["pagos"] : ["inicio", "pagos", "alumnos", "alumno/x", "asistencia", "academia", "kiosko", "reportes", "recibo/x"]){
    here = "estudiante: " + r;
    await p.evaluate(h => { location.hash = h; }, "#/" + r);
    await sleep(250);
    const h = await p.evaluate(() => location.hash);
    if(h !== "#/entreno") fails.push({ruta: here, tipo: "rol", msg: `debía llevar a #/entreno y quedó en ${h}`});
  }
  if(w < 900){ here = "estudiante: más"; await p.click("#moreBtn"); await sleep(400); await ov(); await p.keyboard.press("Escape"); await sleep(300); }
  here = "estudiante: buscador";
  await p.evaluate(async () => { const m = await import("./js/palette.js"); m.openPalette("pag"); });
  await sleep(500);
  const pal = await p.evaluate(() => [...document.querySelectorAll(".pal-it")].map(b => b.textContent));
  if(!await p.$(".pal")) fails.push({ruta: here, tipo: "rol", msg: "el buscador no abrió"});
  if(pal.some(x => /Pagos|Payments/.test(x))) fails.push({ruta: here, tipo: "rol", msg: "el buscador ofrece Pagos"});
  await p.keyboard.press("Escape"); await sleep(200);
  await p.evaluate(async () => { const m = await import("./js/palette.js"); m.openPalette(""); });
  await sleep(400);
  const ir = await p.evaluate(() => [...document.querySelectorAll(".pal-it")].map(b => b.textContent).join("|"));
  if(!/Progreso|Progress/.test(ir) || !/Glosario|Glossary/.test(ir)) fails.push({ruta: here, tipo: "rol", msg: "«Ir a» no ofrece las secciones del estudiante"});
  await ctx.close();
  return fails;
}

/* sw.js: cada archivo de SHELL existe y todo .js/.css de js/ y css/ está en SHELL (si no, no funciona sin internet) */
function checkSW(){
  const src = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
  const SHELL = new Function(src.slice(src.indexOf("const SHELL"), src.indexOf("];", src.indexOf("const SHELL")) + 2) + "; return SHELL;")();
  const out = [];
  for(const f of SHELL) if(f !== "./" && !fs.existsSync(path.join(ROOT, f))) out.push({ruta: "sw.js", tipo: "sw-falta", msg: f});
  const walk = d => fs.readdirSync(path.join(ROOT, d), {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(d + "/" + e.name) : [d + "/" + e.name]);
  for(const f of [...walk("js"), ...walk("css")]) if(/\.(js|css)$/.test(f) && !SHELL.includes(f)) out.push({ruta: "sw.js", tipo: "sw-sin-listar", msg: f});
  return out;
}
if(process.argv.includes("--sw")){
  const f = checkSW();
  for(const x of f) console.log(`✗ ${x.tipo}: ${x.msg}`);
  console.log(f.length ? `${f.length} problemas en sw.js` : "sw.js: SHELL coincide con los archivos");
  process.exit(f.length ? 1 : 0);
}

const combos = [];
for(const w of [390, 1366]) for(const scheme of ["light", "dark"]) for(const lang of ["es", "en"]) combos.push({w, scheme, lang});
const sel = combos.filter(c => !ONLY || String(c.w) === ONLY || c.lang === ONLY || c.scheme === ONLY).filter((c, i) => !QUICK || i % 3 === 0);
const browser = await chromium.launch();
const t0 = Date.now();
const res = await Promise.all(sel.map(c => combo(browser, c).then(f => ({c, f}))));
await browser.close();
const sw = checkSW();
res.push({c: {w: "-", scheme: "-", lang: "-"}, f: sw});
let total = 0;
const agrupado = {};
for(const {c, f} of res){
  total += f.length;
  for(const x of f){ const k = `${x.tipo} · ${x.ruta} · ${x.msg}`.replace(/\b[a-z0-9]{12,16}\b/g, ":id"); (agrupado[k] = agrupado[k] || []).push(`${c.w}/${c.scheme}/${c.lang}`); }
}
for(const [k, v] of Object.entries(agrupado)) console.log(`✗ ${k}\n    en: ${v.join(", ")}`);
console.log(`\n${sel.length} combinaciones, ${Object.keys(agrupado).length} fallas distintas (${total} en total), ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(total ? 1 : 0);
