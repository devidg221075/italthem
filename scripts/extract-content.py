#!/usr/bin/env python3
"""Regenerates content/<lang>/*.json, content/corrections.json and the raw text
snapshots content/original/text/*.txt from the downloaded HTML in
content/original/html/.  Text is copied programmatically from the HTML; the
only edits are the rules in RULES / FORCED below (see docs/CHANGES.md), and each
edit that is applied is written to content/corrections.json.

Run from anywhere:  python3 -I scripts/extract-content.py
"""
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
HTML = ROOT / 'content/original/html'
TEXT = ROOT / 'content/original/text'
BASE = 'https://ital-therm.it'
DASH = '—'

SITE = {
    'name': 'ITALTHERM S.r.l.',
    'vat': '02487940518',
    'rea': 'Arezzo 220552',
    'email': 'info@ital-therm.it',
    'phones': ['+39 0575 802485', '+39 366 871 9427'],
    'address': 'Viale S. Maria delle Vertighe, 50/B, 52048 Monte San Savino (AR) Italy',
}

# code -> (EN html, IT html, group, EN path, IT path)
_P = lambda en, it: ('/product/%s/' % en, '/it/product/%s/' % it)
PRODUCTS = {
    'kb': ('IT.KB', 'prod', *_P('automatic-bullion-bars-production-system-mod-it-kb', 'sistema-automatico-per-la-produzione-di-lingotti')),
    'cc': ('IT.CC', 'melt', *_P('continuous-casting-metal-melting-furnace', 'forno-di-fusione-metalli-per-colata-continua')),
    'af': ('IT.AF', 'heat', *_P('controlled-atmosphere-anealing-furnace-model-it-af', 'forno-di-ricottura-in-atmosfera-controllata')),
    'bf': ('IT.BF', 'heat', *_P('controlled-atmosphere-belt-furnace-model-it-bf', 'forno-a-nastro-ad-atmosfera-controllata')),
    'cwa': ('IT.CWA', 'heat', *_P('continuous-wire-anealing', 'forno-di-ricottura-filo-in-atmosfera-controllata')),
    'gt': ('IT.GT', 'melt', *_P('gear-driven-tilting-metal-melting-furnace-model-it-gt', 'forno-ribaltabile-per-fusione-metalli-con-trasmissione-ad-ingranaggi')),
    'gms': ('IT.GMS', 'prod', *_P('grains-production-system-it-gms', 'sistema-di-produzione-di-granuli')),
    'gmb': ('IT.GMB', 'prod', *_P('grains-production-system-model-it-gmb', 'sistema-di-produzione-di-graniglia')),
    'mt': ('IT.MT', 'melt', *_P('manual-tiltingit-mt', 'forno-di-fusione-metalli-a-ribaltamento-manuale')),
    'sm': ('IT.SM', 'melt', *_P('static-metal-melting-furnace-it-sm', 'forno-statico-fusione-metalli')),
    'fm': ('IT.FM', 'prod', *_P('vacuum-flake-production-system-it-fm', 'sistema-di-produzione-vacuum-di-scaglie')),
}
EN_PRODUCT_HTML = lambda n: 'p-%s.html' % n
IT_PRODUCT_HTML = lambda n: 'it__product__%s.html' % PRODUCTS[n][3].strip('/').split('/')[-1]

SERVICES = [  # (EN html, slug)
    ('s-mesh.html', 'italtherm-mesh-belt-heat-treatment-furnace'),
    ('s-wire.html', 'italtherm-continuous-wire-annealing-furnace'),
    ('s-ann.html', 'italtherm-annealing-furnaces'),
    ('s-gear.html', 'gear-driven-tilting-metal-melting-furnace'),
]
PAGES = {  # slug -> {lang: (html, old path)}
    'home': {'en': ('home-en.html', '/'), 'it': ('home-it.html', '/it/')},
    'about': {
        'en': ('about.html', '/italtherm-is-an-italian-company-specializing-in-high-technology-systems-for-melting-casting-and-heat-treatment-of-precious-metals/'),
        'it': ('it-about.html', '/it/chi-siamo/'),
    },
    'products': {'en': ('shop.html', '/shop/'), 'it': ('it-shop.html', '/it/shop/')},
    'contact': {'en': ('contact-en.html', '/contact-us/'), 'it': ('it-contact.html', '/it/contattaci/')},
}

