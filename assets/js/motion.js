/* CINEGMA MOTION
   Lenis inertia scroll + GSAP/ScrollTrigger/SplitText: split headlines, clip-path
   media wipes with inner scale, hero parallax, magnetic buttons, label cursor,
   mouse-follow film previews and curtain page transitions.
   Must load after vendor/{gsap,ScrollTrigger,SplitText,lenis}.min.js and BEFORE
   v3.js, so it can claim the elements and features v3 would otherwise handle. */
(function () {
  'use strict';
  if (window.__cinegmaMotion) return;
  var html = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  var root = /\/(projects|team)\//.test(location.pathname) ? '../' : '';

  function curtainSafe() { html.classList.remove('m-pt-in'); }
  if (!gsap || !ST) { curtainSafe(); return; }
  window.__cinegmaMotion = true;
  gsap.registerPlugin(ST);
  if (Split) gsap.registerPlugin(Split);

  var EASE = 'expo.out';
  var lenis = null;

  /* ---------------- smooth scroll ---------------- */
  function initLenis() {
    if (reduced || !window.Lenis) return;
    lenis = new window.Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,           /* phones keep native momentum */
      anchors: { offset: -90 },
      allowNestedScroll: true,
      autoRaf: false,
      prevent: function (n) {
        return !!(n && n.closest && n.closest('#v3-k, #mmenu, .cg-bd, [data-lenis-prevent]'));
      }
    });
    window.lenis = lenis;
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);

    /* The menu drawer and modals lock the page with body overflow:hidden. */
    var b = document.body;
    new MutationObserver(function () {
      var lock = b.style.overflow === 'hidden' || b.classList.contains('menu-open');
      lock ? lenis.stop() : lenis.start();
    }).observe(b, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  /* ---------------- split headlines ---------------- */
  function initSplit() {
    if (reduced || !Split) return;
    var nodes = document.querySelectorAll(
      '.h-lg, .h-md, .sec-title, .intro-headline, .ledger-title, h1:not(#hero h1), [data-split]');
    nodes.forEach(function (n) {
      /* CSS-animated hero lines and gradient-clipped text keep their own treatment */
      if (n.querySelector('.line, .grad-text, .v3-grad') || n.closest('#v3-k, #mmenu, footer')) return;
      if (!n.textContent.trim()) return;
      n.classList.remove('v3-reveal');
      n.classList.add('m-split');
      var inHero = !!n.closest('.hero, .page-hero, .blog-hero');
      Split.create(n, {
        type: 'lines,words',
        linesClass: 'm-line',
        mask: 'lines',
        autoSplit: true,
        onSplit: function (self) {
          return gsap.from(self.lines, {
            yPercent: 115, rotate: 2.5, duration: 1.25, ease: EASE, stagger: 0.09,
            delay: inHero ? 0.25 : 0,
            scrollTrigger: inHero ? null : { trigger: n, start: 'top 88%', once: true }
          });
        }
      });
    });
  }

  /* ---------------- media reveals ---------------- */
  function initMedia() {
    if (reduced) return;
    var sel = '.poster-w, .frame, .vframe, .still, .pcard, .fcard, .tcard, .uni-card, .f-card, .article-card, .ycard, [data-wipe]';
    document.querySelectorAll(sel).forEach(function (box) {
      if (box.closest('#v3-k, #mmenu') || box.parentElement.closest(sel)) return;
      var inner = box.querySelector('img, video');
      var poster = box.matches('.poster-w, .fcard');
      box.classList.remove('v3-reveal');
      box.classList.add('m-wipe');
      var tl = gsap.timeline({
        scrollTrigger: { trigger: box, start: 'top 90%', once: true },
        onComplete: function () { box.style.clipPath = ''; box.classList.remove('m-wipe'); }
      });
      tl.fromTo(box, { clipPath: 'inset(18% 0% 18% 0% round 14px)', y: 60, autoAlpha: 0.001 },
        { clipPath: 'inset(0% 0% 0% 0% round 14px)', y: 0, autoAlpha: 1, duration: 1.4, ease: EASE, clearProps: 'transform,opacity,visibility' });
      if (inner) {
        if (poster) tl.fromTo(inner, { '--m-s': 1.35 }, { '--m-s': 1, duration: 1.8, ease: EASE }, 0);
        else tl.fromTo(inner, { scale: 1.3 }, { scale: 1, duration: 1.8, ease: EASE, clearProps: 'scale' }, 0);
      }
    });
  }

  /* ---------------- parallax ---------------- */
  function initParallax() {
    if (reduced) return;
    /* hero background drifts slower than the page, content lifts away */
    document.querySelectorAll('#hero .media, .hero .bg, .page-hero-img, .hero-img').forEach(function (m) {
      var hero = m.closest('section') || m.parentElement;
      gsap.to(m, { yPercent: 22, scale: 1.08, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });
    /* hero text scrolls with the page (lifting it slid it under the fixed nav
       and fought page scripts that also move it); it only fades a little */
    document.querySelectorAll('#hero .content, .hero .inner, .page-hero-content').forEach(function (c) {
      if (c.hasAttribute('data-own-scroll')) return;
      var hero = c.closest('section') || c.parentElement;
      gsap.to(c, { opacity: 0.25, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    });
    /* opt-in: data-speed="0.2" moves an element against the scroll */
    document.querySelectorAll('[data-speed]').forEach(function (n) {
      var s = parseFloat(n.getAttribute('data-speed')) || 0.15;
      gsap.fromTo(n, { yPercent: -s * 100 }, { yPercent: s * 100, ease: 'none',
        scrollTrigger: { trigger: n, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    /* section kickers slide in from the left */
    gsap.utils.toArray('.kicker').forEach(function (k) {
      if (k.closest('.hero, #hero')) return;
      k.classList.remove('v3-reveal');
      gsap.from(k, { x: -30, autoAlpha: 0, duration: 1, ease: EASE,
        scrollTrigger: { trigger: k, start: 'top 92%', once: true } });
    });
  }

  /* ---------------- cursor + magnetic ---------------- */
  var LABELS = [
    ['.poster-w, .fcard, a[href*="projects/"]:has(img)', 'View'],
    ['.frame, .vframe, .reel, [data-play]', 'Play'],
    ['.tcard, a[href*="team/"]:has(img)', 'Meet']
  ];
  function labelFor(t) {
    var c = t.closest && t.closest('[data-cursor-label]');
    if (c) return c.getAttribute('data-cursor-label');
    for (var i = 0; i < LABELS.length; i++) {
      try { if (t.closest(LABELS[i][0])) return LABELS[i][1]; } catch (e) { /* :has unsupported */ }
    }
    return '';
  }

  function initCursor() {
    if (!fine || reduced) return;
    var b = document.body;
    var dot = document.createElement('div'); dot.className = 'm-cur m-cur-dot';
    var ring = document.createElement('div'); ring.className = 'm-cur m-cur-ring';
    ring.innerHTML = '<i></i><b></b>';
    var txt = ring.querySelector('b');
    b.appendChild(ring); b.appendChild(dot);
    var dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' }),
        dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' }),
        rx = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' }),
        ry = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
    var live = false, lastLabel = '';
    addEventListener('mousemove', function (e) {
      if (!live) { live = true; gsap.set([dot, ring], { x: e.clientX, y: e.clientY }); b.classList.add('m-cur-live'); }
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      var t = e.target;
      var lbl = labelFor(t);
      if (lbl !== lastLabel) { lastLabel = lbl; if (lbl) txt.textContent = lbl; b.classList.toggle('m-cur-label', !!lbl); }
      b.classList.toggle('m-cur-hover', !lbl && !!(t.closest && t.closest('a,button,[role=button],label,summary,[data-cursor]')));
    }, { passive: true });
    document.addEventListener('mouseleave', function () { b.classList.remove('m-cur-live'); live = false; });
    addEventListener('mousedown', function () { b.classList.add('m-cur-down'); });
    addEventListener('mouseup', function () { b.classList.remove('m-cur-down'); });
  }

  function initMagnetic() {
    if (!fine || reduced) return;
    document.querySelectorAll('.btn, #nav .links a, #nav .logo, [data-magnetic], #v3-k-fab, .menu-btn, #menuBtn').forEach(function (m) {
      var strength = parseFloat(m.getAttribute('data-magnetic')) || (m.classList.contains('btn') ? 0.35 : 0.25);
      var xTo = gsap.quickTo(m, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.4)' }),
          yTo = gsap.quickTo(m, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.4)' });
      m.addEventListener('pointermove', function (e) {
        var r = m.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      m.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------------- film preview on text links ---------------- */
  var POSTERS = {
    'janjaal': 'Janjaal', 'portrait-of-life': 'Potrait', 'zawaal': 'Zawaal',
    'a-soldier-beside-me': 'Solder', 'payam-e-dil': 'Payam', 'main-aur-achu': 'Achu',
    'phir-se': 'PhirSe', 'urdu-bazaar-karachi': 'Urdu'
  };
  function initPreview() {
    if (!fine || reduced) return;
    var box = document.createElement('div'); box.className = 'm-preview';
    var img = document.createElement('img'); img.alt = ''; img.decoding = 'async';
    box.appendChild(img); document.body.appendChild(box);
    var xTo = gsap.quickTo(box, 'x', { duration: 0.7, ease: 'power3' }),
        yTo = gsap.quickTo(box, 'y', { duration: 0.7, ease: 'power3' }),
        on = false;
    function src(a) {
      var m = (a.getAttribute('href') || '').match(/projects\/([a-z0-9-]+?)(?:-trailer|-urdu|-awards|-making-of|-cast-and-crew)?\.html/);
      return m && POSTERS[m[1]] ? root + 'assets/posters/' + POSTERS[m[1]] + '_Opt_01-400w.avif' : '';
    }
    document.querySelectorAll('a[href*="projects/"]').forEach(function (a) {
      if (a.querySelector('img, video') || a.closest('#nav, #mmenu, #v3-k')) return;
      var s = src(a); if (!s) return;
      a.addEventListener('mouseenter', function (e) {
        img.src = s; on = true;
        gsap.set(box, { x: e.clientX, y: e.clientY });
        gsap.to(box, { autoAlpha: 1, scale: 1, rotate: -4, duration: 0.5, ease: EASE, overwrite: 'auto' });
      });
      a.addEventListener('mouseleave', function () {
        on = false;
        gsap.to(box, { autoAlpha: 0, scale: 0.6, rotate: 0, duration: 0.35, ease: 'power3.in', overwrite: 'auto' });
      });
    });
    addEventListener('mousemove', function (e) { if (on) { xTo(e.clientX); yTo(e.clientY); } }, { passive: true });
  }

  /* ---------------- page transitions ---------------- */
  function initTransitions() {
    var cur = document.createElement('div');
    cur.className = 'm-curtain'; cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span>Cinegma</span>';
    document.body.appendChild(cur);
    var word = cur.firstChild;
    var arriving = html.classList.contains('m-pt-in');
    try { sessionStorage.removeItem('m-pt'); } catch (e) { }

    if (arriving && !reduced) {
      gsap.set(cur, { visibility: 'visible', clipPath: 'inset(0% 0% 0% 0%)' });
      gsap.set(word, { opacity: 1 });
      html.classList.remove('m-pt-in');
      gsap.timeline()
        .to(word, { opacity: 0, y: -20, duration: 0.35, ease: 'power2.in' })
        .to(cur, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
        .set(cur, { visibility: 'hidden', clipPath: 'inset(100% 0% 0% 0%)' });
    } else curtainSafe();

    addEventListener('pageshow', function (e) {
      if (e.persisted) { gsap.killTweensOf([cur, word]); gsap.set(cur, { visibility: 'hidden', clipPath: 'inset(100% 0% 0% 0%)' }); curtainSafe(); }
    });

    if (reduced) return;
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target.closest && e.target.closest('a[href]');
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
      var u;
      try { u = new URL(a.href, location.href); } catch (err) { return; }
      if (u.origin !== location.origin || !/^https?:$/.test(u.protocol)) return;
      if (/\/(admin|api)\//.test(u.pathname) || /\.(pdf|mp4|avif|jpe?g|png|webp|zip|xml|txt)$/i.test(u.pathname)) return;
      if (u.pathname === location.pathname && u.search === location.search) return; /* same page / anchor */
      e.preventDefault();
      try { sessionStorage.setItem('m-pt', '1'); } catch (err) { }
      gsap.set(cur, { visibility: 'visible', clipPath: 'inset(100% 0% 0% 0%)' });
      gsap.set(word, { opacity: 0, y: 20 });
      gsap.timeline({ onComplete: function () { location.href = u.href; } })
        .to(cur, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut' })
        .to(word, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25');
    });
  }

  /* ---------------- boot ---------------- */
  function run(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[motion]', e); } }
  run(initTransitions);
  /* Native scrolling everywhere: the Lenis wheel smoothing felt laggy and
     fought high-refresh screens, so the browser's own scroll is used. */
  ST.config({ ignoreMobileResize: true });
  run(initSplit);
  run(initMedia);
  run(initParallax);
  run(initCursor);
  run(initMagnetic);
  run(initPreview);

  /* Late layout shifts (fonts, lazy media, "show more" toggles) move trigger
     points; re-measure once things settle. */
  addEventListener('load', function () { ST.refresh(); });
  if ('ResizeObserver' in window) {
    var t = 0, h = 0;
    new ResizeObserver(function () {
      var nh = document.body.scrollHeight;
      if (Math.abs(nh - h) < 4) return; h = nh;
      clearTimeout(t); t = setTimeout(function () { ST.refresh(); }, 200);
    }).observe(document.body);
  }
})();
