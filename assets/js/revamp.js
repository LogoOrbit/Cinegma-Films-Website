/* ═══════════════════════════════════════════════════════════
   REVAMP LAYER — Cinegma Films
   Smart nav, hover prefetch.
   Progressive enhancement only — safe without JS/CSS support.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  root.classList.add('rv-js');

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  function onReady(fn) {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ── 2. SMART NAV (condense on scroll, hide down / show up) ── */
  onReady(function () {
    var nav = doc.querySelector('nav');
    if (!nav) return;
    var lastY = window.scrollY;
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY;
      nav.classList.toggle('rv-scrolled', y > 30);
      // Never hide while the mobile menu is open (body scroll locked)
      var locked = doc.body.style.overflow === 'hidden';
      if (!REDUCED && !locked) {
        if (y > 520 && y > lastY + 4) nav.classList.add('rv-hidden');
        else if (y < lastY - 4 || y <= 520) nav.classList.remove('rv-hidden');
      } else {
        nav.classList.remove('rv-hidden');
      }
      lastY = y;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });

  /* ── 7. HOVER PREFETCH for internal pages (snappier navigation) ── */
  onReady(function () {
    var seen = {};
    function prefetch(href) {
      if (seen[href]) return;
      seen[href] = true;
      var l = doc.createElement('link');
      l.rel = 'prefetch';
      l.href = href;
      l.as = 'document';
      doc.head.appendChild(l);
    }
    function handler(e) {
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#' || /^[a-z]+:/i.test(href) && a.origin !== location.origin) return;
      try {
        var url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname) return;
        prefetch(url.pathname);
      } catch (err) { /* ignore malformed hrefs */ }
    }
    doc.addEventListener('mouseover', handler, { passive: true });
    doc.addEventListener('touchstart', handler, { passive: true });
  });

})();
