/* CINEGMA GALLERY — styles film still / poster grids and opens them in a
   keyboard-friendly lightbox. Markup: <div class="cg-gal" data-gallery>
   <a href="full.avif"><img src="thumb.avif" alt="…"></a> … </div> */
(function () {
  'use strict';
  var css = document.createElement('style');
  css.textContent =
    '.cg-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,340px),1fr));gap:12px;margin-top:44px}' +
    '.cg-gal.posters{grid-template-columns:repeat(auto-fill,minmax(min(100%,220px),1fr))}' +
    '.cg-gal a{position:relative;display:block;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.09);background:#0d0d12;aspect-ratio:16/9}' +
    '.cg-gal.posters a{aspect-ratio:2/3}' +
    '.cg-gal.sq a{aspect-ratio:1/1}.cg-gal.tall{grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr))}.cg-gal.tall a{aspect-ratio:3/4}.cg-gal + .cg-gal{margin-top:12px}' +
    '.cg-gal img{width:100%;height:100%;object-fit:cover;transition:transform .9s cubic-bezier(.16,1,.3,1),filter .6s ease;filter:saturate(.9)}' +
    '.cg-gal a:hover img{transform:scale(1.05);filter:saturate(1.05)}' +
    '.cg-gal figcaption{position:absolute;left:12px;bottom:10px;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(240,236,228,.75)}' +
    '#cg-lb{position:fixed;inset:0;z-index:2147483450;display:none;align-items:center;justify-content:center;background:rgba(5,5,8,.94);backdrop-filter:blur(10px)}' +
    '#cg-lb.open{display:flex}#cg-lb img{max-width:92vw;max-height:84vh;border-radius:8px;box-shadow:0 30px 90px rgba(0,0,0,.7)}' +
    '#cg-lb button{position:absolute;background:none;border:0;color:#f0ece4;font-size:34px;cursor:pointer;padding:14px 18px;opacity:.7}' +
    '#cg-lb button:hover{opacity:1}#cg-lb .x{top:10px;right:14px}#cg-lb .p{left:8px;top:50%;transform:translateY(-50%)}#cg-lb .n{right:8px;top:50%;transform:translateY(-50%)}' +
    '#cg-lb p{position:absolute;bottom:18px;left:0;right:0;text-align:center;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9a948a}';
  document.head.appendChild(css);

  var lb, img, cap, set = [], at = 0, last = null;
  function show(i) {
    at = (i + set.length) % set.length;
    var a = set[at];
    img.src = a.getAttribute('href');
    img.alt = (a.querySelector('img') || {}).alt || '';
    cap.textContent = img.alt + '  ·  ' + (at + 1) + ' / ' + set.length;
  }
  function open(list, i) {
    if (!lb) {
      lb = document.createElement('div'); lb.id = 'cg-lb';
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('data-lenis-prevent', '');
      lb.innerHTML = '<img alt=""><p></p><button class="x" aria-label="Close">×</button>' +
        '<button class="p" aria-label="Previous">‹</button><button class="n" aria-label="Next">›</button>';
      document.body.appendChild(lb);
      img = lb.querySelector('img'); cap = lb.querySelector('p');
      lb.querySelector('.x').onclick = close;
      lb.querySelector('.p').onclick = function () { show(at - 1); };
      lb.querySelector('.n').onclick = function () { show(at + 1); };
      lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    }
    last = document.activeElement; set = list; show(i);
    lb.classList.add('open'); document.body.style.overflow = 'hidden';
    lb.querySelector('.x').focus();
  }
  function close() {
    lb.classList.remove('open'); document.body.style.overflow = '';
    if (last && last.focus) last.focus();
  }
  addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(at + 1);
    else if (e.key === 'ArrowLeft') show(at - 1);
  });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-gallery] a');
    if (!a) return;
    e.preventDefault();
    var list = [].slice.call(a.closest('[data-gallery]').querySelectorAll('a'));
    open(list, list.indexOf(a));
  });
})();
