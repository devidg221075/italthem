# Correzioni e anomalie trovate

Stato: **bozza**. Elenco aggiornato durante l'estrazione dei contenuti; la scansione completa di tutte le pagine (incluse quelle italiane) si chiude nel Task 2 del piano. Ogni voce dice cosa ho fatto e cosa serve da te.

## Corretti (errore ovvio)

| Pagina | Originale | Corretto |
|---|---|---|
| Prodotti IT.AF, IT.CWA | ANEALING / Anealing | ANNEALING / Annealing |
| Prodotto IT.MT (menu e catalogo) | MODET IT.MT | MODEL IT.MT |
| Prodotto IT.GT | Metal Melting Tilting Melting Furnace | Tilting Metal Melting Furnace |
| IT.CWA, descrizione | "ltalTherm" (L minuscola) | "ItalTherm" |
| IT.CWA, descrizione | "system tor continuous", "atmosphere tor bright" | "for" |
| IT.CWA, tabella | "CONTROLLED ATMOSPHERE WIRE ANNEAUNG FURNACE" | "ANNEALING" |
| IT.CC, tabella | "TEM PO DI FUSIONE", "MELTING TIM E", "TEM PERATURA" | "TEMPO", "TIME", "TEMPERATURA" |
| IT.CC, tabella | "KG240KG" | "240KG" |
| IT.CC e IT.CWA, dimensioni | "900*700'1750MM", "1000'800'1850MM", "2100'850'1830MM" | "900×700×1750 MM", ecc. |
| IT.CC20, tabella | Potenza "305KW" | "35KW" (verificato sul PDF delle specifiche) |
| IT.KB08, tabella | Durata ciclo "1000°c" | "ABOUT 7-10 MINS" (verificato sul PDF) |
| Chi siamo (EN) | Frase duplicata sotto "Why Choose ITALTHERM" | "These technologies ensure thermal uniformity, repeatability and consistent results in processing." (traduzione del testo italiano, deciso da te) |
| Contatti (EN) | "to require information or estimate of costs" | "to request information or an estimate of costs" |
| Home e Chi siamo | "high‑technology" con trattino non divisibile (U+2011) | trattino normale |
| Pagina Chi siamo | slug di circa 140 caratteri | `/en/about-us/`, con redirect 301 |

## Da confermare con te (non posso indovinare)

| Dove | Problema | Domanda |
|---|---|---|
| IT.KB04, tabella | Potenza 35KW sul sito, 45KW nel PDF | Quale è corretto? |
| IT.KB08, tabella | Potenza e alimentazione sono segnaposto ("POWER", "POWER SOURCE") nel PDF; sul sito la potenza è vuota | Valori corretti |
| IT.KB04 e IT.KB08, tabella | "CAPACITÀ DELLO STAMPO" mostra "MOLD CAPACITY" (segnaposto) sia sul sito sia nel PDF | Capacità corretta (IT.KB02 è "2 PCS 1 KG BAR") |
| IT.CC05, tabella | Velocità di colata "0-20 CM/M" sul sito, "10-20CM/M" nel PDF | Quale è corretto? |
| IT.KB | Il PDF si chiama "Mod IT.BK", il sito "IT.KB" | Quale sigla è quella ufficiale? |
| Chi siamo EN/IT | La versione italiana è molto più ricca di quella inglese | Allineo l'inglese all'italiano? |
| Home | Testo segnaposto "Lorem ipsum" e "The wise man therefore…" | Sostituito con un estratto di "Chi siamo" (deciso) |
| Telefoni | Fisso 0575 810487 nella sezione contatti | Scartato (deciso) |
| Indirizzo | "Loc. Le Vertighe, 50" | Scartato, uso "Viale S. Maria delle Vertighe, 50/B" (deciso) |
| Privacy | Il link è "#" | `/en/privacy/` e `/it/privacy/` sono una BOZZA scritta da me (testo in `src/lib/privacy.mjs`): va validata da te o dal tuo consulente prima della pubblicazione. Da verificare in particolare: basi giuridiche, conservazione delle email, fornitori di hosting/posta indicati come responsabili del trattamento |
| Barra avviso in basso | Testo scritto da me ("Questo sito non usa cookie di tracciamento o pubblicitari…"), cookie tecnico `it_notice` per 6 mesi | Conferma il testo; in `src/lib/render.mjs` |
| Modulo contatti | Non invio i campi "Azienda" e "CAPTCHA" (antispam: campo trappola nascosto, limite di 3 richieste/ora per IP) | Va bene? |
| Social | Icona X/Twitter con link "#" | Rimossa, a meno che tu abbia un profilo |
| Footer | "© Copyright 2026 by Keyidea.it" | Sostituito da copyright Italtherm con anno automatico; credito Keyidea da tenere? |
| Tema | Link "Explore now" al demo del tema | Rimosso |
| Tabelle | Etichette bilingui "VOLTAGGIO / VOLTAGE" in pagine inglesi | Le tengo bilingui come sull'originale |

## Pagine demo del tema da eliminare (410 o redirect)

`blog-grid`, `faqs`, `projects-gird`, `pricing`, `cart`, `cart-2`, `checkout`, `checkout-2`, `my-account`, `testimonials`, `team-grid`, `services-gird`, `home`, `content-from-mizox`, `italtherm-continuous-casting-machine` (verificata: bozza duplicata di "Chi siamo" con contatori del tema, nessun contenuto proprio; va reindirizzata a Chi siamo).

## Scelte di presentazione (non modificano i testi)

- I nomi prodotto, scritti in maiuscolo sul sito, sono mostrati in Title Case.
- I codici modello (IT.CC, IT.AF…) sono evidenziati come etichetta.
- Le foto sono quelle del sito (©FOTO SCHINCO): hai confermato di averne la licenza.

## Correzioni aggiuntive applicate nell'estrazione (Task 2)

Tutte registrate in `content/corrections.json` (file, campo, originale, corretto). Il testo originale resta in `content/original/text/`.

