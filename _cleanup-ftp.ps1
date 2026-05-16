# Skript pro smazani citlivych souboru a slozek ze serveru
# Spusteni: dvojklik na _cleanup-ftp.bat nebo:
#   powershell -ExecutionPolicy Bypass -File _cleanup-ftp.ps1

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

$ftpHost = "397564.w64.wedos.net"
$ftpUser = "w397564"
$ftpBase = "/www/domains/greatsilkyway.cz"

# Heslo - pouzij ulozene nebo se zeptej
$pwdFile = Join-Path $projectRoot ".ftp-pwd"
if (Test-Path $pwdFile) {
    $secure = Get-Content $pwdFile | ConvertTo-SecureString
} else {
    $secure = Read-Host "FTP heslo pro $ftpUser" -AsSecureString
    $secure | ConvertFrom-SecureString | Set-Content $pwdFile
}
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$ftpPass = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)

# CO smazat ze serveru
$itemsToDelete = @(
    "cms",
    "node_modules",
    ".git",
    "package.json",
    "package-lock.json",
    "sync.bat",
    ".gitignore",
    "add-watermark.js",
    "_apply-logo.mjs",
    "_apply-logo-all.mjs",
    "_mask-watermark.mjs",
    "_transform.js",
    "Oxygen_foto3_original.png",
    "foto-chovatelka_logo_test.jpg",
    "oxygen_foto2.png"
)

function Get-FtpList {
    param($path)
    $uri = "ftp://$ftpHost$path/"
    $req = [System.Net.FtpWebRequest]::Create($uri)
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectoryDetails
    $req.UsePassive = $true
    $resp = $req.GetResponse()
    $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
    $text = $reader.ReadToEnd()
    $reader.Close()
    $resp.Close()
    $items = @()
    foreach ($line in ($text -split "`r?`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $parts = $line -split '\s+', 9
        if ($parts.Count -lt 9) { continue }
        $name = $parts[8]
        if ($name -eq "." -or $name -eq "..") { continue }
        $items += [PSCustomObject]@{
            Name  = $name
            IsDir = $parts[0].StartsWith("d")
        }
    }
    return $items
}

function Remove-FtpFile {
    param($path)
    $req = [System.Net.FtpWebRequest]::Create("ftp://$ftpHost$path")
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::DeleteFile
    $req.UsePassive = $true
    $req.GetResponse().Close()
}

function Remove-FtpDir {
    param($path)
    $req = [System.Net.FtpWebRequest]::Create("ftp://$ftpHost$path")
    $req.Credentials = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)
    $req.Method = [System.Net.WebRequestMethods+Ftp]::RemoveDirectory
    $req.UsePassive = $true
    $req.GetResponse().Close()
}

function Remove-FtpRecursive {
    param($path)
    try {
        $items = Get-FtpList -path $path
    } catch {
        # Neni slozka -> zkus jako soubor
        try {
            Remove-FtpFile -path $path
            Write-Host "  smazan soubor: $path" -ForegroundColor Green
        } catch {
            Write-Host "  (nelze smazat / neexistuje: $path)" -ForegroundColor Yellow
        }
        return
    }
    foreach ($item in $items) {
        $childPath = "$path/$($item.Name)"
        if ($item.IsDir) {
            Remove-FtpRecursive -path $childPath
        } else {
            try {
                Remove-FtpFile -path $childPath
                Write-Host "  smazan: $childPath" -ForegroundColor DarkGreen
            } catch {
                Write-Host "  CHYBA $childPath - $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
    try {
        Remove-FtpDir -path $path
        Write-Host "smazana slozka: $path" -ForegroundColor Green
    } catch {
        Write-Host "  CHYBA pri mazani slozky $path - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host " Cisteni serveru greatsilkyway.cz" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

foreach ($item in $itemsToDelete) {
    $fullPath = "$ftpBase/$item"
    Write-Host "=== $item ===" -ForegroundColor Yellow
    Remove-FtpRecursive -path $fullPath
    Write-Host ""
}

Write-Host "Hotovo." -ForegroundColor Cyan
