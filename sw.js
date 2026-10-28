/* Funciona sin internet: la app se guarda en caché. Primero la red (siempre la última versión) y, sin conexión, la
   caché. Los datos del usuario no pasan por aquí (están en localStorage/IndexedDB y en su Google Drive).
   Al cambiar archivos, subir VERSION. */
const VERSION = 3;
const CACHE = "mma-v" + VERSION;
const SHELL = ["./", "index.html", "privacy.html", "manifest.webmanifest", "css/app.css", "icons/icon.svg", "icons/icon-192.png",
  "js/app.js", "js/util.js", "js/catalog.js", "js/store.js", "js/sync.js", "js/config.js", "js/ui.js", "js/forms.js", "js/demo.js",
  "js/views/dashboard.js", "js/views/alumnos.js", "js/views/alumno.js", "js/views/pagos.js", "js/views/grados.js", "js/views/ranking.js",
  "js/views/asistencia.js", "js/views/tienda.js", "js/views/academia.js", "js/views/ajustes.js",
  "js/i18n.js", "js/i18n/en-academia.js", "js/i18n/en-ajustes.js", "js/i18n/en-alumno.js", "js/i18n/en-alumnos.js", "js/i18n/en-app.js", "js/i18n/en-asistencia.js", "js/i18n/en-catalog.js", "js/i18n/en-dashboard.js", "js/i18n/en-forms.js", "js/i18n/en-grados.js", "js/i18n/en-pagos.js", "js/i18n/en-ranking.js", "js/i18n/en-store.js", "js/i18n/en-sync.js", "js/i18n/en-tienda.js", "js/i18n/en-ui.js", "js/i18n/en-util.js"];

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
