<?php
// =====================================================
// Sdilene autentizacni funkce pro admin oblast.
// =====================================================
declare(strict_types=1);

// --- KONFIGURACE ---
const AUTH_HTPASSWD = __DIR__ . '/.htpasswd-admin';
const AUTH_ATTEMPTS_FILE = __DIR__ . '/.login-attempts.json';
const AUTH_MAX_FAILED = 3;
const AUTH_LOCKOUT_MINUTES = 30;
const AUTH_NOTIFY_EMAIL = 'info@greatsilkyway.cz';
const AUTH_SESSION_LIFETIME = 3600 * 8; // 8 hodin

// --- INIT SESSION ---
function auth_start_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_set_cookie_params([
        'lifetime' => AUTH_SESSION_LIFETIME,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_name('gs_admin_sess');
    session_start();
}

// --- POMOCNE ---
function auth_client_ip(): string {
    return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function auth_load_attempts(): array {
    if (!file_exists(AUTH_ATTEMPTS_FILE)) return [];
    $raw = @file_get_contents(AUTH_ATTEMPTS_FILE);
    if ($raw === false) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function auth_save_attempts(array $data): void {
    @file_put_contents(AUTH_ATTEMPTS_FILE, json_encode($data, JSON_PRETTY_PRINT), LOCK_EX);
    @chmod(AUTH_ATTEMPTS_FILE, 0640);
}

// Vrati true pokud je IP momentalne zablokovana
function auth_is_locked(string $ip): array {
    $data = auth_load_attempts();
    $entry = $data[$ip] ?? null;
    if (!$entry) return ['locked' => false, 'remaining_seconds' => 0, 'failed' => 0];

    $lockUntil = $entry['locked_until'] ?? 0;
    $now = time();
    if ($lockUntil > $now) {
        return ['locked' => true, 'remaining_seconds' => $lockUntil - $now, 'failed' => $entry['failed'] ?? 0];
    }
    return ['locked' => false, 'remaining_seconds' => 0, 'failed' => $entry['failed'] ?? 0];
}

// Zaznamena neuspesny pokus, pripadne uzamkne + posle email
function auth_record_failure(string $ip): void {
    $data = auth_load_attempts();
    $entry = $data[$ip] ?? ['failed' => 0, 'first_at' => time(), 'locked_until' => 0];

    // Reset pocitadla pokud uplynulo vice nez 30 minut od prvniho pokusu
    if (time() - ($entry['first_at'] ?? 0) > AUTH_LOCKOUT_MINUTES * 60) {
        $entry = ['failed' => 0, 'first_at' => time(), 'locked_until' => 0];
    }

    $entry['failed']++;
    $entry['last_at'] = time();

    if ($entry['failed'] >= AUTH_MAX_FAILED) {
        $entry['locked_until'] = time() + (AUTH_LOCKOUT_MINUTES * 60);
        auth_send_alert_email($ip, $entry['failed']);
    }

    $data[$ip] = $entry;
    auth_save_attempts($data);
}

// Po uspesnem prihlaseni vymazat zaznamy pro tuto IP
function auth_clear_failures(string $ip): void {
    $data = auth_load_attempts();
    unset($data[$ip]);
    auth_save_attempts($data);
}

// Email notifikace
function auth_send_alert_email(string $ip, int $failed): void {
    $to = AUTH_NOTIFY_EMAIL;
    $subject = 'Great Silkyway - Pokus o prihlaseni do adminu';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '(neznamy)';
    $time = date('Y-m-d H:i:s');
    $body = "Nekdo se opakovane pokousi prihlasit do adminu Great Silkyway.\n\n"
          . "Cas: $time\n"
          . "IP adresa: $ip\n"
          . "Pocet neuspesnych pokusu: $failed\n"
          . "Prohlizec: $userAgent\n\n"
          . "Pristup byl docasne zablokovan na " . AUTH_LOCKOUT_MINUTES . " minut.\n\n"
          . "Pokud to nebyl jsi, doporucujeme zmenit heslo.\n"
          . "Pokud to byl jsi a zapomnel jsi heslo, pockej " . AUTH_LOCKOUT_MINUTES . " minut a zkus to znovu.\n";
    $headers = "From: noreply@greatsilkyway.cz\r\n"
             . "Reply-To: noreply@greatsilkyway.cz\r\n"
             . "Content-Type: text/plain; charset=UTF-8\r\n"
             . "X-Mailer: PHP/" . phpversion();
    @mail($to, $subject, $body, $headers);
}

// --- LOGIN VERIFIKACE ---
function auth_verify_credentials(string $user, string $pass): bool {
    if (!file_exists(AUTH_HTPASSWD)) return false;
    $line = trim(@file_get_contents(AUTH_HTPASSWD));
    if ($line === '') return false;
    $parts = explode(':', $line, 2);
    if (count($parts) !== 2) return false;
    [$storedUser, $storedHash] = $parts;
    if (!hash_equals($storedUser, $user)) return false;
    return password_verify($pass, $storedHash);
}

// --- CHRANENI STRANEK ---
// Zavolej z chranenych PHP stranek: pokud neni prihlasen -> presmeruje na login
function auth_require_login(): void {
    auth_start_session();
    if (empty($_SESSION['auth_user'])) {
        // Pro AJAX vrati 401
        $accept = $_SERVER['HTTP_ACCEPT'] ?? '';
        if (str_contains($accept, 'application/json')) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['ok' => false, 'error' => 'Nepřihlášen']);
            exit;
        }
        $redir = $_SERVER['REQUEST_URI'] ?? '/admin.php';
        header('Location: /login.php?redir=' . urlencode($redir));
        exit;
    }
}

// =====================================================
// CSRF token
// =====================================================
function csrf_token(): string {
    auth_start_session();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

// Vygeneruje cerstvy token (volat po loginu)
function csrf_rotate(): void {
    auth_start_session();
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Overi token poslany v requestu (header X-CSRF-Token nebo POST pole _csrf)
function csrf_verify(): bool {
    auth_start_session();
    $expected = $_SESSION['csrf_token'] ?? '';
    if ($expected === '') return false;
    $got = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['_csrf'] ?? '');
    if ($got === '') return false;
    return hash_equals($expected, $got);
}
