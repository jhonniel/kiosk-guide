@echo off
rem Update, start and open the Camiguin kiosk. Options: -NoUpdate  -NoPrompt
title Camiguin Kiosk
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-kiosk.ps1" %*
if errorlevel 1 pause
