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

    /* mobile drawer */
    var drw = $('#drawer'), bur = $('.bur');
    if (drw && bur) {
      var xb = $('.x', drw);
      var setDrawer = function (open, restore) {
        drw.classList.toggle('open', open);
        drw.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (open) drw.removeAttribute('inert'); else drw.setAttribute('inert', '');
        bur.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.body.classList.toggle('no-scroll', open);
        if (open) { if (xb) xb.focus(); } else if (restore) bur.focus();
      };
      setDrawer(false, false);
      bur.addEventListener('click', function () { setDrawer(true); });
      if (xb) xb.addEventListener('click', function () { setDrawer(false, true); });
      $$('a', drw).forEach(function (a) { a.addEventListener('click', function () { setDrawer(false, false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && drw.classList.contains('open')) setDrawer(false, true);
      });
      if (window.matchMedia) {
        var mq = matchMedia('(min-width:1001px)');
        if (mq.addEventListener) mq.addEventListener('change', function () {
          if (mq.matches && drw.classList.contains('open')) setDrawer(false, false);
        });
      }
    }

    /* hero slider */
    var hero = $('.hero');
    if (hero) {
      var ms = $$('.stage .m', hero), cs = $$('.cap .c', hero), bs = $$('.sel button', hero);
      var gh = $('.ghost', hero), cur = $('.cur', hero), n = ms.length, i = 0, t = 0, paused = false;
      if (reduce) hero.classList.add('is-static');
      var pad = function (v) { return (v < 10 ? '0' : '') + v; };
      var sched = function () {
        clearTimeout(t);
        if (reduce || paused || n < 2) return;
        t = setTimeout(function () { go(i + 1); }, 6000);
      };
      var go = function (k) {
        i = (k + n) % n;
        ms.forEach(function (e, j) { e.classList.toggle('on', j === i); e.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
        cs.forEach(function (e, j) { e.classList.toggle('on', j === i); });
        bs.forEach(function (e, j) {
          e.classList.remove('on'); e.removeAttribute('aria-current');
          if (j === i) { void e.offsetWidth; e.classList.add('on'); e.setAttribute('aria-current', 'true'); }
        });
        if (gh && cs[i]) { var b = $('b', cs[i]); if (b) gh.textContent = b.textContent; }
        if (cur) cur.textContent = pad(i + 1);
        sched();
      };
      var pause = function (v) { paused = v; hero.classList.toggle('is-paused', v); if (v) clearTimeout(t); else sched(); };
      bs.forEach(function (b, j) { b.addEventListener('click', function () { go(j); }); });
      var pv = $('.pv', hero), nx = $('.nx', hero);
      if (pv) pv.addEventListener('click', function () { go(i - 1); });
      if (nx) nx.addEventListener('click', function () { go(i + 1); });
      hero.addEventListener('mouseenter', function () { pause(true); });
      hero.addEventListener('mouseleave', function () {
        pause(false); hero.style.setProperty('--px', '0px'); hero.style.setProperty('--py', '0px');
      });
      hero.addEventListener('focusin', function () { pause(true); });
      hero.addEventListener('focusout', function (e) { if (!hero.contains(e.relatedTarget)) pause(false); });
      if (!reduce && window.matchMedia && matchMedia('(hover:hover)').matches) {
        hero.addEventListener('mousemove', function (e) {
          var r = hero.getBoundingClientRect();
          hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5) * -22 + 'px');
          hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5) * -14 + 'px');
        });
      }
      if (n) go(0);
    }

    /* catalogue filter chips */
    var chips = $$('[data-filter]');
    if (chips.length) {
      var items = $$('[data-g]');
      chips.forEach(function (b) {
        b.addEventListener('click', function () {
          var f = b.getAttribute('data-filter');
          chips.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          items.forEach(function (d) { d.hidden = !(f === 'all' || d.getAttribute('data-g') === f); });
        });
      });
    }

    /* product gallery */
    var gb = $$('.gal .th button'), gi = $$('.gal .big img');
    gb.forEach(function (b, k) {
      b.addEventListener('click', function () {
        gb.forEach(function (x, j) { x.classList.toggle('on', j === k); });
        gi.forEach(function (x, j) { x.classList.toggle('on', j === k); });
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
