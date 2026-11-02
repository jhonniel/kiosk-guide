# If fullscreen was started during this boot, bring it back when it is closed.
$ErrorActionPreference = "Continue"

$Lock = "C:\Kiosk\fullscreen.lock"
if (-not (Test-Path $Lock)) { exit 0 }

$bootId = (Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToString("o")
$saved = (Get-Content $Lock -ErrorAction SilentlyContinue | Select-Object -First 1)
if ($saved -ne $bootId) {
  Remove-Item $Lock -Force -ErrorAction SilentlyContinue
  exit 0
}

$running = Get-CimInstance Win32_Process -Filter "Name = 'powershell.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -like "*start-fullscreen.ps1*" }
if ($running) { exit 0 }

Start-Process -FilePath "wscript.exe" -ArgumentList "//B `"$PSScriptRoot\start-fullscreen.vbs`"" -WindowStyle Hidden
