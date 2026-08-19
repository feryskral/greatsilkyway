// Content loader — načte úpravy z admin panelu
// Zdroj dat (v pořadí priority):
//   1. content.json (na serveru — vidí všichni návštěvníci)
//   2. localStorage (vidí jen admin pro náhled)

(function () {
  const STORAGE_KEYS = ['gs_admin_content_v2', 'gs_admin_content'];
  let content = null;

  fetch('content.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
    .then(data => {
      if (data) {
        content = data;
      } else {
        for (const k of STORAGE_KEYS) {
          const local = localStorage.getItem(k);
          if (local) { try { content = JSON.parse(local); break; } catch {} }
        }
      }
      if (content) apply(content);
    });

  function apply(c) {
    hookLangSwitch();
    if (Array.isArray(c.dogs) && c.dogs.length) applyDogs(c.dogs);
    if (Array.isArray(c.puppies) && c.puppies.length) applyPuppies(c.puppies);
    applyPuppyAlert(Array.isArray(c.puppies) ? c.puppies : []);
    if (Array.isArray(c.litters) && c.litters.length) applyLitters(c.litters);
    // Podkategorie musi byt vyrenderovane driv nez galerie -
    // applyGallery na konci znovu naviaze filtry a aplikuje hash z URL.
    const gal = Array.isArray(c.gallery) ? c.gallery : [];
    applyAlbumTabs('dogAlbumTabs', 'psi', Array.isArray(c.dogAlbums) ? c.dogAlbums : [], gal,
      { all: 'Všichni psi', allEn: 'All dogs' });
    applyAlbumTabs('puppyAlbumTabs', 'stenata', Array.isArray(c.puppyAlbums) ? c.puppyAlbums : [], gal,
      { all: 'Všechna štěňata', allEn: 'All puppies' });
    if (Array.isArray(c.gallery) && c.gallery.length) applyGallery(c.gallery);
    if (c.texts) applyTexts(c.texts);
    // Karty se renderuji az po IntersectionObseveru z animations.js.
    // Bez tohohle zustanou opacity:0 (skryte). Zviditelnime je.
    requestAnimationFrame(() => {
      document.querySelectorAll('.aos').forEach(el => el.classList.add('aos--visible'));
      // Po vyrendrovani aplikovat preklady (lang.js) pro vsechny [data-i18n] elementy
      if (typeof window.applyTranslations === 'function' && typeof window.getLang === 'function') {
        try { window.applyTranslations(window.getLang()); } catch {}
      }
    });
  }

  // Helper - vybere CZ/EN podle aktualniho jazyka
  function gsLang() {
    try { return (window.getLang && window.getLang()) || 'cs'; } catch { return 'cs'; }
  }
  function pickLang(obj, baseKey) {
    const lang = gsLang();
    if (lang === 'en' && obj[baseKey + 'En']) return obj[baseKey + 'En'];
    return obj[baseKey] || '';
  }

  // Po prepnuti jazyka znovu vyrenderovat karty (kvuli dynamickym popisum/popiskum).
  // Vola se i z apply(), protoze na nekterych strankach se content-loader.js
  // nacita driv nez lang.js - pri evaluaci by window.setLang jeste neexistoval.
  function hookLangSwitch() {
    if (window._gsLangHooked) return;
    if (typeof window.setLang !== 'function') return;
    window._gsLangHooked = true;
    const _origSetLang = window.setLang;
    window.setLang = function (lang) {
      _origSetLang(lang);
      if (content) apply(content);
    };
  }
  hookLangSwitch();

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ===== TEXTS =====
  function applyTexts(t) {
    const map = {
      hero_title1: 'span[data-i18n="hero_title1"]',
      hero_title2: 'span[data-i18n="hero_title2"]',
      hero_desc: '.hero__desc [data-i18n="hero_desc"], .hero__desc',
    };
    Object.keys(map).forEach(key => {
      if (!t[key]) return;
      document.querySelectorAll(map[key]).forEach(el => { el.textContent = t[key]; });
    });
    if (t.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.href = 'tel:' + t.phone.replace(/\s/g, '');
        a.textContent = t.phone;
      });
    }
    if (t.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        a.href = 'mailto:' + t.email;
        const icon = /📧/.test(a.textContent) ? '📧 ' : '';
        a.textContent = icon + t.email;
      });
    }
  }

  // ===== DOGS =====
  function applyDogs(dogs) {
    const females = document.getElementById('dogs-females');
    const males = document.getElementById('dogs-males');
    if (!females && !males) return;
    const fList = dogs.filter(d => d.gender !== 'male');
    const mList = dogs.filter(d => d.gender === 'male');
    if (females) females.innerHTML = fList.map((d, i) => dogCard(d, i)).join('');
    if (males) males.innerHTML = mList.map((d, i) => dogCard(d, i)).join('');
  }
  function dogCard(d, i) {
    const photo = d.photo || '';
    const badge = d.gender === 'male'
      ? '<span class="dog-card__badge" style="background:var(--color-navy);" data-i18n="gender_male">Pes</span>'
      : '<span class="dog-card__badge" data-i18n="gender_female">Fena</span>';
    const ach = (d.achievements || []).filter(a => a.title);
    // Mapovani slug -> puvodni open*Achievements funkce v nasi-psi.html (s PDF certifikaty)
    const slugFnMap = {
      senorita: 'openRomaAchievements',
      michelle: 'openMichelleAchievements',
      oxygen: 'openOxygenAchievements',
      matteo: 'openMatteoAchievements',
    };
    const slugForFn = (d.slug || '').toLowerCase();
    const openFn = slugFnMap[slugForFn];
    const achBtn = ach.length
      ? (openFn
          ? `<button class="btn btn--outline btn--sm btn--achievements" onclick="event.stopPropagation(); ${openFn}()">🏆 <span data-i18n="btn_achievements">Úspěchy</span></button>`
          : `<button class="btn btn--outline btn--sm btn--achievements" onclick="event.stopPropagation(); gsShowAchievements(${i}, '${escapeHtml(d.gender)}')">🏆 <span data-i18n="btn_achievements">Úspěchy</span></button>`)
      : '';
    const objFit = d.imageFit || 'cover';
    const objPos = d.imagePosition || 'center center';
    const imgBg = d.imageBg ? `background:${escapeHtml(d.imageBg)};` : '';
    const imageStyle = `position:relative;overflow:hidden;${imgBg}`;
    // Kliknuti na kartu otevre galerii s filtrem na tohoto psa
    const slug = (d.slug || d.name || '').toString().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const clickHandler = slug ? `onclick="location.href='galerie.html#${escapeHtml(slug)}'"` : '';
    const desc = pickLang(d, 'description');
    const titlesV = pickLang(d, 'titles');
    const healthV = pickLang(d, 'health') || (gsLang() === 'en' ? 'All clear' : 'V pořádku');
    return `
      <div class="dog-card aos aos-d${(i % 3) + 1}" style="cursor:pointer;" ${clickHandler}>
        <div class="dog-card__image" style="${imageStyle}">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(d.name)}" style="width:100%;height:100%;object-fit:${escapeHtml(objFit)};object-position:${escapeHtml(objPos)};" />` : ''}
          ${badge}
        </div>
        <div class="dog-card__body">
          <div class="dog-card__breed" data-i18n="breed_yt">${escapeHtml(d.breed || 'Yorkshire teriér')}</div>
          <div class="dog-card__name">${escapeHtml(pickLang(d,'name') || d.name)}</div>
          <p class="dog-card__desc">${escapeHtml(desc)}</p>
          <div class="dog-card__meta">
            ${titlesV ? `<div class="dog-card__meta-item"><label data-i18n="dog_titles">Tituly</label><span>${escapeHtml(titlesV)}</span></div>` : ''}
            <div class="dog-card__meta-item"><label data-i18n="dog_dna">Zdraví</label><span>${escapeHtml(healthV)} ✓</span></div>
          </div>
          ${achBtn}
        </div>
      </div>`;
  }

  // Modal pro úspěchy - vybira CZ/EN podle aktualniho jazyka (gsLang/pickLang definovany vyse)
  window.gsToggleAch = function (btn) {
    const wrap = btn.closest('.gs-ach-wrap');
    const open = wrap.classList.toggle('gs-ach-open');
    const panel = wrap.querySelector('.gs-ach-panel');
    const iframe = panel.querySelector('iframe');
    const img = panel.querySelector('img');
    if (open) {
      if (iframe && iframe.dataset.src && iframe.src.endsWith('about:blank')) iframe.src = iframe.dataset.src;
      if (img && img.dataset.src && !img.src) img.src = img.dataset.src;
      panel.style.maxHeight = '600px';
    } else {
      panel.style.maxHeight = '0';
    }
    btn.querySelector('.gs-ach-arrow').textContent = open ? '▲' : '▼';
  };
  window.gsShowAchievements = function (i, gender) {
    const dogs = (content.dogs || []).filter(d => gender === 'male' ? d.gender === 'male' : d.gender !== 'male');
    const d = dogs[i]; if (!d) return;
    let m = document.getElementById('gsAchModal');
    if (!m) {
      m = document.createElement('div');
      m.id = 'gsAchModal';
      m.style.cssText = 'position:fixed;inset:0;background:rgba(13,21,48,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
      m.onclick = e => { if (e.target === m) m.remove(); };
      document.body.appendChild(m);
    }
    const lang = gsLang();
    const medal = { gold: '🥇', silver: '🥈', bronze: '🥉' };
    const heading = lang === 'en' ? '🏆 Achievements' : '🏆 Úspěchy';
    const isImage = (p) => /\.(jpg|jpeg|png|webp|gif)$/i.test(p);
    m.innerHTML = `
      <div style="background:#fff;border-radius:16px;max-width:640px;width:100%;max-height:90vh;overflow-y:auto;padding:32px;position:relative;animation:gsFadeUp 0.3s ease both;">
        <button onclick="document.getElementById('gsAchModal').remove()" style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666;">✕</button>
        <h2 style="font-family:var(--font-heading);color:var(--color-navy);margin-bottom:6px;">${escapeHtml(pickLang(d, 'name') || d.name)}</h2>
        <div style="color:var(--color-text-soft);margin-bottom:20px;">${heading}</div>
        ${(d.achievements || []).filter(a => a.title).map(a => {
          const t = pickLang(a, 'title');
          const det = pickLang(a, 'detail');
          const hasFile = !!a.pdf;
          const pdfUrl = a.pdf ? encodeURI(a.pdf) : '';
          const panel = !hasFile ? '' : (isImage(a.pdf)
            ? `<div class="gs-ach-panel" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;"><div style="padding:12px;"><img data-src="${escapeHtml(pdfUrl)}" alt="" style="width:100%;height:auto;border-radius:8px;" /></div></div>`
            : `<div class="gs-ach-panel" style="max-height:0;overflow:hidden;transition:max-height 0.3s ease;"><iframe data-src="${escapeHtml(pdfUrl)}" src="about:blank" loading="lazy" style="width:100%;height:560px;border:none;border-radius:8px;"></iframe><div style="padding:8px 12px;text-align:right;"><a href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener" style="color:var(--color-gold);font-size:0.85rem;text-decoration:none;">📄 Otevřít v nové záložce ↗</a></div></div>`);
          return `
          <div class="gs-ach-wrap" style="border-left:3px solid var(--color-gold);margin-bottom:10px;background:#faf8f3;border-radius:0 8px 8px 0;overflow:hidden;">
            <button type="button" ${hasFile ? 'onclick="gsToggleAch(this)"' : ''} style="width:100%;text-align:left;background:none;border:none;padding:12px 14px;cursor:${hasFile?'pointer':'default'};display:flex;align-items:center;gap:10px;font-family:inherit;">
              <div style="flex:1;">
                <div style="font-weight:700;color:var(--color-navy);">${medal[a.medal] || ''} ${escapeHtml(t)}</div>
                ${det ? `<div style="color:var(--color-text-soft);font-size:0.9rem;margin-top:2px;">${escapeHtml(det)}</div>` : ''}
              </div>
              ${hasFile ? '<span class="gs-ach-arrow" style="color:var(--color-gold);font-size:1.1rem;">▼</span>' : ''}
            </button>
            ${panel}
          </div>`;
        }).join('')}
      </div>`;
  };

  // ===== PUPPIES =====
  function applyPuppies(puppies) {
    const stenaGrid = document.getElementById('puppies-grid-stena');
    const homeGrid = document.getElementById('puppies-grid-home');
    if (stenaGrid) {
      // Odkaz z karty vrhu (stena.html#vrh-c) zuzi vypis jen na dany vrh
      const slug = activeLitterSlug(puppies);
      const shown = slug ? puppies.filter(p => gsSlugify(p.litter) === slug) : puppies;
      stenaGrid.innerHTML = shown.map((p, i) => puppyCardStena(p, i)).join('');
      renderLitterFilterNote(stenaGrid, puppies, slug);
    }
    if (homeGrid) homeGrid.innerHTML = puppies.map((p, i) => puppyCardHome(p, i)).join('');
  }

  // ===== FILTR STENAT PODLE VRHU (stena.html#vrh-c) =====
  // Slug prijmeme jen tehdy, kdyz k nemu nejake stene existuje -
  // jinak by odkaz vedl na prazdny vypis.
  function activeLitterSlug(puppies) {
    let raw = '';
    try { raw = gsSlugify(decodeURIComponent((location.hash || '').slice(1))); } catch { raw = ''; }
    if (!raw) return '';
    return (puppies || []).some(p => gsSlugify(p.litter) === raw) ? raw : '';
  }
  function renderLitterFilterNote(grid, puppies, slug) {
    let note = document.getElementById('puppyLitterNote');
    if (!slug) { if (note) note.remove(); window._gsLitterScrolledFor = ''; return; }
    if (!note) {
      note = document.createElement('div');
      note.id = 'puppyLitterNote';
      note.className = 'litter-filter-note';
      grid.parentNode.insertBefore(note, grid);
    }
    const p = puppies.find(x => gsSlugify(x.litter) === slug) || {};
    const en = gsLang() === 'en';
    note.innerHTML =
      `<span class="litter-filter-note__text">${en ? 'Showing puppies from' : 'Zobrazena štěňata z vrhu'}</span>` +
      `<span class="litter-filter-note__tag">${escapeHtml(pickLang(p, 'litter'))}</span>` +
      `<button type="button" class="litter-filter-note__clear" onclick="gsClearLitterFilter()">${en ? 'Show all puppies' : 'Zobrazit všechna štěňata'}</button>`;
    // Vypis stenat je az pod adopcnim procesem - po prichodu z Vrhu na nej rovnou
    // sjedeme. Jen jednou na dany vrh, at prepnuti jazyka strankou necuka.
    if (window._gsLitterScrolledFor !== slug) {
      window._gsLitterScrolledFor = slug;
      requestAnimationFrame(() => {
        try { note.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch { note.scrollIntoView(); }
      });
    }
  }
  // Zruseni filtru = pryc s hashem a prekreslit (apply znovu odhali .aos karty)
  window.gsClearLitterFilter = function () {
    history.replaceState(null, '', location.pathname + location.search);
    if (content) apply(content);
  };
  window.addEventListener('hashchange', () => {
    if (content && document.getElementById('puppies-grid-stena')) apply(content);
  });
  function genderBadge(g) {
    return g === 'male'
      ? '<span class="puppy-card__gender puppy-card__gender--male" data-i18n="gender_male">Pes</span>'
      : '<span class="puppy-card__gender puppy-card__gender--female" data-i18n="gender_female">Fena</span>';
  }
  function statusBadge(s) {
    return s === 'reserved'
      ? '<span class="puppy-card__status puppy-card__status--reserved" data-i18n="status_reserved">Rezervováno</span>'
      : '<span class="puppy-card__status puppy-card__status--available" data-i18n="status_available">Volné</span>';
  }
  function puppyCardStena(p, i) {
    const photo = p.photo || '';
    const reserved = p.status === 'reserved';
    const btn = reserved
      ? '<button class="btn btn--outline btn--sm" disabled style="opacity:0.5;cursor:not-allowed;" data-i18n="btn_taken">Obsazeno</button>'
      : '<a href="kontakt.html" class="btn btn--primary btn--sm" data-i18n="btn_interested">Mám zájem</a>';
    const price = reserved
      ? '<div class="puppy-card__price" style="margin-bottom:12px;color:var(--color-text-soft);" data-i18n="status_reserved">Rezervováno</div>'
      : '<div class="puppy-card__price" style="margin-bottom:12px;" data-i18n="price_on_request">Cena na dotaz</div>';
    // Kliknuti na fotku vede do galerie na album tohoto stenete
    const link = albumLinkFor(p, 'puppy');
    const en = gsLang() === 'en';
    const photoAttrs = link
      ? ` onclick="location.href='${escapeHtml(link)}'" style="padding:0;overflow:hidden;position:relative;cursor:pointer;" title="${en ? 'View photos in the gallery' : 'Zobrazit fotky v galerii'}" role="link" tabindex="0"`
      : ' style="padding:0;overflow:hidden;position:relative;"';
    // Misto obecneho '📷 Fotky' nese kazde stene tag sveho vrhu (Vrh C / Vrh D)
    const litterName = pickLang(p, 'litter');
    const litterTag = litterName
      ? `<span class="puppy-card__litter">${escapeHtml(litterName)}</span>`
      : '';
    return `
      <div class="puppy-card aos aos-d${(i % 3) + 1}">
        <div class="puppy-card__image"${photoAttrs}>
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="font-size:64px;">🐶</span>'}
          ${genderBadge(p.gender)}${statusBadge(p.status)}${litterTag}
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(pickLang(p,'name') || p.name)}</div>
          <div class="puppy-card__info" data-i18n="breed_yt">Yorkshire teriér</div>
          ${price}${btn}
        </div>
      </div>`;
  }
  function puppyCardHome(p, i) {
    const photo = p.photo || '';
    return `
      <div class="puppy-card aos aos-d${(i % 3) + 1}" style="cursor:pointer;" onclick="location.href='stena.html'">
        <div class="puppy-card__image" style="padding:0;overflow:hidden;position:relative;">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;" />` : '<span>🐶</span>'}
          ${genderBadge(p.gender)}${statusBadge(p.status)}
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(pickLang(p,'name') || p.name)}</div>
          <div class="puppy-card__info" data-i18n="breed_yt">Yorkshire teriér</div>
          <div class="puppy-card__price" data-i18n="price_on_request">Na dotaz</div>
        </div>
      </div>`;
  }

  // ===== LITTERS =====
  function applyLitters(litters) {
    const grid = document.querySelector('.vrhy-grid');
    if (!grid) return;
    grid.innerHTML = litters.map((l, i) => litterCard(l, i)).join('');
    // Karty jsou nove -> znovu navazat kliknuti na fotku (lightbox)
    if (typeof window.bindVrhLightbox === 'function') window.bindVrhLightbox();
  }
  function litterCard(l, i) {
    const photo = l.cover || '';
    const statusClass = l.status === 'available' ? 'available' : 'reserved';
    const statusKey = l.status === 'available' ? 'litter_status_available' : 'litter_status_unavailable';
    const statusLabel = l.status === 'available' ? 'Dostupný' : 'Nedostupné';
    const dimmed = l.status !== 'available' ? 'opacity:0.78;' : '';
    // Tlacitko vede na stenata z tohoto vrhu (stena.html#vrh-c). Kdyz k vrhu
    // zadne stene neni, zustane neaktivni - odkaz by vedl do prazdna.
    const slug = gsSlugify(l.name);
    const hasPuppies = ((content && content.puppies) || []).some(p => gsSlugify(p.litter) === slug);
    const btnLabel = gsLang() === 'en' ? 'View puppies from litter' : 'Zobrazit štěňata z vrhu';
    const btn = hasPuppies
      ? `<a href="stena.html#${escapeHtml(slug)}" class="btn btn--outline btn--sm" data-i18n="litter_show_puppies">${escapeHtml(btnLabel)}</a>`
      : `<button class="btn btn--outline btn--sm" disabled style="opacity:0.4;cursor:not-allowed;" data-i18n="litter_show_puppies">${escapeHtml(btnLabel)}</button>`;
    return `
      <div class="vrh-card aos aos-d${(i % 3) + 1}" style="cursor:pointer;${dimmed}" data-img="${escapeHtml(photo)}" data-caption="${escapeHtml(l.name)}">
        <div class="vrh-card__image" style="position:relative;">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(l.name)}" style="object-position:center top;" />` : ''}
          <span class="puppy-card__status puppy-card__status--${statusClass}" data-i18n="${statusKey}">${statusLabel}</span>
        </div>
        <div class="vrh-card__body">
          <div class="vrh-card__label">Great Silkyway</div>
          <div class="vrh-card__title">${escapeHtml(pickLang(l,'name') || l.name)}</div>
          <p class="vrh-card__desc">${escapeHtml(pickLang(l,'description'))}</p>
          ${btn}
        </div>
      </div>`;
  }

  // ===== UPOUTAVKA NA DOSTUPNA STENATA (uvodni stranka) =====
  // Cisla i fotky se berou z aktualnich dat. Kdyz volne stene neni,
  // upoutavka se vubec nezobrazi - at neslibuje neco, co neplati.
  function applyPuppyAlert(puppies) {
    const section = document.getElementById('puppyAlertSection');
    const box = document.getElementById('puppyAlert');
    if (!section || !box) return;

    const free = (puppies || []).filter(p => p && p.status !== 'reserved');
    if (!free.length) { section.hidden = true; return; }

    const en = gsLang() === 'en';
    const n = free.length;
    // 1 stenatko / 2-4 stenatka / 5+ stenatek
    const word = en ? (n === 1 ? 'puppy' : 'puppies')
                    : (n === 1 ? 'štěňátko' : (n <= 4 ? 'štěňátka' : 'štěňátek'));
    const adj = en ? '' : (n === 1 ? 'volné ' : (n <= 4 ? 'volná ' : 'volných '));

    const badge = en ? 'Puppies available' : 'Volná štěňátka';
    const title = en
      ? `<em>${n} ${word} available</em> looking for a home`
      : `<em>${n} ${adj}${word}</em> čeká na svůj domov`;
    const desc = en
      ? 'Yorkshire Terriers with FCI pedigree, vaccinated and dewormed. Come and meet them.'
      : 'Yorkshire teriéři s průkazem původu FCI, očkovaní a odčervení. Podívejte se, kdo na vás čeká.';
    const cta = en ? 'Meet the puppies' : 'Prohlédnout štěňátka';

    const shown = free.filter(p => p.photo).slice(0, 4);
    const rest = n - shown.length;
    const avatars = shown.map((p, i) =>
      `<img class="puppy-alert__avatar" src="${escapeHtml(p.photo)}" alt="${escapeHtml(p.name || '')}"
            style="animation-delay:${i * 0.09}s;" loading="lazy" />`).join('')
      + (rest > 0 ? `<span class="puppy-alert__avatar puppy-alert__avatar--more" style="animation-delay:${shown.length * 0.09}s;">+${rest}</span>` : '');

    box.innerHTML = `
      ${avatars ? `<div class="puppy-alert__avatars">${avatars}</div>` : ''}
      <div class="puppy-alert__text">
        <span class="puppy-alert__badge"><span class="puppy-alert__dot"></span>${escapeHtml(badge)}</span>
        <div class="puppy-alert__title">${title}</div>
        <p class="puppy-alert__desc">${escapeHtml(desc)}</p>
      </div>
      <span class="puppy-alert__cta">${escapeHtml(cta)} <span class="puppy-alert__arrow">→</span></span>`;
    section.hidden = false;
  }

  // ===== PROPOJENI KARTA -> ALBUM V GALERII =====
  function gsSlugify(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  // Vrati odkaz do galerie na album daneho stenete/psa, nebo '' kdyz album
  // neexistuje nebo je prazdne - na prazdny filtr nema smysl odkazovat.
  function albumLinkFor(item, kind) {
    const cfg = kind === 'dog'
      ? { list: 'dogAlbums', cat: 'psi' }
      : { list: 'puppyAlbums', cat: 'stenata' };
    const albums = (content && content[cfg.list]) || [];
    const gallery = (content && content.gallery) || [];
    // Prednost ma rucne prirazene album, jinak se hleda podle jmena
    const wanted = item.album || gsSlugify(item.name);
    if (!wanted) return '';
    const album = albums.find(a => a.slug === wanted);
    if (!album) return '';
    const hasPhotos = gallery.some(g => g.category === cfg.cat && g.album === album.slug);
    return hasPhotos ? `galerie.html#${cfg.cat}/${album.slug}` : '';
  }

  // ===== PUPPY ALBUMS (podkategorie galerie podle jmen stenat) =====
  function applyAlbumTabs(barId, cat, albums, gallery, labels) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    // Zalozku ukazat jen u jmen, ke kterym uz nejaka fotka je -
    // prazdne album by filtrovalo do prazdna.
    const used = new Set((gallery || []).filter(g => g.category === cat && g.album).map(g => g.album));
    const named = albums.filter(a => a && a.slug && a.name && used.has(a.slug));
    if (!named.length) { bar.innerHTML = ''; bar.style.display = 'none'; return; }
    const allLabel = gsLang() === 'en' ? labels.allEn : labels.all;
    const heading = gsLang() === 'en' ? 'By name' : 'Podle jména';
    bar.innerHTML =
      `<div class="filter-tabs--sub__label">${heading}</div>` +
      `<button class="filter-tab active" data-album="">${escapeHtml(allLabel)}</button>` +
      named.map(a => `<button class="filter-tab" data-album="${escapeHtml(a.slug)}">${escapeHtml(pickLang(a, 'name'))}</button>`).join('');
  }

  // ===== GALLERY =====
  function applyGallery(items) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = items.map((g, i) => galleryItem(g, i)).join('');
    // Po prerenderovani znovu navazat lightbox + filter kliky
    if (typeof window.bindGalleryInteractions === 'function') {
      window.bindGalleryInteractions();
    }
  }
  function galleryItem(g, i) {
    const photo = g.photo || '';
    const wideClass = g.wide ? ' wide' : '';
    const delay = i % 3 === 0 ? '' : ` aos aos-d${(i % 3)}`;
    // Starsi data mela pro kazdeho psa vlastni kategorii; dnes je to
    // kategorie 'psi' + album. Obe varianty vykreslime stejne.
    const LEGACY_DOG_CATS = ['senorita', 'michelle', 'oxygen', 'matteo'];
    const legacyDog = LEGACY_DOG_CATS.includes(g.category);
    const cat = legacyDog ? `psi ${g.category}` : g.category;
    const caption = pickLang(g, 'caption') || g.caption;
    const albumSlug = legacyDog ? g.category : g.album;
    const hasAlbum = albumSlug && (legacyDog || g.category === 'stenata' || g.category === 'psi');
    const album = hasAlbum ? ` data-album="${escapeHtml(albumSlug)}"` : '';
    return `
      <div class="gallery-item${wideClass}${delay}" data-category="${escapeHtml(cat)}"${album} data-caption="${escapeHtml(caption)}" style="cursor:pointer;">
        ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(caption)}" style="width:100%;height:100%;object-fit:cover;object-position:${escapeHtml(g.objectPosition || 'center center')};" />` : ''}
        <div class="gallery-item__overlay"><span class="gallery-item__caption">${escapeHtml(caption)}</span></div>
      </div>`;
  }
})();
