/* Pruebas de js/voz.js sin navegador: limpieza del texto, troceo en frases de 200 caracteres o menos y elección de voz.
   Uso: node scripts/check-voz.mjs   (sale con 1 si algo falla) */
import {limpiar, trocear, elegirVoz, puntuar} from "../js/voz.js";

let n = 0;
const ok = (c, msg) => { if(!c){ n++; console.log("✗ " + msg); } };
const eq = (a, b, msg) => ok(a === b, `${msg}\n    esperado: ${JSON.stringify(b)}\n    obtenido: ${JSON.stringify(a)}`);

/* limpiar */
eq(limpiar("👊 Mira https://youtu.be/abc **ojo**"), "Mira ojo", "quita emoji, enlaces y markdown");
eq(limpiar("3 × 2 min, 60–75 min"), "3 por 2 minutos, 60 a 75 minutos", "rondas y rangos en español");
eq(limpiar("1 min y 30 s vs. rival, p. ej. así"), "1 minuto y 30 segundos contra rival, por ejemplo así", "unidades y abreviaturas en español");
eq(limpiar("3x3 min vs. pressure, e.g. jab", "en"), "3 by 3 minutes versus pressure, for example jab", "unidades y abreviaturas en inglés");
eq(limpiar("Paso 1 → paso 2 · fin"), "Paso 1, paso 2, fin", "flechas y viñetas como pausa");
eq(limpiar("10 min. Calentamiento."), "10 minutos. Calentamiento.", "conserva el punto tras la unidad");
eq(limpiar("Peso 1.5 kg y 1:30"), "Peso 1.5 kilos y 1:30", "conserva números");
eq(limpiar("Haz 2 más rondas, 5 mínimo y 2 sí"), "Haz 2 más rondas, 5 mínimo y 2 sí", "no pega unidades a palabras con tilde");
eq(limpiar("Combo 1-2-3, la 1-2 clásica y 1-6-3-2"), "Combo 1, 2, 3, la 1, 2 clásica y 1, 6, 3, 2", "combinaciones de golpes como lista");
eq(limpiar("Fecha 2026-10-31"), "Fecha 2026-10-31", "fechas sin tocar");
eq(limpiar("Ganó 10-9, al 30-40%, 3x6-8 y 1-2 min"), "Ganó 10 a 9, al 30 a 40%, 3 por 6 a 8 y 1 a 2 minutos", "rangos y marcadores");
eq(limpiar("Round 1-2-3", "en"), "Round 1, 2, 3", "combinaciones en inglés");

/* trocear */
const largo = "Esta ruta te lleva paso a paso por la guardia, la defensa, los pies, el contragolpe y la lectura de peleas. ".repeat(6) + "x".repeat(450);
const ts = trocear(largo);
ok(ts.length > 3 && ts.every(x => x.length <= 200 && x.length > 0), "trocear: todos los trozos entre 1 y 200 caracteres");
ok(trocear(largo).join(" ").replace(/\s+/g, "") === largo.replace(/\s+/g, ""), "trocear no pierde texto");
eq(trocear("Hola. Qué tal. Bien.").length, 1, "une frases cortas");
eq(trocear("Son 1.5 kilos a la 1:30. Fin.").length, 1, "no corta en decimales ni horas");
eq(trocear("").length, 0, "texto vacío");
eq(trocear("Uno. «Dos.» Tres!", 8).join("|"), "Uno.|«Dos.»|Tres!", "corta tras el cierre de comillas");
ok(trocear("a, ".repeat(150)).every(x => x.length <= 200), "corta en comas");
ok(trocear(("palabra ").repeat(100), 50).every(x => x.length <= 50), "corta entre palabras");

/* sin lookbehind: Safari < 16.4 no lo entiende y app.js importa voz.js de forma estática */
import {readFileSync} from "node:fs";
ok(!/\(\?<[=!]/.test(readFileSync(new URL("../js/voz.js", import.meta.url), "utf8")), "voz.js no usa lookbehind en sus regex");

/* voces */
const V = (name, lang, extra = {}) => ({name, lang, voiceURI: name, localService: true, default: false, ...extra});
const es = [V("Mónica", "es-ES"), V("Paulina", "es-MX"), V("Google español de Estados Unidos", "es-US", {localService: false}), V("Samantha", "en-US")];
eq(elegirVoz(es, "es")?.name, "Google español de Estados Unidos", "es: prefiere es-US de Google");
eq(elegirVoz([V("Mónica", "es-ES"), V("Jorge", "es_MX")], "es")?.name, "Jorge", "es: latinoamericana antes que es-ES (también con es_MX)");
eq(elegirVoz([V("Microsoft Elvira Online (Natural) - Spanish (Spain)", "es-ES"), V("Microsoft Sabina - Spanish (Mexico)", "es-MX")], "es")?.name, "Microsoft Elvira Online (Natural) - Spanish (Spain)", "es: una natural le gana a una normal");
eq(elegirVoz([V("Daniel", "en-GB"), V("Samantha", "en-US"), V("Zarvox", "en-US")], "en")?.name, "Samantha", "en: en-US y sin voces de novedad");
eq(elegirVoz(es, "es", "Mónica")?.name, "Mónica", "respeta la voz elegida");
eq(elegirVoz([V("Samantha", "en-US")], "es"), null, "sin voz del idioma: null");
ok(puntuar(V("Thomas", "fr-FR"), "es") < 0, "otro idioma no puntúa");

console.log(n ? `\n${n} pruebas fallaron` : "OK: voz.js limpia, trocea y elige voz como se espera.");
process.exit(n ? 1 : 0);
