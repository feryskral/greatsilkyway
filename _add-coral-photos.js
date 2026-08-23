// Prida fotky stenete Coral do galerie: opatri je bilym logem, ulozi
// do projektu a zaradi do alba "coral".
//
// Puvodni fotky na plose zustavaji nedotcene - pracuje se s kopiemi.
// Rozmery loga podle konvence webu (_apply-logo-all.mjs): sirka 18 %,
// odsazeni 3 %, kryti 85 %.

const sharp = require('./node_modules/sharp');
const fs = require('fs');
const path = require('path');

const ZDROJ = 'C:/Users/fery/Desktop/Coral';
const LOGO = 'logo-white.png';
const ALBUM = 'coral';
const POPIS = 'Coral';

const LOGO_SIRKA = 0.18;     // podil sirky fotky
const ODSAZENI = 0.03;
const KRYTI = 0.85;
const MAX_ROZMER = 1600;     // stejne jako zmensuje admin pri nahrani

(async () => {
  if (!fs.existsSync(ZDROJ)) throw new Error('Nenasel jsem slozku ' + ZDROJ);
  const soubory = fs.readdirSync(ZDROJ).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  if (!soubory.length) throw new Error('Ve slozce nejsou zadne fotky');

  const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
  const album = (content.puppyAlbums || []).find(a => a.slug === ALBUM);
  if (!album) throw new Error('Album "' + ALBUM + '" v content.json neexistuje');

  // Kolik fotek uz album ma - navazat cislovanim
  let poradi = content.gallery.filter(g => g.album === ALBUM).length;
  const pridane = [];

  for (const src of soubory) {
    const vstup = path.join(ZDROJ, src);
    const zaklad = await sharp(vstup)
      .rotate()                                   // srovnat podle EXIF
      .resize({ width: MAX_ROZMER, height: MAX_ROZMER, fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    const m = await sharp(zaklad).metadata();

    // Logo: sirka podle fotky, snizene kryti
    const logoS = Math.round(m.width * LOGO_SIRKA);
    const logoZaklad = await sharp(LOGO)
      .resize({ width: logoS })
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(255 * KRYTI)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      }])
      .png()
      .toBuffer();

    // Jemny tmavy stin pod logem - bez nej se bile logo ztraci na svetle srsti
    const zm = await sharp(logoZaklad).metadata();
    const stin = await sharp(logoZaklad)
      .composite([{
        input: Buffer.from([0, 0, 0, 255]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'in',                       // prevzit tvar loga, obarvit na cerno
      }])
      .blur(Math.max(2, logoS * 0.018))
      .png()
      .toBuffer();

    const logo = await sharp({
      create: { width: zm.width, height: zm.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        { input: stin, blend: 'over' },
        { input: stin, blend: 'over' },     // dvakrat = vyraznejsi podklad
        { input: logoZaklad, blend: 'over' },
      ])
      .png()
      .toBuffer();
    const lm = await sharp(logo).metadata();

    const okraj = Math.round(m.width * ODSAZENI);
    const nazev = 'foto-coral-' + (++poradi) + '.jpg';

    await sharp(zaklad)
      .composite([{ input: logo, left: okraj, top: m.height - lm.height - okraj }])  // levy dolni roh
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(nazev);

    pridane.push(nazev);
    console.log('  ' + src.slice(0, 16) + '…  ->  ' + nazev.padEnd(20) +
                m.width + 'x' + m.height + '  ' + Math.round(fs.statSync(nazev).size / 1024) + ' KB');
  }

  // Zaradit do galerie k albu Coral
  for (const nazev of pridane) {
    content.gallery.push({
      caption: POPIS, captionEn: POPIS,
      category: 'stenata', album: ALBUM,
      photo: nazev, wide: false, objectPosition: 'center top',
    });
  }
  fs.writeFileSync('content.json', JSON.stringify(content, null, 2));

  console.log('');
  console.log('Pridano do alba "' + album.name + '": ' + pridane.length + ' fotek');
  console.log('Album ma nyni celkem: ' + content.gallery.filter(g => g.album === ALBUM).length + ' fotek');
  console.log('Puvodni fotky na plose zustaly nezmenene.');
})().catch(e => { console.error('CHYBA: ' + e.message); process.exit(1); });
