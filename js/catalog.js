/* Catálogo: sistemas de cinturones/grados por disciplina, tipos de sangre, métodos de pago, equipo.
   Cada rango: n = nombre, c = color principal, c2 = franja central (cinturones infantiles), tip = color de la
   barra donde van los grados, g = grados (rayas) máximos, m = meses mínimos en ese cinturón antes del siguiente,
   mg = meses mínimos entre grados. Todo es editable desde Academia › Disciplinas: son valores de referencia. */

const B = (n, c, g, m, mg, extra = {}) => Object.assign({n, c, g, m, mg}, extra);

export const SYSTEMS = {
  bjj: {
    nombre: "Brazilian Jiu-Jitsu (adultos)",
    nota: "Tiempos mínimos de referencia IBJJF: azul 2 años, morado 1,5 años, marrón 1 año. Grados de negro: 3 años (1°–3°) y 5 años (4°–6°).",
    ranks: [
      B("Blanco", "#f4f4f4", 4, 12, 3),
      B("Azul", "#1e5bd8", 4, 24, 5),
      B("Morado", "#7b2fbf", 4, 18, 4),
      B("Marrón", "#6b3e1f", 4, 12, 3),
      B("Negro", "#111111", 6, 0, 36, {tip: "#c1121f"}),
      B("Coral rojo-negro", "#111111", 0, 84, 0, {c2: "#c1121f", stripes: true}),
      B("Coral rojo-blanco", "#f4f4f4", 0, 120, 0, {c2: "#c1121f", stripes: true}),
      B("Rojo", "#c1121f", 0, 0, 0),
    ],
  },
  bjjkids: {
    nombre: "Brazilian Jiu-Jitsu (infantil 4–15 años)",
    nota: "Sistema infantil IBJJF. Los tiempos son una referencia; ajústalos a tu academia.",
    ranks: [
      B("Blanco", "#f4f4f4", 4, 4, 1),
      B("Gris-blanco", "#8d8d8d", 4, 6, 1.5, {c2: "#f4f4f4"}),
      B("Gris", "#8d8d8d", 4, 6, 1.5),
      B("Gris-negro", "#8d8d8d", 4, 6, 1.5, {c2: "#111111"}),
      B("Amarillo-blanco", "#f2c40f", 4, 6, 1.5, {c2: "#f4f4f4"}),
      B("Amarillo", "#f2c40f", 4, 6, 1.5),
      B("Amarillo-negro", "#f2c40f", 4, 6, 1.5, {c2: "#111111"}),
      B("Naranja-blanco", "#f07a15", 4, 6, 1.5, {c2: "#f4f4f4"}),
      B("Naranja", "#f07a15", 4, 6, 1.5),
      B("Naranja-negro", "#f07a15", 4, 6, 1.5, {c2: "#111111"}),
      B("Verde-blanco", "#1f9d55", 4, 6, 1.5, {c2: "#f4f4f4"}),
      B("Verde", "#1f9d55", 4, 6, 1.5),
      B("Verde-negro", "#1f9d55", 4, 0, 1.5, {c2: "#111111"}),
    ],
  },
  judo: {
    nombre: "Judo",
    nota: "Kyu (colores) y Dan (negro). Ajusta los tiempos a tu federación.",
    ranks: [
      B("Blanco", "#f4f4f4", 0, 4, 0),
      B("Amarillo", "#f2c40f", 0, 6, 0),
      B("Naranja", "#f07a15", 0, 6, 0),
      B("Verde", "#1f9d55", 0, 9, 0),
      B("Azul", "#1e5bd8", 0, 12, 0),
      B("Marrón", "#6b3e1f", 0, 12, 0),
      B("Negro", "#111111", 9, 0, 24, {tip: "#c1121f"}),
    ],
  },
  muaythai: {
    nombre: "Muay Thai (prajied / kruang)",
    nota: "Los colores varían por escuela. Edítalos para que coincidan con tu sistema.",
    ranks: [
      B("Blanco", "#f4f4f4", 0, 3, 0),
      B("Amarillo", "#f2c40f", 0, 4, 0),
      B("Naranja", "#f07a15", 0, 4, 0),
      B("Verde", "#1f9d55", 0, 6, 0),
      B("Azul", "#1e5bd8", 0, 6, 0),
      B("Morado", "#7b2fbf", 0, 8, 0),
      B("Marrón", "#6b3e1f", 0, 12, 0),
      B("Rojo", "#c1121f", 0, 12, 0),
      B("Negro", "#111111", 5, 0, 24),
    ],
  },
  kickboxing: {
    nombre: "Kickboxing",
    nota: "Graduación tipo WAKO. Ajusta a tu escuela.",
    ranks: [
      B("Blanco", "#f4f4f4", 0, 3, 0),
      B("Amarillo", "#f2c40f", 0, 4, 0),
      B("Naranja", "#f07a15", 0, 4, 0),
      B("Verde", "#1f9d55", 0, 6, 0),
      B("Azul", "#1e5bd8", 0, 6, 0),
      B("Marrón", "#6b3e1f", 0, 12, 0),
      B("Negro", "#111111", 5, 0, 24),
    ],
  },
  karate: {
    nombre: "Karate",
    nota: "Kyu y Dan. Ajusta a tu estilo.",
    ranks: [
      B("Blanco", "#f4f4f4", 0, 3, 0),
      B("Amarillo", "#f2c40f", 0, 4, 0),
      B("Naranja", "#f07a15", 0, 4, 0),
      B("Verde", "#1f9d55", 0, 6, 0),
      B("Azul", "#1e5bd8", 0, 6, 0),
      B("Morado", "#7b2fbf", 0, 9, 0),
      B("Marrón", "#6b3e1f", 0, 12, 0),
      B("Negro", "#111111", 10, 0, 24),
    ],
  },
  taekwondo: {
    nombre: "Taekwondo",
    nota: "Gup y Dan.",
    ranks: [
      B("Blanco", "#f4f4f4", 0, 3, 0),
      B("Amarillo", "#f2c40f", 1, 3, 2),
      B("Verde", "#1f9d55", 1, 4, 2),
      B("Azul", "#1e5bd8", 1, 5, 3),
      B("Rojo", "#c1121f", 1, 6, 3),
      B("Negro", "#111111", 9, 0, 24),
    ],
  },
  niveles: {
    nombre: "Niveles (MMA, Boxeo, Lucha, Grappling sin gi)",
    nota: "Para disciplinas sin cinturones: niveles de progreso del alumno.",
    ranks: [
      B("Principiante", "#9aa4b2", 3, 3, 1),
      B("Básico", "#38bdf8", 3, 4, 1),
      B("Intermedio", "#22c55e", 3, 6, 2),
      B("Avanzado", "#f59e0b", 3, 8, 2),
      B("Competidor", "#ef4444", 3, 12, 3),
      B("Élite / Pro", "#111111", 3, 0, 6, {tip: "#f59e0b"}),
    ],
  },
};

