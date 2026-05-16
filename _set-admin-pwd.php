<?php
// =====================================================
// JEDNORAZOVY SKRIPT - nastavi admin:CandyPery_2020
// PO POUZITI HO SMAZTE ZE SERVERU!
// =====================================================

$user = 'admin';
$pass = 'CandyPery_2020';
$file = __DIR__ . '/.htpasswd-admin';

$hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
$line = $user . ':' . $hash . "\n";

if (file_put_contents($file, $line, LOCK_EX) === false) {
    http_response_code(500);
    echo "CHYBA: Nepodarilo se zapsat .htpasswd-admin (zkontroluj prava).";
    exit;
}
@chmod($file, 0640);
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Admin heslo nastaveno</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 520px; margin: 40px auto; padding: 20px; }
    .ok { background: #d4edda; color: #155724; padding: 16px; border-radius: 8px; border: 1px solid #c3e6cb; }
    .warn { background: #f8d7da; color: #721c24; padding: 16px; border-radius: 8px; border: 1px solid #f5c6cb; margin-top: 20px; }
    code { background: #eee; padding: 2px 8px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="ok">
    <h2>✅ Admin heslo nastaveno</h2>
    <p>Uzivatel: <code>admin</code></p>
    <p>Heslo: <code>CandyPery_2020</code></p>
    <p>Hash ulozen do <code>.htpasswd-admin</code> (bcrypt cost 12).</p>
  </div>

  <div class="warn">
    <h3>⚠️ TEDA OKAMZITE:</h3>
    <ol>
      <li>Otevrete FTP (FileZilla)</li>
      <li>Smazte tento soubor: <code>_set-admin-pwd.php</code></li>
      <li>Jinak by kdokoli mohl heslo prepsat!</li>
    </ol>
    <p>Potom otevrete <a href="admin.html">admin.html</a> - prohlizec se zepta na heslo.</p>
  </div>
</body>
</html>
