const fs = require('fs');
const path = require('path');

const BASE = 'C:/Users/fery/chatobrian-wisdom/';

// ─── helpers ────────────────────────────────────────────────────────────────

function r(html, from, to) {
  if (html.indexOf(from) === -1) {
    console.warn('  [WARN] pattern not found: ' + from.slice(0, 60));
  }
  return html.split(from).join(to);
}

// ─── shared transforms applied to ALL files ─────────────────────────────────

function sharedNav(html) {
  // desktop nav links
  html = r(html, 'class="nav__link active">Úvod</a>', 'class="nav__link active" data-i18n="nav_home">Úvod</a>');
  html = r(html, 'class="nav__link">Úvod</a>', 'class="nav__link" data-i18n="nav_home">Úvod</a>');
  html = r(html, 'class="nav__link active">O nás</a>', 'class="nav__link active" data-i18n="nav_about">O nás</a>');
  html = r(html, 'class="nav__link">O nás</a>', 'class="nav__link" data-i18n="nav_about">O nás</a>');
  html = r(html, 'class="nav__link active">Naši psi</a>', 'class="nav__link active" data-i18n="nav_dogs">Naši psi</a>');
  html = r(html, 'class="nav__link">Naši psi</a>', 'class="nav__link" data-i18n="nav_dogs">Naši psi</a>');
  html = r(html, 'class="nav__link active">Štěňata</a>', 'class="nav__link active" data-i18n="nav_puppies">Štěňata</a>');
  html = r(html, 'class="nav__link">Štěňata</a>', 'class="nav__link" data-i18n="nav_puppies">Štěňata</a>');
  html = r(html, 'class="nav__link active">Vrhy</a>', 'class="nav__link active" data-i18n="nav_litters">Vrhy</a>');
  html = r(html, 'class="nav__link">Vrhy</a>', 'class="nav__link" data-i18n="nav_litters">Vrhy</a>');
  html = r(html, 'class="nav__link active">Galerie</a>', 'class="nav__link active" data-i18n="nav_gallery">Galerie</a>');
  html = r(html, 'class="nav__link">Galerie</a>', 'class="nav__link" data-i18n="nav_gallery">Galerie</a>');

  // contact CTA button variants
  html = r(html,
    'btn--primary nav__cta btn--sm active">Kontaktujte nás</a>',
    'btn--primary nav__cta btn--sm active" data-i18n="nav_contact_btn">Kontaktujte nás</a>'
  );
  html = r(html,
    'btn--primary nav__cta btn--sm">Kontaktujte nás</a>',
    'btn--primary nav__cta btn--sm" data-i18n="nav_contact_btn">Kontaktujte nás</a>'
  );
  // mobile menu contact btn
  html = r(html,
    'class="btn btn--primary">Kontaktujte nás</a>',
    'class="btn btn--primary" data-i18n="nav_contact_btn">Kontaktujte nás</a>'
  );

  // inject lang-switcher button before nav__burger
  html = r(html,
    '<button class="nav__burger" id="burger"',
    '<button class="lang-switcher" onclick="toggleLang()">EN</button>\n        <button class="nav__burger" id="burger"'
  );
  return html;
}

function sharedFooter(html) {
  html = r(html,
    '<div class="footer__col-title">Navigace</div>',
    '<div class="footer__col-title" data-i18n="footer_nav_title">Navigace</div>'
  );
  html = r(html,
    '<div class="footer__col-title">Informace</div>',
    '<div class="footer__col-title" data-i18n="footer_info_title">Informace</div>'
  );
  html = r(html,
    '<div class="footer__col-title">Kontakt</div>',
    '<div class="footer__col-title" data-i18n="footer_contact_title">Kontakt</div>'
  );
  // footer tagline (two variants found across files)
  html = r(html,
    'Profesionální chovatelská stanice Yorkshire teriérů s FCI registrací.\n            Chováme s láskou, zodpovědností a vášní od roku 2009.',
    'Profesionální chovatelská stanice Yorkshire teriérů s FCI registrací.\n            Chováme s láskou, zodpovědností a vášní od roku 2009.'
  );
  // replace tagline content – handle both versions in index vs other pages
  html = html.replace(
    /(<p class="footer__tagline">)([^<]+)(<\/p>)/g,
    '$1<span data-i18n="footer_tagline">$2</span>$3'
  );
  // footer info links
  html = r(html, '><a href="#">FCI registrace</a>', '><a href="#" data-i18n="footer_fci_reg">FCI registrace</a>');
  html = r(html, '><a href="#">Zdravotní testy</a>', '><a href="#" data-i18n="footer_health">Zdravotní testy</a>');
  html = r(html, '><a href="#">Adopční podmínky</a>', '><a href="#" data-i18n="footer_adoption">Adopční podmínky</a>');
  html = r(html, '><a href="#">FAQ</a>', '><a href="#" data-i18n="footer_faq">FAQ</a>');
  // footer "Napište nám" button (inside footer__links)
  html = r(html,
    'class="btn btn--primary btn--sm" style="margin-top:8px; display:inline-flex;">Napište nám</a>',
    'class="btn btn--primary btn--sm" style="margin-top:8px; display:inline-flex;" data-i18n="footer_write">Napište nám</a>'
  );
  // footer lower
  html = r(html,
    '<span>© 2025 Great Silkyway. Všechna práva vyhrazena.</span>',
    '<span data-i18n="footer_rights">© 2025 Great Silkyway. Všechna práva vyhrazena.</span>'
  );
  html = r(html,
    '<span>Chovatelská stanice FCI · ČMKU registrace</span>',
    '<span data-i18n="footer_reg">Chovatelská stanice FCI · ČMKU registrace</span>'
  );
  return html;
}

function addScript(html) {
  return r(html, '</body>', '<script src="lang.js"></script>\n</body>');
}

// ─── index.html ─────────────────────────────────────────────────────────────

