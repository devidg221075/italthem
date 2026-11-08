/* ITALTHERM product page: image gallery and tabs. Loaded by product pages only (deferred). Plain JS, no globals.
   Without JS every panel is visible one after the other and the gallery shows its first image. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function init() {
    /* gallery */
    var gb = $$('.gal .th button'), gi = $$('.gal .big img');
    gb.forEach(function (b, k) {
      b.addEventListener('click', function () {
        gb.forEach(function (x, j) { x.classList.toggle('on', j === k); if (j === k) x.setAttribute('aria-current', 'true'); else x.removeAttribute('aria-current'); });
        gi.forEach(function (x, j) { x.classList.toggle('on', j === k); });
      });
    });

    /* tabs: arrows, Home and End move between tabs; the data-first panel is open at load */
    var root = $('.ptab');
    if (!root) return;
    var tabs = $$('[role=tab]', root), panels = $$('[role=tabpanel]', root);
    var show = function (tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.setAttribute('tabindex', on ? '0' : '-1');
      });
      panels.forEach(function (p) {
        if (p.id === tab.getAttribute('aria-controls')) p.removeAttribute('data-off'); else p.setAttribute('data-off', '');
      });
      if (focus) tab.focus();
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(t, false); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length, to = -1;
        if (k === 'ArrowRight') to = (i + 1) % n;
        else if (k === 'ArrowLeft') to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to > -1) { e.preventDefault(); show(tabs[to], true); }
      });
    });
    var first = $('#t-' + root.getAttribute('data-first'));
    if (first) show(first, false);
    /* a link such as #p-docs opens that tab, on load and when the hash changes later */
    var fromHash = function () {
      if (!location.hash || !/^#p-[a-z]+$/.test(location.hash)) return;
      var target = $('[aria-controls="' + location.hash.slice(1) + '"]', root);
      if (target) show(target, false);
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
