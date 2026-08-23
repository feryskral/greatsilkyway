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

const STRANKY = {
  'index.html': {
    url: '/', jmeno: 'Úvod',
    ogTitle: 'Great Silkyway – chovatelská stanice Yorkshire teriérů',
    ogDesc: 'Yorkshire teriéři s průkazem původu FCI, odchovaní s láskou v rodinném prostředí. Podívejte se na aktuálně dostupná štěňátka.',
  },
  'stena.html': {
    url: '/stena.html', jmeno: 'Štěňata',
    ogTitle: 'Dostupná štěňata Yorkshire teriéra – Great Silkyway',
    ogDesc: 'Aktuálně dostupná štěňátka jorkšírského teriéra s průkazem FCI, očkovaná, odčervená a s mikročipem.',
  },
  'vrhy.html': {
    url: '/vrhy.html', jmeno: 'Vrhy',
    ogTitle: 'Vrhy štěňat – Great Silkyway',
    ogDesc: 'Přehled vrhů Yorkshire teriérů z naší chovatelské stanice včetně fotografií štěňátek.',
  },
  'nasi-psi.html': {
    url: '/nasi-psi.html', jmeno: 'Naši psi',
    ogTitle: 'Naši chovní psi a feny – Great Silkyway',
    ogDesc: 'Seznamte se s našimi chovnými Yorkshire teriéry — jejich tituly, zdravotními testy a povahou.',
  },
  'galerie.html': {
    url: '/galerie.html', jmeno: 'Galerie',
    ogTitle: 'Fotogalerie Yorkshire teriérů – Great Silkyway',
    ogDesc: 'Fotografie našich psů a štěňátek jorkšírského teriéra z každodenního života i z výstav.',
  },
  'about.html': {
    url: '/about.html', jmeno: 'O nás',
    ogTitle: 'O naší chovatelské stanici – Great Silkyway',
    ogDesc: 'Chovatelská stanice Yorkshire teriérů s registrací FCI. Náš příběh, hodnoty a přístup k chovu.',
  },
  'kontakt.html': {
    url: '/kontakt.html', jmeno: 'Kontakt',
    ogTitle: 'Kontakt – Great Silkyway',
    ogDesc: 'Máte zájem o štěňátko jorkšírského teriéra? Ozvěte se nám telefonicky nebo e-mailem.',
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
    knowsAbout: ['Yorkshire teriér', 'jorkšírský teriér', 'chov psů', 'FCI'],
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

  const data = [organizace(), drobecky(s)].filter(Boolean)
    .map(o => '  <script type="application/ld+json">\n' + JSON.stringify(o, null, 2)
      .split('\n').map(r => '  ' + r).join('\n') + '\n  </script>')
    .join('\n');

  const blok = `  <!-- SEO:start -->
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Great Silkyway" />
  <meta property="og:locale" content="cs_CZ" />
  <meta property="og:url" content="${D}${s.url}" />
  <meta property="og:title" content="${esc(s.ogTitle)}" />
  <meta property="og:description" content="${esc(s.ogDesc)}" />
  <meta property="og:image" content="${D}/og-image.jpg" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Štěňátka Yorkshire teriéra z chovatelské stanice Great Silkyway" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(s.ogTitle)}" />
  <meta name="twitter:description" content="${esc(s.ogDesc)}" />
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
