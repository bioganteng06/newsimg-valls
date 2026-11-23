// news-image-20261123: "The World in One Day" — a newspaper-style infographic
// summing up Monday 23 November 2026, drawn from scratch with a crisp embedded
// 8x8 bitmap font and a minimal PNG encoder. Node 22, standard library only,
// no network, no randomness: two runs write byte-identical output.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette ---
const PAPER: RGB = [246, 241, 227];
const INK: RGB = [25, 25, 25];
const WHITE: RGB = [255, 255, 255];
const RED: RGB = [163, 30, 34];
const TINT: RGB = [238, 232, 214];

type RGB = [number, number, number];

// ------------------------------------------------------------- 8x8 font -----
// Each glyph is 8 rows of 8 characters; '#' is ink, '.' is empty.
// All text in the image is uppercase, so only capitals, digits and a small
// set of punctuation are needed.
const FONT: Record<string, string[]> = {
  A: ['..##....', '.#..#...', '#....#..', '#....#..', '######..', '#....#..', '#....#..', '#....#..'],
  B: ['#####...', '#....#..', '#....#..', '#####...', '#....#..', '#....#..', '#....#..', '#####...'],
  C: ['.####...', '#....#..', '#.......', '#.......', '#.......', '#.......', '#....#..', '.####...'],
  D: ['#####...', '#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '#####...'],
  E: ['######..', '#.......', '#.......', '#####...', '#.......', '#.......', '#.......', '######..'],
  F: ['######..', '#.......', '#.......', '#####...', '#.......', '#.......', '#.......', '#.......'],
  G: ['.####...', '#....#..', '#.......', '#..###..', '#....#..', '#....#..', '#...##..', '.###....'],
  H: ['#....#..', '#....#..', '#....#..', '######..', '#....#..', '#....#..', '#....#..', '#....#..'],
  I: ['.###....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '.###....'],
  J: ['...###..', '....#...', '....#...', '....#...', '....#...', '....#...', '#...#...', '.###....'],
  K: ['#....#..', '#...#...', '#..#....', '###.....', '#..#....', '#...#...', '#....#..', '#....#..'],
  L: ['#.......', '#.......', '#.......', '#.......', '#.......', '#.......', '#.......', '######..'],
  M: ['#....#..', '##..##..', '#.#..#..', '#.#..#..', '#....#..', '#....#..', '#....#..', '#....#..'],
  N: ['#....#..', '##...#..', '#.#..#..', '#..#.#..', '#...##..', '#....#..', '#....#..', '#....#..'],
  O: ['.####...', '#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '.####...'],
  P: ['#####...', '#....#..', '#....#..', '#####...', '#.......', '#.......', '#.......', '#.......'],
  Q: ['.####...', '#....#..', '#....#..', '#....#..', '#....#..', '#..#....', '#...#...', '.###.#..'],
  R: ['#####...', '#....#..', '#....#..', '#####...', '#..#....', '#...#...', '#....#..', '#....#..'],
  S: ['.####...', '#....#..', '#.......', '.###....', '....#...', '....#...', '#....#..', '.####...'],
  T: ['######..', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....'],
  U: ['#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '.####...'],
  V: ['#....#..', '#....#..', '#....#..', '#....#..', '#....#..', '.#..#...', '.#..#...', '..##....'],
  W: ['#....#..', '#....#..', '#....#..', '#....#..', '#.#..#..', '#.#..#..', '##..##..', '#....#..'],
  X: ['#....#..', '#....#..', '.#..#...', '..##....', '..##....', '.#..#...', '#....#..', '#....#..'],
  Y: ['#....#..', '#....#..', '.#..#...', '..##....', '..#.....', '..#.....', '..#.....', '..#.....'],
  Z: ['######..', '....#...', '...#....', '..#.....', '.#......', '#.......', '#.......', '######..'],
  '0': ['.####...', '#....#..', '#...##..', '#..#.#..', '#.#..#..', '##...#..', '#....#..', '.####...'],
  '1': ['..#.....', '.##.....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '.###....'],
  '2': ['.####...', '#....#..', '.....#..', '....#...', '...#....', '..#.....', '.#......', '######..'],
  '3': ['#####...', '....#...', '....#...', '.####...', '....#...', '....#...', '#...#...', '.###....'],
  '4': ['...#....', '..##....', '.#.#....', '#..#....', '######..', '...#....', '...#....', '...#....'],
  '5': ['######..', '#.......', '#####...', '....#...', '....#...', '....#...', '#...#...', '.###....'],
  '6': ['.####...', '#....#..', '#.......', '#####...', '#....#..', '#....#..', '#....#..', '.####...'],
  '7': ['######..', '....#...', '...#....', '...#....', '..#.....', '..#.....', '..#.....', '..#.....'],
  '8': ['.####...', '#....#..', '#....#..', '.####...', '#....#..', '#....#..', '#....#..', '.####...'],
  '9': ['.####...', '#....#..', '#....#..', '#....#..', '.#####..', '....#...', '#...#...', '.###....'],
  ' ': ['........', '........', '........', '........', '........', '........', '........', '........'],
  '.': ['........', '........', '........', '........', '........', '........', '..##....', '..##....'],
  ',': ['........', '........', '........', '........', '........', '..##....', '..##....', '.#......'],
  ':': ['........', '..##....', '..##....', '........', '..##....', '..##....', '........', '........'],
  ';': ['........', '..##....', '..##....', '........', '..##....', '..##....', '.#......', '........'],
  '-': ['........', '........', '........', '.####...', '........', '........', '........', '........'],
  '(': ['...#....', '..#.....', '.#......', '.#......', '.#......', '.#......', '..#.....', '...#....'],
  ')': ['.#......', '..#.....', '...#....', '...#....', '...#....', '...#....', '..#.....', '.#......'],
  '%': ['##..#...', '##.#....', '....#...', '...#....', '..#.....', '.#..##..', '#...##..', '........'],
  '/': ['.....#..', '....#...', '....#...', '...#....', '..#.....', '..#.....', '.#......', '#.......'],
  "'": ['..#.....', '..#.....', '.#......', '........', '........', '........', '........', '........'],
  '!': ['..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '..#.....', '........', '..#.....'],
  '?': ['.####...', '#....#..', '....#...', '...#....', '..#.....', '........', '..#.....', '..#.....'],
  '&': ['.###....', '#...#...', '#...#...', '.#......', '#.#.#...', '#..#....', '#...#...', '.###.#..'],
  '+': ['........', '..#.....', '..#.....', '#######.', '..#.....', '..#.....', '........', '........'],
  '=': ['........', '........', '######..', '........', '######..', '........', '........', '........'],
};

function textWidth(text: string, scale: number): number {
  return text.length * 8 * scale;
}

// Wrap text to lines of at most maxChars characters, breaking on spaces.
function wrap(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line === '' ? word : line + ' ' + word;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line !== '') lines.push(line);
      line = word;
    }
  }
  if (line !== '') lines.push(line);
  return lines;
}

// ------------------------------------------------------------- canvas -------
const px = new Uint8Array(W * H * 3);

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let j = y; j < y + h; j++) {
    for (let i = x; i < x + w; i++) setPixel(i, j, c);
  }
}

function rectBorder(x: number, y: number, w: number, h: number, t: number, c: RGB): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}

function hline(x0: number, x1: number, y: number, c: RGB, t = 1): void {
  const half = Math.floor(t / 2);
  for (let y2 = y - half; y2 <= y + half; y2++) {
    for (let x = x0; x <= x1; x++) setPixel(x, y2, c);
  }
}

function vline(x: number, y0: number, y1: number, c: RGB, t = 1): void {
  const half = Math.floor(t / 2);
  for (let x2 = x - half; x2 <= x + half; x2++) {
    for (let y = y0; y <= y1; y++) setPixel(x2, y, c);
  }
}

// Bresenham line with a square brush of side t.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  const half = Math.floor(t / 2);
  for (;;) {
    for (let j = -half; j <= half; j++) {
      for (let i = -half; i <= half; i++) setPixel(x + i, y + j, c);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function circle(cx: number, cy: number, r: number, c: RGB, t = 1): void {
  let x = r;
  let y = 0;
  let err = 0;
  const half = Math.floor(t / 2);
  const plot = (pxx: number, pyy: number): void => {
    for (let j = -half; j <= half; j++) {
      for (let i = -half; i <= half; i++) setPixel(pxx + i, pyy + j, c);
    }
  };
  while (x >= y) {
    plot(cx + x, cy + y);
    plot(cx + y, cy + x);
    plot(cx - y, cy + x);
    plot(cx - x, cy + y);
    plot(cx - x, cy - y);
    plot(cx - y, cy - x);
    plot(cx + y, cy - x);
    plot(cx + x, cy - y);
    y += 1;
    err += 1 + 2 * y;
    if (2 * (err - x) + 1 > 0) {
      x -= 1;
      err += 1 - 2 * x;
    }
  }
}

function drawGlyph(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const g = FONT[ch] ?? FONT[' '];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if (g[row][col] === '#') {
        fillRect(x + col * scale, y + row * scale, scale, scale, c);
      }
    }
  }
}

function drawText(text: string, x: number, y: number, scale: number, c: RGB): void {
  for (let i = 0; i < text.length; i++) {
    drawGlyph(text[i], x + i * 8 * scale, y, scale, c);
  }
}

function drawTextCentered(text: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(text, cx - Math.floor(textWidth(text, scale) / 2), y, scale, c);
}

// ---------------------------------------------------------- PNG encoder -----
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 9 });
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// --------------------------------------------------------------- icons ------
// Each icon is drawn inside a 60x60 box centred on (cx, cy), in colour c,
// with 3px strokes so it stays readable when the image is shown small.
function iconGlobe(cx: number, cy: number, c: RGB): void {
  circle(cx, cy, 20, c, 3);
  vline(cx, cy - 20, cy + 20, c, 2);
  hline(cx - 20, cx + 20, cy, c, 2);
  hline(cx - 16, cx + 16, cy - 11, c, 2);
  hline(cx - 16, cx + 16, cy + 11, c, 2);
}

