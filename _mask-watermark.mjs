// Maskování vodoznaku "Fotky od Lucky" - patch-based inpainting
// Zkopíruje čistou oblast z vedlejší části obrázku přes watermark.

import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

// Mapa: soubor -> { wm: [x1%, y1%, x2%, y2%], src: 'left'|'right'|'up'|'down', offset: 0..1 }
// wm   = oblast watermarku jako procenta šířky/výšky
// src  = odkud zkopírovat čistý patch
// offset = jak daleko od watermarku (jako procento šířky/výšky) zdroj vzít
const WATERMARKS = {
  'Lari1.jpg':  { wm: [0.78, 0.02, 1.0,  0.16], src: 'left', offset: 0.23 },
  'York1.jpg':  { wm: [0.80, 0.02, 1.0,  0.15], src: 'left', offset: 0.22 },
  'York2.jpg':  { wm: [0.83, 0.00, 1.0,  0.22], src: 'left', offset: 0.19 },
  'York3.jpg':  { wm: [0.81, 0.02, 1.0,  0.15], src: 'left', offset: 0.20 },
  'York4.jpg':  { wm: [0.80, 0.02, 1.0,  0.15], src: 'left', offset: 0.22 },
  'York5.jpg':  { wm: [0.80, 0.00, 1.0,  0.18], src: 'left', offset: 0.22 },
  'foto-chovatelka.jpg': { wm: [0.78, 0.00, 1.0, 0.11], src: 'down', offset: 0.12 },
};

async function maskWatermark(filePath, cfg) {
  const img = await Jimp.read(filePath);
  const W = img.bitmap.width;
  const H = img.bitmap.height;
  const [x1r, y1r, x2r, y2r] = cfg.wm;
  const x1 = Math.floor(W * x1r);
  const y1 = Math.floor(H * y1r);
  const x2 = Math.ceil(W * x2r);
  const y2 = Math.ceil(H * y2r);
  const w = x2 - x1;
  const h = y2 - y1;

  // Vypočítat souřadnice zdrojového patche
  let sx = x1, sy = y1;
  if (cfg.src === 'left')  sx = Math.max(0, x1 - Math.floor(W * cfg.offset));
  if (cfg.src === 'right') sx = Math.min(W - w, x2 + Math.floor(W * cfg.offset) - w);
  if (cfg.src === 'up')    sy = Math.max(0, y1 - Math.floor(H * cfg.offset));
  if (cfg.src === 'down')  sy = Math.min(H - h, y2 + Math.floor(H * cfg.offset) - h);

  // Vytvořit čistý patch ze zdrojové pozice
  const patch = img.clone().crop({ x: sx, y: sy, w, h });

  // Feather (jemné prolnutí okrajů) - vytvořit masku s měkkými okraji
  const feather = 25;
  const mask = new Jimp({ width: w, height: h, color: 0x000000ff });
  // Vyplnit mask gradientem (1 uvnitř, 0 na okrajích)
  mask.scan(0, 0, w, h, function (x, y, idx) {
    const dEdge = Math.min(x, y, w - x - 1, h - y - 1);
    const alpha = Math.min(255, Math.max(0, Math.round((dEdge / feather) * 255)));
    this.bitmap.data[idx + 0] = 255;
    this.bitmap.data[idx + 1] = 255;
    this.bitmap.data[idx + 2] = 255;
    this.bitmap.data[idx + 3] = alpha;
  });

  // Aplikovat masku na patch (nastaví alpha podle masky)
  patch.scan(0, 0, w, h, function (x, y, idx) {
    this.bitmap.data[idx + 3] = mask.bitmap.data[idx + 3];
  });

  // Nakompilovat s alfou = prolnutí
  img.composite(patch, x1, y1);

  // Mírný blur celé oblasti pro maskování jemných přechodů
  const blurArea = img.clone().crop({
    x: Math.max(0, x1 - 10),
    y: Math.max(0, y1 - 10),
    w: Math.min(W, w + 20),
    h: Math.min(H, h + 20)
  });
  blurArea.blur(3);
  img.composite(blurArea, Math.max(0, x1 - 10), Math.max(0, y1 - 10));

  await img.write(filePath);
  console.log(`✓ Maskováno: ${filePath}`);
  console.log(`  WM: ${x1},${y1} ${w}×${h} | zdroj: ${cfg.src}@${sx},${sy}`);
}

async function main() {
  const filter = process.argv[2]; // optional: process only this file
  for (const [file, cfg] of Object.entries(WATERMARKS)) {
    if (filter && file !== filter) continue;
    if (fs.existsSync(file)) {
      await maskWatermark(file, cfg);
    } else {
      console.log(`⚠️  Nenalezeno: ${file}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
