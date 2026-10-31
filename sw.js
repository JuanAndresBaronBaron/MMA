/* Funciona sin internet: la app se guarda en caché. Primero la red (siempre la última versión) y, sin conexión, la
   caché. Los datos del usuario no pasan por aquí (están en localStorage/IndexedDB y en su Google Drive).
   Al cambiar archivos, subir VERSION. */
const VERSION = 9;
const CACHE = "mma-v" + VERSION;
const SHELL = ["./", "index.html", "privacy.html", "inscripcion.html", "ficha.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-192-maskable.png", "icons/icon-512-maskable.png", "icons/sc-alumno.png", "icons/sc-lista.png", "icons/sc-horario.png",
  "css/app.css", "css/entreno.css", "css/dash.css", "css/tracking.css", "css/students.css",
  "css/clases.css", "css/leads.css", "css/recibo.css", "css/reportes.css", "css/grados.css", "css/certificado.css", "css/ficha.css", "css/inscripcion.css", "css/frases.css",
  "js/app.js", "js/shell.js", "js/cobros.js", "js/util.js", "js/catalog.js", "js/store.js", "js/sync.js", "js/config.js", "js/ui.js", "js/forms.js", "js/demo.js",
  "js/palette.js", "js/install.js", "js/clases.js", "js/qr.js", "js/retencion.js", "js/difusion.js", "js/evaluacion.js", "js/ficha-link.js", "js/ics.js",
  "js/pages/ficha.js", "js/pages/inscripcion.js",
  "js/views/dashboard.js", "js/views/alumnos.js", "js/views/alumno.js", "js/views/pagos.js", "js/views/grados.js", "js/views/ranking.js",
  "js/views/asistencia.js", "js/views/tienda.js", "js/views/academia.js", "js/views/ajustes.js", "js/views/entreno.js",
  "js/views/horario.js", "js/views/kiosko.js", "js/views/leads.js", "js/views/reportes.js", "js/views/recibo.js", "js/views/certificado.js", "js/views/frases.js", "js/frases/data.js",
  "js/entreno/index.js", "js/entreno/timer.js", "js/entreno/bjj.js", "js/entreno/muaythai.js", "js/entreno/lucha.js", "js/entreno/mma.js", "js/entreno/boxeo.js",
  "js/entreno/stats.js", "js/entreno/logros.js", "js/entreno/repaso.js", "js/entreno/diario.js", "js/entreno/boxeo-fund.js", "js/entreno/salud.js", "js/entreno/fisico.js",
  "js/entreno/kids.js", "js/entreno/defensa.js", "js/entreno/glosario.js", "js/entreno/semana.js", "js/entreno/curriculos.js",
  "philly/index.html", "philly/philly.css", "philly/philly.js", "philly/data.js",
  "js/i18n.js", ...["app", "ui", "util", "store", "sync", "forms", "catalog", "dashboard", "alumnos", "alumno", "pagos", "grados", "ranking", "asistencia", "tienda", "academia", "ajustes", "entreno",
    "clases", "leads", "inscripcion", "recibo", "reportes", "certificado", "evaluacion", "ficha", "palette", "frases"].map(n => `js/i18n/en-${n}.js`)];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, {cache: "reload"})).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("mma-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if(e.request.method !== "GET" || url.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    try{
      const r = await fetch(e.request, {cache: "no-cache"});
      if(r.ok) c.put(url.origin + url.pathname, r.clone());
      return r;
    }catch(err){
      return (await c.match(url.origin + url.pathname)) || (await c.match("index.html")) || Response.error();
    }
  })());
});
