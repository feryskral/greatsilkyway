<?php
header('Content-Type: text/plain; charset=utf-8');
echo "=== Diagnostika cest pro .htaccess ===\n\n";
echo "Skutecna cesta tohoto souboru:\n";
echo __FILE__ . "\n\n";
echo "Adresar (pouzij pro AuthUserFile):\n";
echo __DIR__ . "\n\n";
echo "AuthUserFile by mela byt:\n";
echo __DIR__ . "/.htpasswd-admin\n\n";
echo "Test: existuje .htpasswd-admin? ";
echo (file_exists(__DIR__ . '/.htpasswd-admin') ? 'ANO' : 'NE') . "\n";
echo "Test: ctitelny? ";
echo (is_readable(__DIR__ . '/.htpasswd-admin') ? 'ANO' : 'NE') . "\n\n";
if (file_exists(__DIR__ . '/.htpasswd-admin')) {
    echo "Prvni znaky souboru (jen pro overeni formatu):\n";
    $content = file_get_contents(__DIR__ . '/.htpasswd-admin');
    echo substr($content, 0, 80) . "...\n";
}
echo "\nDOCUMENT_ROOT: " . ($_SERVER['DOCUMENT_ROOT'] ?? 'unknown') . "\n";
echo "SERVER_SOFTWARE: " . ($_SERVER['SERVER_SOFTWARE'] ?? 'unknown') . "\n";
