# Started after the boot prompt.
# Kiosk: fullscreen, and only this system.
# Desktop: normal Windows. The server stays in the background.
param(
  [ValidateSet("Kiosk", "Desktop")]
  [string]$Mode = "Desktop"
)

$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $Edge)) {
  $Edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}
$Url = "http://127.0.0.1:3000/"
$Profile = "C:\Kiosk\edge-profile"
$Log = "C:\Kiosk\logs\shell.log"

New-Item -ItemType Directory -Force -Path $Profile, "C:\Kiosk\logs" | Out-Null

function Write-Log([string]$Message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" | Add-Content -Path $Log -Encoding utf8
}

function Test-Port([int]$Port) {
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    $ok = $iar.AsyncWaitHandle.WaitOne(1000, $false) -and $client.Connected
    return [bool]$ok
  } catch {
    return $false
  } finally {
    if ($client) { $client.Close() }
  }
}

function Get-KioskEdge {
  Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$Profile*" }
}

function Start-KioskServer {
  $starter = Join-Path $Root "scripts\windows-kiosk\start-server.ps1"
  if (-not (Test-Path $starter)) { return }
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile",
    "-ExecutionPolicy", "Bypass",
    "-WindowStyle", "Hidden",
    "-File", $starter
  ) -WindowStyle Hidden | Out-Null
}

function Set-WindowsKeyLock([bool]$Locked) {
  $policies = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"
  New-Item -Path $policies -Force | Out-Null
  if ($Locked) {
    New-ItemProperty -Path $policies -Name "NoWinKeys" -PropertyType DWord -Value 1 -Force | Out-Null
  } else {
    Remove-ItemProperty -Path $policies -Name "NoWinKeys" -ErrorAction SilentlyContinue
  }
}

Write-Log "Boot choice: $Mode"

if ($Mode -eq "Desktop") {
  Set-WindowsKeyLock $false
  Write-Log "Normal desktop. Kiosk server stays in the background at http://localhost:3000"
  if (-not (Get-Process explorer -ErrorAction SilentlyContinue)) {
    Start-Process explorer.exe
  }
  while ($true) { Start-Sleep -Seconds 3600 }
}

Set-WindowsKeyLock $true

if (-not (Test-Port 3000)) {
  Write-Log "Server is not up yet. Waiting, then starting it if needed."
  $ready = $false
  for ($i = 0; $i -lt 20; $i++) {
    if (Test-Port 3000) { $ready = $true; break }
    Start-Sleep -Seconds 2
  }
  if (-not $ready) {
    Start-KioskServer
  }
}

for ($i = 0; $i -lt 90 -and -not (Test-Port 3000); $i++) {
  Start-Sleep -Seconds 2
}

while ($true) {
  $running = @(Get-KioskEdge)
  if ($running.Count -eq 0) {
    if (-not (Test-Path $Edge)) {
      Write-Log "Microsoft Edge was not found."
      Start-Sleep -Seconds 5
      continue
    }

    Write-Log "Opening fullscreen kiosk."
    Start-Process -FilePath $Edge -ArgumentList @(
      "--kiosk", $Url,
      "--edge-kiosk-type=fullscreen",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-features=TranslateUI,msWelcomePage,msEdgeSidebarV2,msImplicitSignin",
      "--disable-pinch",
      "--overscroll-history-navigation=0",
      "--disable-session-crashed-bubble",
      "--kiosk-idle-timeout-minutes=0",
      "--autoplay-policy=no-user-gesture-required",
      "--noerrdialogs",
      "--disable-infobars",
      "--start-fullscreen",
      "--user-data-dir=$Profile"
    ) | Out-Null
    Start-Sleep -Seconds 4
  }

  Start-Sleep -Seconds 2
}
