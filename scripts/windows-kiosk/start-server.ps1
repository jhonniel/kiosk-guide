# Starts the Kiosk Guide production server. Safe to run more than once.
$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Node = "C:\Program Files\nodejs\node.exe"
$NextBin = Join-Path $Root "node_modules\next\dist\bin\next"
$LogDir = "C:\Kiosk\logs"
$Log = Join-Path $LogDir "server.log"
$Branch = "get-updates"
$Git = "C:\Program Files\Git\cmd\git.exe"
$NpmCli = "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"
$RunningCommit = "C:\Kiosk\running-commit"

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

function Stop-KioskServer {
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine -like "*\Documents\KIOSK\*" -and $_.CommandLine -like "*next*"
  } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Log "Stopped server process $($_.ProcessId)"
  }
  Start-Sleep -Seconds 1
}

function Use-GetUpdatesBranch {
  if (-not (Test-Path $Git) -or -not (Test-Path (Join-Path $Root ".git"))) { return }
  $env:GIT_TERMINAL_PROMPT = "0"
  $current = ""
  try { $current = (& $Git -C $Root "rev-parse" "--abbrev-ref" "HEAD").Trim() } catch { $current = "" }
  if ($current -eq $Branch) {
    Write-Log "Boot branch is get-updates."
    return
  }
  Write-Log "Boot branch is $current. Switching to get-updates."
  & $Git -C $Root "checkout" $Branch
  if ($LASTEXITCODE -ne 0) {
    & $Git -C $Root "checkout" "-B" $Branch "origin/$Branch"
  }
  if ($LASTEXITCODE -eq 0) {
    Write-Log "Now running from get-updates."
  } else {
    Write-Log "Could not switch to get-updates. Starting the current checkout."
  }
}

function Test-BuildIsCurrent {
  $buildId = Join-Path $Root ".next\BUILD_ID"
  if (-not (Test-Path $buildId) -or -not (Test-Path $RunningCommit) -or -not (Test-Path $Git)) { return $false }
  $head = (& $Git -C $Root "rev-parse" "HEAD").Trim()
  $built = (Get-Content $RunningCommit -Raw -ErrorAction SilentlyContinue)
  if (-not $built) { return $false }
  return $built.Trim() -eq $head
}

Use-GetUpdatesBranch
$buildIsCurrent = Test-BuildIsCurrent
if ((Test-Port 3000) -and $buildIsCurrent) {
  Write-Log "Port 3000 is already open on the get-updates build. Leaving the existing server running."
  exit 0
}
if (Test-Port 3000) {
  Write-Log "Stopping the server so it can start from get-updates."
  Stop-KioskServer
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

if (-not (Test-Path $Node) -or -not (Test-Path $NpmCli)) {
  Write-Log "Node.js is missing. Node=$Node"
  exit 1
}

Set-Location $Root
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;" + $env:Path

function Get-ChangedSinceBuild {
  if (-not (Test-Path $Git)) { return @() }
  $head = (& $Git -C $Root "rev-parse" "HEAD").Trim()
  if (-not (Test-Path $RunningCommit)) { return @("*") }
  $built = (Get-Content $RunningCommit -Raw -ErrorAction SilentlyContinue)
  if (-not $built) { return @("*") }
  $built = $built.Trim()
  if ($built -eq $head) { return @() }
  & $Git -C $Root "cat-file" "-e" "$built^{commit}" 2>$null
  if ($LASTEXITCODE -ne 0) { return @("*") }
  return @(& $Git -C $Root "diff" "--name-only" $built $head)
}

if (-not $buildIsCurrent) {
  $mutex = New-Object System.Threading.Mutex($false, "Global\KioskGuideBuild")
  if (-not $mutex.WaitOne(0)) {
    Write-Log "Waiting for the update install to finish."
    if (-not $mutex.WaitOne(1200000)) {
      Write-Log "The update install did not finish."
      exit 1
    }
  }
  $buildIsCurrent = Test-BuildIsCurrent
  try {
    if (-not $buildIsCurrent) {
    $changed = @(Get-ChangedSinceBuild)
    $needsInstall = -not (Test-Path $NextBin) -or @($changed | Where-Object { $_ -eq "*" -or $_ -eq "package.json" -or $_ -eq "package-lock.json" }).Count -gt 0
    $needsMigrate = @($changed | Where-Object { $_ -eq "*" -or $_ -like "prisma/*" }).Count -gt 0
    $buildLog = Join-Path $LogDir "build.log"
    $installOk = $true

    if ($needsInstall) {
      Write-Log "Installing packages for the new update."
      & $Node $NpmCli "install" *> $buildLog
      if ($LASTEXITCODE -ne 0) {
        $installOk = $false
        Write-Log "Package install failed. See $buildLog"
      }
    }
    if ($installOk -and $needsMigrate) {
      Write-Log "Updating the database for the new update."
      & $Node $NpmCli "run" "db:deploy" *>> $buildLog
      if ($LASTEXITCODE -ne 0) {
        $installOk = $false
        Write-Log "Database update failed. See $buildLog"
      }
    }
    if ($installOk) {
      Write-Log "Preparing the database client."
      & $Node (Join-Path $Root "node_modules\prisma\build\index.js") "generate" *>> $buildLog
      if ($LASTEXITCODE -ne 0) {
        $installOk = $false
        Write-Log "Database client update failed. See $buildLog"
      }
    }
    if ($installOk) {
      Write-Log "Building the get-updates version before start."
      & $Node $NpmCli "run" "build" *>> $buildLog
      if ($LASTEXITCODE -ne 0) {
        $installOk = $false
        Write-Log "Build failed. See $buildLog"
        Get-Content $buildLog -Tail 30 -ErrorAction SilentlyContinue | ForEach-Object { Write-Log $_ }
      }
    }
    if ($installOk -and (Test-Path $Git)) {
      (& $Git -C $Root "rev-parse" "HEAD").Trim() | Set-Content -Path $RunningCommit -Encoding ascii
      Write-Log "Installed update is ready to start."
    }
    }
  } finally {
    $mutex.ReleaseMutex() | Out-Null
    $mutex.Dispose()
  }
}

$buildId = Join-Path $Root ".next\BUILD_ID"
if (-not (Test-Path $buildId)) {
  Write-Log "Waiting for the new build to finish."
  for ($i = 0; $i -lt 90 -and -not (Test-Path $buildId); $i++) { Start-Sleep -Seconds 2 }
}
if (-not (Test-Path $NextBin) -or -not (Test-Path $buildId)) {
  Write-Log "There is no production build to start."
  exit 1
}

New-Item -ItemType File -Force -Path "C:\Kiosk\reload-kiosk" | Out-Null
Write-Log "Starting Next.js production server from get-updates."
& $Node $NextBin start -H 0.0.0.0 -p 3000
$code = $LASTEXITCODE
Write-Log "Next.js exited with code $code."
exit $code
