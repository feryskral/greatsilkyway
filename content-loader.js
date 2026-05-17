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
    if (Array.isArray(c.dogs) && c.dogs.length) applyDogs(c.dogs);
    if (Array.isArray(c.puppies) && c.puppies.length) applyPuppies(c.puppies);
    if (Array.isArray(c.litters) && c.litters.length) applyLitters(c.litters);
    if (Array.isArray(c.gallery) && c.gallery.length) applyGallery(c.gallery);
    if (c.texts) applyTexts(c.texts);
  }

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
      ? '<span class="dog-card__badge" style="background:var(--color-navy);">Pes</span>'
      : '<span class="dog-card__badge">Fena</span>';
    const ach = (d.achievements || []).filter(a => a.title);
    const achBtn = ach.length
      ? `<button class="btn btn--outline btn--sm btn--achievements" onclick="event.stopPropagation(); gsShowAchievements(${i}, '${escapeHtml(d.gender)}')">🏆 Úspěchy</button>`
      : '';
    return `
      <div class="dog-card aos aos-d${(i % 3) + 1}" style="cursor:pointer;">
        <div class="dog-card__image">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(d.name)}" style="width:100%;height:100%;object-fit:cover;" />` : ''}
          ${badge}
        </div>
        <div class="dog-card__body">
          <div class="dog-card__breed">${escapeHtml(d.breed || 'Yorkshire teriér')}</div>
          <div class="dog-card__name">${escapeHtml(d.name)}</div>
          <p class="dog-card__desc">${escapeHtml(d.description || '')}</p>
          <div class="dog-card__meta">
            ${d.titles ? `<div class="dog-card__meta-item"><label>Tituly</label><span>${escapeHtml(d.titles)}</span></div>` : ''}
            <div class="dog-card__meta-item"><label>Zdraví</label><span>${escapeHtml(d.health || 'V pořádku')} ✓</span></div>
          </div>
          ${achBtn}
        </div>
      </div>`;
  }

  // Modal pro úspěchy
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
    const medal = { gold: '🥇', silver: '🥈', bronze: '🥉' };
    m.innerHTML = `
      <div style="background:#fff;border-radius:16px;max-width:540px;width:100%;max-height:85vh;overflow-y:auto;padding:32px;position:relative;animation:gsFadeUp 0.3s ease both;">
        <button onclick="document.getElementById('gsAchModal').remove()" style="position:absolute;top:14px;right:14px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666;">✕</button>
        <h2 style="font-family:var(--font-heading);color:var(--color-navy);margin-bottom:6px;">${escapeHtml(d.name)}</h2>
        <div style="color:var(--color-text-soft);margin-bottom:20px;">🏆 Úspěchy</div>
        ${(d.achievements || []).filter(a => a.title).map(a => `
          <div style="border-left:3px solid var(--color-gold);padding:10px 14px;margin-bottom:10px;background:#faf8f3;border-radius:0 8px 8px 0;">
            <div style="font-weight:700;color:var(--color-navy);">${medal[a.medal] || ''} ${escapeHtml(a.title)}</div>
            ${a.detail ? `<div style="color:var(--color-text-soft);font-size:0.9rem;margin-top:2px;">${escapeHtml(a.detail)}</div>` : ''}
          </div>`).join('')}
      </div>`;
  };

  // ===== PUPPIES =====
  function applyPuppies(puppies) {
    const stenaGrid = document.getElementById('puppies-grid-stena');
    const homeGrid = document.getElementById('puppies-grid-home');
    if (stenaGrid) stenaGrid.innerHTML = puppies.map((p, i) => puppyCardStena(p, i)).join('');
    if (homeGrid) homeGrid.innerHTML = puppies.map((p, i) => puppyCardHome(p, i)).join('');
  }
  function genderBadge(g) {
    return g === 'male'
      ? '<span class="puppy-card__gender puppy-card__gender--male">Pes</span>'
      : '<span class="puppy-card__gender puppy-card__gender--female">Fena</span>';
  }
  function statusBadge(s) {
    return s === 'reserved'
      ? '<span class="puppy-card__status puppy-card__status--reserved">Rezervováno</span>'
      : '<span class="puppy-card__status puppy-card__status--available">Volné</span>';
  }
  function puppyCardStena(p, i) {
    const photo = p.photo || '';
    const reserved = p.status === 'reserved';
    const btn = reserved
      ? '<button class="btn btn--outline btn--sm" disabled style="opacity:0.5;cursor:not-allowed;">Obsazeno</button>'
      : '<a href="kontakt.html" class="btn btn--primary btn--sm">Mám zájem</a>';
    const price = reserved
      ? '<div class="puppy-card__price" style="margin-bottom:12px;color:var(--color-text-soft);">Rezervováno</div>'
      : '<div class="puppy-card__price" style="margin-bottom:12px;">Cena na dotaz</div>';
    return `
      <div class="puppy-card aos aos-d${(i % 3) + 1}">
        <div class="puppy-card__image" style="padding:0;overflow:hidden;position:relative;">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;" />` : '<span style="font-size:64px;">🐶</span>'}
          ${genderBadge(p.gender)}${statusBadge(p.status)}
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(p.name)}</div>
          <div class="puppy-card__info">Yorkshire teriér</div>
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
          <div class="puppy-card__name">${escapeHtml(p.name)}</div>
          <div class="puppy-card__info">Yorkshire teriér</div>
          <div class="puppy-card__price">Na dotaz</div>
        </div>
      </div>`;
  }

  // ===== LITTERS =====
  function applyLitters(litters) {
    const grid = document.querySelector('.vrhy-grid');
    if (!grid) return;
    grid.innerHTML = litters.map((l, i) => litterCard(l, i)).join('');
  }
  function litterCard(l, i) {
    const photo = l.cover || '';
    const statusClass = l.status === 'available' ? 'available' : 'reserved';
    const statusLabel = { available: 'Dostupný', unavailable: 'Nedostupné', reserved: 'Rezervované' }[l.status] || 'Nedostupné';
    const dimmed = l.status !== 'available' ? 'opacity:0.78;' : '';
    const btn = l.status === 'available'
      ? '<a href="kontakt.html" class="btn btn--outline btn--sm">Dotaz na vrh</a>'
      : '<button class="btn btn--outline btn--sm" disabled style="opacity:0.4;cursor:not-allowed;">Dotaz na vrh</button>';
    return `
      <div class="vrh-card aos aos-d${(i % 3) + 1}" style="cursor:pointer;${dimmed}" data-img="${escapeHtml(photo)}" data-caption="${escapeHtml(l.name)}">
        <div class="vrh-card__image" style="position:relative;">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(l.name)}" style="object-position:center top;" />` : ''}
          <span class="puppy-card__status puppy-card__status--${statusClass}">${statusLabel}</span>
        </div>
        <div class="vrh-card__body">
          <div class="vrh-card__label">Great Silkyway</div>
          <div class="vrh-card__title">${escapeHtml(l.name)}</div>
          <p class="vrh-card__desc">${escapeHtml(l.description || '')}</p>
          ${btn}
        </div>
      </div>`;
  }

  // ===== GALLERY =====
  function applyGallery(items) {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    grid.innerHTML = items.map((g, i) => galleryItem(g, i)).join('');
  }
  function galleryItem(g, i) {
    const photo = g.photo || '';
    const wideClass = g.wide ? ' wide' : '';
    const delay = i % 3 === 0 ? '' : ` aos aos-d${(i % 3)}`;
    const cat = g.category === 'senorita' || g.category === 'michelle' || g.category === 'oxygen' || g.category === 'matteo'
      ? `psi ${g.category}` : g.category;
    return `
      <div class="gallery-item${wideClass}${delay}" data-category="${escapeHtml(cat)}" data-caption="${escapeHtml(g.caption)}" style="cursor:pointer;">
        ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(g.caption)}" style="width:100%;height:100%;object-fit:cover;object-position:${escapeHtml(g.objectPosition || 'center center')};" />` : ''}
        <div class="gallery-item__overlay"><span class="gallery-item__caption">${escapeHtml(g.caption)}</span></div>
      </div>`;
  }
})();
