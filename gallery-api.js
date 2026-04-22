// Načítá galerii z Payload CMS
(function () {
  const API_BASE = 'http://localhost:3000';

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function render(it, idx) {
    const imgUrl = it.photo?.url ? `${API_BASE}${it.photo.url}` : '';
    const wideCls = it.wide ? 'wide' : '';
    const category = it.category === 'stenata' || it.category === 'vrhy' ? it.category : `psi ${it.category}`;
    const delay = it.wide ? '' : ` aos-d${(idx % 5) + 1}`;
    const aosCls = it.wide ? '' : 'aos';
    return `
      <div class="gallery-item ${wideCls} ${aosCls}${delay}" data-category="${escapeHtml(category)}" data-caption="${escapeHtml(it.caption)}" style="cursor:pointer;">
        <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(it.caption)}" style="width:100%;height:100%;object-fit:cover;object-position:${escapeHtml(it.objectPosition || 'center center')};" />
        <div class="gallery-item__overlay"><span class="gallery-item__caption">${escapeHtml(it.caption)}</span></div>
      </div>`;
  }

  async function load() {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;
    try {
      const r = await fetch(`${API_BASE}/api/gallery-items?limit=500&depth=1&sort=order`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const { docs } = await r.json();
      grid.innerHTML = docs.map(render).join('');
      grid.querySelectorAll('.aos').forEach(el => el.classList.add('aos--visible'));
      // Re-bind filter + lightbox
      if (window.bindGalleryInteractions) window.bindGalleryInteractions();
    } catch (e) {
      console.error('Gallery API load failed:', e);
      grid.innerHTML = `<p style="color:#c00;padding:20px;">⚠ Nepodařilo se načíst data z CMS (${API_BASE}).</p>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