function transformIndex(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  // hero
  html = r(html,
    '<span class="hero__badge">🏆 FCI registrovaná stanice</span>',
    '<span class="hero__badge" data-i18n="hero_badge">🏆 FCI registrovaná stanice</span>'
  );
  html = r(html,
    'Krásní Yorkshire teriéři\n          <span class="accent">s láskou a péčí</span>',
    '<span data-i18n="hero_title1">Krásní Yorkshire teriéři</span>\n          <span class="accent" data-i18n="hero_title2">s láskou a péčí</span>'
  );
  html = r(html,
    '<p class="hero__desc">\n          Vítejte v chovatelské stanici Great Silkyway. Chováme Yorkshire teriéry\n          s důrazem na zdraví, povahu a krásu. Každé štěně vyrůstá v rodinném prostředí\n          s láskou a odbornou péčí.\n        </p>',
    '<p class="hero__desc" data-i18n="hero_desc">Vítejte v chovatelské stanici Great Silkyway. Chováme Yorkshire teriéry s důrazem na zdraví, povahu a krásu. Každé štěně vyrůstá v rodinném prostředí s láskou a odbornou péčí.</p>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--primary">Dostupná štěňata</a>',
    '<a href="stena.html" class="btn btn--primary" data-i18n="hero_btn_puppies">Dostupná štěňata</a>'
  );
  html = r(html,
    '<a href="about.html" class="btn btn--outline">Více o nás</a>',
    '<a href="about.html" class="btn btn--outline" data-i18n="hero_btn_about">Více o nás</a>'
  );
  html = r(html,
    '<span class="hero__stat-label">Let zkušeností</span>',
    '<span class="hero__stat-label" data-i18n="hero_stat_exp">Let zkušeností</span>'
  );
  html = r(html,
    '<span class="hero__stat-label">Spokojených rodin</span>',
    '<span class="hero__stat-label" data-i18n="hero_stat_families">Spokojených rodin</span>'
  );
  html = r(html,
    '<span class="hero__stat-label">Registrace</span>',
    '<span class="hero__stat-label" data-i18n="hero_stat_reg">Registrace</span>'
  );

  // features
  html = r(html, '<div class="feature-card__title">FCI průkazy původu</div>', '<div class="feature-card__title" data-i18n="feat_fci_title">FCI průkazy původu</div>');
  html = r(html, '<div class="feature-card__desc">Všechna štěňata s mezinárodně uznávaným průkazem</div>', '<div class="feature-card__desc" data-i18n="feat_fci_desc">Všechna štěňata s mezinárodně uznávaným průkazem</div>');
  html = r(html, '<div class="feature-card__title">DNA testování</div>', '<div class="feature-card__title" data-i18n="feat_dna_title">DNA testování</div>');
  html = r(html, '<div class="feature-card__desc">Rodiče otestováni na dědičné choroby</div>', '<div class="feature-card__desc" data-i18n="feat_dna_desc">Rodiče otestováni na dědičné choroby</div>');
  html = r(html, '<div class="feature-card__title">Očkování &amp; odčervení</div>', '<div class="feature-card__title" data-i18n="feat_vac_title">Očkování &amp; odčervení</div>');
  html = r(html, '<div class="feature-card__title">Očkování & odčervení</div>', '<div class="feature-card__title" data-i18n="feat_vac_title">Očkování & odčervení</div>');
  html = r(html, '<div class="feature-card__desc">Kompletní veterinární péče před předáním</div>', '<div class="feature-card__desc" data-i18n="feat_vac_desc">Kompletní veterinární péče před předáním</div>');
  html = r(html, '<div class="feature-card__title">Rodinná výchova</div>', '<div class="feature-card__title" data-i18n="feat_fam_title">Rodinná výchova</div>');
  html = r(html, '<div class="feature-card__desc">Štěňata socializována v domácím prostředí</div>', '<div class="feature-card__desc" data-i18n="feat_fam_desc">Štěňata socializována v domácím prostředí</div>');

  // about teaser
  html = r(html, '<span class="section-label">O chovatelské stanici</span>', '<span class="section-label" data-i18n="about_label">O chovatelské stanici</span>');
  html = r(html,
    '<h2 class="section-title">Chováme yorkshiry s vášní a zodpovědností</h2>',
    '<h2 class="section-title" data-i18n="about_title">Chováme yorkshiry s vášní a zodpovědností</h2>'
  );
  html = r(html,
    'Chovatelská stanice Great Silkyway vznikla z čisté lásky k Yorkshire teriérům.\n            Chov je pro nás nejen koníčkem, ale posláním — přivést na svět zdravá,\n            dobře socializovaná štěňata, která budou radostí celých rodin.',
    '<span data-i18n="about_p1">Chovatelská stanice Great Silkyway vznikla z čisté lásky k Yorkshire teriérům. Chov je pro nás nejen koníčkem, ale posláním — přivést na svět zdravá, dobře socializovaná štěňata, která budou radostí celých rodin.</span>'
  );
  html = r(html,
    'Naši chovatelé jsou registrováni u FCI a ČMKU. Každý náš chovný pes prochází\n            komplexním zdravotním testováním včetně DNA analýzy, aby se zajistilo,\n            že předávají svým potomkům jen to nejlepší.',
    '<span data-i18n="about_p2">Naši chovatelé jsou registrováni u FCI a ČMKU. Každý náš chovný pes prochází komplexním zdravotním testováním včetně DNA analýzy, aby se zajistilo, že předávají svým potomkům jen to nejlepší.</span>'
  );
  html = r(html, '<div class="checkmark-item">Registrace FCI / ČMKU</div>', '<div class="checkmark-item" data-i18n="about_check1">Registrace FCI / ČMKU</div>');
  html = r(html, '<div class="checkmark-item">Zdravotní testy rodičů</div>', '<div class="checkmark-item" data-i18n="about_check2">Zdravotní testy rodičů</div>');
  html = r(html, '<div class="checkmark-item">Celoživotní podpora majitelů</div>', '<div class="checkmark-item" data-i18n="about_check3">Celoživotní podpora majitelů</div>');
  html = r(html, '<div class="checkmark-item">Smlouva o prodeji s zárukou</div>', '<div class="checkmark-item" data-i18n="about_check4">Smlouva o prodeji s zárukou</div>');
  html = r(html,
    '<a href="about.html" class="btn btn--primary">Zjistit více o nás</a>',
    '<a href="about.html" class="btn btn--primary" data-i18n="about_btn">Zjistit více o nás</a>'
  );
  html = r(html, '<strong>15+ let</strong>', '<strong data-i18n="badge_exp">15+ let</strong>');
  html = r(html, '<span>zkušený chovatel</span>', '<span data-i18n="badge_breeder">zkušený chovatel</span>');

  // dogs teaser
  html = r(html, '<span class="section-label">Chovní jedinci</span>', '<span class="section-label" data-i18n="dogs_label">Chovní jedinci</span>');
  html = r(html, '<h2 class="section-title">Naši chovní psi</h2>', '<h2 class="section-title" data-i18n="dogs_title">Naši chovní psi</h2>');
  html = r(html,
    '<p class="section-subtitle">\n          Seznamte se s hvězdami naší stanice — chovnými fenami a psy\n          s výbornými výsledky z výstav a zdravotními prověrkami.\n        </p>',
    '<p class="section-subtitle" data-i18n="dogs_subtitle">Seznamte se s hvězdami naší stanice — chovnými fenami a psy s výbornými výsledky z výstav a zdravotními prověrkami.</p>'
  );
  html = r(html,
    '<a href="nasi-psi.html" class="btn btn--outline">Zobrazit všechny psy</a>',
    '<a href="nasi-psi.html" class="btn btn--outline" data-i18n="dogs_show_all">Zobrazit všechny psy</a>'
  );

  // puppies teaser
  html = r(html, '<span class="section-label">Aktuální vrh</span>', '<span class="section-label" data-i18n="puppies_label">Aktuální vrh</span>');
  html = r(html, '<h2 class="section-title">Dostupná štěňata</h2>', '<h2 class="section-title" data-i18n="puppies_title">Dostupná štěňata</h2>');
  html = r(html,
    '<p class="section-subtitle">\n          Hledáte svého nového čtyřnohého přítele? Podívejte se na naše aktuálně dostupná štěňata s průkazem FCI.\n        </p>',
    '<p class="section-subtitle" data-i18n="puppies_subtitle">Hledáte svého nového čtyřnohého přítele? Podívejte se na naše aktuálně dostupná štěňata s průkazem FCI.</p>'
  );
  html = r(html,
    '<span class="puppy-card__status puppy-card__status--available">Volné</span>',
    '<span class="puppy-card__status puppy-card__status--available" data-i18n="status_available">Volné</span>'
  );
  html = r(html,
    '<span class="puppy-card__status puppy-card__status--reserved">Rezervováno</span>',
    '<span class="puppy-card__status puppy-card__status--reserved" data-i18n="status_reserved">Rezervováno</span>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--primary">Všechna štěňata</a>',
    '<a href="stena.html" class="btn btn--primary" data-i18n="puppies_all">Všechna štěňata</a>'
  );

  // gallery teaser
  html = r(html, '<span class="section-label">Fotogalerie</span>', '<span class="section-label" data-i18n="gallery_label">Fotogalerie</span>');
  html = r(html, '<h2 class="section-title">Naše yorkshire rodina</h2>', '<h2 class="section-title" data-i18n="gallery_title">Naše yorkshire rodina</h2>');
  html = r(html,
    '<p class="section-subtitle">Krátký pohled do každodenního života naší chovatelské stanice.</p>',
    '<p class="section-subtitle" data-i18n="gallery_subtitle">Krátký pohled do každodenního života naší chovatelské stanice.</p>'
  );
  html = r(html,
    '<a href="galerie.html" class="btn btn--outline">Celá galerie</a>',
    '<a href="galerie.html" class="btn btn--outline" data-i18n="gallery_all">Celá galerie</a>'
  );

  // testimonials
  html = r(html, '<span class="section-label">Reference</span>', '<span class="section-label" data-i18n="test_label">Reference</span>');
  html = r(html, '<h2 class="section-title">Co říkají naše rodiny</h2>', '<h2 class="section-title" data-i18n="test_title">Co říkají naše rodiny</h2>');
  html = r(html,
    '<p class="section-subtitle">Přečtěte si zkušenosti lidí, kteří si od nás přijali yorkshire teriéra.</p>',
    '<p class="section-subtitle" data-i18n="test_subtitle">Přečtěte si zkušenosti lidí, kteří si od nás přijali yorkshire teriéra.</p>'
  );

  // CTA banner
  html = r(html,
    '<span class="section-label" style="color: var(--color-gold-light);">Máte zájem?</span>',
    '<span class="section-label" style="color: var(--color-gold-light);" data-i18n="cta_label">Máte zájem?</span>'
  );
  html = r(html, '<h2>Najděte svého Yorkshire teriéra</h2>', '<h2 data-i18n="cta_title">Najděte svého Yorkshire teriéra</h2>');
  html = r(html,
    '<p>Vyplňte krátký dotazník a my vám pomůžeme najít štěně, které bude do vaší rodiny ideálně pasovat.</p>',
    '<p data-i18n="cta_desc">Vyplňte krátký dotazník a my vám pomůžeme najít štěně, které bude do vaší rodiny ideálně pasovat.</p>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--primary">Aktuální štěňata</a>',
    '<a href="stena.html" class="btn btn--primary" data-i18n="cta_btn1">Aktuální štěňata</a>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--outline-white">Kontaktovat nás</a>',
    '<a href="kontakt.html" class="btn btn--outline-white" data-i18n="cta_btn2">Kontaktovat nás</a>'
  );

  html = addScript(html);
  return html;
}

