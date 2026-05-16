<?php
// =====================================================
//  Analytics tracker - greatsilkyway.cz
//  Privacy: pouze hashovana IP, bez cookies
// =====================================================

header('Content-Type: image/gif');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Vratit prazdny 1x1 pixel
$gif = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\x00\x00\x00\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b";
echo $gif;

// Po odeslani odpovedi pokracovat na pozadi
if (function_exists('fastcgi_finish_request')) {
    fastcgi_finish_request();
} else {
    @ob_end_flush();
    @flush();
}

// ====== KONFIGURACE ======
$dbFile = __DIR__ . '/analytics.db';
$ipSalt = 'gs_2026_v1'; // salt pro hashovani IP (kdyz zmenis, "ztratis" navaznost)

// ====== VSTUPY ======
$page = $_GET['p'] ?? '/';
$ref  = $_GET['r'] ?? '';
$ip   = $_SERVER['REMOTE_ADDR'] ?? '';
$ua   = $_SERVER['HTTP_USER_AGENT'] ?? '';

if ($ip === '') exit;

// Ignorovat boty
if (preg_match('~bot|crawl|spider|slurp|scraper|fetch|monitor|curl|wget|python|java/|go-http|axios|preview~i', $ua)) {
    exit;
}

// Validace pole
if (strlen($page) > 200 || strlen($ref) > 500 || strlen($ua) > 500) exit;

$ipHash = hash('sha256', $ip . $ipSalt);

// ====== INIT DATABAZE ======
try {
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $db->exec("CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts INTEGER NOT NULL,
        ip_hash TEXT NOT NULL,
        country TEXT,
        page TEXT,
        referrer TEXT,
        browser TEXT,
        os TEXT,
        device TEXT
    )");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_ts ON visits(ts)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_iph ON visits(ip_hash)");

    $db->exec("CREATE TABLE IF NOT EXISTS ip_cache (
        ip_hash TEXT PRIMARY KEY,
        country TEXT,
        ts INTEGER
    )");
} catch (Exception $e) {
    exit;
}

// ====== DETEKCE STATU (s cache 30 dni) ======
$country = '??';
$stmt = $db->prepare("SELECT country, ts FROM ip_cache WHERE ip_hash = ?");
$stmt->execute([$ipHash]);
$cached = $stmt->fetch(PDO::FETCH_ASSOC);
if ($cached && $cached['ts'] > time() - 86400 * 30) {
    $country = $cached['country'];
} else {
    // Lookup pres ip2c.org (free, no key)
    $ctx = stream_context_create(['http' => ['timeout' => 2, 'user_agent' => 'gs-analytics']]);
    $resp = @file_get_contents("https://ip2c.org/" . urlencode($ip), false, $ctx);
    if ($resp && preg_match('/^1;([A-Z]{2});/', $resp, $m)) {
        $country = $m[1];
    }
    $db->prepare("INSERT OR REPLACE INTO ip_cache (ip_hash, country, ts) VALUES (?, ?, ?)")
       ->execute([$ipHash, $country, time()]);
}

// ====== DETEKCE PROHLIZECE / OS / ZARIZENI ======
function detectBrowser($ua) {
    if (preg_match('~Edg/~', $ua)) return 'Edge';
    if (preg_match('~Firefox/~', $ua)) return 'Firefox';
    if (preg_match('~OPR/|Opera~', $ua)) return 'Opera';
    if (preg_match('~Chrome/~', $ua)) return 'Chrome';
    if (preg_match('~Safari/~', $ua)) return 'Safari';
    return 'Other';
}
function detectOS($ua) {
    if (preg_match('~Windows~', $ua)) return 'Windows';
    if (preg_match('~Android~', $ua)) return 'Android';
    if (preg_match('~iPhone|iPad|iOS~', $ua)) return 'iOS';
    if (preg_match('~Mac OS~', $ua)) return 'macOS';
    if (preg_match('~Linux~', $ua)) return 'Linux';
    return 'Other';
}
function detectDevice($ua) {
    if (preg_match('~Mobile|Android|iPhone~', $ua) && !preg_match('~iPad~', $ua)) return 'Mobile';
    if (preg_match('~iPad|Tablet~', $ua)) return 'Tablet';
    return 'Desktop';
}

// Cistit referrer od vlastni domeny
$refHost = '';
if ($ref) {
    $parts = parse_url($ref);
    if (isset($parts['host'])) {
        $refHost = $parts['host'];
        if (stripos($refHost, 'greatsilkyway.cz') !== false) $refHost = ''; // interni
    }
}

// ====== ULOZIT NAVSTEVU ======
$db->prepare("INSERT INTO visits (ts, ip_hash, country, page, referrer, browser, os, device) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
   ->execute([
       time(),
       $ipHash,
       $country,
       substr($page, 0, 200),
       substr($refHost, 0, 200),
       detectBrowser($ua),
       detectOS($ua),
       detectDevice($ua),
   ]);
