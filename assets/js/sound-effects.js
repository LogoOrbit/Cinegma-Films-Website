/* ===========================================================================
   CINEGMA FILMS — INTERACTIVE SOUND DESIGN
   Procedural UI sound effects generated with the Web Audio API.
   No audio files: every sound is synthesised in code, so there is nothing
   to download, host or license. Pairs with the ambient "Ambience" layer in
   creative-enhancements.js but runs independently.

   Effects:
     • hover      – soft tick on links / buttons / nav
     • sparkle    – shimmering twinkle on laurels & award cards
     • cinematic  – deep filtered swell on film posters
     • click      – mechanical click on buttons / CTAs
     • shutter    – camera shutter when navigating to another page
     • whoosh     – mobile menu open / close
     • blip       – form-field focus
     • toggle     – sound on / off confirmation
   ========================================================================= */
(function () {
  'use strict';

  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  var STORE_KEY = 'cinegma_sfx_enabled';
  var prefersReduced =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer =
    window.matchMedia &&
    window.matchMedia('(hover:hover) and (pointer:fine)').matches;

  // Default ON, unless the visitor prefers reduced motion (then default OFF).
  var enabled = !prefersReduced;
  try {
    var stored = localStorage.getItem(STORE_KEY);
    if (stored !== null) enabled = stored === '1';
  } catch (e) {}

  var ctx = null;
  var master = null;

  function ensureCtx() {
    if (ctx) return;
    ctx = new AudioCtx();
    master = ctx.createGain();
    master.gain.value = 0.5; // overall SFX headroom
    master.connect(ctx.destination);
  }

  // Browsers require a user gesture before audio can start.
  function unlock() {
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
    window.addEventListener(ev, unlock, { passive: true });
  });

  function ready() {
    if (!enabled) return false;
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx.state === 'running';
  }

  // ── Throttle: avoid overlapping spam when sweeping the cursor ──
  var lastAt = {};
  function gate(name, ms) {
    var t = (ctx ? ctx.currentTime : 0) * 1000;
    if (lastAt[name] && t - lastAt[name] < ms) return false;
    lastAt[name] = t;
    return true;
  }

  // ── Synthesis helpers ──
  function noiseSource(dur) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    var src = ctx.createBufferSource();
    src.buffer = buf;
    return src;
  }

  function tone(opts) {
    // opts: type, f0, f1, peak, attack, dur, dest
    var t = ctx.currentTime + (opts.delay || 0);
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(opts.f0, t);
    if (opts.f1) o.frequency.exponentialRampToValueAtTime(opts.f1, t + opts.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.peak, t + (opts.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    o.connect(g);
    g.connect(opts.dest || master);
    o.start(t);
    o.stop(t + opts.dur + 0.02);
    return { osc: o, gain: g };
  }

  // ── Individual effects ──
  function fxHover() {
    if (!ready() || !gate('hover', 40)) return;
    tone({ type: 'sine', f0: 760, f1: 1240, peak: 0.05, attack: 0.008, dur: 0.09 });
  }

  function fxClick() {
    if (!ready()) return;
    var t = ctx.currentTime;
    // bright mechanical transient
    var nb = noiseSource(0.06);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1900;
    bp.Q.value = 1.3;
    var ng = ctx.createGain();
    ng.gain.setValueAtTime(0.0001, t);
    ng.gain.exponentialRampToValueAtTime(0.16, t + 0.002);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    nb.connect(bp);
    bp.connect(ng);
    ng.connect(master);
    nb.start(t);
    nb.stop(t + 0.07);
    // short body
    tone({ type: 'triangle', f0: 430, f1: 150, peak: 0.11, attack: 0.003, dur: 0.07 });
  }

  function fxSparkle() {
    if (!ready() || !gate('sparkle', 90)) return;
    var notes = [1568, 2093, 2637, 3136]; // ascending bell partials
    for (var i = 0; i < notes.length; i++) {
      tone({
        type: 'sine',
        f0: notes[i] * (1 + (Math.random() - 0.5) * 0.012),
        peak: 0.055,
        attack: 0.01,
        dur: 0.34,
        delay: i * 0.045 + Math.random() * 0.012
      });
    }
  }

  function fxCinematic() {
    if (!ready() || !gate('cinematic', 140)) return;
    var t = ctx.currentTime;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(180, t);
    lp.frequency.exponentialRampToValueAtTime(950, t + 0.45);
    lp.Q.value = 5;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.15, t + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    lp.connect(g);
    g.connect(master);

    var o1 = ctx.createOscillator();
    o1.type = 'sawtooth';
    o1.frequency.setValueAtTime(55, t);
    o1.frequency.exponentialRampToValueAtTime(73, t + 0.5);
    var o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = 82.5;
    o1.connect(lp);
    o2.connect(lp);
    o1.start(t);
    o2.start(t);
    o1.stop(t + 0.75);
    o2.stop(t + 0.75);
  }

  function fxShutter() {
    if (!ready()) return;
    var t0 = ctx.currentTime;
    function clack(at, freq, vol) {
      var nb = noiseSource(0.05);
      var bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = freq;
      bp.Q.value = 2;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol, at + 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
      nb.connect(bp);
      bp.connect(g);
      g.connect(master);
      nb.start(at);
      nb.stop(at + 0.05);
      // mechanical thunk
      var o = ctx.createOscillator();
      var og = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(230, at);
      o.frequency.exponentialRampToValueAtTime(95, at + 0.045);
      og.gain.setValueAtTime(0.0001, at);
      og.gain.exponentialRampToValueAtTime(vol * 0.8, at + 0.002);
      og.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);
      o.connect(og);
      og.connect(master);
      o.start(at);
      o.stop(at + 0.07);
    }
    clack(t0, 2200, 0.22); // mirror up / snap
    clack(t0 + 0.11, 1650, 0.18); // shutter close
  }

  function fxWhoosh(reverse) {
    if (!ready()) return;
    var t = ctx.currentTime;
    var dur = 0.34;
    var nb = noiseSource(dur);
    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(reverse ? 1500 : 380, t);
    bp.frequency.exponentialRampToValueAtTime(reverse ? 380 : 1500, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.11, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    nb.connect(bp);
    bp.connect(g);
    g.connect(master);
    nb.start(t);
    nb.stop(t + dur);
  }

  function fxBlip() {
    if (!ready() || !gate('blip', 80)) return;
    tone({ type: 'sine', f0: 540, f1: 720, peak: 0.05, attack: 0.006, dur: 0.12 });
  }

  function fxToggle(on) {
    if (!ctx) ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    if (ctx.state !== 'running') return;
    tone({ type: 'sine', f0: on ? 520 : 660, peak: 0.09, attack: 0.005, dur: 0.1 });
    tone({
      type: 'sine',
      f0: on ? 780 : 440,
      peak: 0.09,
      attack: 0.005,
      dur: 0.14,
      delay: 0.07
    });
  }

  // ── Element classification ──
  var SEL_SPARKLE = '.lw-item, .laurel-pill, .aw-card';
  var SEL_CINEMA = '.film-card, .yt-card, .card-media, .card-thumb';
  var SEL_GENERIC =
    'a, button, .btn, .cta, .nav-logo, [role="button"], .gs-option, .cg-launch, .cg-tb, summary';

  function classify(el) {
    var node;
    if ((node = el.closest(SEL_SPARKLE))) return { type: 'sparkle', node: node };
    if ((node = el.closest(SEL_CINEMA))) return { type: 'cinematic', node: node };
    if ((node = el.closest(SEL_GENERIC))) return { type: 'hover', node: node };
    return null;
  }

  // ── Internal navigation detection (matches page-transition logic) ──
  function isInternalNav(href) {
    if (!href) return false;
    if (href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return false;
    if (href.indexOf('#') !== -1) return false;
    try {
      var url = new URL(href, location.origin);
      if (url.origin !== location.origin) return false;
      if (/\.(pdf|zip|jpg|jpeg|png|webp|avif|mp4|mp3|wav)$/i.test(url.pathname)) return false;
      return url.pathname !== location.pathname;
    } catch (e) {
      return false;
    }
  }

  // ── Hover wiring (desktop / fine pointer only) ──
  var currentHover = null;
  if (finePointer) {
    document.addEventListener(
      'mouseover',
      function (e) {
        var info = classify(e.target);
        if (!info) {
          currentHover = null;
          return;
        }
        if (info.node === currentHover) return;
        currentHover = info.node;
        if (info.type === 'sparkle') fxSparkle();
        else if (info.type === 'cinematic') fxCinematic();
        else fxHover();
      },
      { passive: true }
    );
  }

  // ── Click wiring (capture phase so it precedes navigation handlers) ──
  document.addEventListener(
    'click',
    function (e) {
      if (e.target.closest('#sfxToggle')) return; // handled by its own button
      if (!enabled) return;
      unlock();

      var link = e.target.closest('a[href]');
      var poster = e.target.closest('.film-card[data-project]');
      if ((link && isInternalNav(link.getAttribute('href'))) || poster) {
        fxShutter();
        return;
      }
      if (e.target.closest(SEL_GENERIC + ', .card-actions a')) {
        fxClick();
      }
    },
    true
  );

  // ── Form-field focus ──
  document.addEventListener(
    'focusin',
    function (e) {
      if (!enabled) return;
      if (e.target.matches('input, textarea, select')) fxBlip();
    },
    true
  );

  // ── Mobile menu whoosh (wrap the helpers defined in shared.js) ──
  function wrapMenu() {
    if (typeof window.openMenu === 'function' && !window.openMenu._sfx) {
      var openOrig = window.openMenu;
      window.openMenu = function () {
        if (enabled) fxWhoosh(false);
        return openOrig.apply(this, arguments);
      };
      window.openMenu._sfx = true;
    }
    if (typeof window.closeMenu === 'function' && !window.closeMenu._sfx) {
      var closeOrig = window.closeMenu;
      window.closeMenu = function () {
        if (enabled) fxWhoosh(true);
        return closeOrig.apply(this, arguments);
      };
      window.closeMenu._sfx = true;
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wrapMenu);
  } else {
    wrapMenu();
  }

  // ── On / off toggle button ──
  function buildToggle() {
    if (document.getElementById('sfxToggle')) return;
    var btn = document.createElement('button');
    btn.id = 'sfxToggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Toggle interactive sound effects');
    btn.setAttribute('aria-pressed', String(enabled));
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">' +
      '<path d="M4 9v6M8 6v12M12 3v18M16 7v10M20 10v4"/>' +
      '<line class="sfx-off-line" x1="2" y1="2" x2="22" y2="22"/>' +
      '</svg>' +
      '<span class="sfx-label">SFX</span>';
    if (enabled) btn.classList.add('sfx-on');
    document.body.appendChild(btn);

    btn.addEventListener('click', function () {
      enabled = !enabled;
      try {
        localStorage.setItem(STORE_KEY, enabled ? '1' : '0');
      } catch (e) {}
      btn.classList.toggle('sfx-on', enabled);
      btn.setAttribute('aria-pressed', String(enabled));
      if (enabled) fxToggle(true);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildToggle);
  } else {
    buildToggle();
  }

  // Public hook (handy for future custom triggers)
  window.CinegmaSFX = {
    hover: fxHover,
    click: fxClick,
    sparkle: fxSparkle,
    cinematic: fxCinematic,
    shutter: fxShutter,
    whoosh: fxWhoosh,
    isEnabled: function () {
      return enabled;
    }
  };
})();