// ─── about.html ─────────────────────────────────────────────────────────────

function transformAbout(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  // page hero
  html = r(html, '<h1>O naší chovatelské stanici</h1>', '<h1 data-i18n="about_page_title">O naší chovatelské stanici</h1>');
  html = r(html,
    '<p>Více než 15 let lásky k Yorkshire teriérům, zodpovědného chovu a šťastných rodin.</p>',
    '<p data-i18n="about_page_desc">Více než 15 let lásky k Yorkshire teriérům, zodpovědného chovu a šťastných rodin.</p>'
  );

  // story section
  html = r(html, '<span class="section-label">Náš příběh</span>', '<span class="section-label" data-i18n="story_label">Náš příběh</span>');
  html = r(html, '<h2 class="section-title">Vítejte v Great Silkyway</h2>', '<h2 class="section-title" data-i18n="story_title">Vítejte v Great Silkyway</h2>');
  html = r(html,
    'Chovatelská stanice Great Silkyway vznikla v roce 2009 z čisté a nefalšované lásky\n            k Yorkshire teriérům. To, co začalo jako osobní vášeň jedné rodiny, se postupem let\n            rozrostlo v respektovanou chovatelskou stanici s mezinárodní FCI registrací.',
    '<span data-i18n="story_p1">Chovatelská stanice Great Silkyway vznikla v roce 2009 z čisté a nefalšované lásky k Yorkshire teriérům. To, co začalo jako osobní vášeň jedné rodiny, se postupem let rozrostlo v respektovanou chovatelskou stanici s mezinárodní FCI registrací.</span>'
  );
  html = r(html,
    'Naším hlavním posláním je chovat Yorkshire teriéry, kteří jsou nejen krásní navenek,\n            ale především zdraví, dobře socializovaní a s výbornou povahou. Věříme, že správný\n            yorkie je věrný společník pro celou rodinu — od batolat po seniory.',
    '<span data-i18n="story_p2">Naším hlavním posláním je chovat Yorkshire teriéry, kteří jsou nejen krásní navenek, ale především zdraví, dobře socializovaní a s výbornou povahou. Věříme, že správný yorkie je věrný společník pro celou rodinu — od batolat po seniory.</span>'
  );
  html = r(html,
    'Každé štěně, které opouští naši stanici, odchází jako součást naší rodiny. Zůstáváme\n            k dispozici novým majitelům po celý život psa — s radami, podporou i přátelstvím.',
    '<span data-i18n="story_p3">Každé štěně, které opouští naši stanici, odchází jako součást naší rodiny. Zůstáváme k dispozici novým majitelům po celý život psa — s radami, podporou i přátelstvím.</span>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--primary">Aktuální štěňata</a>',
    '<a href="stena.html" class="btn btn--primary" data-i18n="story_btn1">Aktuální štěňata</a>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--outline">Napište nám</a>',
    '<a href="kontakt.html" class="btn btn--outline" data-i18n="story_btn2">Napište nám</a>'
  );
  html = r(html, '<strong>FCI registrace</strong>', '<strong data-i18n="badge_fci">FCI registrace</strong>');
  html = r(html, '<span>od roku 2009</span>', '<span data-i18n="badge_since">od roku 2009</span>');

  // values
  html = r(html, '<span class="section-label">Naše hodnoty</span>', '<span class="section-label" data-i18n="values_label">Naše hodnoty</span>');
  html = r(html, '<h2 class="section-title">Co nás řídí</h2>', '<h2 class="section-title" data-i18n="values_title">Co nás řídí</h2>');
  html = r(html,
    '<p class="section-subtitle">Tyto principy stojí za každým rozhodnutím, které v naší chovatelské stanici činíme.</p>',
    '<p class="section-subtitle" data-i18n="values_subtitle">Tyto principy stojí za každým rozhodnutím, které v naší chovatelské stanici činíme.</p>'
  );
  html = r(html, '<div class="dog-card__name">Láska na prvním místě</div>', '<div class="dog-card__name" data-i18n="val1_title">Láska na prvním místě</div>');
  html = r(html,
    '<p class="dog-card__desc">Každý náš pes žije jako člen rodiny. Žádná klec, žádný kennel — jen domov plný tepla a péče.</p>',
    '<p class="dog-card__desc" data-i18n="val1_desc">Každý náš pes žije jako člen rodiny. Žádná klec, žádný kennel — jen domov plný tepla a péče.</p>'
  );
  html = r(html, '<div class="dog-card__name">Zdraví nade vše</div>', '<div class="dog-card__name" data-i18n="val2_title">Zdraví nade vše</div>');
  html = r(html,
    '<p class="dog-card__desc">Všichni chovní jedinci jsou testováni na genetické nemoci. Zdraví potomků je naší nejvyšší prioritou.</p>',
    '<p class="dog-card__desc" data-i18n="val2_desc">Všichni chovní jedinci jsou testováni na genetické nemoci. Zdraví potomků je naší nejvyšší prioritou.</p>'
  );
  html = r(html, '<div class="dog-card__name">Poctivost a transparentnost</div>', '<div class="dog-card__name" data-i18n="val3_title">Poctivost a transparentnost</div>');
  html = r(html,
    '<p class="dog-card__desc">Sdílíme vše — výsledky zdravotních testů, výstavní tituly i rodokmen. Žádná tajemství.</p>',
    '<p class="dog-card__desc" data-i18n="val3_desc">Sdílíme vše — výsledky zdravotních testů, výstavní tituly i rodokmen. Žádná tajemství.</p>'
  );

  // breeder
  html = r(html, '<span class="section-label">Chovatelé</span>', '<span class="section-label" data-i18n="breeder_label">Chovatelé</span>');
  html = r(html, '<h2 class="section-title">Kdo stojí za Great Silkyway</h2>', '<h2 class="section-title" data-i18n="breeder_title">Kdo stojí za Great Silkyway</h2>');
  html = r(html,
    'Za naší stanicí stojí vášnivá chovatelka se dvěma desetiletími zkušeností\n            s chovem Yorkshire teriérů. Aktivně se účastní výstav psů po celé Evropě,\n            je členkou ČMKU (Českomoravská kynologická unie) a pravidelně absolvuje\n            odborné semináře zaměřené na welfare a zdraví psů.',
    '<span data-i18n="breeder_p1">Za naší stanicí stojí vášnivá chovatelka se dvěma desetiletími zkušeností s chovem Yorkshire teriérů. Aktivně se účastní výstav psů po celé Evropě, je členkou ČMKU a pravidelně absolvuje odborné semináře zaměřené na welfare a zdraví psů.</span>'
  );
  html = r(html,
    'Vrhy plánujeme s velkým rozmyslem — vybíráme rodiče nejen podle titulů,\n            ale především podle zdraví, povahy a chovné hodnoty. Počet vrhů za rok\n            záměrně omezujeme, aby každé štěně dostalo tu nejlepší možnou péči a pozornost.',
    '<span data-i18n="breeder_p2">Vrhy plánujeme s velkým rozmyslem — vybíráme rodiče nejen podle titulů, ale především podle zdraví, povahy a chovné hodnoty. Počet vrhů za rok záměrně omezujeme, aby každé štěně dostalo tu nejlepší možnou péči a pozornost.</span>'
  );
  html = r(html, '<div class="checkmark-item">Členka ČMKU a FCI</div>', '<div class="checkmark-item" data-i18n="breeder_check1">Členka ČMKU a FCI</div>');
  html = r(html, '<div class="checkmark-item">Aktivní výstavní kariéra v ČR i zahraničí</div>', '<div class="checkmark-item" data-i18n="breeder_check2">Aktivní výstavní kariéra v ČR i zahraničí</div>');
  html = r(html, '<div class="checkmark-item">Průběžné vzdělávání v oblasti genetiky a welfare</div>', '<div class="checkmark-item" data-i18n="breeder_check3">Průběžné vzdělávání v oblasti genetiky a welfare</div>');
  html = r(html, '<div class="checkmark-item">Maximálně 3 vrhy ročně pro kvalitu nad kvantitu</div>', '<div class="checkmark-item" data-i18n="breeder_check4">Maximálně 3 vrhy ročně pro kvalitu nad kvantitu</div>');
  html = r(html, '<strong>Chovatel roku</strong>', '<strong data-i18n="badge_breeder_year">Chovatel roku</strong>');
  html = r(html, '<span>ČMKU 2022</span>', '<span data-i18n="badge_year">ČMKU 2022</span>');

  // certifications
  html = r(html,
    '<span class="section-label" style="color:var(--color-gold-light);">Certifikace &amp; registrace</span>',
    '<span class="section-label" style="color:var(--color-gold-light);" data-i18n="cert_label">Certifikace &amp; registrace</span>'
  );
  html = r(html, '<h2 class="section-title">Naše záruky kvality</h2>', '<h2 class="section-title" data-i18n="cert_title">Naše záruky kvality</h2>');
  html = r(html,
    '<p class="section-subtitle">Transparentnost a profesionalita jsou základem naší práce.</p>',
    '<p class="section-subtitle" data-i18n="cert_subtitle">Transparentnost a profesionalita jsou základem naší práce.</p>'
  );
  html = r(html, '<div class="feature-card__title">FCI průkaz původu</div>', '<div class="feature-card__title" data-i18n="cert1_title">FCI průkaz původu</div>');
  html = r(html, '<div class="feature-card__desc">Mezinárodně uznávaný průkaz pro každé štěně</div>', '<div class="feature-card__desc" data-i18n="cert1_desc">Mezinárodně uznávaný průkaz pro každé štěně</div>');
  html = r(html, '<div class="feature-card__title">DNA profil</div>', '<div class="feature-card__title" data-i18n="cert2_title">DNA profil</div>');
  html = r(html, '<div class="feature-card__desc">Všichni chovní jedinci mají DNA certifikát</div>', '<div class="feature-card__desc" data-i18n="cert2_desc">Všichni chovní jedinci mají DNA certifikát</div>');
  html = r(html, '<div class="feature-card__title">Veterinární pas</div>', '<div class="feature-card__title" data-i18n="cert3_title">Veterinární pas</div>');
  html = r(html, '<div class="feature-card__desc">Očkování, odčervení, veterinární prohlídka</div>', '<div class="feature-card__desc" data-i18n="cert3_desc">Očkování, odčervení, veterinární prohlídka</div>');
  html = r(html, '<div class="feature-card__title">Kupní smlouva</div>', '<div class="feature-card__title" data-i18n="cert4_title">Kupní smlouva</div>');
  html = r(html, '<div class="feature-card__desc">Písemná smlouva s podmínkami a zárukami</div>', '<div class="feature-card__desc" data-i18n="cert4_desc">Písemná smlouva s podmínkami a zárukami</div>');

  // CTA
  html = r(html,
    '<span class="section-label" style="color: var(--color-gold-light);">Pojďme se poznat</span>',
    '<span class="section-label" style="color: var(--color-gold-light);" data-i18n="about_cta_label">Pojďme se poznat</span>'
  );
  html = r(html, '<h2>Máte otázky? Rádi odpovíme.</h2>', '<h2 data-i18n="about_cta_title">Máte otázky? Rádi odpovíme.</h2>');
  html = r(html,
    '<p>Neváhejte nás kontaktovat. Rádi vám poradíme, zda je yorkshire teriér ta pravá volba pro vás.</p>',
    '<p data-i18n="about_cta_desc">Neváhejte nás kontaktovat. Rádi vám poradíme, zda je yorkshire teriér ta pravá volba pro vás.</p>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--primary">Napište nám</a>',
    '<a href="kontakt.html" class="btn btn--primary" data-i18n="about_cta_btn1">Napište nám</a>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--outline-white">Aktuální štěňata</a>',
    '<a href="stena.html" class="btn btn--outline-white" data-i18n="about_cta_btn2">Aktuální štěňata</a>'
  );

  html = addScript(html);
  return html;
}

