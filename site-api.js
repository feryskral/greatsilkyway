// Načítá SiteInfo global z Payload CMS a aplikuje sdílené údaje
// (email, telefon, adresa, sociální sítě, hero texty, footer tagline) na všechny stránky.
(function () {
  const API_BASE = 'http://localhost:3000';

  function applyTexts(s) {
    // Hero titly a popis
    if (s.hero) {
      document.querySelectorAll('[data-i18n="hero_title1"]').forEach(el => {
        if (s.hero.title1) el.textContent = s.hero.title1;
      });
      document.querySelectorAll('[data-i18n="hero_title2"]').forEach(el => {
        if (s.hero.title2) el.textContent = s.hero.title2;
      });
      document.querySelectorAll('[data-i18n="hero_desc"]').forEach(el => {
        if (s.hero.description) el.textContent = s.hero.description;
      });
    }

    // Footer tagline
    if (s.footerTagline) {
      document.querySelectorAll('[data-i18n="footer_tagline"]').forEach(el => {
        el.textContent = s.footerTagline;
      });
    }

    // Email
    if (s.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach(a => {
        a.href = 'mailto:' + s.email;
        const hasIcon = a.textContent.trim().startsWith('📧');
        a.textContent = (hasIcon ? '📧 ' : '') + s.email;
      });
    }

    // Phone
    if (s.phone) {
      document.querySelectorAll('a[href^="tel:"]').forEach(a => {
        a.href = 'tel:' + s.phone.replace(/\s/g, '');
        a.textContent = s.phone;
      });
    }

    // Social links (fb/ig v patičce)
    if (s.facebookUrl) {
      document
        .querySelectorAll('a[href*="facebook.com"]')
        .forEach(a => (a.href = s.facebookUrl));
    }
    if (s.instagramUrl) {
      document
        .querySelectorAll('a[href*="instagram.com"]')
        .forEach(a => (a.href = s.instagramUrl));
    }

    // Address in footer (hardcoded in footer lists)
    if (s.address) {
      document.querySelectorAll('[data-site="address"]').forEach(el => {
        el.textContent = '📍 ' + s.address;
      });
    }
  }

  async function load() {
    try {
      const r = await fetch(`${API_BASE}/api/globals/site-info`);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const data = await r.json();
      applyTexts(data);
    } catch (e) {
      console.warn('SiteInfo load failed:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', load);
  } else {
    load();
  }
})();
