// Testovací aplikace loga do levého dolního rohu fotky
import { Jimp } from 'jimp';

const TARGET = 'foto-chovatelka.jpg';
const OUTPUT = 'foto-chovatelka_logo_test.jpg';
const LOGO_DARK = 'great-logo.png';   // tmavé logo pro světlé pozadí
const LOGO_LIGHT = 'logo-white.png';  // světlé logo pro tmavé pozadí

const LOGO_WIDTH_RATIO = 0.18; // logo = 18 % šířky fotky
const MARGIN_RATIO = 0.03;     // odsazení 3 %
const OPACITY = 0.85;

const img = await Jimp.read(TARGET);
const W = img.bitmap.width;
const H = img.bitmap.height;

const logoW = Math.round(W * LOGO_WIDTH_RATIO);
const marginX = Math.round(W * MARGIN_RATIO);
const marginY = Math.round(H * MARGIN_RATIO);

// Odhadnout výšku loga (potřebujeme poměr) - načteme jedno logo
const probe = await Jimp.read(LOGO_DARK);
const logoH = Math.round(logoW * (probe.bitmap.height / probe.bitmap.width));

// Oblast pod logem - vzorkuj jas
const x0 = marginX;
const y0 = H - marginY - logoH;
let sum = 0, n = 0;
img.scan(x0, y0, logoW, logoH, function (x, y, idx) {
  const r = this.bitmap.data[idx];
  const g = this.bitmap.data[idx + 1];
  const b = this.bitmap.data[idx + 2];
  sum += 0.299 * r + 0.587 * g + 0.114 * b;
  n++;
});
const avgLuma = sum / n;
console.log(`Průměrný jas pod logem: ${avgLuma.toFixed(1)} / 255`);

const useLight = avgLuma < 128;
const chosen = useLight ? LOGO_LIGHT : LOGO_DARK;
console.log(`Vybráno logo: ${chosen} (${useLight ? 'světlé — tmavé pozadí' : 'tmavé — světlé pozadí'})`);

const logo = await Jimp.read(chosen);
logo.resize({ w: logoW });

// Opacity
logo.scan(0, 0, logo.bitmap.width, logo.bitmap.height, function (x, y, idx) {
  this.bitmap.data[idx + 3] = Math.round(this.bitmap.data[idx + 3] * OPACITY);
});

img.composite(logo, marginX, H - marginY - logo.bitmap.height);
await img.write(OUTPUT);
console.log(`✓ Uloženo: ${OUTPUT}`);