// ─── nasi-psi.html ───────────────────────────────────────────────────────────

function transformDogs(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  // page hero
  html = r(html, '<h1>Naši chovní jedinci</h1>', '<h1 data-i18n="dogs_page_title">Naši chovní jedinci</h1>');
  html = r(html,
    '<p>Šampioni, zdravotně prověření a s výbornou povahou — to jsou rodiče vašeho budoucího mazlíčka.</p>',
    '<p data-i18n="dogs_page_desc">Šampioni, zdravotně prověření a s výbornou povahou — to jsou rodiče vašeho budoucího mazlíčka.</p>'
  );

  // intro
  html = r(html, '<span class="section-label">Výběr rodičů</span>', '<span class="section-label" data-i18n="dogs_intro_label">Výběr rodičů</span>');
  html = r(html, '<h2 class="section-title">Základ dobrého vrhu</h2>', '<h2 class="section-title" data-i18n="dogs_intro_title">Základ dobrého vrhu</h2>');
  html = r(html,
    '<p class="section-subtitle">\n        Chovné feny a psi jsou srdcem každé chovatelské stanice. U nás procházejí každý rok komplexním\n        zdravotním vyšetřením, mají DNA profil a jsou aktivními výstavními psy.\n      </p>',
    '<p class="section-subtitle" data-i18n="dogs_intro_subtitle">Chovné feny a psi jsou srdcem každé chovatelské stanice. U nás procházejí každý rok komplexním zdravotním vyšetřením, mají DNA profil a jsou aktivními výstavními psy.</p>'
  );

  // females
  html = r(html, '<span class="section-label">Chovné feny</span>', '<span class="section-label" data-i18n="females_label">Chovné feny</span>');
  html = r(html,
    '<h2 class="section-title" style="margin-bottom:40px;">Naše dámy</h2>',
    '<h2 class="section-title" style="margin-bottom:40px;" data-i18n="females_title">Naše dámy</h2>'
  );

  // males
  html = r(html, '<span class="section-label">Chovní psi</span>', '<span class="section-label" data-i18n="males_label">Chovní psi</span>');
  html = r(html,
    '<h2 class="section-title" style="margin-bottom:40px;">Naši pánové</h2>',
    '<h2 class="section-title" style="margin-bottom:40px;" data-i18n="males_title">Naši pánové</h2>'
  );

  // dog breed labels
  html = html.split('<div class="dog-card__breed">Yorkshire teriér</div>').join('<div class="dog-card__breed" data-i18n="breed_yt">Yorkshire teriér</div>');

  // DNA labels
  html = html.split('<span>Čistý ✓</span>').join('<span data-i18n="dna_clean">Čistý ✓</span>');

  // dog descriptions
  html = r(html,
    'Nádherná fena s výjimečně hedvábnou srstí a typickým výstavním výrazem. Senorita je elegantní, temperamentní a plná energie.',
    '<span data-i18n="senorita_desc">Nádherná fena s výjimečně hedvábnou srstí a typickým výstavním výrazem. Senorita je elegantní, temperamentní a plná energie.</span>'
  );
  html = r(html,
    'Okouzlující fena s nádhernou srstí a výraznou osobností. Michelle je elegantní, klidná a do každého vrhu předává ty nejlepší vlastnosti.',
    '<span data-i18n="michelle_desc">Okouzlující fena s nádhernou srstí a výraznou osobností. Michelle je elegantní, klidná a do každého vrhu předává ty nejlepší vlastnosti.</span>'
  );
  html = r(html,
    'Výjimečný pes s titulem Junior Champion. Matteo disponuje dokonalou stavbou těla, nádhernou srstí a sebevědomou povahou výstavního psa nejvyšší kvality.',
    '<span data-i18n="matteo_desc">Výjimečný pes s titulem Junior Champion. Matteo disponuje dokonalou stavbou těla, nádhernou srstí a sebevědomou povahou výstavního psa nejvyšší kvality.</span>'
  );

  // health section
  html = r(html,
    '<span class="section-label" style="color:var(--color-gold-light);">Zdravotní program</span>',
    '<span class="section-label" style="color:var(--color-gold-light);" data-i18n="health_label">Zdravotní program</span>'
  );
  html = r(html, '<h2>Zdraví je naší prioritou</h2>', '<h2 data-i18n="health_title">Zdraví je naší prioritou</h2>');
  html = r(html,
    '<p style="max-width:560px; margin:0 auto 48px; color:rgba(255,255,255,0.7);">\n          Všichni naši chovní jedinci pravidelně absolvují tato vyšetření:\n        </p>',
    '<p style="max-width:560px; margin:0 auto 48px; color:rgba(255,255,255,0.7);" data-i18n="health_desc">Všichni naši chovní jedinci pravidelně absolvují tato vyšetření:</p>'
  );
  html = r(html, '<div class="feature-card__title">DNA profil</div>', '<div class="feature-card__title" data-i18n="health1_title">DNA profil</div>');
  html = r(html, '<div class="feature-card__desc">Identifikace a testování na dědičné nemoci</div>', '<div class="feature-card__desc" data-i18n="health1_desc">Identifikace a testování na dědičné nemoci</div>');
  html = r(html, '<div class="feature-card__title">Oční vyšetření</div>', '<div class="feature-card__title" data-i18n="health2_title">Oční vyšetření</div>');
  html = r(html, '<div class="feature-card__desc">Roční kontrola u certifikovaného veterináře</div>', '<div class="feature-card__desc" data-i18n="health2_desc">Roční kontrola u certifikovaného veterináře</div>');
  html = r(html, '<div class="feature-card__title">Luxace pately</div>', '<div class="feature-card__title" data-i18n="health3_title">Luxace pately</div>');
  html = r(html, '<div class="feature-card__desc">RTG vyšetření kloubů psů v chovu</div>', '<div class="feature-card__desc" data-i18n="health3_desc">RTG vyšetření kloubů psů v chovu</div>');
  html = r(html, '<div class="feature-card__title">Kardiologické vyšetření</div>', '<div class="feature-card__title" data-i18n="health4_title">Kardiologické vyšetření</div>');
  html = r(html, '<div class="feature-card__desc">Kontrola srdce u specializovaného kardiologa</div>', '<div class="feature-card__desc" data-i18n="health4_desc">Kontrola srdce u specializovaného kardiologa</div>');

  // CTA
  html = r(html,
    '<span class="section-label" style="color: var(--color-gold-light);">Plánované vrhy</span>',
    '<span class="section-label" style="color: var(--color-gold-light);" data-i18n="dogs_cta_label">Plánované vrhy</span>'
  );
  html = r(html, '<h2>Zajímá vás některý z vrhů?</h2>', '<h2 data-i18n="dogs_cta_title">Zajímá vás některý z vrhů?</h2>');
  html = r(html,
    '<p>Napište nám a my vám sdělíme aktuální plány pro příští vrhy i možnosti rezervace.</p>',
    '<p data-i18n="dogs_cta_desc">Napište nám a my vám sdělíme aktuální plány pro příští vrhy i možnosti rezervace.</p>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--primary">Napište nám</a>',
    '<a href="kontakt.html" class="btn btn--primary" data-i18n="dogs_cta_btn1">Napište nám</a>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--outline-white">Dostupná štěňata</a>',
    '<a href="stena.html" class="btn btn--outline-white" data-i18n="dogs_cta_btn2">Dostupná štěňata</a>'
  );

  html = addScript(html);
  return html;
}

