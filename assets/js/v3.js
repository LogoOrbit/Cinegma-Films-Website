/* CINEGMA V3 — "AFTERGLOW" engine: aurora, grain, cursor, scroll progress,
   command palette (⌘K), 3D tilt, scramble text, reveal. Dependency-free. */
(function () {
  'use strict';
  if (window.__cinegmaV3) return; window.__cinegmaV3 = true;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = location.pathname.match(/\/(projects|team|admin)\//) ? '../' : '';

  function el(tag, id, html) { var e = document.createElement(tag); if (id) e.id = id; if (html) e.innerHTML = html; return e; }

  function init() {
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
      var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
      addEventListener('mousemove', function (e) {
        mx = e.clientX; my = e.clientY;
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
      '<div class="k-box" role="dialog" aria-label="Quick navigation">' +
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
        return '<div class="k-item' + (i === sel ? ' sel' : '') + '" data-i="' + i + '"><span>' + it.l + '</span><span class="k-tag">' + it.t + '</span></div>';
      }).join('') || '<div class="k-item">No results</div>';
    }
    function open() { K.classList.add('open'); input.value = ''; cur = items; sel = 0; render(); setTimeout(function () { input.focus(); }, 30); }
    function close() { K.classList.remove('open'); }
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
    /* reveal + scramble observer */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          if (en.target.hasAttribute('data-scramble') && !reduced) scramble(en.target);
          io.unobserve(en.target);
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('.v3-reveal, [data-scramble]').forEach(function (n) { io.observe(n); });
    } else {
      document.querySelectorAll('.v3-reveal').forEach(function (n) { n.classList.add('in'); });
    }
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
