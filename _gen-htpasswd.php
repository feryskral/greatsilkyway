<?php
// =====================================================
// JEDNORAZOVY SKRIPT pro vygenerovani .htpasswd-admin
// PO POUZITI HO SMAZTE ZE SERVERU!
// Otevrete v prohlizeci: https://greatsilkyway.cz/_gen-htpasswd.php
// =====================================================

$htpasswdFile = __DIR__ . '/.htpasswd-admin';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = trim($_POST['user'] ?? '');
    $pass = $_POST['pass'] ?? '';
    $pass2 = $_POST['pass2'] ?? '';

    $error = '';
    if ($user === '' || $pass === '') {
        $error = 'Vyplnte uzivatele i heslo.';
    } elseif (!preg_match('/^[a-zA-Z0-9_.-]+$/', $user)) {
        $error = 'Uzivatel smi obsahovat jen a-z, A-Z, 0-9, _ . -';
    } elseif (strlen($pass) < 10) {
        $error = 'Heslo musi mit alespon 10 znaku.';
    } elseif ($pass !== $pass2) {
        $error = 'Hesla se neshoduji.';
    } else {
        $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
        $line = $user . ':' . $hash . "\n";
        if (file_put_contents($htpasswdFile, $line, LOCK_EX) === false) {
            $error = 'Nepodarilo se zapsat soubor .htpasswd-admin (zkontroluj prava).';
        } else {
            @chmod($htpasswdFile, 0640);
            $success = true;
        }
    }
}
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8">
  <title>Generator htpasswd</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 480px; margin: 40px auto; padding: 0 16px; }
    h1 { color: #c0392b; }
    .warn { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 6px; margin-bottom: 20px; }
    .err { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 6px; margin-bottom: 16px; }
    .ok { background: #d4edda; color: #155724; padding: 14px; border-radius: 6px; margin-bottom: 16px; }
    label { display: block; margin: 12px 0 4px; font-weight: bold; }
    input { width: 100%; padding: 8px; font-size: 16px; box-sizing: border-box; }
    button { margin-top: 16px; padding: 10px 20px; background: #2c3e50; color: white; border: none; cursor: pointer; font-size: 16px; border-radius: 4px; }
    code { background: #eee; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>⚠️ Jednorazovy generator hesla</h1>
  <div class="warn">
    <strong>POZOR:</strong> Po vytvoreni hesla <strong>okamzite smazte</strong> soubor <code>_gen-htpasswd.php</code> ze serveru!
    Jinak by kdokoli mohl prepsat admin heslo.
  </div>

  <?php if (!empty($error)): ?>
    <div class="err"><?= htmlspecialchars($error) ?></div>
  <?php endif; ?>

  <?php if (!empty($success)): ?>
    <div class="ok">
      <strong>✅ Hotovo!</strong><br>
      Soubor <code>.htpasswd-admin</code> byl vytvoren.<br><br>
      <strong>TEDAZ:</strong><br>
      1. Otevrete FTP a smazte soubor <code>_gen-htpasswd.php</code><br>
      2. Otevrete <a href="admin.html">admin.html</a> - prohlizec se zepta na heslo
    </div>
  <?php else: ?>
    <form method="post" autocomplete="off">
      <label>Uzivatelske jmeno:</label>
      <input name="user" value="admin" autocomplete="off">

      <label>Heslo (min. 10 znaku):</label>
      <input name="pass" type="password" autocomplete="new-password">

      <label>Heslo znovu:</label>
      <input name="pass2" type="password" autocomplete="new-password">

      <button type="submit">Vytvorit .htpasswd-admin</button>
    </form>
  <?php endif; ?>
</body>
</html>