// ─── stena.html ──────────────────────────────────────────────────────────────

function transformPuppies(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  // page hero
  html = r(html, '<h1>Dostupná štěňata</h1>', '<h1 data-i18n="puppies_page_title">Dostupná štěňata</h1>');
  html = r(html,
    '<p>Všechna štěňata odcházejí s FCI průkazem původu, očkováním, odčervením a veterinárním pasem.</p>',
    '<p data-i18n="puppies_page_desc">Všechna štěňata odcházejí s FCI průkazem původu, očkováním, odčervením a veterinárním pasem.</p>'
  );

  // adoption
  html = r(html, '<span class="section-label">Jak to funguje</span>', '<span class="section-label" data-i18n="adoption_label">Jak to funguje</span>');
  html = r(html, '<h2 class="section-title">Jak probíhá adopce štěněte</h2>', '<h2 class="section-title" data-i18n="adoption_title">Jak probíhá adopce štěněte</h2>');
  html = r(html,
    'Záleží nám na tom, aby každé štěně odešlo do správné rodiny. Proto naši adopci\n            pojímáme jako vzájemné poznávání — chceme vědět, co nový majitel čeká, a on by\n            měl vědět vše o nás.',
    '<span data-i18n="adoption_desc">Záleží nám na tom, aby každé štěně odešlo do správné rodiny. Proto naši adopci pojímáme jako vzájemné poznávání — chceme vědět, co nový majitel čeká, a on by měl vědět vše o nás.</span>'
  );

  // steps
  html = r(html, '<strong>Kontaktujte nás</strong>', '<strong data-i18n="step1_title">Kontaktujte nás</strong>');
  html = r(html,
    '<p>Napište nám e-mail nebo zavolejte. Rádi odpovíme na všechny vaše otázky a zjistíme, zda máme vhodné štěně pro vás.</p>',
    '<p data-i18n="step1_desc">Napište nám e-mail nebo zavolejte. Rádi odpovíme na všechny vaše otázky a zjistíme, zda máme vhodné štěně pro vás.</p>'
  );
  html = r(html, '<strong>Rezervační záloha</strong>', '<strong data-i18n="step2_title">Rezervační záloha</strong>');
  html = r(html,
    '<p>Po vzájemné dohodě uzavřeme smlouvu o rezervaci a složíte zálohu ve výši 5 000 Kč.</p>',
    '<p data-i18n="step2_desc">Po vzájemné dohodě uzavřeme smlouvu o rezervaci a složíte zálohu ve výši 5 000 Kč.</p>'
  );
  html = r(html, '<strong>Průběžné fotky a video</strong>', '<strong data-i18n="step3_title">Průběžné fotky a video</strong>');
  html = r(html,
    '<p>Budete pravidelně dostávat fotografie a videa vašeho štěněte. Sledujete jeho vývoj od prvního dne.</p>',
    '<p data-i18n="step3_desc">Budete pravidelně dostávat fotografie a videa vašeho štěněte. Sledujete jeho vývoj od prvního dne.</p>'
  );
  html = r(html, '<strong>Předání štěněte</strong>', '<strong data-i18n="step4_title">Předání štěněte</strong>');
  html = r(html,
    '<p>Ve věku 10 týdnů si štěně převezmete osobně. Předáme vám veškerou dokumentaci a poskytneme úvodní poradenství.</p>',
    '<p data-i18n="step4_desc">Ve věku 10 týdnů si štěně převezmete osobně. Předáme vám veškerou dokumentaci a poskytneme úvodní poradenství.</p>'
  );

  // included
  html = r(html,
    '<h3 style="margin-bottom:8px; color:var(--color-navy);">Co je součástí ceny</h3>',
    '<h3 style="margin-bottom:8px; color:var(--color-navy);" data-i18n="included_title">Co je součástí ceny</h3>'
  );
  html = r(html,
    '<p style="margin-bottom:24px; font-size:0.9rem;">Každé štěně odchází kompletně vybavené:</p>',
    '<p style="margin-bottom:24px; font-size:0.9rem;" data-i18n="included_desc">Každé štěně odchází kompletně vybavené:</p>'
  );
  html = r(html, '<div class="checkmark-item">FCI průkaz původu</div>', '<div class="checkmark-item" data-i18n="inc1">FCI průkaz původu</div>');
  html = r(html, '<div class="checkmark-item">Veterinární pas EU</div>', '<div class="checkmark-item" data-i18n="inc2">Veterinární pas EU</div>');
  html = r(html, '<div class="checkmark-item">Očkování (první dávka)</div>', '<div class="checkmark-item" data-i18n="inc3">Očkování (první dávka)</div>');
  html = r(html, '<div class="checkmark-item">Odčervení dle věku</div>', '<div class="checkmark-item" data-i18n="inc4">Odčervení dle věku</div>');
  html = r(html, '<div class="checkmark-item">Mikročip (povinný)</div>', '<div class="checkmark-item" data-i18n="inc5">Mikročip (povinný)</div>');
  html = r(html, '<div class="checkmark-item">Kupní smlouva</div>', '<div class="checkmark-item" data-i18n="inc6">Kupní smlouva</div>');
  html = r(html, '<div class="checkmark-item">Balíček péče (granule, hračka)</div>', '<div class="checkmark-item" data-i18n="inc7">Balíček péče (granule, hračka)</div>');
  html = r(html, '<div class="checkmark-item">Celoživotní podpora chovatele</div>', '<div class="checkmark-item" data-i18n="inc8">Celoživotní podpora chovatele</div>');
  html = r(html,
    '<a href="kontakt.html" class="btn btn--primary" style="width:100%; justify-content:center; margin-top:8px;">Mám zájem o štěně</a>',
    '<a href="kontakt.html" class="btn btn--primary" style="width:100%; justify-content:center; margin-top:8px;" data-i18n="inc_btn">Mám zájem o štěně</a>'
  );

  // current litter
  html = r(html, '<span class="section-label">Aktuální vrh — únor 2025</span>', '<span class="section-label" data-i18n="litter_label">Aktuální vrh — únor 2025</span>');
  html = r(html,
    '<h2 class="section-title" style="margin-bottom:8px;">Vrh „A" — Bella × Duke</h2>',
    '<h2 class="section-title" style="margin-bottom:8px;" data-i18n="litter_title">Vrh „A" — Bella × Duke</h2>'
  );
  html = r(html,
    '<p style="margin-bottom:40px;">Narozena 15. února 2025 · Štěňata připravena k předání od 26. dubna 2025</p>',
    '<p style="margin-bottom:40px;" data-i18n="litter_desc">Narozena 15. února 2025 · Štěňata připravena k předání od 26. dubna 2025</p>'
  );
  html = r(html,
    '<span class="puppy-card__status puppy-card__status--available">Volné</span>',
    '<span class="puppy-card__status puppy-card__status--available" data-i18n="status_available">Volné</span>'
  );
  html = r(html,
    '<span class="puppy-card__status puppy-card__status--reserved">Rezervováno</span>',
    '<span class="puppy-card__status puppy-card__status--reserved" data-i18n="status_reserved">Rezervováno</span>'
  );
  html = html.split('<div class="puppy-card__price" style="margin-bottom:12px;">Cena na dotaz</div>').join('<div class="puppy-card__price" style="margin-bottom:12px;" data-i18n="price_inquiry">Cena na dotaz</div>');
  html = r(html,
    '<div class="puppy-card__price" style="margin-bottom:12px; color:var(--color-text-soft);">Rezervováno</div>',
    '<div class="puppy-card__price" style="margin-bottom:12px; color:var(--color-text-soft);" data-i18n="price_reserved_lbl">Rezervováno</div>'
  );
  html = html.split('<a href="kontakt.html" class="btn btn--primary btn--sm">Mám zájem</a>').join('<a href="kontakt.html" class="btn btn--primary btn--sm" data-i18n="btn_interested">Mám zájem</a>');
  html = r(html,
    '<button class="btn btn--outline btn--sm" disabled style="opacity:0.5; cursor:not-allowed;">Obsazeno</button>',
    '<button class="btn btn--outline btn--sm" disabled style="opacity:0.5; cursor:not-allowed;" data-i18n="btn_taken">Obsazeno</button>'
  );

  // planned litters
  html = r(html, '<span class="section-label">Plánované vrhy</span>', '<span class="section-label" data-i18n="planned_label">Plánované vrhy</span>');
  html = r(html, '<h2 class="section-title">Připravované vrhy 2025</h2>', '<h2 class="section-title" data-i18n="planned_title">Připravované vrhy 2025</h2>');
  html = r(html,
    '<p class="section-subtitle">Zapište se do pořadníku a my vás kontaktujeme jako první, jakmile budou štěňata k dispozici.</p>',
    '<p class="section-subtitle" data-i18n="planned_subtitle">Zapište se do pořadníku a my vás kontaktujeme jako první, jakmile budou štěňata k dispozici.</p>'
  );
  html = r(html, '<div class="dog-card__breed">Plánovaný vrh · jaro 2025</div>', '<div class="dog-card__breed" data-i18n="plan1_label">Plánovaný vrh · jaro 2025</div>');
  html = r(html, '<div class="dog-card__name">Luna × Maxim</div>', '<div class="dog-card__name" data-i18n="plan1_title">Luna × Maxim</div>');
  html = r(html,
    '<p class="dog-card__desc">Kombinace dvou výjimečných jedinců. Očekáváme 2–4 štěňata s vynikající genetikou a zlatavou srstí.</p>',
    '<p class="dog-card__desc" data-i18n="plan1_desc">Kombinace dvou výjimečných jedinců. Očekáváme 2–4 štěňata s vynikající genetikou a zlatavou srstí.</p>'
  );
  html = r(html, '<div class="dog-card__breed">Plánovaný vrh · podzim 2025</div>', '<div class="dog-card__breed" data-i18n="plan2_label">Plánovaný vrh · podzim 2025</div>');
  html = r(html, '<div class="dog-card__name">Stella × Duke</div>', '<div class="dog-card__name" data-i18n="plan2_title">Stella × Duke</div>');
  html = r(html,
    '<p class="dog-card__desc">Duke a Stella jsou skvělý pár — jejich potomci mají vždy výborný typ a nádhernou srst.</p>',
    '<p class="dog-card__desc" data-i18n="plan2_desc">Duke a Stella jsou skvělý pár — jejich potomci mají vždy výborný typ a nádhernou srst.</p>'
  );
  html = r(html, '<div class="dog-card__breed">Upřesňujeme · konec 2025</div>', '<div class="dog-card__breed" data-i18n="plan3_label">Upřesňujeme · konec 2025</div>');
  html = r(html, '<div class="dog-card__name">Třetí vrh</div>', '<div class="dog-card__name" data-i18n="plan3_title">Třetí vrh</div>');
  html = r(html,
    '<p class="dog-card__desc">Třetí vrh roku plánujeme. Detaily upřesníme brzy. Zapište se do pořadníku a dostanete info jako první.</p>',
    '<p class="dog-card__desc" data-i18n="plan3_desc">Třetí vrh roku plánujeme. Detaily upřesníme brzy. Zapište se do pořadníku a dostanete info jako první.</p>'
  );
  html = html.split('<a href="kontakt.html" class="btn btn--outline btn--sm">Zapsat do pořadníku</a>').join('<a href="kontakt.html" class="btn btn--outline btn--sm" data-i18n="waitlist_btn">Zapsat do pořadníku</a>');

  // CTA
  html = r(html,
    '<span class="section-label" style="color: var(--color-gold-light);">Začněte hned</span>',
    '<span class="section-label" style="color: var(--color-gold-light);" data-i18n="puppies_cta_label">Začněte hned</span>'
  );
  html = r(html, '<h2>Připraveni přivítat yorkshire teriéra?</h2>', '<h2 data-i18n="puppies_cta_title">Připraveni přivítat yorkshire teriéra?</h2>');
  html = r(html,
    '<p>Kontaktujte nás a společně najdeme to pravé štěně pro vaši rodinu.</p>',
    '<p data-i18n="puppies_cta_desc">Kontaktujte nás a společně najdeme to pravé štěně pro vaši rodinu.</p>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--primary">Kontaktovat nás</a>',
    '<a href="kontakt.html" class="btn btn--primary" data-i18n="puppies_cta_btn1">Kontaktovat nás</a>'
  );
  html = r(html,
    '<a href="about.html" class="btn btn--outline-white">Více o nás</a>',
    '<a href="about.html" class="btn btn--outline-white" data-i18n="puppies_cta_btn2">Více o nás</a>'
  );

  html = addScript(html);
  return html;
}

