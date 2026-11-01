/* Lectura en voz alta con las voces del propio navegador (Web Speech API, speechSynthesis): sin servicios externos,
   gratis y sin internet cuando la voz es local.
   - Elige la mejor voz del idioma: en español es-CO, es-MX, es-US o es-419, luego es-ES y luego cualquier es; en inglés
     en-US, luego en-GB. Entre ellas prefiere las naturales, mejoradas, de Google, Microsoft Online (Natural) o Siri.
   - Lee por bloques (cada uno atado a un elemento que se resalta con .voz-on mientras suena) y parte cada bloque en
     frases de 200 caracteres o menos: así Chrome no corta los textos largos ni se queda mudo a los ~15 s.
   - Pausar cancela y Seguir vuelve a empezar la frase en curso: funciona igual en Chrome, Safari y Android.
   - No importa nada de la app, así lo usa también philly/. La app le pasa t(), pref(), setPref(), haptic() y toast()
     con configure(); sin eso, habla en español y guarda la velocidad en localStorage.
   API: speak(bloques | texto, {title, id, start}), pause(), resume(), toggle(), stop(), next(), prev(), setRate(r),
   listenBtn(id, label, opts), bind(raíz, resolver), soportado(), vozPara(lang), voces(lang), whenVoices().
   Funciones puras para pruebas: limpiar(texto, lang), trocear(texto, max), puntuar(voz, lang), elegirVoz(voces, lang). */

const W = typeof window !== "undefined" ? window : null;
const synth = W && W.speechSynthesis;
export const RATES = [0.8, 1, 1.25, 1.5];
const MAX = 200;

/* ---------- configuración inyectable ---------- */
const fill = (s, v) => (v ? String(s).replace(/\{(\w+)\}/g, (m, k) => (k in v ? v[k] : m)) : s);
let t = (s, v) => fill(s, v);
const LS = "voz:prefs";
const lsPrefs = () => { try{ return JSON.parse(localStorage.getItem(LS) || "{}") || {}; }catch(e){ return {}; } };
const cfg = {
  pref: (k, d) => { const p = lsPrefs(); return k in p ? p[k] : d; },
  setPref: (k, v) => { try{ const p = lsPrefs(); p[k] = v; localStorage.setItem(LS, JSON.stringify(p)); }catch(e){} },
  haptic: kind => { try{ if(navigator.vibrate && matchMedia("(pointer:coarse)").matches && navigator.userActivation?.hasBeenActive) navigator.vibrate(kind === "medium" ? 14 : 8); }catch(e){} },
  toast: null,
  lang: () => ((W && document.documentElement.lang) || "es").slice(0, 2).toLowerCase(),
  stopOnHash: true,   // la app cambia de pantalla con el hash; philly usa el hash para saltar a una sección
};
export function configure(o = {}){
  if(o.t) t = o.t;
  for(const k of ["pref", "setPref", "haptic", "toast", "lang"]) if(typeof o[k] === "function") cfg[k] = o[k];
  if("stopOnHash" in o) cfg.stopOnHash = !!o.stopOnHash;
  refreshSupport();
}
const uiLang = () => (cfg.lang() === "en" ? "en" : "es");

/* ---------- texto: limpiar y trocear (puras, se prueban con node) ---------- */
const ABR = {
  es: [[/\bp\.\s?ej\./gi, "por ejemplo"], [/\bvs\.?(?=\s)/gi, "contra"], [/\betc\./gi, "etcétera"], [/\baprox\./gi, "aproximadamente"],
    [/\bmáx\./gi, "máximo"], [/\bmín\./gi, "mínimo"], [/\bnúm\./gi, "número"], [/\bpág\./gi, "página"], [/\bej\./gi, "ejemplo"], [/\bSr\./g, "señor"], [/\bSra\./g, "señora"], [/\bDr\./g, "doctor"]],
  en: [[/\be\.g\./gi, "for example"], [/\bi\.e\./gi, "that is"], [/\bvs\.?(?=\s)/gi, "versus"], [/\betc\./gi, "et cetera"], [/\bapprox\./gi, "approximately"],
    [/\bmax\./gi, "maximum"], [/\bmin\.(?=\s+[a-z])/g, "minimum"], [/\bMr\./g, "mister"], [/\bDr\./g, "doctor"], [/\bNo\.(?=\s*\d)/g, "number"]],
};
const UNID = {
  es: {min: ["minuto", "minutos"], seg: ["segundo", "segundos"], s: ["segundo", "segundos"], h: ["hora", "horas"], km: ["kilómetro", "kilómetros"], kg: ["kilo", "kilos"], m: ["metro", "metros"], x: "por", a: "a"},
  en: {min: ["minute", "minutes"], seg: ["second", "seconds"], s: ["second", "seconds"], h: ["hour", "hours"], km: ["kilometer", "kilometers"], kg: ["kilo", "kilos"], m: ["meter", "meters"], x: "by", a: "to"},
};
/* números unidos por guiones: 1-2-3 es una combinación de golpes (se lee como lista), 2026-10-31 una fecha (se deja),
   y un par como 10-9, 30-40% o 6-8 repeticiones es un rango o un marcador («10 a 9»). Un par de un dígito sin unidad
   detrás ni «x» delante (la 1-2) también es combinación. */