# ---------------------------------------------------------------- corrections
# Regex rules applied to every text unit (title, short line, table cell, page block).
RULES = [
    (r'ANEALING', 'ANNEALING'), (r'Anealing', 'Annealing'), (r'anealing', 'annealing'),
    (r'ANNEAUNG', 'ANNEALING'),
    (r'MODET', 'MODEL'),
    (r'Gear-Driven Metal Melting Tilting Melting Furnace', 'Gear-Driven Tilting Metal Melting Furnace'),
    (r'ltalTherm', 'ItalTherm'),
    (r'(?<= )tor(?= )', 'for'),
    (r'TEM PO\b', 'TEMPO'), (r'TIM E\b', 'TIME'), (r'TEM PERATURA', 'TEMPERATURA'),
    (r'^KG240KG$', '240KG'),
    (r'^305KW$', '35KW'),
    (r'‑', '-'),  # non-breaking hyphen
    (r'to require information or estimate of costs', 'to request information or an estimate of costs'),
    # OCR artefacts of the spec tables (the PDF has the proper characters)
    (r'(?<=\d)[˙˝](?=\d)', '-'),
    (r'˙ADJUSTABLEˆ', '(ADJUSTABLE)'),
    (r'K˝TYPE', 'K-TYPE'),
]
RULES = [(re.compile(a), b) for a, b in RULES]
# (page file, section heading, raw text) -> corrected text, for corrections that need context
FORCED = {
    ('en', 'about', 'Why Choose ITALTHERM', 'Flexible systems for oxidation-free production of strips, tubes, and wires.'):
        'These technologies ensure thermal uniformity, repeatability and consistent results in processing.',
}
DIM_LABEL = re.compile(r'DIMENSION|OVERALL SIZE|HEATING CHAMBER')
LOG = []  # corrections.json entries


def log(file, field, old, new):
    e = {'file': file, 'field': field, 'from': old, 'to': new}
    if e not in LOG:
        LOG.append(e)


def fix(raw, file, field):
    new = raw
    for rx, rep in RULES:
        new = rx.sub(rep, new)
    if new != raw:
        log(file, field, raw, new)
    return new


# ------------------------------------------------------------------- helpers
def soup(name):
    return BeautifulSoup((HTML / name).read_text(encoding='utf-8'), 'html.parser')


def lines_of(el, sep=''):
    """Text of an element, <br> as line break, nbsp as space, one entry per non-empty line."""
    for br in el.find_all('br'):
        br.replace_with('\n')
    t = el.get_text(sep).replace('\xa0', ' ')
    out = [re.sub(r'[ \t]+', ' ', l).strip() for l in t.split('\n')]
    return [l for l in out if l]


def text_of(el):
    return '\n'.join(lines_of(el))


def absurl(u):
    if u.startswith('//'):
        u = 'https:' + u
    elif u.startswith('/'):
        u = BASE + u
    m = re.match(r'(https?://[^/]+)(/.*)', u)
    return m.group(1) + quote(m.group(2), safe="/%._-~") if m else u


def write_json(path, data):
    path = ROOT / path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def write_text(name, lines):
    TEXT.mkdir(parents=True, exist_ok=True)
    (TEXT / name).write_text('\n'.join(lines) + '\n', encoding='utf-8')


def meta_description(s):
    m = s.find('meta', attrs={'name': 'description'})
    return m['content'].strip() if m and m.get('content') else ''


def doc_title(s):
    return re.sub(r'\s+-\s+Italtherm Srl$', '', s.title.get_text().strip())