// ─── vrhy.html ───────────────────────────────────────────────────────────────

function transformLitters(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  html = r(html, '<h1>Naše vrhy</h1>', '<h1 data-i18n="litters_page_title">Naše vrhy</h1>');
  html = r(html,
    '<p>Přehled uskutečněných a aktuálních vrhů naší chovatelské stanice.</p>',
    '<p data-i18n="litters_page_desc">Přehled uskutečněných a aktuálních vrhů naší chovatelské stanice.</p>'
  );
  html = r(html, '<span class="section-label">Přehled vrhů</span>', '<span class="section-label" data-i18n="litters_label">Přehled vrhů</span>');
  html = r(html,
    '<h2 class="section-title" style="margin-bottom:40px;">Vrhy Great Silkyway</h2>',
    '<h2 class="section-title" style="margin-bottom:40px;" data-i18n="litters_title">Vrhy Great Silkyway</h2>'
  );

  // litter cards
  html = r(html, '<div class="vrh-card__title">Vrh A</div>', '<div class="vrh-card__title" data-i18n="litter_a_title">Vrh A</div>');
  html = r(html, '<p class="vrh-card__desc">Štěňata z vrhu A naší chovatelské stanice.</p>', '<p class="vrh-card__desc" data-i18n="litter_a_desc">Štěňata z vrhu A naší chovatelské stanice.</p>');
  html = r(html, '<div class="vrh-card__title">Vrh B</div>', '<div class="vrh-card__title" data-i18n="litter_b_title">Vrh B</div>');
  html = r(html, '<p class="vrh-card__desc">Štěňata z vrhu B naší chovatelské stanice.</p>', '<p class="vrh-card__desc" data-i18n="litter_b_desc">Štěňata z vrhu B naší chovatelské stanice.</p>');
  html = r(html, '<div class="vrh-card__title">Vrh C</div>', '<div class="vrh-card__title" data-i18n="litter_c_title">Vrh C</div>');
  html = r(html, '<p class="vrh-card__desc">Štěňata z vrhu C naší chovatelské stanice.</p>', '<p class="vrh-card__desc" data-i18n="litter_c_desc">Štěňata z vrhu C naší chovatelské stanice.</p>');
  html = html.split('<a href="kontakt.html" class="btn btn--outline btn--sm">Dotaz na vrh</a>').join('<a href="kontakt.html" class="btn btn--outline btn--sm" data-i18n="litter_inquiry">Dotaz na vrh</a>');

  // CTA
  html = r(html,
    '<span class="section-label" style="color: var(--color-gold-light);">Plánované vrhy</span>',
    '<span class="section-label" style="color: var(--color-gold-light);" data-i18n="vrhy_cta_label">Plánované vrhy</span>'
  );
  html = r(html, '<h2>Zajímá vás některý z vrhů?</h2>', '<h2 data-i18n="vrhy_cta_title">Zajímá vás některý z vrhů?</h2>');
  html = r(html,
    '<p>Napište nám a my vám sdělíme aktuální plány pro příští vrhy i možnosti rezervace.</p>',
    '<p data-i18n="vrhy_cta_desc">Napište nám a my vám sdělíme aktuální plány pro příští vrhy i možnosti rezervace.</p>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--primary">Napište nám</a>',
    '<a href="kontakt.html" class="btn btn--primary" data-i18n="vrhy_cta_btn1">Napište nám</a>'
  );
  html = r(html,
    '<a href="stena.html" class="btn btn--outline-white">Dostupná štěňata</a>',
    '<a href="stena.html" class="btn btn--outline-white" data-i18n="vrhy_cta_btn2">Dostupná štěňata</a>'
  );

  html = addScript(html);
  return html;
}

