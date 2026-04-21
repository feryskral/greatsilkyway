// Aplikuje logo do levého dolního rohu všech fotek odkazovaných v HTML.
// Automaticky vybere světlé/tmavé logo podle jasu oblasti pod logem.
// Přepisuje originály - záloha je v gitu.
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const DIR = 'C:/Users/fery/chatobrian-wisdom';
const LOGO_DARK = path.join(DIR, 'great-logo.png');
const LOGO_LIGHT = path.join(DIR, 'logo-white.png');
const SKIP = new Set(['great-logo.png', 'logo-white.png', 'logo.jpg']);

const LOGO_WIDTH_RATIO = 0.18;
const MARGIN_RATIO = 0.03;
const OPACITY = 0.85;

// Přepisy: tyto fotky mají tmavé logo v horním levém rohu místo bílého dole.
const OVERRIDES = {
  'vystavni_fotka.jpg': { variant: 'dark', pos: 'top-left' },
  'ultimate_1.jpg':     { variant: 'dark', pos: 'top-left' },
  'ultimate_2.jpg':     { variant: 'dark', pos: 'top-left' },
  'Citrine.jpg':        { variant: 'dark', pos: 'top-left' },
  'Coral.jpg':          { variant: 'dark', pos: 'top-left' },
  'Barron_1.jpg':       { variant: 'dark', pos: 'top-left' },
  'Barron_2.jpg':       { variant: 'dark', pos: 'top-left' },
  'Barron_3.jpg':       { variant: 'dark', pos: 'top-left' },
  'York1.jpg':          { variant: 'dark', pos: 'top-left' },
  'York3.jpg':          { variant: 'dark', pos: 'top-left' },
  'York4.jpg':          { variant: 'dark', pos: 'top-left' },
  'York5.jpg':          { variant: 'dark', pos: 'top-left' },
  'topfoto.jpg':        { variant: 'dark', pos: 'top-left' },
  'c0bc6276-63e4-45cd-9093-7282fb8b5bfc.jpg': { variant: 'dark', pos: 'top-left' },
  'dcb54419-effe-4af7-afd3-37114aaa9727.jpg': { variant: 'dark', pos: 'top-left' },
  '058bb08c-6396-4109-a50a-852d10f33263.jpg': { variant: 'dark', pos: 'top-left' },
  '2184623e-a27b-46d1-acd1-f30c1601d9b3.jpg': { variant: 'dark', pos: 'top-left' },
  '396b7244-1dbc-47ca-b1d6-f8e8c6ad2e24.jpg': { variant: 'dark', pos: 'top-left' },
  '39f3bec8-2275-4b2d-a6d2-f23404abfa82.jpg': { variant: 'dark', pos: 'top-left' },
  '598149e8-da3c-4488-b60f-f64a9a28ef31.jpg': { variant: 'dark', pos: 'top-left' },
  '969cf9f2-337c-4355-8183-b4fffb3832f9.jpg': { variant: 'dark', pos: 'top-left' },
  '9db38f3c-3412-43f5-9bbe-c524b5d12e64.jpg': { variant: 'dark', pos: 'top-left' },
  'a5f4d1b6-341f-4f81-986c-b8a4de51ad6e.jpg': { variant: 'dark', pos: 'top-left' },
  'e4ed64f6-55c0-4b0b-a1ba-c6abc5f4dff7.jpg': { variant: 'dark', pos: 'top-left' },
  '01500af5-a0a4-4807-92a8-fb1d67e32d2a.jpg': { variant: 'dark', pos: 'top-left' },
  '2a14fcc4-7cfb-4855-b555-1805e1f458ec.jpg': { variant: 'dark', pos: 'top-left' },
  '3e73579c-47cc-4c8e-8a69-af6462236053.jpg': { variant: 'dark', pos: 'top-left' },
  '56b0b3a5-9999-406c-8552-c4d546163dec.jpg': { variant: 'dark', pos: 'top-left' },
  '71efe63f-d4b6-4b6b-a0a9-8d496e4eddb0.jpg': { variant: 'dark', pos: 'top-left' },
  '9190f211-e86d-4eb8-bb7b-74b02e247228.jpg': { variant: 'dark', pos: 'top-left' },
  'bfd67bd6-a1bc-488b-9be8-2c9582106c43.jpg': { variant: 'dark', pos: 'top-left' },
  '0dd5dcf3-c2c6-4496-ac4b-2d54ce6410d2.jpg': { variant: 'dark', pos: 'top-left' },
  '1ffaf9ae-f79c-452f-b563-f2abcef06400.jpg': { variant: 'dark', pos: 'top-left' },
  '2b487db9-280d-4cf8-aaee-99f259c6b146.jpg': { variant: 'dark', pos: 'top-left' },
  '93bd674d-990e-473e-89e8-c274205daeab.jpg': { variant: 'dark', pos: 'top-left' },
  'b6476018-3fa9-4742-9042-96954266c836.jpg': { variant: 'dark', pos: 'top-left' },
  'c5b7f4be-68eb-4008-ad13-716dc24d43fc.jpg': { variant: 'dark', pos: 'top-left' },
  '7f30869d-c3d9-4c62-9981-3b4555f13cc7.jpg': { variant: 'dark', pos: 'top-left' },
};

