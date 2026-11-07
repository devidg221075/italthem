/* ITALTHERM catalogue page: live family filter, sort and count. Loaded by the products page only (deferred). Plain JS, no globals. */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  function init() {
    /* catalogue: live filter by family, sort, count; ?g=cc|melt|heat|prod preselects a family */
    var cg = $('#pgrid');
    if (cg) {
      var cards = $$('.cc', cg), cnt = $('.cnt'), none = $('.cno'), cf = $('.cf'), rs = $('.rs'), sel = $('.so select'), ap = $('.ap');
      var picked = function (name) { return $$('.cf input[name=' + name + ']').filter(function (b) { return b.checked; }).map(function (b) { return b.value; }); };
      var apply = function () {
        var gs = picked('g'), shown = 0;
        cards.forEach(function (c) {
          c.hidden = !(!gs.length || gs.indexOf(c.getAttribute('data-g')) > -1);
          if (!c.hidden) shown++;
        });
        cnt.textContent = (shown === 1 ? cnt.getAttribute('data-one') : cnt.getAttribute('data-many')).replace('{n}', String(shown));
        none.hidden = shown > 0;
        if (rs) rs.hidden = !gs.length;
      };
      var order = function () {
        var byCode = sel && sel.value === 'c';
        cards.slice().sort(function (a, b) {
          return byCode ? a.getAttribute('data-code').localeCompare(b.getAttribute('data-code'), 'en', { numeric: true }) : a.getAttribute('data-r') - b.getAttribute('data-r');
        }).forEach(function (c) { cg.appendChild(c); });
      };
      $$('.cf input').forEach(function (b) { b.addEventListener('change', apply); });
      if (sel) sel.addEventListener('change', order);
      if (rs) rs.addEventListener('click', function () { $$('.cf input').forEach(function (b) { b.checked = false; }); apply(); });
      if (ap) ap.addEventListener('click', function () {
        apply();
        if (cf && window.matchMedia && matchMedia('(max-width:1000px)').matches) cf.removeAttribute('open');
        cg.scrollIntoView({ block: 'start' });
      });
      var qg = new URLSearchParams(location.search).get('g');
      if (qg) $$('.cf input[name=g]').forEach(function (b) { b.checked = b.value === qg; });
      /* filter panel: open on wide screens, closed on phones and tablets (the markup is open for no-JS) */
      if (cf && window.matchMedia) {
        var cq = matchMedia('(max-width:1000px)');
        var syncCf = function () { if (cq.matches) cf.removeAttribute('open'); else cf.setAttribute('open', ''); };
        cf.setAttribute('data-t', '');
        syncCf();
        if (cq.addEventListener) cq.addEventListener('change', syncCf);
      }
      apply();
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
