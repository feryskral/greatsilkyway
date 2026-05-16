<?php
// ============================================================
//  Kontaktni formular - greatsilkyway.cz
//  Antispam: honeypot, casova kontrola, rate limit, blacklist
// ============================================================

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

// === KONFIGURACE ===
$to            = 'info@greatsilkyway.cz';
$fromBox       = 'noreply@greatsilkyway.cz';
$rateLimitDir  = sys_get_temp_dir() . '/gs_ratelimit';
$maxPerHour    = 5;       // max zprav z jedne IP za hodinu
$maxPerDay     = 20;      // max zprav z jedne IP za den
$minFillTime   = 3;       // sekund - min cas k vyplneni formulare
$maxMsgLength  = 5000;    // max znaku zpravy
$maxNameLength = 80;      // max znaku jmena/prijmeni

// === VSTUPY ===
$firstName = trim($_POST['firstName'] ?? '');
$lastName  = trim($_POST['lastName']  ?? '');
$email     = trim($_POST['email']     ?? '');
$phone     = trim($_POST['phone']     ?? '');
$subject   = trim($_POST['subject']   ?? '');
$message   = trim($_POST['message']   ?? '');
$gdpr      = isset($_POST['gdpr']);
$honeypot  = trim($_POST['website']   ?? '');
$ts        = (int)($_POST['ts']       ?? 0);
$ip        = $_SERVER['REMOTE_ADDR']  ?? 'unknown';

// === ANTISPAM 1: Honeypot ===
if ($honeypot !== '') {
    // Bot - tise prijmeme bez odeslani
    echo json_encode(['ok' => true]);
    exit;
}

// === ANTISPAM 2: Casova kontrola ===
if ($ts > 0) {
    $elapsed = time() - $ts;
    if ($elapsed < $minFillTime) {
        // Vyplneno prilis rychle = bot
        echo json_encode(['ok' => true]);
        exit;
    }
    if ($elapsed > 86400) {
        // Stranka otevrena dele nez den - asi stale formular
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Obnovte prosim stranku a zkuste znovu.']);
        exit;
    }
}

// === ANTISPAM 3: Validace povinnych poli ===
if ($firstName === '' || $lastName === '' || $message === '' || !$gdpr) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Chybi povinna pole.']);
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Neplatny e-mail.']);
    exit;
}

// === ANTISPAM 4: Delka poli ===
if (mb_strlen($message) > $maxMsgLength) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Zprava je prilis dlouha (max ' . $maxMsgLength . ' znaku).']);
    exit;
}
if (mb_strlen($firstName) > $maxNameLength || mb_strlen($lastName) > $maxNameLength) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Jmeno nebo prijmeni je prilis dlouhe.']);
    exit;
}

// === ANTISPAM 5: Newline injection v poli ===
// Bot se snazi pridat dalsi hlavicky pres \r\n v jmenu/emailu
foreach ([$firstName, $lastName, $email, $phone] as $v) {
    if (preg_match('/[\r\n]/', $v)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Neplatne znaky.']);
        exit;
    }
}

// === ANTISPAM 6: Pocet URL ve zprave ===
$urlCount = preg_match_all('~https?://~i', $message);
if ($urlCount > 3) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Zprava obsahuje prilis mnoho odkazu.']);
    exit;
}

// === ANTISPAM 7: Blacklist klicovych slov ===
$spamWords = [
    'viagra', 'cialis', 'casino', 'poker', 'bitcoin', 'crypto',
    'forex', 'investment opportunity', 'guaranteed loan', 'seo offer',
    'best price', 'cheap meds', 'enlargement', 'pharmacy', 'rolex',
    'click here now', 'free money', 'work from home', 'make $',
    'кликни', 'заработ', 'кредит', 'казино',  // ruske
    '点击', '赚钱',  // cinske
];
$check = mb_strtolower($subject . ' ' . $message . ' ' . $firstName . ' ' . $lastName);
foreach ($spamWords as $word) {
    if (mb_strpos($check, mb_strtolower($word)) !== false) {
        // Tise zahodit, at spammer netusi
        echo json_encode(['ok' => true]);
        exit;
    }
}

// === ANTISPAM 8: Rate limit per IP ===
@mkdir($rateLimitDir, 0700, true);
$ipHash = hash('sha256', $ip);
$rateFile = $rateLimitDir . '/' . $ipHash . '.json';

$now = time();
$record = ['hour' => [], 'day' => []];
if (file_exists($rateFile)) {
    $data = @json_decode(@file_get_contents($rateFile), true);
    if (is_array($data)) {
        $record['hour'] = array_filter($data['hour'] ?? [], fn($t) => $t > $now - 3600);
        $record['day']  = array_filter($data['day']  ?? [], fn($t) => $t > $now - 86400);
    }
}

if (count($record['hour']) >= $maxPerHour) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Prilis mnoho zprav. Zkuste znovu za hodinu.']);
    exit;
}
if (count($record['day']) >= $maxPerDay) {
    http_response_code(429);
    echo json_encode(['ok' => false, 'error' => 'Denni limit zprav vycerpan. Zkuste znovu zitra nebo piste primo na info@greatsilkyway.cz.']);
    exit;
}

// Cleanup starych zaznamu (kazdy 100. request, ad-hoc garbage collection)
if (rand(1, 100) === 1) {
    foreach (glob($rateLimitDir . '/*.json') as $f) {
        if (filemtime($f) < $now - 86400) @unlink($f);
    }
}

// === SESTAVENI EMAILU ===
$subjectMap = [
    'stenata'  => 'Zajem o stene',
    'poradnik' => 'Rezervace - poradnik',
    'info'     => 'Obecne informace',
    'zdravi'   => 'Zdravotni dotazy',
    'jine'     => 'Jine',
];
$subjectLabel = $subjectMap[$subject] ?? 'Bez tematu';
$mailSubject  = '[Web] ' . $subjectLabel . ' - ' . $firstName . ' ' . $lastName;

$body  = "Nova zprava z kontaktniho formulare greatsilkyway.cz\n";
$body .= "------------------------------------------------------\n\n";
$body .= "Jmeno:    {$firstName} {$lastName}\n";
$body .= "E-mail:   {$email}\n";
$body .= "Telefon:  " . ($phone !== '' ? $phone : '(neuvedeno)') . "\n";
$body .= "Tema:     {$subjectLabel}\n\n";
$body .= "Zprava:\n";
$body .= "------------------------------------------------------\n";
$body .= $message . "\n";
$body .= "------------------------------------------------------\n\n";
$body .= "Odeslano: " . date('d.m.Y H:i:s') . "\n";
$body .= "IP:       " . $ip . "\n";
$body .= "User-Agent: " . substr($_SERVER['HTTP_USER_AGENT'] ?? 'unknown', 0, 200) . "\n";

$headers = [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'From: Great Silkyway web <' . $fromBox . '>',
    'Reply-To: ' . $firstName . ' ' . $lastName . ' <' . $email . '>',
    'X-Mailer: PHP/' . phpversion(),
];

$ok = @mail(
    $to,
    '=?UTF-8?B?' . base64_encode($mailSubject) . '?=',
    $body,
    implode("\r\n", $headers),
    '-f' . $fromBox
);

if ($ok) {
    // Zaznamenat do rate limitu
    $record['hour'][] = $now;
    $record['day'][]  = $now;
    @file_put_contents($rateFile, json_encode($record), LOCK_EX);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Odeslani selhalo. Zkuste prosim pozdeji nebo napiste primo na info@greatsilkyway.cz.']);
}
