<?php
require_once __DIR__ . '/auth.php';
auth_start_session();

$error = '';
$ip = auth_client_ip();
$lockInfo = auth_is_locked($ip);
$lockedRemaining = $lockInfo['remaining_seconds'];
$alreadyLocked = $lockInfo['locked'];

// Pokud uz jsi prihlasen, presmeruj na admin
if (!empty($_SESSION['auth_user'])) {
    $redir = $_GET['redir'] ?? '/admin.php';
    header('Location: ' . $redir);
    exit;
}

// Zpracovani POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Honeypot - skryta pole vyplnena = bot. Tise odmitnout jako neuspesny pokus.
    $hp1 = $_POST['website'] ?? '';
    $hp2 = $_POST['phone_number'] ?? '';
    $formStart = (int)($_POST['form_ts'] ?? 0);
    $now = time();
    $tooFast = $formStart > 0 && ($now - $formStart) < 2; // formular vyplnen pod 2s = bot

    $isBot = ($hp1 !== '' || $hp2 !== '' || $tooFast);

    if ($alreadyLocked) {
        $error = 'Příliš mnoho neúspěšných pokusů. Zkuste za ' . ceil($lockedRemaining / 60) . ' minut.';
    } elseif ($isBot) {
        // Bot detekce - zaznamenat jako selhani, ale neprozradit duvod
        auth_record_failure($ip);
        $lockInfo = auth_is_locked($ip);
        if ($lockInfo['locked']) {
            $error = 'Příliš mnoho neúspěšných pokusů. Účet zablokován na ' . AUTH_LOCKOUT_MINUTES . ' minut.';
            $alreadyLocked = true;
            $lockedRemaining = $lockInfo['remaining_seconds'];
        } else {
            // Stejna hlaska jako spatne heslo, aby bot nepoznal, ze byl odhalen
            $remaining = AUTH_MAX_FAILED - $lockInfo['failed'];
            $error = 'Neplatné jméno nebo heslo. Zbývá ' . $remaining . ' ' . ($remaining === 1 ? 'pokus' : 'pokusy') . '.';
        }
    } else {
        $user = trim($_POST['user'] ?? '');
        $pass = $_POST['pass'] ?? '';

        if ($user === '' || $pass === '') {
            $error = 'Vyplňte jméno i heslo.';
        } elseif (auth_verify_credentials($user, $pass)) {
            // OK
            $_SESSION['auth_user'] = $user;
            $_SESSION['auth_time'] = time();
            session_regenerate_id(true);
            csrf_rotate();
            auth_clear_failures($ip);
            $redir = $_POST['redir'] ?? $_GET['redir'] ?? '/admin.php';
            // Bezpecnost: relativni redirect only
            if (!preg_match('#^/[^/]#', $redir)) $redir = '/admin.php';
            header('Location: ' . $redir);
            exit;
        } else {
            auth_record_failure($ip);
            $lockInfo = auth_is_locked($ip);
            $remaining = AUTH_MAX_FAILED - $lockInfo['failed'];
            if ($lockInfo['locked']) {
                $error = 'Příliš mnoho neúspěšných pokusů. Účet zablokován na ' . AUTH_LOCKOUT_MINUTES . ' minut. Byl odeslán e-mail správci.';
                $alreadyLocked = true;
                $lockedRemaining = $lockInfo['remaining_seconds'];
            } else {
                $error = 'Neplatné jméno nebo heslo. Zbývá ' . $remaining . ' ' . ($remaining === 1 ? 'pokus' : 'pokusy') . '.';
            }
        }
    }
}

