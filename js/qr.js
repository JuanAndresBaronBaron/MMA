/* Código QR propio (sin CDN): modo byte, corrección M, versiones 1 a 20 (hasta 666 bytes), máscara elegida por penalización.
   Sigue el algoritmo de la norma ISO/IEC 18004 (mismo orden de pasos que la librería de Nayuki, MIT). */

/* corrección M: bytes de corrección por bloque y número de bloques, versiones 1..20 */
const ECC = [10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26];
const BLOQ = [1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16];
const VMAX = ECC.length;

const rawModulos = v => {
  let r = (16 * v + 128) * v + 64;
  if(v >= 2){ const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if(v >= 7) r -= 36; }
  return r;
};
const datosCap = v => Math.floor(rawModulos(v) / 8) - ECC[v - 1] * BLOQ[v - 1];

/* Reed-Solomon en GF(256), polinomio 0x11D */
const mul = (x, y) => { let z = 0; for(let i = 7; i >= 0; i--){ z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z & 255; };
function divisor(g){
  const r = new Array(g).fill(0); r[g - 1] = 1;
  let root = 1;
  for(let i = 0; i < g; i++){
    for(let j = 0; j < g; j++){ r[j] = mul(r[j], root); if(j + 1 < g) r[j] ^= r[j + 1]; }
    root = mul(root, 2);
  }
  return r;
}
function resto(data, div){
  const r = div.map(() => 0);
  for(const b of data){
    const f = b ^ r.shift(); r.push(0);
    div.forEach((c, i) => { r[i] ^= mul(c, f); });
  }
  return r;
}

function alineacion(v){
  if(v === 1) return [];
  const n = Math.floor(v / 7) + 2, size = v * 4 + 17;
  const step = Math.ceil((v * 4 + 4) / (n * 2 - 2)) * 2;
  const r = [6];
  for(let p = size - 7; r.length < n; p -= step) r.splice(1, 0, p);
  return r;
}

export function qrMatrix(text){
  const bytes = [...new TextEncoder().encode(String(text))];
  let v = 1;
  for(; v <= VMAX; v++){ const cc = v < 10 ? 8 : 16; if(4 + cc + bytes.length * 8 <= datosCap(v) * 8) break; }
  if(v > VMAX) throw new Error("QR: texto demasiado largo");
  const size = v * 4 + 17, cap = datosCap(v) * 8;
  /* bits: modo byte 0100, largo, datos, terminador, relleno */
  const bits = [];
  const put = (val, n) => { for(let i = n - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, v < 10 ? 8 : 16);
  for(const b of bytes) put(b, 8);
  put(0, Math.min(4, cap - bits.length));
  put(0, (8 - bits.length % 8) % 8);
  for(let p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
  const data = [];
  for(let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => a << 1 | b, 0));
  /* bloques con su corrección, intercalados */
  const nb = BLOQ[v - 1], ecc = ECC[v - 1], raw = Math.floor(rawModulos(v) / 8);
  const nCortos = nb - raw % nb, largoCorto = Math.floor(raw / nb), div = divisor(ecc);
  const blocks = [];
  for(let i = 0, k = 0; i < nb; i++){
    const dat = data.slice(k, k + largoCorto - ecc + (i < nCortos ? 0 : 1)); k += dat.length;
    const e = resto(dat, div);
    if(i < nCortos) dat.push(0);
    blocks.push(dat.concat(e));
  }
  const cw = [];
  for(let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if(i !== largoCorto - ecc || j >= nCortos) cw.push(b[i]); });

  /* patrones fijos */
  const M = Array.from({length: size}, () => new Array(size).fill(false));
  const F = Array.from({length: size}, () => new Array(size).fill(false));
  const set = (x, y, d) => { M[y][x] = d; F[y][x] = true; };
  for(let i = 0; i < size; i++){ set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const finder = (x, y) => { for(let dy = -4; dy <= 4; dy++) for(let dx = -4; dx <= 4; dx++){ const d = Math.max(Math.abs(dx), Math.abs(dy)), xx = x + dx, yy = y + dy; if(xx >= 0 && xx < size && yy >= 0 && yy < size) set(xx, yy, d !== 2 && d !== 4); } };
  finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
  const al = alineacion(v), na = al.length;
  for(let i = 0; i < na; i++) for(let j = 0; j < na; j++){
    if((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) continue;
    for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++) set(al[i] + dx, al[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  }
  const formato = mask => {
    const d = (0 << 3) | mask; let r = d;   // M = 00
    for(let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412, g = i => ((b >>> i) & 1) === 1;
    for(let i = 0; i <= 5; i++) set(8, i, g(i));
    set(8, 7, g(6)); set(8, 8, g(7)); set(7, 8, g(8));
    for(let i = 9; i < 15; i++) set(14 - i, 8, g(i));
    for(let i = 0; i < 8; i++) set(size - 1 - i, 8, g(i));
    for(let i = 8; i < 15; i++) set(8, size - 15 + i, g(i));
    set(8, size - 8, true);
  };
  formato(0);   // reserva las celdas de formato
  if(v >= 7){
    let r = v; for(let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
    const b = (v << 12) | r;
    for(let i = 0; i < 18; i++){ const d = ((b >>> i) & 1) === 1, a = size - 11 + i % 3, c = Math.floor(i / 3); set(a, c, d); set(c, a, d); }
  }
  /* datos en zigzag */
  let i = 0;
  for(let right = size - 1; right >= 1; right -= 2){
    if(right === 6) right = 5;
    for(let vert = 0; vert < size; vert++) for(let j = 0; j < 2; j++){
      const x = right - j, up = ((right + 1) & 2) === 0, y = up ? size - 1 - vert : vert;
      if(!F[y][x] && i < cw.length * 8){ M[y][x] = ((cw[i >>> 3] >>> (7 - (i & 7))) & 1) === 1; i++; }
    }
  }
  /* la máscara con menor penalización */
  const MASKS = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, x => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
    (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
    (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
  const aplicar = m => { for(let y = 0; y < size; y++) for(let x = 0; x < size; x++) if(!F[y][x] && MASKS[m](x, y)) M[y][x] = !M[y][x]; };
  let best = 0, min = Infinity;
  for(let m = 0; m < 8; m++){
    aplicar(m); formato(m);
    const p = penal(M, size);
    if(p < min){ min = p; best = m; }
    aplicar(m);   // XOR: deshace
  }
  aplicar(best); formato(best);
  return M;
}

function penal(M, n){
  let p = 0, dark = 0;
  const linea = get => {
    let run = 1;
    for(let i = 1; i <= n; i++){
      if(i < n && get(i) === get(i - 1)) run++;
      else { if(run >= 5) p += 3 + run - 5; run = 1; }
    }
    /* parecido a un buscador: 1011101 con 4 claros a un lado */
    for(let i = 0; i + 11 <= n; i++){
      const s = Array.from({length: 11}, (_, k) => get(i + k) ? 1 : 0).join("");
      if(s === "10111010000" || s === "00001011101") p += 40;
    }
  };
  for(let y = 0; y < n; y++) linea(x => M[y][x]);
  for(let x = 0; x < n; x++) linea(y => M[y][x]);
  for(let y = 0; y < n - 1; y++) for(let x = 0; x < n - 1; x++){ const c = M[y][x]; if(c === M[y][x + 1] && c === M[y + 1][x] && c === M[y + 1][x + 1]) p += 3; }
  for(const r of M) for(const c of r) if(c) dark++;
  const tot = n * n;
  p += Math.max(0, Math.ceil(Math.abs(dark * 20 - tot * 10) / tot) - 1) * 10;
  return p;
}

/* SVG listo para pegar: fondo blanco y módulos negros (se lee igual en tema oscuro) */
export function qrSvg(text, {size = 200, margin = 4} = {}){
  const M = qrMatrix(text), n = M.length, w = n + margin * 2;
  let d = "";
  for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) if(M[y][x]) d += `M${x + margin} ${y + margin}h1v1h-1z`;
  return `<svg class="qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${w}" width="${size}" height="${size}" shape-rendering="crispEdges" role="img" aria-label="QR"><rect width="${w}" height="${w}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
