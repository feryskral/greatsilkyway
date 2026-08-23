<?php
// Nahrani fotky z adminu primo na server jako soubor.
//
// Drive admin ukladal fotky jako base64 retezec do content.json. Ten soubor
// stahuje kazdy navstevnik na kazde strance, takze par fotek ho nafouklo
// z 29 KB na 3,6 MB. Tenhle endpoint ulozi fotku jako normalni soubor a
// rovnou k ni vyrobi zmenseny nahled do slozky thumbs/.
//
// Chraneno stejne jako save-content.php: prihlaseni + CSRF token + kontrola
// puvodu pozadavku.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
auth_start_session();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

function odpoved(int $code, array $data): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

if (empty($_SESSION['auth_user'])) {
    odpoved(401, ['ok' => false, 'error' => 'Nepřihlášen - obnovte stránku a přihlaste se znovu']);
}
if (!csrf_verify()) {
    odpoved(403, ['ok' => false, 'error' => 'Neplatný CSRF token - obnovte stránku a zkuste znovu']);
}

// Pozadavek musi prijit z naseho webu
$allowedHost = $_SERVER['HTTP_HOST'] ?? '';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$referer = $_SERVER['HTTP_REFERER'] ?? '';
$originOk = $origin !== '' && parse_url($origin, PHP_URL_HOST) === $allowedHost;
$refererOk = $referer !== '' && parse_url($referer, PHP_URL_HOST) === $allowedHost;
if (!$originOk && !$refererOk) {
    odpoved(403, ['ok' => false, 'error' => 'Neplatný původ požadavku']);
}

// ---- GET: co server umi (pro diagnostiku v adminu) ----
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    odpoved(200, [
        'ok' => true,
        'gd' => extension_loaded('gd'),
        'webp' => function_exists('imagewebp'),
        'zapisovatelne' => is_writable(__DIR__),
        'maxUpload' => ini_get('upload_max_filesize'),
        'maxPost' => ini_get('post_max_size'),
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    odpoved(405, ['ok' => false, 'error' => 'Pouze POST']);
}

if (!isset($_FILES['photo'])) {
    // Prazdne $_FILES pri POSTu obvykle znamena prekroceny post_max_size
    $len = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($len > 0) {
        odpoved(413, ['ok' => false, 'error' => 'Fotka je větší, než server povoluje (limit ' . ini_get('post_max_size') . ')']);
    }
    odpoved(400, ['ok' => false, 'error' => 'Chybí soubor']);
}

$f = $_FILES['photo'];
if ($f['error'] !== UPLOAD_ERR_OK) {
    $duvody = [
        UPLOAD_ERR_INI_SIZE => 'Fotka přesahuje limit serveru (' . ini_get('upload_max_filesize') . ')',
        UPLOAD_ERR_FORM_SIZE => 'Fotka je příliš velká',
        UPLOAD_ERR_PARTIAL => 'Přenos se nedokončil, zkuste znovu',
        UPLOAD_ERR_NO_FILE => 'Nebyl vybrán soubor',
        UPLOAD_ERR_NO_TMP_DIR => 'Na serveru chybí dočasná složka',
        UPLOAD_ERR_CANT_WRITE => 'Server nemůže zapisovat na disk',
    ];
    odpoved(400, ['ok' => false, 'error' => $duvody[$f['error']] ?? ('Chyba nahrávání #' . $f['error'])]);
}

if ($f['size'] > 12 * 1024 * 1024) {
    odpoved(413, ['ok' => false, 'error' => 'Fotka je větší než 12 MB']);
}

// Typ urcit z OBSAHU souboru, ne z toho, co posle prohlizec
$info = @getimagesize($f['tmp_name']);
if ($info === false) {
    odpoved(400, ['ok' => false, 'error' => 'Soubor není platný obrázek']);
}
$pripony = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
if (!isset($pripony[$info[2]])) {
    odpoved(400, ['ok' => false, 'error' => 'Povolené formáty: JPG, PNG, WebP']);
}
$ext = $pripony[$info[2]];

// Nazev souboru si urcujeme sami - nazev od uzivatele se nepouzije
$zaklad = 'foto';
if (!empty($_POST['name'])) {
    $s = strtolower((string)$_POST['name']);
    $s = strtr($s, [
        'á'=>'a','č'=>'c','ď'=>'d','é'=>'e','ě'=>'e','í'=>'i','ň'=>'n','ó'=>'o',
        'ř'=>'r','š'=>'s','ť'=>'t','ú'=>'u','ů'=>'u','ý'=>'y','ž'=>'z',
    ]);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    $s = trim((string)$s, '-');
    if ($s !== '') $zaklad = substr($s, 0, 40);
}
$nazev = $zaklad . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
$cil = __DIR__ . '/' . $nazev;

if (!move_uploaded_file($f['tmp_name'], $cil)) {
    odpoved(500, ['ok' => false, 'error' => 'Nepodařilo se uložit soubor (zkontrolujte práva složky)']);
}
@chmod($cil, 0644);

// ---- Nahled do thumbs/ (kdyz to server umi) ----
$thumb = null;
$thumbChyba = null;
$SIRKA = 920;
$KVALITA = 82;

if (!extension_loaded('gd')) {
    $thumbChyba = 'Server nemá knihovnu GD, náhled se nevytvořil';
} else {
    $dir = __DIR__ . '/thumbs';
    if (!is_dir($dir)) @mkdir($dir, 0755);
    if (!is_dir($dir) || !is_writable($dir)) {
        $thumbChyba = 'Složku thumbs/ nelze zapisovat';
    } else {
        try {
            $img = match ($info[2]) {
                IMAGETYPE_JPEG => @imagecreatefromjpeg($cil),
                IMAGETYPE_PNG  => @imagecreatefrompng($cil),
                IMAGETYPE_WEBP => @imagecreatefromwebp($cil),
            };
            if (!$img) throw new RuntimeException('Obrázek nelze načíst');

            $w = imagesx($img); $h = imagesy($img);
            // Uzsi fotku nezvetsovat, jen prevest do uspornejsiho formatu
            $nw = min($SIRKA, $w);
            $nh = (int)round($h * ($nw / $w));

            $maly = imagecreatetruecolor($nw, $nh);
            imagealphablending($maly, false);
            imagesavealpha($maly, true);
            imagecopyresampled($maly, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);

            $tName = pathinfo($nazev, PATHINFO_FILENAME) . (function_exists('imagewebp') ? '.webp' : '.jpg');
            $tPath = $dir . '/' . $tName;
            $ulozeno = function_exists('imagewebp')
                ? imagewebp($maly, $tPath, $KVALITA)
                : imagejpeg($maly, $tPath, $KVALITA);

            imagedestroy($maly);
            imagedestroy($img);

            if ($ulozeno) { @chmod($tPath, 0644); $thumb = 'thumbs/' . $tName; }
            else $thumbChyba = 'Náhled se nepodařilo uložit';
        } catch (Throwable $e) {
            $thumbChyba = 'Náhled se nevytvořil: ' . $e->getMessage();
        }
    }
}

odpoved(200, [
    'ok' => true,
    'photo' => $nazev,
    'thumb' => $thumb,
    'thumbError' => $thumbChyba,
    'bytes' => filesize($cil),
]);
