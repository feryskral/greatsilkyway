<?php
// Endpoint pro uložení content.json přímo ze admin panelu.
// Chráněno session-based auth (auth.php).
// Pristupne jen z admin.php (kontrola Origin/Referer).

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
auth_start_session();
if (empty($_SESSION['auth_user'])) {
    http_response_code(401);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Nepřihlášen - obnovte stránku a přihlaste se znovu']);
    exit;
}
// CSRF: musi mit platny token v hlavicce X-CSRF-Token
if (!csrf_verify()) {
    http_response_code(403);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => 'Neplatný CSRF token - obnovte stránku a zkuste znovu']);
    exit;
}

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

function fail(int $code, string $msg): void {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    fail(405, 'Pouze POST');
}

// CSRF ochrana: Referer/Origin musi byt z naseho webu
$allowedHost = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$originOk = $origin !== '' && parse_url($origin, PHP_URL_HOST) === $allowedHost;
$refererOk = $referer !== '' && parse_url($referer, PHP_URL_HOST) === $allowedHost;
if (!$originOk && !$refererOk) {
    fail(403, 'Neplatny puvod pozadavku');
}

// Limit velikosti (15 MB)
$contentLength = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($contentLength <= 0 || $contentLength > 15 * 1024 * 1024) {
    fail(413, 'Soubor je prilis velky nebo prazdny (max 15 MB)');
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '') {
    fail(400, 'Prazdne telo pozadavku');
}

// Validace JSON
$data = json_decode($raw, true);
if (!is_array($data)) {
    fail(400, 'Neplatny JSON');
}

// Validace struktury - povinne klice musi byt pole nebo objekt
foreach (['dogs', 'puppies', 'litters', 'gallery'] as $key) {
    if (isset($data[$key]) && !is_array($data[$key])) {
        fail(400, "Neplatna struktura: '$key' musi byt pole");
    }
}
if (isset($data['texts']) && !is_array($data['texts'])) {
    fail(400, "Neplatna struktura: 'texts' musi byt objekt");
}

// Atomicky zapis: nejdriv .tmp, pak rename - zadne pulzapisy
$target = __DIR__ . '/content.json';
$tmp = $target . '.tmp.' . bin2hex(random_bytes(4));

$pretty = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($pretty === false) {
    fail(500, 'Chyba pri zapisu JSON');
}

if (file_put_contents($tmp, $pretty, LOCK_EX) === false) {
    fail(500, 'Nelze zapsat docasny soubor (zkontroluj prava slozky)');
}

if (!rename($tmp, $target)) {
    @unlink($tmp);
    fail(500, 'Nelze prejmenovat soubor');
}

@chmod($target, 0644);

echo json_encode([
    'ok' => true,
    'bytes' => strlen($pretty),
    'savedAt' => date('c'),
], JSON_UNESCAPED_UNICODE);
