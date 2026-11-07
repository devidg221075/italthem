# Restyle ital-therm.it Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, SEO-optimized static EN/IT version of ital-therm.it with all original content preserved.

**Architecture:** Content lives in JSON per language; a dependency-free Node script (`build.mjs`) renders templates into `dist/`. Tests use Node's built-in `node:test`. A content-fidelity report compares original and generated text.

**Tech Stack:** Node 20+ (build and tests only), plain HTML/CSS/JS, PHP for the contact form, `sharp` as dev dependency for image conversion.

**Spec:** `docs/superpowers/specs/2026-11-07-italtherm-restyle-design.md`

## Global Constraints

- Languages: `/en/` and `/it/`, with `hreflang` and `x-default` pointing to `/en/`. Italian text is taken from the live `/it/` pages, never machine-translated.
- Company data: ITALTHERM S.r.l., P.IVA 02487940518, REA Arezzo 220552, info@ital-therm.it.
- Phones: +39 0575 802485 and +39 366 871 9427 only. Address: Viale S. Maria delle Vertighe, 50/B, 52048 Monte San Savino (AR).
- Visual reference: `docs/design/prototype.tpl.html` (hero J, approved). White page, Inter (local, WOFF2 subset, `font-display: swap`) plus JetBrains Mono for model codes; navy #112337, blue #204ce5 / #527eff, logo blue #2f4f9e, grey #6c6d71; WCAG AA contrast. The logo is the original SVG (`logo_vert.svg` from the live site).
- Header: sticky, constant height (76px desktop, 68px mobile) at every scroll position, no extra padding on scroll; mobile drawer menu. Never reuse the section padding class name for state classes.
- Photos: the originals from the live site (user confirmed licence), blended on the page with `mix-blend-mode: multiply`; no automatic cut-outs.
- Content already extracted: `content/original/products.json` (11 products, verbatim) and `docs/CHANGES.md` (corrections and open questions). Unknown values are rendered as a dash, never invented.
- No jQuery, no plugins, no external requests at page load (maps load on click only).
- Original text never rewritten; only the corrections in the spec's table plus those logged in `docs/CHANGES.md`.
- Copyright year updates automatically: build-time year in the HTML plus `<span data-year>` refreshed by a 3-line script.
- Every correction or anomaly found is recorded in `docs/CHANGES.md` for the user.
- Lighthouse 95+ on performance, accessibility, SEO, best practices.

## Review Focus

- Missing original text in a language (an IT page with no IT text): build fails, never falls back silently to English.
- Product with no spec table data: no empty table is rendered, no invented values.
- Contact form: empty fields, missing GDPR consent, honeypot filled, header injection in name/email, repeated submissions.
- Old WordPress URLs with or without trailing slash and with query strings: redirect 301 or 410 as specified.
- Page opened with JavaScript disabled: content, navigation, hreflang and copyright year still correct.

---

## File Structure

```
package.json, build.mjs            build entry
src/lib/content.mjs                loads and validates content JSON
src/lib/render.mjs                 renders a page from template + content
src/lib/seo.mjs                    meta, hreflang, JSON-LD, sitemap, robots
src/lib/images.mjs                 image conversion to WebP/AVIF + srcset
templates/*.html                   layout, header, footer, product, service, page
content/en/*.json, content/it/*.json
assets/css/site.css, assets/js/site.js, assets/fonts/, assets/img/
server/contact.php, server/.htaccess.tpl
scripts/crawl.mjs                  extracts original text into content/
scripts/fidelity.mjs               compares original vs generated text
tests/*.test.mjs
docs/CHANGES.md
```

### Task 1: Project scaffold and content loader

**Files:** Create `package.json`, `build.mjs`, `src/lib/content.mjs`, `tests/content.test.mjs`.

**Interfaces:**
- Produces: `loadContent(lang: 'en'|'it'): Promise<SiteContent>` where `SiteContent = { site, pages: Page[], products: Product[], services: Service[] }`; throws `Error` naming file and field when a required field is missing.

