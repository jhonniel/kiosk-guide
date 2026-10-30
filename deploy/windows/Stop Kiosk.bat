@echo off
rem Stop the Camiguin kiosk server (port 3000). The database keeps running.
title Stop Camiguin Kiosk
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }; 'Kiosk server stopped.' } else { 'Kiosk server is not running.' }"
timeout /t 3 >nul
