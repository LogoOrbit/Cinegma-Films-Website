(function(){
  'use strict';

  // ── 1. CINEMATIC PAGE TRANSITIONS ──
  // Intercept internal nav clicks and animate a film-style transition
  (function(){
    var overlay = document.createElement('div');
    overlay.id = 'pageTransition';
    overlay.innerHTML =
      '<div class="pt-bar pt-top"></div>' +
      '<div class="pt-bar pt-bottom"></div>' +
      '<div class="pt-flash"></div>';
    document.body.appendChild(overlay);

    function isInternal(href) {
      if (!href) return false;
      if (href.startsWith('#') || href.startsWith('javascript:')) return false;
      try {
        var url = new URL(href, location.origin);
        return url.origin === location.origin && !href.includes('#') && url.pathname !== location.pathname;
      } catch(e) { return false; }
    }

    document.addEventListener('click', function(e) {
      var link = e.target.closest('a');
      if (!link || e.ctrlKey || e.metaKey || e.shiftKey) return;
      var href = link.getAttribute('href');
      if (!isInternal(href)) return;
      e.preventDefault();
      overlay.classList.add('active');
      setTimeout(function(){ window.location.href = href; }, 500);
    });

    // Page enter animation
    window.addEventListener('pageshow', function(e) {
      if (e.persisted) {
        overlay.classList.remove('active');
      }
    });
    // Run enter animation on load
    overlay.classList.add('enter');
    setTimeout(function(){ overlay.classList.remove('enter'); }, 600);
  })();

  // ── 4. PARALLAX DEPTH-OF-FIELD HERO (mousemove on hero) ──
  (function(){
    var hero = document.getElementById('hero');
    if (!hero || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var layers = hero.querySelectorAll('.hero-eyebrow, .hero-title, .hero-sub, .hero-badges, .hero-ctas');
    var depths = [0.02, 0.035, 0.025, 0.015, 0.01];

    hero.addEventListener('mousemove', function(e) {
      var rect = hero.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;

      layers.forEach(function(layer, i) {
        var d = depths[i] || 0.02;
        var tx = x * d * 100;
        var ty = y * d * 100;
        layer.style.transform = 'translateY(0) translate(' + tx + 'px, ' + ty + 'px)';
      });

      // Rack focus effect on video
      var vid = hero.querySelector('.hero-video-wrap video');
      if (vid) {
        var dist = Math.sqrt(x*x + y*y);
        var blur = dist * 3;
        vid.style.filter = 'blur(' + blur + 'px)';
        vid.style.transition = 'filter 0.3s ease';
      }
    });

    hero.addEventListener('mouseleave', function() {
      layers.forEach(function(layer) {
        layer.style.transform = 'translateY(0)';
        layer.style.transition = 'transform 0.4s ease';
      });
      var vid = hero.querySelector('.hero-video-wrap video');
      if (vid) vid.style.filter = '';
    });
  })();

  // ── 5. SOUND DESIGN LAYER ──
  (function(){
    if (window.matchMedia('(hover:none)').matches) return;

    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    var ctx = null;
    var masterGain = null;
    var muted = true;
    var initialized = false;
    var activeOsc = [];

    function initAudio() {
      if (initialized) return;
      initialized = true;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(ctx.destination);
    }

    function createDrone(freq, vol) {
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = vol;
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start();
      activeOsc.push({ osc: osc, gain: gain });
      return { osc: osc, gain: gain };
    }

    function startAmbience() {
      createDrone(55, 0.06);
      createDrone(82.5, 0.03);
      createDrone(110, 0.015);
      // Subtle noise (projector hum simulation)
      var bufSize = 2 * ctx.sampleRate;
      var buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      var output = buf.getChannelData(0);
      for (var i = 0; i < bufSize; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.008;
      }
      var noise = ctx.createBufferSource();
      noise.buffer = buf;
      noise.loop = true;
      var noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.value = 200;
      var noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.4;
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start();
    }

    // Sound toggle button (boom mic icon)
    var btn = document.createElement('button');
    btn.id = 'soundToggle';
    btn.setAttribute('aria-label', 'Toggle ambient sound');
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5">' +
        '<path d="M12 1v22M8 4l-4 4H1v8h3l4 4V4z"/>' +
        '<line class="sound-off-line" x1="23" y1="1" x2="17" y2="7"/>' +
        '<line class="sound-off-line" x1="17" y1="1" x2="23" y2="7"/>' +
      '</svg>' +
      '<span class="sound-label">Ambience</span>';
    document.body.appendChild(btn);

    btn.addEventListener('click', function() {
      initAudio();
      if (muted) {
        if (ctx.state === 'suspended') ctx.resume();
        if (activeOsc.length === 0) startAmbience();
        masterGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
        muted = false;
        btn.classList.add('sound-on');
      } else {
        masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
        muted = true;
        btn.classList.remove('sound-on');
      }
    });

    // Modulate sound based on scroll position (section awareness)
    var sections = document.querySelectorAll('section[id]');
    if (sections.length > 0) {
      window.addEventListener('scroll', function() {
        if (muted || !ctx || activeOsc.length === 0) return;
        var scrollP = window.scrollY / (document.body.scrollHeight - window.innerHeight);
        // Subtle pitch shift based on scroll
        activeOsc.forEach(function(o, i) {
          var baseFreq = [55, 82.5, 110][i] || 55;
          var shift = scrollP * 8;
          o.osc.frequency.linearRampToValueAtTime(baseFreq + shift, ctx.currentTime + 0.3);
        });
      }, {passive: true});
    }
  })();

  // ── 6. COLOR GRADE SWITCHER ──
  (function(){
    var grades = {
      cinematic: {
        label: 'Cinematic',
        grain: 0.03,
        vars: {}  // default
      },
      teal: {
        label: 'Blockbuster',
        grain: 0.04,
        vars: {
          '--grade-filter': 'sepia(0.15) saturate(1.3) hue-rotate(-10deg)',
          '--grade-vignette': 'rgba(0,30,40,.3)'
        }
      },
      noir: {
        label: 'Noir',
        grain: 0.06,
        vars: {
          '--grade-filter': 'grayscale(1) contrast(1.2) brightness(0.95)',
          '--grade-vignette': 'rgba(0,0,0,.45)'
        }
      },
      arthouse: {
        label: 'Art House',
        grain: 0.05,
        vars: {
          '--grade-filter': 'saturate(0.5) contrast(1.1) brightness(0.92)',
          '--grade-vignette': 'rgba(10,5,0,.35)'
        }
      }
    };

    var currentGrade = 'cinematic';

    var switcher = document.createElement('div');
    switcher.id = 'gradeSwitcher';
    switcher.innerHTML =
      '<button class="gs-toggle" aria-label="Color grade switcher">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 0 0 20c-3 0-5-4.5-5-10s2-10 5-10z"/>' +
        '</svg>' +
      '</button>' +
      '<div class="gs-panel">' +
        '<span class="gs-title">Color Grade</span>' +
        '<div class="gs-options"></div>' +
      '</div>';
    document.body.appendChild(switcher);

    var optionsEl = switcher.querySelector('.gs-options');
    Object.keys(grades).forEach(function(key) {
      var btn = document.createElement('button');
      btn.className = 'gs-option' + (key === 'cinematic' ? ' active' : '');
      btn.dataset.grade = key;
      btn.textContent = grades[key].label;
      btn.addEventListener('click', function() {
        applyGrade(key);
        optionsEl.querySelectorAll('.gs-option').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
      optionsEl.appendChild(btn);
    });

    switcher.querySelector('.gs-toggle').addEventListener('click', function() {
      switcher.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (!e.target.closest('#gradeSwitcher')) switcher.classList.remove('open');
    });

    function applyGrade(key) {
      currentGrade = key;
      var grade = grades[key];
      var root = document.documentElement;

      // Reset
      root.style.removeProperty('--grade-filter');
      root.style.removeProperty('--grade-vignette');
      root.style.removeProperty('--grade-grain');

      if (grade.vars) {
        Object.keys(grade.vars).forEach(function(prop) {
          root.style.setProperty(prop, grade.vars[prop]);
        });
      }
      root.style.setProperty('--grade-grain', grade.grain);

      // Apply filter to main content
      document.body.dataset.grade = key;
    }
  })();

  // ── 9. CURSOR SPOTLIGHT ON LAURELS ──
  (function(){
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var targets = document.querySelectorAll('#laurels-wall, #award-wall, .laurels-grid, .aw-grid');
    if (!targets.length) return;

    targets.forEach(function(section) {
      var spotlight = document.createElement('div');
      spotlight.className = 'cursor-spotlight';
      section.style.position = 'relative';
      section.appendChild(spotlight);

      section.addEventListener('mouseenter', function() {
        spotlight.classList.add('active');
      });

      section.addEventListener('mousemove', function(e) {
        var rect = section.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        spotlight.style.setProperty('--spot-x', x + 'px');
        spotlight.style.setProperty('--spot-y', y + 'px');
      });

      section.addEventListener('mouseleave', function() {
        spotlight.classList.remove('active');
      });
    });
  })();


})();
