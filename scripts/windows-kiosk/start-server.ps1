# Starts the Kiosk Guide production server. Safe to run more than once.
$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Node = "C:\Program Files\nodejs\node.exe"
$NextBin = Join-Path $Root "node_modules\next\dist\bin\next"
$LogDir = "C:\Kiosk\logs"
$Log = Join-Path $LogDir "server.log"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

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

if (Test-Port 3000) {
  Write-Log "Port 3000 is already open. Leaving the existing server running."
  exit 0
}

Write-Log "Waiting for PostgreSQL on port 5432."
$postgresReady = $false
for ($i = 0; $i -lt 90; $i++) {
  if (Test-Port 5432) {
    $postgresReady = $true
    break
  }
  Start-Sleep -Seconds 2
}

if (-not $postgresReady) {
  Write-Log "PostgreSQL did not accept connections. Exiting so the task can retry."
  exit 1
}

if (-not (Test-Path $Node) -or -not (Test-Path $NextBin)) {
  Write-Log "Node or Next.js is missing. Node=$Node Next=$NextBin"
  exit 1
}

Write-Log "Starting Next.js production server."
Set-Location $Root
$env:Path = "C:\Program Files\nodejs;" + $env:Path
& $Node $NextBin start -H 0.0.0.0 -p 3000
$code = $LASTEXITCODE
Write-Log "Next.js exited with code $code."
exit $code
