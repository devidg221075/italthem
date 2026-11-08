<?php
// Endpoint for the contact form: POST /contact.php. JSON for fetch(), 303 redirect for plain form posts.
declare(strict_types=1);
require __DIR__ . '/contact-lib.php';

header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$res = handle_contact($_POST, $_SERVER, 'contact_send_mail', contact_rate_dir(), time());

if ($res['status'] === 405) {
    header('Allow: POST');
}
if (contact_wants_json($_SERVER) || $res['status'] === 405) {
    http_response_code($res['status']);
    header('Content-Type: application/json; charset=utf-8');
    $out = ['ok' => $res['ok']];
    if ($res['error'] !== null) $out['error'] = $res['error'];
    if ($res['field'] !== null) $out['field'] = $res['field'];
    echo json_encode($out, JSON_UNESCAPED_UNICODE);
    exit;
}
header('Location: ' . contact_redirect_url($res['lang'], $res['ok']), true, 303);
header('Content-Type: text/plain; charset=utf-8');
echo $res['ok'] ? 'OK' : 'Error';