const UNIDAD_TRAS = /^\s?(%|min|seg|s|h|km|kg|m|rondas?|rounds?|veces|times|reps?|repeticiones|series|sets?|semanas?|weeks?|d[ií]as?|days?|años?|years?|kilos?|minutos?|minutes?|segundos?|seconds?)(?![\p{L}\p{N}])/iu;
function guiones(m, antes, despues, U){
  const p = m.split("-");
  if(p.length === 3 && p[0].length === 4 && p[1].length <= 2 && p[2].length <= 2) return m;
  if(p.length > 2) return p.join(", ");
  if(p[0].length === 1 && p[1].length === 1 && !/[x×]\s?$/i.test(antes) && !UNIDAD_TRAS.test(despues)) return p.join(", ");
  return `${p[0]} ${U.a} ${p[1]}`;
}
export function limpiar(s, lang = "es"){
  const L = lang === "en" ? "en" : "es", U = UNID[L];
  let x = String(s ?? "");
  x = x.replace(/<[^>]+>/g, " ")                                   // etiquetas sueltas
    .replace(/\bhttps?:\/\/\S+|\bwww\.\S+/gi, " ")                  // enlaces
    .replace(/[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3]/gu, "")   // emoji
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")                         // [texto](enlace)
    .replace(/[*_#`~|^=\\{}[\]<>]+/g, " ")                           // símbolos de markdown
    .replace(/[→←↑↓⌄▶►◀♪◎•·✓✔✗✘★☆]+/g, ", ")                        // flechas y viñetas: una pausa
    .replace(/(\d)\s*–\s*(\d)|(\d)\s+[-—]\s+(\d)/g, (m, a, b, c, d) => `${a ?? c} ${U.a} ${b ?? d}`)   // 60–75 min, 3 - 5
    .replace(/\d+(?:-\d+)+/g, (m, off, str) => guiones(m, str.slice(Math.max(0, off - 2), off), str.slice(off + m.length), U))
    .replace(/(\d)\s*[×x]\s*(\d)/g, `$1 ${U.x} $2`)                  // 3 × 2 min
    .replace(/\s+[–—]\s+/g, ", ");
  for(const [re, w] of ABR[L]) x = x.replace(re, w);
  /* unidades tras un número: 1 min → 1 minuto, 30 s → 30 segundos */
  x = x.replace(/(\d+(?:[.,]\d+)?)\s?(min|seg|km|kg|h|s|m)(?![\p{L}\p{N}_'’])/gu, (m, n, u) => { const w = U[u]; return w ? `${n} ${n === "1" ? w[0] : w[1]}` : m; });
  return x.replace(/\s+([,.;:!?])/g, "$1").replace(/([,;:])(?:\s*[,;:])+/g, "$1").replace(/^[\s,;:]+|[\s,;:]+$/g, "").replace(/\s+/g, " ").trim();
}
/* frases de `max` caracteres o menos: corta en el fin de frase, luego en comas y por último entre palabras.
   Une frases cortas seguidas para que la voz no haga pausas de más. */
/* corta tras el signo que captura `re` y lo deja pegado al trozo (sin lookbehind: Safari < 16.4 no lo entiende) */
function partir(s, re){
  const xs = s.split(re), out = [];
  for(let i = 0; i < xs.length; i += 2) out.push(xs[i] + (xs[i + 1] || ""));
  return out.filter(Boolean);
}
export function trocear(text, max = MAX){
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if(!s) return [];
  const piezas = [];
  for(const fr of partir(s, /([.!?…;:]["”’»)]*)\s+/)){
    if(fr.length <= max){ piezas.push(fr); continue; }
    for(const co of partir(fr, /([,;])\s+/)){
      if(co.length <= max){ piezas.push(co); continue; }
      let cur = "";
      for(const w of co.split(" ")){
        if(w.length > max){ if(cur) piezas.push(cur); for(let i = 0; i < w.length; i += max) piezas.push(w.slice(i, i + max)); cur = ""; continue; }
        if(cur && cur.length + 1 + w.length > max){ piezas.push(cur); cur = w; } else cur = cur ? cur + " " + w : w;
      }
      if(cur) piezas.push(cur);
    }
  }
  const out = [];
  for(const p of piezas){
    const last = out[out.length - 1];
    if(last && last.length + 1 + p.length <= max && /[.!?…;:,]["”’»)]*$/.test(last)) out[out.length - 1] = last + " " + p;
    else out.push(p);
  }
  return out.filter(x => /[\p{L}\p{N}]/u.test(x));
}

/* ---------- voces ---------- */
const REG = {es: ["es-CO", "es-MX", "es-US", "es-419"], en: ["en-US"]};
const SEG = {es: ["es-ES"], en: ["en-GB"]};
const TAG = {es: "es-CO", en: "en-US"};
const normTag = l => String(l || "").replace(/_/g, "-").replace(/^([a-z]+)-([a-z0-9]+)/i, (m, a, b) => a.toLowerCase() + "-" + (b.length === 2 ? b.toUpperCase() : b));
const NOVEDAD = /\b(compact|eloquence|espeak|novelty|bad news|good news|bells|bahh|boing|bubbles|cellos|whisper|zarvox|trinoids|organ|jester|superstar|wobble|albert|fred|junior|ralph|kathy|hysterical|deranged|grandma|grandpa|rocko|shelley|flo|reed|sandy|eddy)\b/i;
/* puntaje de una voz para un idioma (-1: no sirve) */
export function puntuar(v, lang){
  const tag = normTag(v?.lang), base = tag.split("-")[0];
  if(base !== lang) return -1;
  const n = String(v.name || "");
  let s = 10;
  const ri = REG[lang].indexOf(tag);
  if(ri >= 0) s += 30 - ri * 2; else if(SEG[lang].includes(tag)) s += 16;
  if(/natural|neural/i.test(n)) s += 25;
  if(/enhanced|premium|mejorad|alta calidad/i.test(n)) s += 20;
  if(/microsoft.*online/i.test(n)) s += 18;
  if(/siri/i.test(n)) s += 15;
  if(/google/i.test(n)) s += 12;
  if(NOVEDAD.test(n)) s -= 40;
  if(v.default) s += 3;
  if(v.localService) s += 2;
  return s;
}
export function elegirVoz(list, lang, uri){
  const xs = (list || []).filter(v => puntuar(v, lang) >= 0);
  if(uri){ const f = xs.find(v => v.voiceURI === uri || v.name === uri); if(f) return f; }
  return xs.sort((a, b) => puntuar(b, lang) - puntuar(a, lang))[0] || null;
}

let voiceList = [], loaded = false;
const waiters = new Set();
function loadVoices(){
  try{ voiceList = (synth && synth.getVoices()) || []; }catch(e){ voiceList = []; }
  if(voiceList.length){ loaded = true; for(const f of waiters) f(); waiters.clear(); }
  refreshSupport();
}
/* espera la lista de voces (llega tarde en Chrome); con la lista vacía, se rinde a los `ms` */
export function whenVoices(ms = 1500){
  if(!synth) return Promise.resolve([]);
  loadVoices();
  if(voiceList.length) return Promise.resolve(voiceList);
  return new Promise(res => { const f = () => { clearTimeout(tm); waiters.delete(f); res(voiceList); }; const tm = setTimeout(f, ms); waiters.add(f); });
}
export const soportado = () => !!(synth && W.SpeechSynthesisUtterance);
export const voces = lang => voiceList.filter(v => puntuar(v, lang) >= 0).sort((a, b) => puntuar(b, lang) - puntuar(a, lang));
export const vozPara = (lang = uiLang()) => elegirVoz(voiceList, lang, cfg.pref("vozUri:" + lang, ""));
export const setVoz = (lang, uri) => cfg.setPref("vozUri:" + lang, uri || "");
/* idiomas en que puede sonar la app: en inglés, buena parte del contenido (caminos, glosario, frases sin traducción)
   se lee en español, así que basta con una de las dos voces para mostrar los botones */
export const idiomasLectura = () => (uiLang() === "en" ? ["en", "es"] : ["es"]);
/* sin ninguna voz útil (con la lista ya cargada): los botones se esconden */
function refreshSupport(){
  if(!W) return;
  const no = !soportado() || (loaded && !idiomasLectura().some(L => voces(L).length));
  document.documentElement.classList.toggle("voz-no", no);
}
if(synth){
  loadVoices();
  try{ if(synth.addEventListener) synth.addEventListener("voiceschanged", loadVoices); else synth.onvoiceschanged = loadVoices; }catch(e){}
}
if(W && !synth) document.documentElement.classList.add("voz-no");

/* ---------- velocidad ---------- */
export const rate = () => { const r = +cfg.pref("vozRate", 1); return RATES.includes(r) ? r : 1; };
export function setRate(r){
  if(!RATES.includes(+r)) return;
  cfg.setPref("vozRate", +r);
  if(W) for(const i of document.querySelectorAll("input[name=vozrate]")) i.checked = +i.value === +r;   // Ajustes, si está abierto
  paint();
  if(S.on && !S.paused) play();
}
export const rateTxt = r => String(r).replace(".", uiLang() === "es" ? "," : ".") + "×";

/* ---------- cola ---------- */
const S = {q: [], bi: 0, ci: 0, on: false, paused: false, id: null, title: "", gen: 0, started: false, el: null, follow: true, tries: 0, errs: 0};
let utter = null, failTimer = 0, stallTimer = 0, keepAlive = 0;
const android = () => /Android/i.test(W?.navigator?.userAgent || "");
const reduced = () => { try{ return matchMedia("(prefers-reduced-motion: reduce)").matches; }catch(e){ return false; } };

/* bloques: texto, [texto…] o [{text | parts: [{text, lang}], lang, el}] */
function armar(input){
  const arr = Array.isArray(input) ? input : [input];
  return arr.map(b => {
    if(b == null) return null;
    if(typeof b === "string") b = {text: b};
    const parts = b.parts || [{text: b.text, lang: b.lang}];
    const chunks = parts.flatMap(p => { const L = p.lang || b.lang || uiLang(); return trocear(limpiar(p.text, L)).map(text => ({text, lang: L})); });
    return chunks.length ? {chunks, el: b.el || null, k: b.el?.dataset?.vozK || b.k || null} : null;
  }).filter(Boolean);
}
export function speak(input, {title = "", id = null, start = 0} = {}){
  if(!soportado()) return aviso(t("Este navegador no puede leer en voz alta."));
  if(synth && !voiceList.length) loadVoices();
  const q = armar(input);
  if(!q.length) return false;
  const bi = Math.max(0, Math.min(start, q.length - 1));
  /* cada trozo puede ir en otro idioma (en inglés, el contenido de los caminos va en español): todos deben tener voz */
  if(loaded){ const falta = [...new Set(q.slice(bi).flatMap(b => b.chunks.map(c => c.lang)))].find(L => !voces(L).length); if(falta) return aviso(sinVoz(falta)); }
  stop(true);
  Object.assign(S, {q, bi, ci: 0, on: true, paused: false, id, title, started: false, follow: true, tries: 0, errs: 0});
  cfg.haptic("light");
  mount();
  play();
  return true;
}
const sinVoz = L => L === "en" ? t("Este aparato no tiene una voz en inglés para leer en voz alta.") : t("Este aparato no tiene una voz en español para leer en voz alta.");
function aviso(msg){
  if(cfg.toast) cfg.toast(msg, "warn");
  else if(W){
    let el = document.querySelector(".voz-aviso");
    if(!el){ el = document.createElement("div"); el.className = "voz-aviso"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add("in");
    clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove("in"), 3600);
  }
  return false;
}
/* mensaje para cada error del motor de voz */
function msgError(er, L){
  if(er === "not-allowed") return t("Toca Escuchar otra vez para empezar la lectura.");
  if(er === "network") return t("Esta voz necesita internet. Revisa la conexión o elige otra voz en Ajustes.");
  if(er === "audio-busy" || er === "audio-hardware") return t("El audio del aparato está ocupado. Cierra el otro sonido y toca Escuchar otra vez.");
  if(er === "language-unavailable" || er === "voice-unavailable" || er === "synthesis-unavailable") return sinVoz(L);
  return t("No se pudo leer en voz alta en este aparato.");
}
/* tiempo máximo razonable para un trozo: ~9 caracteres por segundo a velocidad 1, con margen */
const plazo = txt => 6000 + (txt.length * 1000) / (9 * rate());
function play(){
  const g = ++S.gen;
  clearTimeout(failTimer); clearTimeout(stallTimer);
  const b = S.q[S.bi], c = b && b.chunks[S.ci];
  if(!c) return finish();
  try{
    if(synth.speaking || synth.pending) synth.cancel();
    if(synth.paused) synth.resume();
    const u = new W.SpeechSynthesisUtterance(c.text);
    const v = vozPara(c.lang);
    /* con la lista ya cargada y sin voz para este idioma, no se lee con la voz de otro idioma */
    if(!v && loaded){ stop(); aviso(sinVoz(c.lang)); return; }
    u.lang = v ? v.lang : TAG[c.lang] || c.lang;
    if(v) u.voice = v;
    u.rate = rate(); u.pitch = 1; u.volume = 1;
    u.onstart = () => { if(g === S.gen){ S.started = true; clearTimeout(failTimer); } };
    u.onend = () => { if(g === S.gen){ S.tries = 0; S.errs = 0; advance(); } };
    u.onerror = e => {
      if(g !== S.gen) return;
      const er = e && e.error;
      if(er === "interrupted" || er === "canceled") return;
      clearTimeout(failTimer); clearTimeout(stallTimer);
      /* un fallo pasajero del motor: se reintenta el trozo una vez antes de avisar */
      if((er === "synthesis-failed" || er === "audio-busy" || !er) && S.tries < 1){ S.tries++; setTimeout(() => { if(g === S.gen && S.on && !S.paused) play(); }, 350); return; }
      if(!S.started || er === "network" || er === "not-allowed" || ++S.errs >= 2){ stop(); aviso(msgError(er, c.lang)); return; }
      S.tries = 0; advance();
    };
    utter = u;   // referencia viva: Chrome a veces suelta el objeto y nunca llama a onend
    highlight(b);
    synth.speak(u);
    /* nada empezó: el aparato no tiene voz para el idioma o el navegador la bloqueó */
    if(!S.started) failTimer = setTimeout(() => { if(g === S.gen && !S.started && !synth.speaking && !synth.pending){ stop(); aviso(loaded ? t("No se pudo leer en voz alta en este aparato.") : sinVoz(c.lang)); } }, 5000);
    /* trozo trabado: el motor lo aceptó pero nunca terminó (paquete de voz sin bajar, onend perdido, voz de red caída) */
    const vigilar = () => {
      if(g !== S.gen || !S.on || S.paused) return;
      if(document.hidden){ stallTimer = setTimeout(vigilar, 4000); return; }   // en segundo plano los tiempos no son fiables
      if(S.tries < 1){ S.tries++; play(); return; }
      stop(); aviso(t("La lectura se trabó en este aparato. Toca Escuchar para intentar otra vez."));
    };
    stallTimer = setTimeout(vigilar, plazo(c.text));
  }catch(e){ stop(); aviso(t("No se pudo leer en voz alta en este aparato.")); return; }
  startKeepAlive();
  paint();
}
function advance(){
  const b = S.q[S.bi];
  if(b && S.ci < b.chunks.length - 1){ S.ci++; return play(); }
  S.bi++; S.ci = 0;
  if(S.bi >= S.q.length) return finish();
  play();
}
function finish(){ cfg.haptic("light"); stop(); }
/* Chrome de escritorio con voces de red: se calla a los ~15 s si nadie lo «despierta» */
function startKeepAlive(){
  clearInterval(keepAlive);
  if(android()) return;
  keepAlive = setInterval(() => {
    if(!S.on || S.paused){ clearInterval(keepAlive); return; }
    /* también sin voz explícita (lista aún sin cargar): Chrome elige por u.lang, a menudo una voz de red */
    try{ if(synth.speaking && !synth.paused && (!utter?.voice || utter.voice.localService === false)){ synth.pause(); synth.resume(); } }catch(e){}
  }, 10000);
}
export function pause(){
  if(!S.on || S.paused) return;
  S.paused = true; S.gen++;
  clearTimeout(failTimer); clearTimeout(stallTimer); clearInterval(keepAlive);
  try{ synth.cancel(); }catch(e){}
  cfg.haptic("light");
  paint();
}
export function resume(){
  if(!S.on || !S.paused) return;
  S.paused = false; S.follow = true; S.tries = 0; cfg.haptic("light");
  play();
}
export const toggle = () => (S.paused ? resume() : pause());
export function next(){ if(!S.on) return; if(S.bi < S.q.length - 1){ S.bi++; S.ci = 0; S.paused = false; S.follow = true; S.tries = 0; cfg.haptic("selection"); play(); } }
export function prev(){
  if(!S.on) return;
  if(S.ci === 0 && S.bi > 0) S.bi--;
  S.ci = 0; S.paused = false; S.follow = true; S.tries = 0; cfg.haptic("selection"); play();
}
export function stop(silent){
  const was = S.on, id0 = S.id;
  S.gen++; S.on = false; S.paused = false;
  clearTimeout(failTimer); clearTimeout(stallTimer); clearInterval(keepAlive);
  try{ if(synth && (synth.speaking || synth.pending || synth.paused)) synth.cancel(); }catch(e){}
  utter = null;
  highlight(null);
  if(!silent || !was) S.id = null;
  if(!silent){ S.q = []; unmount(id0); }
  paint();
}
export const estado = () => ({on: S.on, paused: S.paused, id: S.id, title: S.title, bloque: S.bi, total: S.q.length, rate: rate()});
/* idle | play | pause para el botón con ese id */
const estadoDe = id => (S.on && id != null && S.id === id ? (S.paused ? "pause" : "play") : "idle");

/* ---------- resaltado ---------- */
function elDe(b){
  if(!b) return null;
  if(b.el && b.el.isConnected) return b.el;
  if(b.k){ try{ const x = document.querySelector(`[data-voz-k="${CSS.escape(b.k)}"]`); if(x){ b.el = x; return x; } }catch(e){} }
  return null;
}
/* borde inferior de lo que queda pegado arriba (barra de la app, índices de sección, buscador del glosario) */
const PEGADOS = ".top, .en-anchors, .en-glo-top, .toc";
function topLibre(){
  let y = 0;
  for(const x of document.querySelectorAll(PEGADOS)){
    const cs = getComputedStyle(x); if(cs.position !== "sticky" && cs.position !== "fixed") continue;
    const r = x.getBoundingClientRect(), b = cs.position === "fixed" ? r.bottom : (parseFloat(cs.top) || 0) + r.height;   // pegado: donde quedará al desplazar
    if(r.height && b < innerHeight / 2) y = Math.max(y, b);
  }
  return y;
}
function highlight(b){
  if(!W) return;
  if(S.el && S.el !== elDe(b)) S.el.classList.remove("voz-on");
  const el = elDe(b);
  S.el = el;
  if(!el) return;
  el.classList.add("voz-on");
  const d = el.closest("details"); if(d && !d.open) d.open = true;
  if(el.tagName === "DETAILS") el.open = true;
  /* si la persona se fue a otra parte (índice, rueda, dedo), no se la devuelve a la fuerza */
  if(!S.follow) return;
  const beh = reduced() ? "auto" : "smooth";
  let r = el.getBoundingClientRect();
  /* dentro de una lista con su propio scroll (favoritas): primero se mueve la lista */
  const sc = scroller(el);
  if(sc){
    const pr = sc.getBoundingClientRect();
    if(r.top < pr.top + 8 || r.bottom > pr.bottom - 8){
      const d = r.top - pr.top - Math.max(8, (pr.height - r.height) * .3);
      sc.scrollTo({top: sc.scrollTop + d, behavior: beh});
      r = {top: r.top - d, bottom: r.bottom - d, height: r.height};
    }
  }
  /* que quede a la vista sin tapar la barra de arriba ni el reproductor */
  const top = topLibre() + 12;
  const bottom = innerHeight - (player?.offsetHeight || 0) - (player ? parseFloat(getComputedStyle(player).bottom) || 0 : 0) - 16;
  if(r.top >= top && r.bottom <= bottom) return;
  if(r.top >= top && r.top < bottom - 80 && r.height > bottom - top) return;   // bloque alto ya empezado en pantalla
  window.scrollTo({top: Math.max(0, window.scrollY + r.top - top - Math.max(0, (bottom - top - Math.min(r.height, bottom - top)) * .3)), behavior: beh});
}
function scroller(el){
  for(let n = el.parentElement; n && n !== document.body && n !== document.documentElement; n = n.parentElement){
    const oy = getComputedStyle(n).overflowY;
    if((oy === "auto" || oy === "scroll") && n.scrollHeight > n.clientHeight + 1) return n;
  }
  return null;
}

/* ---------- iconos propios (philly no carga ui.js) ---------- */
const IC = {
  speaker: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>',
  pause: '<path d="M8 5.5v13M16 5.5v13"/>',
  play: '<path d="M7.5 5.2v13.6L18.5 12z" fill="currentColor"/>',
  prev: '<path d="M6 6v12"/><path d="M18 6.5v11L9.5 12z" fill="currentColor"/>',
  next: '<path d="M18 6v12"/><path d="M6 6.5v11l8.5-5.5z" fill="currentColor"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
};
const ico = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]}</svg>`;
const escA = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));

/* ---------- botón «Escuchar» ---------- */
const btnTxt = st => (st === "play" ? t("Pausa") : st === "pause" ? t("Seguir") : t("Escuchar"));
const btnAria = (st, label) => (label ? `${btnTxt(st)}: ${label}` : btnTxt(st));
/* El nombre accesible cambia con el estado (Escuchar, Pausa, Seguir), así que no lleva aria-pressed.
   listenBtn(id, label, {text: muestra «Escuchar» (si cabe), cls, base: clase propia en vez de .voz-btn});
   id: lo que el resolver de bind() sabe leer */
export function listenBtn(id, label = "", {text = true, cls = "", base = "voz-btn"} = {}){
  if(!soportado()) return "";
  const st = estadoDe(id);
  return `<button type="button" class="${base} ${text ? "" : "solo"} ${st !== "idle" ? "on" : ""} ${cls}" data-voz="${escA(id)}" data-voz-label="${escA(label)}" data-voz-st="${st}" aria-label="${escA(btnAria(st, label))}" title="${escA(btnAria(st, label))}">${ico(st === "play" ? "pause" : "speaker")}${text ? `<span>${escA(btnTxt(st))}</span>` : ""}</button>`;
}
function syncBtns(){
  if(!W) return;
  for(const b of document.querySelectorAll("[data-voz]")){
    const st = estadoDe(b.dataset.voz), label = b.dataset.vozLabel || "";
    if(b.dataset.vozSt === st) continue;
    b.dataset.vozSt = st;
    b.classList.toggle("on", st !== "idle");
    b.setAttribute("aria-label", btnAria(st, label)); b.title = btnAria(st, label);
    const svg = b.querySelector("svg"); if(svg) svg.outerHTML = ico(st === "play" ? "pause" : "speaker");
    const sp = b.querySelector("span"); if(sp) sp.textContent = btnTxt(st);
  }
}
/* bind(raíz, resolver): los botones [data-voz] dentro de la raíz piden sus bloques a resolver(id, botón), que
   devuelve {title, blocks, start} o la lista de bloques. Se puede volver a llamar en cada repintado (reemplaza). */
const RES = new WeakMap();
export function bind(root, resolver){ if(root) RES.set(root, resolver); }
function onClick(e){
  const b = e.target.closest?.("[data-voz]");
  if(!b || b.disabled) return;
  e.preventDefault();
  const id = b.dataset.voz;
  if(S.on && S.id === id){ toggle(); return; }
  let fn = null;
  for(let n = b; n && !fn; n = n.parentElement) fn = RES.get(n) || null;
  if(!fn) return;
  let r = null;
  try{ r = fn(id, b); }catch(err){ return; }
  if(!r) return;
  const blocks = Array.isArray(r) ? r : r.blocks;
  speak(blocks, {title: (r.title ?? b.dataset.vozLabel) || "", id, start: r.start || 0});
}

/* ---------- reproductor (cápsula de vidrio) ---------- */
let player = null;
function mount(){
  if(!W) return;
  if(player && player.isConnected) return show();
  player = document.createElement("div");
  player.className = "voz-player";
  player.setAttribute("role", "region");
  player.setAttribute("aria-label", t("Lectura en voz alta"));
  player.innerHTML = `<button type="button" class="vz-main" data-vz="toggle"></button>
    <div class="vz-info"><b class="vz-t"></b><span class="vz-s"></span><i class="vz-bar" aria-hidden="true"><i></i></i></div>
    <div class="vz-ctl">
      <button type="button" class="vz-ic" data-vz="prev" aria-label="${escA(t("Anterior"))}" title="${escA(t("Anterior"))}">${ico("prev")}</button>
      <button type="button" class="vz-ic" data-vz="next" aria-label="${escA(t("Siguiente"))}" title="${escA(t("Siguiente"))}">${ico("next")}</button>
      <button type="button" class="vz-rate" data-vz="rate"></button>
      <button type="button" class="vz-ic" data-vz="close" aria-label="${escA(t("Cerrar"))}" title="${escA(t("Cerrar"))}">${ico("x")}</button>
    </div>`;
  player.addEventListener("click", e => {
    const a = e.target.closest("[data-vz]")?.dataset.vz;
    if(a === "toggle") toggle();
    else if(a === "prev") prev();
    else if(a === "next") next();
    else if(a === "close") stop();
    else if(a === "rate"){ const i = RATES.indexOf(rate()); setRate(RATES[(i + 1) % RATES.length]); cfg.haptic("selection"); }
  });
  player.addEventListener("keydown", e => { if(e.key === "Escape"){ e.stopPropagation(); stop(); } });
  document.body.appendChild(player);
  show();
}
function show(){
  document.body.classList.add("voz-open");
  player.hidden = false;
  player.getBoundingClientRect();
  requestAnimationFrame(() => player?.classList.add("in"));
}
function unmount(id){
  if(!player) return;
  const p = player, foco = p.contains(document.activeElement);
  document.body.classList.remove("voz-open");
  p.classList.remove("in");
  setTimeout(() => { if(!S.on && p.isConnected) p.hidden = true; }, reduced() ? 0 : 320);
  /* el foco vuelve al botón que empezó la lectura */
  if(foco){ let b = null; try{ if(id != null) b = document.querySelector(`[data-voz="${CSS.escape(id)}"]`); }catch(e){} if(b) b.focus({preventScroll: true}); else p.blur?.(); }
}
function paint(){
  syncBtns();
  if(!player || !player.isConnected) return;
  const n = S.q.length, i = Math.min(S.bi, Math.max(0, n - 1));
  const main = player.querySelector(".vz-main"), play = !S.paused;
  const lab = play ? t("Pausa") : t("Seguir");
  if(main.dataset.st !== String(play)){ main.innerHTML = ico(play ? "pause" : "play"); main.dataset.st = String(play); }
  main.setAttribute("aria-label", lab); main.title = lab;
  player.querySelector(".vz-t").textContent = S.title || t("Lectura en voz alta");
  player.querySelector(".vz-s").textContent = n > 1 ? t("Parte {a} de {b}", {a: i + 1, b: n}) : S.paused ? t("En pausa") : t("Leyendo");
  player.querySelector(".vz-bar > i").style.transform = `scaleX(${n ? (i + (S.q[i] ? S.ci / S.q[i].chunks.length : 0)) / n : 0})`;
  player.querySelector("[data-vz=prev]").disabled = n <= 1 || (i === 0 && S.ci === 0);
  player.querySelector("[data-vz=next]").disabled = i >= n - 1;
  const r = player.querySelector(".vz-rate");
  r.textContent = rateTxt(rate());
  r.setAttribute("aria-label", t("Velocidad {r}", {r: rateTxt(rate())}));
  r.title = t("Velocidad {r}", {r: rateTxt(rate())});
  player.classList.toggle("paused", S.paused);
}

/* ---------- prueba de voz (Ajustes) ---------- */
export function probar(lang = uiLang()){
  const v = vozPara(lang);
  const txt = lang === "en" ? "Hi. This is how the app reads aloud. Discipline beats motivation." : "Hola. Así suena la lectura en voz alta. La disciplina vence a la motivación.";
  speak([{text: txt, lang}], {title: v ? v.name : t("Probar voz"), id: "voz:probar"});
  return v;
}

/* ---------- limpieza: al cambiar de pantalla o salir de la página ---------- */
if(W){
  document.addEventListener("click", onClick);
  W.addEventListener("hashchange", () => { if(!S.on) return; if(cfg.stopOnHash) stop(); else S.follow = false; });
  W.addEventListener("pagehide", () => { if(S.on) stop(); });
  /* en segundo plano se sigue leyendo (Chrome y Android lo hacen solos); si al volver el motor se quedó callado
     (iOS lo suspende), se retoma la frase en curso */
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState !== "visible" || !S.on || S.paused) return;
    try{ if(!synth.speaking && !synth.pending){ S.tries = 0; play(); } }catch(e){}
  });
  /* desplazarse a mano deja de seguir la lectura hasta tocar el reproductor o un botón */
  const suelta = () => { if(S.on) S.follow = false; };
  W.addEventListener("wheel", suelta, {passive: true});
  W.addEventListener("touchmove", suelta, {passive: true});
  W.addEventListener("keydown", e => { if(["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(e.key) && !e.target.closest?.("input, textarea, select, .voz-player")) suelta(); });
}
