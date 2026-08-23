// Generator nahledu pro galerii.
//
// Puvodni fotky ZUSTAVAJI nedotcene - vznikaji jen zmensene kopie ve
// slozce thumbs/. V mrizce galerie se zobrazi nahled, po kliknuti se
// otevre puvodni fotka v plne kvalite.
//
// Pouziti:
//   node _gen-thumbs.js --album matteo     ... jen jedno album
//   node _gen-thumbs.js --all              ... vsechny fotky galerie
//   node _gen-thumbs.js --revert           ... odstrani odkazy na nahledy
//
// Soubor zacina podtrzitkem, takze se pri FTP synchronizaci nenahrava.

const sharp = require('./node_modules/sharp');
const fs = require('fs');
const path = require('path');

const WIDTH = 920;      // pokryje i retina displeje (mrizka zobrazuje ~460 px)
const QUALITY = 82;     // overena hranice, kde neni videt rozdil
const DIR = 'thumbs';

const args = process.argv.slice(2);
const albumArg = args.includes('--album') ? args[args.indexOf('--album') + 1] : null;
const doAll = args.includes('--all');
const doRevert = args.includes('--revert');

if (!albumArg && !doAll && !doRevert) {
  console.error('Zadejte --album <nazev>, --all nebo --revert');
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

if (doRevert) {
  let n = 0;
  content.gallery.forEach(g => { if (g.thumb) { delete g.thumb; n++; } });
  fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
  console.log('Odstraneno ' + n + ' odkazu na nahledy. Galerie zase pouziva puvodni fotky.');
  process.exit(0);
}

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

const vybrane = content.gallery.filter(g => {
  if (!g.photo || g.photo.startsWith('data:')) return false;   // base64 z adminu preskocit
  return doAll || g.album === albumArg;
});

if (!vybrane.length) {
  console.error('Zadne fotky neodpovidaji vyberu.');
  process.exit(1);
}

(async () => {
  let pred = 0, po = 0, hotovo = 0;
  for (const g of vybrane) {
    if (!fs.existsSync(g.photo)) { console.log('  chybi soubor: ' + g.photo); continue; }
    const jmeno = path.basename(g.photo).replace(/\.[^.]+$/, '') + '.webp';
    const cil = path.join(DIR, jmeno);
    const src = fs.statSync(g.photo).size;

    const meta = await sharp(g.photo).metadata();
    // Uzsi fotku nezvetsovat - jen prevest do uspornejsiho formatu
    const sirka = Math.min(WIDTH, meta.width);
    await sharp(g.photo).resize({ width: sirka }).webp({ quality: QUALITY }).toFile(cil);

    const out = fs.statSync(cil).size;
    g.thumb = DIR + '/' + jmeno;
    pred += src; po += out; hotovo++;
    console.log('  ' + path.basename(g.photo).slice(0, 42).padEnd(44) +
                (src / 1024).toFixed(0).padStart(6) + ' KB -> ' +
                (out / 1024).toFixed(0).padStart(5) + ' KB');
  }
  fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
  console.log('');
  console.log('Vytvoreno nahledu: ' + hotovo);
  console.log('Celkem: ' + (pred / 1048576).toFixed(1) + ' MB -> ' + (po / 1048576).toFixed(1) +
              ' MB  (-' + Math.round((1 - po / pred) * 100) + ' %)');
  console.log('Puvodni fotky zustaly nezmenene.');
})();
