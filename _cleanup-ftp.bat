@echo off
cd /d "%~dp0"
echo Spoustim cisteni serveru...
powershell -ExecutionPolicy Bypass -File "%~dp0_cleanup-ftp.ps1"
echo.
pause
