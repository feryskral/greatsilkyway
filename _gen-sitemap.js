// Generator sitemap.xml a robots.txt.
//
// Spustit po kazde zmene struktury webu:  node _gen-sitemap.js
// Soubor zacina podtrzitkem, takze se pri FTP synchronizaci nenahrava.

const fs = require('fs');

const DOMENA = 'https://greatsilkyway.cz';

// Verejne stranky. priority = jak dulezita stranka je (1.0 = nejvyssi),
// changefreq = jak casto se meni obsah.
const STRANKY = [
  { file: 'index.html',    url: '/',              priority: '1.0', changefreq: 'weekly' },
  { file: 'stena.html',    url: '/stena.html',    priority: '0.9', changefreq: 'weekly' },
  { file: 'vrhy.html',     url: '/vrhy.html',     priority: '0.8', changefreq: 'weekly' },
  { file: 'nasi-psi.html', url: '/nasi-psi.html', priority: '0.8', changefreq: 'monthly' },
  { file: 'galerie.html',  url: '/galerie.html',  priority: '0.7', changefreq: 'weekly' },
  { file: 'about.html',    url: '/about.html',    priority: '0.6', changefreq: 'monthly' },
  { file: 'kontakt.html',  url: '/kontakt.html',  priority: '0.6', changefreq: 'monthly' },
];

// Stranky, ktere do vyhledavace nepatri
const NEINDEXOVAT = [
  '/admin.php', '/admin.html', '/login.php', '/logout.php',
  '/save-content.php', '/upload-photo.php', '/stats.php', '/test-diag.html',
  '/cms/', '/node_modules/',
];

// Datum posledni zmeny brat ze souboru - Google podle nej pozna, co je nove.
// U stranek zavislych na obsahu se pouzije novejsi z dvojice HTML/content.json.
const contentMtime = fs.existsSync('content.json') ? fs.statSync('content.json').mtime : new Date(0);
const datovaStranka = ['index.html', 'stena.html', 'vrhy.html', 'nasi-psi.html', 'galerie.html'];

const den = d => d.toISOString().slice(0, 10);

const polozky = STRANKY.filter(s => fs.existsSync(s.file)).map(s => {
  let m = fs.statSync(s.file).mtime;
  if (datovaStranka.includes(s.file) && contentMtime > m) m = contentMtime;
  return `  <url>
    <loc>${DOMENA}${s.url}</loc>
    <lastmod>${den(m)}</lastmod>
    <changefreq>${s.changefreq}</changefreq>
    <priority>${s.priority}</priority>
  </url>`;
});

fs.writeFileSync('sitemap.xml',
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${polozky.join('\n')}
</urlset>
`);

fs.writeFileSync('robots.txt',
`# Great Silkyway - chovatelska stanice Yorkshire terieru
User-agent: *
Allow: /

# Administrace a technicke soubory do vyhledavace nepatri
${NEINDEXOVAT.map(p => 'Disallow: ' + p).join('\n')}

Sitemap: ${DOMENA}/sitemap.xml
`);

console.log('sitemap.xml  - ' + polozky.length + ' stranek');
STRANKY.filter(s => fs.existsSync(s.file)).forEach(s => {
  let m = fs.statSync(s.file).mtime;
  if (datovaStranka.includes(s.file) && contentMtime > m) m = contentMtime;
  console.log('   ' + (DOMENA + s.url).padEnd(42) + 'priorita ' + s.priority + '   zmeneno ' + den(m));
});
console.log('robots.txt   - ' + NEINDEXOVAT.length + ' zakazanych cest + odkaz na sitemapu');
