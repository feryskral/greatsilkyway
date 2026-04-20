@echo off
cd /d "%~dp0"
echo Synchronizuji se GitHubem...
git add -A
git commit -m "Aktualizace webu"
git push origin main
echo.
echo Hotovo! Zmeny jsou na GitHubu.
pause
