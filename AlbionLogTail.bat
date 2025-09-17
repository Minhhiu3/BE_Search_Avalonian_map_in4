@echo off
echo ============================
echo   Albion Online Log Viewer
echo ============================
echo.

:loop
powershell -Command "Get-Content -Path \"$env:USERPROFILE\AppData\LocalLow\Sandbox Interactive GmbH\Albion Online Client\Player.log\" -Tail 30"
timeout /t 60 >nul
goto loop
