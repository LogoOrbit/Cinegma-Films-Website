(function(){
  'use strict';

  // ── NAV: set active link based on current page ──
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(function(a){
    var href = a.getAttribute('href');
    if(href === page || (page === '' && href === 'index.html')){
      a.classList.add('active');
    }
  });

  // ── CUSTOM CURSOR ──
  var c = document.getElementById('cursor');
  var r = document.getElementById('cursorRing');
  if(c && r && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.body.classList.add('custom-cursor-ready');
    var mx=0, my=0, rx=0, ry=0;
    document.addEventListener('mousemove', function(e){
      mx=e.clientX; my=e.clientY;
      c.style.left=mx+'px'; c.style.top=my+'px';
    });
    (function loop(){
      rx+=(mx-rx)*.12; ry+=(my-ry)*.12;
      r.style.left=rx+'px'; r.style.top=ry+'px';
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,.film-card,.nav-logo').forEach(function(el){
      el.addEventListener('mouseenter', function(){ c.classList.add('hovering'); r.classList.add('hovering'); });
      el.addEventListener('mouseleave', function(){ c.classList.remove('hovering'); r.classList.remove('hovering'); });
    });
  }

  // ── SCROLL REVEAL ──
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){
        e.target.classList.add('visible');
        obs.unobserve(e.target);
      }
    });
  }, {threshold:0.08, rootMargin:'0px 0px -40px 0px'});
  document.querySelectorAll('.reveal').forEach(function(el){ obs.observe(el); });

  // ── MOBILE MENU ──
  window.openMenu = function(){
    var m = document.getElementById('mobileMenu');
    var h = document.getElementById('hamburger');
    if(m) m.classList.add('open');
    if(h) h.setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
  };
  window.closeMenu = function(){
    var m = document.getElementById('mobileMenu');
    var h = document.getElementById('hamburger');
    if(m) m.classList.remove('open');
    if(h) h.setAttribute('aria-expanded','false');
    document.body.style.overflow='';
  };
  document.addEventListener('keydown', function(e){ if(e.key==='Escape') closeMenu(); });

  // ── BACK TO TOP ──
  var btt = document.getElementById('backToTop');
  if(btt){
    window.addEventListener('scroll', function(){
      btt.classList.toggle('visible', window.scrollY > 400);
    }, {passive:true});
  }

  // ── HERO PARALLAX (parameterized) ──
  window.initHeroParallax = function(imgId, containerId, multiplier, scale){
    var img = document.getElementById(imgId);
    var container = document.getElementById(containerId);
    if(!img || !container) return;
    function update(){
      var y = window.scrollY, h = container.offsetHeight;
      if(y < h) img.style.transform = 'scale('+scale+') translateY('+(y*multiplier)+'px)';
    }
    window.addEventListener('scroll', update, {passive:true});
    update();
  };
})();