# ------------------------------------------------------------------ products
def spec_cell(v, label, col, code, file, field):
    v = fix(v, file, field)
    if DIM_LABEL.search(label):
        new = re.sub(r"[*'•]", '×', v)
        new = re.sub(r'(?<=[\d)])MM\b', ' MM', new)
        if new != v:
            log(file, field, v, new)
            v = new
    if label.startswith('DURATA DEL CICLO') and v == '1000°c' and code == 'IT.KB' and col == 3:
        log(file, field, v, 'ABOUT 7-10 MINS')
        v = 'ABOUT 7-10 MINS'
    if v == '' or (label.startswith('CAPACITÀ DELLO STAMPO') and v == 'MOLD CAPACITY'):
        log(file, field, v, DASH)
        v = DASH
    if re.search('[˙˝ˆ]', v):
        sys.exit('unhandled OCR character in %s %s: %r' % (file, field, v))
    return v


def product(n, lang):
    code, group, en_path, it_path = PRODUCTS[n]
    s = soup(EN_PRODUCT_HTML(n) if lang == 'en' else IT_PRODUCT_HTML(n))
    slug = 'it-' + n
    file = 'content/%s/products/%s.json' % (lang, slug)
    raw_lines = []

    title_raw = text_of(s.select_one('.product_title'))
    title = fix(title_raw, file, 'title')

    # short = short description + description tab (unique lines, after corrections)
    sd = s.select_one('.woocommerce-product-details__short-description')
    tab = s.select_one('#tab-description')
    pdf = absurl(sd.select_one('h4 a')['href'])
    raw_short, raw_tab, short = [], [], []

    def blocks(root, sink_raw):
        for ch in root.find_all(['p', 'ul', 'ol'], recursive=False):
            for l in (lines_of(ch) if ch.name == 'p' else [x for li in ch.find_all('li') for x in lines_of(li)]):
                sink_raw.append(l)
                nl = fix(l, file, 'short')
                if nl not in short:
                    short.append(nl)

    # spec table (read first: on some pages the table sits inside a <p>, so it is removed before reading the text)
    caption_el = tab.select_one('h3')
    caption_raw = text_of(caption_el) if caption_el else ''
    rows_raw = [[text_of(c) for c in tr.find_all(['th', 'td'])] for tr in tab.select('table tr')]
    for el in tab.select('table, h3, .wpDataTableContainerSimpleTable'):
        el.decompose()
    blocks(sd, raw_short)
    blocks(tab, raw_tab)
    # table headers keep their site spelling (e.g. "ITAF600"); only generic rules apply
    columns = [fix(c, file, 'specs.columns[%d]' % i) for i, c in enumerate(rows_raw[0][1:])]
    rows = []
    for ri, r in enumerate(rows_raw[1:]):
        label = fix(r[0], file, 'specs.rows[%d].label' % ri)
        vals = [spec_cell(v, label, ci + 1, code, file, 'specs.rows[%d].values[%d]' % (ri, ci)) for ci, v in enumerate(r[1:])]
        rows.append({'label': label, 'values': vals})
    specs = {'columns': columns, 'rows': rows}
    table_title = fix(caption_raw, file, 'table_title')

    # images: gallery order, original size, no duplicates, no generic drawing
    imgs = []
    for im in s.select('.woocommerce-product-gallery img'):
        u = im.get('data-large_image') or im.get('src')
        u = re.sub(r'-\d+x\d+(?=\.\w+$)', '', u)
        if u and 'Tavola-disegno' not in u and u not in imgs:
            imgs.append(u)

    meta_el = s.select_one('.product_meta')
    meta_raw = text_of(meta_el)
    meta = fix(meta_raw, file, 'meta')

    # raw snapshot
    raw_lines += ['## TITLE', title_raw, '## SHORT DESCRIPTION'] + raw_short
    raw_lines += ['## DESCRIPTION TAB'] + raw_tab + ['## TABLE CAPTION', caption_raw, '## TABLE']
    raw_lines += [' | '.join(c.replace('\n', ' / ') for c in r) for r in rows_raw]
    raw_lines += ['## META', meta_raw, '## PDF', sd.select_one('h4 a')['href'], '## DOWNLOAD LABEL', text_of(sd.select_one('h4'))]
    write_text('%s-product-%s.txt' % (lang, n), raw_lines)

    return {
        'slug': slug, 'code': code, 'title': title, 'short': '\n'.join(short), 'specs': specs, 'table_title': table_title,
        'images': imgs, 'pdf': pdf, 'meta': meta, 'group': group,
        'old_path': en_path if lang == 'en' else it_path,
        'download_label': text_of(sd.select_one('h4')),
    }