$redirParam = htmlspecialchars($_GET['redir'] ?? '/admin.php', ENT_QUOTES, 'UTF-8');
?>
<!DOCTYPE html>
<html lang="cs">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Přihlášení – Great Silkyway</title>
  <meta name="robots" content="noindex, nofollow" />
  <link rel="stylesheet" href="style.css" />
  <link rel="icon" type="image/png" href="great-logo.png" />
  <style>
    body {
      background: linear-gradient(135deg, #0d1530 0%, #1c2742 60%, #2a3656 100%);
      min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      padding: 24px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .login-card {
      background: #fff;
      border-radius: 18px;
      box-shadow: 0 24px 70px rgba(0,0,0,0.35);
      padding: 40px 36px;
      max-width: 420px;
      width: 100%;
      animation: gsFadeUp 0.5s ease both;
    }
    .login-card__logo {
      display: flex; align-items: center; justify-content: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    .login-card__logo img { width: 48px; height: 48px; }
    .login-card__brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.3rem;
      color: #1c2742;
      font-weight: 700;
    }
    .login-card h1 {
      font-family: 'Playfair Display', Georgia, serif;
      color: #1c2742;
      font-size: 1.5rem;
      text-align: center;
      margin-bottom: 8px;
    }
    .login-card__sub {
      text-align: center;
      color: #7a7766;
      font-size: 0.92rem;
      margin-bottom: 28px;
    }
    .field { margin-bottom: 14px; }
    .field label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #1c2742;
      margin-bottom: 6px;
    }
    .input-wrap { position: relative; }
    .input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #e1dcd1;
      border-radius: 10px;
      font-size: 16px;
      font-family: inherit;
      background: #fff;
      color: #1c2742;
      transition: all 0.18s ease;
      box-sizing: border-box;
    }
    .input--pwd { padding-right: 46px; }
    .input:focus {
      outline: none;
      border-color: #d6a64a;
      box-shadow: 0 0 0 3px rgba(214,166,74,0.18);
    }
    .toggle-pwd {
      position: absolute;
      right: 8px; top: 50%; transform: translateY(-50%);
      background: none; border: none;
      cursor: pointer;
      padding: 6px 10px;
      font-size: 1.2rem;
      color: #7a7766;
      transition: color 0.15s;
      border-radius: 6px;
    }
    .toggle-pwd:hover { color: #1c2742; background: #f5f3ef; }
    .toggle-pwd:focus { outline: 2px solid #d6a64a; outline-offset: 2px; }
    .btn-primary {
      width: 100%;
      padding: 13px;
      background: linear-gradient(135deg, #d6a64a 0%, #c89438 100%);
      color: #131c33;
      font-weight: 700;
      font-size: 0.98rem;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 4px 14px rgba(214,166,74,0.35);
      transition: transform 0.18s ease, box-shadow 0.22s ease;
      margin-top: 6px;
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(214,166,74,0.5); }
    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
    .alert {
      padding: 12px 14px;
      border-radius: 10px;
      margin-bottom: 16px;
      font-size: 0.88rem;
      text-align: center;
      line-height: 1.5;
    }
    .alert--err {
      background: #fde7e4;
      color: #8a1e15;
      border: 1px solid #f5c6cb;
    }
    .alert--lock {
      background: #fff4d4;
      color: #6b4d10;
      border: 1px solid #f0d27a;
    }
    .footer-link {
      text-align: center;
      margin-top: 18px;
      font-size: 0.82rem;
      color: #a39d8d;
    }
    .footer-link a { color: #d6a64a; text-decoration: none; }

    /* Honeypot - skryto pred lidmi, viditelne pro vetsinu botu */
    .hp-trap {
      position: absolute !important;
      left: -9999px !important;
      top: -9999px !important;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      overflow: hidden;
    }
    @keyframes gsFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <form class="login-card" method="POST" autocomplete="on">
    <div class="login-card__logo">
      <img src="great-logo.png" alt="Great Silkyway" />
      <div class="login-card__brand">Great Silkyway</div>
    </div>
    <h1>Přihlášení do adminu</h1>
    <div class="login-card__sub">Zadejte přihlašovací údaje</div>

    <?php if ($error): ?>
      <div class="alert <?= $alreadyLocked ? 'alert--lock' : 'alert--err' ?>">
        <?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?>
      </div>
    <?php endif; ?>

    <?php if ($alreadyLocked && $lockedRemaining > 0): ?>
      <div class="alert alert--lock">
        ⏳ Účet zablokován. Zkuste za <strong><?= ceil($lockedRemaining / 60) ?> minut</strong>.
      </div>
    <?php endif; ?>

    <input type="hidden" name="redir" value="<?= $redirParam ?>" />
    <input type="hidden" name="form_ts" value="<?= time() ?>" />

    <!-- Honeypot pro boty - skryto pred lidmi, ale boti to vyplni -->
    <div class="hp-trap" aria-hidden="true">
      <label for="website">Website (nevyplňujte)</label>
      <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
      <label for="phone_number">Phone (nevyplňujte)</label>
      <input type="text" id="phone_number" name="phone_number" tabindex="-1" autocomplete="off" />
    </div>

    <div class="field">
      <label for="user">Uživatelské jméno</label>
      <input class="input" type="text" id="user" name="user" autocomplete="username"
             value="<?= htmlspecialchars($_POST['user'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
             required <?= $alreadyLocked ? 'disabled' : '' ?> />
    </div>

    <div class="field">
      <label for="pass">Heslo</label>
      <div class="input-wrap">
        <input class="input input--pwd" type="password" id="pass" name="pass" autocomplete="current-password"
               required <?= $alreadyLocked ? 'disabled' : '' ?> />
        <button type="button" class="toggle-pwd" id="togglePwd" aria-label="Zobrazit heslo" title="Zobrazit/skrýt heslo">👁</button>
      </div>
    </div>

    <button class="btn-primary" type="submit" <?= $alreadyLocked ? 'disabled' : '' ?>>
      <?= $alreadyLocked ? '🔒 Zablokováno' : 'Přihlásit se' ?>
    </button>

    <div class="footer-link">
      <a href="/">← Zpět na web</a>
    </div>
  </form>

  <script>
    const btn = document.getElementById('togglePwd');
    const pwd = document.getElementById('pass');
    btn.addEventListener('click', () => {
      const hidden = pwd.type === 'password';
      pwd.type = hidden ? 'text' : 'password';
      btn.textContent = hidden ? '🙈' : '👁';
      btn.setAttribute('aria-label', hidden ? 'Skrýt heslo' : 'Zobrazit heslo');
      pwd.focus();
    });
  </script>
</body>
</html>