function iconBallot(cx: number, cy: number, c: RGB): void {
  // paper slip above the box, then the box with a slot and a check mark
  fillRect(cx - 7, cy - 24, 14, 12, c);
  rectBorder(cx - 18, cy - 8, 36, 26, 3, c);
  hline(cx - 10, cx + 10, cy + 2, c, 3);
  line(cx - 10, cy + 8, cx - 4, cy + 14, c, 3);
  line(cx - 4, cy + 14, cx + 11, cy - 1, c, 3);
}

function iconShip(cx: number, cy: number, c: RGB): void {
  line(cx - 20, cy - 2, cx + 20, cy - 2, c, 3); // deck
  line(cx - 20, cy - 2, cx - 12, cy + 12, c, 3); // hull left
  line(cx + 20, cy - 2, cx + 12, cy + 12, c, 3); // hull right
  hline(cx - 12, cx + 12, cy + 12, c, 3); // hull bottom
  vline(cx, cy - 22, cy - 2, c, 3); // mast
  line(cx, cy - 22, cx + 13, cy - 17, c, 3); // flag
  line(cx + 13, cy - 17, cx, cy - 12, c, 3);
  line(cx - 24, cy + 20, cx - 8, cy + 20, c, 2); // waves
  line(cx + 2, cy + 20, cx + 18, cy + 20, c, 2);
  line(cx - 16, cy + 25, cx + 16, cy + 25, c, 2);
}

