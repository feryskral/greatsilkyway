// Načítá psy z Payload CMS a vykresluje karty v sekci "Naši psi"
(function () {
  const API_BASE = 'http://localhost:3000';

  const cardStyleOverrides = {};
  const imgStyleOverrides = {
    matteo: 'width:100%;height:100%;object-fit:cover;object-position:center 30%;',
    oxygen: 'width:100%;height:100%;object-fit:cover;object-position:center 20%;',
  };
  const defaultImgStyle = 'width:100%;height:100%;object-fit:cover;object-position:center center;';

  const achievementsFn = {
    senorita: 'openRomaAchievements',
    michelle: 'openMichelleAchievements',
    oxygen: 'openOxygenAchievements',
    matteo: 'openMatteoAchievements',
  };

  function escapeHtml(s) {
    return String(s ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;');
  }

  function renderCard(dog, idx) {
    const slug = dog.slug;
    const imgUrl = dog.photo?.url ? `${API_BASE}${dog.photo.url}` : '';
    const cardStyle = cardStyleOverrides[slug] || '';
    const imgStyle = imgStyleOverrides[slug] || defaultImgStyle;
    const badgeColor =
      dog.gender === 'male' ? 'style="background:var(--color-navy);"' : '';
    const badgeText = dog.gender === 'male' ? 'Pes' : 'Fena';
    const delay = `aos-d${(idx % 3) + 1}`;
    const meta = [];
    if (dog.titles) {
      meta.push(
        `<div class="dog-card__meta-item"><label data-i18n="dog_titles">Tituly</label><span>${escapeHtml(dog.titles)}</span></div>`
      );
    }
    meta.push(
      `<div class="dog-card__meta-item"><label data-i18n="dog_dna">Zdraví</label><span data-i18n="dna_clean">${escapeHtml(dog.health || 'V pořádku')} ✓</span></div>`
    );
    const achFn = achievementsFn[slug];
    const achBtn = achFn
      ? `<button class="btn btn--outline btn--sm btn--achievements" onclick="event.stopPropagation(); ${achFn}()">🏆 <span data-i18n="btn_achievements">Úspěchy</span></button>`
      : '';

    return `
      <div class="dog-card aos ${delay}" style="cursor:pointer;" onclick="location.href='galerie.html#${escapeHtml(slug)}'">
        <div class="dog-card__image" ${cardStyle ? `style="${cardStyle}"` : ''}>
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(dog.name)}" style="${imgStyle}" />
          <span class="dog-card__badge" ${badgeColor}>${badgeText}</span>
        </div>
        <div class="dog-card__body">
          <div class="dog-card__breed" data-i18n="breed_yt">${escapeHtml(dog.breed || 'Yorkshire teriér')}</div>
          <div class="dog-card__name">${escapeHtml(dog.name)}</div>
          <p class="dog-card__desc"><span data-i18n="${slug}_desc">${escapeHtml(dog.description || '')}</span></p>
          <div class="dog-card__meta">${meta.join('')}</div>
          ${achBtn}
        </div>
      </div>`;
  }

  async function load() {
    const females = document.getElementById('dogs-females');
    const males = document.getElementById('dogs-males');
    if (!females || !males) return;
    try {
      const r = await fetch(`${API_BASE}/api/dogs?limit=100&depth=1&sort=order`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const { docs } = await r.json();
      const fList = docs.filter(d => d.gender === 'female');
      const mList = docs.filter(d => d.gender === 'male');
      females.innerHTML = fList.map(renderCard).join('');
      males.innerHTML = mList.map(renderCard).join('');
      document
        .querySelectorAll('#dogs-females .aos, #dogs-males .aos')
        .forEach(el => el.classList.add('aos--visible'));
      if (window.applyTranslations && window.getLang) {
        try { window.applyTranslations(window.getLang()); } catch (_) {}
      }
    } catch (e) {
      console.error('Dogs API load failed:', e);
      const msg = `<p style="color:#c00;padding:20px;">⚠ Nepodařilo se načíst data z CMS (${API_BASE}). Zkontrolujte, že Payload dev server běží.</p>`;
      females.innerHTML = msg;
      males.innerHTML = '';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
