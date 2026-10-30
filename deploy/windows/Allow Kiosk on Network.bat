@echo off
rem One-time: let other devices on the network open the kiosk (Windows Firewall, port 3000). Asks for admin.
net session >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
title Allow Camiguin Kiosk on Network
powershell -NoProfile -Command "if (Get-NetFirewallRule -DisplayName 'Kiosk Guide (Next.js 3000)' -ErrorAction SilentlyContinue) { 'Firewall rule already exists - other devices can open the kiosk.' } else { New-NetFirewallRule -DisplayName 'Kiosk Guide (Next.js 3000)' -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Private,Domain | Out-Null; 'Done - other devices on the network can now open the kiosk.' }"
pause
