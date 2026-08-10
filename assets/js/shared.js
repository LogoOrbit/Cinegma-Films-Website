(function(){
  'use strict';

  // ── LOAD SITE TRACKER (once — some pages already include it directly) ──
  if(!document.querySelector('script[src*="tracker.js"]')){
    var ts=document.createElement('script');
    ts.src=(location.pathname.indexOf('/projects/')>=0||location.pathname.indexOf('/team/')>=0?'../':'')+'assets/js/tracker.js';
    ts.defer=true;document.head.appendChild(ts);
  }

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
  // Every page ships the same drawer: <nav id="mmenu"> toggled by body.menu-open
  // and #burger. (A handful of older pages also carry #mobileMenu/#hamburger,
  // so both shapes are handled here.)
  function setMenu(open){
    var m = document.getElementById('mobileMenu');
    var h = document.getElementById('hamburger') || document.getElementById('burger');
    var mm = document.getElementById('mmenu');
    if(m) m.classList.toggle('open', open);
    if(mm) mm.setAttribute('aria-hidden', open ? 'false' : 'true');
    document.body.classList.toggle('menu-open', open);
    if(h) h.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  window.openMenu  = function(){ setMenu(true); };
  window.closeMenu = function(){ setMenu(false); };

  var mmenuEl = document.getElementById('mmenu');
  if(mmenuEl && !mmenuEl.hasAttribute('aria-hidden')) mmenuEl.setAttribute('aria-hidden','true');

  document.addEventListener('keydown', function(e){
    if(e.key !== 'Escape') return;
    if(!document.body.classList.contains('menu-open') &&
       !(document.getElementById('mobileMenu')||{classList:{contains:function(){return false;}}}).classList.contains('open')) return;
    window.closeMenu();
    var b = document.getElementById('burger') || document.getElementById('hamburger');
    if(b && b.focus) b.focus();
  });

  // Keep aria-hidden in step with the per-page burger handlers, which only
  // toggle body.menu-open.
  if(mmenuEl && 'MutationObserver' in window){
    new MutationObserver(function(){
      mmenuEl.setAttribute('aria-hidden', document.body.classList.contains('menu-open') ? 'false' : 'true');
    }).observe(document.body, {attributes:true, attributeFilter:['class']});
  }

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

// ── MINI GAME: PAC-MAN (CINE ARCADE) ──
// Opt-in only. It used to slide a chip into the corner unprompted after 30s
// and sit as a pill in the nav next to the primary CTA; both interrupted the
// work the page is meant to be showing. The way in is now the quiet footer
// link and the entry at the bottom of the mobile menu.
(function(){
  'use strict';
  var TOUCH=('ontouchstart' in window)||(navigator.maxTouchPoints>0);

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

  // maze: # wall, . pellet, o power pellet, - ghost door, space = open floor
  var MAP=[
    '###################',
    '#........#........#',
    '#o##.###.#.###.##o#',
    '#.................#',
    '#.##.#.#####.#.##.#',
    '#....#...#...#....#',
    '####.###.#.###.####',
    '####.#.......#.####',
    '####.#.##-##.#.####',
    '    ...#   #...    ',
    '####.#.#####.#.####',
    '####.#.......#.####',
    '####.###.#.###.####',
    '#........#........#',
    '#.##.###.#.###.##.#',
    '#o.#..... .....#.o#',
    '##.#.#.#####.#.#.##',
    '#....#...#...#....#',
    '#.######.#.######.#',
    '#.................#',
    '###################'
  ];
  var COLS=19,ROWS=21,TUN=9;
  var DIRS=[{x:0,y:-1},{x:-1,y:0},{x:0,y:1},{x:1,y:0}]; // up,left,down,right
  var GC=['#ff4d4d','#ff9ddb','#4fd8ff','#ffb54d'];
  var SCAT=[{x:17,y:1},{x:1,y:1},{x:17,y:19},{x:1,y:19}];
  var PAC_X=9,PAC_Y=15,EXIT={x:9,y:7};
  var GSTART=[{x:9,y:7},{x:9,y:9},{x:8,y:9},{x:10,y:9}];
  var GWAIT=[0,1.5,4.5,7.5];
  var MODE_T=[7,20,7,20,5,25,5,99999];

  var st=document.createElement('style');
  st.textContent=
    '.cg-bd{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);opacity:0;transition:opacity .4s;pointer-events:none;}'+
    '.cg-bd.v{opacity:1;pointer-events:all;}'+
    '.cg-modal{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) scale(.95);max-width:96vw;background:#0e0e0e;border:1px solid rgba(255,255,255,.22);transition:transform .4s cubic-bezier(.2,.9,.3,1);box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 40px rgba(255,255,255,.08);}'+
    '.cg-bd.v .cg-modal{transform:translate(-50%,-50%) scale(1);}'+
    '.cg-mhd{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(240,236,228,.08);gap:10px;}'+
    '.cg-mtl{font-family:"Bebas Neue",sans-serif;font-size:1.1rem;letter-spacing:.2em;color:#ffd23f;}'+
    '.cg-msc{font-family:"Bebas Neue",sans-serif;font-size:.86rem;letter-spacing:.14em;color:#f0ece4;flex:1;text-align:center;white-space:nowrap;}'+
    '.cg-mlv{font-size:.6rem;color:#ffd23f;letter-spacing:.3em;white-space:nowrap;}'+
    '.cg-mcl{background:0 0;border:0;color:rgba(240,236,228,.3);font-size:1.3rem;cursor:pointer;line-height:1;padding:0 4px;transition:color .2s;}'+
    '.cg-mcl:hover{color:rgba(240,236,228,.7);}'+
    '.cg-arn{position:relative;background:#05050a;line-height:0;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;touch-action:none;overflow:hidden;}'+
    '.cg-arn canvas{display:block;margin:0 auto;}'+
    '.cg-str{position:absolute;inset:0;z-index:20;background:rgba(8,8,12,.93);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;cursor:pointer;transition:opacity .3s;}'+
    '.cg-str.h{opacity:0;pointer-events:none;}'+
    '.cg-str-t{font-family:"Bebas Neue",sans-serif;font-size:2.8rem;letter-spacing:.14em;color:#ffd23f;margin-bottom:6px;text-shadow:0 0 30px rgba(255,210,63,.35);line-height:1;}'+
    '.cg-str-g{display:flex;gap:14px;margin:10px 0 4px;}'+
    '.cg-str-g i{width:14px;height:14px;border-radius:7px 7px 2px 2px;display:block;}'+
    '.cg-str-s{font-family:"DM Sans",sans-serif;font-size:.66rem;letter-spacing:.18em;color:rgba(240,236,228,.4);text-transform:uppercase;margin-top:12px;}'+
    '.cg-str-h{font-family:"DM Sans",sans-serif;font-size:.6rem;letter-spacing:.12em;color:rgba(255,255,255,.35);margin-top:20px;text-transform:uppercase;}'+
    '.cg-ov{position:absolute;inset:0;z-index:20;background:rgba(8,8,12,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px 20px;opacity:0;pointer-events:none;transition:opacity .5s;}'+
    '.cg-ov.v{opacity:1;pointer-events:all;}'+
    '.cg-ov-t{font-family:"Bebas Neue",sans-serif;font-size:1.5rem;letter-spacing:.16em;color:#ffffff;margin-bottom:4px;}'+
    '.cg-ov-s{font-family:"Bebas Neue",sans-serif;font-size:3.2rem;color:#ffd23f;letter-spacing:.04em;margin-bottom:6px;line-height:1;}'+
    '.cg-ov-hi{font-family:"DM Sans",sans-serif;font-size:.6rem;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:16px;}'+
    '.cg-ov-fl{font-size:.56rem;letter-spacing:.2em;text-transform:uppercase;color:rgba(240,236,228,.25);margin-bottom:8px;font-family:"DM Sans",sans-serif;}'+
    '.cg-ov-f{font-family:"Cormorant Garamond",serif;font-style:italic;font-size:.9rem;color:rgba(240,236,228,.55);line-height:1.6;margin:0 0 20px;max-width:300px;}'+
    '.cg-ov-b{font-family:"Bebas Neue",sans-serif;font-size:.78rem;letter-spacing:.22em;background:0 0;border:1px solid rgba(255,210,63,.5);color:#ffd23f;padding:10px 28px;cursor:pointer;transition:all .3s;}'+
    '.cg-ov-b:hover{background:#ffd23f;color:#080808;}'+
    /* footer entry point — a quiet text link, not a lit-up button */
    '.cg-launch{display:inline-flex;align-items:center;gap:8px;background:0 0;border:0;color:rgba(240,236,228,.34);font-family:inherit;font-size:10.5px;letter-spacing:.24em;text-transform:uppercase;padding:6px 2px;margin:0 auto;cursor:pointer;transition:color .3s;}'+
    '.cg-launch:hover,.cg-launch:focus-visible{color:rgba(240,236,228,.8);}'+
    '.cg-launch-wrap{width:100%;text-align:center;padding:26px 20px 0;}'+
    /* mobile-menu entry */
    '.cg-mmbtn{font-family:"Bebas Neue",sans-serif;font-size:clamp(38px,9vw,64px);letter-spacing:.06em;text-transform:uppercase;color:rgba(240,236,228,.55);background:0 0;border:0;padding:0;margin-top:8px;display:flex;align-items:baseline;gap:16px;cursor:pointer;text-align:left;line-height:1;transition:color .25s;}'+
    '.cg-mmbtn i{font-style:normal;font-size:11px;color:rgba(240,236,228,.3);letter-spacing:.3em;}'+
    '.cg-mmbtn:hover{color:#fff;}'+
    '@media(max-width:500px){.cg-str-t{font-size:2.2rem;}}';
  document.head.appendChild(st);

  // ── state ──
  var bd,modal,arena,cv,ctx,mzA,mzB,scoreEl,lvEl,startOv,overOv,factEl,scoreEndEl,hiEndEl;
  var T=20,DPR=1,W=0,H=0;
  var dots,nDots,pac,gh,sc,hi,lives,lvl,state,stT,frT,chain,modeI,modeT,roundT,raf,lastT,pops;
  var keyFn,rsFn;

  try{hi=parseInt(localStorage.getItem('cg_pac_hi'),10)||0;}catch(e){hi=0;}

  // ── global launcher (used by the footer link and the mobile-menu entry) ──
  window.cgPlayGame=function(){if(!bd) showGame();};

  // ── footer launcher ──
  function addLauncher(){
    var foot=document.querySelector('footer');
    if(!foot||foot.querySelector('.cg-launch')) return;
    var wrap=document.createElement('div');
    wrap.className='cg-launch-wrap';
    var b=document.createElement('button');
    b.className='cg-launch';
    b.type='button';
    b.textContent='Play Pac-Man';
    b.onclick=function(){if(!bd) showGame();};
    wrap.appendChild(b);
    foot.appendChild(wrap);
  }

  // ── entry at the bottom of the mobile menu ──
  function addNavButton(){
    var mm=document.getElementById('mmenu');
    if(mm && !mm.querySelector('.cg-mmbtn')){
      var m=document.createElement('button');
      m.className='cg-mmbtn';
      m.type='button';
      m.innerHTML='<i>★</i>Play Game';
      m.onclick=function(){
        document.body.classList.remove('menu-open');
        document.body.style.overflow='';
        if(!bd) showGame();
      };
      mm.appendChild(m);
    }
  }

  function cgInit(){addLauncher();addNavButton();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',cgInit);
  else cgInit();

  // ── maze helpers ──
  function cellAt(c,r){
    if(r<0||r>=ROWS) return '#';
    if(c<0||c>=COLS) return r===TUN?' ':'#';
    return MAP[r].charAt(c);
  }
  function walkable(c,r){
    var ch=cellAt(c,r);
    return ch!=='#'&&ch!=='-';
  }
  function gWalk(g,c,r){
    var ch=cellAt(c,r);
    if(ch==='#') return false;
    if(ch==='-') return g.st==='leave'||g.st==='enter'||g.st==='eyes';
    return true;
  }

  function buildDots(){
    dots=[];nDots=0;
    for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){
      var ch=MAP[r].charAt(c),v=0;
      if(ch==='.'){v=1;nDots++;}
      else if(ch==='o'){v=2;nDots++;}
      dots[r*COLS+c]=v;
    }
  }

  // ── sizing / prerender ──
  function drawMazeLayer(wallCol){
    var cnv=document.createElement('canvas');
    cnv.width=W*DPR;cnv.height=H*DPR;
    var x=cnv.getContext('2d');
    x.setTransform(DPR,0,0,DPR,0,0);
    var lw=Math.max(1.5,T*0.13);
    x.lineWidth=lw;x.strokeStyle=wallCol;x.lineCap='round';
    x.beginPath();
    for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){
      if(cellAt(c,r)!=='#') continue;
      var L=c*T,Tp=r*T,R=(c+1)*T,B=(r+1)*T,h=lw/2;
      if(cellAt(c,r-1)!=='#'){x.moveTo(L,Tp+h);x.lineTo(R,Tp+h);}
      if(cellAt(c,r+1)!=='#'){x.moveTo(L,B-h);x.lineTo(R,B-h);}
      if(cellAt(c-1,r)!=='#'){x.moveTo(L+h,Tp);x.lineTo(L+h,B);}
      if(cellAt(c+1,r)!=='#'){x.moveTo(R-h,Tp);x.lineTo(R-h,B);}
    }
    x.stroke();
    // ghost house door
    for(r=0;r<ROWS;r++)for(c=0;c<COLS;c++){
      if(MAP[r].charAt(c)!=='-') continue;
      x.strokeStyle='#ff9ddb';x.lineWidth=Math.max(2,T*0.16);
      x.beginPath();
      x.moveTo(c*T+2,(r+.5)*T);x.lineTo((c+1)*T-2,(r+.5)*T);
      x.stroke();
    }
    return cnv;
  }

  function sizeCanvas(){
    DPR=Math.min(window.devicePixelRatio||1,2);
    var maxW=Math.min(window.innerWidth*0.94,470);
    var maxH=window.innerHeight*0.66;
    var nT=Math.max(11,Math.floor(Math.min(maxW/COLS,maxH/ROWS)));
    var ratio=nT/T;
    T=nT;W=T*COLS;H=T*ROWS;
    cv.width=W*DPR;cv.height=H*DPR;
    cv.style.width=W+'px';cv.style.height=H+'px';
    modal.style.width=(W+2)+'px';
    mzA=drawMazeLayer('#3f4ecf');
    mzB=drawMazeLayer('#f0ece4');
    if(pac&&ratio!==1){
      pac.px*=ratio;pac.py*=ratio;
      for(var i=0;i<gh.length;i++){gh[i].px*=ratio;gh[i].py*=ratio;}
    }
  }

  // ── entities ──
  function resetPositions(){
    pac={cx:PAC_X,cy:PAC_Y,dx:PAC_X,dy:PAC_Y,px:(PAC_X+.5)*T,py:(PAC_Y+.5)*T,
         dir:null,want:{x:-1,y:0},face:{x:-1,y:0}};
    gh=[];
    for(var i=0;i<4;i++){
      var s=GSTART[i];
      var g={i:i,cx:s.x,cy:s.y,dx:s.x,dy:s.y,px:(s.x+.5)*T,py:(s.y+.5)*T,
             dir:null,st:i===0?'norm':'wait',wait:GWAIT[i],bob:Math.random()*6};
      if(i===0) setDir(g,{x:-1,y:0});
      gh.push(g);
    }
    roundT=0;frT=0;chain=0;modeI=0;modeT=MODE_T[0];pops=[];
  }

  function startGame(){
    sc=0;lvl=1;lives=3;
    buildDots();resetPositions();
    state='ready';stT=1.3;
    startOv.classList.add('h');
    overOv.classList.remove('v');
    updateHeader();updateLives();
  }

  function updateHeader(){
    scoreEl.textContent='SCORE '+sc+(lvl>1?' · LV '+lvl:'');
  }
  function updateLives(){
    lvEl.textContent=new Array(Math.max(0,lives)+1).join('●');
  }
  function addScore(n){
    var was=Math.floor(sc/10000);
    sc+=n;
    if(Math.floor(sc/10000)>was&&lives<5){lives++;updateLives();}
    updateHeader();
  }

  // ── movement core ──
  function setDir(e,d){e.dir=d;e.dx=e.cx+d.x;e.dy=e.cy+d.y;}

  function stepEnt(e,spd,dt,decide){
    var rem=spd*T*dt,guard=0;
    while(rem>0&&guard++<10){
      if(!e.dir){
        var d0=decide();
        if(!d0) return;
        setDir(e,d0);
      }
      var tx=(e.dx+.5)*T,ty=(e.dy+.5)*T;
      var ddx=tx-e.px,ddy=ty-e.py;
      var dist=Math.abs(ddx)+Math.abs(ddy);
      if(dist>rem){
        if(ddx) e.px+=(ddx>0?1:-1)*Math.min(rem,Math.abs(ddx));
        if(ddy) e.py+=(ddy>0?1:-1)*Math.min(rem,Math.abs(ddy));
        return;
      }
      e.px=tx;e.py=ty;rem-=dist;
      e.cx=e.dx;e.cy=e.dy;
      if(e.cx<0){e.cx=COLS-1;e.px=(e.cx+.5)*T;}
      else if(e.cx>=COLS){e.cx=0;e.px=.5*T;}
      var nd=decide();
      if(!nd){e.dir=null;return;}
      setDir(e,nd);
    }
  }

  function revEnt(g){
    if(!g.dir) return;
    if(g.dx<0||g.dx>=COLS) return;
    var cx=g.cx,cy=g.cy;
    g.cx=g.dx;g.cy=g.dy;g.dx=cx;g.dy=cy;
    g.dir={x:-g.dir.x,y:-g.dir.y};
  }

  function pacDecide(){
    eatAt(pac.cx,pac.cy);
    if(pac.want&&walkable(pac.cx+pac.want.x,pac.cy+pac.want.y)){
      pac.face=pac.want;return pac.want;
    }
    if(pac.dir&&walkable(pac.cx+pac.dir.x,pac.cy+pac.dir.y)){
      pac.face=pac.dir;return pac.dir;
    }
    return null;
  }

  function isScatter(){return modeI<7&&modeI%2===0;}

  function gTarget(g){
    if(g.st==='eyes') return EXIT;
    if(isScatter()) return SCAT[g.i];
    switch(g.i){
      case 0:return {x:pac.cx,y:pac.cy};
      case 1:return {x:pac.cx+pac.face.x*4,y:pac.cy+pac.face.y*4};
      case 2:var b=gh[0];return {x:pac.cx*2-b.cx,y:pac.cy*2-b.cy};
      default:
        var dx=g.cx-pac.cx,dy=g.cy-pac.cy;
        return (dx*dx+dy*dy>64)?{x:pac.cx,y:pac.cy}:SCAT[3];
    }
  }

  function gDecide(g){
    if(g.st==='wait') return null;
    if(g.st==='eyes'&&g.cx===EXIT.x&&g.cy===EXIT.y) g.st='enter';
    if(g.st==='leave'){
      if(g.cx===9&&g.cy===7){
        g.st='norm';
        return Math.random()<.5?DIRS[1]:DIRS[3];
      }
      if(g.cx!==9) return {x:g.cx<9?1:-1,y:0};
      return DIRS[0];
    }
    if(g.st==='enter'){
      if(g.cx===9&&g.cy===9){g.st='wait';g.wait=roundT+.4;g.bob=0;return null;}
      return DIRS[2];
    }
    var opts=[],i,d;
    for(i=0;i<4;i++){
      d=DIRS[i];
      if(g.dir&&d.x===-g.dir.x&&d.y===-g.dir.y) continue;
      if(gWalk(g,g.cx+d.x,g.cy+d.y)) opts.push(d);
    }
    if(!opts.length) return g.dir?{x:-g.dir.x,y:-g.dir.y}:null;
    if(g.st==='fright') return opts[(Math.random()*opts.length)|0];
    var t=gTarget(g),best=opts[0],bq=1e18;
    for(i=0;i<opts.length;i++){
      d=opts[i];
      var qx=g.cx+d.x-t.x,qy=g.cy+d.y-t.y,q=qx*qx+qy*qy;
      if(q<bq){bq=q;best=d;}
    }
    return best;
  }

  function pacSpd(){return 6.4+Math.min(lvl-1,5)*0.3;}
  function gSpd(g){
    if(g.st==='eyes') return 13;
    if(g.st==='fright') return 3.6;
    if(g.st==='leave'||g.st==='enter') return 3.5;
    var s=5.7+Math.min(lvl-1,5)*0.35;
    if(g.cy===TUN&&(g.cx<3||g.cx>15)) s*=0.6;
    return s;
  }

  // ── events ──
  function eatAt(c,r){
    var k=r*COLS+c,v=dots[k];
    if(!v) return;
    dots[k]=0;nDots--;
    if(v===1) addScore(10);
    else{addScore(50);frighten();}
    if(nDots<=0){state='clear';stT=1.8;}
  }

  function frighten(){
    frT=Math.max(2.5,7-(lvl-1)*0.8);
    chain=0;
    for(var i=0;i<gh.length;i++){
      if(gh[i].st==='norm'){gh[i].st='fright';revEnt(gh[i]);}
    }
  }

  function eatGhost(g){
    var pts=200*Math.pow(2,Math.min(chain,3));
    chain++;
    addScore(pts);
    pops.push({x:g.px,y:g.py,t:.9,txt:pts});
    g.st='eyes';
    state='eatp';stT=.28;
  }

  function die(){state='die';stT=1.5;}

  function afterDeath(){
    lives--;updateLives();
    if(lives>0){resetPositions();state='ready';stT=1.2;}
    else endGame();
  }

  function endGame(){
    state='over';
    if(sc>hi){hi=sc;try{localStorage.setItem('cg_pac_hi',hi);}catch(e){}}
    scoreEndEl.textContent=sc;
    hiEndEl.textContent=sc>=hi&&sc>0?'NEW BEST!':'BEST: '+hi;
    factEl.textContent=facts[Math.floor(Math.random()*facts.length)];
    overOv.classList.add('v');
  }

  function collide(){
    for(var i=0;i<gh.length;i++){
      var g=gh[i];
      if(g.st==='eyes'||g.st==='wait'||g.st==='enter') continue;
      var dx=g.px-pac.px,dy=g.py-pac.py;
      if(dx*dx+dy*dy<T*T*0.4){
        if(g.st==='fright'){eatGhost(g);return;}
        die();return;
      }
    }
  }

  // ── update / render ──
  function update(dt){
    roundT+=dt;
    if(frT>0){
      frT-=dt;
      if(frT<=0){
        frT=0;chain=0;
        for(var j=0;j<gh.length;j++) if(gh[j].st==='fright') gh[j].st='norm';
      }
    } else {
      modeT-=dt;
      if(modeT<=0){
        modeI++;
        modeT=MODE_T[Math.min(modeI,MODE_T.length-1)];
        for(var m=0;m<gh.length;m++) if(gh[m].st==='norm') revEnt(gh[m]);
      }
    }
    stepEnt(pac,pacSpd(),dt,pacDecide);
    for(var i=0;i<gh.length;i++){
      var g=gh[i];
      if(g.st==='wait'){
        g.bob+=dt;
        if(roundT>=g.wait) g.st='leave';
        continue;
      }
      (function(gg){
        stepEnt(gg,gSpd(gg),dt,function(){return gDecide(gg);});
      })(g);
    }
    collide();
  }

  function frame(now){
    if(!bd) return;
    var dt=(now-lastT)/1000;
    lastT=now;
    if(dt>0.05) dt=0.05;
    if(state==='play') update(dt);
    else if(state==='ready'){stT-=dt;if(stT<=0) state='play';}
    else if(state==='eatp'){stT-=dt;if(stT<=0) state='play';}
    else if(state==='die'){stT-=dt;if(stT<=0) afterDeath();}
    else if(state==='clear'){
      stT-=dt;
      if(stT<=0){
        lvl++;buildDots();resetPositions();
        state='ready';stT=1.2;updateHeader();
      }
    }
    for(var i=pops.length-1;i>=0;i--){pops[i].t-=dt;if(pops[i].t<=0) pops.splice(i,1);}
    render(now);
    raf=requestAnimationFrame(frame);
  }

  function render(now){
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    var flash=state==='clear'&&(((stT*6)|0)%2===0);
    ctx.drawImage(flash?mzB:mzA,0,0,W,H);

    ctx.fillStyle='#f0ece4';
    for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){
      var v=dots[r*COLS+c];
      if(!v) continue;
      var x=(c+.5)*T,y=(r+.5)*T;
      if(v===1) ctx.fillRect(x-T*.08,y-T*.08,T*.16,T*.16);
      else{
        var rr=T*(.22+.06*Math.sin(now/180));
        ctx.beginPath();ctx.arc(x,y,rr,0,7);ctx.fill();
      }
    }

    if(state!=='over') drawPac(now);
    if(state!=='die'&&state!=='over'){
      for(var i=0;i<gh.length;i++) drawGhost(gh[i],now);
    }

    for(i=0;i<pops.length;i++){
      var p=pops[i];
      ctx.globalAlpha=Math.min(1,p.t*2);
      ctx.fillStyle='#9ff3ff';
      ctx.font='700 '+Math.round(T*.62)+'px "Bebas Neue",sans-serif';
      ctx.textAlign='center';
      ctx.fillText(p.txt,p.x,p.y-(0.9-p.t)*T*1.4);
      ctx.globalAlpha=1;
    }

    if(state==='ready'){
      ctx.fillStyle='#ffd23f';
      ctx.font='700 '+Math.round(T*.85)+'px "Bebas Neue",sans-serif';
      ctx.textAlign='center';
      ctx.fillText('READY!',W/2,(TUN+2.7)*T);
    }
  }

  function drawPac(now){
    var rad=T*.44,a=Math.atan2(pac.face.y,pac.face.x),m;
    if(state==='die'){
      var pr=Math.min(1,Math.max(0,(1.5-stT)/1.1));
      m=.3+(Math.PI-.3)*pr;
      if(m>=Math.PI-.02) return;
    } else {
      m=.09+.26*Math.abs(Math.sin(now/85));
    }
    ctx.fillStyle='#ffd23f';
    ctx.beginPath();
    ctx.moveTo(pac.px,pac.py);
    ctx.arc(pac.px,pac.py,rad,a+m,a-m);
    ctx.closePath();
    ctx.fill();
  }

  function drawGhost(g,now){
    var x=g.px,y=g.py+(g.st==='wait'?Math.sin(g.bob*5)*T*.12:0);
    var rad=T*.44;
    if(g.st!=='eyes'){
      var col;
      if(g.st==='fright'){
        var fl=frT<2&&(((now/220)|0)%2===0);
        col=fl?'#f0ece4':'#2b3bd6';
      } else col=GC[g.i];
      ctx.fillStyle=col;
      var by=y+rad*.82;
      ctx.beginPath();
      ctx.moveTo(x-rad,by);
      ctx.lineTo(x-rad,y);
      ctx.arc(x,y,rad,Math.PI,0);
      ctx.lineTo(x+rad,by);
      var w2=(rad*2)/6;
      for(var i=0;i<3;i++){
        ctx.lineTo(x+rad-w2*(i*2+1),by-rad*.3);
        ctx.lineTo(x+rad-w2*(i*2+2),by);
      }
      ctx.closePath();
      ctx.fill();
    }
    // eyes
    var fdx=g.dir?g.dir.x:0,fdy=g.dir?g.dir.y:0;
    if(g.st==='fright'){
      ctx.fillStyle=frT<2&&(((now/220)|0)%2===0)?'#ff4d4d':'#f0ece4';
      ctx.fillRect(x-rad*.42,y-rad*.28,rad*.24,rad*.28);
      ctx.fillRect(x+rad*.18,y-rad*.28,rad*.24,rad*.28);
      ctx.strokeStyle=ctx.fillStyle;
      ctx.lineWidth=Math.max(1,T*.06);
      ctx.beginPath();
      var mw=rad*.16,mx0=x-rad*.48,my0=y+rad*.3;
      ctx.moveTo(mx0,my0);
      for(i=1;i<=6;i++) ctx.lineTo(mx0+mw*i,my0+(i%2?-1:0)*rad*.14);
      ctx.stroke();
    } else {
      var ex=rad*.36,ey=rad*.2,er=rad*.28;
      for(var s=-1;s<=1;s+=2){
        ctx.fillStyle='#fff';
        ctx.beginPath();
        ctx.ellipse(x+s*ex,y-ey,er*.75,er,0,0,7);
        ctx.fill();
        ctx.fillStyle=g.st==='eyes'?'#3f4ecf':'#1b1b2c';
        ctx.beginPath();
        ctx.arc(x+s*ex+fdx*er*.42,y-ey+fdy*er*.42,er*.45,0,7);
        ctx.fill();
      }
    }
  }

  // ── modal shell ──
  function showGame(){
    if(bd) return;
    document.body.style.overflow='hidden';
    bd=document.createElement('div');
    bd.className='cg-bd';
    bd.setAttribute('role','dialog');
    bd.setAttribute('aria-modal','true');
    bd.setAttribute('aria-label','Pac-Man mini game');
    bd.innerHTML=
      '<div class="cg-modal">'+
        '<div class="cg-mhd">'+
          '<span class="cg-mtl">PAC-MAN</span>'+
          '<span class="cg-msc">SCORE 0</span>'+
          '<span class="cg-mlv">●●●</span>'+
          '<button class="cg-mcl" aria-label="Close">×</button>'+
        '</div>'+
        '<div class="cg-arn">'+
          '<canvas></canvas>'+
          '<div class="cg-str">'+
            '<div class="cg-str-t">PAC-MAN</div>'+
            '<div class="cg-str-g">'+
              '<i style="background:'+GC[0]+'"></i><i style="background:'+GC[1]+'"></i>'+
              '<i style="background:'+GC[2]+'"></i><i style="background:'+GC[3]+'"></i>'+
            '</div>'+
            '<div class="cg-str-s">'+(TOUCH?'SWIPE TO MOVE · TAP TO START':'ARROWS / WASD TO MOVE · CLICK TO START')+'</div>'+
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

    modal=bd.querySelector('.cg-modal');
    arena=bd.querySelector('.cg-arn');
    cv=bd.querySelector('canvas');
    ctx=cv.getContext('2d');
    scoreEl=bd.querySelector('.cg-msc');
    lvEl=bd.querySelector('.cg-mlv');
    startOv=bd.querySelector('.cg-str');
    overOv=bd.querySelector('.cg-ov');
    factEl=bd.querySelector('.cg-ov-f');
    scoreEndEl=bd.querySelector('.cg-ov-s');
    hiEndEl=bd.querySelector('.cg-ov-hi');

    sizeCanvas();
    buildDots();
    resetPositions();
    sc=0;lvl=1;lives=3;
    state='idle';pops=[];
    updateHeader();updateLives();

    bd.querySelector('.cg-mcl').onclick=closeGame;
    bd.querySelector('.cg-ov-b').onclick=function(e){e.stopPropagation();startGame();};
    startOv.addEventListener('click',startGame);
    bd.addEventListener('click',function(e){if(e.target===bd) closeGame();});

    // keyboard
    keyFn=function(e){
      if(!bd) return;
      var k=e.key,d=null;
      if(k==='ArrowUp'||k==='w'||k==='W') d=DIRS[0];
      else if(k==='ArrowLeft'||k==='a'||k==='A') d=DIRS[1];
      else if(k==='ArrowDown'||k==='s'||k==='S') d=DIRS[2];
      else if(k==='ArrowRight'||k==='d'||k==='D') d=DIRS[3];
      else if(k==='Escape'){closeGame();return;}
      if(!d) return;
      e.preventDefault();
      if(state==='idle') startGame();
      if(state==='over') return;
      pac.want=d;
    };
    document.addEventListener('keydown',keyFn);

    // swipe
    var tS=null;
    arena.addEventListener('touchstart',function(e){
      tS={x:e.touches[0].clientX,y:e.touches[0].clientY};
    },{passive:true});
    arena.addEventListener('touchmove',function(e){
      e.preventDefault();
      if(!tS) return;
      var dx=e.touches[0].clientX-tS.x,dy=e.touches[0].clientY-tS.y;
      if(Math.abs(dx)<18&&Math.abs(dy)<18) return;
      var d=Math.abs(dx)>Math.abs(dy)?(dx>0?DIRS[3]:DIRS[1]):(dy>0?DIRS[2]:DIRS[0]);
      if(state!=='over'&&state!=='idle') pac.want=d;
      tS={x:e.touches[0].clientX,y:e.touches[0].clientY};
    },{passive:false});

    rsFn=function(){if(bd) sizeCanvas();};
    window.addEventListener('resize',rsFn);

    lastT=performance.now();
    raf=requestAnimationFrame(frame);
    setTimeout(function(){if(bd)bd.classList.add('v');},30);
  }

  function closeGame(){
    if(!bd) return;
    if(raf) cancelAnimationFrame(raf);
    document.removeEventListener('keydown',keyFn);
    window.removeEventListener('resize',rsFn);
    bd.classList.remove('v');
    // don't unlock the page if the mobile drawer is still holding the lock
    if(!document.body.classList.contains('menu-open')) document.body.style.overflow='';
    var el=bd;bd=null;
    setTimeout(function(){el.remove();},400);
  }
})();
