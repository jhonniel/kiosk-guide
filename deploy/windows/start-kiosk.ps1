<#
  Camiguin LGU kiosk launcher for a Windows PC (run through "Start Kiosk.bat" or the desktop shortcut).

  1. Starts PostgreSQL if it is not running.
  2. Pulls new commits on the current branch (skipped when this copy has uncommitted changes).
  3. Rebuilds when the code changed since the last build. The new build is made beside the running
     one and swapped in, so a failed build never takes the kiosk down.
  4. Starts the kiosk server on the network (port 3000) in the background.
  5. Asks Continue / Cancel. Continue opens the kiosk full screen; Cancel leaves the server running
     so the kiosk can be opened later in any browser.

  Options:  -NoUpdate        skip the git pull
            -NoPrompt        open the kiosk without asking
            -CreateShortcut  put "Camiguin Kiosk" and "Stop Camiguin Kiosk" shortcuts on the desktop
#>
param(
  [switch]$NoUpdate,
  [switch]$NoPrompt,
  [switch]$CreateShortcut
)

$ErrorActionPreference = "Continue"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

$Port = 3000
$LocalUrl = "http://localhost:$Port/"
$StateDir = Join-Path $env:LOCALAPPDATA "CamiguinKiosk"
$ServerLog = Join-Path $StateDir "server.log"
$DeployedFile = Join-Path $Root ".kiosk-deployed-commit"
$StageDir = ".next-update"
$Title = "Camiguin Kiosk"
$Icon = Join-Path $Root "app\favicon.ico"

New-Item -ItemType Directory -Force -Path $StateDir | Out-Null
Add-Type -AssemblyName System.Windows.Forms, System.Drawing

function Step([string]$Message) { Write-Host "-> $Message" -ForegroundColor Cyan }
function Warn([string]$Message) { Write-Host "!  $Message" -ForegroundColor Yellow }

function Test-Listening([int]$LocalPort) {
  [bool](Get-NetTCPConnection -LocalPort $LocalPort -State Listen -ErrorAction SilentlyContinue)
}

function Wait-ForUrl([string]$Url, [int]$Seconds) {
  $deadline = (Get-Date).AddSeconds($Seconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $null = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
      return $true
    } catch {
      Start-Sleep -Seconds 2
    }
  }
  return $false
}

function Get-NetworkUrl {
  $ip = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254*" } |
    Select-Object -First 1 -ExpandProperty IPAddress
  if ($ip) { return "http://${ip}:$Port/" }
  return $null
}

function New-DesktopShortcuts {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $shell = New-Object -ComObject WScript.Shell
  $items = @(
    @{ Name = "Camiguin Kiosk"; Target = (Join-Path $PSScriptRoot "Start Kiosk.bat"); Note = "Update, start and open the Camiguin kiosk" },
    @{ Name = "Stop Camiguin Kiosk"; Target = (Join-Path $PSScriptRoot "Stop Kiosk.bat"); Note = "Stop the Camiguin kiosk server" }
  )
  foreach ($item in $items) {
    $link = $shell.CreateShortcut((Join-Path $desktop "$($item.Name).lnk"))
    $link.TargetPath = $item.Target
    $link.WorkingDirectory = $PSScriptRoot
    $link.Description = $item.Note
    if (Test-Path $Icon) { $link.IconLocation = $Icon }
    $link.Save()
    Step "Desktop shortcut: $($item.Name)"
  }
}

