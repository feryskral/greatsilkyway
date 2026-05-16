<?php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    exit;
}

$to      = 'info@greatsilkyway.cz';
$fromBox = 'noreply@greatsilkyway.cz';

$firstName = trim($_POST['firstName'] ?? '');
$lastName  = trim($_POST['lastName']  ?? '');
$email     = trim($_POST['email']     ?? '');
$phone     = trim($_POST['phone']     ?? '');
$subject   = trim($_POST['subject']   ?? '');
$message   = trim($_POST['message']   ?? '');
$gdpr      = isset($_POST['gdpr']);
$honeypot  = trim($_POST['website']   ?? '');

if ($honeypot !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

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
$body .= "IP:       " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown') . "\n";

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
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Odeslani selhalo. Zkuste prosim pozdeji nebo napiste primo na info@greatsilkyway.cz.']);
}
