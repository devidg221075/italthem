<?php
// Contact form logic for ital-therm.it. No framework, no database. Included by contact.php and the tests.
declare(strict_types=1);

if (PHP_SAPI !== 'cli' && isset($_SERVER['SCRIPT_FILENAME']) && realpath($_SERVER['SCRIPT_FILENAME']) === __FILE__) {
    http_response_code(404);
    exit;
}

const CONTACT_TO = 'info@ital-therm.it';          // fixed: never read from the request
const CONTACT_FROM = 'no-reply@ital-therm.it';
const CONTACT_RATE_MAX = 3;                       // accepted submissions per IP ...
const CONTACT_RATE_WINDOW = 3600;                 // ... per hour
const CONTACT_PRODUCTS = [
    'it-kb' => 'IT.KB', 'it-cc' => 'IT.CC', 'it-af' => 'IT.AF', 'it-bf' => 'IT.BF', 'it-cwa' => 'IT.CWA', 'it-gt' => 'IT.GT',
    'it-gms' => 'IT.GMS', 'it-gmb' => 'IT.GMB', 'it-mt' => 'IT.MT', 'it-sm' => 'IT.SM', 'it-fm' => 'IT.FM',
];
const CONTACT_MESSAGES = [
    'en' => [
        'method' => 'This form can only be submitted with POST.',
        'company' => 'Please enter your company name.',
        'first_name' => 'Please enter your first name.',
        'last_name' => 'Please enter your last name.',
        'email' => 'Please enter a valid email address.',
        'email_confirm' => 'The two email addresses do not match.',
        'message' => 'Please describe your request (at least 10 characters).',
        'consent' => 'Please accept the privacy notice to continue.',
        'invalid' => 'Some of the data you entered is not valid. Please check the form.',
        'rate' => 'Too many requests. Please try again later or contact us by email or phone.',
        'server' => 'Your request could not be sent right now. Please try again later or contact us by email or phone.',
    ],
    'it' => [
        'method' => 'Questo modulo può essere inviato solo con POST.',
        'company' => 'Inserisci il nome dell’azienda.',
        'first_name' => 'Inserisci il tuo nome.',
        'last_name' => 'Inserisci il tuo cognome.',
        'email' => 'Inserisci un indirizzo email valido.',
        'email_confirm' => 'Gli indirizzi email non coincidono.',
        'message' => 'Descrivi la tua richiesta (almeno 10 caratteri).',
        'consent' => 'Per continuare accetta l’informativa sulla privacy.',
        'invalid' => 'Alcuni dati inseriti non sono validi. Controlla il modulo.',
        'rate' => 'Troppe richieste. Riprova più tardi oppure contattaci via email o telefono.',
        'server' => 'Non è stato possibile inviare la richiesta. Riprova più tardi oppure contattaci via email o telefono.',
    ],
];

function contact_lang(array $post): string
{
    $l = $post['lang'] ?? 'en';
    return $l === 'it' ? 'it' : 'en';
}

/** @return array{status:int,ok:bool,error:?string,field:?string,lang:string} */
function contact_result(int $status, string $lang, ?string $key = null, ?string $field = null): array
{
    return [
        'status' => $status, 'ok' => $status === 200,
        'error' => $key === null ? null : CONTACT_MESSAGES[$lang][$key],
        'field' => $field, 'lang' => $lang,
    ];
}

/** String value of a POST field, or null when missing or not a plain string (e.g. name[]=x). */
function contact_str(array $post, string $key): ?string
{
    $v = $post[$key] ?? null;
    return is_string($v) ? $v : null;
}

function contact_strip_controls(string $s, bool $keepNewlines): string
{
    $pattern = $keepNewlines ? '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/' : '/[\x00-\x1F\x7F]/';
    return (string) preg_replace($pattern, '', $s);
}

function contact_ip(array $server): string
{
    $ip = (string) ($server['REMOTE_ADDR'] ?? '');
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : 'unknown';
}

