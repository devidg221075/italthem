<?php
// Test driver: reads {"calls":[{"post":{},"server":{},"now":int}],"mailerOk":bool} on stdin,
// runs handle_contact() with a recording stub mailer and prints {"results":[...],"mails":[...]}.
declare(strict_types=1);
require __DIR__ . '/../../server/contact-lib.php';

$case = json_decode((string) stream_get_contents(STDIN), true);
$dir = sys_get_temp_dir() . '/itc-test-' . bin2hex(random_bytes(6));
$mails = [];
$ok = $case['mailerOk'] ?? true;
$mailer = function (string $to, string $subject, string $body, array $headers) use (&$mails, $ok): bool {
    $mails[] = ['to' => $to, 'subject' => $subject, 'body' => $body, 'headers' => $headers];
    return $ok;
};
$results = [];
foreach ($case['calls'] as $c) {
    $server = $c['server'] ?? [];
    $server += ['REQUEST_METHOD' => 'POST', 'REMOTE_ADDR' => '203.0.113.7', 'HTTP_USER_AGENT' => 'TestAgent/1.0'];
    $results[] = handle_contact($c['post'] ?? [], $server, $mailer, $dir, (int) ($c['now'] ?? 1800000000));
}
foreach (glob($dir . '/{*,.[!.]*}', GLOB_BRACE) ?: [] as $f) @unlink($f);
@rmdir($dir);
echo json_encode(['results' => $results, 'mails' => $mails], JSON_UNESCAPED_UNICODE);