export const DISCIPLINE_PRESETS = [
  {nombre: "Brazilian Jiu-Jitsu", sistema: "bjj", icono: "bjj"},
  {nombre: "BJJ Kids", sistema: "bjjkids", icono: "bjj"},
  {nombre: "MMA", sistema: "niveles", icono: "mma"},
  {nombre: "Muay Thai", sistema: "muaythai", icono: "muaythai"},
  {nombre: "Kickboxing", sistema: "kickboxing", icono: "muaythai"},
  {nombre: "Boxeo", sistema: "niveles", icono: "boxeo"},
  {nombre: "Lucha (Wrestling)", sistema: "niveles", icono: "mma"},
  {nombre: "Grappling / No-Gi", sistema: "niveles", icono: "bjj"},
  {nombre: "Judo", sistema: "judo", icono: "bjj"},
  {nombre: "Karate", sistema: "karate", icono: "muaythai"},
  {nombre: "Taekwondo", sistema: "taekwondo", icono: "muaythai"},
];

export const DISC_COLORS = ["#e11d48", "#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#ea580c", "#475569"];

export const BLOOD = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
export const METHODS = ["Efectivo", "Transferencia", "Nequi", "Daviplata", "Tarjeta", "Otro"];
export const PLANS = [
  {id: "mensual", nombre: "Mensual", meses: 1},
  {id: "bimestral", nombre: "Bimestral", meses: 2},
  {id: "trimestral", nombre: "Trimestral", meses: 3},
  {id: "semestral", nombre: "Semestral", meses: 6},
  {id: "anual", nombre: "Anual", meses: 12},
  {id: "quincenal", nombre: "Quincenal", meses: 0.5},
  {id: "clase", nombre: "Por clase / tiquetera", meses: 0},
  {id: "beca", nombre: "Becado (sin cobro)", meses: 0},
];
export const planById = id => PLANS.find(p => p.id === id) || PLANS[0];

/* equipo que se registra por alumno: sirve para saber a quién ofrecer productos */
export const GEAR = [
  {k: "gi", n: "Gi / kimono", talla: true},
  {k: "bucal", n: "Protector bucal"},
  {k: "guantes", n: "Guantes", talla: true},
  {k: "vendas", n: "Vendas"},
  {k: "espinilleras", n: "Espinilleras"},
  {k: "rashguard", n: "Rashguard", talla: true},
  {k: "casco", n: "Casco"},
  {k: "coquilla", n: "Coquilla / protector"},
];
export const SIZES = ["A0", "A1", "A2", "A3", "A4", "A5", "M0", "M00", "M1", "M2", "M3", "M4", "XS", "S", "M", "L", "XL", "XXL", "8 oz", "10 oz", "12 oz", "14 oz", "16 oz"];
export const STATUS = {activo: "Activo", congelado: "Congelado", inactivo: "Inactivo"};
export const CURRENCIES = ["COP", "USD", "MXN", "EUR", "ARS", "CLP", "PEN", "BRL"];

/* copia profunda de los rangos de un sistema del catálogo */
export const cloneRanks = key => JSON.parse(JSON.stringify((SYSTEMS[key] || SYSTEMS.niveles).ranks));