function iconChart(cx: number, cy: number, c: RGB): void {
  vline(cx - 20, cy - 20, cy + 20, c, 3); // y axis
  hline(cx - 20, cx + 20, cy + 20, c, 3); // x axis
  line(cx - 16, cy - 16, cx - 4, cy - 6, c, 3); // falling line
  line(cx - 4, cy - 6, cx + 6, cy - 10, c, 3);
  line(cx + 6, cy - 10, cx + 18, cy + 8, c, 3);
  line(cx + 18, cy + 8, cx + 11, cy + 8, c, 3); // arrow head
  line(cx + 18, cy + 8, cx + 18, cy + 1, c, 3);
}

function iconFactory(cx: number, cy: number, c: RGB): void {
  fillRect(cx - 20, cy - 2, 40, 22, c); // factory body
  fillRect(cx - 20, cy - 12, 8, 10, c); // chimney
  fillRect(cx - 8, cy - 12, 8, 10, c); // chimney
  // sawtooth roof: cut two paper-coloured triangles out of the top
  line(cx - 20, cy - 2, cx - 10, cy - 12, PAPER, 3);
  line(cx - 10, cy - 12, cx, cy - 2, PAPER, 3);
  line(cx, cy - 2, cx + 10, cy - 12, PAPER, 3);
  line(cx + 10, cy - 12, cx + 20, cy - 2, PAPER, 3);
  // flame above the left chimney
  line(cx - 16, cy - 14, cx - 16, cy - 20, c, 3);
  line(cx - 16, cy - 20, cx - 12, cy - 25, c, 3);
  line(cx - 12, cy - 25, cx - 8, cy - 20, c, 3);
  line(cx - 8, cy - 20, cx - 8, cy - 14, c, 3);
}

function iconTrophy(cx: number, cy: number, c: RGB): void {
  line(cx - 12, cy - 20, cx + 12, cy - 20, c, 3); // cup rim
  line(cx - 12, cy - 20, cx - 8, cy - 2, c, 3); // cup left
  line(cx + 12, cy - 20, cx + 8, cy - 2, c, 3); // cup right
  hline(cx - 8, cx + 8, cy - 2, c, 3); // cup bottom
  line(cx - 12, cy - 18, cx - 19, cy - 12, c, 3); // left handle
  line(cx - 19, cy - 12, cx - 12, cy - 8, c, 3);
  line(cx + 12, cy - 18, cx + 19, cy - 12, c, 3); // right handle
  line(cx + 19, cy - 12, cx + 12, cy - 8, c, 3);
  vline(cx, cy - 2, cy + 12, c, 3); // stem
  hline(cx - 12, cx + 12, cy + 12, c, 3); // base
  hline(cx - 16, cx + 16, cy + 18, c, 3); // plinth
}