- [ ] **Step 1:** Write `tests/content.test.mjs`: `loadContent('en')` returns 11 products with non-empty `slug`, `title`, `body`; a fixture with a product missing `body` throws an error containing the file name.
- [ ] **Step 2:** Run `node --test tests/content.test.mjs`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `loadContent` in `src/lib/content.mjs` reading `content/<lang>/*.json` and validating required fields.
- [ ] **Step 4:** Run the same command. Expected: PASS.
- [ ] **Step 5:** Commit `chore: scaffold project and content loader`.

### Task 2: Extract original content

**Files:** Create `scripts/crawl.mjs`, `content/en/*.json`, `content/it/*.json`, `docs/CHANGES.md`.

**Interfaces:**
- Consumes: `loadContent` (Task 1), `content/original/products.json` and `content/original/extract.py` (already in the repo).
- Produces: one JSON file per page, product (11) and service (4) per language, plus `content/original/` raw text snapshots used by Task 11. Pages not yet extracted: services (4), home, about, contact, shop, and all `/it/` pages (HTML is fetched with `curl` and retries: the proxy resets some connections, WebFetch paraphrases and must not be used).

- [ ] **Step 1:** Write a test that every URL in the live sitemap list (`page`, `product`, `services`) has a content file or is explicitly listed in `docs/CHANGES.md` as removed demo page.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `scripts/crawl.mjs: crawl(urls: string[]) => Promise<void>` using `fetch` with retries; where the proxy blocks a URL, write its name to `content/MISSING.txt` and stop with a clear message asking the user for a WordPress export (Strumenti > Esporta). Apply only the spec's corrections, and log each one in `docs/CHANGES.md`.
- [ ] **Step 4:** Run the test. Expected: PASS, or `MISSING.txt` empty.
- [ ] **Step 5:** Commit `feat: extract original content`.

### Task 3: Templates and renderer

**Files:** Create `templates/*.html`, `src/lib/render.mjs`, `tests/render.test.mjs`.

**Interfaces:**
- Consumes: `SiteContent` (Task 1).
- Produces: `renderPage(page: Page, lang: string, site: SiteContent): string` returning full HTML with one `<h1>`, header, footer, and `<span data-year>` holding the build year.

- [ ] **Step 1:** Test: rendered HTML has exactly one `<h1>`, the language switcher link to the other language, the footer containing `String(new Date().getFullYear())` inside `data-year`, and no `Lorem ipsum`.
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement `renderPage` with plain string templates and HTML escaping of all content.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: page renderer`.

### Task 4: Design system and styles

**Files:** Create `assets/css/site.css`, `assets/js/site.js`, `assets/fonts/`.

**Interfaces:** Produces CSS custom properties `--bg`, `--fg`, `--accent`, `--accent-2`; `site.js` exports no globals and does three things: mobile menu toggle, copyright year (`document.querySelectorAll('[data-year]')`), consent banner.

- [ ] **Step 1:** Test (`tests/css.test.mjs`): contrast of navy #112337 on white and white on blue #204ce5 computed in the test is >= 4.5; total size of `site.css` + `site.js` < 40 KB; header height equals the same value with and without the scrolled class (guards the mobile bug found in the prototype).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Write the CSS (mobile-first grid, focus styles, `prefers-reduced-motion`) and the JS; subset and self-host fonts as WOFF2.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: design system`.

### Task 5: Home, about, services and catalogue pages

**Files:** Modify `build.mjs`; create `templates/home.html`, `about.html`, `catalogue.html`, `service.html`, `tests/pages.test.mjs`.

**Interfaces:** Consumes `renderPage`. Produces `dist/en/index.html`, `dist/it/index.html`, `about-us`/`chi-siamo`, `products`/`prodotti`, 4 service pages per language.

- [ ] **Step 1:** Test: after `node build.mjs`, all expected files exist in `dist/`, and the home contains the 4 featured product cards and 4 service cards with working `href`s.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement page generation in `build.mjs`; the home "about" section uses an excerpt of the real About text (per user decision).
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: core pages`.

### Task 6: Product pages with specs and quote CTA

**Files:** Create `templates/product.html`, `tests/product.test.mjs`.

**Interfaces:** Consumes `Product`. Produces `/en/products/<slug>/` and `/it/prodotti/<slug>/`; CTA href is `/<lang>/contact/?product=<slug>`.

- [ ] **Step 1:** Test: a product with `specs` renders a `<table>` row per spec; one without renders no table; CTA href contains `?product=<slug>`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the template; specs are rendered only from data extracted from the original text.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: product pages`.

