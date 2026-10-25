/* CINEGMA LEAD — floating WhatsApp "Get a Quote" button on every page, plus
   lead tracking: WhatsApp, email, phone and contact-form actions are sent to
   Google Ads as events. Set CONVERSION_LABEL to a Google Ads conversion
   action label to count them as conversions. */
(function () {
  'use strict';
  if (window.__cinegmaLead) return; window.__cinegmaLead = true;

  var PHONE = '923390344180';
  var ADS_ID = 'AW-18200565991';
  var CONVERSION_LABEL = ''; /* e.g. 'AbCdEfGhIjk' from Google Ads > Conversions */

  function track(method) {
    if (typeof window.gtag !== 'function') return;
    try {
      gtag('event', 'generate_lead', { method: method, page_path: location.pathname });
      if (CONVERSION_LABEL) gtag('event', 'conversion', { send_to: ADS_ID + '/' + CONVERSION_LABEL });
    } catch (e) { }
  }

  function message() {
    var t = (document.title || '').split(/[|—]/)[0].trim();
    return 'Hi Cinegma Films, I found you on ' + (t ? '"' + t + '"' : 'your website') +
      ' and I\'d like a quote for a project.';
  }

  function build() {
    if (/\/admin\//.test(location.pathname)) return;
    var css = document.createElement('style');
    css.textContent =
      '#cg-wa{position:fixed;left:20px;bottom:20px;z-index:2147483100;display:flex;align-items:center;gap:10px;' +
      'padding:12px 18px 12px 14px;border-radius:999px;background:#25d366;color:#06240f;font:600 12px/1 "Space Grotesk",system-ui,sans-serif;' +
      'letter-spacing:.12em;text-transform:uppercase;text-decoration:none;box-shadow:0 12px 34px rgba(0,0,0,.45);' +
      'transform:translateY(120px);opacity:0;transition:transform .6s cubic-bezier(.16,1,.3,1),opacity .4s ease,box-shadow .3s ease}' +
      '#cg-wa.in{transform:none;opacity:1}#cg-wa:hover{box-shadow:0 16px 44px rgba(37,211,102,.45)}' +
      '#cg-wa svg{width:22px;height:22px;flex:none}' +
      'body.menu-open #cg-wa{opacity:0;pointer-events:none}' +
      '@media(max-width:640px){#cg-wa{left:14px;bottom:14px;padding:13px}#cg-wa span{display:none}}' +
      '@media print{#cg-wa{display:none}}';
    document.head.appendChild(css);

    var a = document.createElement('a');
    a.id = 'cg-wa';
    a.href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(message());
    a.target = '_blank'; a.rel = 'noopener';
    a.setAttribute('aria-label', 'Get a quote on WhatsApp');
    a.setAttribute('data-cursor-label', 'Chat');
    a.setAttribute('data-no-transition', '');
    a.innerHTML = '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8C29 8.7 23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.7C5.1 10 10 5.3 16 5.3S26.9 10 26.9 15.8 22 26.4 16 26.4zm6-7.8c-.3-.2-1.9-1-2.2-1.1-.3-.1-.5-.2-.7.2-.2.3-.8 1-1 1.2-.2.2-.4.2-.7.1-.3-.2-1.4-.5-2.6-1.6-1-.9-1.6-1.9-1.8-2.2-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.4c.2.2 2.4 3.6 5.8 5 .8.4 1.4.6 1.9.7.8.3 1.5.2 2.1.1.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.1-.3-.2-.6-.4z"/></svg><span>Get a Quote</span>';
    document.body.appendChild(a);
    setTimeout(function () { a.classList.add('in'); }, 1200);
  }

  /* One listener for every lead action on the page, including links added later. */
  document.addEventListener('click', function (e) {
    var l = e.target.closest && e.target.closest('a[href]');
    if (!l) return;
    var h = l.getAttribute('href') || '';
    if (/wa\.me|whatsapp\.com/.test(h)) track('whatsapp');
    else if (/^mailto:/i.test(h)) track('email');
    else if (/^tel:/i.test(h)) track('phone');
  }, true);
  document.addEventListener('submit', function (e) {
    if (e.target && e.target.matches && e.target.matches('form')) track('form');
  }, true);

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', build) : build();
})();
