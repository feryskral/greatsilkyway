// Generator nahledu pro galerii a datove sekce (stenata, psi, vrhy).
//
// Puvodni fotky ZUSTAVAJI nedotcene - vznikaji jen zmensene kopie ve
// slozce thumbs/. V mrizce se zobrazi nahled, po kliknuti se
// otevre puvodni fotka v plne kvalite.
//
// Pouziti:
//   node _gen-thumbs.js --album matteo     ... jen jedno album galerie
//   node _gen-thumbs.js --all              ... galerie i karty stenat, psu a vrhu
//   node _gen-thumbs.js --revert           ... odstrani odkazy na nahledy
//
// Soubor zacina podtrzitkem, takze se pri FTP synchronizaci nenahrava.

const sharp = require('./node_modules/sharp');
const fs = require('fs');
const path = require('path');

const WIDTH = 920;      // pokryje i retina displeje (mrizka zobrazuje ~460 px)
const QUALITY = 82;     // overena hranice, kde neni videt rozdil
const DIR = 'thumbs';

// Sekce mimo galerii, jejichz karty take zobrazuji zmensenou fotku.
// Kazda si nese jmeno pole s cestou k fotce - vrhy ji maji v "cover".
const DATOVE_SEKCE = { puppies: 'photo', dogs: 'photo', litters: 'cover' };

const args = process.argv.slice(2);
const albumArg = args.includes('--album') ? args[args.indexOf('--album') + 1] : null;
const doAll = args.includes('--all');
const doRevert = args.includes('--revert');

if (!albumArg && !doAll && !doRevert) {
  console.error('Zadejte --album <nazev>, --all nebo --revert');
  process.exit(1);
}

const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));

// Vsechny kolekce, ktere mohou nest odkaz na nahled
function vsechnyPolozky() {
  const out = [];
  (content.gallery || []).forEach(g => out.push(g));
  Object.keys(DATOVE_SEKCE).forEach(k => (content[k] || []).forEach(x => out.push(x)));
  return out;
}

if (doRevert) {
  let n = 0;
  vsechnyPolozky().forEach(x => { if (x.thumb) { delete x.thumb; n++; } });
  fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
  console.log('Odstraneno ' + n + ' odkazu na nahledy. Pouzivaji se zase puvodni fotky.');
  process.exit(0);
}

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);

// base64 z adminu preskocit - nahled se z nej vyrobit neda
const pouzitelna = cesta => cesta && !cesta.startsWith('data:');

// Kazda polozka jde dal jako dvojice: sama polozka + cesta k jeji fotce
const vybrane = [];
(content.gallery || []).forEach(g => {
  if (pouzitelna(g.photo) && (doAll || g.album === albumArg)) vybrane.push({ item: g, src: g.photo });
});

// Karty stenat, psu a vrhu se zpracuji jen pri --all
if (doAll) {
  Object.keys(DATOVE_SEKCE).forEach(k => {
    const pole = DATOVE_SEKCE[k];
    (content[k] || []).forEach(x => {
      if (pouzitelna(x[pole])) vybrane.push({ item: x, src: x[pole] });
    });
  });
}

if (!vybrane.length) {
  console.error('Zadne fotky neodpovidaji vyberu.');
  process.exit(1);
}

(async () => {
  let pred = 0, po = 0, hotovo = 0, preskoceno = 0;
  for (const { item, src: fotka } of vybrane) {
    if (!fs.existsSync(fotka)) { console.log('  chybi soubor: ' + fotka); continue; }
    const jmeno = path.basename(fotka).replace(/\.[^.]+$/, '') + '.webp';
    const cil = path.join(DIR, jmeno);

    // Tutez fotku muze sdilet vic sekci - hotovy nahled znovu negenerovat
    if (fs.existsSync(cil)) {
      item.thumb = DIR + '/' + jmeno;
      preskoceno++;
      continue;
    }

    const src = fs.statSync(fotka).size;
    const meta = await sharp(fotka).metadata();
    // Uzsi fotku nezvetsovat - jen prevest do uspornejsiho formatu
    const sirka = Math.min(WIDTH, meta.width);
    await sharp(fotka).resize({ width: sirka }).webp({ quality: QUALITY }).toFile(cil);

    const out = fs.statSync(cil).size;
    item.thumb = DIR + '/' + jmeno;
    pred += src; po += out; hotovo++;
    console.log('  ' + path.basename(fotka).slice(0, 42).padEnd(44) +
                (src / 1024).toFixed(0).padStart(6) + ' KB -> ' +
                (out / 1024).toFixed(0).padStart(5) + ' KB');
  }
  fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
  console.log('');
  console.log('Vytvoreno nahledu: ' + hotovo + ', jiz existovalo: ' + preskoceno);
  if (pred) {
    console.log('Nove prevedeno: ' + (pred / 1048576).toFixed(1) + ' MB -> ' + (po / 1048576).toFixed(1) +
                ' MB  (-' + Math.round((1 - po / pred) * 100) + ' %)');
  }
  console.log('Puvodni fotky zustaly nezmenene.');
})();