### Task 7: Contact page, PHP form, privacy and consent banner

**Files:** Create `templates/contact.html`, `templates/privacy.html`, `server/contact.php`, `tests/contact.test.mjs`.

**Interfaces:** Produces `contact.php` accepting POST `name, email, email_confirm, message, product, consent, website` (honeypot) and returning JSON `{ok: boolean, error?: string}`.

- [ ] **Step 1:** Test (PHP CLI via `php -r` harness or fixture): rejects empty fields, missing `consent`, mismatched emails, filled `website`, and newlines in `name`/`email`; accepts valid input and calls `mail()` stub with To `info@ital-therm.it`.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement `contact.php` with validation, header-injection stripping and a per-IP rate limit (one file per IP in a temp dir, max 3 per hour). Bozza privacy marked in `docs/CHANGES.md` as needing legal validation.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: contact form and privacy`.

### Task 8: SEO, schema, sitemaps and redirects

**Files:** Create `src/lib/seo.mjs`, `server/.htaccess.tpl`, `tests/seo.test.mjs`.

**Interfaces:** Produces `seoHead(page, lang): string`, `buildSitemaps(pages): Record<string,string>`, `buildHtaccess(map: Redirect[]): string` where `Redirect = {from: string, to?: string, status: 301|410}`.

- [ ] **Step 1:** Test: every page has unique `<title>` and meta description, canonical, `hreflang` en/it/x-default; JSON-LD parses and has `Organization`, `LocalBusiness`, `Product` (on products), `BreadcrumbList`; `.htaccess` has a 301 for the long old About slug and a 410 for each demo page, with and without trailing slash.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement; `robots.txt` allows all and points to the sitemap index.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: SEO and redirects`.

### Task 9: Images and performance

**Files:** Create `src/lib/images.mjs`, `tests/images.test.mjs`.

**Interfaces:** Produces `processImages(srcDir, outDir): Promise<ImageMap>` with 480/960/1600 px WebP and AVIF; templates emit `srcset`, explicit `width`/`height`, `loading="lazy"` except the LCP image.

- [ ] **Step 1:** Test: every `<img>` in `dist/` has `alt`, `width`, `height`; only one image lacks `loading="lazy"` per page.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement with `sharp`; fall back to originals and log to `docs/CHANGES.md` if the originals are too small.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: image pipeline`.

### Task 10: Map, quick actions and no-JS behaviour

**Files:** Modify `templates/contact.html`, `assets/js/site.js`; create `tests/nojs.test.mjs`.

- [ ] **Step 1:** Test: HTML has `tel:` links for both phones, a `https://wa.me/393668719427` link, and a map placeholder with a plain link to the map; no `google.com/maps` request in the initial HTML.
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement the click-to-load map with a fallback link.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: contact quick actions`.

### Task 11: Verification and report

**Files:** Create `scripts/fidelity.mjs`, `docs/CHANGES.md` (final), `docs/WORDPRESS-PHASE2.md`.

- [ ] **Step 1:** `node scripts/fidelity.mjs` compares `content/original/` text with the text in `dist/`; exits non-zero when any original sentence is missing, except those listed in `docs/CHANGES.md`.
- [ ] **Step 2:** Run link checker and HTML validation on `dist/`; run Lighthouse on home and one product in each language. Expected: 95+ in all four categories.
- [ ] **Step 3:** Finalise `docs/CHANGES.md` with every correction and anomaly for the user: typos, placeholder text, the demo pages removed, the phone numbers, and the footer credit.
- [ ] **Step 4:** Write `docs/WORDPRESS-PHASE2.md`: field mapping from `content/*.json` to custom post types with WPML.
- [ ] **Step 5:** Commit, push the branch and open a draft PR.

---

## Self-Review

- **Spec coverage:** structure and URLs (Tasks 5, 6, 8), fidelity (2, 11), style (4), performance (4, 9, 11), SEO (8), product pages (6), contact and privacy (7, 10), redirects (8), WordPress path (11). No gaps.
- **Types:** `SiteContent`, `Product`, `Redirect` are defined in Tasks 1 and 8 and used consistently.
- **Open items from the spec** (missing texts, available images, hosting) are handled in Tasks 2 and 9.
