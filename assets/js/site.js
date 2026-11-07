/* ITALTHERM site behaviour. Plain JS, no dependencies, no globals. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    $$('[data-year]').forEach(function (n) { n.textContent = String(new Date().getFullYear()); });

    /* header: state class only changes colour/border/shadow, never size */
    var hdr = $('.hdr');
    if (hdr) {
      var onScroll = function () { hdr.classList.toggle('is-scrolled', window.scrollY > 10); };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    /* mobile drawer: main list + drill-down "Products" panel */
    var drw = $('#drawer'), bur = $('.bur');
    if (drw && bur) {
      var pm = $('.pm', drw), ps = $('.ps', drw);
      var setPanels = function (sub) {
        drw.classList.toggle('sub-open', sub);
        if (pm) { pm.setAttribute('aria-hidden', sub ? 'true' : 'false'); if (sub) pm.setAttribute('inert', ''); else pm.removeAttribute('inert'); }
        if (ps) { ps.setAttribute('aria-hidden', sub ? 'false' : 'true'); if (sub) ps.removeAttribute('inert'); else ps.setAttribute('inert', ''); }
      };
      var setDrawer = function (open, restore) {
        drw.classList.toggle('open', open);
        drw.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (open) drw.removeAttribute('inert'); else drw.setAttribute('inert', '');
        bur.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('no-scroll', open);
        if (!open) setPanels(false);
        if (open) { var xb = $('.pm .x', drw); if (xb) xb.focus(); } else if (restore) bur.focus();
      };
      setDrawer(false, false);
      bur.addEventListener('click', function () { setDrawer(true); });
      $$('.x', drw).forEach(function (x) { x.addEventListener('click', function () { setDrawer(false, true); }); });
      var subLink = $('a[data-sub]', drw), back = $('.bk', drw);
      if (subLink) subLink.addEventListener('click', function (e) { e.preventDefault(); setPanels(true); if (back) back.focus(); });
      if (back) back.addEventListener('click', function () { setPanels(false); if (subLink) subLink.focus(); });
      $$('a', drw).forEach(function (a) { if (!a.hasAttribute('data-sub')) a.addEventListener('click', function () { setDrawer(false, false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !drw.classList.contains('open')) return;
        if (drw.classList.contains('sub-open')) { setPanels(false); if (subLink) subLink.focus(); } else setDrawer(false, true);
      });
      if (window.matchMedia) {
        var mq = matchMedia('(min-width:1001px)');
        if (mq.addEventListener) mq.addEventListener('change', function () {
          if (mq.matches && drw.classList.contains('open')) setDrawer(false, false);
        });
      }
    }

    /* mega menu: CSS opens it on hover and focus; JS adds aria-expanded, Escape and tap-to-open on touch screens */
    var hm = $('.hdr .hm');
    if (hm) {
      var tr = $('a', hm);
      var expanded = function (v) { if (tr) tr.setAttribute('aria-expanded', v ? 'true' : 'false'); };
      hm.addEventListener('mouseenter', function () { expanded(true); });
      hm.addEventListener('mouseleave', function () { expanded(false); });
      hm.addEventListener('focusin', function () { expanded(true); });
      hm.addEventListener('focusout', function (e) { if (!hm.contains(e.relatedTarget)) expanded(false); });
      if (tr && window.matchMedia && matchMedia('(hover:none)').matches) {
        tr.addEventListener('click', function (e) {
          if (!hm.classList.contains('open')) { e.preventDefault(); hm.classList.add('open'); expanded(true); }
        });
        document.addEventListener('click', function (e) { if (!hm.contains(e.target)) { hm.classList.remove('open'); expanded(false); } });
      }
      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        hm.classList.remove('open'); expanded(false);
        if (hm.contains(document.activeElement) && document.activeElement.blur) document.activeElement.blur();
      });
    }

    /* footer accordions: closed on phones, always open on larger screens (markup is open for no-JS) */
    var fds = $$('.fd');
    if (fds.length && window.matchMedia) {
      var fq = matchMedia('(max-width:600px)');
      var syncFooter = function () { fds.forEach(function (d) { if (fq.matches) d.removeAttribute('open'); else d.setAttribute('open', ''); }); };
      syncFooter();
      if (fq.addEventListener) fq.addEventListener('change', syncFooter);
    }

    /* search: the overlay (search.js + search.css + index JSON) is fetched on the first click only */
    var sb = $('.sb'), searchLoaded = false;
    if (sb) {
      sb.addEventListener('click', function () {
        var fire = function () { document.dispatchEvent(new CustomEvent('it:search', { detail: sb })); };
        if (searchLoaded) { fire(); return; }
        searchLoaded = true;
        var css = document.createElement('link');
        css.rel = 'stylesheet'; css.href = sb.getAttribute('data-css');
        document.head.appendChild(css);
        var js = document.createElement('script');
        js.src = sb.getAttribute('data-js'); js.onload = fire;
        document.head.appendChild(js);
      });
    }

    /* hero: machine photos fade, dots select, 6 s autoplay unless reduced motion, hover or focus */
    var hero = $('.hero');
    if (hero) {
      var ms = $$('.stage .m', hero), ds = $$('.dots button', hero), n = ms.length, i = 0, t = 0, paused = false;
      var sched = function () {
        clearTimeout(t);
        if (reduce || paused || n < 2) return;
        t = setTimeout(function () { go(i + 1); }, 6000);
      };
      var go = function (k) {
        i = (k + n) % n;
        ms.forEach(function (e, j) { e.classList.toggle('on', j === i); e.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
        ds.forEach(function (e, j) { e.classList.toggle('on', j === i); if (j === i) e.setAttribute('aria-current', 'true'); else e.removeAttribute('aria-current'); });
        sched();
      };
      var pause = function (v) { paused = v; if (v) clearTimeout(t); else sched(); };
      ds.forEach(function (b, j) { b.addEventListener('click', function () { go(j); }); });
      hero.addEventListener('mouseenter', function () { pause(true); });
      hero.addEventListener('mouseleave', function () { pause(false); });
      hero.addEventListener('focusin', function () { pause(true); });
      hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) pause(false); });
      if (n) go(0);
    }

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

    /* notice bar: shown until OK is pressed; first-party technical cookie, no storage API */
    var nb = $('.nb');
    if (nb) {
      if (document.cookie.indexOf('it_notice=1') < 0) nb.hidden = false;
      var ok = $('button', nb);
      if (ok) ok.addEventListener('click', function () {
        document.cookie = 'it_notice=1; Max-Age=15552000; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
        nb.hidden = true;
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
