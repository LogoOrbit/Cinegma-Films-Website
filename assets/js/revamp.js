/* ═══════════════════════════════════════════════════════════
   REVAMP LAYER — Cinegma Films
   Smart nav, scroll progress, auto reveals, split headlines,
   magnetic CTAs, card tilt/glare, hover prefetch.
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

  /* ── 1. SCROLL PROGRESS BAR ── */
  onReady(function () {
    if (REDUCED) return;
    var bar = doc.createElement('div');
    bar.id = 'rvProgress';
    doc.body.appendChild(bar);
    var ticking = false;
    function update() {
      ticking = false;
      var max = doc.body.scrollHeight - window.innerHeight;
      var p = max > 60 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
      bar.classList.toggle('rv-on', window.scrollY > 120);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  });

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

  /* ── 3. AUTO-REVEAL for content below the fold that has no .reveal ── */
  onReady(function () {
    if (REDUCED || !('IntersectionObserver' in window)) return;

    var fold = window.innerHeight * 0.92;
    var candidates = [];

    // Direct section children + common card/grid items, sitewide
    var sel = 'section > h1, section > h2, section > h3, section > p, ' +
              '.yt-card, .ott-row, .press-card, .blog-card, .article-card, ' +
              'section > .card, section > figure, section > blockquote';
    doc.querySelectorAll(sel).forEach(function (el) {
      if (el.closest('#hero, .hero, nav, footer, #mobileMenu, [data-rv-skip]')) return;
      if (el.classList.contains('reveal') || el.closest('.reveal')) return;
      if (el.classList.contains('rv-reveal')) return;
      var r = el.getBoundingClientRect();
      if (r.top < fold || r.height === 0) return; // never touch what's already visible
      candidates.push(el);
    });
    if (!candidates.length) return;

    // Stagger siblings that arrive together
    var groups = new Map();
    candidates.forEach(function (el) {
      var key = el.parentElement;
      var i = groups.get(key) || 0;
      el.style.setProperty('--rv-i', i);
      groups.set(key, i + 1);
      el.classList.add('rv-reveal');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });
    candidates.forEach(function (el) { io.observe(el); });
  });

  /* ── 4. SPLIT-WORD HEADLINE REVEAL (plain-text section titles below fold) ── */
  onReady(function () {
    if (REDUCED || !('IntersectionObserver' in window)) return;
    var fold = window.innerHeight * 0.92;
    var heads = [];
    doc.querySelectorAll('section h2, .section-title').forEach(function (el) {
      if (el.closest('#hero, .reveal, .rv-reveal, nav, [data-rv-skip]')) return;
      if (el.children.length > 0) return;                  // plain text only
      var t = el.textContent.trim();
      if (!t || t.length > 90) return;
      if (el.getBoundingClientRect().top < fold) return;
      heads.push(el);
    });
    if (!heads.length) return;

    heads.forEach(function (el) {
      var words = el.textContent.trim().split(/\s+/);
      el.textContent = '';
      words.forEach(function (w, i) {
        var outer = doc.createElement('span');
        outer.className = 'rv-w';
        var inner = doc.createElement('span');
        inner.className = 'rv-wi';
        inner.style.setProperty('--rv-w', i);
        inner.textContent = w;
        outer.appendChild(inner);
        el.appendChild(outer);
        if (i < words.length - 1) el.appendChild(doc.createTextNode(' '));
      });
      el.classList.add('rv-split');
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    heads.forEach(function (el) { io.observe(el); });
  });

  /* ── 5. MAGNETIC CTAS ── */
  onReady(function () {
    if (REDUCED || !FINE) return;
    var sel = '.hero-ctas a, .nav-contact-cta, #backToTop, .btn, .cta-btn, .cg-launch';
    doc.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('rv-mag');
      var strength = 7;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        el.classList.add('rv-magging');
        el.style.transform = 'translate(' + (x * strength) + 'px,' + (y * strength) + 'px)';
      });
      el.addEventListener('mouseleave', function () {
        el.classList.remove('rv-magging');
        el.style.transform = '';
      });
    });
  });

  /* ── 6. CARD TILT + GLARE ── */
  onReady(function () {
    if (REDUCED || !FINE) return;
    var MAXDEG = 4;
    doc.querySelectorAll('.film-card, .yt-card').forEach(function (card) {
      card.classList.add('rv-tilt');
      var cs = getComputedStyle(card);
      if (cs.position === 'static') card.style.position = 'relative';
      var glare = doc.createElement('div');
      glare.className = 'rv-glare';
      card.appendChild(glare);

      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.classList.add('rv-tilting');
        card.style.setProperty('--rv-ry', ((px - 0.5) * 2 * MAXDEG).toFixed(2) + 'deg');
        card.style.setProperty('--rv-rx', ((0.5 - py) * 2 * MAXDEG).toFixed(2) + 'deg');
        card.style.setProperty('--rv-gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--rv-gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.classList.remove('rv-tilting');
        card.style.setProperty('--rv-rx', '0deg');
        card.style.setProperty('--rv-ry', '0deg');
      });
    });
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
