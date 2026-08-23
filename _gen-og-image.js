// Generator nahledoveho obrazku pro sdileni na socialnich sitich (Open Graph).
//
// Bez nej ukaze Facebook, Instagram i WhatsApp u odkazu jen holou adresu.
// Rozmer 1200x630 je to, co site ocekavaji.
//
// Zamerne BEZ poctu stenat - obrazek je staticky soubor a poctu se meni,
// takze by casem lhal. Drzi se toho, co plati vzdy.
//
// Pouziti: node _gen-og-image.js
// Soubor zacina podtrzitkem, takze se pri FTP synchronizaci nenahrava.

const sharp = require('./node_modules/sharp');
const fs = require('fs');

const W = 1200, H = 630;
const GOLD = '#C9933A', GOLD_LIGHT = '#E8B96A', NAVY_MID = '#2E4070';
const FONT = 'Segoe UI, Tahoma, Verdana, sans-serif';
const OUT = 'og-image.jpg';

// Fotky do kolaze - vezmou se prvni dostupne ze seznamu
const KANDIDATI = ['Citrine.jpg', 'stene-dolores.jpg', 'stene-dolce-vita.jpg', 'Coral.jpg'];

(async () => {
  const fotky = KANDIDATI.filter(f => fs.existsSync(f)).slice(0, 3);
  if (!fotky.length) throw new Error('Nenasel jsem zadnou fotku pro kolaz');

  const PANEL_X = 700;                      // odtud vpravo jsou fotky
  const svg = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#16223F"/><stop offset="60%" stop-color="${NAVY_MID}"/><stop offset="100%" stop-color="#3A4E80"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${GOLD}"/><stop offset="50%" stop-color="${GOLD_LIGHT}"/><stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="url(#gold)"/>

  <text x="72" y="150" font-family="${FONT}" font-size="34" font-weight="700"
        fill="${GOLD_LIGHT}" letter-spacing="6">GREAT SILKYWAY</text>
  <text x="72" y="192" font-family="${FONT}" font-size="21" fill="rgba(255,255,255,0.72)"
        letter-spacing="4">YORKSHIRE TERRIER KENNEL</text>

  <text x="72" y="292" font-family="${FONT}" font-size="60" font-weight="700" fill="#ffffff">Yorkshire teriéři</text>
  <text x="72" y="364" font-family="${FONT}" font-size="60" font-weight="700" fill="${GOLD_LIGHT}">s průkazem FCI</text>

  <text x="72" y="428" font-family="${FONT}" font-size="26" fill="rgba(255,255,255,0.8)">Odchovaní s láskou v rodinném prostředí</text>

  <rect x="72" y="486" width="430" height="76" rx="38" fill="url(#gold)"/>
  <text x="287" y="536" font-family="${FONT}" font-size="35" font-weight="700"
        fill="#16223F" text-anchor="middle">greatsilkyway.cz</text>
</svg>`);

  const vrstvy = [];

  // Kolaz vpravo: tri fotky na vysku vedle sebe, mirne zaoblene
  const mezera = 12;
  const sirka = Math.floor((W - PANEL_X - 48 - mezera * 2) / 3);
  const vyska = 400;
  const top = Math.round((H - vyska) / 2);
  for (let i = 0; i < fotky.length; i++) {
    const foto = await sharp(fotky[i]).resize(sirka, vyska, { fit: 'cover', position: 'centre' }).toBuffer();
    const maska = Buffer.from(
      `<svg width="${sirka}" height="${vyska}" xmlns="http://www.w3.org/2000/svg">
         <rect width="${sirka}" height="${vyska}" rx="16" fill="#fff"/>
       </svg>`);
    vrstvy.push({
      input: await sharp(foto).composite([{ input: maska, blend: 'dest-in' }]).png().toBuffer(),
      left: PANEL_X + 24 + i * (sirka + mezera),
      top,
    });
  }

  await sharp(svg).composite(vrstvy).jpeg({ quality: 88, mozjpeg: true }).toFile(OUT);
  const m = await sharp(OUT).metadata();
  console.log(OUT + '  ' + m.width + 'x' + m.height + '  ' + Math.round(fs.statSync(OUT).size / 1024) + ' KB');
  console.log('fotky v koláži: ' + fotky.join(', '));
})().catch(e => { console.error('CHYBA:', e.message); process.exit(1); });