/** Rate-limit key: the address itself for IPv4 (also when it arrives IPv4-mapped, ::ffff:a.b.c.d), the /64 prefix for IPv6 (one subscriber owns a whole /64). */
function contact_rate_ip(string $ip): string
{
    $bin = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6) ? @inet_pton($ip) : false;
    if ($bin === false) {
        return $ip;
    }
    if (substr($bin, 0, 12) === str_repeat("\0", 10) . "\xff\xff") {
        return inet_ntop(substr($bin, 12, 4));
    }
    return inet_ntop(substr($bin, 0, 8) . str_repeat("\0", 8)) . '/64';
}

/** Default rate-limit directory: per site (hash of the install path), overridable with ITALTHERM_RATE_DIR. */
function contact_rate_dir(): string
{
    $env = getenv('ITALTHERM_RATE_DIR');
    return is_string($env) && $env !== '' ? $env : sys_get_temp_dir() . '/italtherm-contact-' . substr(md5(__DIR__), 0, 12);
}

/**
 * Handles one contact request. $mailer(string $to, string $subject, string $body, array $headers): bool.
 * @return array{status:int,ok:bool,error:?string,field:?string,lang:string}
 */
function handle_contact(array $post, array $server, callable $mailer, string $rateDir, int $now): array
{
    $lang = contact_lang($post);
    if (($server['REQUEST_METHOD'] ?? '') !== 'POST') {
        return contact_result(405, $lang, 'method');
    }
    // Honeypot: bots fill the hidden "website" field. Pretend success, send nothing, do not count.
    if (trim((string) contact_str($post, 'website')) !== '') {
        return contact_result(200, $lang);
    }

    $clean = static function (string $key, int $max, bool $single) use ($post): ?string {
        $raw = contact_str($post, $key);
        if ($raw === null || !mb_check_encoding($raw, 'UTF-8')) {
            return null;
        }
        if ($single && preg_match('/[\r\n]/', $raw)) {
            return null; // header injection attempt
        }
        $v = trim(contact_strip_controls($raw, !$single));
        return ($v === '' || mb_strlen($v) > $max) ? null : $v;
    };

    $company = $clean('company', 120, true);
    $companyRaw = trim((string) contact_str($post, 'company'));
    if ($company === null && ($lang === 'it' || $companyRaw !== '')) {
        return contact_result(422, $lang, 'company', 'company'); // required on the Italian form; too long / invalid anywhere
    }

    $first = $clean('first_name', 80, true);
    if ($first === null) return contact_result(422, $lang, 'first_name', 'first_name');
    $last = $clean('last_name', 80, true);
    if ($last === null) return contact_result(422, $lang, 'last_name', 'last_name');

    $email = $clean('email', 254, true);
    if ($email === null || !filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[^\s<>",;:\\\\]+@[^\s<>",;:\\\\]+$/', $email)) {
        return contact_result(422, $lang, 'email', 'email');
    }
    $confirm = contact_str($post, 'email_confirm');
    if ($confirm === null || mb_strtolower(trim($confirm)) !== mb_strtolower($email)) {
        return contact_result(422, $lang, 'email_confirm', 'email_confirm');
    }

    $rawMsg = contact_str($post, 'message');
    $message = null;
    if ($rawMsg !== null && mb_check_encoding($rawMsg, 'UTF-8')) {
        $message = trim(contact_strip_controls(str_replace(["\r\n", "\r"], "\n", $rawMsg), true));
    }
    if ($message === null || mb_strlen($message) < 10 || mb_strlen($message) > 5000) {
        return contact_result(422, $lang, 'message', 'message');
    }

    $consent = strtolower(trim((string) contact_str($post, 'consent')));
    if (!in_array($consent, ['1', 'on', 'yes', 'true'], true)) {
        return contact_result(422, $lang, 'consent', 'consent');
    }

    $slug = contact_str($post, 'product');
    $product = ($slug !== null && isset(CONTACT_PRODUCTS[$slug])) ? CONTACT_PRODUCTS[$slug] : null;

    $subject = '[ital-therm.it] Request from ' . $first . ' ' . $last . ($product !== null ? ' – ' . $product : '');
    $subject = mb_encode_mimeheader($subject, 'UTF-8', 'B', "\r\n");
    $ua = mb_substr(contact_strip_controls((string) ($server['HTTP_USER_AGENT'] ?? ''), false), 0, 255);
    $ip = contact_ip($server);
    $body = "New request from the ital-therm.it contact form\n\n"
        . "Name: $first $last\n"
        . 'Company: ' . ($company ?? '-') . "\n"
        . "Email: $email\n"
        . 'Product: ' . ($product ?? '-') . "\n"
        . "Language: $lang\n"
        . 'Date: ' . gmdate('Y-m-d H:i:s', $now) . " UTC\n"
        . "IP: $ip\n"
        . 'User agent: ' . ($ua === '' ? '-' : $ua) . "\n\n"
        . "Message:\n$message\n";
    $body = quoted_printable_encode(str_replace("\n", "\r\n", $body));
    $headers = [
        'From: ' . CONTACT_FROM,
        'Reply-To: ' . $email,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: quoted-printable',
        'X-Mailer: ital-therm.it contact form',
    ];

    // Rate limit: one small file per hashed IP, holding the timestamps of accepted submissions.
    if (!is_dir($rateDir) && !@mkdir($rateDir, 0700, true) && !is_dir($rateDir)) {
        return contact_result(500, $lang, 'server');
    }
    contact_prune($rateDir, $now);
    $saltFile = $rateDir . '/.salt';
    if (!is_file($saltFile)) {
        @file_put_contents($saltFile, bin2hex(random_bytes(16)), LOCK_EX);
    }
    $salt = (string) @file_get_contents($saltFile);
    $rateFile = $rateDir . '/' . hash_hmac('sha256', contact_rate_ip($ip), $salt) . '.rl';
    $fh = @fopen($rateFile, 'c+');
    if ($fh === false || !flock($fh, LOCK_EX)) {
        return contact_result(500, $lang, 'server');
    }
    $stamps = json_decode((string) stream_get_contents($fh), true);
    $stamps = array_values(array_filter(is_array($stamps) ? $stamps : [], static fn ($t) => is_int($t) && $t > $now - CONTACT_RATE_WINDOW));
    if (count($stamps) >= CONTACT_RATE_MAX) {
        flock($fh, LOCK_UN);
        fclose($fh);
        return contact_result(429, $lang, 'rate');
    }
    $sent = false;
    try {
        $sent = $mailer(CONTACT_TO, $subject, $body, $headers);
    } catch (Throwable $e) {
        $sent = false;
    }
    if ($sent) {
        $stamps[] = $now;
        ftruncate($fh, 0);
        rewind($fh);
        fwrite($fh, json_encode($stamps));
        fflush($fh);
        touch($rateFile, $now); // mtime follows the injected clock so pruning is consistent
    } elseif ($stamps === []) {
        @unlink($rateFile); // nothing accepted: leave no record behind
    }
    flock($fh, LOCK_UN);
    fclose($fh);
    return $sent ? contact_result(200, $lang) : contact_result(500, $lang, 'server');
}

/** Deletes rate-limit records whose last accepted submission is older than the window (they hold only expired timestamps). */
function contact_prune(string $rateDir, int $now): void
{
    foreach (glob($rateDir . '/*.rl') ?: [] as $f) {
        if (@filemtime($f) < $now - CONTACT_RATE_WINDOW) {
            @unlink($f);
        }
    }
}

function contact_wants_json(array $server): bool
{
    return stripos((string) ($server['HTTP_ACCEPT'] ?? ''), 'application/json') !== false
        || isset($server['HTTP_X_REQUESTED_WITH']);
}

/** Page the no-JS flow returns to. The fragment lets CSS (:target) show the message without JavaScript. */
function contact_redirect_url(string $lang, bool $ok): string
{
    $base = $lang === 'it' ? '/it/contatti/' : '/en/contact/';
    return $base . ($ok ? '?sent=1#st-ok' : '?error=1#st-err');
}

/** Real mailer used by contact.php. Returns false (never throws) when the host cannot send mail. */
function contact_send_mail(string $to, string $subject, string $body, array $headers): bool
{
    return @mail($to, $subject, $body, $headers, '-f' . CONTACT_FROM);
}
