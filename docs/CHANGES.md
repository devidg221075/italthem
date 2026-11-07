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
| Contatti (EN) | "to require information or estimate of costs" | "to request information or an estimate of costs" |
| Home e Chi siamo | "high‑technology" con trattino non divisibile (U+2011) | trattino normale |
| Pagina Chi siamo | slug di circa 140 caratteri | `/en/about-us/`, con redirect 301 |

## Da confermare con te (non posso indovinare)

| Dove | Problema | Domanda |
|---|---|---|
| IT.CC20, tabella | Potenza "305KW" | Intendevi 35KW o 30KW? |
| IT.KB04/IT.KB08, tabella | IT.KB08: potenza vuota; "DURATA DEL CICLO" mostra "1000°c"; "CAPACITÀ DELLO STAMPO" mostra "MOLD CAPACITY" (segnaposto) | Valori corretti per IT.KB08 e capacità stampo per IT.KB04/KB08 |
| Chi siamo (EN) | Sotto "Why Choose ITALTHERM" compare la frase "Flexible systems for oxidation‑free production of strips, tubes, and wires.", copiata dalla sezione colata continua. La versione italiana ha una frase diversa | Tolgo la frase, o uso la traduzione dell'italiano ("These technologies ensure thermal uniformity, repeatability and consistent results in processing")? |
| Chi siamo EN/IT | La versione italiana è molto più ricca di quella inglese | Allineo l'inglese all'italiano? |
| Home | Testo segnaposto "Lorem ipsum" e "The wise man therefore…" | Sostituito con un estratto di "Chi siamo" (deciso) |
| Telefoni | Fisso 0575 810487 nella sezione contatti | Scartato (deciso) |
| Indirizzo | "Loc. Le Vertighe, 50" | Scartato, uso "Viale S. Maria delle Vertighe, 50/B" (deciso) |
| Privacy | Il link è "#" | Pagina privacy: bozza da validare da te o dal tuo consulente |
| Social | Icona X/Twitter con link "#" | Rimossa, a meno che tu abbia un profilo |
| Footer | "© Copyright 2026 by Keyidea.it" | Sostituito da copyright Italtherm con anno automatico; credito Keyidea da tenere? |
| Tema | Link "Explore now" al demo del tema | Rimosso |
| Tabelle | Etichette bilingui "VOLTAGGIO / VOLTAGE" in pagine inglesi | Le tengo bilingui come sull'originale |

## Pagine demo del tema da eliminare (410 o redirect)

`blog-grid`, `faqs`, `projects-gird`, `pricing`, `cart`, `cart-2`, `checkout`, `checkout-2`, `my-account`, `testimonials`, `team-grid`, `services-gird`, `home`, `content-from-mizox`, `italtherm-continuous-casting-machine` (da verificare).

## Scelte di presentazione (non modificano i testi)

- I nomi prodotto, scritti in maiuscolo sul sito, sono mostrati in Title Case.
- I codici modello (IT.CC, IT.AF…) sono evidenziati come etichetta.
- Le foto sono quelle del sito (©FOTO SCHINCO): verificare i diritti d'uso per la nuova versione.
