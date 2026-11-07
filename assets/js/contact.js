/* ITALTHERM contact page: form submission by fetch, ?product prefill, ?sent / ?error messages. Loaded by the contact page only (deferred).
   Without JS the form posts to /contact.php and comes back with ?sent=1 or ?error=1. Plain JS, no globals. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  function init() {
    /* contact form: fetch enhancement, ?product prefill, ?sent / ?error messages */
    var form = $('form.fl[action="/contact.php"]');
    if (form) {
      var box = $('.fmsg', form), btn = $('button[type=submit]', form), q = new URLSearchParams(location.search);
      var say = function (ok, text) {
        box.className = 'fmsg ' + (ok ? 'ok' : 'bad');
        box.textContent = text;
      };
      var codes = {};
      try { codes = JSON.parse(form.getAttribute('data-products') || '{}'); } catch (e) { codes = {}; }
      var pr = q.get('product');
      if (pr && Object.prototype.hasOwnProperty.call(codes, pr)) {
        form.elements.product.value = pr;
        var ab = $('.about', form);
        if (ab) { ab.textContent = form.getAttribute('data-about') + ' ' + codes[pr]; ab.hidden = false; }
      }
      if (q.get('sent') === '1') say(true, form.getAttribute('data-ok'));
      else if (q.get('error') === '1') say(false, form.getAttribute('data-err'));
      if (window.fetch && window.FormData) {
        form.addEventListener('submit', function (e) {
          if (!form.checkValidity()) return;
          e.preventDefault();
          var label = btn.textContent;
          btn.disabled = true; btn.textContent = form.getAttribute('data-sending');
          var done = function (ok, text, field) {
            btn.disabled = false; btn.textContent = label;
            say(ok, text);
            if (ok) { form.reset(); }
            else if (field && form.elements[field] && form.elements[field].focus) form.elements[field].focus();
          };
          fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json', 'X-Requested-With': 'fetch' }, credentials: 'same-origin' })
            .then(function (r) { return r.json().catch(function () { return {}; }); })
            .then(function (d) { d.ok ? done(true, form.getAttribute('data-ok')) : done(false, d.error || form.getAttribute('data-err'), d.field); })
            .catch(function () { done(false, form.getAttribute('data-err')); });
        });
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
