# Messa in produzione di ital-therm.it

## Requisiti del server

- Apache 2.4 con `mod_rewrite`, `mod_headers`, `mod_expires`, `mod_deflate` (opzionale `mod_brotli`). Le regole sono nel file `.htaccess`, quindi serve `AllowOverride All` (come minimo `FileInfo`, `Options`, `Indexes`, `AuthConfig`/`Limit` per `Require`).
- PHP 8.1 o superiore con `mail()` (sendmail/postfix) oppure SMTP configurato: il modulo contatti invia a `info@ital-therm.it` con `contact.php`.
- Il file `.htaccess` ha le direttive `php_flag display_errors off` dentro `<IfModule mod_php.c>`, `mod_php7.c` e `mod_php8.c` (cambia il nome del modulo secondo la versione; con PHP-FPM o CGI vengono ignorate: imposta `display_errors=Off` nel pool o in `php.ini`).
- Variabile opzionale `ITALTHERM_RATE_DIR`: cartella (scrivibile da PHP) dove il modulo contatti salva il limite di frequenza. Se manca usa una cartella in `sys_get_temp_dir()`.

## Cosa caricare

1. `npm run build` (Node 20+) crea la cartella `dist/`.
2. Carica il CONTENUTO di `dist/` nella cartella pubblica del sito (document root), compreso il file nascosto `.htaccess`.
3. `contact-lib.php` viene caricato ma è bloccato dal web (403): serve solo a `contact.php`.

## Controlli alla prima richiesta

- `https://ital-therm.it/` mostra la scelta della lingua; `http://` e `https://www.` arrivano a `https://ital-therm.it/` con un solo salto.
- `https://ital-therm.it/shop/` va a `/en/products/` (301); `/it/shop/` va a `/it/prodotti/`.
- Una pagina demo, per esempio `/blog-grid/`, risponde 410 con la pagina 404 del sito.
- `/en/products` (senza slash) va a `/en/products/` con un solo salto.
- `/contact-lib.php` risponde 403.
- Il modulo in `/en/contact/` invia davvero un'email a `info@ital-therm.it`.
- `/sitemap.xml` e `/robots.txt` si aprono; poi invia la sitemap a Google Search Console.

## Proxy o CDN

- Dietro un proxy/CDN `REMOTE_ADDR` è l'indirizzo del proxy: tutti i visitatori condividono lo stesso limite di invii del modulo contatti. Se serve, fai passare l'IP reale al server (per esempio `mod_remoteip`).
- Se il proxy termina il TLS, Apache vede `HTTPS off`: la regola `RewriteCond %{HTTP:X-Forwarded-Proto} !https` evita il ciclo di redirect solo se il proxy invia `X-Forwarded-Proto: https`. Verifica con `curl -I https://ital-therm.it/en/` che la prima richiesta NON dia un redirect.
- I redirect dei vecchi URL e lo slash finale usano target assoluti `https://ital-therm.it/...`, quindi non dipendono dallo schema visto da Apache.

## Vecchi file WordPress

I vecchi URL `/wp-content/uploads/...` (immagini e PDF) NON sono reindirizzati e daranno 404. Le immagini ora sono in `/assets/img/src/` e i PDF tecnici in `/assets/docs/`.

## Cache

CSS e JS sono collegati con `?v=<hash>` e restano in cache un anno. Immagini e favicon hanno nomi senza hash e restano in cache una settimana: se sostituisci un file, aspettati fino a 7 giorni prima che tutti i visitatori lo vedano.
