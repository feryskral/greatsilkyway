@echo off
cd /d "%~dp0"
echo ================================
echo  Synchronizace webu
echo ================================
echo.

echo [1/2] GitHub...
echo.
git add -A
git diff --cached --quiet
if %errorlevel% == 0 (
    echo Zadne zmeny pro Git.
) else (
    git commit -m "Aktualizace webu"
    git push origin main
    if %errorlevel% == 0 (
        echo Git push OK.
    ) else (
        echo CHYBA pri git push! Zkontroluj pripojeni.
    )
)

echo.
echo [2/2] FTP na Wedos...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0_sync-ftp.ps1"

echo.
pause