| Dove | Originale | Corretto |
|---|---|---|
| Tutte le tabelle prodotto (EN e IT) | Separatori di dimensioni `*`, `'`, `•` e unità attaccata ("900*700'1750MM", "850'1800*1500MM(L*W'H)") | "900×700×1750 MM", "850×1800×1500 MM(L×W×H)" |
| IT.KB, IT.GT | Caratteri illeggibili (OCR) negli intervalli: "12˙20 MINS", "7˙10", "10˝20 MIN", "K˝TYPE" | "12-20 MINS", "7-10", "10-20 MIN", "K-TYPE" |
| IT.GT, tabella | "30KW ˙ADJUSTABLEˆ" | "30KW (ADJUSTABLE)" |
| Tabelle con cella vuota o segnaposto | cella vuota (IT.AF zona di riscaldamento, IT.KB08 potenza), "MOLD CAPACITY" (IT.KB04, IT.KB08) | "—" (restano nelle domande aperte) |
| Prodotti, servizi, Chi siamo | trattino non divisibile (U+2011) in "inert‑gas", "mesh‑belt", "high‑quality"… | trattino normale (estensione della correzione già decisa per Home e Chi siamo) |
| Servizio Gear-Driven (Home EN/IT e pagina servizio) | "Gear-Driven Metal Melting Tilting Melting Furnace" | "Gear-Driven Tilting Metal Melting Furnace" |
| Servizio Gear-Driven | Paragrafo segnaposto "Lorem Ipsum is simply free text…" | Rimosso dal corpo (resta nello snapshot) |
| Home EN e IT | Sezione segnaposto del tema ("About our company… We made things easier for your business…", "Lorem ipsum", Businesses Growth…), telefono 0575 810487, "Loc. Le Vertighe" | Non importati (decisioni già prese) |
| Home IT | Testi inglesi rimasti dal tema nel carosello ("High-technology systems", "About Us", "Precision Meets Affordability", "Services", "Exceptional value", "Products") | Non importati nella versione italiana |
| Prodotti, tag e SKU | "ANEALING" e "ANNEAUNG" anche nel campo SKU/Tag di IT.CWA e IT.AF | "ANNEALING" |

## Anomalie trovate nell'estrazione e NON corrette (da confermare)

Il testo resta com'è sul sito; propongo la correzione tra parentesi.

| Dove | Anomalia | Proposta |
|---|---|---|
| IT.AF, tabella | Intestazione "ITAF600" (manca il punto) | "IT.AF600" |
| IT.CWA, tabella | Intestazione "IT-CWA2" | "IT.CWA2" |
| IT.BF, tabella | Dimensioni "1000(L)×6o(w)×3o(H) MM", "3970(L)×sso(w)×1448(H) MM": lettere al posto di cifre (OCR) | Valori reali, verificare sul PDF |
| IT.BF, tabella | "GAS PROTETTIVO / PROTECTIVE GAS" contiene "880 ° C/80 MIN" (è un ciclo termico, non un gas) | Gas corretto |
| IT.BF, IT.MT, tabella | "M M" al posto di "MM" ("…(H)M M", "1050 M M") | "MM" |
| IT.GMB, tabella | "(VARIABILE /ADJUSTABLE" senza parentesi chiusa, "ARGENTO/ SILVER:15 K" troncato | Completare |
| IT.FM, tabella | "FORNITO/ EQUIPPE" | "EQUIPPED" |
| IT.MT, IT.SM, IT.FM, tabella | "MAX TEMPERATUR" | "MAX TEMPERATURE" |
| IT.MT, titolo tabella | "MANUAL TILT/NG METAL MELT/NG FURNACE" (la I letta come /) | "MANUAL TILTING METAL MELTING FURNACE" |
| IT.CWA, descrizione | "ItalTherm ItalTherm Continuous Wire Annealing Furnace A high-precision…": nome ripetuto, punto mancante dopo "Furnace", a capo spurio prima di "oxide-free" | Rimuovere un "ItalTherm", aggiungere punto, unire la riga |
| IT.CC, descrizione | La scheda ha due versioni del titolo: "ItalTherm Continuous Casting Machine:" (breve) e "ItalTherm CONTINUOUS CASTING METAL MELTING FURNACE :" (scheda). Importate entrambe, la seconda è una riga a sé | Tenere una sola riga |
| IT.AF, descrizione | Voce di elenco spezzata male: "Rapid Cooling and Protective AtmosphereRobust / Design and Smart Safety Features" (anche in italiano: "atmosfera protettivaRobusto") | "…Protective Atmosphere" e "Robust Design and Smart Safety Features" (come nella pagina del servizio) |
| IT.SM, IT.FM, descrizione | Punti mancanti ("homogeneous alloys", "chemical reagents Sealed operation"), "thin flaks" | Punteggiatura, "flakes" |
| Servizio Gear-Driven | "small to medium-scale" nel servizio, "small to large-scale" nell'estratto della Home; asterischi di markdown rimasti ("*Key Features & Advantages:", "*aluminum-housed gear reduction motor*") | Scegliere la frase, togliere gli asterischi |
| Servizi in italiano | Le 4 pagine `/it/services/…` sono identiche a quelle inglesi (non tradotte) | Tradurre (serve il tuo testo italiano) oppure lasciare l'inglese |
| Home (EN/IT) | Gli estratti dei 4 servizi sono troncati a metà frase ("designed for continuous", "engineered for the continuous annealing of precious‑metal wires,") | Nel nuovo sito uso la prima frase del servizio |
| Modulo contatti | La versione italiana ha il campo "Azienda" e "CAPTCHA", quella inglese no; il link alla privacy è `#` | Allineo l'inglese all'italiano |
| Titolo pagina Home | Il sito non ha un titolo visibile (il tag `<title>` è "Home Italtherm") | Uso "Home" nel menu, tagline come H1 |
| Meta description IT di Chi siamo e Prodotti | Testo generato automaticamente, unione di titoli senza spazi | Riscrivo le meta description (Task SEO) |
| Titoli IT dei prodotti | Non contengono la sigla modello (es. "FORNO STATICO FUSIONE METALLI"): la sigla è nelle intestazioni della tabella | La sigla è mostrata come etichetta |
| IT.GMS / IT.GMB | Associazione fatta dalle sigle in tabella: "GRANULI" = IT.GMS, "GRANIGLIA" = IT.GMB | Confermare |
| Nomi dei PDF | "…MODET IT.MT.pdf", "…Mod-IT.BK_.pdf", "…ANEALING…pdf": gli URL non si cambiano (file esistenti), restano i refusi nel nome file | Rinominare i PDF se vuoi |