// Posbírej všechny obrázky z HTML
const htmls = fs.readdirSync(DIR).filter(f => f.endsWith('.html'));
const files = new Set();
const rx = /src=["']([^"']+\.(?:jpg|jpeg|png))["']/gi;
for (const h of htmls) {
  const text = fs.readFileSync(path.join(DIR, h), 'utf8');
  let m;
  while ((m = rx.exec(text))) {
    const src = m[1];
    if (src.includes('/')) continue; // skip tituly-oxygen/...
    if (SKIP.has(src)) continue;
    if (src.toLowerCase().endsWith('.png')) continue; // loga jen
    files.add(src);
  }
}

const sorted = [...files].sort();
console.log(`Zpracuji ${sorted.length} fotek.`);

// Předem načti loga + jejich poměr stran
const darkProbe = await Jimp.read(LOGO_DARK);
const lightProbe = await Jimp.read(LOGO_LIGHT);
const darkRatio = darkProbe.bitmap.height / darkProbe.bitmap.width;
const lightRatio = lightProbe.bitmap.height / lightProbe.bitmap.width;

let done = 0, skipped = 0, failed = 0;
for (const file of sorted) {
  const fp = path.join(DIR, file);
  if (!fs.existsSync(fp)) { console.log(`⚠️  ${file} — neexistuje`); skipped++; continue; }
  try {
    const img = await Jimp.read(fp);
    const W = img.bitmap.width;
    const H = img.bitmap.height;

    const logoW = Math.round(W * LOGO_WIDTH_RATIO);
    const marginX = Math.round(W * MARGIN_RATIO);
    const marginY = Math.round(H * MARGIN_RATIO);

    // předpokládej výšku podle tmavého loga pro sampling oblasti
    const probeH = Math.round(logoW * darkRatio);
    const x0 = marginX;
    const y0 = H - marginY - probeH;

    let sum = 0, sR = 0, sG = 0, sB = 0, n = 0;
    img.scan(x0, y0, logoW, probeH, function (x, y, idx) {
      const r = this.bitmap.data[idx];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      sR += r; sG += g; sB += b;
      n++;
    });
    const avgLuma = sum / n;
    const avgR = sR / n, avgG = sG / n, avgB = sB / n;
    // Pokud převažuje červená, raději tmavé logo (bílé se na červené ztrácí)
    const redDominant = avgR > 90 && avgR > avgG * 1.4 && avgR > avgB * 1.4;
    const override = OVERRIDES[file];
    const useLight = override ? override.variant === 'light' : true;

    const chosenPath = useLight ? LOGO_LIGHT : LOGO_DARK;
    const logo = (useLight ? lightProbe : darkProbe).clone();
    logo.resize({ w: logoW });

    logo.scan(0, 0, logo.bitmap.width, logo.bitmap.height, function (x, y, idx) {
      this.bitmap.data[idx + 3] = Math.round(this.bitmap.data[idx + 3] * OPACITY);
    });

    const pos = override?.pos || 'bottom-left';
    const px = pos.includes('right') ? W - marginX - logo.bitmap.width : marginX;
    const py = pos.includes('top') ? marginY : H - marginY - logo.bitmap.height;
    img.composite(logo, px, py);
    await img.write(fp);
    done++;
    console.log(`✓ ${file} — logo ${useLight ? 'bílé' : 'tmavé'} @ ${pos}`);
  } catch (e) {
    failed++;
    console.log(`✗ ${file} — ${e.message}`);
  }
}
console.log(`\nHotovo: ${done} OK, ${skipped} přeskočeno, ${failed} chyb.`);
