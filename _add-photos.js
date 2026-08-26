// Prida davku fotek do galerie: opatri je bilym logem, ulozi do projektu
// a zaradi do zvoleneho alba.
//
// Puvodni fotky ve zdrojove slozce zustavaji nedotcene - pracuje se s kopiemi.
// Rozmery loga podle konvence webu (_apply-logo-all.mjs): sirka 18 %,
// odsazeni 3 %, kryti 85 %. Pod logo se prida jemny stin, jinak se bila
// na svetlem podkladu ztraci.
//
// Pouziti:
//   node _add-photos.js --dir "C:/cesta/ke/slozce" --album senorita [--soubor foto-senorita]
//   node _add-photos.js --dir ... --album coral --pozice "center top"
//
// Album se najde podle slugu v dogAlbums i puppyAlbums, kategorie se
// odvodi sama. Soubor zacina podtrzitkem, takze se pri FTP nenahrava.

const sharp = require('./node_modules/sharp');
const fs = require('fs');
const path = require('path');

const LOGO = 'logo-white.png';
const LOGO_SIRKA = 0.18;
const ODSAZENI = 0.03;
const KRYTI = 1.0;      // plne bile - na hnede dece bylo 0,85 prilis bledé
const MAX_ROZMER = 1600;

const args = process.argv.slice(2);
const arg = (n, def) => { const i = args.indexOf('--' + n); return i >= 0 ? args[i + 1] : def; };

const ZDROJ = arg('dir');
const ALBUM = arg('album');
const POZICE = arg('pozice', 'center center');
const PREFIX = arg('soubor');

if (!ZDROJ || !ALBUM) {
  console.error('Pouziti: node _add-photos.js --dir "<slozka>" --album <slug> [--pozice "center top"] [--soubor <prefix>]');
  process.exit(1);
}

const slug = s => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

(async () => {
  if (!fs.existsSync(ZDROJ)) throw new Error('Nenasel jsem slozku ' + ZDROJ);
  const soubory = fs.readdirSync(ZDROJ).filter(f => /\.(jpe?g|png)$/i.test(f)).sort();
  if (!soubory.length) throw new Error('Ve slozce nejsou zadne fotky');

  const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

  // Album muze byt u psu i u stenat - podle toho se lisi kategorie
  let album = (content.dogAlbums || []).find(a => a.slug === ALBUM);
  let kategorie = 'psi';
  if (!album) {
    album = (content.puppyAlbums || []).find(a => a.slug === ALBUM);
    kategorie = 'stenata';
  }
  if (!album) throw new Error('Album "' + ALBUM + '" v content.json neexistuje');

  const zaklad = PREFIX || ('foto-' + slug(album.slug));
  let poradi = content.gallery.filter(g => g.album === ALBUM).length;
  const pridane = [];

  for (const src of soubory) {
    const puvodni = await sharp(path.join(ZDROJ, src))
      .rotate()                                   // srovnat podle EXIF
      .resize({ width: MAX_ROZMER, height: MAX_ROZMER, fit: 'inside', withoutEnlargement: true })
      .toBuffer();
    const m = await sharp(puvodni).metadata();

    const logoS = Math.round(m.width * LOGO_SIRKA);
    const logoZaklad = await sharp(LOGO)
      .resize({ width: logoS })
      .composite([{
        input: Buffer.from([255, 255, 255, Math.round(255 * KRYTI)]),
        raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'dest-in',
      }])
      .png().toBuffer();

    // Tmavy stin, aby bilé logo drzelo i na svetlem podkladu
    const zm = await sharp(logoZaklad).metadata();
    const stin = await sharp(logoZaklad)
      .composite([{
        input: Buffer.from([0, 0, 0, 255]),
        raw: { width: 1, height: 1, channels: 4 }, tile: true, blend: 'in',
      }])
      .blur(Math.max(2, logoS * 0.018))
      .png().toBuffer();

    const logo = await sharp({
      create: { width: zm.width, height: zm.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        { input: stin, blend: 'over' },
        { input: stin, blend: 'over' },
        { input: stin, blend: 'over' },
        { input: logoZaklad, blend: 'over' },
      ])
      .png().toBuffer();
    const lm = await sharp(logo).metadata();

    const okraj = Math.round(m.width * ODSAZENI);
    let nazev;
    do { nazev = zaklad + '-' + (++poradi) + '.jpg'; } while (fs.existsSync(nazev));

    await sharp(puvodni)
      .composite([{ input: logo, left: okraj, top: m.height - lm.height - okraj }])
      .jpeg({ quality: 88, mozjpeg: true })
      .toFile(nazev);

    pridane.push(nazev);
    console.log('  ' + src.slice(0, 14) + '…  ->  ' + nazev.padEnd(24) +
                m.width + 'x' + m.height + '  ' + Math.round(fs.statSync(nazev).size / 1024) + ' KB');
  }

  for (const nazev of pridane) {
    content.gallery.push({
      caption: album.name, captionEn: album.nameEn || album.name,
      category: kategorie, album: ALBUM,
      photo: nazev, wide: false, objectPosition: POZICE,
    });
  }
  fs.writeFileSync('content.json', JSON.stringify(content, null, 2));

  console.log('');
  console.log('Pridano do alba "' + album.name + '" (' + kategorie + '): ' + pridane.length + ' fotek');
  console.log('Album ma nyni celkem: ' + content.gallery.filter(g => g.album === ALBUM).length + ' fotek');
  console.log('Puvodni fotky ve zdrojove slozce zustaly nezmenene.');
})().catch(e => { console.error('CHYBA: ' + e.message); process.exit(1); });
