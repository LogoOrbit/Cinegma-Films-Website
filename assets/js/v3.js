/* CINEGMA V3 — "AFTERGLOW" engine: aurora, grain, cursor, scroll progress,
   command palette (⌘K), 3D tilt, scramble text, reveal. Dependency-free. */
(function () {
  'use strict';
  if (window.__cinegmaV3) return; window.__cinegmaV3 = true;
  /* Arm the reveal gate as early as this file runs. Pages also set it inline in
     <head> so there is no flash; this is the belt-and-braces copy. */
  document.documentElement.classList.add('v3-js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = location.pathname.match(/\/(projects|team|admin)\//) ? '../' : '';

  function el(tag, id, html) { var e = document.createElement(tag); if (id) e.id = id; if (html) e.innerHTML = html; return e; }

  /* scramble text on scroll-into-view */
  var CH = '!<>-_\\/[]{}—=+*^?#________';
  function scramble(node) {
    var final = node.dataset.v3Text || node.textContent; node.dataset.v3Text = final;
    var frame = 0, len = final.length;
    (function tick() {
      var out = '', done = 0;
      for (var i = 0; i < len; i++) {
        if (frame >= i * 2 + 8) { out += final[i]; done++; }
        else out += CH[(Math.random() * CH.length) | 0];
      }
      node.textContent = out;
      if (done < len) { frame += 2; requestAnimationFrame(tick); }
    })();
  }

  function revealAll() {
    document.querySelectorAll('.v3-reveal').forEach(function (n) { n.classList.add('in'); });
  }

  /* Runs before every decorative feature so a later throw can never leave the
     page hidden behind opacity:0. */
  function initReveal() {
    if (!('IntersectionObserver' in window)) { revealAll(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        stagger(en.target);
        en.target.classList.add('in');
        if (en.target.hasAttribute('data-scramble') && !reduced) scramble(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.v3-reveal, [data-scramble]').forEach(function (n) { io.observe(n); });
    /* failsafe: anything still hidden inside the viewport after load gets shown */
    addEventListener('load', function () {
      setTimeout(function () {
        document.querySelectorAll('.v3-reveal:not(.in)').forEach(function (n) {
          var r = n.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) n.classList.add('in');
        });
      }, 1200);
    });
  }


  /* ---- row-aware stagger --------------------------------------------------
     Siblings that share a row ripple in left-to-right instead of landing as one
     block. The delay is measured off layout the first time a row is touched,
     so it survives any column count the grid resolves to. */
  function stagger(node) {
    if (reduced || node.dataset.v3Delay) return;
    var parent = node.parentElement;
    if (!parent) return;
    var sibs = [].filter.call(parent.children, function (c) { return c.classList.contains('v3-reveal'); });
    if (sibs.length < 2) return;
    var top = Math.round(node.offsetTop / 8), i = 0;
    for (var n = 0; n < sibs.length; n++) {
      if (sibs[n] === node) break;
      if (Math.round(sibs[n].offsetTop / 8) === top) i++;
    }
    var d = Math.min(i, 5) * 90;
    node.dataset.v3Delay = '1';
    if (d) node.style.transitionDelay = d + 'ms';
  }

  /* ---- poster parallax ----------------------------------------------------
     The artwork drifts against its frame as the card crosses the viewport.
     Written to a custom property so the CSS hover scale keeps working. */
  function initParallax() {
    if (reduced || !fine || !('IntersectionObserver' in window)) return;
    var sel = '.poster-w img, .fcard .fc-poster';
    var live = [], raf = 0;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var i = live.indexOf(en.target);
        if (en.isIntersecting) { if (i < 0) live.push(en.target); }
        else if (i > -1) { live.splice(i, 1); en.target.style.setProperty('--v3-py', '0px'); }
      });
      if (live.length && !raf) raf = requestAnimationFrame(tick);
    }, { rootMargin: '15% 0px' });

    function tick() {
      raf = 0;
      var vh = innerHeight;
      for (var n = 0; n < live.length; n++) {
        var el = live[n], r = el.getBoundingClientRect();
        if (!r.height) continue;
        /* -1 at the bottom of the viewport, +1 at the top */
        var t = 1 - 2 * ((r.top + r.height / 2) / vh);
        el.style.setProperty('--v3-py', (t * 14).toFixed(2) + 'px');
      }
      if (live.length) raf = requestAnimationFrame(tick);
    }
    document.querySelectorAll(sel).forEach(function (n) { io.observe(n); });
  }

  /* ---- inertial smooth scroll ---------------------------------------------
     Desktop wheel input is eased into the real scroll position instead of
     jumping, which is what gives long poster runs their glide. It drives the
     native scroller (no transformed wrapper), so sticky/fixed chrome, anchor
     links and the scrollbar all keep behaving normally. Touch devices already
     have momentum from the OS and are left completely alone. */
  function initSmoothScroll() {
    if (reduced || !fine || matchMedia('(hover: none)').matches) return;
    var target = scrollY, current = scrollY, raf = 0, driving = false, last = 0;

    function limit() { return Math.max(0, document.documentElement.scrollHeight - innerHeight); }

    /* Anything the user is scrolling inside (a modal, an overflow pane) keeps
       its native behaviour — we only ease the page itself. */
    function nested(node) {
      for (var n = node; n && n !== document.body; n = n.parentElement) {
        if (n.scrollHeight - n.clientHeight > 2) {
          var o = getComputedStyle(n).overflowY;
          if (o === 'auto' || o === 'scroll') return true;
        }
      }
      return false;
    }

    addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented || nested(e.target)) return;
      var d = e.deltaY;
      if (e.deltaMode === 1) d *= 18;        /* lines  */
      else if (e.deltaMode === 2) d *= innerHeight; /* pages */
      e.preventDefault();
      target = Math.max(0, Math.min(limit(), target + d));
      if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
    }, { passive: false });

    /* Keyboard, anchor jumps and scrollbar drags move the page without us;
       resync so the next wheel tick eases from where the page actually is.
       Scroll events land a frame after the scrollTo that caused them, so the
       source is identified by position rather than by a synchronous flag —
       otherwise the loop would keep resetting its own target and stall. */
    addEventListener('scroll', function () {
      if (driving && Math.abs(scrollY - current) < 2) return;
      driving = false; target = current = scrollY;
    }, { passive: true });

    function loop(now) {
      raf = 0;
      /* Frame-rate independent easing: a fixed per-frame factor would glide at
         one speed on a 60Hz panel and a different one at 144Hz. Smoothing over
         elapsed time keeps the feel identical on any display. */
      var dt = last ? Math.min(now - last, 50) : 16.7; last = now;
      current += (target - current) * (1 - Math.pow(1 - 0.12, dt / 16.7));
      if (Math.abs(target - current) < 0.4) current = target;
      driving = true;
      /* 'instant' matters: the pages set html{scroll-behavior:smooth} for
         anchor links, and without the override the browser would re-animate
         every frame we write and the page would crawl. */
      try { scrollTo({ top: current, behavior: 'instant' }); }
      catch (e) { scrollTo(0, current); }
      if (current !== target) raf = requestAnimationFrame(loop);
      else { driving = false; last = 0; }
    }
  }

  function init() {
    try { initReveal(); } catch (e) { revealAll(); }
    try { initParallax(); } catch (e) { /* decorative only */ }
    try { initSmoothScroll(); } catch (e) { /* native scroll stays */ }
    try { decorate(); } catch (e) { /* never let chrome break the page */ }
  }

  function decorate() {
    var b = document.body;

    /* backdrop layers */
    b.appendChild(el('div', 'v3-aurora', '<i></i><i></i><i></i>'));
    if (!reduced) b.appendChild(el('div', 'v3-grain'));
    var prog = el('div', 'v3-progress'); b.appendChild(prog);

    /* scroll progress */
    var ticking = false;
    addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
        ticking = false;
      });
    }, { passive: true });

    /* custom cursor */
    if (fine && !reduced) {
      var dot = el('div', 'v3-cur-dot'), ring = el('div', 'v3-cur-ring');
      b.appendChild(dot); b.appendChild(ring);
      var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, live = false;
      addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
        if (!live) { live = true; rx = mx; ry = my; b.classList.add('v3-cur-live'); }
        dot.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
        var t = e.target.closest && e.target.closest('a,button,[role=button],input,select,textarea,[data-cursor]');
        b.classList.toggle('v3-cur-hover', !!t);
      }, { passive: true });
      addEventListener('mousedown', function () { b.classList.add('v3-cur-down'); });
      addEventListener('mouseup', function () { b.classList.remove('v3-cur-down'); });
      (function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
        requestAnimationFrame(loop);
      })();
    }

    /* command palette */
    var items = [
      { l: 'Home', t: 'Page', u: root + 'index.html' },
      { l: 'Watch — Screening Room', t: 'Page', u: root + 'watch.html' },
      { l: 'Services & Craft', t: 'Page', u: root + 'services.html' },
      { l: 'About / The Story', t: 'Page', u: root + 'about.html' },
      { l: 'Press & EPK', t: 'Page', u: root + 'press.html' },
      { l: 'Blog', t: 'Page', u: root + 'blog.html' },
      { l: 'Contact', t: 'Page', u: root + 'contact.html' },
      { l: 'Janjaal (Tussle) — 14 Awards', t: 'Film', u: root + 'projects/janjaal.html' },
      { l: 'Portrait of Life', t: 'Film', u: root + 'projects/portrait-of-life.html' },
      { l: 'Zawaal', t: 'Film', u: root + 'projects/zawaal.html' },
      { l: 'A Soldier Beside Me', t: 'Film', u: root + 'projects/a-soldier-beside-me.html' },
      { l: 'Payam e Dil', t: 'Film', u: root + 'projects/payam-e-dil.html' },
      { l: 'Main Aur Achu', t: 'Film', u: root + 'projects/main-aur-achu.html' },
      { l: 'Phir Se', t: 'Film', u: root + 'projects/phir-se.html' },
      { l: 'Urdu Bazaar Karachi', t: 'Film', u: root + 'projects/urdu-bazaar-karachi.html' },
      { l: 'Syed Asad Raza Abidi — Founder & Director', t: 'Team', u: root + 'team/syed-asad.html' },
      { l: 'Ghayas Uddin Siddiqui — Cinematographer', t: 'Team', u: root + 'team/ghayas-uddin.html' },
      { l: 'Ameer Hamza — Writer & Producer', t: 'Team', u: root + 'team/ameer-hamza.html' },
      { l: 'Faizan Ahmed — Production Designer', t: 'Team', u: root + 'team/faizan-ahmed.html' },
      { l: 'Usman Ali Akbar — Composer', t: 'Team', u: root + 'team/usman-ali.html' },
      { l: 'Dayyan Khalid — Producer', t: 'Team', u: root + 'team/dayyan-khalid.html' }
    ];
    var K = el('div', 'v3-k',
      '<div class="k-box" role="dialog" aria-modal="true" aria-label="Quick navigation">' +
      '<input type="text" placeholder="Search films, pages, people…" aria-label="Search site">' +
      '<div class="k-list" role="listbox"></div>' +
      '<div class="k-hint"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div></div>');
    b.appendChild(K);
    var fab = el('button', 'v3-k-fab');
    fab.innerHTML = '<span class="dot"></span><span class="lbl">Quick Nav</span><kbd style="border:1px solid rgba(255,255,255,.2);border-radius:4px;padding:1px 6px;font-size:10px">⌘K</kbd>';
    fab.setAttribute('aria-label', 'Open quick navigation');
    var fabOff = false; try { fabOff = !!sessionStorage.getItem('v3_fab_off'); } catch (e) { }
    if (!fabOff) b.appendChild(fab);
    function killFab() { fab.remove(); try { sessionStorage.setItem('v3_fab_off', '1'); } catch (e) { } }
    var fx = document.createElement('span');
    fx.id = 'v3-k-fabx'; fx.textContent = '\u00d7';
    fx.setAttribute('role', 'button'); fx.setAttribute('aria-label', 'Hide quick nav button');
    fx.addEventListener('click', function (e) { e.stopPropagation(); killFab(); });
    fab.appendChild(fx);
    var fsx = null, fdx = 0;
    fab.addEventListener('touchstart', function (e) { fsx = e.touches[0].clientX; fdx = 0; fab.style.transition = 'none'; }, { passive: true });
    fab.addEventListener('touchmove', function (e) {
      if (fsx == null) return;
      fdx = e.touches[0].clientX - fsx;
      fab.style.transform = 'translateX(' + fdx + 'px)';
      fab.style.opacity = Math.max(0, 1 - Math.abs(fdx) / 120);
    }, { passive: true });
    fab.addEventListener('touchend', function () {
      fab.style.transition = '';
      if (Math.abs(fdx) > 60) killFab();
      else { fab.style.transform = ''; fab.style.opacity = ''; }
      fsx = null;
    }, { passive: true });

    var input = K.querySelector('input'), list = K.querySelector('.k-list'), sel = 0, cur = items;
    function render() {
      list.innerHTML = cur.map(function (it, i) {
        return '<div class="k-item' + (i === sel ? ' sel' : '') + '" role="option" aria-selected="' + (i === sel) +
          '" data-i="' + i + '"><span>' + it.l + '</span><span class="k-tag">' + it.t + '</span></div>';
      }).join('') || '<div class="k-item">No results</div>';
    }
    var lastFocus = null;
    function open() {
      lastFocus = document.activeElement;
      K.classList.add('open'); input.value = ''; cur = items; sel = 0; render();
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      K.classList.remove('open');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function go() { if (cur[sel]) location.href = cur[sel].u; }
    fab.addEventListener('click', open);
    K.addEventListener('click', function (e) { if (e.target === K) close(); });
    list.addEventListener('click', function (e) {
      var it = e.target.closest('.k-item'); if (it && it.dataset.i != null) { sel = +it.dataset.i; go(); }
    });
    input.addEventListener('input', function () {
      var q = input.value.toLowerCase();
      cur = items.filter(function (it) { return it.l.toLowerCase().indexOf(q) > -1 || it.t.toLowerCase().indexOf(q) > -1; });
      sel = 0; render();
    });
    addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); K.classList.contains('open') ? close() : open(); return; }
      if (!K.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, cur.length - 1); render(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); render(); }
      else if (e.key === 'Enter') go();
    });

    /* 3D tilt */
    if (fine && !reduced) {
      document.querySelectorAll('[data-v3-tilt], .movie-card, .film-poster, .team-card').forEach(function (c) {
        c.setAttribute('data-v3-tilt', '');
        c.addEventListener('pointermove', function (e) {
          var r = c.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          c.style.transform = 'perspective(900px) rotateY(' + (x * 7) + 'deg) rotateX(' + (-y * 7) + 'deg) translateZ(6px)';
        });
        c.addEventListener('pointerleave', function () { c.style.transform = ''; });
      });
    }

  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