// -------------------------------------------------------------- stories -----
type IconFn = (cx: number, cy: number, c: RGB) => void;

interface Story {
  category: string;
  color: RGB;
  icon: IconFn;
  headline: string;
  body: string;
}

// Only the six verified 23 November 2026 stories, nothing else.
const STORIES: Story[] = [
  {
    category: 'CLIMATE',
    color: [14, 124, 107],
    icon: iconGlobe,
    headline: 'COP31 ENDS WITH NO DEAL',
    body: 'ANTALYA: EU AND ABOUT 130 PARTIES REJECT A TEXT WITH NO FOSSIL-FUEL PHASE-OUT AFTER TWO DAYS OF OVERTIME.',
  },
  {
    category: 'POLITICS',
    color: [29, 78, 158],
    icon: iconBallot,
    headline: 'DEMOCRATS TAKE THE HOUSE',
    body: 'DEMOCRATS WIN 258 US HOUSE SEATS, THE LARGEST MAJORITY SINCE 1992 (AP).',
  },
  {
    category: 'CONFLICT',
    color: [140, 29, 24],
    icon: iconShip,
    headline: 'UKRAINIAN DRONES SINK RUSSIAN CORVETTE',
    body: 'NAVAL DRONES SINK THE RUSSIAN CORVETTE MERKURY OFF BENGHAZI, LIBYA.',
  },
  {
    category: 'MARKETS',
    color: [180, 83, 9],
    icon: iconChart,
    headline: 'AI SELL-OFF HITS MARKETS',
    body: "JAPAN'S NIKKEI FALLS 5.06%; THE S&P 500 IS DOWN 3.7%.",
  },
  {
    category: 'DISASTER',
    color: [107, 33, 168],
    icon: iconFactory,
    headline: 'CANDY FACTORY FIRE IN BANTEN',
    body: 'AT LEAST 24 DEAD AND ABOUT 30 MISSING IN BANTEN, INDONESIA.',
  },
  {
    category: 'SPORT',
    color: [22, 101, 52],
    icon: iconTrophy,
    headline: 'MARQUEZ WINS EIGHTH MOTOGP TITLE',
    body: 'MARQUEZ EQUALS AGOSTINI WITH THE WIN AT PORTIMAO.',
  },
];

// -------------------------------------------------------------- layout ------
function drawPanel(x: number, y: number, w: number, h: number, s: Story): void {
  fillRect(x, y, w, h, WHITE);
  rectBorder(x, y, w, h, 2, INK);
  // category strip
  fillRect(x + 2, y + 2, w - 4, 34, s.color);
  drawText(s.category, x + 14, y + 11, 2, WHITE);
  // icon box, top right
  const ix = x + w - 16 - 60;
  const iy = y + 44;
  fillRect(ix, iy, 60, 60, TINT);
  rectBorder(ix, iy, 60, 60, 2, s.color);
  s.icon(ix + 30, iy + 30, s.color);
  // headline, scale 3, wrapped to 16 chars (icon leaves 384 px)
  const headLines = wrap(s.headline, 16);
  for (let i = 0; i < headLines.length; i++) {
    drawText(headLines[i], x + 16, y + 48 + i * 30, 3, INK);
  }
  // body, scale 2, wrapped to 28 chars, fixed position so panels align
  const bodyLines = wrap(s.body, 28);
  for (let i = 0; i < bodyLines.length; i++) {
    drawText(bodyLines[i], x + 16, y + 150 + i * 20, 2, INK);
  }
}

function main(): void {
  fillRect(0, 0, W, H, PAPER);
  rectBorder(8, 8, W - 16, H - 16, 3, INK);

  // masthead
  drawTextCentered("THE DAY'S NEWS FROM AROUND THE WORLD", W / 2, 38, 2, INK);
  drawTextCentered('THE WORLD IN ONE DAY', W / 2, 68, 5, INK);
  fillRect(32, 122, W - 64, 6, RED);
  drawTextCentered('MONDAY 23 NOVEMBER 2026', W / 2, 138, 4, RED);
  fillRect(32, 178, W - 64, 3, INK);

  // six stories, 2 columns x 3 rows
  const panelW = 488;
  const panelH = 248;
  for (let i = 0; i < STORIES.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    drawPanel(16 + col * (panelW + 16), 194 + row * (panelH + 14), panelW, panelH, STORIES[i]);
  }

  // footer
  drawTextCentered('SOURCES: AP, REUTERS, XINHUA - 23 NOV 2026', W / 2, 974, 2, INK);

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'entry.png'), encodePNG());
}

main();
