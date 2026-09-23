# Smaze jeden soubor na FTP. Prihlasovaci udaje prebira z _sync-ftp.ps1
# (host, uzivatel, zaklad cesty) a heslo z .ftp-pwd sifrovaneho pres DPAPI,
# takze se nikde neopisuji ani nevypisuji.
param([Parameter(Mandatory = $true)][string]$Soubor)

$zdroj = Join-Path $PSScriptRoot '_sync-ftp.ps1'
if (-not (Test-Path $zdroj)) { Write-Error 'Nenasel jsem _sync-ftp.ps1'; exit 1 }

# z puvodniho skriptu vytahnu jen prirazeni promennych s nastavenim
$projectRoot = $PSScriptRoot
foreach ($radek in Get-Content $zdroj) {
    if ($radek -match '^\s*\$(ftpHost|ftpUser|ftpBase|pwdFile)\s*=') { Invoke-Expression $radek }
}
if (-not $ftpHost -or -not $ftpUser -or -not (Test-Path $pwdFile)) {
    Write-Error 'Chybi nastaveni FTP nebo ulozene heslo'; exit 1
}
$ftpPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR(
        (Get-Content $pwdFile | ConvertTo-SecureString)))

$cesta = ($ftpBase.TrimEnd('/') + '/' + $Soubor.TrimStart('/'))
$url = "ftp://$ftpHost$cesta"
try {
    $req = [Net.FtpWebRequest]::Create($url)
    $req.Credentials = New-Object Net.NetworkCredential($ftpUser, $ftpPass)
    $req.Method = [Net.WebRequestMethods+Ftp]::DeleteFile
    $req.UsePassive = $true
    $odp = $req.GetResponse()
    Write-Host "Smazano: $Soubor  ($($odp.StatusDescription.Trim()))" -ForegroundColor Green
    $odp.Close()
} catch {
    Write-Host "Nepodarilo se smazat $Soubor : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
