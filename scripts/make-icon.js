// Generates a 1024×1024 app icon PNG with no external dependencies.
// Run:  node scripts/make-icon.js   (then:  npx tauri icon src-tauri/icons/icon.png)
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');

const S = 1024;
const px = Buffer.alloc(S * S * 4);

const set = (x, y, [r, g, b, a = 255]) => {
  if (x < 0 || y < 0 || x >= S || y >= S) return;
  const i = (y * S + x) * 4;
  const ia = a / 255, inv = 1 - ia;
  px[i] = r * ia + px[i] * inv;
  px[i + 1] = g * ia + px[i + 1] * inv;
  px[i + 2] = b * ia + px[i + 2] * inv;
  px[i + 3] = Math.max(px[i + 3], a);
};

const BG = [22, 27, 34];
const ACCENT = [47, 129, 247];
const PAPER = [230, 237, 243];

// Rounded-rect background
const radius = 220;
for (let y = 0; y < S; y++) {
  for (let x = 0; x < S; x++) {
    const dx = Math.max(radius - x, 0, x - (S - radius - 1));
    const dy = Math.max(radius - y, 0, y - (S - radius - 1));
    if (Math.hypot(dx, dy) <= radius) set(x, y, BG);
  }
}

const rect = (x0, y0, w, h, colour) => {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, colour);
};

// Book: two pages with a spine
rect(230, 300, 250, 430, PAPER);
rect(544, 300, 250, 430, PAPER);
rect(490, 280, 44, 470, ACCENT);

// Text lines on each page
for (let i = 0; i < 6; i++) {
  const y = 360 + i * 60;
  rect(270, y, 170 - (i % 3) * 30, 22, [140, 148, 158]);
  rect(584, y, 170 - ((i + 1) % 3) * 30, 22, [140, 148, 158]);
}

// --- PNG encoding -------------------------------------------------------
const raw = Buffer.alloc((S * 4 + 1) * S);
for (let y = 0; y < S; y++) {
  raw[y * (S * 4 + 1)] = 0; // filter: none
  px.copy(raw, y * (S * 4 + 1) + 1, y * S * 4, (y + 1) * S * 4);
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([len, body, crc]);
};

let table = null;
function crc32(buf) {
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8);
  return c ^ -1;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(S, 0);
ihdr.writeUInt32BE(S, 4);
ihdr[8] = 8;  // bit depth
ihdr[9] = 6;  // colour type RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0))
]);

const out = path.join(__dirname, '..', 'src-tauri', 'icons', 'icon.png');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, png);
console.log('Wrote', out);
