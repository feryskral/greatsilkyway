// Doplni do stranek znacky pro sdileni na sitich (Open Graph, Twitter)
// a strukturovana data pro Google (JSON-LD).
//
// Vsechno se vklada mezi znacky <!-- SEO:start --> a <!-- SEO:end -->,
// takze opakovane spusteni blok jen prepise, nikdy nezdvoji.
//
// Pouziti: node _gen-seo-tags.js
// Soubor zacina podtrzitkem, takze se pri FTP synchronizaci nenahrava.

const fs = require('fs');

const D = 'https://greatsilkyway.cz';
const TELEFON = '+420777757076';
const EMAIL = 'info@greatsilkyway.cz';
const FB = 'https://www.facebook.com/profile.php?id=100089532775624';
const IG = 'https://www.instagram.com/great_silkyway_kennel/';

// title  = modry klikaci nadpis ve vysledcich vyhledavani. Hledana fraze
//          patri dopredu, znacka az za svislitko - jmeno stanice lide neznaji.
//          Doporucena delka do ~60 znaku, jinak Google konec usekne.
// desc    = popisek pod nadpisem, do ~155 znaku.
const STRANKY = {
  'index.html': {
    url: '/', jmeno: 'Úvod',
    title: 'Chovatelská stanice Yorkshire teriérů | Great Silkyway',
    desc: 'Chováme Yorkshire teriéry s průkazem původu FCI. Štěňátka odchovaná s láskou v rodinném prostředí, očkovaná, odčervená a s mikročipem.',
  },
  'stena.html': {
    url: '/stena.html', jmeno: 'Štěňata',
    title: 'Štěňata Yorkshire teriéra s průkazem FCI | Great Silkyway',
    desc: 'Aktuálně dostupná štěňátka Yorkshire teriéra s průkazem původu FCI. Očkovaná, odčervená, s mikročipem a kupní smlouvou.',
  },
  'vrhy.html': {
    url: '/vrhy.html', jmeno: 'Vrhy',
    title: 'Vrhy štěňat Yorkshire teriéra | Great Silkyway',
    desc: 'Přehled vrhů Yorkshire teriérů z naší chovatelské stanice včetně fotografií štěňátek a informací o rodičích.',
  },
  'nasi-psi.html': {
    url: '/nasi-psi.html', jmeno: 'Naši psi',
    title: 'Chovní Yorkshire teriéři – tituly a zdraví | Great Silkyway',
    desc: 'Naši chovní psi a feny Yorkshire teriéra — výstavní tituly, zdravotní testy a povaha. Seznamte se s rodiči našich štěňátek.',
  },
  'galerie.html': {
    url: '/galerie.html', jmeno: 'Galerie',
    title: 'Fotogalerie Yorkshire teriérů | Great Silkyway',
    desc: 'Fotografie našich Yorkshire teriérů a štěňátek z každodenního života i z výstav. Prohlédněte si je podle jmen.',
  },
  'about.html': {
    url: '/about.html', jmeno: 'O nás',
    title: 'O chovatelské stanici Yorkshire teriérů | Great Silkyway',
    desc: 'Chovatelská stanice Yorkshire teriérů s registrací FCI. Náš příběh, hodnoty a přístup k chovu a odchovu štěňat.',
  },
  'kontakt.html': {
    url: '/kontakt.html', jmeno: 'Kontakt',
    title: 'Kontakt – chovatelská stanice Yorkshire | Great Silkyway',
    desc: 'Máte zájem o štěňátko Yorkshire teriéra? Ozvěte se nám telefonicky nebo e-mailem, rádi zodpovíme vaše otázky.',
  },
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Kdo jsme - stejne na kazde strance, aby to Google spojil do jedne entity
function organizace() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': D + '/#organizace',
    name: 'Great Silkyway',
    alternateName: 'Great Silkyway – chovatelská stanice Yorkshire teriérů',
    description: 'Chovatelská stanice Yorkshire teriérů s registrací FCI. Štěňata odchovaná v rodinném prostředí, s průkazem původu, očkováním a mikročipem.',
    url: D + '/',
    logo: D + '/great-logo.png',
    image: D + '/og-image.jpg',
    telephone: TELEFON,
    email: EMAIL,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Praha',
      addressCountry: 'CZ',
    },
    areaServed: { '@type': 'Country', name: 'Česká republika' },
    knowsAbout: ['Yorkshire teriér', 'chovatelská stanice psů', 'chov psů', 'FCI'],
    sameAs: [FB, IG],
  };
}

// Drobeckova navigace - Google ji zobrazuje ve vysledcich misto holé adresy
function drobecky(s) {
  if (s.url === '/') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Úvod', item: D + '/' },
      { '@type': 'ListItem', position: 2, name: s.jmeno, item: D + s.url },
    ],
  };
}

let upraveno = 0;
for (const [soubor, s] of Object.entries(STRANKY)) {
  if (!fs.existsSync(soubor)) { console.log('  chybi: ' + soubor); continue; }
  let html = fs.readFileSync(soubor, 'utf8');

  // Titulek a popis stranky - to je, co Google zobrazi ve vysledcich
  html = html.replace(/<title>[\s\S]*?<\/title>/, '<title>' + esc(s.title) + '</title>');
  if (/<meta name="description"[^>]*>/.test(html)) {
    html = html.replace(/<meta name="description"[^>]*>/,
      '<meta name="description" content="' + esc(s.desc) + '" />');
  } else {
    html = html.replace(/(<\/title>\n)/, '$1  <meta name="description" content="' + esc(s.desc) + '" />\n');
  }

  const data = [organizace(), drobecky(s)].filter(Boolean)
    .map(o => '  <script type="application/ld+json">\n' + JSON.stringify(o, null, 2)
      .split('\n').map(r => '  ' + r).join('\n') + '\n  </script>')
    .join('\n');

  const blok = `  <!-- SEO:start -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Great Silkyway" />
  <meta property="og:locale" content="cs_CZ" />
  <meta property="og:url" content="${D}${s.url}" />
  <meta property="og:title" content="${esc(s.title)}" />
  <meta property="og:description" content="${esc(s.desc)}" />
  <meta property="og:image" content="${D}/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Štěňátka Yorkshire teriéra z chovatelské stanice Great Silkyway" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(s.title)}" />
  <meta name="twitter:description" content="${esc(s.desc)}" />
  <meta name="twitter:image" content="${D}/og-image.jpg" />
${data}
  <!-- SEO:end -->
`;

  if (/<!-- SEO:start -->[\s\S]*?<!-- SEO:end -->\n?/.test(html)) {
    html = html.replace(/[ \t]*<!-- SEO:start -->[\s\S]*?<!-- SEO:end -->\n?/, blok);
  } else if (/<link rel="canonical"[^>]*\/>\n/.test(html)) {
    html = html.replace(/(<link rel="canonical"[^>]*\/>\n)/, '$1' + blok);
  } else {
    html = html.replace(/(<\/title>\n)/, '$1' + blok);
  }

  fs.writeFileSync(soubor, html);
  upraveno++;
  console.log('  ' + soubor.padEnd(16) + 'og + ' + (drobecky(s) ? '2' : '1') + 'x JSON-LD');
}
console.log('upraveno stranek: ' + upraveno);