## Estrazione dei contenuti: come rigenerare

- `node scripts/crawl.mjs <url[=file.html]> …` scarica le pagine con `curl` (6 tentativi, il proxy resetta connessioni a caso) in `content/original/html/`; le pagine non scaricabili finiscono in `content/MISSING.txt` e lo script si ferma chiedendo l'esportazione WordPress (Strumenti > Esporta). Esporta anche `crawl(urls)`.
- `python3 -I scripts/extract-content.py` rigenera da quell'HTML: `content/{en,it}/{site.json,pages.json,products/*.json,services/*.json}`, gli snapshot di testo originale `content/original/text/<lingua>-<tipo>-<nome>.txt` e `content/corrections.json`. Il testo è copiato dall'HTML; le uniche modifiche sono le regole nello script (tutte elencate qui sopra).
- `content/original/sitemap-urls.txt`: URL dei sitemap live (`page`, `product`, `services`). `tests/crawl.test.mjs` verifica che ognuno abbia una voce (campo `old_path`) o sia una pagina demo elencata sopra.
- Formato: `short` = descrizione completa, una riga per paragrafo o voce di elenco (separatore `\n`); `specs.columns` = sigle dei modelli, `specs.rows[].values` allineati alle colonne; `table_title` = titolo della tabella; `pages[].sections[]` = `{kicker?, heading, blocks:[{type:'p'|'list'|'h', …}]}` con `lead` tolto dal primo paragrafo; `services[].blocks` ripete `body` con la struttura (titoli e liste); `old_path` = vecchio URL (per i redirect 301).

## Design system (Task 4)

- Font: Inter (variabile 400–800, unico carattere del sito: etichette, sigle modello, breadcrumb, badge, contatori e intestazioni di tabella usano Inter con peso 600/700, maiuscolo spaziato e cifre tabulari; JetBrains Mono è stato rimosso su richiesta del titolare, `docs/design/prototype.tpl.html` resta come riferimento storico) scaricato da Google Fonts (gstatic) e ospitati in `assets/fonts/` come WOFF2, solo sottoinsiemi latin e latin-ext (accenti italiani); `font-display: swap`, nessuna richiesta a terzi.
- Header: altezza costante 76px (68px sotto i 600px); la classe di stato `is-scrolled` cambia solo ombra/bordo (test statico in `tests/css.test.mjs`, misura reale con `scripts/check-layout.mjs`). Il bordo è un box-shadow (non un `border`) così l'altezza è esattamente 76/68px. Il prototipo aveva un conflitto di nome con `.sc` (sezione) che faceva crescere l'header allo scroll: lo stato ora usa un nome dedicato.
- Senza JavaScript: contenuto visibile, i link del menu appaiono come elenco statico sotto l'header (sotto i 1000px), prima slide dell'hero e prima immagine della galleria visibili, slider/miniature/frecce nascosti (si attivano con la classe `js`).
- Banner del consenso: la brief originale di Task 4 lo citava in `site.js`; non è stato implementato (nessun cookie/tracker nel sito statico). Da decidere se serve.

## SEO, sitemap e redirect (Task 8)

