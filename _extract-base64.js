// Vytahne fotky ulozene primo v content.json (base64) do samostatnych souboru.
//
// Admin uklada nahrane fotky jako base64 retezec do content.json. Ten pak
// stahuje kazdy navstevnik na kazde strance, i tam, kde zadne fotky nejsou.
// Po vytazeni zustane v content.json jen nazev souboru.
//
// Pouziti: node _extract-base64.js
// Soubor zacina podtrzitkem, takze se pri FTP synchronizaci nenahrava.

const fs = require('fs');

const slug = s => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const content = JSON.parse(fs.readFileSync('content.json', 'utf8'));
const pouzite = new Set(fs.readdirSync('.').map(f => f.toLowerCase()));

// Najde volny nazev, aby se neprepsal existujici soubor
function volnyNazev(zaklad, ext) {
  let n = `${zaklad}.${ext}`;
  let i = 2;
  while (pouzite.has(n.toLowerCase())) n = `${zaklad}-${i++}.${ext}`;
  pouzite.add(n.toLowerCase());
  return n;
}

function vytahni(obj, klic, zaklad) {
  const v = obj[klic];
  if (typeof v !== 'string' || !v.startsWith('data:')) return null;
  const m = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/s.exec(v);
  if (!m) { console.log('  preskoceno (neznamy format): ' + zaklad); return null; }
  const ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const nazev = volnyNazev(zaklad, ext);
  fs.writeFileSync(nazev, Buffer.from(m[2], 'base64'));
  const kb = Math.round(v.length / 1024);
  obj[klic] = nazev;
  return { nazev, kb, realKb: Math.round(fs.statSync(nazev).size / 1024) };
}

const pred = fs.statSync('content.json').size;
let pocet = 0, usetreno = 0;

// Fotky v galerii - nazev podle alba, jinak podle popisku
content.gallery.forEach((g, i) => {
  const zaklad = 'foto-' + (slug(g.album) || slug(g.caption) || 'galerie-' + i);
  const r = vytahni(g, 'photo', zaklad);
  if (r) { console.log('  galerie  ' + r.nazev.padEnd(34) + r.realKb + ' KB'); pocet++; usetreno += r.kb; }
});

// Karty psu, stenat a vrhu
[['dogs', 'photo', 'pes'], ['puppies', 'photo', 'stene'], ['litters', 'cover', 'vrh']].forEach(([pole, klic, prefix]) => {
  (content[pole] || []).forEach(x => {
    const r = vytahni(x, klic, prefix + '-' + (slug(x.slug || x.name) || 'foto'));
    if (r) { console.log('  ' + pole.padEnd(9) + r.nazev.padEnd(34) + r.realKb + ' KB'); pocet++; usetreno += r.kb; }
  });
});

fs.writeFileSync('content.json', JSON.stringify(content, null, 2));
const po = fs.statSync('content.json').size;

console.log('');
console.log('Vytazeno fotek: ' + pocet);
console.log('content.json: ' + Math.round(pred / 1024) + ' KB -> ' + Math.round(po / 1024) + ' KB' +
            (pred > po ? '  (-' + Math.round((1 - po / pred) * 100) + ' %)' : ''));
