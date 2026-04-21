// Content loader — načte úpravy z admin panelu
// Zdroj dat (v pořadí priority):
//   1. content.json (na serveru — vidí všichni návštěvníci)
//   2. localStorage (vidí jen admin pro náhled)

(function () {
  const STORAGE_KEY = 'gs_admin_content';
  let content = null;

  // Try fetching content.json
  fetch('content.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
    .then(data => {
      if (data) {
        content = data;
      } else {
        const local = localStorage.getItem(STORAGE_KEY);
        if (local) { try { content = JSON.parse(local); } catch {} }
      }
      if (content) apply(content);
    });

  function apply(c) {
    if (c.puppies && c.puppies.length) applyPuppies(c.puppies);
    if (c.texts) applyTexts(c.texts);
  }

  function applyTexts(t) {
    const map = {
      hero_title1: 'span[data-i18n="hero_title1"]',
      hero_title2: 'span[data-i18n="hero_title2"]',
      hero_desc: '.hero__desc [data-i18n="hero_desc"], .hero__desc',
    };
    Object.keys(map).forEach(key => {
      if (!t[key]) return;
      document.querySelectorAll(map[key]).forEach(el => {
        el.textContent = t[key];
      });
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

  function applyPuppies(puppies) {
    const stenaGrid = document.getElementById('puppies-grid-stena');
    const homeGrid = document.getElementById('puppies-grid-home');
    if (stenaGrid) stenaGrid.innerHTML = puppies.map((p, i) => puppyCardStena(p, i)).join('');
    if (homeGrid) homeGrid.innerHTML = puppies.map((p, i) => puppyCardHome(p, i)).join('');
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function genderBadge(g) {
    if (g === 'male') return '<span class="puppy-card__gender puppy-card__gender--male">Pes</span>';
    return '<span class="puppy-card__gender puppy-card__gender--female">Fena</span>';
  }

  function statusBadge(s) {
    if (s === 'reserved') return '<span class="puppy-card__status puppy-card__status--reserved">Rezervováno</span>';
    return '<span class="puppy-card__status puppy-card__status--available">Volné</span>';
  }

  function puppyCardStena(p, i) {
    const photo = p.photo || '';
    const reserved = p.status === 'reserved';
    const btn = reserved
      ? '<button class="btn btn--outline btn--sm" disabled style="opacity:0.5; cursor:not-allowed;">Obsazeno</button>'
      : '<a href="kontakt.html" class="btn btn--primary btn--sm">Mám zájem</a>';
    const price = reserved
      ? '<div class="puppy-card__price" style="margin-bottom:12px; color:var(--color-text-soft);">Rezervováno</div>'
      : '<div class="puppy-card__price" style="margin-bottom:12px;">Cena na dotaz</div>';
    return `
      <div class="puppy-card aos aos-d${(i % 3) + 1}">
        <div class="puppy-card__image" style="padding:0; overflow:hidden; position:relative;">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:cover; object-position:center center;" />` : '<span style="font-size:64px;">🐶</span>'}
          ${genderBadge(p.gender)}
          ${statusBadge(p.status)}
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(p.name)}</div>
          <div class="puppy-card__info">Yorkshire teriér</div>
          ${price}
          ${btn}
        </div>
      </div>`;
  }

  function puppyCardHome(p, i) {
    const photo = p.photo || '';
    return `
      <div class="puppy-card aos aos-d${(i % 3) + 1}" style="cursor:pointer;" onclick="location.href='stena.html'">
        <div class="puppy-card__image" style="padding:0; overflow:hidden; position:relative;">
          ${photo ? `<img src="${escapeHtml(photo)}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:cover; object-position:center center;" />` : '<span>🐶</span>'}
          ${genderBadge(p.gender)}
          ${statusBadge(p.status)}
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(p.name)}</div>
          <div class="puppy-card__info">Yorkshire teriér</div>
          <div class="puppy-card__price">Na dotaz</div>
        </div>
      </div>`;
  }
})();
