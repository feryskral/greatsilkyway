<?php
// =====================================================
//  Analytics dashboard - greatsilkyway.cz
//  Chraneno HTTP Basic Auth (viz .htaccess)
// =====================================================

$dbFile = __DIR__ . '/analytics.db';
if (!file_exists($dbFile)) {
    die("Databaze analytics.db jeste neexistuje. Bude vytvorena po prvni navsteve.");
}

$db = new PDO('sqlite:' . $dbFile);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$range = $_GET['r'] ?? '7';
$ranges = ['1' => 'Dnes', '7' => '7 dni', '30' => '30 dni', '90' => '90 dni', '365' => 'Rok'];
if (!isset($ranges[$range])) $range = '7';
$since = time() - 86400 * (int)$range;

function q($db, $sql, $params = []) {
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// Souhrn
$total = q($db, "SELECT COUNT(*) AS n FROM visits WHERE ts >= ?", [$since])[0]['n'];
$uniqueVisitors = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits WHERE ts >= ?", [$since])[0]['n'];
$totalAll = q($db, "SELECT COUNT(*) AS n FROM visits")[0]['n'];
$uniqueAll = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits")[0]['n'];

// Realtime - poslednich 5 minut
$realtime = q($db, "SELECT COUNT(DISTINCT ip_hash) AS n FROM visits WHERE ts >= ?", [time() - 300])[0]['n'];

// Po dnech
$byDay = q($db, "
    SELECT date(ts, 'unixepoch', 'localtime') AS day, COUNT(*) AS n, COUNT(DISTINCT ip_hash) AS u
    FROM visits WHERE ts >= ?
    GROUP BY day ORDER BY day
", [$since]);

// Staty
$byCountry = q($db, "
    SELECT country, COUNT(DISTINCT ip_hash) AS u, COUNT(*) AS n
    FROM visits WHERE ts >= ?
    GROUP BY country ORDER BY u DESC LIMIT 20
", [$since]);

// Stranky
$byPage = q($db, "
    SELECT page, COUNT(*) AS n, COUNT(DISTINCT ip_hash) AS u
    FROM visits WHERE ts >= ?
    GROUP BY page ORDER BY n DESC LIMIT 20
", [$since]);

// Referrery
$byRef = q($db, "
    SELECT referrer, COUNT(*) AS n
    FROM visits WHERE ts >= ? AND referrer != ''
    GROUP BY referrer ORDER BY n DESC LIMIT 15
", [$since]);

// Zarizeni
$byDevice = q($db, "
    SELECT device, COUNT(*) AS n
    FROM visits WHERE ts >= ?
    GROUP BY device ORDER BY n DESC
", [$since]);

// Prohlizece
$byBrowser = q($db, "
    SELECT browser, COUNT(*) AS n
    FROM visits WHERE ts >= ?
    GROUP BY browser ORDER BY n DESC
", [$since]);

// OS
$byOS = q($db, "
    SELECT os, COUNT(*) AS n
    FROM visits WHERE ts >= ?
    GROUP BY os ORDER BY n DESC
", [$since]);

// Posledni navstevy
$recent = q($db, "
    SELECT ts, country, page, referrer, device, browser
    FROM visits WHERE ts >= ?
    ORDER BY ts DESC LIMIT 50
", [$since]);

function countryFlag($code) {
    if (!$code || $code === '??' || strlen($code) !== 2) return '🌐';
    return mb_convert_encoding('&#' . (127397 + ord($code[0])) . ';', 'UTF-8', 'HTML-ENTITIES')
         . mb_convert_encoding('&#' . (127397 + ord($code[1])) . ';', 'UTF-8', 'HTML-ENTITIES');
}
function countryName($code) {
    $names = [
        'CZ'=>'Česko','SK'=>'Slovensko','PL'=>'Polsko','DE'=>'Německo','AT'=>'Rakousko',
        'HU'=>'Maďarsko','GB'=>'V. Británie','US'=>'USA','RU'=>'Rusko','UA'=>'Ukrajina',
        'FR'=>'Francie','IT'=>'Itálie','ES'=>'Španělsko','NL'=>'Nizozemsko','CN'=>'Čína',
        'JP'=>'Japonsko','IN'=>'Indie','CA'=>'Kanada','AU'=>'Austrálie','CH'=>'Švýcarsko',
        'BE'=>'Belgie','DK'=>'Dánsko','SE'=>'Švédsko','NO'=>'Norsko','FI'=>'Finsko',
        'IE'=>'Irsko','PT'=>'Portugalsko','GR'=>'Řecko','RO'=>'Rumunsko','BG'=>'Bulharsko',
        'TR'=>'Turecko','IL'=>'Izrael','BR'=>'Brazílie','MX'=>'Mexiko','??' => 'Neznámý',
    ];
    return $names[$code] ?? $code;
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="UTF-8">
<title>Statistiky - Great Silkyway</title>
<style>
  :root {
    --bg: #f5f3ef; --card: #fff; --navy: #0d1b3e; --gold: #c9a961;
    --text: #2c3e50; --soft: #7f8c8d; --border: #e1dcd1;
  }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, sans-serif; background: var(--bg); color: var(--text); margin: 0; padding: 20px; }
  .container { max-width: 1280px; margin: 0 auto; }
  h1 { color: var(--navy); margin: 0 0 8px; }
  .sub { color: var(--soft); margin-bottom: 24px; }
  .range { margin: 16px 0 24px; display: flex; gap: 8px; flex-wrap: wrap; }
  .range a { padding: 6px 14px; background: #fff; border: 1px solid var(--border); border-radius: 6px; text-decoration: none; color: var(--text); font-size: 0.9rem; }
  .range a.active { background: var(--navy); color: #fff; border-color: var(--navy); }
  .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; margin-bottom: 24px; }
  .stat { background: var(--card); padding: 18px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .stat-label { font-size: 0.8rem; color: var(--soft); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-size: 2rem; font-weight: bold; color: var(--navy); margin-top: 6px; }
  .stat-extra { font-size: 0.85rem; color: var(--soft); margin-top: 4px; }
  .live { display: inline-block; width: 8px; height: 8px; background: #27ae60; border-radius: 50%; margin-right: 6px; animation: pulse 2s infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 18px; }
  .card { background: var(--card); padding: 20px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
  .card h2 { font-size: 1.05rem; color: var(--navy); margin: 0 0 14px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
  table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
  th, td { text-align: left; padding: 8px 4px; border-bottom: 1px solid #f0ede5; }
  th { color: var(--soft); font-weight: 500; font-size: 0.78rem; text-transform: uppercase; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; color: var(--navy); font-weight: 500; }
  .bar { background: linear-gradient(to right, var(--gold) var(--w, 0%), transparent var(--w, 0%)); padding: 6px 8px; border-radius: 4px; }
  .empty { color: var(--soft); font-style: italic; padding: 20px 0; text-align: center; }
  .chart { height: 200px; display: flex; align-items: flex-end; gap: 4px; margin-top: 8px; padding: 8px 0; border-bottom: 1px solid var(--border); }
  .chart-bar { flex: 1; background: var(--gold); border-radius: 3px 3px 0 0; min-height: 2px; position: relative; }
  .chart-bar:hover { background: var(--navy); }
  .chart-bar span { position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); font-size: 0.65rem; color: var(--soft); white-space: nowrap; }
  .chart-bar b { position: absolute; top: -18px; left: 50%; transform: translateX(-50%); font-size: 0.7rem; color: var(--navy); }
  .footer { margin-top: 30px; text-align: center; color: var(--soft); font-size: 0.8rem; }
</style>
</head>
<body>
<div class="container">
  <h1>📊 Statistiky webu</h1>
  <div class="sub">Privátní analytika — bez Google, bez cookies, GDPR-friendly</div>

  <div class="range">
    <?php foreach ($ranges as $k => $v): ?>
      <a href="?r=<?= $k ?>" class="<?= $k === $range ? 'active' : '' ?>"><?= $v ?></a>
    <?php endforeach; ?>
    <span style="margin-left:auto;"><a href="admin.html">← Admin</a> · <a href="index.html">Web</a></span>
  </div>

  <div class="summary">
    <div class="stat">
      <div class="stat-label">Zobrazení stránek</div>
      <div class="stat-value"><?= number_format($total, 0, ',', ' ') ?></div>
      <div class="stat-extra">Celkem za vše: <?= number_format($totalAll, 0, ',', ' ') ?></div>
    </div>
    <div class="stat">
      <div class="stat-label">Unikátní návštěvníci</div>
      <div class="stat-value"><?= number_format($uniqueVisitors, 0, ',', ' ') ?></div>
      <div class="stat-extra">Celkem za vše: <?= number_format($uniqueAll, 0, ',', ' ') ?></div>
    </div>
    <div class="stat">
      <div class="stat-label">Stránek na návštěvníka</div>
      <div class="stat-value"><?= $uniqueVisitors ? number_format($total / $uniqueVisitors, 1, ',', ' ') : '0' ?></div>
      <div class="stat-extra">průměr</div>
    </div>
    <div class="stat">
      <div class="stat-label"><span class="live"></span>Aktivní právě teď</div>
      <div class="stat-value"><?= $realtime ?></div>
      <div class="stat-extra">posledních 5 minut</div>
    </div>
  </div>

  <?php if (!empty($byDay)): ?>
  <div class="card" style="margin-bottom:18px;">
    <h2>📈 Vývoj návštěvnosti</h2>
    <?php
      $maxN = max(array_column($byDay, 'n')) ?: 1;
    ?>
    <div class="chart">
      <?php foreach ($byDay as $d): ?>
        <div class="chart-bar" style="height: <?= ($d['n'] / $maxN) * 100 ?>%;" title="<?= $d['day'] ?>: <?= $d['n'] ?> zobrazení, <?= $d['u'] ?> unikátních">
          <b><?= $d['n'] ?></b>
          <span><?= substr($d['day'], 5) ?></span>
        </div>
      <?php endforeach; ?>
    </div>
    <div style="height: 28px;"></div>
  </div>
  <?php endif; ?>

  <div class="grid">

    <div class="card">
      <h2>🌍 Státy</h2>
      <?php if ($byCountry): ?>
        <table>
          <tr><th>Stát</th><th class="num">Unikátní</th><th class="num">Zobrazení</th></tr>
          <?php $maxU = max(array_column($byCountry, 'u')) ?: 1; foreach ($byCountry as $r): ?>
            <tr><td class="bar" style="--w: <?= ($r['u'] / $maxU) * 100 ?>%;">
              <?= countryFlag($r['country']) ?> <?= htmlspecialchars(countryName($r['country'])) ?>
            </td><td class="num"><?= $r['u'] ?></td><td class="num"><?= $r['n'] ?></td></tr>
          <?php endforeach; ?>
        </table>
      <?php else: ?><div class="empty">Žádná data</div><?php endif; ?>
    </div>

    <div class="card">
      <h2>📄 Nejnavštěvovanější stránky</h2>
      <?php if ($byPage): ?>
        <table>
          <tr><th>Stránka</th><th class="num">Zobrazení</th><th class="num">Unikátní</th></tr>
          <?php $maxN2 = max(array_column($byPage, 'n')) ?: 1; foreach ($byPage as $r): ?>
            <tr><td class="bar" style="--w: <?= ($r['n'] / $maxN2) * 100 ?>%;">
              <?= htmlspecialchars($r['page']) ?>
            </td><td class="num"><?= $r['n'] ?></td><td class="num"><?= $r['u'] ?></td></tr>
          <?php endforeach; ?>
        </table>
      <?php else: ?><div class="empty">Žádná data</div><?php endif; ?>
    </div>

    <div class="card">
      <h2>🔗 Odkud přicházejí (referrery)</h2>
      <?php if ($byRef): ?>
        <table>
          <tr><th>Zdroj</th><th class="num">Zobrazení</th></tr>
          <?php foreach ($byRef as $r): ?>
            <tr><td><?= htmlspecialchars($r['referrer']) ?></td><td class="num"><?= $r['n'] ?></td></tr>
          <?php endforeach; ?>
        </table>
      <?php else: ?><div class="empty">Většina návštěv je přímá (bez referreru)</div><?php endif; ?>
    </div>

    <div class="card">
      <h2>📱 Zařízení</h2>
      <?php if ($byDevice): $maxD = max(array_column($byDevice, 'n')) ?: 1; ?>
        <table>
          <?php foreach ($byDevice as $r): ?>
            <tr><td class="bar" style="--w: <?= ($r['n'] / $maxD) * 100 ?>%;">
              <?= htmlspecialchars($r['device']) ?>
            </td><td class="num"><?= $r['n'] ?></td></tr>
          <?php endforeach; ?>
        </table>
      <?php endif; ?>
    </div>

    <div class="card">
      <h2>🌐 Prohlížeče</h2>
      <?php if ($byBrowser): $maxB = max(array_column($byBrowser, 'n')) ?: 1; ?>
        <table>
          <?php foreach ($byBrowser as $r): ?>
            <tr><td class="bar" style="--w: <?= ($r['n'] / $maxB) * 100 ?>%;">
              <?= htmlspecialchars($r['browser']) ?>
            </td><td class="num"><?= $r['n'] ?></td></tr>
          <?php endforeach; ?>
        </table>
      <?php endif; ?>
    </div>

    <div class="card">
      <h2>💻 Operační systémy</h2>
      <?php if ($byOS): $maxOS = max(array_column($byOS, 'n')) ?: 1; ?>
        <table>
          <?php foreach ($byOS as $r): ?>
            <tr><td class="bar" style="--w: <?= ($r['n'] / $maxOS) * 100 ?>%;">
              <?= htmlspecialchars($r['os']) ?>
            </td><td class="num"><?= $r['n'] ?></td></tr>
          <?php endforeach; ?>
        </table>
      <?php endif; ?>
    </div>

  </div>

  <div class="card" style="margin-top:18px;">
    <h2>🕒 Posledních 50 návštěv</h2>
    <?php if ($recent): ?>
      <table>
        <tr><th>Čas</th><th>Stát</th><th>Stránka</th><th>Zdroj</th><th>Zařízení</th><th>Prohlížeč</th></tr>
        <?php foreach ($recent as $r): ?>
          <tr>
            <td><?= date('d.m. H:i:s', $r['ts']) ?></td>
            <td><?= countryFlag($r['country']) ?> <?= htmlspecialchars($r['country']) ?></td>
            <td><?= htmlspecialchars($r['page']) ?></td>
            <td><?= htmlspecialchars($r['referrer'] ?: '—') ?></td>
            <td><?= htmlspecialchars($r['device']) ?></td>
            <td><?= htmlspecialchars($r['browser']) ?></td>
          </tr>
        <?php endforeach; ?>
      </table>
    <?php else: ?><div class="empty">Žádné návštěvy v zadaném období</div><?php endif; ?>
  </div>

  <div class="footer">
    Privátní analytika · žádné cookies · IP jen hashovaná · DB: <code>analytics.db</code>
  </div>
</div>
</body>
</html>