// ─── galerie.html ────────────────────────────────────────────────────────────

function transformGallery(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  html = r(html, '<h1>Fotogalerie</h1>', '<h1 data-i18n="gallery_page_title">Fotogalerie</h1>');
  html = r(html,
    '<p>Nahlédněte do každodenního života naší chovatelské stanice, výstav a rodinného štěstí.</p>',
    '<p data-i18n="gallery_page_desc">Nahlédněte do každodenního života naší chovatelské stanice, výstav a rodinného štěstí.</p>'
  );

  // filter tabs
  html = r(html, '<button class="filter-tab active" data-filter="all">Vše</button>', '<button class="filter-tab active" data-filter="all" data-i18n="filter_all">Vše</button>');
  html = r(html, '<button class="filter-tab" data-filter="stenata">Štěňata</button>', '<button class="filter-tab" data-filter="stenata" data-i18n="filter_puppies">Štěňata</button>');
  html = r(html, '<button class="filter-tab" data-filter="psi">Dospělí psi</button>', '<button class="filter-tab" data-filter="psi" data-i18n="filter_dogs">Dospělí psi</button>');
  html = r(html, '<button class="filter-tab" data-filter="vystavy">Výstavy</button>', '<button class="filter-tab" data-filter="vystavy" data-i18n="filter_shows">Výstavy</button>');
  html = r(html, '<button class="filter-tab" data-filter="rodiny">Šťastné rodiny</button>', '<button class="filter-tab" data-filter="rodiny" data-i18n="filter_families">Šťastné rodiny</button>');

  // CTA
  html = r(html,
    '<span class="section-label" style="color: var(--color-gold-light);">Sdílejte radost</span>',
    '<span class="section-label" style="color: var(--color-gold-light);" data-i18n="gallery_cta_label">Sdílejte radost</span>'
  );
  html = r(html, '<h2>Máte yorkshire od nás? Pošlete nám fotky!</h2>', '<h2 data-i18n="gallery_cta_title">Máte yorkshire od nás? Pošlete nám fotky!</h2>');
  html = r(html,
    '<p>Rádi přidáme fotky vašeho mazlíčka do naší galerie šťastných rodin.</p>',
    '<p data-i18n="gallery_cta_desc">Rádi přidáme fotky vašeho mazlíčka do naší galerie šťastných rodin.</p>'
  );
  html = r(html,
    '<a href="kontakt.html" class="btn btn--primary">Napsat nám</a>',
    '<a href="kontakt.html" class="btn btn--primary" data-i18n="gallery_cta_btn">Napsat nám</a>'
  );

  html = addScript(html);
  return html;
}

// ─── kontakt.html ────────────────────────────────────────────────────────────

