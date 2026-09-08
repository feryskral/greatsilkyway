const sharp = require('C:/Users/fery/chatobrian-wisdom/node_modules/sharp');
const fs = require('fs');
const ROOT = 'C:/Users/fery/chatobrian-wisdom/';
const OUT = __dirname + "/_google-banner.jpg";

const W = 1600, H = 900;
const NAVY = '#16223C', NAVY2 = '#0C1322', GOLD = '#D8A73E';

// Vyrezy hlav v pomeru dlazdice (300x380 = 0.79)
const psi = [
  { f: 'York1.jpg',        left: 350, top: 190, w: 600, h: 760 },
  { f: 'topfoto.jpg',      left: 280, top: 200, w: 600, h: 760 },
  { f: 'oxygen_foto2.png', left: 150, top: 100, w: 710, h: 900 },
  { f: 'pes-matteo.jpg',   left: 149, top: 300, w: 442, h: 560 },
];

const TW = 300, TH = 380, GAP = 24;
const GX = 880, GY = 90;   // levy horni roh mrizky dlazdic

const pozice = [
  [GX, GY], [GX + TW + GAP, GY],
  [GX, GY + TH + GAP], [GX + TW + GAP, GY + TH + GAP],
];

const pozadi = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${NAVY}"/>
      <stop offset="1" stop-color="${NAVY2}"/>
    </linearGradient>
    <radialGradient id="z">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1400" cy="40" r="560" fill="url(#z)"/>
</svg>`;

const roh = (w, h, r) =>
  Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${w}" height="${h}" rx="${r}" ry="${r}" fill="#fff"/></svg>`);

const texty = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <style>
    .h { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 700; font-size: 62px; fill: #FFFFFF; }
    .s { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 400; font-size: 27px; fill: #B9C0D0; }
    .b { font-family: 'Segoe UI', Arial, sans-serif; font-weight: 600; font-size: 26px; fill: ${NAVY}; }
  </style>
  <text class="h" x="90" y="432">Yorkshire teriéři</text>
  <text class="h" x="90" y="508">s průkazem FCI</text>
  <text class="s" x="90" y="570">Odchovaní s láskou v rodinném prostředí</text>
  <rect x="90" y="614" width="330" height="64" rx="32" fill="${GOLD}"/>
  <text class="b" x="255" y="654" text-anchor="middle">greatsilkyway.cz</text>
</svg>`;

(async () => {
  const vrstvy = [];

  for (let i = 0; i < psi.length; i++) {
    const p = psi[i];
    const dlazdice = await sharp(ROOT + p.f)
      .extract({ left: p.left, top: p.top, width: p.w, height: p.h })
      .resize(TW, TH, { fit: 'cover' })
      .composite([{ input: roh(TW, TH, 22), blend: 'dest-in' }])
      .png()
      .toBuffer();
    vrstvy.push({ input: dlazdice, left: pozice[i][0], top: pozice[i][1] });
  }

  const logo = await sharp(ROOT + 'logo-white.png').resize({ width: 184 }).png().toBuffer();
  vrstvy.push({ input: logo, left: 90, top: 104 });
  vrstvy.push({ input: Buffer.from(texty), left: 0, top: 0 });

  await sharp(Buffer.from(pozadi))
    .composite(vrstvy)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(OUT);

  console.log('hotovo: ' + W + 'x' + H + ', ' + (fs.statSync(OUT).size / 1024).toFixed(0) + ' kB');
})();
