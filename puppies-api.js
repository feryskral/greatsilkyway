// Načítá štěňata z Payload CMS
(function () {
  const API_BASE = 'http://localhost:3000';

  const statusMeta = {
    available: { label: 'Volné', cls: 'puppy-card__status--available' },
    reserved: { label: 'Rezervované', cls: 'puppy-card__status--reserved' },
    sold: { label: 'Prodané', cls: 'puppy-card__status--reserved' },
  };

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function render(p, idx) {
    const meta = statusMeta[p.status] || statusMeta.available;
    const genderLabel = p.gender === 'male' ? 'Pes' : 'Fena';
    const genderCls = p.gender === 'male' ? 'puppy-card__gender--male' : 'puppy-card__gender--female';
    const delay = `aos-d${(idx % 4) + 1}`;
    const imgUrl = p.photo?.url ? `${API_BASE}${p.photo.url}` : '';
    return `
      <div class="puppy-card aos ${delay}">
        <div class="puppy-card__image" style="padding:0; overflow:hidden; position:relative;">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:cover; object-position:center center;" />
          <span class="puppy-card__gender ${genderCls}">${genderLabel}</span>
          <span class="puppy-card__status ${meta.cls}">${meta.label}</span>
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(p.name)}</div>
          <div class="puppy-card__info" style="margin-bottom:12px;">${escapeHtml(p.breed || 'Yorkshire teriér')}</div>
          <a href="kontakt.html" class="btn btn--primary btn--sm">Mám zájem</a>
        </div>
      </div>`;
  }

  function renderHome(p, idx) {
    const meta = statusMeta[p.status] || statusMeta.available;
    const genderLabel = p.gender === 'male' ? 'Pes' : 'Fena';
    const genderCls = p.gender === 'male' ? 'puppy-card__gender--male' : 'puppy-card__gender--female';
    const delay = `aos-d${(idx % 4) + 1}`;
    const imgUrl = p.photo?.url ? `${API_BASE}${p.photo.url}` : '';
    return `
      <div class="puppy-card aos ${delay}" style="cursor:pointer;" onclick="location.href='stena.html'">
        <div class="puppy-card__image" style="padding:0; overflow:hidden; position:relative;">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(p.name)}" style="width:100%; height:100%; object-fit:cover; object-position:center center;" />
          <span class="puppy-card__gender ${genderCls}">${genderLabel}</span>
          <span class="puppy-card__status ${meta.cls}">${meta.label}</span>
        </div>
        <div class="puppy-card__body">
          <div class="puppy-card__name">${escapeHtml(p.name)}</div>
          <div class="puppy-card__info">${escapeHtml(p.breed || 'Yorkshire teriér')}</div>
        </div>
      </div>`;
  }

  async function load() {
    const stenaGrid = document.getElementById('puppies-grid-stena');
    const homeGrid = document.getElementById('puppies-grid-home');
    if (!stenaGrid && !homeGrid) return;
    try {
      const r = await fetch(`${API_BASE}/api/puppies?limit=100&depth=1&sort=order`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const { docs } = await r.json();
      if (stenaGrid) {
        if (docs.length === 0) {
          stenaGrid.innerHTML = `<p style="padding:20px;color:#666;">Aktuálně nemáme dostupná štěňata.</p>`;
        } else {
          stenaGrid.innerHTML = docs.map(render).join('');
          stenaGrid.querySelectorAll('.aos').forEach(el => el.classList.add('aos--visible'));
        }
      }
      if (homeGrid) {
        homeGrid.innerHTML = docs.map(renderHome).join('');
        homeGrid.querySelectorAll('.aos').forEach(el => el.classList.add('aos--visible'));
      }
    } catch (e) {
      console.error('Puppies API load failed:', e);
      const msg = `<p style="color:#c00;padding:20px;">⚠ Nepodařilo se načíst data z CMS (${API_BASE}).</p>`;
      if (stenaGrid) stenaGrid.innerHTML = msg;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
