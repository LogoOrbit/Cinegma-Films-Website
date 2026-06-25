(function(){
  'use strict';
  if(location.pathname.startsWith('/admin'))return;

  var sid=sessionStorage.getItem('cg_sid');
  if(!sid){sid=Math.random().toString(36).slice(2)+Date.now().toString(36);sessionStorage.setItem('cg_sid',sid);}

  var page=location.pathname+location.search;
  var ref=document.referrer||null;
  var sw=screen.width,sh=screen.height;
  var sent={};

  function send(event,details){
    var key=event+'|'+JSON.stringify(details||{});
    if(sent[key])return;sent[key]=true;
    try{
      var body=JSON.stringify({event:event,page:page,referrer:ref,sessionId:sid,details:details||null,screenW:sw,screenH:sh});
      if(navigator.sendBeacon){
        navigator.sendBeacon('/api/site-activity',new Blob([body],{type:'application/json'}));
      }else{
        fetch('/api/site-activity',{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}).catch(function(){});
      }
    }catch(e){}
  }

  send('page_view');

  var maxScroll=0;
  var scrollMilestones=[25,50,75,100];
  window.addEventListener('scroll',function(){
    var h=document.documentElement.scrollHeight-window.innerHeight;
    if(h<=0)return;
    var pct=Math.round(window.scrollY/h*100);
    if(pct>maxScroll){
      maxScroll=pct;
      for(var i=0;i<scrollMilestones.length;i++){
        if(pct>=scrollMilestones[i]&&!sent['scroll_depth|{"depth":'+scrollMilestones[i]+'}']){
          send('scroll_depth',{depth:scrollMilestones[i]});
        }
      }
    }
  },{passive:true});

  document.addEventListener('click',function(e){
    var el=e.target.closest('a[href]');
    if(el){
      var href=el.getAttribute('href')||'';
      var isExternal=el.hostname&&el.hostname!==location.hostname;
      if(isExternal){
        sent={}; // allow re-tracking for different links
        send('outbound_click',{url:href,text:(el.textContent||'').trim().slice(0,80)});
      }else if(href.match(/\.(pdf|zip|mp4|mp3|wav|mov)$/i)){
        sent={};
        send('download',{url:href,text:(el.textContent||'').trim().slice(0,80)});
      }
    }

    var btn=e.target.closest('button,.btn,.cta');
    if(btn){
      sent['button_click|']=false;
      send('button_click',{text:(btn.textContent||'').trim().slice(0,80),id:btn.id||null,cls:btn.className.slice(0,80)});
    }
  });

  document.querySelectorAll('video').forEach(function(v){
    v.addEventListener('play',function(){
      sent={};
      send('video_play',{src:(v.currentSrc||v.src||'').slice(0,200),title:v.title||null});
    });
    v.addEventListener('ended',function(){
      sent={};
      send('video_complete',{src:(v.currentSrc||v.src||'').slice(0,200)});
    });
  });

  document.querySelectorAll('audio').forEach(function(a){
    a.addEventListener('play',function(){
      sent={};
      send('audio_play',{src:(a.currentSrc||a.src||'').slice(0,200)});
    });
  });

  document.querySelectorAll('form').forEach(function(f){
    f.addEventListener('submit',function(){
      sent={};
      send('form_submit',{action:f.action||null,id:f.id||null});
    });
  });

  var startTime=Date.now();
  function sendTimeOnPage(){
    var sec=Math.round((Date.now()-startTime)/1000);
    if(sec>2){
      var body=JSON.stringify({event:'time_on_page',page:page,referrer:ref,sessionId:sid,details:{seconds:sec},screenW:sw,screenH:sh});
      if(navigator.sendBeacon)navigator.sendBeacon('/api/site-activity',new Blob([body],{type:'application/json'}));
    }
  }
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')sendTimeOnPage();});
  window.addEventListener('pagehide',sendTimeOnPage);
})();
