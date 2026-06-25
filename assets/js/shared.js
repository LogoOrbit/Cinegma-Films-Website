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

// ── MINI GAME: CUT! (STACKING GAME) ──
(function(){
  var POPUP_DELAY=30000,shown=false;
  var facts=[
    'Janjaal was shot in just 34 continuous hours on a beach in Karachi.',
    'Cinegma Films won 14 international awards within its very first year.',
    'The name "Cinegma" fuses Cinema and Enigma — the mystery within every frame.',
    'Janjaal screened at festivals across 9 countries — from Canada to Kosovo.',
    'Syed Asad directed, edited, color-graded and sound-designed Janjaal entirely himself.',
    'Janjaal had a theatrical release at Arena Cinemas, Karachi — January 2025.',
    'Main Aur Achu explores sacrifice and childhood through a boy and his goat on Eid.',
    'Urdu Bazaar Karachi is a documentary capturing the city\'s historic literary market.',
    'Cinegma Films handles the full pipeline — from script development to final delivery.',
    'Janjaal stars veteran Pakistani actor Shamoon Abbasi as a cursed police officer.',
    'Cinegma Films was founded in January 2024 in Karachi, Pakistan.',
    'Portrait of Life is a meditation on love, memory, and the art of truly seeing.',
    'Zawaal — meaning "Hour of Decline" — is a psychological thriller in production.',
    'Cinegma Films received 22 official festival selections worldwide in its debut year.',
    'The Toronto Fantasy/Sci-Fi Film Festival awarded Janjaal Best Short Film.'
  ];

  var BH=26,PERF=6,SPD0=2,SPD_G=0.13,SPD_MX=7,STW=140;

  var st=document.createElement('style');
  st.textContent=
    '.cg-bd{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.78);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .4s;pointer-events:none;}'+
    '.cg-bd.v{opacity:1;pointer-events:all;}'+
    '.cg-modal{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.95);width:480px;max-width:92vw;background:#0e0e0e;border:1px solid rgba(255,127,17,.22);transition:transform .4s cubic-bezier(.2,.9,.3,1);box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 40px rgba(255,127,17,.08);}'+
    '.cg-bd.v .cg-modal{transform:translate(-50%,-50%) scale(1);}'+
    '.cg-mhd{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(240,236,228,.08);}'+
    '.cg-mtl{font-family:"Bebas Neue",sans-serif;font-size:1.2rem;letter-spacing:.22em;color:#ff7f11;}'+
    '.cg-msc{font-family:"Bebas Neue",sans-serif;font-size:.9rem;letter-spacing:.15em;color:#f0ece4;flex:1;text-align:center;}'+
    '.cg-mcl{background:0 0;border:0;color:rgba(240,236,228,.3);font-size:1.3rem;cursor:pointer;line-height:1;padding:0 4px;transition:color .2s;}'+
    '.cg-mcl:hover{color:rgba(240,236,228,.7);}'+
    '.cg-arn{position:relative;height:460px;background:linear-gradient(180deg,#0a0a0a 0%,#111 100%);overflow:hidden;cursor:pointer;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;}'+
    '.cg-arn.shake{animation:cgShk .12s ease-out;}'+
    '@keyframes cgShk{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}'+
    '.cg-stk{position:absolute;bottom:0;left:0;right:0;height:100%;transition:transform .18s ease-out;}'+
    '.cg-blk{position:absolute;height:'+BH+'px;border-radius:2px;box-sizing:border-box;border-top:1px solid rgba(255,255,255,.08);}'+
    '.cg-sld{position:absolute;height:'+BH+'px;border-radius:2px;z-index:2;box-shadow:0 0 18px rgba(255,127,17,.3);}'+
    '.cg-slc{position:absolute;height:'+BH+'px;border-radius:2px;z-index:1;opacity:1;pointer-events:none;}'+
    '.cg-slc.fall{animation:cgFall .55s ease-in forwards;}'+
    '@keyframes cgFall{0%{opacity:.8;transform:translateY(0) rotate(0)}100%{opacity:0;transform:translateY(200px) rotate(18deg)}}'+
    '.cg-sld.miss{transition:transform .45s ease-in,opacity .45s;transform:translateY(200px);opacity:0;}'+
    '.cg-prf{position:absolute;left:50%;z-index:10;font-family:"Bebas Neue",sans-serif;color:#ff7f11;pointer-events:none;opacity:0;animation:cgPUp .85s ease-out forwards;text-shadow:0 0 20px rgba(255,127,17,.5);}'+
    '@keyframes cgPUp{0%{opacity:1;transform:translate(-50%,0) scale(.8)}30%{opacity:1;transform:translate(-50%,-10px) scale(1.15)}100%{opacity:0;transform:translate(-50%,-50px) scale(1)}}'+
    '.cg-cmb{position:absolute;left:50%;z-index:10;font-family:"Bebas Neue",sans-serif;font-size:.7rem;letter-spacing:.18em;color:rgba(240,236,228,.55);pointer-events:none;opacity:0;animation:cgCUp .65s ease-out forwards;}'+
    '@keyframes cgCUp{0%{opacity:0;transform:translate(-50%,0)}20%{opacity:1;transform:translate(-50%,-5px)}100%{opacity:0;transform:translate(-50%,-30px)}}'+
    '.cg-ptc{position:absolute;width:4px;height:4px;border-radius:50%;pointer-events:none;z-index:10;opacity:0;animation:cgPtc .65s ease-out forwards;}'+
    '@keyframes cgPtc{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(0)}}'+
    '.cg-glow{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#ff7f11,transparent);z-index:5;pointer-events:none;opacity:0;animation:cgGlow .5s ease-out forwards;}'+
    '@keyframes cgGlow{0%{opacity:1;transform:scaleX(.3)}30%{opacity:1;transform:scaleX(1)}100%{opacity:0;transform:scaleX(1.2)}}'+
    '.cg-str{position:absolute;inset:0;z-index:20;background:rgba(10,10,10,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:opacity .3s;}'+
    '.cg-str.h{opacity:0;pointer-events:none;}'+
    '.cg-str-t{font-family:"Bebas Neue",sans-serif;font-size:3rem;letter-spacing:.12em;color:#ff7f11;margin-bottom:6px;text-shadow:0 0 30px rgba(255,127,17,.3);}'+
    '.cg-str-s{font-family:"DM Sans",sans-serif;font-size:.68rem;letter-spacing:.18em;color:rgba(240,236,228,.3);text-transform:uppercase;}'+
    '.cg-str-h{font-family:"DM Sans",sans-serif;font-size:.6rem;letter-spacing:.12em;color:rgba(255,127,17,.35);margin-top:24px;text-transform:uppercase;}'+
    '.cg-ov{position:absolute;inset:0;z-index:20;background:rgba(10,10,10,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px 24px;opacity:0;pointer-events:none;transition:opacity .5s;}'+
    '.cg-ov.v{opacity:1;pointer-events:all;}'+
    '.cg-ov-t{font-family:"Bebas Neue",sans-serif;font-size:1.6rem;letter-spacing:.16em;color:#ff7f11;margin-bottom:4px;}'+
    '.cg-ov-s{font-family:"Bebas Neue",sans-serif;font-size:3.6rem;color:#f0ece4;letter-spacing:.04em;margin-bottom:6px;line-height:1;}'+
    '.cg-ov-hi{font-family:"DM Sans",sans-serif;font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,127,17,.5);margin-bottom:20px;}'+
    '.cg-ov-fl{font-size:.56rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(240,236,228,.25);margin-bottom:10px;}'+
    '.cg-ov-f{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:.92rem;color:rgba(240,236,228,.55);line-height:1.7;margin:0 0 24px;max-width:320px;}'+
    '.cg-ov-b{font-family:"Bebas Neue",sans-serif;font-size:.78rem;letter-spacing:.22em;background:0 0;border:1px solid rgba(255,127,17,.35);color:#ff7f11;padding:10px 28px;cursor:pointer;transition:all .3s;}'+
    '.cg-ov-b:hover{background:#ff7f11;color:#080808;}'+
    '.cg-toast{position:fixed;bottom:28px;left:28px;z-index:9000;background:rgba(14,14,14,.96);border:1px solid rgba(255,127,17,.22);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:24px 28px 22px;max-width:280px;opacity:0;transform:translateY(16px);transition:opacity .5s,transform .5s;font-family:"DM Sans",sans-serif;pointer-events:none;}'+
    '.cg-toast.v{opacity:1;transform:translateY(0);pointer-events:all;}'+
    '.cg-tt{font-family:"Bebas Neue",sans-serif;font-size:1.05rem;letter-spacing:.18em;color:#ff7f11;display:block;margin-bottom:8px;}'+
    '.cg-td{font-size:.74rem;color:rgba(240,236,228,.5);line-height:1.6;margin:0 0 16px;font-weight:300;}'+
    '.cg-tb{font-family:"Bebas Neue",sans-serif;font-size:.74rem;letter-spacing:.2em;background:0 0;border:1px solid rgba(255,127,17,.35);color:#ff7f11;padding:8px 22px;cursor:pointer;transition:all .3s;}'+
    '.cg-tb:hover{background:#ff7f11;color:#080808;}'+
    '.cg-tx{position:absolute;top:8px;right:12px;background:0 0;border:0;color:rgba(240,236,228,.25);font-size:1.1rem;cursor:pointer;line-height:1;transition:color .2s;}'+
    '.cg-tx:hover{color:rgba(240,236,228,.6);}'+
    '.cg-launch{display:inline-flex;align-items:center;gap:8px;background:0 0;border:1px solid rgba(255,127,17,.3);color:#ff7f11;font-family:"Bebas Neue",sans-serif;font-size:.74rem;letter-spacing:.2em;padding:10px 24px;margin:36px auto 0;cursor:pointer;transition:all .3s;}'+
    '.cg-launch:hover{background:#ff7f11;color:#080808;}'+
    '.cg-launch-wrap{width:100%;text-align:center;padding:28px 20px 0;}'+
    '@media(max-width:500px){.cg-toast{left:12px;right:12px;bottom:12px;max-width:none;}.cg-modal{width:96vw;max-width:96vw;}.cg-arn{height:380px;}}';
  document.head.appendChild(st);

  var bd,arena,stkEl,scoreEl,startOv,overOv,factEl,scoreEndEl,hiEndEl;
  var stack,slX,slW,slLv,slEl,spd,dir,sc,cmb,run,raf,camY,hi;

  try{hi=parseInt(sessionStorage.getItem('cg_hi'),10)||0;}catch(e){hi=0;}
  function dismissed(){try{return !!sessionStorage.getItem('cg_off');}catch(e){return false;}}

  setTimeout(function(){if(!dismissed()&&!shown&&!bd) showToast();},POPUP_DELAY);

  function addLauncher(){
    var foot=document.querySelector('footer');
    if(!foot||foot.querySelector('.cg-launch')) return;
    var wrap=document.createElement('div');
    wrap.className='cg-launch-wrap';
    var b=document.createElement('button');
    b.className='cg-launch';
    b.type='button';
    b.innerHTML='🎬 BORED? PLAY CUT!';
    b.onclick=function(){if(!bd) showGame();};
    wrap.appendChild(b);
    foot.appendChild(wrap);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addLauncher);
  else addLauncher();

  function showToast(){
    if(shown) return;
    shown=true;
    var d=document.createElement('div');
    d.className='cg-toast';
    d.innerHTML=
      '<span class="cg-tt">INTERMISSION</span>'+
      '<p class="cg-td">Stack the blocks, keep your cuts sharp — a quick cinematic challenge.</p>'+
      '<button class="cg-tb">PLAY CUT!</button>'+
      '<button class="cg-tx">×</button>';
    document.body.appendChild(d);
    setTimeout(function(){d.classList.add('v');},30);
    d.querySelector('.cg-tb').onclick=function(){
      d.classList.remove('v');
      setTimeout(function(){d.remove();showGame();},400);
    };
    d.querySelector('.cg-tx').onclick=function(){
      d.classList.remove('v');
      setTimeout(function(){d.remove();},400);
      try{sessionStorage.setItem('cg_off','1');}catch(e){}
    };
  }

  function showGame(){
    if(bd) return;
    document.body.style.overflow='hidden';
    bd=document.createElement('div');
    bd.className='cg-bd';
    bd.innerHTML=
      '<div class="cg-modal">'+
        '<div class="cg-mhd">'+
          '<span class="cg-mtl">CUT!</span>'+
          '<span class="cg-msc">SCORE: 0</span>'+
          '<button class="cg-mcl">×</button>'+
        '</div>'+
        '<div class="cg-arn">'+
          '<div class="cg-stk"></div>'+
          '<div class="cg-str">'+
            '<div class="cg-str-t">CUT!</div>'+
            '<div class="cg-str-s">TAP ANYWHERE TO DROP</div>'+
            (hi>0?'<div class="cg-str-h">BEST: '+hi+'</div>':'')+
          '</div>'+
          '<div class="cg-ov">'+
            '<span class="cg-ov-t">THAT\'S A WRAP</span>'+
            '<div class="cg-ov-s">0</div>'+
            '<div class="cg-ov-hi"></div>'+
            '<span class="cg-ov-fl">FROM THE CUTTING ROOM</span>'+
            '<p class="cg-ov-f"></p>'+
            '<button class="cg-ov-b">PLAY AGAIN</button>'+
          '</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(bd);

    arena=bd.querySelector('.cg-arn');
    stkEl=bd.querySelector('.cg-stk');
    scoreEl=bd.querySelector('.cg-msc');
    startOv=bd.querySelector('.cg-str');
    overOv=bd.querySelector('.cg-ov');
    factEl=bd.querySelector('.cg-ov-f');
    scoreEndEl=bd.querySelector('.cg-ov-s');
    hiEndEl=bd.querySelector('.cg-ov-hi');

    bd.querySelector('.cg-mcl').onclick=closeGame;
    bd.querySelector('.cg-ov-b').onclick=function(e){e.stopPropagation();startRound();};

    arena.addEventListener('click',handleTap);
    arena.addEventListener('touchstart',function(e){e.preventDefault();handleTap(e);},{passive:false});
    bd.addEventListener('click',function(e){if(e.target===bd) closeGame();});

    setTimeout(function(){bd.classList.add('v');},30);
  }

  function closeGame(){
    run=false;
    if(raf) cancelAnimationFrame(raf);
    bd.classList.remove('v');
    document.body.style.overflow='';
    setTimeout(function(){if(bd){bd.remove();bd=null;}},400);
    try{sessionStorage.setItem('cg_off','1');}catch(e){}
  }

  function handleTap(e){
    if(overOv.classList.contains('v')) return;
    if(!startOv.classList.contains('h')){startRound();return;}
    if(run&&slEl) drop();
  }

  function startRound(){
    stack=[];sc=0;cmb=0;spd=SPD0;dir=1;run=true;camY=0;
    scoreEl.textContent='SCORE: 0';
    startOv.classList.add('h');
    overOv.classList.remove('v');
    stkEl.innerHTML='';
    stkEl.style.transform='';
    var old=arena.querySelectorAll('.cg-slc,.cg-prf,.cg-cmb,.cg-ptc,.cg-glow,.cg-sld');
    for(var i=0;i<old.length;i++) old[i].remove();

    var aw=arena.offsetWidth;
    var w=Math.min(STW,aw*0.38);
    var fx=(aw-w)/2;
    var blk=mkBlk(fx,0,w,bclr(0));
    stkEl.appendChild(blk);
    stack.push({x:fx,w:w,el:blk});
    setTimeout(spawnSl,300);
  }

  function mkBlk(x,lv,w,clr){
    var el=document.createElement('div');
    el.className='cg-blk';
    el.style.left=x+'px';
    el.style.bottom=(lv*BH)+'px';
    el.style.width=w+'px';
    el.style.background=clr;
    return el;
  }

  function bclr(n){
    var t=Math.min(n/20,1);
    return 'hsl('+(38+t*7)+','+(12+t*60)+'%,'+(20+t*32)+'%)';
  }

  function spawnSl(){
    if(!run) return;
    var top=stack[stack.length-1];
    var aw=arena.offsetWidth;
    var lv=stack.length;
    slW=top.w;slLv=lv;
    slX=dir>0?0:aw-slW;

    slEl=document.createElement('div');
    slEl.className='cg-sld';
    slEl.style.width=slW+'px';
    slEl.style.bottom=(lv*BH)+'px';
    slEl.style.background=bclr(lv);
    slEl.style.left=slX+'px';
    stkEl.appendChild(slEl);
    raf=requestAnimationFrame(loop);
  }

  function loop(){
    if(!run) return;
    var aw=arena.offsetWidth;
    slX+=spd*dir;
    if(slX+slW>aw){slX=aw-slW;dir*=-1;}
    else if(slX<0){slX=0;dir*=-1;}
    slEl.style.left=slX+'px';
    raf=requestAnimationFrame(loop);
  }

  function drop(){
    if(!run||!slEl) return;
    cancelAnimationFrame(raf);
    var top=stack[stack.length-1];
    var oS=Math.max(slX,top.x),oE=Math.min(slX+slW,top.x+top.w),ov=oE-oS;

    if(ov<=0){
      slEl.classList.add('miss');run=false;slEl=null;
      setTimeout(endGame,350);return;
    }

    var perfect=Math.abs(slW-ov)<PERF;
    var nx,nw;
    if(perfect){
      nx=top.x;nw=top.w;cmb++;sc+=1+cmb;
    } else {
      nx=oS;nw=ov;
      var scX,scW;
      if(slX<top.x){scX=slX;scW=top.x-slX;}
      else{scX=oE;scW=(slX+slW)-oE;}
      if(scW>1) sliceFx(scX,slLv,scW,bclr(slLv));
      cmb=0;sc++;
    }

    scoreEl.textContent='SCORE: '+sc;
    slEl.remove();slEl=null;

    var blk=mkBlk(nx,slLv,nw,bclr(slLv));
    stkEl.appendChild(blk);
    stack.push({x:nx,w:nw,el:blk});

    shakeFx();
    if(perfect) perfFx();
    layoutCam();
    spd=Math.min(SPD_MX,spd+SPD_G);
    dir=Math.random()>0.5?1:-1;

    if(nw<4){run=false;setTimeout(endGame,300);return;}
    setTimeout(spawnSl,200);
  }

  function layoutCam(){
    var ah=arena.offsetHeight;
    camY=Math.max(0,(stack.length+1)*BH-ah*0.65);
    stkEl.style.transform='translateY('+camY+'px)';
  }

  function perfFx(){
    var t=document.createElement('div');
    t.className='cg-prf';
    var msgs=['PERFECT!','GREAT!','AMAZING!','INCREDIBLE!','LEGENDARY!'];
    t.textContent=msgs[Math.min(cmb-1,msgs.length-1)];
    t.style.fontSize=(1.1+Math.min(cmb,5)*0.15)+'rem';
    t.style.top='35%';
    arena.appendChild(t);
    setTimeout(function(){t.remove();},850);

    if(cmb>1){
      var c=document.createElement('div');
      c.className='cg-cmb';
      c.textContent='COMBO ×'+cmb;
      c.style.top='44%';
      arena.appendChild(c);
      setTimeout(function(){c.remove();},650);
    }

    var g=document.createElement('div');
    g.className='cg-glow';
    g.style.bottom=(stack.length*BH-camY)+'px';
    arena.appendChild(g);
    setTimeout(function(){g.remove();},500);

    var cnt=6+Math.min(cmb,4)*2,aw=arena.offsetWidth;
    for(var i=0;i<cnt;i++){
      var p=document.createElement('div');
      p.className='cg-ptc';
      p.style.left=(aw/2+(Math.random()-.5)*80)+'px';
      p.style.top='40%';
      p.style.background=Math.random()>0.4?'#ff7f11':'#f0ece4';
      var a=Math.random()*Math.PI*2,d=30+Math.random()*70;
      p.style.setProperty('--dx',(Math.cos(a)*d)+'px');
      p.style.setProperty('--dy',(Math.sin(a)*d)+'px');
      arena.appendChild(p);
      (function(el){setTimeout(function(){el.remove();},700);})(p);
    }
  }

  function sliceFx(x,lv,w,clr){
    var el=document.createElement('div');
    el.className='cg-slc';
    el.style.left=x+'px';
    el.style.bottom=(lv*BH)+'px';
    el.style.width=w+'px';
    el.style.background=clr;
    stkEl.appendChild(el);
    requestAnimationFrame(function(){el.classList.add('fall');});
    setTimeout(function(){el.remove();},600);
  }

  function shakeFx(){
    arena.classList.remove('shake');
    void arena.offsetWidth;
    arena.classList.add('shake');
    setTimeout(function(){arena.classList.remove('shake');},150);
  }

  function endGame(){
    run=false;
    if(raf) cancelAnimationFrame(raf);
    if(sc>hi){hi=sc;try{sessionStorage.setItem('cg_hi',hi);}catch(e){}}
    scoreEndEl.textContent=sc;
    hiEndEl.textContent=sc>=hi&&sc>0?'NEW BEST!':'BEST: '+hi;
    factEl.textContent=facts[Math.floor(Math.random()*facts.length)];
    setTimeout(function(){overOv.classList.add('v');},350);
  }
})();
