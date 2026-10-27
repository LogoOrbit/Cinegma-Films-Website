/* CINEGMA PERF — frame-rate governor.
   Every animation loop on the site (GSAP ticker → Lenis smooth scroll,
   ScrollTrigger, parallax, cursors) runs on requestAnimationFrame, so pacing
   rAF paces them all:
     • capable devices: capped at 60 fps (120/144 Hz panels skip alternate frames)
     • struggling devices, data-saver or slow connections: locked to 30 fps and
       html.perf-lite turns off the costliest effects.
   The device is measured with the real rAF while it loads and while it
   scrolls; the verdict is remembered for a few days so later visits start in
   the right mode. Must load before the GSAP/Lenis scripts (deferred, in order). */
(function () {
  'use strict';
  if (window.__cinegmaPerf) return;
  var w = window, html = document.documentElement;
  var nativeRAF = w.requestAnimationFrame && w.requestAnimationFrame.bind(w);
  if (!nativeRAF) return;

  /* Effects cost: the aurora orbs are already soft radial gradients, so the
     110px blur on top only burned GPU time. Lite mode drops the full-screen
     layers and backdrop blurs, which are the heaviest things to composite. */
  var css = document.createElement('style');
  css.textContent =
    '#v3-aurora i{filter:none!important}' +
    '.perf-lite #v3-aurora,.perf-lite #v3-grain{display:none!important}' +
    '.perf-lite *,.perf-lite *::before,.perf-lite *::after{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}' +
    '.perf-lite .mq-track{animation-duration:calc(var(--dur,90s) * 1.4)!important}' +
    '.perf-lite #hero video{filter:none!important}';
  (document.head || html).appendChild(css);

  var KEY = 'cinegma-perf', DAYS = 3;
  var conn = navigator.connection || {};
  var reasons = [];
  if (conn.saveData) reasons.push('save-data');
  if (/(^|-)2g|3g/.test(conn.effectiveType || '')) reasons.push('slow-network');
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) reasons.push('low-memory');
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) reasons.push('few-cores');

  var stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (stored && Date.now() - stored.t > DAYS * 864e5) stored = null;
  } catch (e) { stored = null; }

  var tier = reasons.length || (stored && stored.tier === 'lite') ? 'lite' : 'full';
  var interval = 0;

  function apply(t, why) {
    tier = t;
    interval = 1000 / (t === 'lite' ? 30 : 60);
    html.classList.toggle('perf-lite', t === 'lite');
    html.classList.toggle('perf-full', t === 'full');
    html.setAttribute('data-fps', t === 'lite' ? '30' : '60');
    try { w.dispatchEvent(new CustomEvent('cinegma:perf', { detail: { tier: t, reason: why } })); } catch (e) {}
  }
  apply(tier, reasons.join(',') || (stored ? 'remembered' : 'default'));

  /* ---- paced rAF: one native pump, callbacks flushed only on allowed frames ---- */
  function rethrow(e) { setTimeout(function () { throw e; }); }
  var queue = [], ids = 0, pumping = 0, lastFlush = 0;
  function pump(now) {
    pumping = 0;
    /* allow ~4ms of jitter so a 60 Hz panel never drops to 30 by accident */
    var elapsed = lastFlush ? now - lastFlush : interval;
    if (elapsed < interval - 4) { pumping = nativeRAF(pump); return; }
    /* keep the cadence aligned so small timing jitter never skips a frame */
    lastFlush = elapsed >= interval && elapsed < interval * 2 ? now - (elapsed - interval) : now;
    var run = queue; queue = [];
    for (var i = 0; i < run.length; i++) {
      try { run[i].cb(now); } catch (err) { rethrow(err); }
    }
    if (queue.length && !pumping) pumping = nativeRAF(pump);
  }
  w.requestAnimationFrame = function (cb) {
    var id = ++ids;
    queue.push({ id: id, cb: cb });
    if (!pumping) pumping = nativeRAF(pump);
    return id;
  };
  w.cancelAnimationFrame = function (id) {
    for (var i = 0; i < queue.length; i++) if (queue[i].id === id) { queue.splice(i, 1); return; }
  };
  w.__cinegmaPerf = {
    get tier() { return tier; },
    get fps() { return tier === 'lite' ? 30 : 60; },
    lite: function () { return tier === 'lite'; }
  };

  /* ---- measurement (native rAF, so we see what the device can really do) ---- */
  if (tier === 'lite') return;
  var sampling = 0, frames = 0, start = 0, prev = 0, slowWindows = 0, windows = 0, longFrames = 0;
  function sample(now) {
    sampling = 0;
    if (document.hidden) { start = prev = 0; return; }
    if (!start) { start = prev = now; frames = longFrames = 0; }
    var dt = now - prev; prev = now; frames++;
    if (dt > 50) longFrames++;
    if (now - start >= 1000) {
      var fps = (frames - 1) * 1000 / (now - start);
      windows++;
      /* below ~45 fps, or several frames over 50ms, means the device is struggling */
      if (fps < 45 || longFrames >= 4) slowWindows++; else slowWindows = Math.max(0, slowWindows - 1);
      start = prev = now; frames = longFrames = 0;
      if (slowWindows >= 2) { downgrade(fps); return; }
    }
    if (active) sampling = nativeRAF(sample);
  }
  var active = false, idleTimer = 0;
  function measure(ms) {
    active = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { active = false; start = prev = 0; }, ms);
    if (!sampling && tier === 'full') sampling = nativeRAF(sample);
  }
  function downgrade(fps) {
    active = false;
    try { localStorage.setItem(KEY, JSON.stringify({ tier: 'lite', t: Date.now(), fps: Math.round(fps) })); } catch (e) {}
    apply('lite', 'measured-' + Math.round(fps) + 'fps');
  }
  /* skip the first moments of load (parsing and image decode are not the
     device's steady state), then watch a few seconds and every scroll burst */
  w.addEventListener('load', function () { setTimeout(function () { measure(6000); }, 1200); });
  w.addEventListener('scroll', function () { if (tier === 'full') measure(1500); }, { passive: true });
  w.addEventListener('wheel', function () { if (tier === 'full') measure(1500); }, { passive: true });
  w.addEventListener('touchmove', function () { if (tier === 'full') measure(1500); }, { passive: true });
})();
