<?php require_once __DIR__ . '/auth.php'; auth_require_login(); $csrfToken = csrf_token(); ?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta name="csrf-token" content="<?= htmlspecialchars($csrfToken, ENT_QUOTES, 'UTF-8') ?>" />
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Admin – Great Silkyway</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="style.css" />
  <style>
    body { background: linear-gradient(180deg, #faf8f3 0%, #f5f3ef 100%); min-height: 100vh; }

    /* ===== Hlavička ===== */
    .admin-dash { display: block; animation: gsFade 0.4s ease both; }
    .admin-header {
      background: linear-gradient(135deg, #131c33 0%, #1c2742 100%);
      color: #fff;
      padding: 18px 32px;
      display: flex; justify-content: space-between; align-items: center;
      position: sticky; top: 0; z-index: 50;
      box-shadow: 0 6px 24px rgba(13,21,48,0.18);
    }
    .admin-header__title {
      font-family: var(--font-heading);
      font-size: 1.15rem;
      display: flex; align-items: center; gap: 10px;
    }
    .admin-header__actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .admin-btn {
      padding: 10px 18px;
      border-radius: 10px;
      border: none;
      font-weight: 600;
      font-size: 0.88rem;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.22s ease;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .admin-btn--primary {
      background: linear-gradient(135deg, #d6a64a 0%, #c89438 100%);
      color: #131c33;
      box-shadow: 0 4px 14px rgba(214,166,74,0.35);
    }
    .admin-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(214,166,74,0.5); }
    .admin-btn--ghost { background: rgba(255,255,255,0.12); color: #fff; }
    .admin-btn--ghost:hover { background: rgba(255,255,255,0.22); }
    .admin-btn--danger { background: #c0392b; color: #fff; }
    .admin-btn--danger:hover { background: #a93226; }
    .admin-btn--secondary { background: #e8e4dc; color: var(--color-navy); }
    .admin-btn--secondary:hover { background: #d9d3c6; transform: translateY(-1px); }
    .admin-btn--sm { padding: 6px 12px; font-size: 0.8rem; border-radius: 8px; }

    /* Desktop: zobrazit dlouhe popisky, skryt kratke */
    .header-label-full, .btn-label-full { display: inline; }
    .header-label-short, .btn-label-short { display: none; }

    /* ===== Taby ===== */
    .admin-tabs {
      background: #fff;
      border-bottom: 1px solid #ece8df;
      padding: 0 24px;
      display: flex; gap: 4px;
      overflow-x: auto;
      box-shadow: 0 2px 10px rgba(13,21,48,0.04);
    }
    .admin-tab {
      padding: 14px 20px;
      background: none; border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 0.92rem; font-weight: 600;
      color: var(--color-text-soft);
      font-family: inherit;
      white-space: nowrap;
      transition: all 0.2s;
    }
    .admin-tab:hover { color: var(--color-navy); background: rgba(214,166,74,0.06); }
    .admin-tab.active { color: var(--color-navy); border-bottom-color: var(--color-gold); }

    .admin-main { max-width: 980px; margin: 0 auto; padding: 32px 24px; }
    .admin-panel { display: none; animation: gsFadeUp 0.35s ease both; }
    .admin-panel.active { display: block; }

    .admin-section-title { font-family: var(--font-heading); font-size: 1.45rem; color: var(--color-navy); margin-bottom: 6px; }
    .admin-section-sub { color: var(--color-text-soft); margin-bottom: 24px; font-size: 0.92rem; line-height: 1.55; }

    /* ===== Karta editoru ===== */
    .item-card {
      background: #fff;
      border: 1px solid #ece8df;
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(13,21,48,0.04);
      animation: gsFadeUp 0.4s ease both;
      transition: transform 0.22s ease, box-shadow 0.22s ease;
    }
    .item-card:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(13,21,48,0.08); }

    .item-card__head {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      margin-bottom: 16px;
    }
    .item-card__head h3 {
      font-family: var(--font-heading);
      color: var(--color-navy);
      font-size: 1.1rem;
      margin: 0;
    }
    .item-card__head .badge {
      background: rgba(214,166,74,0.18);
      color: #8a6818;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .item-card__grid {
      display: grid; grid-template-columns: 160px 1fr; gap: 20px;
      align-items: start;
    }
    @media (max-width: 720px) { .item-card__grid { grid-template-columns: 1fr; } }

    .photo-zone {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 12px;
      background: #faf8f3;
      border: 2px dashed #d1c9ba;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all 0.22s ease;
    }
    .photo-zone:hover { border-color: var(--color-gold); background: #fff8e7; transform: scale(1.01); }
    .photo-zone img { width: 100%; height: 100%; object-fit: cover; }
    .photo-zone__hint {
      font-size: 0.78rem; color: var(--color-text-soft); text-align: center; padding: 10px;
    }
    .photo-zone__hint b { display: block; color: var(--color-navy); font-size: 1.5rem; margin-bottom: 4px; }

    .field-grid { display: grid; gap: 12px; }
    .field { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 10px; }
    @media (max-width: 600px) { .field { grid-template-columns: 1fr; } }
    .field > label { font-size: 0.84rem; font-weight: 600; color: var(--color-navy); }
    .field--full > label { align-self: flex-start; padding-top: 8px; }

    .input, .textarea, .select {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid #e1dcd1;
      border-radius: 8px;
      font-size: 0.94rem;
      font-family: inherit;
      background: #fff;
      color: var(--color-navy);
      transition: all 0.18s ease;
    }
    .input:focus, .textarea:focus, .select:focus {
      outline: none;
      border-color: var(--color-gold);
      box-shadow: 0 0 0 3px rgba(214,166,74,0.18);
    }
    .textarea { resize: vertical; min-height: 70px; }

    /* ===== Úspěchy (sub-array u psů) ===== */
    .achievements {
      margin-top: 10px;
      padding: 14px;
      background: #faf8f3;
      border-radius: 10px;
      border: 1px solid #ece8df;
    }
    .achievements__title { font-weight: 700; color: var(--color-navy); font-size: 0.88rem; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
    .achievement-row {
      display: grid;
      grid-template-columns: 1fr 1fr 110px 36px;
      gap: 8px;
      margin-bottom: 8px;
      animation: gsFadeUp 0.25s ease both;
    }
    @media (max-width: 600px) { .achievement-row { grid-template-columns: 1fr; } }
    .achievement-row .icon-btn {
      background: #fff;
      border: 1px solid #e1dcd1;
      color: #c0392b;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.18s ease;
    }
    .achievement-row .icon-btn:hover { background: #fee; border-color: #c0392b; }

    /* ===== Empty state, toast ===== */
    .empty-state {
      background: #fff;
      border: 2px dashed #ece8df;
      border-radius: 14px;
      padding: 50px 30px;
      text-align: center;
      color: var(--color-text-soft);
      margin-bottom: 20px;
    }
    .empty-state__icon { font-size: 2.8rem; margin-bottom: 10px; }

    .toast {
      position: fixed; bottom: 24px; right: 24px;
      background: linear-gradient(135deg, #131c33, #1c2742);
      color: #fff;
      padding: 14px 22px;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 14px 36px rgba(13,21,48,0.3);
      opacity: 0; transform: translateY(14px);
      transition: all 0.3s ease;
      z-index: 100;
      max-width: 360px;
    }
    .toast.show { opacity: 1; transform: translateY(0); }
    .toast--success { background: linear-gradient(135deg, #1f7a4d, #2f9e6b); }
    .toast--error { background: linear-gradient(135deg, #8a1e15, #c0392b); }

    /* ===== Texty boxy ===== */
    .info-box {
      background: #fff;
      border: 1px solid #ece8df;
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(13,21,48,0.04);
      animation: gsFadeUp 0.35s ease both;
    }
    .info-box h3 { color: var(--color-navy); font-family: var(--font-heading); margin-bottom: 10px; font-size: 1.1rem; }
    .info-box p { color: var(--color-text-soft); font-size: 0.88rem; margin-bottom: 14px; line-height: 1.6; }
    .info-box ol, .info-box ul { color: var(--color-text-soft); font-size: 0.9rem; line-height: 1.7; padding-left: 20px; margin-bottom: 14px; }
    .info-box code { background: #f5f3ef; padding: 2px 7px; border-radius: 5px; font-family: monospace; font-size: 0.85rem; color: #1c2742; }

    /* ===== Animace ===== */
    @keyframes gsFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes gsFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes gsPulse {
      0%, 100% { box-shadow: 0 4px 14px rgba(214,166,74,0.35), 0 0 0 0 rgba(214,166,74,0.4); }
      50% { box-shadow: 0 4px 14px rgba(214,166,74,0.35), 0 0 0 10px rgba(214,166,74,0); }
    }
    .admin-btn--primary { animation: gsPulse 2.6s ease-in-out infinite; }

    /* ===== Drag handle pro řazení ===== */
    .reorder-buttons { display: inline-flex; gap: 2px; margin-right: 6px; }
    .reorder-buttons button {
      width: 26px; height: 26px;
      border: 1px solid #e1dcd1;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
      color: var(--color-navy);
      transition: all 0.18s;
    }
    .reorder-buttons button:hover { background: var(--color-gold); color: #fff; }

    .photo-zone__remove {
      position: absolute;
      top: 6px; right: 6px;
      background: rgba(192,57,43,0.9);
      color: #fff;
      border: none;
      width: 26px; height: 26px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 0.85rem;
      display: none;
    }
    .photo-zone:has(img) .photo-zone__remove { display: block; }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #d6a64a, #c89438); border-radius: 6px; }
    ::-webkit-scrollbar-track { background: #f5f3ef; }

    /* =========================================================
       MOBILNI VYLEPSENI (≤ 768px)
       ========================================================= */
    @media (max-width: 768px) {
      /* Kompaktni hlavicka, bez pulsu (setri vykon) */
      .admin-header {
        padding: 10px 14px;
        gap: 8px;
      }
      .admin-header__title {
        font-size: 0.95rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        min-width: 0;
      }
      .admin-header__title .header-label-full { display: none; }
      .admin-header__title .header-label-short { display: inline; }
      .admin-header__actions { gap: 6px; flex-wrap: nowrap; }
      .admin-btn { padding: 9px 12px; font-size: 0.85rem; }
      .admin-btn--primary { animation: none; }
      .admin-btn .btn-label-full { display: none; }
      .admin-btn .btn-label-short { display: inline; }

      /* Taby - pripnute pod hlavickou, plynule scrollovani */
      .admin-tabs {
        padding: 0 8px;
        position: sticky;
        top: 56px;
        z-index: 40;
        scroll-snap-type: x mandatory;
        -webkit-overflow-scrolling: touch;
      }
      .admin-tab {
        padding: 12px 14px;
        font-size: 0.85rem;
        scroll-snap-align: start;
        min-width: max-content;
      }

      /* Hlavni obsah - mensi padding */
      .admin-main { padding: 16px 12px 80px; }

      .admin-section-title { font-size: 1.2rem; }
      .admin-section-sub { font-size: 0.85rem; margin-bottom: 16px; }

      /* Karta editoru - kompaktnejsi */
      .item-card { padding: 14px; border-radius: 12px; }
      .item-card__head { flex-wrap: wrap; margin-bottom: 12px; gap: 8px; }
      .item-card__head h3 { font-size: 0.98rem; flex: 1 1 100%; }
      .item-card__head > div { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }

      /* Foto - mensi nez plna sirka, aby nezabralo cely viewport */
      .item-card__grid { gap: 14px; }
      .photo-zone {
        max-width: 200px;
        margin: 0 auto;
      }

      /* Tlacitka v karte - vetsi pro touch (44px+) */
      .admin-btn--sm { padding: 9px 14px; font-size: 0.85rem; }
      .reorder-buttons button {
        width: 36px; height: 36px;
        font-size: 0.9rem;
      }
      .photo-zone__remove {
        width: 32px; height: 32px;
        font-size: 0.95rem;
        top: 8px; right: 8px;
      }

      /* Pole - vetsi touch oblast */
      .input, .textarea, .select {
        padding: 11px 12px;
        font-size: 16px; /* min 16px aby iOS nezoomoval */
      }
      .field > label { font-size: 0.82rem; }

      /* Uspechy - lepsi rozlozeni */
      .achievements { padding: 12px; }
      .achievement-row { grid-template-columns: 1fr; gap: 8px; }
      .achievement-row .icon-btn {
        height: 38px;
        background: #fff5f4;
        border-color: #e8b8b3;
      }

      /* Empty state - mensi */
      .empty-state { padding: 32px 18px; }
      .empty-state__icon { font-size: 2.4rem; }

      /* Toast - sirka cele obrazovky, dolu */
      .toast {
        left: 12px; right: 12px; bottom: 12px;
        max-width: none;
        padding: 14px 18px;
        font-size: 0.9rem;
        text-align: center;
      }

      /* Sticky FAB pro "Pridat" (volitelne - jen vetsi viditelnost) */
      .admin-panel > button.admin-btn--secondary {
        position: sticky;
        bottom: 12px;
        width: 100%;
        padding: 14px;
        font-size: 0.95rem;
        box-shadow: 0 8px 24px rgba(13,21,48,0.18);
        z-index: 30;
      }

      /* Texty boxy */
      .info-box { padding: 16px; }
      .info-box h3 { font-size: 1rem; }
    }

    /* Hluboke obrazovky (≤ 400px) - jeste tesnejsi */
    @media (max-width: 400px) {
      .admin-header { padding: 8px 10px; }
      .admin-header__title { font-size: 0.85rem; }
      .admin-btn { padding: 8px 10px; font-size: 0.8rem; }
      .item-card { padding: 12px; }
      .item-card__head h3 { font-size: 0.92rem; }
    }
  </style>

  <link rel="icon" type="image/png" href="great-logo.png" />
  <link rel="apple-touch-icon" href="great-logo.png" />
</head>
<body>

  <div class="admin-dash">
    <div class="admin-header">
      <div class="admin-header__title">🐶 <span class="header-label-full">Great Silkyway – Admin</span><span class="header-label-short">Admin</span></div>
      <div class="admin-header__actions">
        <button class="admin-btn admin-btn--ghost" onclick="translateAll(this)" title="Auto-překlad všech českých textů do EN">🌐 <span class="btn-label-full">Přeložit vše do EN</span><span class="btn-label-short">EN</span></button>
        <button class="admin-btn admin-btn--primary" onclick="publishToWeb()" id="publishBtn">🚀 <span class="btn-label-full">Publikovat na web</span><span class="btn-label-short">Publikovat</span></button>
        <button class="admin-btn admin-btn--ghost" onclick="location.href='logout.php'"><span class="btn-label-full">Odhlásit</span><span class="btn-label-short">Odhlásit</span></button>
      </div>
    </div>

    <div class="admin-tabs">
      <button class="admin-tab active" data-tab="dogs" onclick="switchTab('dogs')">🐕 Naši psi</button>
      <button class="admin-tab" data-tab="puppies" onclick="switchTab('puppies')">🐾 Štěňátka</button>
      <button class="admin-tab" data-tab="litters" onclick="switchTab('litters')">📅 Vrhy</button>
      <button class="admin-tab" data-tab="gallery" onclick="switchTab('gallery')">🖼 Galerie</button>
      <button class="admin-tab" data-tab="texts" onclick="switchTab('texts')">✏️ Texty</button>
    </div>

    <div class="admin-main">

      <!-- DOGS TAB -->
      <div class="admin-panel active" id="tab-dogs">
        <div class="admin-section-title">Naši psi a feny</div>
        <div class="admin-section-sub">Dospělí psi a feny zobrazení v sekci „Naši psi". Vyplňte jméno, popis, fotku a úspěchy. Pohlaví určuje, zda se zobrazí mezi fenami nebo psy.</div>
        <div id="dogList"></div>
        <button class="admin-btn admin-btn--secondary" onclick="addDog()">+ Přidat psa / fenu</button>
      </div>

      <!-- PUPPIES TAB -->
      <div class="admin-panel" id="tab-puppies">
        <div class="admin-section-title">Štěňátka</div>
        <div class="admin-section-sub">Štěňátka zobrazená na úvodní stránce a v sekci „Štěňata". Stačí vyplnit jméno, pohlaví, stav a fotku.</div>
        <div id="puppyList"></div>
        <button class="admin-btn admin-btn--secondary" onclick="addPuppy()">+ Přidat štěňátko</button>
      </div>

      <!-- LITTERS TAB -->
      <div class="admin-panel" id="tab-litters">
        <div class="admin-section-title">Vrhy</div>
        <div class="admin-section-sub">Vrhy zobrazené v sekci „Vrhy". Nahrajte titulní fotku, doplňte popis a stav (Dostupný / Nedostupné / Rezervované).</div>
        <div id="litterList"></div>
        <button class="admin-btn admin-btn--secondary" onclick="addLitter()">+ Přidat vrh</button>
      </div>

      <!-- GALLERY TAB -->
      <div class="admin-panel" id="tab-gallery">

        <!-- ALBA ŠTĚŇAT (podkategorie podle jmen) -->
        <div id="albumsBox">
          <div class="admin-section-title">Štěňata – alba podle jmen</div>
          <div class="admin-section-sub">Přidejte jméno štěňátka. Vytvoří se podkategorie v Galerii → Štěňata. Kliknutím na jméno otevřete jeho album a nahrajete do něj fotky.</div>
          <div id="albumList"></div>
          <button class="admin-btn admin-btn--secondary" onclick="addAlbum()">+ Přidat jméno štěňátka</button>
        </div>

        <!-- DETAIL ALBA (fotky jednoho štěňátka) -->
        <div id="albumDetail" style="display:none;"></div>

        <!-- VŠECHNY FOTKY -->
        <div id="galleryMain">
          <div class="admin-section-title" style="margin-top:34px;">Všechny fotky v galerii</div>
          <div class="admin-section-sub">Fotky zobrazené v sekci „Galerie". Vyberte kategorii (např. „Štěňata", „Senorita", „Matteo"…) a nahrajte fotku. U kategorie „Štěňata" můžete fotku navíc přiřadit ke konkrétnímu jménu.</div>
          <div id="galleryList"></div>
          <button class="admin-btn admin-btn--secondary" onclick="addGallery()">+ Přidat fotku</button>
        </div>
      </div>

      <!-- TEXTS TAB -->
      <div class="admin-panel" id="tab-texts">
        <div class="admin-section-title">Texty webu</div>
        <div class="admin-section-sub">Upravte hlavní texty úvodní stránky a kontaktní údaje. Prázdné pole = ponechá se výchozí text z webu.</div>

        <div class="info-box">
          <h3>Hero sekce (úvod)</h3>
          <div class="field"><label>Nadpis 1:</label><input class="input" type="text" id="txt-hero-title1" placeholder="Krásní Yorkshire teriéři" /></div>
          <div class="field" style="margin-top:10px;"><label>Nadpis 2:</label><input class="input" type="text" id="txt-hero-title2" placeholder="s láskou a péčí" /></div>
          <div class="field field--full" style="margin-top:10px;"><label>Popis:</label><textarea class="textarea" id="txt-hero-desc" rows="3" placeholder="Vítejte na webu naší chovatelské stanice…"></textarea></div>
        </div>

        <div class="info-box">
          <h3>Kontakt</h3>
          <div class="field"><label>Telefon:</label><input class="input" type="text" id="txt-phone" placeholder="+420 777 757 076" /></div>
          <div class="field" style="margin-top:10px;"><label>E-mail:</label><input class="input" type="text" id="txt-email" placeholder="info@greatsilkyway.cz" /></div>
        </div>
      </div>

    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script>
    // ===== CONFIG =====
    const STORAGE_KEY = 'gs_admin_content_v2';

    // ===== STATE =====
    let content = {
      dogs: [],
      puppies: [],
      litters: [],
      gallery: [],
      puppyAlbums: [],
      texts: {}
    };

    // Prazdna kostra obsahu - pouzita pri nacitani, importu i resetu
    function emptyContent() {
      return { dogs: [], puppies: [], litters: [], gallery: [], puppyAlbums: [], texts: {} };
    }

    const CATEGORIES = [
      { value: 'senorita', label: 'Senorita (fena)' },
      { value: 'michelle', label: 'Michelle (fena)' },
      { value: 'oxygen', label: 'Oxygen (fena)' },
      { value: 'matteo', label: 'Matteo (pes)' },
      { value: 'stenata', label: 'Štěňata' },
      { value: 'vrhy', label: 'Vrhy' },
      { value: 'psi', label: 'Dospělí psi (obecně)' },
    ];

    function logout() {
      fetch(location.href, { headers: { 'Authorization': 'Basic ' + btoa('logout:logout') } })
        .finally(() => { location.href = 'index.html'; });
    }

    // Pojistka proti race condition: Publikovat zakazat dokud nedobehne loadContent
    let contentLoaded = false;
    let loadFromServerOk = false;

    const PUBLISH_BTN_HTML = '🚀 <span class="btn-label-full">Publikovat na web</span><span class="btn-label-short">Publikovat</span>';

    async function showDashboard() {
      const publishBtn = document.getElementById('publishBtn');
      publishBtn.disabled = true;
      publishBtn.innerHTML = '⏳ <span class="btn-label-full">Načítám data ze serveru…</span><span class="btn-label-short">Načítám…</span>';
      await loadContent();
      renderAll();
      loadTexts();
      contentLoaded = true;
      publishBtn.disabled = false;
      publishBtn.innerHTML = PUBLISH_BTN_HTML;
    }
    showDashboard();

    function switchTab(id) {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === id));
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + id));
    }

    // ===== STORAGE =====
    // Pri otevreni adminu nejprv stahnout aktualni content.json ze serveru,
    // aby admin videl ZIVA data a publikovani neprepisalo predchozi obsah.
    async function loadContent() {
      let serverContent = null;
      try {
        const res = await fetch('content.json?_=' + Date.now(), { cache: 'no-store' });
        if (res.ok) serverContent = await res.json();
      } catch {}

      if (serverContent && typeof serverContent === 'object') {
        content = Object.assign(emptyContent(), serverContent);
        loadFromServerOk = true;
      } else {
        // Server nevratil nic - pouzij lokalni zalohu
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          try { content = Object.assign(emptyContent(), JSON.parse(saved)); } catch {}
        } else {
          // Migrace ze stareho klice
          const old = localStorage.getItem('gs_admin_content');
          if (old) {
            try {
              const oldContent = JSON.parse(old);
              if (oldContent.puppies) content.puppies = oldContent.puppies;
              if (oldContent.texts) content.texts = oldContent.texts;
            } catch {}
          }
        }
      }
      ['dogs','puppies','litters','gallery','puppyAlbums'].forEach(k => { if (!Array.isArray(content[k])) content[k] = []; });
      if (!content.texts) content.texts = {};
      normalizeAlbums();

      // Lokalni zalohu vzdy aktualizujeme tim co je na serveru
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(content)); } catch {}
    }

    function renderAll() { renderDogs(); renderPuppies(); renderLitters(); renderAlbums(); renderGallery(); }

    // ===== UTILITY =====
    function escapeHtml(s) {
      return String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
    }

    // ===== TRANSLATE (CZ -> EN) =====
    // Pouziva MyMemory API - zdarma, bez klice, ~5000 znaku/den anonymne.
    // Cachuje vysledky aby setrila kvotu.
    const translateCache = (() => {
      try { return JSON.parse(localStorage.getItem('gs_translate_cache') || '{}'); } catch { return {}; }
    })();
    function saveTranslateCache() {
      try { localStorage.setItem('gs_translate_cache', JSON.stringify(translateCache)); } catch {}
    }
    async function translateCs2En(text) {
      if (!text || typeof text !== 'string') return '';
      const clean = text.trim();
      if (!clean) return '';
      if (translateCache[clean]) return translateCache[clean];
      try {
        const url = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(clean) + '&langpair=cs|en';
        const res = await fetch(url);
        const data = await res.json();
        const out = data?.responseData?.translatedText || '';
        if (out) {
          translateCache[clean] = out;
          saveTranslateCache();
        }
        return out;
      } catch (e) {
        console.error('translate error', e);
        return '';
      }
    }
    // Prelozi sadu poli objektu - vraci novy objekt s *En klici
    async function translateFields(obj, fieldList) {
      const out = {};
      for (const f of fieldList) {
        const cs = obj[f];
        if (typeof cs !== 'string' || !cs.trim()) continue;
        const en = await translateCs2En(cs);
        if (en) out[f + 'En'] = en;
      }
      return out;
    }

    const MAX_FILE_BYTES = 10 * 1024 * 1024;
    const MAX_DIMENSION = 1600;
    const JPEG_QUALITY = 0.85;

    function uploadPhoto(callback) {
      const inp = document.createElement('input');
      inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp';
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        if (!/^image\/(jpeg|png|webp)$/.test(f.type)) {
          showToast('⚠ Pouze JPG, PNG nebo WebP fotky', 'error'); return;
        }
        if (f.size > MAX_FILE_BYTES) {
          showToast('⚠ Fotka je vetsi nez 10 MB. Vyberte mensi.', 'error'); return;
        }
        resizeImage(f).then(callback).catch(() => {
          const reader = new FileReader();
          reader.onload = e => callback(e.target.result);
          reader.readAsDataURL(f);
        });
      };
      inp.click();
    }

    function resizeImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = e => { img.src = e.target.result; };
        reader.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const isPng = file.type === 'image/png';
          resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', JPEG_QUALITY));
        };
        img.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    function moveItem(arr, i, dir) {
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    // ===== DOGS =====
    function renderDogs() {
      const list = document.getElementById('dogList');
      list.innerHTML = '';
      if (content.dogs.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🐕</div>Zatím žádní psi. Klikněte na „+ Přidat psa / fenu" níže.</div>';
        return;
      }
      content.dogs.forEach((d, i) => {
        const el = document.createElement('div');
        el.className = 'item-card';
        el.innerHTML = `
          <div class="item-card__head">
            <h3>${escapeHtml(d.name || 'Nový pes')} <span class="badge">${d.gender === 'male' ? 'Pes' : 'Fena'}</span></h3>
            <div>
              <div class="reorder-buttons">
                <button onclick="moveDog(${i},-1)" title="Nahoru">▲</button>
                <button onclick="moveDog(${i},1)" title="Dolů">▼</button>
              </div>
              <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="translateDog(${i}, this)" title="Auto-překlad do angličtiny">🌐 EN</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="deleteDog(${i})">🗑 Smazat</button>
            </div>
          </div>
          <div class="item-card__grid">
            <div class="photo-zone" onclick="dogPhoto(${i})">
              ${d.photo ? `<img src="${escapeHtml(d.photo)}" alt="" />` : '<div class="photo-zone__hint"><b>+</b>Hlavní fotka</div>'}
              <button class="photo-zone__remove" onclick="event.stopPropagation(); removeDogPhoto(${i})">✕</button>
            </div>
            <div class="field-grid">
              <div class="field"><label>Jméno:</label><input class="input" value="${escapeHtml(d.name)}" oninput="updDog(${i},'name',this.value)" placeholder="Např. Earl Matteo Angel..." /></div>
              <div class="field"><label>Pohlaví:</label>
                <select class="select" onchange="updDog(${i},'gender',this.value); renderDogs();">
                  <option value="female" ${d.gender==='female'?'selected':''}>Fena</option>
                  <option value="male" ${d.gender==='male'?'selected':''}>Pes</option>
                </select>
              </div>
              <div class="field"><label>Plemeno:</label><input class="input" value="${escapeHtml(d.breed || 'Yorkshire teriér')}" oninput="updDog(${i},'breed',this.value)" /></div>
              <div class="field"><label>Tituly:</label><input class="input" value="${escapeHtml(d.titles)}" oninput="updDog(${i},'titles',this.value)" placeholder="CH CZ, Junior CH..." /></div>
              <div class="field"><label>Filtr v galerii:</label><input class="input" value="${escapeHtml(d.slug || '')}" oninput="updDog(${i},'slug',this.value)" placeholder="senorita / michelle / oxygen / matteo" /></div>
              <div class="field"><label>Zdraví:</label><input class="input" value="${escapeHtml(d.health || 'V pořádku')}" oninput="updDog(${i},'health',this.value)" /></div>
              <div class="field field--full"><label>Popis:</label><textarea class="textarea" rows="3" oninput="updDog(${i},'description',this.value)" placeholder="Krátký popis psa…">${escapeHtml(d.description)}</textarea></div>
              <div class="achievements">
                <div class="achievements__title">🏆 Úspěchy <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="addAchievement(${i})">+ Přidat úspěch</button></div>
                <div id="ach-${i}"></div>
              </div>
            </div>
          </div>`;
        list.appendChild(el);
        renderAchievements(i);
      });
    }

    function renderAchievements(di) {
      const box = document.getElementById('ach-' + di);
      const arr = content.dogs[di].achievements || [];
      if (arr.length === 0) {
        box.innerHTML = '<div style="color:var(--color-text-soft); font-size:0.85rem;">Žádné úspěchy. Klikněte na „+ Přidat úspěch".</div>';
        return;
      }
      box.innerHTML = arr.map((a, ai) => `
        <div class="achievement-row">
          <input class="input" value="${escapeHtml(a.title)}" oninput="updAch(${di},${ai},'title',this.value)" placeholder="Název soutěže" />
          <input class="input" value="${escapeHtml(a.detail)}" oninput="updAch(${di},${ai},'detail',this.value)" placeholder="Rok, místo, rozhodčí…" />
          <select class="select" onchange="updAch(${di},${ai},'medal',this.value)">
            <option value="" ${!a.medal?'selected':''}>—</option>
            <option value="gold" ${a.medal==='gold'?'selected':''}>🥇 Zlato</option>
            <option value="silver" ${a.medal==='silver'?'selected':''}>🥈 Stříbro</option>
            <option value="bronze" ${a.medal==='bronze'?'selected':''}>🥉 Bronz</option>
          </select>
          <button class="icon-btn" onclick="delAch(${di},${ai})" title="Smazat">✕</button>
        </div>
        <div class="achievement-row" style="margin-top:-4px;margin-bottom:14px;">
          <input class="input" style="grid-column:1 / span 4;" value="${escapeHtml(a.pdf || '')}" oninput="updAch(${di},${ai},'pdf',this.value)" placeholder="Cesta k PDF/obrázku (např. tituly-matteo/certifikat.pdf)" />
        </div>`).join('');
    }

    function addDog() {
      content.dogs.push({ name: 'Nový pes', gender: 'female', breed: 'Yorkshire teriér', titles: '', health: 'V pořádku', description: '', photo: '', achievements: [] });
      renderDogs();
    }
    function deleteDog(i) {
      if (!confirm('Smazat tohoto psa?')) return;
      content.dogs.splice(i, 1); renderDogs();
    }
    function moveDog(i, dir) { moveItem(content.dogs, i, dir); renderDogs(); }
    function updDog(i, f, v) { content.dogs[i][f] = v; }
    function dogPhoto(i) { uploadPhoto(d => { content.dogs[i].photo = d; renderDogs(); }); }
    function removeDogPhoto(i) { content.dogs[i].photo = ''; renderDogs(); }
    function addAchievement(i) {
      if (!content.dogs[i].achievements) content.dogs[i].achievements = [];
      content.dogs[i].achievements.push({ title: '', detail: '', medal: '' });
      renderAchievements(i);
    }
    function delAch(di, ai) { content.dogs[di].achievements.splice(ai, 1); renderAchievements(di); }
    function updAch(di, ai, f, v) { content.dogs[di].achievements[ai][f] = v; }

    async function translateDog(i, btn) {
      await runTranslate(btn, async () => {
        const d = content.dogs[i];
        const trans = await translateFields(d, ['name','description','titles','breed','health']);
        Object.assign(d, trans);
        d.achievements = d.achievements || [];
        for (const a of d.achievements) {
          const t = await translateFields(a, ['title','detail']);
          Object.assign(a, t);
        }
        return d.name;
      });
    }
    async function translatePuppy(i, btn) {
      await runTranslate(btn, async () => {
        const p = content.puppies[i];
        Object.assign(p, await translateFields(p, ['name','description','breed']));
        return p.name;
      });
    }
    async function translateLitter(i, btn) {
      await runTranslate(btn, async () => {
        const l = content.litters[i];
        Object.assign(l, await translateFields(l, ['name','description']));
        return l.name;
      });
    }
    async function translateGallery(i, btn) {
      await runTranslate(btn, async () => {
        const g = content.gallery[i];
        Object.assign(g, await translateFields(g, ['caption']));
        return g.caption;
      });
    }
    async function runTranslate(btn, fn) {
      const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = '⏳';
      try {
        const label = await fn();
        showToast('✓ Přeloženo do EN: ' + (label || ''), 'success');
      } catch (e) {
        showToast('⚠ Překlad selhal: ' + (e.message || e), 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = orig;
      }
    }

    // Globalni: prelozi VSE co jeste nema *En verzi
    // Core: prelozi vse co nema *En verzi. Vrati pocet prelozenych poli.
    async function translateMissingFields() {
      let count = 0;
      for (const d of content.dogs) {
        const fields = ['name','description','titles','breed','health'].filter(f => d[f] && !d[f+'En']);
        if (fields.length) {
          Object.assign(d, await translateFields(d, fields));
          count += fields.length;
        }
        for (const a of (d.achievements || [])) {
          const af = ['title','detail'].filter(f => a[f] && !a[f+'En']);
          if (af.length) { Object.assign(a, await translateFields(a, af)); count += af.length; }
        }
      }
      for (const p of content.puppies) {
        const f = ['name','description','breed'].filter(x => p[x] && !p[x+'En']);
        if (f.length) { Object.assign(p, await translateFields(p, f)); count += f.length; }
      }
      for (const l of content.litters) {
        const f = ['name','description'].filter(x => l[x] && !l[x+'En']);
        if (f.length) { Object.assign(l, await translateFields(l, f)); count += f.length; }
      }
      for (const g of content.gallery) {
        if (g.caption && !g.captionEn) {
          Object.assign(g, await translateFields(g, ['caption']));
          count++;
        }
      }
      for (const a of content.puppyAlbums) {
        if (a.name && !a.nameEn) {
          Object.assign(a, await translateFields(a, ['name']));
          count++;
        }
      }
      return count;
    }

    async function translateAll(btn) {
      const orig = btn.innerHTML; btn.disabled = true; btn.innerHTML = '⏳ Překládám…';
      try {
        const count = await translateMissingFields();
        showToast('✓ Přeloženo ' + count + ' polí do EN', 'success');
      } catch (e) {
        showToast('⚠ Překlad selhal: ' + (e.message || e), 'error');
      } finally {
        btn.disabled = false; btn.innerHTML = orig;
      }
    }

    // ===== PUPPIES =====
    function renderPuppies() {
      const list = document.getElementById('puppyList');
      list.innerHTML = '';
      if (content.puppies.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🐾</div>Zatím žádná štěňátka. Klikněte na „+ Přidat štěňátko" níže.</div>';
        return;
      }
      content.puppies.forEach((p, i) => {
        const el = document.createElement('div');
        el.className = 'item-card';
        el.innerHTML = `
          <div class="item-card__head">
            <h3>${escapeHtml(p.name || 'Nové štěňátko')} <span class="badge">${p.gender==='male'?'Pes':'Fena'} · ${p.status==='reserved'?'Rezervováno':'Volné'}</span></h3>
            <div>
              <div class="reorder-buttons">
                <button onclick="movePuppy(${i},-1)">▲</button>
                <button onclick="movePuppy(${i},1)">▼</button>
              </div>
              <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="translatePuppy(${i}, this)" title="Auto-překlad do angličtiny">🌐 EN</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="deletePuppy(${i})">🗑 Smazat</button>
            </div>
          </div>
          <div class="item-card__grid">
            <div class="photo-zone" onclick="puppyPhoto(${i})">
              ${p.photo ? `<img src="${escapeHtml(p.photo)}" alt="" />` : '<div class="photo-zone__hint"><b>+</b>Fotka štěněte</div>'}
              <button class="photo-zone__remove" onclick="event.stopPropagation(); removePuppyPhoto(${i})">✕</button>
            </div>
            <div class="field-grid">
              <div class="field"><label>Jméno:</label><input class="input" value="${escapeHtml(p.name)}" oninput="updPuppy(${i},'name',this.value)" /></div>
              <div class="field"><label>Pohlaví:</label>
                <select class="select" onchange="updPuppy(${i},'gender',this.value); renderPuppies();">
                  <option value="female" ${p.gender==='female'?'selected':''}>Fena</option>
                  <option value="male" ${p.gender==='male'?'selected':''}>Pes</option>
                </select>
              </div>
              <div class="field"><label>Stav:</label>
                <select class="select" onchange="updPuppy(${i},'status',this.value); renderPuppies();">
                  <option value="available" ${p.status==='available'?'selected':''}>Volné</option>
                  <option value="reserved" ${p.status==='reserved'?'selected':''}>Rezervováno</option>
                </select>
              </div>
              <div class="field field--full"><label>Popis:</label><textarea class="textarea" rows="2" oninput="updPuppy(${i},'description',this.value)">${escapeHtml(p.description)}</textarea></div>
            </div>
          </div>`;
        list.appendChild(el);
      });
    }
    function addPuppy() {
      content.puppies.push({ name: 'Nové štěňátko', gender: 'female', status: 'available', photo: '', description: '' });
      renderPuppies();
    }
    function deletePuppy(i) {
      if (!confirm('Smazat toto štěňátko?')) return;
      content.puppies.splice(i, 1); renderPuppies();
    }
    function movePuppy(i, dir) { moveItem(content.puppies, i, dir); renderPuppies(); }
    function updPuppy(i, f, v) { content.puppies[i][f] = v; }
    function puppyPhoto(i) { uploadPhoto(d => { content.puppies[i].photo = d; renderPuppies(); }); }
    function removePuppyPhoto(i) { content.puppies[i].photo = ''; renderPuppies(); }

    // ===== LITTERS =====
    function renderLitters() {
      const list = document.getElementById('litterList');
      list.innerHTML = '';
      if (content.litters.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📅</div>Zatím žádné vrhy. Klikněte na „+ Přidat vrh" níže.</div>';
        return;
      }
      content.litters.forEach((l, i) => {
        const el = document.createElement('div');
        el.className = 'item-card';
        const statusLabel = { available: 'Dostupný', unavailable: 'Nedostupné', reserved: 'Rezervované' }[l.status] || 'Nedostupné';
        el.innerHTML = `
          <div class="item-card__head">
            <h3>${escapeHtml(l.name || 'Nový vrh')} <span class="badge">${statusLabel}</span></h3>
            <div>
              <div class="reorder-buttons">
                <button onclick="moveLitter(${i},-1)">▲</button>
                <button onclick="moveLitter(${i},1)">▼</button>
              </div>
              <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="translateLitter(${i}, this)" title="Auto-překlad do angličtiny">🌐 EN</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="deleteLitter(${i})">🗑 Smazat</button>
            </div>
          </div>
          <div class="item-card__grid">
            <div class="photo-zone" onclick="litterPhoto(${i})">
              ${l.cover ? `<img src="${escapeHtml(l.cover)}" alt="" />` : '<div class="photo-zone__hint"><b>+</b>Titulní fotka</div>'}
              <button class="photo-zone__remove" onclick="event.stopPropagation(); removeLitterPhoto(${i})">✕</button>
            </div>
            <div class="field-grid">
              <div class="field"><label>Název:</label><input class="input" value="${escapeHtml(l.name)}" oninput="updLitter(${i},'name',this.value)" placeholder="Vrh A, Vrh B…" /></div>
              <div class="field"><label>Stav:</label>
                <select class="select" onchange="updLitter(${i},'status',this.value); renderLitters();">
                  <option value="available" ${l.status==='available'?'selected':''}>Dostupný</option>
                  <option value="unavailable" ${l.status==='unavailable'?'selected':''}>Nedostupné</option>
                  <option value="reserved" ${l.status==='reserved'?'selected':''}>Rezervované</option>
                </select>
              </div>
              <div class="field"><label>Otec:</label><input class="input" value="${escapeHtml(l.sire)}" oninput="updLitter(${i},'sire',this.value)" /></div>
              <div class="field"><label>Matka:</label><input class="input" value="${escapeHtml(l.dame)}" oninput="updLitter(${i},'dame',this.value)" /></div>
              <div class="field"><label>Nar.:</label><input class="input" value="${escapeHtml(l.dob)}" oninput="updLitter(${i},'dob',this.value)" placeholder="15. 3. 2026" /></div>
              <div class="field field--full"><label>Popis:</label><textarea class="textarea" rows="3" oninput="updLitter(${i},'description',this.value)">${escapeHtml(l.description)}</textarea></div>
            </div>
          </div>`;
        list.appendChild(el);
      });
    }
    function addLitter() {
      content.litters.push({ name: 'Nový vrh', status: 'unavailable', cover: '', description: '', sire: '', dame: '', dob: '' });
      renderLitters();
    }
    function deleteLitter(i) {
      if (!confirm('Smazat tento vrh?')) return;
      content.litters.splice(i, 1); renderLitters();
    }
    function moveLitter(i, dir) { moveItem(content.litters, i, dir); renderLitters(); }
    function updLitter(i, f, v) { content.litters[i][f] = v; }
    function litterPhoto(i) { uploadPhoto(d => { content.litters[i].cover = d; renderLitters(); }); }
    function removeLitterPhoto(i) { content.litters[i].cover = ''; renderLitters(); }

    // ===== ALBA ŠTĚŇAT (podkategorie galerie podle jmen) =====
    // Album = { name, nameEn, slug, cover }. Fotky alba jsou bezne polozky
    // content.gallery s category:'stenata' a album:'<slug>' - diky tomu je
    // web i admin ctou ze stejneho zdroje.

    // Aktualne otevrene album (slug) nebo null = seznam alb
    let openAlbumSlug = null;

    function slugify(s) {
      return String(s || '').toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }
    function uniqueAlbumSlug(base, exceptIndex) {
      let slug = slugify(base) || 'stene';
      const taken = i => content.puppyAlbums.some((a, idx) => idx !== exceptIndex && a.slug === i);
      if (!taken(slug)) return slug;
      let n = 2;
      while (taken(slug + '-' + n)) n++;
      return slug + '-' + n;
    }
    // Doplni chybejici/duplicitni slugy (napr. po importu starsiho content.json)
    function normalizeAlbums() {
      content.puppyAlbums.forEach((a, i) => {
        if (!a.slug || content.puppyAlbums.some((b, j) => j < i && b.slug === a.slug)) {
          a.slug = uniqueAlbumSlug(a.slug || a.name, i);
        }
      });
    }
    function albumPhotoIndexes(slug) {
      const out = [];
      content.gallery.forEach((g, i) => {
        if (g.category === 'stenata' && g.album === slug) out.push(i);
      });
      return out;
    }

    function renderAlbums() {
      const list = document.getElementById('albumList');
      if (!list) return;
      list.innerHTML = '';
      if (content.puppyAlbums.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🐾</div>'
          + 'Zatím žádná jména štěňat. Klikněte na „+ Přidat jméno štěňátka" níže.</div>';
        return;
      }
      content.puppyAlbums.forEach((a, i) => {
        const count = albumPhotoIndexes(a.slug).length;
        const cover = a.cover || (content.gallery[albumPhotoIndexes(a.slug)[0]] || {}).photo || '';
        const el = document.createElement('div');
        el.className = 'item-card';
        el.innerHTML = `
          <div class="item-card__head">
            <h3 style="cursor:pointer;" onclick="openAlbum('${escapeHtml(a.slug)}')" title="Otevřít album a přidat fotky">
              🐾 ${escapeHtml(a.name || 'Bez jména')} <span class="badge">${count} ${count === 1 ? 'fotka' : (count >= 2 && count <= 4 ? 'fotky' : 'fotek')}</span>
            </h3>
            <div>
              <div class="reorder-buttons">
                <button onclick="moveAlbum(${i},-1)">▲</button>
                <button onclick="moveAlbum(${i},1)">▼</button>
              </div>
              <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="translateAlbum(${i}, this)" title="Auto-překlad do angličtiny">🌐 EN</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="deleteAlbum(${i})">🗑 Smazat</button>
            </div>
          </div>
          <div class="item-card__grid">
            <div class="photo-zone" onclick="openAlbum('${escapeHtml(a.slug)}')">
              ${cover ? `<img src="${escapeHtml(cover)}" alt="" />` : '<div class="photo-zone__hint"><b>📷</b>Otevřít album</div>'}
            </div>
            <div class="field-grid">
              <div class="field"><label>Jméno štěňátka:</label>
                <input class="input" value="${escapeHtml(a.name)}" placeholder="např. Barron"
                       oninput="updAlbum(${i},'name',this.value)" onchange="renameAlbumSlug(${i})" /></div>
              <div class="field field--full">
                <button class="admin-btn admin-btn--primary" onclick="openAlbum('${escapeHtml(a.slug)}')">📷 Otevřít fotky (${count})</button>
              </div>
            </div>
          </div>`;
        list.appendChild(el);
      });
    }

    function addAlbum() {
      const name = 'Nové štěňátko';
      content.puppyAlbums.push({ name, nameEn: '', slug: uniqueAlbumSlug(name), cover: '' });
      renderAlbums();
      showToast('✓ Album přidáno — přepište jméno a otevřete fotky', 'success');
    }
    function updAlbum(i, f, v) { content.puppyAlbums[i][f] = v; }
    function moveAlbum(i, dir) { moveItem(content.puppyAlbums, i, dir); renderAlbums(); }
    // Po prejmenovani sladit slug a prepsat odkazy u vsech fotek alba
    function renameAlbumSlug(i) {
      const a = content.puppyAlbums[i];
      const next = uniqueAlbumSlug(a.name, i);
      if (!next || next === a.slug) { renderAlbums(); return; }
      const old = a.slug;
      a.slug = next;
      content.gallery.forEach(g => { if (g.category === 'stenata' && g.album === old) g.album = next; });
      if (openAlbumSlug === old) openAlbumSlug = next;
      renderAlbums(); renderGallery();
    }
    function deleteAlbum(i) {
      const a = content.puppyAlbums[i];
      const idxs = albumPhotoIndexes(a.slug);
      const msg = idxs.length
        ? `Smazat album „${a.name}" i s ${idxs.length} fotkami?`
        : `Smazat album „${a.name}"?`;
      if (!confirm(msg)) return;
      // Fotky alba smazat od konce, aby indexy zustaly platne
      idxs.reverse().forEach(gi => content.gallery.splice(gi, 1));
      content.puppyAlbums.splice(i, 1);
      if (openAlbumSlug === a.slug) closeAlbum();
      renderAlbums(); renderGallery();
    }
    async function translateAlbum(i, btn) {
      await runTranslate(btn, async () => {
        const a = content.puppyAlbums[i];
        Object.assign(a, await translateFields(a, ['name']));
        return a.name;
      });
    }

    // ----- Detail alba: fotky jednoho stenete -----
    function openAlbum(slug) {
      openAlbumSlug = slug;
      document.getElementById('albumsBox').style.display = 'none';
      document.getElementById('galleryMain').style.display = 'none';
      document.getElementById('albumDetail').style.display = '';
      renderAlbumDetail();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    function closeAlbum() {
      openAlbumSlug = null;
      document.getElementById('albumDetail').style.display = 'none';
      document.getElementById('albumsBox').style.display = '';
      document.getElementById('galleryMain').style.display = '';
      renderAlbums(); renderGallery();
    }
    function renderAlbumDetail() {
      const wrap = document.getElementById('albumDetail');
      const a = content.puppyAlbums.find(x => x.slug === openAlbumSlug);
      if (!a) { closeAlbum(); return; }
      const idxs = albumPhotoIndexes(a.slug);
      wrap.innerHTML = `
        <button class="admin-btn admin-btn--ghost" onclick="closeAlbum()">← Zpět na seznam jmen</button>
        <div class="admin-section-title" style="margin-top:14px;">🐾 ${escapeHtml(a.name || 'Bez jména')}</div>
        <div class="admin-section-sub">Fotky tohoto štěňátka. Na webu je najdete v Galerii pod „Štěňata → ${escapeHtml(a.name || '')}".</div>
        <div id="albumPhotoList"></div>
        <button class="admin-btn admin-btn--secondary" onclick="addAlbumPhoto()">+ Přidat fotku do alba ${escapeHtml(a.name || '')}</button>`;
      const list = document.getElementById('albumPhotoList');
      if (idxs.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🖼</div>'
          + 'Album je zatím prázdné. Klikněte na „+ Přidat fotku do alba" níže.</div>';
        return;
      }
      idxs.forEach(i => {
        const el = document.createElement('div');
        el.className = 'item-card';
        el.innerHTML = galleryCardHtml(content.gallery[i], i, true);
        list.appendChild(el);
      });
    }
    function addAlbumPhoto() {
      const a = content.puppyAlbums.find(x => x.slug === openAlbumSlug);
      if (!a) return;
      content.gallery.push({
        caption: a.name || 'Štěňátko', category: 'stenata', album: a.slug,
        photo: '', wide: false, objectPosition: 'center top'
      });
      renderAlbumDetail();
      // Rovnou otevrit vyber souboru pro nove pridanou fotku
      galleryPhoto(content.gallery.length - 1);
    }

    // ===== GALLERY =====
    // Spolecna karta fotky - pouzita v seznamu vsech fotek i v detailu alba.
    // V detailu alba (inAlbum) se skryva vyber kategorie a alba.
    function galleryCardHtml(g, i, inAlbum) {
      const catLabel = (CATEGORIES.find(c => c.value === g.category) || { label: '?' }).label;
      const album = content.puppyAlbums.find(a => a.slug === g.album);
      const badge = g.category === 'stenata' && album
        ? `${escapeHtml(catLabel)} → ${escapeHtml(album.name)}`
        : escapeHtml(catLabel);
      const rerender = inAlbum ? 'renderAlbumDetail()' : 'renderGallery()';
      // V albu se prehazuje poradi jen mezi fotkami daneho stenete
      const moveFn = inAlbum ? 'moveAlbumPhoto' : 'moveGallery';
      const albumField = (inAlbum || g.category !== 'stenata') ? '' : `
              <div class="field"><label>Jméno štěňátka:</label>
                <select class="select" onchange="updGallery(${i},'album',this.value); renderGallery();">
                  <option value="">— bez jména (obecné štěňata) —</option>
                  ${content.puppyAlbums.map(a => `<option value="${escapeHtml(a.slug)}" ${g.album === a.slug ? 'selected' : ''}>${escapeHtml(a.name)}</option>`).join('')}
                </select>
              </div>`;
      const catField = inAlbum ? '' : `
              <div class="field"><label>Kategorie:</label>
                <select class="select" onchange="updGallery(${i},'category',this.value); renderGallery();">
                  ${CATEGORIES.map(c => `<option value="${c.value}" ${g.category === c.value ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('')}
                </select>
              </div>`;
      return `
          <div class="item-card__head">
            <h3>${escapeHtml(g.caption || 'Nová fotka')} <span class="badge">${badge}</span></h3>
            <div>
              <div class="reorder-buttons">
                <button onclick="${moveFn}(${i},-1)">▲</button>
                <button onclick="${moveFn}(${i},1)">▼</button>
              </div>
              <button class="admin-btn admin-btn--secondary admin-btn--sm" onclick="translateGallery(${i}, this)" title="Auto-překlad do angličtiny">🌐 EN</button>
              <button class="admin-btn admin-btn--danger admin-btn--sm" onclick="deleteGallery(${i})">🗑 Smazat</button>
            </div>
          </div>
          <div class="item-card__grid">
            <div class="photo-zone" onclick="galleryPhoto(${i})">
              ${g.photo ? `<img src="${escapeHtml(g.photo)}" alt="" />` : '<div class="photo-zone__hint"><b>+</b>Fotka</div>'}
              <button class="photo-zone__remove" onclick="event.stopPropagation(); removeGalleryPhoto(${i})">✕</button>
            </div>
            <div class="field-grid">
              <div class="field"><label>Popisek:</label><input class="input" value="${escapeHtml(g.caption)}" oninput="updGallery(${i},'caption',this.value)" /></div>
              ${catField}${albumField}
              <div class="field"><label>Široká:</label><label style="font-weight:normal;"><input type="checkbox" ${g.wide ? 'checked' : ''} onchange="updGallery(${i},'wide',this.checked); ${rerender};" /> Fotka zabere 2 sloupce</label></div>
              <div class="field"><label>Výřez:</label><input class="input" value="${escapeHtml(g.objectPosition || 'center center')}" oninput="updGallery(${i},'objectPosition',this.value)" placeholder="center center / center top / 30% 50%" /></div>
            </div>
          </div>`;
    }

    function renderGallery() {
      const list = document.getElementById('galleryList');
      list.innerHTML = '';
      if (content.gallery.length === 0) {
        list.innerHTML = '<div class="empty-state"><div class="empty-state__icon">🖼</div>Zatím žádné fotky. Klikněte na „+ Přidat fotku" níže.</div>';
        return;
      }
      content.gallery.forEach((g, i) => {
        const el = document.createElement('div');
        el.className = 'item-card';
        el.innerHTML = galleryCardHtml(g, i, false);
        list.appendChild(el);
      });
    }
    // Po zmene poradi/mazani se prekresli i prave otevrene album
    function refreshGalleryViews() {
      renderGallery();
      renderAlbums();
      if (openAlbumSlug) renderAlbumDetail();
    }
    function addGallery() {
      content.gallery.push({ caption: 'Nová fotka', category: 'stenata', album: '', photo: '', wide: false, objectPosition: 'center center' });
      renderGallery();
    }
    function deleteGallery(i) {
      if (!confirm('Smazat tuto fotku?')) return;
      content.gallery.splice(i, 1); refreshGalleryViews();
    }
    function moveGallery(i, dir) { moveItem(content.gallery, i, dir); refreshGalleryViews(); }
    // Prohodi fotku se sousedni fotkou TEHOZ alba (ne s libovolnou sousedni polozkou galerie)
    function moveAlbumPhoto(i, dir) {
      const idxs = albumPhotoIndexes(openAlbumSlug);
      const pos = idxs.indexOf(i);
      const target = idxs[pos + dir];
      if (pos < 0 || target === undefined) return;
      [content.gallery[i], content.gallery[target]] = [content.gallery[target], content.gallery[i]];
      refreshGalleryViews();
    }
    function updGallery(i, f, v) { content.gallery[i][f] = v; }
    function galleryPhoto(i) { uploadPhoto(d => { content.gallery[i].photo = d; refreshGalleryViews(); }); }
    function removeGalleryPhoto(i) { content.gallery[i].photo = ''; refreshGalleryViews(); }

    // ===== TEXTS =====
    function loadTexts() {
      const t = content.texts || {};
      document.getElementById('txt-hero-title1').value = t.hero_title1 || '';
      document.getElementById('txt-hero-title2').value = t.hero_title2 || '';
      document.getElementById('txt-hero-desc').value = t.hero_desc || '';
      document.getElementById('txt-phone').value = t.phone || '';
      document.getElementById('txt-email').value = t.email || '';
    }
    function collectTexts() {
      content.texts = {
        hero_title1: document.getElementById('txt-hero-title1').value.trim(),
        hero_title2: document.getElementById('txt-hero-title2').value.trim(),
        hero_desc: document.getElementById('txt-hero-desc').value.trim(),
        phone: document.getElementById('txt-phone').value.trim(),
        email: document.getElementById('txt-email').value.trim(),
      };
      Object.keys(content.texts).forEach(k => { if (!content.texts[k]) delete content.texts[k]; });
    }

    // ===== SAVE / EXPORT =====
    function saveChanges() {
      collectTexts();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
        showToast('✓ Uloženo do prohlížeče', 'success');
      } catch (e) {
        showToast('⚠ Úložiště je plné. Stáhněte content.json a smažte nepoužívané fotky.', 'error');
      }
    }
    async function publishToWeb() {
      // POJISTKA 1: Pokud jeste nedobehlo nacitani dat ze serveru, NIC neposilat
      if (!contentLoaded) {
        showToast('⚠ Pockejte na nacteni dat (par vterin)…', 'error');
        return;
      }
      // POJISTKA 2: Pokud nacteni ze serveru selhalo, varovat - hrozi prepis
      // serverovych dat lokalni zalohou (ktera muze byt stara nebo prazdna)
      if (!loadFromServerOk) {
        if (!confirm('Pozor! Pri otevreni adminu se nepodarilo nacist data ze serveru. '
                   + 'Publikovani teď MŮŽE PŘEPSAT obsah na webu lokalni zalohou. '
                   + 'Pokracovat?')) return;
      }
      collectTexts();
      // POJISTKA 3: Pokud se chysta publikovat KOMPLETNE prazdny obsah, zastavit a zeptat se
      const totalItems = content.dogs.length + content.puppies.length + content.litters.length + content.gallery.length;
      if (totalItems === 0) {
        if (!confirm('Pozor! Publikujete UPLNE PRAZDNY obsah - smazete vsechna stenata, '
                   + 'psy, vrhy i fotky z webu. Opravdu pokracovat?')) return;
      }
      const btn = document.getElementById('publishBtn');
      const originalHtml = btn.innerHTML;
      btn.disabled = true;

      // AUTO-PREKLAD: pred publikaci dolozit chybejici EN preklady
      btn.innerHTML = '⏳ Překládám do EN…';
      let translatedCount = 0;
      try {
        translatedCount = await translateMissingFields();
      } catch (e) {
        // Preklad nesmi blokovat publikaci. Pokracujeme i kdyz API selze.
        console.warn('Auto-preklad selhal, pokracuji v publikaci:', e);
      }

      btn.innerHTML = '⏳ Publikuji…';
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(content));
      } catch {}
      try {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content || '';
        const res = await fetch('save-content.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrf,
          },
          credentials: 'include',
          body: JSON.stringify(content),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          const kb = Math.round((data.bytes || 0) / 1024);
          const tr = translatedCount > 0 ? ' · 🌐 ' + translatedCount + ' polí přeloženo' : '';
          showToast('🚀 Publikováno na web! (' + kb + ' KB)' + tr, 'success');
        } else {
          showToast('⚠ Chyba: ' + (data.error || res.status), 'error');
        }
      } catch (e) {
        showToast('⚠ Spojení selhalo: ' + e.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalHtml;
      }
    }

    function exportContent() {
      collectTexts();
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(content)); } catch {}
      const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'content.json'; a.click();
      URL.revokeObjectURL(url);
      showToast('📥 Stahování zahájeno — soubor nahrajte přes FileZillu na server', 'success');
    }
    function importContent() {
      const file = document.getElementById('importFile').files[0];
      if (!file) { alert('Vyberte soubor.'); return; }
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const imported = JSON.parse(e.target.result);
          content = Object.assign(emptyContent(), imported);
          ['dogs','puppies','litters','gallery','puppyAlbums'].forEach(k => { if (!Array.isArray(content[k])) content[k] = []; });
          normalizeAlbums();
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(content)); } catch {}
          openAlbumSlug = null; closeAlbum();
          renderAll(); loadTexts();
          showToast('✓ Obsah načten', 'success');
        } catch {
          showToast('⚠ Neplatný soubor', 'error');
        }
      };
      reader.readAsText(file);
    }
    function resetAll() {
      if (!confirm('Opravdu obnovit výchozí obsah? Všechny vaše úpravy se smažou.')) return;
      localStorage.removeItem(STORAGE_KEY);
      content = emptyContent();
      closeAlbum();
      renderAll(); loadTexts();
      showToast('↺ Obnoveno', 'success');
    }

    function showToast(msg, type) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.className = 'toast show' + (type ? ' toast--' + type : '');
      setTimeout(() => t.classList.remove('show'), 3200);
    }
  </script>
</body>
</html>