function Start-Database {
  if (Test-Listening 5432) {
    Step "Database is running"
    return
  }
  $pgCtl = Get-Command pg_ctl -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source
  if (-not $pgCtl) {
    $candidate = Join-Path $env:USERPROFILE "scoop\apps\postgresql\current\bin\pg_ctl.exe"
    if (Test-Path $candidate) { $pgCtl = $candidate }
  }
  $data = $env:PGDATA
  if (-not $data) { $data = Join-Path $env:USERPROFILE "scoop\persist\postgresql\data" }
  if (-not $pgCtl -or -not (Test-Path $data)) {
    Warn "PostgreSQL was not found. Start the database yourself; the kiosk needs it."
    return
  }
  Step "Starting the database"
  $log = Join-Path (Split-Path $data -Parent) "logfile"
  # Its own hidden console, so closing this window does not stop the database.
  Start-Process -FilePath $pgCtl -ArgumentList @("-D", "`"$data`"", "-l", "`"$log`"", "start") `
    -WindowStyle Hidden -Wait
  if (-not (Test-Listening 5432)) { Warn "The database did not start. See $log" }
}

function Update-Code {
  if ($NoUpdate) { return $false }
  $branch = (git rev-parse --abbrev-ref HEAD).Trim()
  Step "Checking GitHub for updates on $branch"
  git fetch --quiet origin $branch 2>$null
  if ($LASTEXITCODE -ne 0) {
    Warn "Could not reach GitHub - starting the current version."
    return $false
  }
  $behind = [int](git rev-list --count "HEAD..origin/$branch")
  if ($behind -eq 0) {
    Step "Already up to date"
    return $false
  }
  if (git status --porcelain --untracked-files=no) {
    Warn "$behind new commit(s) on $branch, but this copy has uncommitted changes - not pulling."
    Warn "Commit or stash your changes to get the update."
    return $false
  }
  $before = (git rev-parse HEAD).Trim()
  git pull --ff-only --quiet origin $branch
  if ($LASTEXITCODE -ne 0) {
    Warn "Pull failed (local commits not on GitHub yet?) - starting the current version."
    return $false
  }
  Step "Pulled $behind new commit(s)"
  return [bool](git diff --name-only $before HEAD -- package.json package-lock.json)
}

function Get-BuildReason {
  $buildId = Join-Path $Root ".next\BUILD_ID"
  if (-not (Test-Path $buildId)) { return "there is no production build yet" }
  $head = (git rev-parse HEAD).Trim()
  if ((Test-Path $DeployedFile) -and ((Get-Content $DeployedFile -Raw).Trim() -ne $head)) {
    return "new code was pulled"
  }
  $built = (Get-Item $buildId).LastWriteTime
  $rootFiles = "next.config.ts", "package.json", "package-lock.json", "tsconfig.json", "middleware.ts", "postcss.config.mjs"
  $changed = $rootFiles | Where-Object { (Test-Path $_) -and (Get-Item $_).LastWriteTime -gt $built } | Select-Object -First 1
  if (-not $changed) {
    $dirs = "app", "components", "features", "lib", "hooks", "prisma", "utils", "data" | Where-Object { Test-Path $_ }
    $changed = Get-ChildItem $dirs -Recurse -File -Include *.ts, *.tsx, *.js, *.jsx, *.css, *.json, *.prisma -ErrorAction SilentlyContinue |
      Where-Object { $_.LastWriteTime -gt $built } | Select-Object -First 1
  }
  if ($changed) { return "files changed since the last build" }
  return $null
}

function Stop-Server {
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
  Start-Sleep -Seconds 2
}

function Start-Server {
  if (Test-Listening $Port) {
    Step "Kiosk server is running"
    return
  }
  Step "Starting the kiosk server on the network (port $Port)"
  # Hidden console of its own, so the server keeps running after this window closes.
  Start-Process -FilePath $env:ComSpec -ArgumentList "/c npm start > `"$ServerLog`" 2>&1" `
    -WorkingDirectory $Root -WindowStyle Hidden
  if (-not (Wait-ForUrl $LocalUrl 120)) { throw "The kiosk server did not start. See $ServerLog" }
}

function Install-Build([bool]$DepsChanged) {
  if ($DepsChanged) {
    # npm ci replaces node_modules, which the running server is using.
    Step "Packages changed - stopping the server to reinstall them"
    Stop-Server
    npm ci --no-audit --no-fund
    if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
  }

  Step "Building the new version (this takes a few minutes; the kiosk keeps running)"
  Remove-Item -Recurse -Force $StageDir -ErrorAction SilentlyContinue
  $env:NEXT_DIST_DIR = $StageDir
  npm run build
  $buildExit = $LASTEXITCODE
  Remove-Item Env:NEXT_DIST_DIR
  if ($buildExit -ne 0 -or -not (Test-Path (Join-Path $StageDir "BUILD_ID"))) {
    Remove-Item -Recurse -Force $StageDir -ErrorAction SilentlyContinue
    if (Test-Path ".next\BUILD_ID") {
      Warn "The build failed - keeping the version that was running."
      return
    }
    throw "The build failed and there is no earlier build to fall back on."
  }

  Step "Switching to the new build"
  Stop-Server
  # Rename is instant, but an open editor can lock .next; mirroring the files works either way.
  $swapped = $false
  try {
    if (Test-Path ".next") {
      Remove-Item -Recurse -Force ".next-previous" -ErrorAction SilentlyContinue
      Rename-Item ".next" ".next-previous" -ErrorAction Stop
    }
    Rename-Item $StageDir ".next" -ErrorAction Stop
    Remove-Item -Recurse -Force ".next-previous" -ErrorAction SilentlyContinue
    $swapped = $true
  } catch {
    if (-not (Test-Path ".next") -and (Test-Path ".next-previous")) { Rename-Item ".next-previous" ".next" }
  }
  if (-not $swapped) {
    robocopy $StageDir ".next" /MIR /R:2 /W:1 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Could not switch to the new build (robocopy exit $LASTEXITCODE)." }
    Remove-Item -Recurse -Force $StageDir -ErrorAction SilentlyContinue
  }
  Set-Content -Path $DeployedFile -Value (git rev-parse HEAD).Trim()
}

# Message boxes go on top of other apps' popups, like the Continue / Cancel prompt.
function Show-Message([string]$Text, [string]$Kind) {
  $owner = New-Object System.Windows.Forms.Form
  $owner.TopMost = $true
  $owner.ShowInTaskbar = $false
  try {
    [System.Windows.Forms.MessageBox]::Show($owner, $Text, $Title, "OK", $Kind) | Out-Null
  } finally {
    $owner.Dispose()
  }
}

function Confirm-OpenKiosk {
  $form = New-Object System.Windows.Forms.Form
  $form.Text = $Title
  $form.StartPosition = "CenterScreen"
  $form.FormBorderStyle = "FixedDialog"
  $form.MaximizeBox = $false
  $form.MinimizeBox = $false
  $form.TopMost = $true
  $form.ClientSize = New-Object System.Drawing.Size(460, 190)
  $form.Font = New-Object System.Drawing.Font("Segoe UI", 10)
  if (Test-Path $Icon) { $form.Icon = New-Object System.Drawing.Icon($Icon) }

  $label = New-Object System.Windows.Forms.Label
  $label.Location = New-Object System.Drawing.Point(20, 18)
  $label.Size = New-Object System.Drawing.Size(420, 110)
  $label.Text = "Open the Camiguin kiosk now?`r`n`r`nContinue opens the kiosk full screen (press Alt+F4 to leave it).`r`nCancel keeps the desktop; the kiosk keeps running and you can open it later in a browser."
  $form.Controls.Add($label)

  $continue = New-Object System.Windows.Forms.Button
  $continue.Text = "Continue"
  $continue.Size = New-Object System.Drawing.Size(110, 34)
  $continue.Location = New-Object System.Drawing.Point(214, 140)
  $continue.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.Controls.Add($continue)
  $form.AcceptButton = $continue

  $cancel = New-Object System.Windows.Forms.Button
  $cancel.Text = "Cancel"
  $cancel.Size = New-Object System.Drawing.Size(110, 34)
  $cancel.Location = New-Object System.Drawing.Point(330, 140)
  $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.Controls.Add($cancel)
  $form.CancelButton = $cancel

  return $form.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK
}

function Open-Kiosk {
  $chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe" | Where-Object { Test-Path $_ } | Select-Object -First 1
  $edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" | Where-Object { Test-Path $_ } | Select-Object -First 1
  # A separate profile, so kiosk mode opens even while normal Chrome/Edge windows are open.
  $profileDir = Join-Path $StateDir "browser"
  $flags = @("--kiosk", "--user-data-dir=`"$profileDir`"", "--no-first-run", "--noerrdialogs",
    "--disable-infobars", "--disable-session-crashed-bubble", $LocalUrl)
  if ($chrome) {
    Start-Process -FilePath $chrome -ArgumentList $flags
  } elseif ($edge) {
    Start-Process -FilePath $edge -ArgumentList ($flags + "--edge-kiosk-type=fullscreen")
  } else {
    Start-Process $LocalUrl
  }
  Step "Kiosk opened"
}

try {
  if ($CreateShortcut) {
    New-DesktopShortcuts
    exit 0
  }

  Write-Host "=== $Title ===" -ForegroundColor Green
  Start-Database
  $depsChanged = Update-Code
  $reason = Get-BuildReason
  if ($reason) {
    Step "Rebuild needed: $reason"
    Install-Build $depsChanged
  }
  Start-Server

  $networkUrl = Get-NetworkUrl
  Step "Kiosk is running at $LocalUrl"
  if ($networkUrl) { Step "Other devices on the network: $networkUrl" }
  if (-not (Get-NetFirewallRule -DisplayName "Kiosk Guide (Next.js 3000)" -ErrorAction SilentlyContinue)) {
    Warn "Other devices may be blocked by Windows Firewall. Run 'Allow Kiosk on Network.bat' once."
  }

  if ($NoPrompt -or (Confirm-OpenKiosk)) {
    Open-Kiosk
  } else {
    $where = "On this PC: $LocalUrl"
    if ($networkUrl) { $where += "`r`nFrom other devices: $networkUrl" }
    Show-Message "The kiosk was not opened.`r`n`r`nThe kiosk is still running. When you are ready, open a browser and go to:`r`n$where" "Information"
    Step "Kiosk not opened (server still running)"
  }
  exit 0
} catch {
  Write-Host "X  $($_.Exception.Message)" -ForegroundColor Red
  Show-Message "The kiosk could not start:`r`n`r`n$($_.Exception.Message)" "Error"
  exit 1
}