# ------------------------------------------------------------------ services
def service(html, slug, lang):
    s = soup(html if lang == 'en' else 'it__services__%s.html' % slug)
    file = 'content/%s/services/%s.json' % (lang, slug)
    main = s.select_one('.main-content-area')
    title_raw = text_of(main.select_one('h2'))
    blocks, raw = [], ['## TITLE', title_raw, '## BODY']
    skip_title = True
    for el in main.find_all(['h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li']):
        if el.name != 'li' and el.find_parent('li'):
            continue
        t = text_of(el)
        if not t:
            continue
        raw.append(t)
        if skip_title and el.name == 'h2':
            skip_title = False
            continue
        if t.startswith('Lorem Ipsum is simply free text'):
            log(file, 'body', t, '')  # placeholder text of the theme
            continue
        t = fix(t, file, 'body')
        if el.name == 'li':
            if blocks and blocks[-1]['type'] == 'list' and blocks[-1]['_ul'] is el.find_parent(['ul', 'ol']):
                blocks[-1]['items'].append(t)
            else:
                blocks.append({'type': 'list', 'items': [t], '_ul': el.find_parent(['ul', 'ol'])})
        elif el.name == 'p':
            blocks.append({'type': 'p', 'text': t})
        else:
            blocks.append({'type': 'h', 'level': int(el.name[1]), 'text': t})
    for b in blocks:
        b.pop('_ul', None)
    body = '\n'.join(b['text'] if b['type'] != 'list' else '\n'.join(b['items']) for b in blocks)
    write_text('%s-service-%s.txt' % (lang, slug), raw)
    return {
        'slug': slug, 'title': fix(title_raw, file, 'title'), 'body': body, 'blocks': blocks,
        'old_path': ('/services/%s/' if lang == 'en' else '/it/services/%s/') % slug,
    }


