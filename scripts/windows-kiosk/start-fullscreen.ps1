# Opens the kiosk fullscreen and keeps it there until this PC restarts.
$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $Edge)) {
  $Edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}
$Url = "http://127.0.0.1:3000/"
$Profile = "C:\Kiosk\edge-profile"
$Log = "C:\Kiosk\logs\fullscreen.log"
$Lock = "C:\Kiosk\fullscreen.lock"

New-Item -ItemType Directory -Force -Path $Profile, "C:\Kiosk\logs" | Out-Null

$created = $false
$mutex = New-Object System.Threading.Mutex($false, "Global\KioskGuideFullscreen", [ref]$created)
if (-not $mutex.WaitOne(0)) {
  exit 0
}

function Write-Log([string]$Message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" | Add-Content -Path $Log -Encoding utf8
}

function Get-BootId {
  (Get-CimInstance Win32_OperatingSystem).LastBootUpTime.ToString("o")
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

Set-Content -Path $Lock -Value (Get-BootId) -Encoding ascii
Write-Log "Fullscreen locked until restart."

for ($i = 0; $i -lt 90 -and -not (Test-Port 3000); $i++) {
  Start-Sleep -Seconds 2
}

while ((Get-Content $Lock -ErrorAction SilentlyContinue | Select-Object -First 1) -eq (Get-BootId)) {
  $running = @(Get-KioskEdge)
  if ($running.Count -eq 0 -and (Test-Path $Edge)) {
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
    Start-Sleep -Seconds 3
  }
  Start-Sleep -Seconds 1
}

Get-KioskEdge | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Log "Fullscreen lock ended."