function transformContact(html) {
  html = sharedNav(html);
  html = sharedFooter(html);

  html = r(html, '<h1>Kontaktujte nás</h1>', '<h1 data-i18n="contact_page_title">Kontaktujte nás</h1>');
  html = r(html,
    '<p>Máte otázky ohledně štěňat, plánovaných vrhů nebo chovu? Napište nám — rádi odpovíme.</p>',
    '<p data-i18n="contact_page_desc">Máte otázky ohledně štěňat, plánovaných vrhů nebo chovu? Napište nám — rádi odpovíme.</p>'
  );

  html = r(html, '<span class="section-label">Spojte se s námi</span>', '<span class="section-label" data-i18n="contact_label">Spojte se s námi</span>');
  html = r(html, '<h2 class="section-title">Jsme tu pro vás</h2>', '<h2 class="section-title" data-i18n="contact_title">Jsme tu pro vás</h2>');
  html = r(html,
    'Neváhejte nás kontaktovat s jakýmkoliv dotazem. Obvykle odpovídáme do 24 hodin.\n            Rádi si povídáme o yorkshire teriérech — to je naše velká vášeň!',
    '<span data-i18n="contact_desc">Neváhejte nás kontaktovat s jakýmkoliv dotazem. Obvykle odpovídáme do 24 hodin. Rádi si povídáme o yorkshire teriérech — to je naše velká vášeň!</span>'
  );

  // contact info labels
  html = r(html, '<div class="contact-info__label">E-mail</div>', '<div class="contact-info__label" data-i18n="contact_email_label">E-mail</div>');
  html = r(html, '<div class="contact-info__label">Telefon / WhatsApp</div>', '<div class="contact-info__label" data-i18n="contact_phone_label">Telefon / WhatsApp</div>');
  html = r(html, '<div class="contact-info__label">Umístění</div>', '<div class="contact-info__label" data-i18n="contact_location_label">Umístění</div>');
  html = r(html, '<div class="contact-info__value">Česká republika</div>', '<div class="contact-info__value" data-i18n="contact_location_val">Česká republika</div>');
  html = r(html, '<div class="contact-info__label">Odpovídáme</div>', '<div class="contact-info__label" data-i18n="contact_hours_label">Odpovídáme</div>');
  html = r(html, '<div class="contact-info__value">Po–Pá · 9:00 – 19:00</div>', '<div class="contact-info__value" data-i18n="contact_hours_val">Po–Pá · 9:00 – 19:00</div>');
  html = r(html,
    '<div class="contact-info__label" style="margin-bottom:12px;">Sledujte nás</div>',
    '<div class="contact-info__label" style="margin-bottom:12px;" data-i18n="contact_follow">Sledujte nás</div>'
  );

  // FAQ
  html = r(html,
    '<h4 style="color:var(--color-navy); margin-bottom:16px;">Časté dotazy</h4>',
    '<h4 style="color:var(--color-navy); margin-bottom:16px;" data-i18n="faq_title">Časté dotazy</h4>'
  );
  html = r(html,
    'Ve kolika týdnech štěňata předáváte?',
    '<span data-i18n="faq1_q">Ve kolika týdnech štěňata předáváte?</span>'
  );
  html = r(html,
    'Štěňata předáváme v 10 týdnech věku, kdy jsou plně socializovaná a schopná opustit matku.',
    '<span data-i18n="faq1_a">Štěňata předáváme v 10 týdnech věku, kdy jsou plně socializovaná a schopná opustit matku.</span>'
  );
  html = r(html,
    'Jaká je záloha pro rezervaci?',
    '<span data-i18n="faq2_q">Jaká je záloha pro rezervaci?</span>'
  );
  html = r(html,
    'Rezervační záloha je 5 000 Kč, která se odečítá z konečné ceny štěněte.',
    '<span data-i18n="faq2_a">Rezervační záloha je 5 000 Kč, která se odečítá z konečné ceny štěněte.</span>'
  );
  html = r(html,
    'Zasíláte štěňata do zahraničí?',
    '<span data-i18n="faq3_q">Zasíláte štěňata do zahraničí?</span>'
  );
  html = r(html,
    'Ano, zkušenosti máme s vývozem do celé EU. Štěňata cestují s EU pasem a splňují všechny požadavky.',
    '<span data-i18n="faq3_a">Ano, zkušenosti máme s vývozem do celé EU. Štěňata cestují s EU pasem a splňují všechny požadavky.</span>'
  );

  // form
  html = r(html,
    '<h3 style="color:var(--color-navy); margin-bottom:6px;">Napište nám zprávu</h3>',
    '<h3 style="color:var(--color-navy); margin-bottom:6px;" data-i18n="form_title">Napište nám zprávu</h3>'
  );
  html = r(html,
    '<p style="font-size:0.88rem; margin-bottom:28px;">Vyplňte formulář a ozveme se vám co nejdříve.</p>',
    '<p style="font-size:0.88rem; margin-bottom:28px;" data-i18n="form_desc">Vyplňte formulář a ozveme se vám co nejdříve.</p>'
  );
  html = r(html, '<label for="firstName">Jméno *</label>', '<label for="firstName" data-i18n="form_firstname">Jméno *</label>');
  html = r(html, '<label for="lastName">Příjmení *</label>', '<label for="lastName" data-i18n="form_lastname">Příjmení *</label>');
  html = r(html, '<label for="email">E-mailová adresa *</label>', '<label for="email" data-i18n="form_email_lbl">E-mailová adresa *</label>');
  html = r(html, '<label for="phone">Telefon</label>', '<label for="phone" data-i18n="form_phone_lbl">Telefon</label>');
  html = r(html, '<label for="subject">Téma zprávy</label>', '<label for="subject" data-i18n="form_subject_lbl">Téma zprávy</label>');
  html = r(html, '<option value="">Vyberte téma…</option>', '<option value="" data-i18n="form_subject_opt0">Vyberte téma…</option>');
  html = r(html, '<option value="stenata">Zájem o štěně</option>', '<option value="stenata" data-i18n="form_subject_opt1">Zájem o štěně</option>');
  html = r(html, '<option value="poradnik">Rezervace — pořadník</option>', '<option value="poradnik" data-i18n="form_subject_opt2">Rezervace — pořadník</option>');
  html = r(html, '<option value="info">Obecné informace</option>', '<option value="info" data-i18n="form_subject_opt3">Obecné informace</option>');
  html = r(html, '<option value="zdravi">Zdravotní dotazy</option>', '<option value="zdravi" data-i18n="form_subject_opt4">Zdravotní dotazy</option>');
  html = r(html, '<option value="jine">Jiné</option>', '<option value="jine" data-i18n="form_subject_opt5">Jiné</option>');
  html = r(html, '<label for="message">Zpráva *</label>', '<label for="message" data-i18n="form_message_lbl">Zpráva *</label>');
  html = r(html,
    'Souhlasím se zpracováním osobních údajů pro účely odpovědi na můj dotaz. *',
    '<span data-i18n="form_gdpr">Souhlasím se zpracováním osobních údajů pro účely odpovědi na můj dotaz. *</span>'
  );
  html = r(html,
    '<button type="submit" class="btn btn--primary" style="width:100%; justify-content:center; font-size:1rem;">\n                Odeslat zprávu\n              </button>',
    '<button type="submit" class="btn btn--primary" style="width:100%; justify-content:center; font-size:1rem;" data-i18n="form_submit">Odeslat zprávu</button>'
  );
  html = r(html,
    '<h4 style="color:var(--color-navy); margin-bottom:8px;">Zpráva odeslána!</h4>',
    '<h4 style="color:var(--color-navy); margin-bottom:8px;" data-i18n="form_success_title">Zpráva odeslána!</h4>'
  );
  html = r(html,
    '<p style="font-size:0.9rem;">Děkujeme za váš zájem. Ozveme se vám do 24 hodin.</p>',
    '<p style="font-size:0.9rem;" data-i18n="form_success_desc">Děkujeme za váš zájem. Ozveme se vám do 24 hodin.</p>'
  );

  html = addScript(html);
  return html;
}

// ─── run ─────────────────────────────────────────────────────────────────────

const files = [
  { name: 'index.html',    fn: transformIndex },
  { name: 'about.html',    fn: transformAbout },
  { name: 'nasi-psi.html', fn: transformDogs },
  { name: 'stena.html',    fn: transformPuppies },
  { name: 'vrhy.html',     fn: transformLitters },
  { name: 'galerie.html',  fn: transformGallery },
  { name: 'kontakt.html',  fn: transformContact },
];

files.forEach(({ name, fn }) => {
  const filePath = path.join(BASE, name);
  console.log('Processing', name);
  let html = fs.readFileSync(filePath, 'utf8');
  html = fn(html);
  fs.writeFileSync(filePath, html, 'utf8');
  console.log('  Done:', name);
});

console.log('\nAll files processed successfully.');
