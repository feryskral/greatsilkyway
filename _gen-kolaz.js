const sharp = require('C:/Users/fery/chatobrian-wisdom/node_modules/sharp');
const path = require('path');
const SP = __dirname;
const ROOT = 'C:/Users/fery/chatobrian-wisdom/';

const W = 1600, H = 900, MEZERA = 8;
const PW = Math.floor((W - 3 * MEZERA) / 4);   // sirka jednoho panelu
const NAVY = { r: 0x16, g: 0x22, b: 0x3C };

// Vyrezy volene tak, aby hlava byla v panelu podobne velka u vsech ctyr
// a aby se vynechal vodoznak v levem hornim rohu.
const psi = [
  { f: 'York1.jpg',        jm: 'Senorita', left: 409, top: 180, w: 482, h: 1100 },
  { f: 'topfoto.jpg',      jm: 'Michelle', left: 339, top: 220, w: 482, h: 1100 },
  { f: 'oxygen_foto2.png', jm: 'Oxygen',   left: 198, top:  60, w: 613, h: 1400 },
  { f: 'pes-matteo.jpg',   jm: 'Matteo',   left: 218, top: 380, w: 302, h:  690 },
];

(async () => {
  const vrstvy = [];
  for (let i = 0; i < psi.length; i++) {
    const p = psi[i];
    const meta = await sharp(ROOT + p.f).metadata();
    // Pojistka, aby vyrez nepretekl z originalu
    const left = Math.max(0, Math.min(p.left, meta.width - 1));
    const top = Math.max(0, Math.min(p.top, meta.height - 1));
    const w = Math.min(p.w, meta.width - left);
    const h = Math.min(p.h, meta.height - top);

    const panel = await sharp(ROOT + p.f)
      .extract({ left, top, width: w, height: h })
      .resize(PW, H, { fit: 'cover', position: 'top' })
      .flatten({ background: NAVY })
      .toBuffer();

    vrstvy.push({ input: panel, left: i * (PW + MEZERA), top: 0 });
    console.log('  ' + p.jm.padEnd(10) + p.f.padEnd(20) + 'vyrez ' + w + 'x' + h +
                ' (pomer ' + (w / h).toFixed(2) + ') -> panel ' + PW + 'x' + H);
  }

  await sharp({ create: { width: W, height: H, channels: 3, background: NAVY } })
    .composite(vrstvy)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(SP + '/google-titulni-kolaz.jpg');

  const fs = require('fs');
  console.log('\nhotovo: ' + W + 'x' + H + ', ' +
              (fs.statSync(SP + '/google-titulni-kolaz.jpg').size / 1024).toFixed(0) + ' kB');
  console.log('panel ' + PW + ' px, mezera ' + MEZERA + ' px, celkem ' + (PW * 4 + MEZERA * 3) + ' px');
})();
