/* ITALTHERM site search. Loaded on the first click on the header search button (site.js adds this script and search.css).
   Fetches /assets/search-<lang>.json once and filters it in the browser: no external service, no tracking. */
(function () {
  'use strict';
  var panel, input, list, status, index = null, loading = false, opener = null, items = [], active = -1, types = {}, none = '';

  var fold = function (s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
  var NS = 'http://www.w3.org/2000/svg';
  /* Build nodes with the DOM API only (text via textContent): nothing from the index or from data-* is parsed as HTML. */
  var el = function (tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  };
  /* official kit icon from the cached sprite (colour from the text) */
  var sprite = function (id) {
    var s = document.createElementNS(NS, 'svg');
    ['viewBox:0 0 32 32', 'width:24', 'height:24', 'aria-hidden:true', 'focusable:false'].forEach(function (a) { var kv = a.split(':'); s.setAttribute(kv[0], kv[1]); });
    var u = document.createElementNS(NS, 'use');
    u.setAttribute('href', '/assets/img/icons.svg#' + id);
    s.appendChild(u);
    return s;
  };
  var icon = function (paths) {
    var s = document.createElementNS(NS, 'svg');
    ['viewBox:0 0 24 24', 'width:24', 'height:24', 'fill:none', 'stroke:currentColor', 'stroke-width:1.6', 'stroke-linecap:round', 'aria-hidden:true'].forEach(function (a) { var kv = a.split(':'); s.setAttribute(kv[0], kv[1]); });
    paths.forEach(function (d) {
      var p = document.createElementNS(NS, d.c ? 'circle' : 'path');
      Object.keys(d).forEach(function (k) { p.setAttribute(k === 'c' ? 'cx' : k, d[k]); });
      s.appendChild(p);
    });
    return s;
  };

  /* Every word typed must appear; code and title matches rank first, codes typed without the dot (itcc) also work. */
  function search(q) {
    var words = fold(q).split(/\s+/).filter(Boolean);
    if (!words.length || !index) return [];
    var out = [];
    index.forEach(function (it) {
      var code = fold(it.c || ''), name = fold(it.n), text = fold(it.x), plain = code.replace(/\./g, '');
      var score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (code && (code === w || plain === w)) score += 100;
        else if (code && (code.indexOf(w) === 0 || plain.indexOf(w) === 0)) score += 60;
        else if (name.indexOf(w) > -1) score += 30;
        else if (text.indexOf(w) > -1) score += 10;
        else return;
      }
      out.push({ it: it, s: score + (it.t === 'p' ? 3 : it.t === 's' ? 2 : 0) });
    });
    out.sort(function (a, b) { return b.s - a.s; });
    return out.slice(0, 8).map(function (r) { return r.it; });
  }

  function render() {
    var q = input.value.trim();
    items = search(q);
    active = items.length ? 0 : -1;
    list.textContent = '';
    if (!q) { status.textContent = ''; return; }
    if (!items.length) { status.textContent = none; return; }
    status.textContent = '';
    items.forEach(function (it, i) {
      var a = el('a', { href: it.u, role: 'option', id: 'sr-o' + i });
      if (i === 0) a.setAttribute('aria-selected', 'true');
      if (it.c) a.appendChild(el('b', null, it.c));
      a.appendChild(el('span', null, it.n));
      a.appendChild(el('small', null, types[it.t] || ''));
      var li = el('li');
      li.appendChild(a);
      list.appendChild(li);
    });
    input.setAttribute('aria-activedescendant', 'sr-o0');
  }

  function move(d) {
    if (!items.length) return;
    var opts = list.querySelectorAll('a');
    opts[active].removeAttribute('aria-selected');
    active = (active + d + items.length) % items.length;
    opts[active].setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', opts[active].id);
    opts[active].scrollIntoView({ block: 'nearest' });
  }

  function close() {
    if (!panel || panel.hidden) return;
    panel.hidden = true;
    document.body.classList.remove('no-scroll');
    if (opener) opener.setAttribute('aria-expanded', 'false');
    if (opener && opener.focus) opener.focus();
  }

  function build(btn) {
    types = {};
    try { types = JSON.parse(btn.getAttribute('data-types') || '{}'); } catch (e) { types = {}; }
    none = btn.getAttribute('data-none') || '';
    var label = btn.getAttribute('aria-label') || 'Search';
    panel = el('div', { class: 'sr', role: 'dialog', 'aria-modal': 'true', 'aria-label': label });
    panel.hidden = true;
    var wrap = el('div', { class: 'sr-w' });
    var form = el('div', { class: 'sr-f' });
    form.appendChild(sprite('ricerca'));
    input = el('input', { type: 'search', autocomplete: 'off', spellcheck: 'false', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'sr-l', placeholder: btn.getAttribute('data-ph') || '', 'aria-label': label });
    form.appendChild(input);
    var x = el('button', { type: 'button', class: 'sr-x', 'aria-label': btn.getAttribute('data-close') || '' });
    x.appendChild(icon([{ d: 'M6 6l12 12M18 6L6 18' }]));
    form.appendChild(x);
    list = el('ul', { id: 'sr-l', role: 'listbox' });
    status = el('p', { class: 'sr-s', role: 'status' });
    wrap.appendChild(form); wrap.appendChild(list); wrap.appendChild(status);
    var back = el('div', { class: 'sr-b' });
    panel.appendChild(back); panel.appendChild(wrap);
    document.body.appendChild(panel);
    back.addEventListener('click', close);
    x.addEventListener('click', close);
    input.addEventListener('input', render);
    panel.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter' && items[active]) { e.preventDefault(); location.href = items[active].u; }
    });
    list.addEventListener('click', function () { document.body.classList.remove('no-scroll'); });
  }

  function open(btn) {
    opener = btn;
    if (!panel) build(btn);
    panel.hidden = false;
    document.body.classList.add('no-scroll');
    btn.setAttribute('aria-expanded', 'true');
    input.focus();
    if (!index && !loading) {
      loading = true;
      fetch(btn.getAttribute('data-index'), { credentials: 'same-origin' })
        .then(function (r) { return r.json(); })
        .then(function (d) { index = d.items || []; render(); })
        .catch(function () { index = []; })
        .then(function () { loading = false; });
    }
  }

  document.addEventListener('it:search', function (e) { open(e.detail); });
})();