- Titoli: `<titolo pagina> | ITALTHERM`, accorciati con "…" solo oltre 70 caratteri (solo 6 titoli italiani di prodotto superano 60 caratteri, il più lungo è tagliato a 69; in inglese la parola "Model"/"Mod" è tolta dal titolo). La Home usa un titolo breve ricavato dal suo testo ("ITALTHERM – Industrial Furnaces for Precious Metals" / "ITALTHERM – Forni industriali per metalli preziosi") invece del titolo WordPress "Home Italtherm"; "About" diventa "About us".
- Meta description: sempre un estratto di testo esistente (120–160 caratteri, tagliato a fine frase o a fine parola), mai testo nuovo. Il campo `meta_description` dell'originale è usato quando è utilizzabile; non lo era in questi casi, quindi uso il testo introduttivo: Home (identico al primo paragrafo di Chi siamo), Prodotti EN (frammento in minuscolo), Prodotti IT (nomi dei prodotti incollati in maiuscolo), Chi siamo IT (parole attaccate "ITALTHERMTecnologie"). Per Prodotti, che non ha testo, la descrizione è un estratto del primo paragrafo di Chi siamo. GMB e GMS iniziano con lo stesso paragrafo: GMS usa i paragrafi successivi, per avere descrizioni diverse.
- Le 4 pagine servizio in italiano hanno ancora il testo inglese (anomalia già elencata sopra), quindi titolo e descrizione coincidono con quelli inglesi; l'unicità è garantita per lingua.
- Immagine social (og:image): foto principale della pagina; Home = prima foto dell'hero; Contatti e Privacy usano la stessa foto della Home (non esiste un'immagine social dedicata 1200×630). Da decidere se ne vuoi una.
- Favicon: `assets/img/favicon.svg` (solo il simbolo del logo su sfondo bianco arrotondato) più `icon-192.png` e `apple-touch-icon.png` generate dallo stesso SVG con Chromium (il JPG originale del logo non è nel repository, e Pillow non legge l'SVG). Nessun `favicon.ico`: i browser moderni usano l'SVG.
- Dati strutturati: Un solo nodo Organization+LocalBusiness e WebSite (Home), collegati con `@id` da WebSite e Product, BreadcrumbList (pagine interne), Product (22 schede, senza prezzo, offerta o valutazioni). Nessun orario, coordinate o recensioni inventati. Il `vatID` è scritto come nel sito (02487940518, senza "IT").
- `robots.txt`: consente tutto e indica `sitemap.xml`. Le vecchie regole WordPress (`Disallow: /wp-admin/`…) sono state tolte perché non esiste più un'area admin e CSS/JS devono restare leggibili.
- Redirect (`dist/.htaccess`, generato da `server/.htaccess.tpl`): 301 per ogni vecchio URL del contenuto (con o senza slash finale, query string eliminata), `/shop/` → `/en/products/`, `/it/shop/` → `/it/prodotti/`, `/home/` → `/en/`, `/product-category/ital-therm/` → catalogo. 410 per le 13 pagine demo del tema. Due pagine demo non danno 410 ma 301, come indicato sopra: `home` (→ Home) e `italtherm-continuous-casting-machine` (→ Chi siamo). Le varianti `/it/<slug>/` delle pagine demo sono incluse per prudenza.
- NON reindirizzati: i vecchi file `/wp-content/uploads/...` (immagini e PDF). I link esterni che puntano a quei file daranno 404; le immagini dei prodotti ora sono in `/assets/img/src/` e i PDF in `/assets/docs/`.
- Redirect: tutti i target sono assoluti (`https://ital-therm.it/...`) e il blocco 301/410 viene prima delle regole su `www`/`http`, quindi ogni vecchio URL richiesto da qualsiasi schema o host arriva alla pagina finale con un solo salto. Una regola dedicata aggiunge lo slash finale alle cartelle già costruite (`/en/products` → `/en/products/`), con `DirectorySlash Off`.
- Cache: CSS e JS hanno nel link `?v=<hash del file>` (calcolato dalla build) e restano in cache 1 anno `immutable`; font 1 anno; immagini e favicon 1 settimana (i nomi non hanno l'hash); HTML `no-cache`. Non sono impostati HSTS né Content-Security-Policy (da valutare dopo il passaggio in produzione, soprattutto per la mappa su clic).
- Sicurezza contact form: gli indirizzi IPv4 mappati in IPv6 (`::ffff:a.b.c.d`) usano ora lo stesso limite di frequenza dell'IPv4 corrispondente (prima finivano nel raggruppamento `/64` di `::`, condiviso da tutti i visitatori IPv4 mappati).
- `/404.html`: pagina bilingue con `noindex`, usata anche per i 410; non è nella sitemap.

## Immagini, tipografia e prestazioni (Task 9)

- **Rigenerare le immagini ottimizzate:** `npm install` (sharp è solo devDependency) poi `npm run images` (`scripts/optimize-images.mjs`). Legge `assets/img/src/*.jpg` (originali, restano nel repo e NON vanno in `dist/`) e scrive in `assets/img/opt/` WebP a 480/960/1600 px (mai ingrandite; una sorgente più stretta di 480 px ha una sola variante alla sua larghezza), qualità 80, nome `<base>-<w>.<hash8>.webp` (hash del contenuto) più `manifest.json`. Gli output sono committati: `node build.mjs` funziona offline senza strumenti di immagine. Dopo aver aggiunto/cambiato un originale (`node scripts/fetch-images.mjs`) rilanciare `npm run images` e committare `assets/img/opt/`.
- AVIF non generato: il bianco di studio con `mix-blend-mode: multiply` richiede bianco pulito e WebP è universale; l'HTML è già pronto per `<picture>` se servisse.
- Ogni `<img>` ha `srcset`/`sizes`, `width`/`height` intrinseci, `decoding="async"` e `loading="lazy"`; l'unica eccezione per pagina è l'immagine LCP (`fetchpriority="high"`: prima slide dell'hero, prima immagine della galleria prodotto, prima card del catalogo, primo blocco di Chi siamo). Home e schede prodotto hanno anche `<link rel="preload" as="image" imagesrcset…>` per l'immagine LCP.
- Cache: i file ottimizzati con hash sono `immutable` per un anno (`.htaccess`); favicon, icone PNG e logo SVG restano a 7 giorni.
- `<head>`: preload del solo `inter-latin-var.woff2`, `<meta name="color-scheme" content="light">`, classe `js` impostata da uno script inline prima del primo rendering (senza, i controlli del carosello comparivano a JS caricato e spostavano la pagina: CLS 0,07-0,10; ora 0), font di riserva "Inter Fallback" con metriche allineate.
- Tipografia: solo Inter (vedi sopra); `tests/css.test.mjs` fallisce se compaiono `monospace`/JetBrains.
- Misure: `node scripts/perf-report.mjs [--desktop] [--lighthouse]` (non fa parte di `npm test`).
- Nota: `dist/assets/docs` contiene due PDF da 21 e 33 MB (it-af, it-sm), invariati; non sono immagini ma pesano quasi tutto `dist/`.

## Nuovo design dai mockup approvati (restyle, fase 1: fondamenta e homepage)

Riferimento: tavola master e mockup approvati (Light Premium / Minimal Titanium). Si riparte da zero sulla parte visiva (template, CSS, layout) e si riusano contenuti, build, SEO, redirect, form PHP e pipeline immagini. Una pagina per volta.

### Fatto in questa fase
- **Design system:** palette della master (`#0754BC`, `#1E3A66`, `#D9DEE7`, `#F4F6FA`, `#2E3445`, `#C9D1DE`), Manrope (titoli) + Inter (testi) in locale (WOFF2 latin e latin-ext), griglia 1280 px, pulsanti primario/secondario.
- **Header** fisso (80 px desktop, 68 px mobile, costante allo scroll) con mega menu Prodotti (4 famiglie e 4 macchine), **drawer mobile** con pannello Prodotti a scorrimento, **footer** a 4 colonne (accordion su telefono) e **striscia CTA** "Hai un progetto da realizzare?" (non su home e contatti, che hanno già una sezione contatto).
- **Homepage:** hero con titolo, sottotitolo, pulsante e carosello delle macchine; riga IT.CC / IT.GT / IT.AF / IT.GMS con icone; sotto, le sezioni esistenti con i contenuti reali nel nuovo stile.
- **Logo:** `assets/img/italtherm.svg` è il file ufficiale fornito; modificato solo il `viewBox` (ritaglio sul disegno, 724×183), nessun tracciato toccato.

### Deviazioni dai mockup, decise o da confermare
| Dove | Mockup | Cosa ho fatto | Stato |
|---|---|---|---|
| Mega menu | 3 famiglie (fusione, colata continua, trattamenti termici) | Aggiunta "Produzione grani" (IT.GMS), coerente con home, catalogo e footer | Deciso |
| Foto del hero | Rendering illustrativo con colata | Foto reali dei macchinari (IT.GT, IT.CC, IT.AF, IT.GMS); IT.GT per prima perché è la più leggera (36 KB contro 129 KB di IT.CC) | Da confermare |
| Puntini del carosello | 3 | 4, uno per macchina | Da confermare |
| Ricerca nell'header | Icona lente | Inserita: pannello di ricerca nel browser su prodotti, servizi e pagine (codice, nome, testo; frecce, Invio, Esc). Indice JSON per lingua, caricato solo al primo clic; nessun servizio esterno | Fatto (richiesto) |
| Pulsante "Guarda il video" | Presente | Non inserito: la pagina Video non esiste ancora; lo aggiungo insieme alla pagina | In attesa dei materiali |
| Voci di menu Video e Assistenza | Presenti | Non inserite: pagine senza contenuti originali | In attesa dei materiali |
| Cookie Policy nel footer | Link presente | Nuova pagina `/it/cookie-policy/` e `/en/cookie-policy/`, con link nel footer. **BOZZA scritta da me**: descrive solo il cookie tecnico `it_notice` (180 giorni, solo alla pressione di OK) e che non ci sono cookie di analisi o pubblicità; va validata da te o dal tuo consulente | Fatto, da validare |
| Etichetta "Azienda" | Menu "Azienda" | Menu "Azienda" (IT) e "Company" (EN); il titolo SEO della pagina resta "Chi siamo" / "About us" | Deciso |
| Kicker del hero | "INDUSTRIAL FURNACES FOR PRECIOUS METALS" anche in italiano | Mantenuto in italiano con `lang="en"`; in inglese "Italian technology" | Da confermare |
| Testi del hero | Testi del mockup | Titolo e sottotitolo come nel mockup (sintesi del testo originale); EN tradotti dal testo inglese originale | Da confermare |
| Mega menu, voci a sinistra | Famiglie | Ogni voce porta alla scheda della macchina rappresentativa (IT.GT, IT.CC, IT.AF, IT.GMS) | Da confermare |

### Dati dei mockup scartati (non usati)
| Dove | Nel mockup | Uso |
|---|---|---|
| Indirizzo | "Loc. Le Vertighe, 50" (e "Sonico (BS)" nel footer della master) | "Viale S. Maria delle Vertighe, 50/B, 52048 Monte San Savino (AR)" |
| Telefono | 0575 810487 | +39 0575 802485 e +39 366 871 9427 |
| Conteggi dei filtri del catalogo | Somma 10, scritti "11 prodotti" | Calcolati dai prodotti reali (11) |
| Statistiche mobile "40+ anni, 500+ impianti, 30+ paesi", durata video "3:24" | Bozze | Non usate (nessun numero inventato) |
| Nome di IT.AF | "Forni di affinazione" (master), "Sistemi di trattamento termico" (menu) | "Ricottura" / titolo reale "Forno di ricottura in atmosfera controllata" |

### Tecnico
- Test aggiornati al nuovo design (token, font, struttura home); nuovo `tests/layout.test.mjs` per header, mega menu, drawer, footer e striscia CTA.
- Il logo SVG è escluso dal controllo "un solo `<img>` non lazy" e dal controllo WebP delle foto, ma ha i suoi controlli (alt, dimensioni, `decoding`, file presente).
- Le foto del mega menu sono `loading="lazy"` e nascoste: non pesano sul primo caricamento.
- `site.css` + `site.js` restano sotto 40 KB (limite del test).
- Le pagine non ancora rifatte (catalogo, scheda prodotto, Chi siamo, Contatti, privacy) usano il nuovo header e footer e i nuovi colori; il layout interno sarà rifatto una pagina per volta.

### Ricerca e Cookie Policy (aggiunte dopo la prima tranche)
- Ricerca: `src/lib/search-index.mjs` genera `dist/assets/search-<lingua>.json` (11 prodotti con codice, titolo, sigle modello e testo; 4 servizi; 5 pagine). `assets/js/search.js` e `assets/css/search.css` si caricano al primo clic sul pulsante (non contano nei 40 KB di `site.css` + `site.js`). L'overlay è costruito solo con l'API DOM (nessun `innerHTML`).
- Cookie Policy: testo in `src/lib/privacy.mjs` (`COOKIES`), pagina in sitemap e linkata dal footer; l'informativa privacy e la cookie policy dicono la stessa cosa sul cookie `it_notice`.
- Tre test nuovi per lingua in `tests/search.test.mjs`.

## Catalogo (pagina Prodotti nel nuovo stile)

Fatto: banner con titolo, barra laterale dei filtri, conteggio, ordinamento, griglia di card; su telefono elenco con miniature e pannello filtri richiudibile. CSS e JS del catalogo sono in `assets/css/catalogue.css` e `assets/js/catalogue.js`, caricati solo in questa pagina.

| Dove | Mockup | Cosa ho fatto | Stato |
|---|---|---|---|
| Titolo | "La nostra gamma di macchinari" / "Our range of machines" | H1 e sottotitolo come nel mockup (testo nuovo, non presente nel sito originale); "Prodotti" è il kicker sopra il titolo. Il tag `<title>` e la meta description non cambiano | Da confermare |
| Filtro "Lavorazione" | Colata continua (2), Fusione (3), Ricottura (2), Produzione grani (3) | Le tre famiglie reali dei prodotti: Forni di fusione (4), Trattamento termico (3), Sistemi di produzione (4). I conteggi sono calcolati dai dati | Deciso |
| Filtro "Capacità" | Fino a 10 / 10–50 / oltre 50 kg (3, 4, 3) | Fino a 10 kg (4), 10–50 kg (7), oltre 50 kg (2), calcolati sulla capacità **in oro** letta dalla tabella tecnica. Un prodotto compare in ogni fascia in cui cade uno dei suoi modelli | Da confermare |
| Prodotti senza capacità | — | IT.AF, IT.BF, IT.CWA e IT.KB non hanno una capacità nella tabella (IT.KB ha solo la capacità dello stampo): compaiono solo senza filtro capacità, e la pagina lo dice | Da confermare |
| Foto del banner | Rendering con colata | Sfondo chiaro con diagonale, senza foto | Da confermare |
| Ordina per | Rilevanza | Rilevanza (IT.CC, IT.GT, IT.AF, IT.GMS e poi gli altri) e Codice A–Z | Fatto |
| "Catalogo completo, Scarica il PDF" (mobile) | Card con PDF | Non inserita: non esiste un PDF del catalogo completo (solo le schede tecniche dei singoli prodotti) | In attesa del file |
| Applica filtri | Pulsante | I filtri si applicano subito; il pulsante chiude il pannello su telefono e porta ai risultati | Fatto |
| Senza JavaScript | — | Tutte le 11 card visibili, senza filtri | Fatto |
| `?g=melt|heat|prod` | — | Preseleziona una famiglia (per i link dal menu) | Fatto |

## Scheda prodotto (modello IT.CC, valida per tutti gli 11 prodotti)

Fatto: breadcrumb, galleria con miniature, kicker con la famiglia, codice grande + titolo nell'unico `h1`, introduzione, pulsanti "Richiedi un preventivo" e "Scarica scheda PDF", tab (Descrizione, Modelli e dati tecnici, Documentazione) con tabella dei modelli, poi "Altri forni". CSS e JS della scheda sono in `assets/css/product.css` e `assets/js/product.js`, caricati solo nelle schede; le regole vecchie sono state tolte da `site.css` e `site.js`.

| Dove | Mockup | Cosa ho fatto | Stato |
|---|---|---|---|
| Elenco "Elevata produttività / Qualità costante / Affidabilità e lunga durata / Personalizzazione su richiesta" | Presente | Non inserito: testo non presente nel sito originale, uguale per tutti i prodotti | Da confermare |
| Tab "Video" e "Accessori" | Presenti | Non inserite: nessun contenuto | In attesa dei materiali |
| Tab "Documentazione" | Presente | Contiene il PDF delle specifiche e la riga SKU / Category / Tag dell'originale (nota: "Category: Ital-therm" viene dal vecchio WordPress) | Da confermare |
| Introduzione accanto alla galleria | Frase di presentazione | Primo paragrafo reale della descrizione (se la prima riga è un titolo breve che finisce con ":", si usa il paragrafo dopo). La descrizione completa è nella tab Descrizione | Fatto |
| Tab aperta | "Modelli e dati tecnici" | Aperta all'avvio; se il prodotto non ha tabella, si apre "Descrizione". Senza JavaScript sono visibili tutti i pannelli | Fatto |
| Breadcrumb | Home › Prodotti › Colata continua › IT.CC | Home › Prodotti › IT.CC, uguale ai dati strutturati (BreadcrumbList) | Deciso |
| Kicker | "Colata continua" | La famiglia reale (Forni di fusione, Trattamento termico, Sistemi di produzione) | Deciso |
| Pulsante PDF | "Scarica scheda PDF" | Testo del mockup (EN: "Download PDF datasheet") invece di "SCARICA SPECIFICHE TECNICHE" dell'originale; il file è lo stesso | Da confermare |
| Pulsante "Contattaci" | Non c'è | Tolto (c'è solo "Richiedi un preventivo" con il prodotto già indicato nel modulo) | Fatto |
| Immagine principale | Rendering con video e oro | Foto reali del sito; le miniature sono quelle disponibili (1–5 per prodotto) | Fatto |
| Tabella | Intestazione con i modelli | Intestazione con i modelli, colonne centrate, celle con "—" accessibili come prima | Fatto |
| Tab nella versione mobile approvata | Modelli, Dati tecnici, Vantaggi, Accessori | Le stesse tre tab (scorrono in orizzontale su telefono); "Vantaggi" e "Accessori" non hanno contenuto | Da confermare |

I dati da confermare nelle tabelle (potenza IT.KB04, velocità di colata IT.CC05, sigle con il punto mancante, ecc.) restano nella sezione "Da confermare con te" sopra: non li ho toccati.

## Tipografia (fedeltà alla master)

Manrope Bold/SemiBold per titoli e gerarchie, Inter Regular/Medium per testi, interfaccia e navigazione, Inter SemiBold per i pulsanti e le etichette maiuscole (kicker). Tolti Manrope 800 e Inter 700, tolta la spaziatura negativa dei titoli. Gli `@font-face` coprono solo i pesi usati (Manrope 600–700, Inter 400–600). `tests/typography.test.mjs` controlla pesi, famiglie e scala principale (corpo 16/1.6, navigazione 16 Medium, pulsanti 16 SemiBold, H1 fino a 56, H2 fino a 40).

## Azienda (Chi siamo nel nuovo stile)

CSS in `assets/css/about.css` (solo questa pagina). Struttura del mockup variante B: hero, striscia di 4 punti con icone, "Chi siamo" con foto, tre schede delle soluzioni.

| Dove | Mockup | Cosa ho fatto | Stato |
|---|---|---|---|
| Titolo e sottotitolo | "Tecnologia italiana per i metalli preziosi" / "Progettiamo e realizziamo impianti…" | Testi del mockup (nuovi); in inglese "Italian technology for precious metals" e frase equivalente | Confermato dall'utente |
| Striscia delle 4 icone | Progettazione e produzione interna / Soluzioni su misura / Tecnologia e affidabilità / Supporto tecnico dedicato | I 4 punti reali di "Perché scegliere ITALTHERM" (testi originali, più lunghi), con icone | Deciso |
| Blocco "Chi siamo" | Testo + pulsante "La nostra storia" | Titolo del mockup, testi reali (frase di apertura e paragrafo); **pulsante non inserito**: non esiste una pagina "storia" | Da confermare |
| Tre schede | Fusione / Colata continua / Trattamenti termici, ciascuna con una riga | Le tre soluzioni reali con tutti i loro elenchi; il titolo di ogni scheda è quello originale | Deciso |
| Foto | Edificio, colata, monete | Foto reali dei macchinari (vassoio di rame IT.AF, IT.MT in uso, IT.CC, IT.AF); la foto dell'edificio non c'è | In attesa delle foto |
| Frase "Queste tecnologie assicurano…" | — | Resta come frase di chiusura sotto le schede (è testo originale) | Fatto |
| "Sostenibilità e responsabilità" (bozza mobile) | Bozza | Non usato: non c'è nel sito | Scartato |

`tests/about.test.mjs` verifica che ogni paragrafo, voce di elenco e titolo originale sia ancora nella pagina, in italiano e in inglese.

## Contatti (nuovo stile)

CSS in `assets/css/contact.css` e JS in `assets/js/contact.js` (solo questa pagina). Il gestore `contact.php`, i controlli antispam e il consenso GDPR non sono cambiati.

| Dove | Mockup | Cosa ho fatto | Stato |
|---|---|---|---|
| Titolo e sottotitolo | "Parliamo del tuo progetto" | Testi del mockup (nuovi); il titolo reale "Contatti" è il kicker; il testo reale "Compila questo modulo…" è sotto il titolo del modulo | Confermato dall'utente |
| Campo "Prodotto di interesse" | Menu a tendina | Menu con gli 11 prodotti (prima era un campo nascosto); si precompila dal link "Richiedi un preventivo" | Fatto |
| Campo "Azienda" | Presente, facoltativo | Presente anche in inglese, facoltativo; in italiano resta **obbligatorio**, come sul modulo originale | Da confermare |
| Campo "Telefono" | Presente | Aggiunto, **facoltativo**: se compilato deve essere un numero (anche con + davanti, spazi, trattini, punti, parentesi e barre; da 6 a 15 cifre), altrimenti il modulo risponde con un errore sul campo; va nell'email di notifica come "Phone". Aggiornati `contact.php`, l'informativa privacy (italiano e inglese) e i test | Fatto (richiesto) |
| Campo "Nome e cognome" | Un solo campo | Due campi (Nome, Cognome) e conferma e-mail, come prima (il gestore li richiede) | Deciso |
| Mappa | Mappa illustrata con segnaposto | Riquadro con il segnaposto e il pulsante "Apri la mappa" verso una ricerca su OpenStreetMap con l'indirizzo: non carica nulla da terzi (nessun iframe) e non servono coordinate | Da confermare |
| Chiama / WhatsApp | — (dal piano) | "Chiamaci" (numero fisso) e "Scrivici su WhatsApp" (numero mobile +39 366 871 9427); il secondo numero è collegato | **Verifica che il mobile usi WhatsApp** |
| Riga finale | "Soluzioni per fusione • Colata continua • Trattamenti termici" | Inserita (testo del mockup) | Fatto |
| Striscia CTA sopra il footer | — | Non presente in questa pagina (c'è già il modulo) | Fatto |

## Privacy, cookie policy, servizi e 404 nel nuovo stile

Banner come le altre pagine (briciole, kicker, titolo, testo) e testo in colonna leggibile (`.pgh` e `.prose` in `site.css`). Contenuti invariati. I kicker sono "Privacy", "Cookie policy", "Servizi" e "404" (testi di interfaccia). Le quattro pagine servizio in italiano sono ancora in inglese (anomalia già elencata sopra: serve il testo italiano).

Nella scheda prodotto non compare più la riga "Category: Ital-therm" (veniva dal vecchio WordPress); restano SKU e Tag, come richiesto.

## Controllo qualità (prestazioni, pagine mobile)

`node scripts/perf-report.mjs` (mobile 390 px, senza limitazioni di rete, server locale): LCP tra 60 e 92 ms, CLS 0 su tutte le pagine provate, nessun blocco da JavaScript, nessuna richiesta fallita. Peso della prima visita: home 566 KB, catalogo 715 KB, scheda IT.CC 578 KB, contatti 147 KB (di cui font 71 KB). Lighthouse non è disponibile in questo ambiente, quindi i punteggi Lighthouse vanno ancora misurati.

Pagine mobile controllate a occhio a 390 px: home, catalogo, scheda prodotto, Azienda, Contatti, menu a scorrimento. Sul telefono il modulo di Contatti compare prima delle schede dei recapiti (nelle bozze mobile non c'era un modulo); se preferisci i recapiti per primi, basta togliere una riga di CSS.

### Campo Telefono (aggiunto al modulo)
- `server/contact-lib.php`: campo `phone` facoltativo, una sola riga, 6–15 cifre, messaggio di errore in italiano e inglese; un numero non valido non consuma il limite di invii.
- L'informativa privacy elenca ora il numero di telefono tra i dati raccolti ("se scegli di inserirlo"): il testo resta una bozza da validare.
- `tests/contact-phone.test.mjs`: assente o vuoto ammesso, numeri validi ammessi e scritti nell'email, lettere / troppo corto / troppo lungo / doppio "+" / a capo rifiutati con il campo `phone`, campo presente e facoltativo nella pagina.

## Revisione delle deviazioni (decisioni dell'utente)

Queste voci sostituiscono quelle corrispondenti nelle tabelle sopra.

| Dove | Decisione | Cosa ho fatto |
|---|---|---|
| Kicker del hero | In italiano | Pagina italiana: "Tecnologia italiana"; inglese: "Italian technology" |
| Mega menu e menu mobile | Verso il catalogo filtrato | Ogni voce porta a `…/prodotti/?g=<famiglia>` (fusione, colata continua, trattamenti termici, produzione); il catalogo preseleziona la famiglia |
| Filtro "Lavorazione" del catalogo | Allineato alle 4 voci del menu | Quattro famiglie: Colata continua (IT.CC, 1), Forni di fusione (3), Trattamento termico (3), Sistemi di produzione (4). La colata continua è una famiglia a sé come nel mockup; le altre seguono i gruppi reali dei prodotti. Il kicker della scheda usa la stessa famiglia |
| Filtro "Capacità" | Tolto | Rimosso filtro, dati e stringhe; restano ordinamento e conteggio |
| Lista dei vantaggi nella scheda | Aggiunta | Componente con icone a spunta, pilotato da `content/benefits.json` (scritto a mano, non rigenerato dallo script di estrazione). Per **IT.CC** ci sono i 4 punti del mockup (in inglese: traduzione mia); **per gli altri 10 prodotti non c'è nessuna lista finché non mi dai i testi** |
| Pulsante PDF | Testo originale | "Scarica specifiche tecniche" / "Download technical specifications" (dall'originale, scritto con la sola iniziale maiuscola invece del maiuscolo), su entrambi i pulsanti |
| Campo "Azienda" | Facoltativo anche in italiano | Il gestore la accetta vuota in entrambe le lingue; se compilata: una riga, al massimo 120 caratteri |
| Mappa | Incorporata | Pulsante "Carica la mappa": solo dopo il clic si carica l'incorporamento di Google Maps (indirizzo come ricerca, senza referrer); senza JavaScript resta il link "Apri in Google Maps". Informativa privacy e cookie policy nominano Google Maps. **Verifica che il segnaposto cada sul tuo capannone**: non ho coordinate affidabili (OpenStreetMap restituisce per la via due punti a più di 1 km di distanza e non trova il civico 50/B), quindi la posizione dipende da Google |

## Audit sulla tavola master e kit vettoriale

Confronto punto per punto con la master (sezioni Tipografia, Griglie, Pulsanti e stati, Componenti, Regole visive, Iconografia) e con il kit `ITALTHERM_Kit_Vettoriale` ricevuto.

### Allineato
| Area | Master / kit | Cosa ho fatto |
|---|---|---|
| Griglia | Desktop 1440, contenitore 1280, margini 80, gutter 24; tablet gutter 20; telefono gutter 16 | Token `--mx` (80 px a 1440, 32 su tablet, 16 su telefono) e `--gut` (24 / 20 / 16) usati da tutte le griglie di card. `scripts/check-grid.mjs` misura nel browser a 1440, 768 e 390: contenitore 1280 / 704 / 358, margini 80 / 32 / 16, gutter 24 / 20 / 16, nessuno scorrimento orizzontale |
| Scala di spaziatura | 8, 16, 24, 32, 48, 64 | Token `--sp1`…`--sp6` |
| Tipografia | H1 56/1,1 Bold; H2 40/1,2 Bold; H3 28/1,3 SemiBold; corpo 16/1,6; didascalia 14/1,5; pulsante 16 SemiBold; navigazione 16 Medium | H3 portato a 28/1,3 SemiBold; corpo dei testi a 16/1,6; didascalie e note a 14/1,5. Test dedicato |
| Pulsanti | Primario, secondario, outline, testuale; stati normale, hover, focus | Quattro varianti con gli stati del kit: primario con gradiente `#0760DF`→`#0754BC` e hover navy `#254873`→`#1E3A66`; secondario bianco con bordo `#A8C4ED`, hover `#D6E6FF`; outline bianco con bordo `#C9D1DE`, hover `#F4F6FA`; testuale blu sottolineato. "Scarica specifiche tecniche" è ora l'outline neutro |
| Briciole | Icona casa, chevron, pagina corrente in blu | Componente unico per scheda, servizi, privacy e cookie policy |
| Moduli | Asterisco rosso per i campi obbligatori, checkbox blu quadrata con spunta | Asterisco rosso (il testo "(Obbligatorio)" resta per i lettori di schermo); checkbox personalizzata anche nel consenso privacy |
| Spunte | Quadrato azzurro arrotondato con spunta blu | Elenchi di Azienda e vantaggi della scheda con riquadro `#E8EEF9` |
| Iconografia | Set di icone lineari, tratto pulito | Icone del kit in un unico file `assets/img/icons.svg` (ricerca, download, documento, lingua, contatti, tecnologia, supporto tecnico, soluzioni su misura, home, spunta, più assistenza, video, carica file, prodotto e forno per le pagine future), con il colore preso dal testo. Rigenerabile con `npm run icons` da `scripts/icons-src/` |

### Differenze consapevoli
- **Anello di focus**: il kit usa un azzurro chiaro (`#8CB6F4`), che su bianco ha un contrasto di circa 2:1, sotto la soglia di accessibilità (3:1). Uso un doppio anello bianco + blu pieno `#0754BC`.
- **Icone non presenti nel kit** (restano le mie, dello stesso stile): nastro, crogiolo, onde di calore e grani (famiglie), fabbrica, segnaposto, telefono, menu, chiudi, frecce e chevron.
- **Icone del kit ricalcate dal raster**: il LEGGIMI del kit avverte che possono avere piccole irregolarità; la stretta di mano e la spunta sono le più "a mano libera".
- **Header della master**: la master mostra l'header come scheda con ombra; i mockup delle pagine lo mostrano a tutta larghezza. Seguo i mockup.
- **Card prodotto**: la master mostra una variante orizzontale (immagine a sinistra); i mockup del catalogo usano la card verticale. Seguo i mockup.
- **Footer del kit**: riporta l'indirizzo "Loc. Le Vignole, 59 – Sonico (BS)" letto dalla master; non è un dato verificato e non è usato.
- **Componenti del kit non usati perché non ci sono le pagine**: upload (Assistenza), paginazione (11 prodotti stanno in una pagina), badge "Novità" (nessun prodotto nuovo), indicatori desktop/tablet/mobile (solo documentazione).
