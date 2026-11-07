# Restyle ital-therm.it: specifica di design

Data: 2026-11-07. Stato: in attesa di revisione.

## Obiettivo

Rifare il sito https://ital-therm.it (ITALTHERM S.r.l., forni per fusione, colata e trattamento termico di metalli preziosi) mantenendo **inalterati tutti i contenuti**, con velocità, SEO, estetica e funzioni molto migliori. La versione WordPress è uno sviluppo successivo (fase 2) e questa architettura la rende facile.

## Decisioni dell'utente

| Tema | Scelta |
|---|---|
| Stack | HTML/CSS/JS statico, generato da un piccolo script di build |
| Lingue | EN e IT, cartelle `/en/` e `/it/`, `hreflang` |
| Stile | Industriale premium: grafite con accenti rame/arancio, font locali |
| Funzioni | Schede prodotto con tabella specifiche e CTA preventivo; Schema.org; mappa e click-to-call/WhatsApp; pagina privacy e banner cookie |
| Pagine demo del tema | Eliminate: 410 o redirect |
| Form contatti | Script PHP sull'hosting dell'utente |
| Telefoni | Fisso +39 0575 802485 e mobile +39 366 871 9427 (lo 0575 810487 viene scartato) |
| Indirizzo | Viale S. Maria delle Vertighe, 50/B, 52048 Monte San Savino (AR) |
| Testo segnaposto in home | Estratto reale dalla pagina "Chi siamo" |

Dati fissi: P.IVA 02487940518, REA Arezzo 220552, email info@ital-therm.it.

## Principio di fedeltà dei contenuti

- Ogni testo originale viene estratto in file di contenuto per lingua (`content/en`, `content/it`), senza riscritture.
- Le uniche modifiche sono le correzioni elencate qui sotto.
- A fine lavoro un **report di verifica** confronta il testo originale con quello generato.
- Se un testo non è recuperabile (il proxy ha bloccato le pagine prodotto e servizi), si chiede all'utente un export da WordPress: nessun testo viene inventato.

## Correzioni

| Dove | Prima | Dopo |
|---|---|---|
| IT.AF, IT.CWA | ANEALING / Anealing | ANNEALING / Annealing |
| IT.MT | MODET IT.MT | MODEL IT.MT |
| IT.GT | Metal Melting Tilting Melting Furnace | Tilting Metal Melting Furnace |
| Home | Lorem ipsum, "The wise man therefore…" | Estratto di "Chi siamo" |
| Privacy e social | link `#` | pagina privacy reale; icone social rimosse |
| Slug "Chi siamo" | frase di circa 140 caratteri | `/en/about-us/`, con 301 dal vecchio |
| Footer/home | link al demo del tema | rimosso |

Da segnalare all'utente, senza modificarli: la dicitura "© Copyright 2026 by Keyidea.it" nel footer e il nome del tema nei meta.

## Architettura

```
content/en/*.json, content/it/*.json   testi e dati (fonte unica)
templates/                             layout HTML parziali
build.mjs                              genera dist/ da content + templates
assets/                                CSS, JS minimo, font locali, immagini originali
dist/                                  output deployabile
```

- Lo script di build non ha dipendenze a runtime nel sito finale.
- Le immagini vengono convertite in WebP/AVIF con `srcset` e `loading="lazy"`.
- I contenuti separati dalla grafica servono per l'import in WordPress (fase 2: custom post type con WPML, stessi slug e redirect).

## Pagine e URL

Per ciascuna lingua: home, catalogo prodotti, 11 schede prodotto, 4 servizi, chi siamo, contatti, privacy. Il vecchio URL di ogni pagina reale ha un redirect 301 verso il nuovo. Le pagine demo (`blog-grid`, `faqs`, `projects-gird`, `pricing`, `cart`, `cart-2`, `checkout`, `checkout-2`, `my-account`, `testimonials`, `team-grid`, `services-gird`, `home`, `content-from-mizox`, `italtherm-continuous-casting-machine` da verificare) rispondono 410 o reindirizzano al catalogo. Il file di redirect è `.htaccess` (hosting con PHP).

## Estetica

Fondo grafite, accenti rame/arancio, tipografia tecnica, foto grandi dei forni, griglia responsive mobile-first, contrasto WCAG AA, navigazione da tastiera, `prefers-reduced-motion` rispettato. Il logo attuale resta.

## Prestazioni

Nessun jQuery né plugin. CSS critico inline più un file piccolo, JS minimo, font locali con `font-display: swap`, immagini ottimizzate, mappa caricata solo al click. Obiettivo Lighthouse 95+ (performance, accessibilità, SEO, best practice), verificato in locale.

## SEO

Title e meta description unici, canonical, `hreflang` EN/IT, sitemap per lingua, `robots.txt` (la regola `Disallow` WordPress attuale viene aggiornata), Open Graph, un solo H1 per pagina, alt text per ogni immagine. Schema.org: Organization, LocalBusiness, Product, BreadcrumbList.

## Funzioni

- Scheda prodotto: descrizione originale, tabella specifiche (solo dati già presenti sul sito), pulsante "Richiedi preventivo" che precompila il prodotto nel form.
- Contatti: click-to-call, WhatsApp, mappa su click.
- Form: invio a `contact.php` su hosting PHP con anti-spam (honeypot e limite di frequenza), consenso GDPR obbligatorio, email a info@ital-therm.it.
- Privacy: pagina e banner cookie. **Il testo legale deve essere validato dall'utente o dal suo consulente**: io fornisco una bozza.

## Verifica

Controllo link rotti, validazione HTML, Lighthouse, report di confronto dei contenuti, test del form e dei redirect.

## Fuori ambito

Versione WordPress (fase 2), e-commerce, blog, nuovi contenuti, traduzioni in altre lingue.

## Aperti

- Recupero dei testi di prodotti, servizi e delle pagine IT (blocco del proxy).
- Quali immagini originali sono disponibili e a che risoluzione.
- Hosting di destinazione e versione PHP.
