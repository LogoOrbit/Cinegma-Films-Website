/* Homepage extras: frames marquee, lazy in-view clips with sound toggles,
   and the Google Drive video feed (new uploads to the shared folder show
   up here once /api/public-data?view=drive-media is configured). */
(function () {
  'use strict';
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var lite = !!conn.saveData || /(^|-)2g/.test(conn.effectiveType || '') || reduced;
  /* perf.js can switch a struggling device to lite mode at any time */
  function isLite() { return lite || !!(window.__cinegmaPerf && window.__cinegmaPerf.lite()); }

  /* marquee: duplicate each set so the -50% loop is seamless */
  document.querySelectorAll('.mq-track').forEach(function (t) {
    var set = t.querySelector('.mq-set');
    if (!set || reduced) return;
    var c = set.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelectorAll('a').forEach(function (a) { a.tabIndex = -1; });
    t.appendChild(c);
    t.style.setProperty('--dur', (set.children.length * 6) + 's');
  });

  /* clips: load just before view, play in view, pause off view */
  function load(v) { if (!v.src && v.dataset.src) { v.src = v.dataset.src; v.load(); } }
  var vids = document.querySelectorAll('video.hx-vid');
  if ('IntersectionObserver' in window) {
    var near = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting && !isLite()) { load(e.target); near.unobserve(e.target); } });
    }, { rootMargin: '400px 0px' });
    var seen = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting && !isLite()) { load(v); v.play().catch(function () {}); }
        else if (!e.isIntersecting && v.src) v.pause();
      });
    }, { threshold: 0.35 });
    vids.forEach(function (v) { near.observe(v); seen.observe(v); });
  }
  vids.forEach(function (v) {
    v.addEventListener('click', function () {
      if (v.paused) { load(v); v.play().catch(function () {}); } else v.pause();
    });
  });

  addEventListener('cinegma:perf', function (e) {
    if (e.detail && e.detail.tier === 'lite') vids.forEach(function (v) { if (v.muted && !v.paused) v.pause(); });
  });

  /* sound toggles: one clip with sound at a time */
  var btns = document.querySelectorAll('.hx-snd');
  btns.forEach(function (b) {
    b.addEventListener('click', function () {
      var v = document.getElementById(b.dataset.for);
      if (!v) return;
      var on = v.muted;
      btns.forEach(function (o) {
        var ov = document.getElementById(o.dataset.for);
        if (ov && ov !== v) ov.muted = true;
        o.setAttribute('aria-pressed', 'false'); o.textContent = 'Sound On';
      });
      v.muted = !on;
      if (on) { load(v); v.play().catch(function () {}); }
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.textContent = on ? 'Sound Off' : 'Sound On';
    });
  });

  /* Google Drive feed */
  var grid = document.getElementById('hxDrive');
  if (!grid) return;
  var player, frame, last;
  /* Videos mirrored to Bunny Stream play in Bunny's player (fast, works
     everywhere). Until a new upload has finished encoding there, Google's
     Drive player is used, with a direct "Watch on Google Drive" link because
     Drive embeds can refuse to play on other sites. */
  var note, lib = null;
  function openPlayer(it) {
    if (!player) {
      player = document.createElement('div');
      player.id = 'hx-player';
      player.setAttribute('role', 'dialog'); player.setAttribute('aria-modal', 'true');
      player.setAttribute('aria-label', 'Video player'); player.setAttribute('data-lenis-prevent', '');
      player.innerHTML = '<div class="box"><iframe allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen title="Cinegma Films video"></iframe></div>' +
        '<p class="note" hidden></p><button class="x" type="button" aria-label="Close">×</button>';
      document.body.appendChild(player);
      frame = player.querySelector('iframe'); note = player.querySelector('.note');
      player.querySelector('.x').onclick = closePlayer;
      player.addEventListener('click', function (e) { if (e.target === player) closePlayer(); });
      addEventListener('keydown', function (e) { if (e.key === 'Escape' && player.classList.contains('open')) closePlayer(); });
    }
    last = document.activeElement;
    var id = encodeURIComponent(it.id);
    if (it.bunny && lib) {
      frame.src = 'https://iframe.mediadelivery.net/embed/' + encodeURIComponent(lib) + '/' + encodeURIComponent(it.bunny) + '?autoplay=true&preload=true&responsive=true';
      note.hidden = true;
    } else {
      frame.src = 'https://drive.google.com/file/d/' + id + '/preview';
      note.hidden = false;
      note.innerHTML = 'Not playing? <a href="https://drive.google.com/file/d/' + id + '/view" target="_blank" rel="noopener">Watch on Google Drive ↗</a>';
    }
    player.classList.add('open'); document.body.style.overflow = 'hidden';
    player.querySelector('.x').focus();
  }
  function closePlayer() {
    player.classList.remove('open'); frame.src = 'about:blank'; document.body.style.overflow = '';
    if (last && last.focus) last.focus();
  }
  function render(list) {
    grid.textContent = '';
    list.forEach(function (it, i) {
      var b = document.createElement('button');
      b.type = 'button';
      var title = it.title || ('From The Set · ' + String(i + 1).padStart(2, '0'));
      b.setAttribute('aria-label', 'Play ' + title);
      var im = document.createElement('img');
      im.loading = 'lazy'; im.decoding = 'async'; im.alt = '';
      im.src = 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(it.id) + '&sz=w640';
      im.onerror = function () { im.remove(); };
      var s = document.createElement('span'); s.textContent = title;
      b.appendChild(im); b.appendChild(s);
      b.addEventListener('click', function () { openPlayer(it); });
      grid.appendChild(b);
    });
  }
  var fallback = [];
  try { fallback = JSON.parse(grid.dataset.fallback || '[]'); } catch (e) {}
  render(fallback);
  fetch('/api/public-data?view=drive-media', { headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d && d.videos && d.videos.length) { lib = d.lib || null; render(d.videos); } })
    .catch(function () {});
})();