# --------------------------------------------------------------------- pages
def page(slug, lang, en_hero=None):
    html, old = PAGES[slug][lang]
    s = soup(html)
    file = 'content/%s/pages.json' % lang
    pc = s.select_one('.page-content')
    tw = s.select_one('.page-title-wrapper')
    title_raw = text_of(tw.find(['h1', 'h2'])) if tw and tw.find(['h1', 'h2']) else doc_title(s)
    form_lines = []
    raw = ['## TITLE', title_raw, '## DOCUMENT TITLE', doc_title(s), '## META DESCRIPTION', meta_description(s)]
    sections, sec, pending = [], None, None
    els = []
    if pc is not None:
        raw += ['## CONTENT'] + lines_of(pc)
        for f in pc.find_all('form'):
            form_lines = [l for l in lines_of(f, '\n') if l not in ('X/Twitter',)]
        els = [e for e in pc.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li'])
               if not e.find_parent('form') and not (e.name != 'li' and e.find_parent('li')) and text_of(e)]
    for i, e in enumerate(els):
        t = text_of(e)
        nxt = els[i + 1].name if i + 1 < len(els) else ''
        if e.name in ('h1', 'h2'):
            sec = {'kicker': pending or '', 'heading': t, 'blocks': []}
            sections.append(sec)
            pending = None
            continue
        if e.name in ('h3', 'h6') and nxt in ('h1', 'h2'):
            pending = t
            continue
        if sec is None:
            sec = {'kicker': '', 'heading': '', 'blocks': []}
            sections.append(sec)
        if e.name == 'li':
            if sec['blocks'] and sec['blocks'][-1]['type'] == 'list' and sec['blocks'][-1]['_ul'] is e.find_parent(['ul', 'ol']):
                sec['blocks'][-1]['items'].append(t)
            else:
                sec['blocks'].append({'type': 'list', 'items': [t], '_ul': e.find_parent(['ul', 'ol'])})
        elif e.name == 'p':
            sec['blocks'].append({'type': 'p', 'text': t})
        else:
            sec['blocks'].append({'type': 'h', 'level': int(e.name[1]), 'text': t})

    # decided removals (see docs/CHANGES.md): theme placeholder section, wrong phone / address in home contact block
    if slug == 'home':
        dropped = []
        for sc in list(sections):
            if sc['heading'] == 'We made things easier for your business':
                dropped.append(sc['heading'])
                sections.remove(sc)
            elif sc['heading'] in ('Request a contact', 'Richiedici un contatto'):
                sc['blocks'] = []
        if lang == 'it' and en_hero:
            sections[0]['blocks'] = [b for b in sections[0]['blocks'] if b.get('text', '').replace('\u2011', '-') not in en_hero]
        # slider repeats its slides: keep the first occurrence of each block
        seen, uniq = set(), []
        for b in sections[0]['blocks']:
            k = (b['type'], b.get('text'))
            if k not in seen:
                seen.add(k)
                uniq.append(b)
        sections[0]['blocks'] = uniq

    lead = ''
    if slug == 'home':
        hs = [b for b in sections[0]['blocks'] if b['type'] == 'h' and b['level'] == 3]
        sections[0]['heading'] = hs[0]['text']
        lead = hs[1]['text']
        sections[0]['blocks'] = [b for b in sections[0]['blocks'] if b is not hs[0] and b is not hs[1]]
    else:
        for sc in sections:
            ps = [b for b in sc['blocks'] if b['type'] == 'p']
            if ps:
                lead = ps[0]['text']
                sc['blocks'].remove(ps[0])
                break
    lead_raw = lead

    for sc in sections:
        for b in sc['blocks']:
            b.pop('_ul', None)
    # corrections
    out_sections = []
    for si, sc in enumerate(sections):
        for k in ('kicker', 'heading'):
            sc[k] = fix(sc[k], file + '#' + slug, 'sections[%d].%s' % (si, k))
        for bi, b in enumerate(sc['blocks']):
            f = 'sections[%d].blocks[%d]' % (si, bi)
            if b['type'] == 'list':
                b['items'] = [fix(x, file + '#' + slug, f + '.items[%d]' % j) for j, x in enumerate(b['items'])]
            else:
                key = (lang, slug, sc['heading'], b['text'].replace('\u2011', '-'))
                if key in FORCED:
                    log(file + '#' + slug, f + '.text', b['text'], FORCED[key])
                    b['text'] = FORCED[key]
                b['text'] = fix(b['text'], file + '#' + slug, f + '.text')
        out_sections.append({k: v for k, v in sc.items() if not (k == 'kicker' and not v)})
    lead = fix(lead, file + '#' + slug, 'lead')
    pg = {'slug': slug, 'title': fix(title_raw, file + '#' + slug, 'title'), 'lead': lead,
          'meta_description': fix(meta_description(s), file + '#' + slug, 'meta_description'), 'old_path': old, 'sections': out_sections}
    if form_lines:
        pg['form'] = [fix(l, file + '#' + slug, 'form') for l in form_lines
                      if not l.startswith('This field is for validation') and not l.startswith('Questo campo serve per la convalida')]
    write_text('%s-page-%s.txt' % (lang, slug), raw)
    return pg


def main():
    en_hero = None
    for lang in ('en', 'it'):
        write_json('content/%s/site.json' % lang, SITE)
        for n in PRODUCTS:
            write_json('content/%s/products/it-%s.json' % (lang, n), product(n, lang))
        for html, slug in SERVICES:
            write_json('content/%s/services/%s.json' % (lang, slug), service(html, slug, lang))
        pages = []
        for slug in PAGES:
            pg = page(slug, lang, en_hero)
            if lang == 'en' and slug == 'home':
                en_hero = {b['text'] for b in pg['sections'][0]['blocks'] if b['type'] != 'list'}
            pages.append(pg)
        write_json('content/%s/pages.json' % lang, pages)
    write_json('content/corrections.json', LOG)
    print('corrections logged:', len(LOG))


if __name__ == '__main__':
    main()
