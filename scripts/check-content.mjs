#!/usr/bin/env node
/* Revisión del contenido de entreno: node scripts/check-content.mjs
   Falla (código 1) si un módulo tiene menos de 3 recursos gratis, si un drill no dice "solo" de forma explícita,
   si su "min" se aleja más de un 30 % de lo que implica la dosis o si un módulo repite un nombre de drill.
   Los avisos (duplicados entre módulos, módulos sin recursos en español) no hacen fallar. */
const ARTES = {
  bjj: "../js/entreno/bjj.js", muaythai: "../js/entreno/muaythai.js", lucha: "../js/entreno/lucha.js",
  mma: "../js/entreno/mma.js", boxeo: "../philly/data.js",
};
const TIPOS = ["tecnica", "vivo", "fisico", "estudio"];
const MIN_GRATIS = 3, TOL = .3;
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

/* minutos que implica una dosis de rounds ("4 rondas de 2 minutos con 1 minuto de descanso"): trabajo + descansos
   (30 s si no lo dice), × 2 si cada round es por persona, por rol o por lado, + 2 min de explicación si es en pareja,
   mínimo 5. {min, cota} donde cota = true si la dosis suma más cosas (repeticiones, "por sumisión"...)
   y entonces solo se exige que min no quede corto. null si la dosis no son rounds ni minutos */
const U = "(min(?:utos?)?|seg(?:undos?)?|s)\\b";
const seg = (n, u) => parseFloat(String(n).replace(",", ".")) * (/^m/i.test(u) ? 60 : 1);
const EXTRA = /repetici|\bm[aá]s\b|minutos de |por (sumisi|posici|patr|finaliz|direcci|zancadilla|derribo|t[eé]cnica)/i;
export function esperado(dosis = "", pareja = false){
  const r = new RegExp(`(\\d+)(?:\\s*(?:a|o|-)\\s*(\\d+))?\\s*(?:(?:rounds?|asaltos?|rondas?|series|peleas?|combates?)\\s*(?:de|x|×)?|x|×)\\s*(\\d+(?:[.,]\\d+)?)\\s*${U}(\\s*por (?:persona|rol|lado))?`, "i").exec(dosis);
  if(r){
    const n = +(r[2] || r[1]), t = seg(r[3], r[4]);
    if(!n || n > 30 || t < 10 || t > 1200) return null;
    const d = new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*${U}\\s*de\\s*descanso`, "i").exec(dosis) || new RegExp(`descanso\\s*(?:de\\s*)?(\\d+(?:[.,]\\d+)?)\\s*${U}`, "i").exec(dosis);
    const desc = d ? seg(d[1], d[2]) : 30, x2 = r[5] ? 2 : 1;
    const mas = /\bm[aá]s (\d+) min/i.exec(dosis);
    const min = Math.round(((n * t + (n - 1) * desc) * x2) / 60 + (mas ? +mas[1] : 0) + (pareja ? 2 : 0));
    return {min: Math.max(5, min), cota: EXTRA.test(dosis.replace(/\bm[aá]s (\d+) min\w*/i, ""))};
  }
  const m = /^(\d+)\s*(?:a|-)\s*(\d+)\s*min/i.exec(dosis) || /^(\d+)\s*min/i.exec(dosis);
  return m ? {min: Math.max(5, +(m[2] || m[1])), cota: false} : null;
}

const errores = [], avisos = [];
let nMods = 0, nDrills = 0, nRec = 0, nPago = 0;
for(const [arte, ruta] of Object.entries(ARTES)){
  const {MODULOS = []} = await import(new URL(ruta, import.meta.url));
  const vistos = {};
  for(const m of MODULOS){
    nMods++;
    const id = `${arte}/${m.id}`, rec = m.recursos || [], drills = m.drills || [];
    /* recursos */
    nRec += rec.length;
    rec.forEach((r, i) => {
      if(r.pago) nPago++;
      if(/udemy\.com/i.test(r.url) && !r.pago) errores.push(`${id} R${i} "${r.titulo}": curso de Udemy sin "pago": true`);
      if(norm(r.titulo).length < 6) avisos.push(`${id} R${i}: título demasiado corto ("${r.titulo}")`);
    });
    const gratis = rec.filter(r => !r.pago);
    if(gratis.length < MIN_GRATIS) errores.push(`${id}: ${gratis.length} recursos gratis (mínimo ${MIN_GRATIS})`);
    if(!gratis.some(r => r.idioma === "es")) avisos.push(`${id}: ningún recurso gratis en español`);
    const urls = rec.map(r => r.url);
    urls.forEach((u, i) => { if(urls.indexOf(u) !== i) errores.push(`${id} R${i}: url repetida en el módulo (${u})`); });
    /* drills */
    const nombres = {};
    drills.forEach((d, i) => {
      nDrills++;
      const k = `${id} D${i} "${d.nombre}"`;
      if(typeof d.solo !== "boolean") errores.push(`${k}: falta "solo" explícito`);
      if(d.tipo != null && !TIPOS.includes(d.tipo)) errores.push(`${k}: tipo "${d.tipo}" no válido`);
      if(d.freq != null && !(Number.isInteger(d.freq) && d.freq >= 1 && d.freq <= 7)) errores.push(`${k}: freq ${d.freq} fuera de 1..7`);
      if(d.min != null){
        const e = esperado(d.dosis, d.solo === false), dif = e && (d.min - e.min) / e.min;
        if(e && (dif < -TOL || (!e.cota && dif > TOL))) errores.push(`${k}: min ${d.min} y la dosis implica ${e.cota ? "al menos " : ""}~${e.min} ("${d.dosis}")`);
      }
      const n = norm(d.nombre);
      if(n in nombres) errores.push(`${k}: nombre repetido en el módulo (D${nombres[n]})`);
      else nombres[n] = i;
      (vistos[n] ||= []).push(`${m.id}:${i}`);
    });
  }
  for(const [n, donde] of Object.entries(vistos)) if(donde.length > 1) avisos.push(`${arte}: drill "${n}" repetido en ${donde.join(", ")}`);
}

console.log(`Contenido: ${nMods} módulos, ${nDrills} drills, ${nRec} recursos (${nPago} de pago).`);
if(avisos.length) console.log(`\nAvisos (${avisos.length}):\n` + avisos.map(x => "  · " + x).join("\n"));
if(errores.length){
  console.log(`\nErrores (${errores.length}):\n` + errores.map(x => "  ✗ " + x).join("\n"));
  process.exit(1);
}
console.log("\nOK: el contenido pasa la revisión.");
