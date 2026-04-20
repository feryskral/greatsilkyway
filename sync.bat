@echo off
cd /d "%~dp0"
echo ================================
echo  Synchronizace s GitHubem
echo ================================
echo.

git add -A

git diff --cached --quiet
if %errorlevel% == 0 (
    echo Zadne zmeny k odeslani.
) else (
    git commit -m "Aktualizace webu"
    echo.
    echo Odesílám na GitHub...
    git push origin main
    if %errorlevel% == 0 (
        echo.
        echo HOTOVO! Zmeny jsou na GitHubu.
    ) else (
        echo.
        echo CHYBA pri odesílání! Zkontroluj pripojeni nebo prihlaseni.
    )
)

echo.
pause
