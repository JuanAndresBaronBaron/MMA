/* Calendario .ics (RFC 5545) para la rutina y el horario de clases.
   Líneas con CRLF, plegadas a 75 octetos, texto escapado (\ ; , y saltos), DTSTART en hora local flotante
   (sin zona: la hora que ve cada quien en su calendario), DTSTAMP en UTC y alarma opcional. */
const p2 = n => String(n).padStart(2, "0");
const local = d => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`;
const utc = d => `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`;
export const escTxt = s => String(s ?? "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/* pliega en trozos de 75 octetos sin partir un carácter UTF-8; las continuaciones empiezan con un espacio */
const enc = new TextEncoder();
export function plegar(linea){
  if(enc.encode(linea).length <= 75) return linea;
  const out = []; let cur = "", n = 0, lim = 75;
  for(const ch of linea){
    const b = enc.encode(ch).length;
    if(n + b > lim){ out.push(cur); cur = " "; n = 1; lim = 75; }
    cur += ch; n += b;
  }
  out.push(cur);
  return out.join("\r\n");
}

/* un VEVENT. rrule: "FREQ=WEEKLY;BYDAY=MO"; alarmaMin: minutos antes para el aviso */
export function icsEvento({uid, titulo, inicio, durMin = 60, rrule, alarmaMin, lugar, desc}){
  const fin = new Date(inicio.getTime() + durMin * 6e4);
  const ls = ["BEGIN:VEVENT", `UID:${uid || Date.now().toString(36) + Math.random().toString(36).slice(2)}@academiapro`,
    `DTSTAMP:${utc(new Date())}`, `DTSTART:${local(inicio)}`, `DTEND:${local(fin)}`, `SUMMARY:${escTxt(titulo)}`];
  if(rrule) ls.push(`RRULE:${rrule}`);
  if(lugar) ls.push(`LOCATION:${escTxt(lugar)}`);
  if(desc) ls.push(`DESCRIPTION:${escTxt(desc)}`);
  if(alarmaMin != null) ls.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escTxt(titulo)}`, `TRIGGER:-PT${Math.max(0, Math.round(alarmaMin))}M`, "END:VALARM");
  ls.push("END:VEVENT");
  return ls.map(plegar).join("\r\n");
}
/* eventos: textos de icsEvento */
export function icsCalendario(eventos, nombre = "AcademiaPro"){
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AcademiaPro//ES", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", plegar(`X-WR-CALNAME:${escTxt(nombre)}`),
    ...eventos, "END:VCALENDAR"].join("\r\n") + "\r\n";
}
/* RRULE semanal: días 1 = lunes … 7 = domingo (como la rutina) o 0 = domingo (getDay) */
const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
export const byDay = d => BYDAY[d % 7];

/* comparte el archivo (en el celular abre el calendario) o lo descarga */
export async function descargarIcs(nombre, texto){
  const fn = /\.ics$/i.test(nombre) ? nombre : nombre + ".ics";
  const {shareOrDownload} = await import("./ui.js");
  return shareOrDownload({title: fn.replace(/\.ics$/i, ""), files: [new File([texto], fn, {type: "text/calendar"})], filename: fn});
}
