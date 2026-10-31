/* Revisa las traducciones: cada texto literal en t("…") / tn(n, "…", "…") de js/ (y de las páginas sueltas) debe
   tener inglés en algún js/i18n/en-*.js, cada en-*.js debe estar en NAMES de js/i18n.js, y una misma clave no debe
   tener dos traducciones distintas en archivos diferentes.
   Uso: node scripts/check-i18n.mjs [--unused]   (sale con 1 si falta algo o hay conflictos) */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath, pathToFileURL} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const I18N = path.join(ROOT, "js/i18n");
const walk = d => fs.readdirSync(d, {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

/* diccionarios */
const dicts = {};
for(const f of fs.readdirSync(I18N).filter(f => /^en-.+\.js$/.test(f))){
  dicts[f] = (await import(pathToFileURL(path.join(I18N, f)).href)).default || {};
}
const all = {};
const conflicts = [];
for(const [f, d] of Object.entries(dicts)) for(const [k, v] of Object.entries(d)){
  if(k in all && all[k].v !== v) conflicts.push(`"${k}": ${all[k].f} → "${all[k].v}" · ${f} → "${v}"`);
  else if(!(k in all)) all[k] = {f, v};
}

/* archivos en NAMES */
const src = fs.readFileSync(path.join(ROOT, "js/i18n.js"), "utf8");
const names = JSON.parse(src.match(/const NAMES = (\[[^\]]*\])/)[1]);
const sinCargar = Object.keys(dicts).map(f => f.slice(3, -3)).filter(n => !names.includes(n));
const faltanArch = names.filter(n => !dicts[`en-${n}.js`]);

/* textos usados */
const lit = String.raw`"((?:[^"\\\n]|\\.)*)"`;
const reT = new RegExp(String.raw`\bt\(\s*` + lit, "g");
const reTn = new RegExp(String.raw`\btn\([^,()]*(?:\([^()]*\))?[^,()]*,\s*` + lit + String.raw`\s*,\s*` + lit, "g");
const used = new Map();
const files = [...walk(path.join(ROOT, "js")).filter(f => f.endsWith(".js") && !f.startsWith(I18N))];
for(const f of files){
  const s = fs.readFileSync(f, "utf8");
  const rel = path.relative(ROOT, f);
  const add = k => { k = JSON.parse(`"${k}"`); if(!/[A-Za-zÁÉÍÓÚáéíóúñÑ]/.test(k)) return; if(!used.has(k)) used.set(k, rel); };
  for(const m of s.matchAll(reT)) add(m[1]);
  for(const m of s.matchAll(reTn)){ add(m[1]); add(m[2]); }
}
const missing = [...used].filter(([k]) => !(k in all));

for(const n of sinCargar) console.log(`✗ js/i18n/en-${n}.js no está en NAMES de js/i18n.js`);
for(const n of faltanArch) console.log(`✗ NAMES lista "${n}" pero no existe js/i18n/en-${n}.js`);
for(const c of conflicts) console.log(`✗ conflicto ${c}`);
for(const [k, f] of missing) console.log(`✗ sin inglés (${f}): "${k}"`);
if(process.argv.includes("--unused")){
  const un = Object.keys(all).filter(k => !used.has(k));
  console.log(`(${un.length} claves sin uso literal; pueden venir de datos o de variables)`);
}
const n = sinCargar.length + faltanArch.length + conflicts.length + missing.length;
console.log(n ? `\n${n} problemas (${used.size} textos usados, ${Object.keys(all).length} claves)` : `OK: ${used.size} textos usados, todos con inglés; ${Object.keys(all).length} claves, sin conflictos.`);
process.exit(n ? 1 : 0);
