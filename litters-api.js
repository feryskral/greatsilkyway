// Načítá vrhy z Payload CMS
(function () {
  const API_BASE = 'http://localhost:3000';

  const statusMeta = {
    available: { label: 'Dostupný', cls: 'puppy-card__status--available', cardOpacity: 1, disabled: false },
    reserved: { label: 'Rezervované', cls: 'puppy-card__status--reserved', cardOpacity: 0.75, disabled: true },
    unavailable: { label: 'Nedostupné', cls: 'puppy-card__status--reserved', cardOpacity: 0.75, disabled: true },
  };

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function render(l, idx) {
    const meta = statusMeta[l.status] || statusMeta.unavailable;
    const delay = `aos-d${(idx % 3) + 1}`;
    const imgUrl = l.cover?.url ? `${API_BASE}${l.cover.url}` : '';
    const btn = meta.disabled
      ? `<button class="btn btn--outline btn--sm" disabled style="opacity:0.4; cursor:not-allowed;" data-i18n="litter_inquiry">Dotaz na vrh</button>`
      : `<a href="kontakt.html" class="btn btn--outline btn--sm" data-i18n="litter_inquiry">Dotaz na vrh</a>`;
    return `
      <div class="vrh-card aos ${delay}" style="cursor:pointer; opacity:${meta.cardOpacity};" data-img="${escapeHtml(imgUrl)}" data-caption="${escapeHtml(l.name)}">
        <div class="vrh-card__image" style="position:relative;">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(l.name)}" style="object-position: center top;" />
          <span class="puppy-card__status ${meta.cls}">${meta.label}</span>
        </div>
        <div class="vrh-card__body">
          <div class="vrh-card__label">${escapeHtml(l.label || 'Great Silkyway')}</div>
          <div class="vrh-card__title">${escapeHtml(l.name)}</div>
          <p class="vrh-card__desc">${escapeHtml(l.description || '')}</p>
          ${btn}
        </div>
      </div>`;
  }

  async function load() {
    const grid = document.querySelector('.vrhy-grid');
    if (!grid) return;
    try {
      const r = await fetch(`${API_BASE}/api/litters?limit=100&depth=1&sort=order`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const { docs } = await r.json();
      grid.innerHTML = docs.map(render).join('');
      grid.querySelectorAll('.aos').forEach(el => el.classList.add('aos--visible'));
      // Re-bind lightbox click
      if (window.bindVrhLightbox) window.bindVrhLightbox();
    } catch (e) {
      console.error('Litters API load failed:', e);
      grid.innerHTML = `<p style="color:#c00;padding:20px;">⚠ Nepodařilo se načíst data z CMS (${API_BASE}).</p>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
