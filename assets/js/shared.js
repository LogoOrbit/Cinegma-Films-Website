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

// ── MINI GAME: GOLDEN TAKE ──
(function(){
  var POPUP_DELAY=30000;
  var shown=false;

  var facts=[
    'Janjaal was shot in just 34 continuous hours on a beach in Karachi.',
    'Cinegma Films won 14 international awards within its very first year.',
    'The name "Cinegma" fuses Cinema and Enigma — the mystery within every frame.',
    'Janjaal screened at festivals across 9 countries — from Canada to Kosovo.',
    'Syed Asad directed, edited, color-graded and sound-designed Janjaal entirely himself.',
    'Janjaal had a theatrical release at Arena Cinemas, Karachi — January 2025.',
    'Main Aur Achu explores sacrifice and childhood through a boy and his goat on Eid.',
    'Urdu Bazaar Karachi is a documentary capturing the city’s historic literary market.',
    'Cinegma Films handles the full pipeline — from script development to final delivery.',
    'Janjaal stars veteran Pakistani actor Shamoon Abbasi as a cursed police officer.',
    'Cinegma Films was founded in January 2024 in Karachi, Pakistan.',
    'Portrait of Life is a meditation on love, memory, and the art of truly seeing.',
    'Zawaal — meaning "Hour of Decline" — is a psychological thriller in production.',
    'Cinegma Films received 22 official festival selections worldwide in its debut year.',
    'The Toronto Fantasy/Sci-Fi Film Festival awarded Janjaal Best Short Film.'
  ];

  var st=document.createElement('style');
  st.textContent=
    '.cg-toast{position:fixed;bottom:28px;left:28px;z-index:900;background:rgba(14,14,14,.96);border:1px solid rgba(201,165,90,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:22px 26px 20px;max-width:250px;opacity:0;transform:translateY(16px);transition:opacity .5s,transform .5s;font-family:"DM Sans",sans-serif;pointer-events:none;}'+
    '.cg-toast.v{opacity:1;transform:translateY(0);pointer-events:all;}'+
    '.cg-tt{font-family:"Bebas Neue",sans-serif;font-size:1rem;letter-spacing:.18em;color:#c9a55a;display:block;margin-bottom:6px;}'+
    '.cg-td{font-size:.72rem;color:rgba(240,236,228,.5);line-height:1.6;margin:0 0 14px;font-weight:300;}'+
    '.cg-tb{font-family:"Bebas Neue",sans-serif;font-size:.72rem;letter-spacing:.2em;background:0 0;border:1px solid rgba(201,165,90,.35);color:#c9a55a;padding:7px 20px;cursor:pointer;transition:all .3s;}'+
    '.cg-tb:hover{background:#c9a55a;color:#080808;}'+
    '.cg-tx{position:absolute;top:8px;right:12px;background:0 0;border:0;color:rgba(240,236,228,.25);font-size:1.1rem;cursor:pointer;line-height:1;transition:color .2s;}'+
    '.cg-tx:hover{color:rgba(240,236,228,.6);}'+
    '.cg-p{position:fixed;bottom:28px;left:28px;z-index:900;width:290px;background:rgba(14,14,14,.97);border:1px solid rgba(201,165,90,.18);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);font-family:"DM Sans",sans-serif;opacity:0;transform:translateY(14px) scale(.97);transition:opacity .4s,transform .4s;pointer-events:none;}'+
    '.cg-p.v{opacity:1;transform:translateY(0) scale(1);pointer-events:all;}'+
    '.cg-hd{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 10px;border-bottom:1px solid rgba(240,236,228,.07);}'+
    '.cg-ht{font-family:"Bebas Neue",sans-serif;font-size:.85rem;letter-spacing:.2em;color:#c9a55a;}'+
    '.cg-hx{background:0 0;border:0;color:rgba(240,236,228,.25);font-size:1rem;cursor:pointer;line-height:1;padding:0 2px;transition:color .2s;}'+
    '.cg-hx:hover{color:rgba(240,236,228,.6);}'+
    '.cg-bar{display:flex;justify-content:space-between;padding:8px 16px;font-size:.62rem;letter-spacing:.14em;text-transform:uppercase;color:rgba(240,236,228,.45);}'+
    '.cg-ar{position:relative;height:270px;margin:0 12px 12px;border:1px solid rgba(240,236,228,.05);background:rgba(0,0,0,.25);overflow:hidden;cursor:crosshair;transition:border-color .3s;user-select:none;-webkit-user-select:none;}'+
    '.cg-ar.miss{border-color:rgba(200,60,60,.35);}'+
    '.cg-tg{position:absolute;width:42px;height:42px;border-radius:50%;pointer-events:auto;transform:scale(0);opacity:0;transition:transform .15s ease,opacity .15s ease;-webkit-tap-highlight-color:transparent;}'+
    '.cg-tg.on{transform:scale(1);opacity:1;}'+
    '.cg-tg.pop{transform:scale(1.6);opacity:0;transition:transform .2s,opacity .18s;}'+
    '.cg-tg-i{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 35% 35%,#e8d08a,#c9a55a 55%,#9a7028);box-shadow:0 0 22px rgba(201,165,90,.45),0 0 6px rgba(255,220,130,.25) inset;pointer-events:none;}'+
    '.cg-ov{position:absolute;inset:0;background:rgba(8,8,8,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px;opacity:0;pointer-events:none;transition:opacity .5s;}'+
    '.cg-ov.v{opacity:1;pointer-events:all;}'+
    '.cg-ov-t{font-family:"Bebas Neue",sans-serif;font-size:1.3rem;letter-spacing:.14em;color:#c9a55a;margin-bottom:2px;}'+
    '.cg-ov-s{font-family:"Bebas Neue",sans-serif;font-size:2.4rem;color:#f0ece4;letter-spacing:.04em;margin-bottom:18px;line-height:1;}'+
    '.cg-ov-fl{font-size:.54rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(240,236,228,.28);margin-bottom:8px;}'+
    '.cg-ov-f{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:.84rem;color:rgba(240,236,228,.55);line-height:1.7;margin:0 0 18px;max-width:230px;}'+
    '.cg-ov-b{font-family:"Bebas Neue",sans-serif;font-size:.7rem;letter-spacing:.2em;background:0 0;border:1px solid rgba(201,165,90,.35);color:#c9a55a;padding:7px 18px;cursor:pointer;transition:all .3s;}'+
    '.cg-ov-b:hover{background:#c9a55a;color:#080808;}'+
    '.cg-launch{display:inline-flex;align-items:center;gap:8px;background:0 0;border:1px solid rgba(201,165,90,.3);color:#c9a55a;font-family:"Bebas Neue",sans-serif;font-size:.72rem;letter-spacing:.2em;padding:9px 20px;margin:36px auto 0;cursor:pointer;transition:all .3s;}'+
    '.cg-launch:hover{background:#c9a55a;color:#080808;}'+
    '.cg-launch-wrap{width:100%;text-align:center;padding:28px 20px 0;}'+
    '@media(max-width:500px){.cg-toast,.cg-p{left:12px;right:12px;bottom:12px;width:auto;max-width:none;}.cg-ar{height:230px;}.cg-toast{max-width:none;}}';
  document.head.appendChild(st);

  // Auto popup after a fixed delay (unless dismissed earlier this session)
  function dismissed(){
    try{return !!sessionStorage.getItem('cg_off');}catch(e){return false;}
  }
  setTimeout(function(){ if(!dismissed() && !shown && !panel) showToast(); }, POPUP_DELAY);

  // Footer launcher — lets visitors find the game at the end of any page
  function addLauncher(){
    var foot=document.querySelector('footer');
    if(!foot || foot.querySelector('.cg-launch')) return;
    var wrap=document.createElement('div');
    wrap.className='cg-launch-wrap';
    var b=document.createElement('button');
    b.className='cg-launch';
    b.type='button';
    b.innerHTML='🎬 BORED? PLAY GOLDEN TAKE';
    b.onclick=function(){ if(!panel) showPanel(); };
    wrap.appendChild(b);
    foot.appendChild(wrap);
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',addLauncher);
  } else {
    addLauncher();
  }

  function showToast(){
    if(shown)return;
    shown=true;
    var d=document.createElement('div');
    d.className='cg-toast';
    d.innerHTML=
      '<span class="cg-tt">INTERMISSION</span>'+
      '<p class="cg-td">Catch the golden takes before they fade — a quick cinematic challenge.</p>'+
      '<button class="cg-tb">PLAY</button>'+
      '<button class="cg-tx">×</button>';
    document.body.appendChild(d);
    setTimeout(function(){d.classList.add('v');},30);

    d.querySelector('.cg-tb').onclick=function(){
      d.classList.remove('v');
      setTimeout(function(){d.remove();showPanel();},400);
    };
    d.querySelector('.cg-tx').onclick=function(){
      d.classList.remove('v');
      setTimeout(function(){d.remove();},400);
      try{sessionStorage.setItem('cg_off','1');}catch(e){}
    };
  }

  var panel,arena,scoreD,livesD,overD,sc,lv,spd,tTmr,on;

  function showPanel(){
    panel=document.createElement('div');
    panel.className='cg-p';
    panel.innerHTML=
      '<div class="cg-hd"><span class="cg-ht">GOLDEN TAKE</span><button class="cg-hx">×</button></div>'+
      '<div class="cg-bar"><span class="cg-sc">TAKE 0</span><span class="cg-lv">🎞 🎞 🎞</span></div>'+
      '<div class="cg-ar">'+
        '<div class="cg-ov">'+
          '<span class="cg-ov-t">THAT’S A WRAP</span>'+
          '<div class="cg-ov-s">0</div>'+
          '<span class="cg-ov-fl">FROM THE CUTTING ROOM</span>'+
          '<p class="cg-ov-f"></p>'+
          '<button class="cg-ov-b">PLAY AGAIN</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(panel);

    arena=panel.querySelector('.cg-ar');
    scoreD=panel.querySelector('.cg-sc');
    livesD=panel.querySelector('.cg-lv');
    overD=panel.querySelector('.cg-ov');

    panel.querySelector('.cg-hx').onclick=closePanel;
    panel.querySelector('.cg-ov-b').onclick=startGame;

    setTimeout(function(){panel.classList.add('v');startGame();},30);
  }

  function closePanel(){
    clearTimeout(tTmr);on=false;
    panel.classList.remove('v');
    setTimeout(function(){panel.remove();panel=null;},400);
    try{sessionStorage.setItem('cg_off','1');}catch(e){}
  }

  function startGame(){
    sc=0;lv=3;spd=1400;on=true;
    scoreD.textContent='TAKE 0';
    updateLives();
    overD.classList.remove('v');
    var old=arena.querySelectorAll('.cg-tg');
    for(var i=0;i<old.length;i++) old[i].remove();
    setTimeout(spawn,500);
  }

  function updateLives(){
    var s='';
    for(var i=0;i<3;i++){
      if(i) s+=' ';
      s+=(i<lv?'🎞':'✕');
    }
    livesD.textContent=s;
  }

  function spawn(){
    if(!on)return;
    var t=document.createElement('div');
    t.className='cg-tg';
    t.innerHTML='<div class="cg-tg-i"></div>';
    var aw=arena.offsetWidth-48,ah=arena.offsetHeight-48;
    t.style.left=Math.max(4,Math.random()*aw)+'px';
    t.style.top=Math.max(4,Math.random()*ah)+'px';
    arena.insertBefore(t,overD);

    requestAnimationFrame(function(){requestAnimationFrame(function(){t.classList.add('on');});});

    var done=false;
    function hit(e){
      e.stopPropagation();
      if(e.type==='touchstart')e.preventDefault();
      if(!on||done)return;
      done=true;
      clearTimeout(tTmr);
      sc++;
      scoreD.textContent='TAKE '+sc;
      t.classList.remove('on');
      t.classList.add('pop');
      setTimeout(function(){t.remove();spd=Math.max(350,spd-45);setTimeout(spawn,280);},200);
    }
    t.addEventListener('click',hit);
    t.addEventListener('touchstart',hit,{passive:false});

    tTmr=setTimeout(function(){
      if(done)return;
      done=true;
      lv--;
      updateLives();
      t.classList.remove('on');
      arena.classList.add('miss');
      setTimeout(function(){arena.classList.remove('miss');},350);
      setTimeout(function(){
        t.remove();
        if(lv<=0) endGame();
        else setTimeout(spawn,350);
      },200);
    },spd);
  }

  function endGame(){
    on=false;
    clearTimeout(tTmr);
    overD.querySelector('.cg-ov-s').textContent=sc;
    overD.querySelector('.cg-ov-f').textContent=facts[Math.floor(Math.random()*facts.length)];
    setTimeout(function(){overD.classList.add('v');},300);
  }
})();
