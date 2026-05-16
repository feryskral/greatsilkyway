<?php
// =====================================================
//  Analytics dashboard - greatsilkyway.cz
//  Chraneno HTTP Basic Auth (viz .htaccess)
// =====================================================

$dbFile = __DIR__ . '/analytics.db';
if (!file_exists($dbFile)) {
    die("<style>body{font-family:system-ui;padding:40px;text-align:center;color:#666}</style>Databaze analytics.db jeste neexistuje. Otevrete par stranek webu a obnovte stranku.");
}

$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$range = $_GET['r'] ?? '7';
$ranges = ['1' => 'Dnes', '7' => '7 dní', '30' => '30 dní', '90' => '90 dní', '365' => 'Rok'];
if (!isset($ranges[$range])) $range = '7';
$since = time() - 86400 * (int)$range;
$prevSince = $since - 86400 * (int)$range; // pro srovnani s minulym obdobim

function q($db, $sql, $params = []) {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// AJAX endpoint pro realtime auto-refresh
if (isset($_GET['live'])) {
    header('Content-Type: application/json');
    $rt = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits WHERE ts >= ?", [time() - 300])[0]['n'];
    $today = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ?", [strtotime('today')])[0]['n'];
    echo json_encode(['live' => (int)$rt, 'today' => (int)$today, 'ts' => time()]);
    exit;
}

// Souhrn
$total = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ?", [$since])[0]['n'];
$uniqueVisitors = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits WHERE ts >= ?", [$since])[0]['n'];
$totalAll = q($db, "SELECT COUNT(*) AS n FROM visits")[0]['n'];
$uniqueAll = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits")[0]['n'];

// Predchozi obdobi pro srovnani
$prevTotal = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ? AND ts < ?", [$prevSince, $since])[0]['n'];
$prevUnique = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits WHERE ts >= ? AND ts < ?", [$prevSince, $since])[0]['n'];

function trend($cur, $prev) {
    if ($prev === 0) return $cur > 0 ? ['+∞', 'up'] : ['—', 'flat'];
    $pct = round((($cur - $prev) / $prev) * 100);
    if ($pct > 0) return ["+{$pct}%", 'up'];
    if ($pct < 0) return ["{$pct}%", 'down'];
    return ['0%', 'flat'];
}
[$totalTrend, $totalDir] = trend($total, $prevTotal);
[$uniqueTrend, $uniqueDir] = trend($uniqueVisitors, $prevUnique);

$realtime = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits WHERE ts >= ?", [time() - 300])[0]['n'];
$today = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ?", [strtotime('today')])[0]['n'];

// Vyvoj po dnech (vzdy plnou rade i kdyz 0)
$byDay = [];
$days = (int)$range;
if ($days <= 1) $days = 24; // pro "Dnes" zobraz po hodinach
$bucketSize = ($range === '1') ? 3600 : 86400;
$bucketCount = ($range === '1') ? 24 : (int)$range;
$now = time();
for ($i = $bucketCount - 1; $i >= 0; $i--) {
    $start = $now - ($i + 1) * $bucketSize;
    $end = $now - $i * $bucketSize;
    $row = q($db, "SELECT COUNT(*) AS n, COUNT(DISTINCT ip_hash) AS u FROM visits WHERE ts >= ? AND ts < ?", [$start, $end])[0];
    $byDay[] = [
        'label' => $range === '1' ? date('H', $end) . 'h' : date('j.n', $end),
        'n' => (int)$row['n'],
        'u' => (int)$row['u'],
    ];
}

// Staty
$byCountry = q($db, "
    SELECT country, COUNT(DISTINCT ip_hash) AS u, COUNT(*) AS n
    FROM visits WHERE ts >= ?
    GROUP BY country ORDER BY u DESC LIMIT 15
", [$since]);

// Stranky
$byPage = q($db, "
    SELECT page, COUNT(*) AS n, COUNT(DISTINCT ip_hash) AS u
    FROM visits WHERE ts >= ?
    GROUP BY page ORDER BY n DESC LIMIT 10
", [$since]);

$byRef = q($db, "
    SELECT referrer, COUNT(*) AS n
    FROM visits WHERE ts >= ? AND referrer != ''
    GROUP BY referrer ORDER BY n DESC LIMIT 10
", [$since]);

// === Klasifikace zdroju (socialni site, vyhledavace) ===
$allRefs = q($db, "
    SELECT referrer, COUNT(*) AS n
    FROM visits WHERE ts >= ? AND referrer != ''
    GROUP BY referrer
", [$since]);

$totalVisits = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ?", [$since])[0]['n'];
$directVisits = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ? AND referrer = ''", [$since])[0]['n'];

$socialMap = [
    'facebook'   => ['name' => 'Facebook',   'icon' => '📘', 'color' => '#1877f2', 'domains' => ['facebook.com','fb.com','fb.me','m.facebook.com','l.facebook.com','lm.facebook.com']],
    'instagram'  => ['name' => 'Instagram',  'icon' => '📷', 'color' => '#e4405f', 'domains' => ['instagram.com','l.instagram.com']],
    'tiktok'     => ['name' => 'TikTok',     'icon' => '🎵', 'color' => '#000000', 'domains' => ['tiktok.com','vm.tiktok.com']],
    'youtube'    => ['name' => 'YouTube',    'icon' => '▶️', 'color' => '#ff0000', 'domains' => ['youtube.com','m.youtube.com','youtu.be']],
    'twitter'    => ['name' => 'X (Twitter)','icon' => '🐦', 'color' => '#1da1f2', 'domains' => ['twitter.com','x.com','t.co']],
    'whatsapp'   => ['name' => 'WhatsApp',   'icon' => '💬', 'color' => '#25d366', 'domains' => ['whatsapp.com','wa.me','api.whatsapp.com']],
    'telegram'   => ['name' => 'Telegram',   'icon' => '✈️', 'color' => '#0088cc', 'domains' => ['t.me','telegram.org']],
    'linkedin'   => ['name' => 'LinkedIn',   'icon' => '💼', 'color' => '#0a66c2', 'domains' => ['linkedin.com','lnkd.in']],
    'pinterest'  => ['name' => 'Pinterest',  'icon' => '📌', 'color' => '#bd081c', 'domains' => ['pinterest.com','pinterest.cz','pin.it']],
    'reddit'     => ['name' => 'Reddit',     'icon' => '🤖', 'color' => '#ff4500', 'domains' => ['reddit.com','redd.it']],
    'threads'    => ['name' => 'Threads',    'icon' => '🧵', 'color' => '#000000', 'domains' => ['threads.net']],
    'snapchat'   => ['name' => 'Snapchat',   'icon' => '👻', 'color' => '#fffc00', 'domains' => ['snapchat.com']],
    'discord'    => ['name' => 'Discord',    'icon' => '🎮', 'color' => '#5865f2', 'domains' => ['discord.com','discord.gg']],
    'messenger'  => ['name' => 'Messenger',  'icon' => '💌', 'color' => '#0078ff', 'domains' => ['messenger.com','m.me']],
];
$searchEngines = [
    'google'  => ['name' => 'Google',  'icon' => '🔍', 'domains' => ['google.com','google.cz','google.sk','google.de','google.co.uk','www.google.com','www.google.cz']],
    'seznam'  => ['name' => 'Seznam',  'icon' => '🔎', 'domains' => ['seznam.cz','search.seznam.cz']],
    'bing'    => ['name' => 'Bing',    'icon' => '🅱️', 'domains' => ['bing.com','www.bing.com']],
    'duckduckgo' => ['name' => 'DuckDuckGo', 'icon' => '🦆', 'domains' => ['duckduckgo.com']],
    'yahoo'   => ['name' => 'Yahoo',   'icon' => '🔭', 'domains' => ['yahoo.com','search.yahoo.com']],
    'yandex'  => ['name' => 'Yandex',  'icon' => '🇷🇺', 'domains' => ['yandex.com','yandex.ru']],
    'centrum' => ['name' => 'Centrum', 'icon' => '🔍', 'domains' => ['centrum.cz','search.centrum.cz']],
];

function classifyRef($host, $socialMap, $searchEngines) {
    $host = strtolower($host);
    foreach ($socialMap as $key => $s) {
        foreach ($s['domains'] as $d) {
            if ($host === $d || str_ends_with($host, '.' . $d)) return ['social', $key];
        }
    }
    foreach ($searchEngines as $key => $s) {
        foreach ($s['domains'] as $d) {
            if ($host === $d || str_ends_with($host, '.' . $d)) return ['search', $key];
        }
    }
    return ['other', $host];
}

$socialStats = [];   // key => count
$searchStats = [];
$otherStats = [];
$otherTotal = 0;
$socialTotal = 0;
$searchTotal = 0;

foreach ($allRefs as $r) {
    [$type, $key] = classifyRef($r['referrer'], $socialMap, $searchEngines);
    if ($type === 'social') {
        $socialStats[$key] = ($socialStats[$key] ?? 0) + $r['n'];
        $socialTotal += $r['n'];
    } elseif ($type === 'search') {
        $searchStats[$key] = ($searchStats[$key] ?? 0) + $r['n'];
        $searchTotal += $r['n'];
    } else {
        $otherStats[$key] = ($otherStats[$key] ?? 0) + $r['n'];
        $otherTotal += $r['n'];
    }
}
arsort($socialStats);
arsort($searchStats);
arsort($otherStats);

// Souhrn pro velky donut "odkud chodi navstevnici"
$trafficSources = [
    ['name' => 'Přímé',      'icon' => '🔗', 'color' => '#94a3b8', 'n' => $directVisits],
    ['name' => 'Vyhledávače','icon' => '🔍', 'color' => '#3b82f6', 'n' => $searchTotal],
    ['name' => 'Soc. sítě',  'icon' => '📱', 'color' => '#ec4899', 'n' => $socialTotal],
    ['name' => 'Ostatní',    'icon' => '🌐', 'color' => '#a78bfa', 'n' => $otherTotal],
];
$trafficSources = array_filter($trafficSources, fn($s) => $s['n'] > 0);
$trafficTotal = array_sum(array_column($trafficSources, 'n')) ?: 1;

$byDevice = q($db, "SELECT device, COUNT(*) AS n FROM visits WHERE ts >= ? GROUP BY device ORDER BY n DESC", [$since]);
$byBrowser = q($db, "SELECT browser, COUNT(*) AS n FROM visits WHERE ts >= ? GROUP BY browser ORDER BY n DESC", [$since]);
$byOS = q($db, "SELECT os, COUNT(*) AS n FROM visits WHERE ts >= ? GROUP BY os ORDER BY n DESC", [$since]);

$recent = q($db, "
    SELECT ts, country, page, referrer, device, browser
    FROM visits WHERE ts >= ?
    ORDER BY ts DESC LIMIT 30
", [$since]);

function countryFlag($code) {
    if (!$code || $code === '??' || strlen($code) !== 2) return '🌐';
    return mb_convert_encoding('&#' . (127397 + ord($code[0])) . ';', 'UTF-8', 'HTML-ENTITIES')
         . mb_convert_encoding('&#' . (127397 + ord($code[1])) . ';', 'UTF-8', 'HTML-ENTITIES');
}
function countryName($code) {
    $n = ['CZ'=>'Česko','SK'=>'Slovensko','PL'=>'Polsko','DE'=>'Německo','AT'=>'Rakousko','HU'=>'Maďarsko','GB'=>'V. Británie','US'=>'USA','RU'=>'Rusko','UA'=>'Ukrajina','FR'=>'Francie','IT'=>'Itálie','ES'=>'Španělsko','NL'=>'Nizozemsko','CN'=>'Čína','JP'=>'Japonsko','IN'=>'Indie','CA'=>'Kanada','AU'=>'Austrálie','CH'=>'Švýcarsko','BE'=>'Belgie','DK'=>'Dánsko','SE'=>'Švédsko','NO'=>'Norsko','FI'=>'Finsko','IE'=>'Irsko','PT'=>'Portugalsko','GR'=>'Řecko','RO'=>'Rumunsko','BG'=>'Bulharsko','TR'=>'Turecko','IL'=>'Izrael','BR'=>'Brazílie','MX'=>'Mexiko','??'=>'Neznámý'];
    return $n[$code] ?? $code;
}

// Pripravit data pro SVG line chart
$chartMaxN = max(array_column($byDay, 'n')) ?: 1;
$chartMaxU = max(array_column($byDay, 'u')) ?: 1;
$chartMax = max($chartMaxN, 1);

// SVG donut helpers
function donutPath($cx, $cy, $rOuter, $rInner, $startAngle, $endAngle) {
    $startRad = deg2rad($startAngle - 90);
    $endRad = deg2rad($endAngle - 90);
    $x1o = $cx + $rOuter * cos($startRad);
    $y1o = $cy + $rOuter * sin($startRad);
    $x2o = $cx + $rOuter * cos($endRad);
    $y2o = $cy + $rOuter * sin($endRad);
    $x1i = $cx + $rInner * cos($endRad);
    $y1i = $cy + $rInner * sin($endRad);
    $x2i = $cx + $rInner * cos($startRad);
    $y2i = $cy + $rInner * sin($startRad);
    $large = ($endAngle - $startAngle) > 180 ? 1 : 0;
    return "M $x1o $y1o A $rOuter $rOuter 0 $large 1 $x2o $y2o L $x1i $y1i A $rInner $rInner 0 $large 0 $x2i $y2i Z";
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>📊 Statistiky · Great Silkyway</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  :root {
    --bg: #0f172a;
    --bg-2: #1e293b;
    --card: rgba(30, 41, 59, 0.7);
    --card-border: rgba(148, 163, 184, 0.1);
    --text: #f1f5f9;
    --text-soft: #94a3b8;
    --text-dim: #64748b;
    --gold: #c9a961;
    --gold-bright: #f0c674;
    --green: #10b981;
    --red: #ef4444;
    --blue: #3b82f6;
    --purple: #a78bfa;
    --pink: #ec4899;
    --gradient-1: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-2: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --gradient-3: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    --gradient-gold: linear-gradient(135deg, #c9a961 0%, #f0c674 100%);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: var(--bg); color: var(--text); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; min-height: 100vh; }
  body {
    background:
      radial-gradient(circle at 20% 10%, rgba(102, 126, 234, 0.12), transparent 50%),
      radial-gradient(circle at 80% 90%, rgba(236, 72, 153, 0.08), transparent 50%),
      linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
    background-attachment: fixed;
  }
  .container { max-width: 1440px; margin: 0 auto; padding: 24px; }

  /* HEADER */
  .header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 32px; padding-bottom: 24px;
    border-bottom: 1px solid var(--card-border);
    animation: slideDown 0.6s ease-out;
  }
  .header h1 {
    font-size: 1.8rem; font-weight: 700;
    background: var(--gradient-gold); -webkit-background-clip: text;
    background-clip: text; -webkit-text-fill-color: transparent;
    display: flex; align-items: center; gap: 12px;
  }
  .header h1 .icon { font-size: 2rem; -webkit-text-fill-color: initial; }
  .header .sub { color: var(--text-soft); font-size: 0.9rem; margin-top: 4px; }
  .header .nav-links { display: flex; gap: 8px; align-items: center; }
  .header .nav-links a {
    color: var(--text-soft); text-decoration: none; font-size: 0.9rem;
    padding: 8px 14px; border-radius: 8px; transition: all 0.2s;
  }
  .header .nav-links a:hover { background: var(--card); color: var(--text); }

  /* RANGE TABS */
  .range {
    display: flex; gap: 4px; background: var(--card); padding: 4px;
    border-radius: 12px; margin-bottom: 24px; width: fit-content;
    border: 1px solid var(--card-border); backdrop-filter: blur(10px);
    animation: slideDown 0.7s ease-out;
  }
  .range a {
    padding: 8px 18px; color: var(--text-soft); text-decoration: none;
    font-size: 0.88rem; font-weight: 500; border-radius: 8px;
    transition: all 0.25s cubic-bezier(.4, 0, .2, 1);
  }
  .range a:hover { color: var(--text); }
  .range a.active {
    background: var(--gradient-gold); color: #1e293b;
    box-shadow: 0 4px 14px rgba(201, 169, 97, 0.3);
  }

  /* STAT CARDS */
  .stats-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px; margin-bottom: 24px;
  }
  .stat-card {
    background: var(--card); border: 1px solid var(--card-border);
    border-radius: 16px; padding: 22px; position: relative; overflow: hidden;
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(.4, 0, .2, 1);
    animation: fadeUp 0.6s ease-out backwards;
  }
  .stat-card:nth-child(1) { animation-delay: 0.05s; }
  .stat-card:nth-child(2) { animation-delay: 0.1s; }
  .stat-card:nth-child(3) { animation-delay: 0.15s; }
  .stat-card:nth-child(4) { animation-delay: 0.2s; }
  .stat-card:hover {
    transform: translateY(-4px);
    border-color: rgba(201, 169, 97, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    background: var(--gradient-gold); opacity: 0;
    transition: opacity 0.3s;
  }
  .stat-card:hover::before { opacity: 1; }
  .stat-card .label {
    font-size: 0.72rem; color: var(--text-dim); text-transform: uppercase;
    letter-spacing: 1px; font-weight: 600; display: flex; align-items: center; gap: 6px;
  }
  .stat-card .value {
    font-size: 2.4rem; font-weight: 700; margin: 8px 0 4px;
    color: var(--text); font-variant-numeric: tabular-nums;
    letter-spacing: -1px;
  }
  .stat-card .extra { font-size: 0.82rem; color: var(--text-soft); }
  .trend {
    display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px;
    border-radius: 6px; font-size: 0.72rem; font-weight: 600; margin-left: 6px;
  }
  .trend.up { background: rgba(16, 185, 129, 0.15); color: var(--green); }
  .trend.down { background: rgba(239, 68, 68, 0.15); color: var(--red); }
  .trend.flat { background: rgba(148, 163, 184, 0.15); color: var(--text-soft); }
  .live-dot {
    display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    background: var(--green); margin-right: 6px; position: relative;
  }
  .live-dot::before {
    content: ''; position: absolute; inset: -4px; border-radius: 50%;
    background: var(--green); opacity: 0.4;
    animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  /* CARDS */
  .grid {
    display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px;
  }
  .card {
    background: var(--card); border: 1px solid var(--card-border);
    border-radius: 16px; padding: 22px; backdrop-filter: blur(10px);
    transition: all 0.3s; animation: fadeUp 0.7s ease-out backwards;
  }
  .card:hover { border-color: rgba(201, 169, 97, 0.2); }
  .card.span-8 { grid-column: span 8; }
  .card.span-6 { grid-column: span 6; }
  .card.span-4 { grid-column: span 4; }
  .card.span-12 { grid-column: span 12; }
  @media (max-width: 980px) {
    .card.span-8, .card.span-6, .card.span-4 { grid-column: span 12; }
  }
  .card h2 {
    font-size: 0.95rem; color: var(--text); margin-bottom: 16px;
    font-weight: 600; display: flex; align-items: center; gap: 8px;
  }
  .card h2 .badge { margin-left: auto; font-size: 0.7rem; color: var(--text-dim); font-weight: normal; }

  /* CHART */
  .chart-wrap { position: relative; height: 280px; }
  .chart-svg { width: 100%; height: 100%; overflow: visible; }
  .chart-line { fill: none; stroke: var(--gold); stroke-width: 2.5; stroke-linejoin: round; stroke-linecap: round;
    stroke-dasharray: 2000; stroke-dashoffset: 2000;
    animation: drawLine 1.8s ease-out forwards 0.3s;
  }
  .chart-area { fill: url(#areaGradient); opacity: 0; animation: fadeIn 0.8s ease-out forwards 1.5s; }
  .chart-dot {
    fill: var(--gold); stroke: var(--bg-2); stroke-width: 2;
    opacity: 0; animation: popIn 0.4s ease-out forwards;
    cursor: pointer; transition: r 0.2s;
  }
  .chart-dot:hover { r: 6; }
  .chart-label { fill: var(--text-dim); font-size: 11px; text-anchor: middle; }
  .chart-grid { stroke: rgba(148, 163, 184, 0.08); stroke-width: 1; }
  .chart-tooltip {
    position: absolute; background: var(--bg-2); border: 1px solid var(--card-border);
    border-radius: 8px; padding: 8px 12px; font-size: 0.85rem; color: var(--text);
    pointer-events: none; opacity: 0; transition: opacity 0.15s;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4); white-space: nowrap;
    transform: translate(-50%, -100%); margin-top: -8px;
  }
  .chart-tooltip.visible { opacity: 1; }
  .chart-tooltip b { color: var(--gold-bright); }

  /* BAR LIST */
  .bar-list { display: flex; flex-direction: column; gap: 10px; }
  .bar-row {
    display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: center;
    padding: 8px 0; position: relative; cursor: default;
    animation: slideIn 0.5s ease-out backwards;
  }
  .bar-row:nth-child(1) { animation-delay: 0.1s; }
  .bar-row:nth-child(2) { animation-delay: 0.15s; }
  .bar-row:nth-child(3) { animation-delay: 0.2s; }
  .bar-row:nth-child(4) { animation-delay: 0.25s; }
  .bar-row:nth-child(5) { animation-delay: 0.3s; }
  .bar-row:nth-child(n+6) { animation-delay: 0.35s; }
  .bar-track {
    position: relative; height: 32px; display: flex; align-items: center;
    padding: 0 10px; border-radius: 8px; overflow: hidden;
    background: rgba(148, 163, 184, 0.05);
  }
  .bar-fill {
    position: absolute; top: 0; bottom: 0; left: 0; border-radius: 8px;
    background: linear-gradient(90deg, rgba(201, 169, 97, 0.3), rgba(201, 169, 97, 0.1));
    transition: width 1.2s cubic-bezier(.4, 0, .2, 1);
    width: 0; /* JS to animuje */
  }
  .bar-label { position: relative; font-size: 0.88rem; color: var(--text); z-index: 1; display: flex; align-items: center; gap: 6px; }
  .bar-value { font-size: 0.85rem; color: var(--text); font-weight: 600; font-variant-numeric: tabular-nums; min-width: 40px; text-align: right; }
  .bar-value small { color: var(--text-dim); font-weight: normal; font-size: 0.78rem; margin-left: 4px; }

  /* DONUT */
  .donut-wrap { display: flex; align-items: center; gap: 20px; }
  .donut-wrap svg { flex-shrink: 0; }
  .donut-segment { transition: transform 0.3s, opacity 0.3s; transform-origin: center; cursor: pointer; }
  .donut-segment:hover { transform: scale(1.05); }
  .donut-legend { display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; }
  .donut-legend .item { display: flex; align-items: center; gap: 8px; }
  .donut-legend .swatch { width: 12px; height: 12px; border-radius: 3px; }
  .donut-center {
    fill: var(--text); font-size: 24px; font-weight: 700; text-anchor: middle; dominant-baseline: middle;
  }
  .donut-center-label {
    fill: var(--text-dim); font-size: 11px; text-anchor: middle; dominant-baseline: middle;
  }

  /* TABLE */
  table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
  thead th {
    text-align: left; padding: 10px 8px; font-weight: 600; color: var(--text-dim);
    text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px;
    border-bottom: 1px solid var(--card-border);
  }
  tbody td {
    padding: 10px 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.05);
    color: var(--text);
  }
  tbody tr {
    animation: fadeIn 0.4s ease-out backwards;
    transition: background 0.15s;
  }
  tbody tr:hover { background: rgba(148, 163, 184, 0.04); }
  tbody tr:nth-child(1) { animation-delay: 0.05s; }
  tbody tr:nth-child(2) { animation-delay: 0.08s; }
  tbody tr:nth-child(3) { animation-delay: 0.11s; }
  tbody tr:nth-child(n+4) { animation-delay: 0.14s; }
  td.dim { color: var(--text-dim); }
  td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }

  .empty {
    text-align: center; padding: 40px 20px; color: var(--text-dim); font-style: italic;
  }
  .footer {
    margin-top: 40px; text-align: center; color: var(--text-dim);
    font-size: 0.78rem; padding: 20px;
  }
  .footer code { background: var(--card); padding: 2px 8px; border-radius: 4px; color: var(--gold); }

  /* ANIMATIONS */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes slideIn { from { opacity: 0; transform: translateX(-15px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes popIn { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
  @keyframes ping {
    0% { transform: scale(1); opacity: 0.4; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  @keyframes drawLine { to { stroke-dashoffset: 0; } }
  @keyframes pulse { 50% { opacity: 0.5; } }

  .pulse-update { animation: pulse 0.5s ease-out; }
</style>
</head>
<body>

<div class="container">

  <div class="header">
    <div>
      <h1><span class="icon">📊</span> Statistiky webu</h1>
      <div class="sub">Great Silkyway · privátní analytika · žádné cookies · GDPR-friendly</div>
    </div>
    <div class="nav-links">
      <a href="admin.html">← Admin</a>
      <a href="index.html">Web ↗</a>
    </div>
  </div>

  <div class="range">
    <?php foreach ($ranges as $k => $v): ?>
      <a href="?r=<?= $k ?>" class="<?= $k === $range ? 'active' : '' ?>"><?= $v ?></a>
    <?php endforeach; ?>
  </div>

  <!-- HERO STATS -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="label">👁 Zobrazení stránek</div>
      <div class="value" data-count="<?= $total ?>">0</div>
      <div class="extra">
        <span class="trend <?= $totalDir ?>"><?= htmlspecialchars($totalTrend) ?></span>
        oproti minulému období
      </div>
    </div>
    <div class="stat-card">
      <div class="label">👤 Unikátní návštěvníci</div>
      <div class="value" data-count="<?= $uniqueVisitors ?>">0</div>
      <div class="extra">
        <span class="trend <?= $uniqueDir ?>"><?= htmlspecialchars($uniqueTrend) ?></span>
        oproti minulému období
      </div>
    </div>
    <div class="stat-card">
      <div class="label">📈 Stránek na návštěvníka</div>
      <div class="value"><?= $uniqueVisitors ? number_format($total / $uniqueVisitors, 1, ',', ' ') : '0,0' ?></div>
      <div class="extra">průměr za období</div>
    </div>
    <div class="stat-card">
      <div class="label"><span class="live-dot"></span>Aktivní právě teď</div>
      <div class="value" id="liveCount" data-count="<?= $realtime ?>">0</div>
      <div class="extra">posledních 5 minut · dnes <span id="todayCount"><?= $today ?></span></div>
    </div>
  </div>

  <div class="grid">

    <!-- CHART -->
    <div class="card span-8">
      <h2>📈 Vývoj návštěvnosti
        <span class="badge"><?= $ranges[$range] ?></span>
      </h2>
      <div class="chart-wrap">
        <div class="chart-tooltip" id="tooltip"></div>
        <svg class="chart-svg" id="chart" viewBox="0 0 800 260" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#c9a961" stop-opacity="0.4"/>
              <stop offset="100%" stop-color="#c9a961" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- gridlines -->
          <?php for ($i = 1; $i <= 4; $i++): $y = 220 - ($i * 50); ?>
            <line class="chart-grid" x1="40" y1="<?= $y ?>" x2="780" y2="<?= $y ?>"/>
          <?php endfor; ?>
          <?php
            // Compute points
            $count = count($byDay);
            $w = 740; $h = 200; $x0 = 40; $y0 = 220;
            $points = [];
            foreach ($byDay as $i => $d) {
                $x = $x0 + ($count > 1 ? ($i / ($count - 1)) * $w : $w / 2);
                $y = $y0 - ($d['n'] / $chartMax) * $h;
                $points[] = ['x' => $x, 'y' => $y, 'label' => $d['label'], 'n' => $d['n'], 'u' => $d['u']];
            }
            // Build path
            $linePath = '';
            $areaPath = '';
            foreach ($points as $i => $p) {
                $cmd = $i === 0 ? 'M' : 'L';
                $linePath .= "$cmd {$p['x']},{$p['y']} ";
            }
            if (!empty($points)) {
                $first = $points[0]; $last = end($points);
                $areaPath = "M {$first['x']},{$y0} L " . substr($linePath, 2) . " L {$last['x']},{$y0} Z";
            }
          ?>
          <path class="chart-area" d="<?= $areaPath ?>"/>
          <path class="chart-line" d="<?= $linePath ?>"/>
          <?php foreach ($points as $i => $p): ?>
            <circle class="chart-dot" cx="<?= $p['x'] ?>" cy="<?= $p['y'] ?>" r="4"
              style="animation-delay: <?= 1.5 + $i * 0.04 ?>s"
              data-label="<?= htmlspecialchars($p['label']) ?>"
              data-n="<?= $p['n'] ?>" data-u="<?= $p['u'] ?>"/>
          <?php endforeach; ?>
          <?php
            // X-axis labels (every Nth to avoid overlap)
            $step = max(1, (int)ceil($count / 10));
            foreach ($points as $i => $p):
              if ($i % $step !== 0 && $i !== $count - 1) continue;
          ?>
            <text class="chart-label" x="<?= $p['x'] ?>" y="245"><?= htmlspecialchars($p['label']) ?></text>
          <?php endforeach; ?>
          <!-- Y-axis values -->
          <?php for ($i = 0; $i <= 4; $i++):
            $val = round($chartMax * $i / 4);
            $y = 220 - ($i * 50);
          ?>
            <text class="chart-label" x="30" y="<?= $y + 4 ?>" text-anchor="end" style="fill: var(--text-dim)"><?= $val ?></text>
          <?php endfor; ?>
        </svg>
      </div>
    </div>

    <!-- DEVICE DONUT -->
    <div class="card span-4">
      <h2>📱 Zařízení</h2>
      <?php
        $devTotal = array_sum(array_column($byDevice, 'n')) ?: 1;
        $devColors = ['Desktop' => '#c9a961', 'Mobile' => '#f0c674', 'Tablet' => '#a78bfa', 'Other' => '#64748b'];
        $deviceTopName = $byDevice[0]['device'] ?? '—';
        $deviceTopPct = $byDevice ? round(($byDevice[0]['n'] / $devTotal) * 100) : 0;
      ?>
      <div class="donut-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <?php
            $angle = 0;
            foreach ($byDevice as $d):
              $slice = ($d['n'] / $devTotal) * 360;
              if ($slice < 0.5) continue;
              $color = $devColors[$d['device']] ?? '#64748b';
              $path = donutPath(70, 70, 60, 40, $angle, $angle + $slice);
              $angle += $slice;
          ?>
            <path class="donut-segment" d="<?= $path ?>" fill="<?= $color ?>"/>
          <?php endforeach; ?>
          <text class="donut-center" x="70" y="64"><?= $deviceTopPct ?>%</text>
          <text class="donut-center-label" x="70" y="82"><?= htmlspecialchars($deviceTopName) ?></text>
        </svg>
        <div class="donut-legend">
          <?php foreach ($byDevice as $d):
            $color = $devColors[$d['device']] ?? '#64748b';
            $pct = round(($d['n'] / $devTotal) * 100);
          ?>
            <div class="item">
              <span class="swatch" style="background: <?= $color ?>"></span>
              <span><?= htmlspecialchars($d['device']) ?> <small style="color: var(--text-dim)">(<?= $pct ?>%)</small></span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
    </div>

    <!-- COUNTRIES -->
    <div class="card span-6">
      <h2>🌍 Státy <span class="badge">top 15</span></h2>
      <?php if ($byCountry):
        $maxU = max(array_column($byCountry, 'u')) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($byCountry as $r): $w = ($r['u'] / $maxU) * 100; ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>"></div>
                <div class="bar-label"><?= countryFlag($r['country']) ?> <?= htmlspecialchars(countryName($r['country'])) ?></div>
              </div>
              <div class="bar-value"><?= $r['u'] ?><small><?= $r['n'] ?></small></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?><div class="empty">Žádná data</div><?php endif; ?>
    </div>

    <!-- TOP PAGES -->
    <div class="card span-6">
      <h2>📄 Top stránky <span class="badge">top 10</span></h2>
      <?php if ($byPage):
        $maxP = max(array_column($byPage, 'n')) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($byPage as $r): $w = ($r['n'] / $maxP) * 100; ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>"></div>
                <div class="bar-label"><?= htmlspecialchars($r['page']) ?></div>
              </div>
              <div class="bar-value"><?= $r['n'] ?><small><?= $r['u'] ?></small></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?><div class="empty">Žádná data</div><?php endif; ?>
    </div>

    <!-- TRAFFIC SOURCES DONUT -->
    <div class="card span-4">
      <h2>🚦 Odkud chodí návštěvníci</h2>
      <?php if ($trafficTotal > 0 && count($trafficSources) > 0): ?>
      <div class="donut-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <?php
            $angle = 0;
            $topSrc = reset($trafficSources);
            $topPct = round(($topSrc['n'] / $trafficTotal) * 100);
            foreach ($trafficSources as $s):
              $slice = ($s['n'] / $trafficTotal) * 360;
              if ($slice < 0.5) continue;
              $path = donutPath(70, 70, 60, 40, $angle, $angle + $slice);
              $angle += $slice;
          ?>
            <path class="donut-segment" d="<?= $path ?>" fill="<?= $s['color'] ?>"/>
          <?php endforeach; ?>
          <text class="donut-center" x="70" y="64"><?= $topPct ?>%</text>
          <text class="donut-center-label" x="70" y="82"><?= htmlspecialchars($topSrc['name']) ?></text>
        </svg>
        <div class="donut-legend">
          <?php foreach ($trafficSources as $s):
            $pct = round(($s['n'] / $trafficTotal) * 100);
          ?>
            <div class="item">
              <span class="swatch" style="background: <?= $s['color'] ?>"></span>
              <span><?= $s['icon'] ?> <?= htmlspecialchars($s['name']) ?>
                <small style="color: var(--text-dim)"><?= $s['n'] ?> · <?= $pct ?>%</small></span>
            </div>
          <?php endforeach; ?>
        </div>
      </div>
      <?php else: ?><div class="empty">Žádná data</div><?php endif; ?>
    </div>

    <!-- SOCIAL NETWORKS -->
    <div class="card span-4">
      <h2>📱 Sociální sítě <span class="badge"><?= $socialTotal ?> návštěv</span></h2>
      <?php if (!empty($socialStats)):
        $maxSoc = max($socialStats) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($socialStats as $key => $n):
            $w = ($n / $maxSoc) * 100;
            $s = $socialMap[$key];
            $pct = $socialTotal ? round(($n / $socialTotal) * 100) : 0;
          ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>" style="background: linear-gradient(90deg, <?= $s['color'] ?>55, <?= $s['color'] ?>11);"></div>
                <div class="bar-label"><?= $s['icon'] ?> <?= htmlspecialchars($s['name']) ?></div>
              </div>
              <div class="bar-value"><?= $n ?><small><?= $pct ?>%</small></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?><div class="empty">Zatím žádné návštěvy<br>ze sociálních sítí</div><?php endif; ?>
    </div>

    <!-- SEARCH ENGINES -->
    <div class="card span-4">
      <h2>🔍 Vyhledávače <span class="badge"><?= $searchTotal ?> návštěv</span></h2>
      <?php if (!empty($searchStats)):
        $maxSe = max($searchStats) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($searchStats as $key => $n):
            $w = ($n / $maxSe) * 100;
            $s = $searchEngines[$key];
            $pct = $searchTotal ? round(($n / $searchTotal) * 100) : 0;
          ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>"></div>
                <div class="bar-label"><?= $s['icon'] ?> <?= htmlspecialchars($s['name']) ?></div>
              </div>
              <div class="bar-value"><?= $n ?><small><?= $pct ?>%</small></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?><div class="empty">Zatím žádné návštěvy<br>z vyhledávačů</div><?php endif; ?>
    </div>

    <!-- OTHER REFERRERS -->
    <div class="card span-12">
      <h2>🌐 Ostatní zdroje (cizí weby) <span class="badge">top 10</span></h2>
      <?php if (!empty($otherStats)):
        $shown = array_slice($otherStats, 0, 10, true);
        $maxO2 = max($shown) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($shown as $host => $n): $w = ($n / $maxO2) * 100; ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>"></div>
                <div class="bar-label">🌐 <?= htmlspecialchars($host) ?></div>
              </div>
              <div class="bar-value"><?= $n ?></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php else: ?><div class="empty">Žádné externí odkazy<br>(návštěvníci přicházejí přímo, ze soc. sítí nebo z vyhledávačů)</div><?php endif; ?>
    </div>

    <!-- BROWSERS -->
    <div class="card span-4">
      <h2>🌐 Prohlížeče</h2>
      <?php if ($byBrowser):
        $maxBr = max(array_column($byBrowser, 'n')) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($byBrowser as $r): $w = ($r['n'] / $maxBr) * 100; ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>"></div>
                <div class="bar-label"><?= htmlspecialchars($r['browser']) ?></div>
              </div>
              <div class="bar-value"><?= $r['n'] ?></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- OS -->
    <div class="card span-4">
      <h2>💻 Operační systémy</h2>
      <?php if ($byOS):
        $maxO = max(array_column($byOS, 'n')) ?: 1;
      ?>
        <div class="bar-list">
          <?php foreach ($byOS as $r): $w = ($r['n'] / $maxO) * 100; ?>
            <div class="bar-row">
              <div class="bar-track">
                <div class="bar-fill" data-width="<?= $w ?>"></div>
                <div class="bar-label"><?= htmlspecialchars($r['os']) ?></div>
              </div>
              <div class="bar-value"><?= $r['n'] ?></div>
            </div>
          <?php endforeach; ?>
        </div>
      <?php endif; ?>
    </div>

    <!-- RECENT -->
    <div class="card span-12">
      <h2>🕒 Posledních 30 návštěv</h2>
      <?php if ($recent): ?>
        <div style="overflow-x: auto;">
        <table>
          <thead><tr>
            <th>Čas</th><th>Stát</th><th>Stránka</th><th>Zdroj</th><th>Zařízení</th><th>Prohlížeč</th>
          </tr></thead>
          <tbody>
            <?php foreach ($recent as $r): ?>
              <tr>
                <td class="dim"><?= date('d.m. H:i:s', $r['ts']) ?></td>
                <td><?= countryFlag($r['country']) ?> <?= htmlspecialchars(countryName($r['country'])) ?></td>
                <td><?= htmlspecialchars($r['page']) ?></td>
                <td class="dim"><?= htmlspecialchars($r['referrer'] ?: '—') ?></td>
                <td><?= htmlspecialchars($r['device']) ?></td>
                <td><?= htmlspecialchars($r['browser']) ?></td>
              </tr>
            <?php endforeach; ?>
          </tbody>
        </table>
        </div>
      <?php else: ?><div class="empty">Žádné návštěvy v zadaném období</div><?php endif; ?>
    </div>

  </div>

  <div class="footer">
    Privátní analytika · IP jen hashovaná · auto-refresh každých 30 s · DB: <code>analytics.db</code><br>
    Vygenerováno <?= date('d.m.Y H:i:s') ?> · načteno za <?= round((microtime(true) - $_SERVER['REQUEST_TIME_FLOAT']) * 1000) ?> ms
  </div>

</div>

<script>
  // === COUNT-UP animace ===
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const duration = 1200;
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const p = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.floor(target * eased);
      el.textContent = val.toLocaleString('cs-CZ');
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('cs-CZ');
    }
    requestAnimationFrame(step);
  });

  // === BAR fill animace (po nacteni) ===
  setTimeout(() => {
    document.querySelectorAll('.bar-fill').forEach(el => {
      el.style.width = el.dataset.width + '%';
    });
  }, 200);

  // === CHART tooltip ===
  const tooltip = document.getElementById('tooltip');
  const chart = document.getElementById('chart');
  document.querySelectorAll('.chart-dot').forEach(dot => {
    dot.addEventListener('mouseenter', e => {
      const rect = chart.getBoundingClientRect();
      const cx = parseFloat(dot.getAttribute('cx'));
      const cy = parseFloat(dot.getAttribute('cy'));
      const scaleX = rect.width / 800;
      const scaleY = rect.height / 260;
      tooltip.style.left = (cx * scaleX) + 'px';
      tooltip.style.top = (cy * scaleY) + 'px';
      tooltip.innerHTML = `<b>${dot.dataset.label}</b><br>Zobrazení: ${dot.dataset.n}<br>Unikátní: ${dot.dataset.u}`;
      tooltip.classList.add('visible');
    });
    dot.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
  });

  // === LIVE auto-refresh ===
  async function refreshLive() {
    try {
      const r = await fetch('?live=1&_=' + Date.now());
      const d = await r.json();
      const live = document.getElementById('liveCount');
      const today = document.getElementById('todayCount');
      if (parseInt(live.textContent.replace(/\s/g, ''), 10) !== d.live) {
        live.textContent = d.live.toLocaleString('cs-CZ');
        live.classList.add('pulse-update');
        setTimeout(() => live.classList.remove('pulse-update'), 600);
      }
      today.textContent = d.today.toLocaleString('cs-CZ');
    } catch (e) {}
  }
  setInterval(refreshLive, 30000);
</script>

</body>
</html>
