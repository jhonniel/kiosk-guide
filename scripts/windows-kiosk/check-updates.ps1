# Boot-time update check. Runs before the kiosk question.
# Online devices pull the get-updates branch and install only when the new code needs it.
$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Branch = "get-updates"
$Git = "C:\Program Files\Git\cmd\git.exe"
$Npm = "C:\Program Files\nodejs\npm.cmd"
$LogDir = "C:\Kiosk\logs"
$Log = Join-Path $LogDir "update.log"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

$env:GIT_TERMINAL_PROMPT = "0"
$env:GIT_ASKPASS = ""

function Write-Log([string]$Message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" | Add-Content -Path $Log -Encoding utf8
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$form = New-Object System.Windows.Forms.Form
$form.Text = "Kiosk Guide"
$form.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
$form.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
$form.TopMost = $true
$form.ControlBox = $false
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.ShowInTaskbar = $true
$form.ClientSize = New-Object System.Drawing.Size(500, 140)
$form.Font = New-Object System.Drawing.Font("Segoe UI", 11)

$label = New-Object System.Windows.Forms.Label
$label.Left = 24
$label.Top = 22
$label.Width = 452
$label.Height = 52
$label.Text = "Checking for kiosk updates..."

$bar = New-Object System.Windows.Forms.ProgressBar
$bar.Left = 24
$bar.Top = 84
$bar.Width = 452
$bar.Height = 28
$bar.Minimum = 0
$bar.Maximum = 100
$bar.Value = 5

$form.Controls.Add($label)
$form.Controls.Add($bar)
$form.Show()
$form.Activate()

$script:Closed = $false

function Wait-Ui([int]$Milliseconds) {
  $end = [DateTime]::UtcNow.AddMilliseconds($Milliseconds)
  while ([DateTime]::UtcNow -lt $end) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 50
  }
}

function Set-Progress([int]$Percent, [string]$Text) {
  if ($script:Closed) { return }
  if ($Percent -lt 0) {
    $bar.Style = [System.Windows.Forms.ProgressBarStyle]::Marquee
    $bar.MarqueeAnimationSpeed = 30
  } else {
    $bar.Style = [System.Windows.Forms.ProgressBarStyle]::Continuous
    $bar.MarqueeAnimationSpeed = 0
    $value = [Math]::Max($bar.Minimum, [Math]::Min($bar.Maximum, $Percent))
    if ($value -lt $bar.Value) { $bar.Value = $bar.Minimum }
    $bar.Value = $value
  }
  $label.Text = $Text
  $form.Refresh()
  [System.Windows.Forms.Application]::DoEvents()
}

function Close-Update([string]$Text) {
  if ($script:Closed) { return }
  Set-Progress 100 $Text
  Wait-Ui 1600
  $script:Closed = $true
  $form.Close()
  $form.Dispose()
}

function Test-Internet {
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $wait = $client.BeginConnect("github.com", 443, $null, $null)
    $ok = $wait.AsyncWaitHandle.WaitOne(5000, $false) -and $client.Connected
    return [bool]$ok
  } catch {
    return $false
  } finally {
    if ($client) { $client.Close() }
  }
}

function Invoke-Tool([string]$File, [string[]]$ArgumentList) {
  $proc = New-Object System.Diagnostics.Process
  $proc.StartInfo.FileName = $File
  $proc.StartInfo.WorkingDirectory = $Root
  $proc.StartInfo.UseShellExecute = $false
  $proc.StartInfo.RedirectStandardOutput = $true
  $proc.StartInfo.RedirectStandardError = $true
  $proc.StartInfo.CreateNoWindow = $true
  $quoted = foreach ($arg in $ArgumentList) {
    if ($arg -match '[\s"]') { '"' + ($arg -replace '"', '\"') + '"' } else { $arg }
  }
  $proc.StartInfo.Arguments = ($quoted -join " ")
  [void]$proc.Start()
  $outTask = $proc.StandardOutput.ReadToEndAsync()
  $errTask = $proc.StandardError.ReadToEndAsync()
  while (-not $proc.HasExited) {
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 150
  }
  $proc.WaitForExit()
  $text = [string]$outTask.Result + [string]$errTask.Result
  if ($text) { Write-Log $text.Trim() }
  return [pscustomobject]@{ Code = $proc.ExitCode; Text = $text }
}

function Test-KioskPort {
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $wait = $client.BeginConnect("127.0.0.1", 3000, $null, $null)
    return [bool]($wait.AsyncWaitHandle.WaitOne(400, $false) -and $client.Connected)
  } catch {
    return $false
  } finally {
    if ($client) { $client.Close() }
  }
}

function Restart-KioskServer {
  Set-Progress 95 "Starting the updated kiosk..."
  Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue | Where-Object {
    $_.CommandLine -and $_.CommandLine -like "*\Documents\KIOSK\*" -and $_.CommandLine -like "*next*"
  } | ForEach-Object {
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    Write-Log "Stopped server process $($_.ProcessId)"
  }
  Start-Sleep -Seconds 1
  Start-Process -FilePath "powershell.exe" -ArgumentList @(
    "-NoProfile", "-ExecutionPolicy", "Bypass", "-WindowStyle", "Hidden",
    "-File", (Join-Path $PSScriptRoot "start-server.ps1")
  ) -WindowStyle Hidden | Out-Null
  for ($i = 0; $i -lt 60; $i++) {
    if (Test-KioskPort) { return }
    [System.Windows.Forms.Application]::DoEvents()
    Start-Sleep -Milliseconds 500
  }
}

try {
  Write-Log "Update check started in $Root"
  Set-Progress 10 "Checking internet..."
  $online = Test-Internet
  if (-not $online) {
    Set-Progress 15 "Waiting for internet..."
    Wait-Ui 4000
    $online = Test-Internet
  }
  if (-not $online) {
    Write-Log "No internet. Skipping update."
    Close-Update "No internet connection. Continuing with the installed kiosk."
    exit 0
  }

  if (-not (Test-Path $Git) -or -not (Test-Path (Join-Path $Root ".git"))) {
    Write-Log "Git or the project checkout is missing."
    Close-Update "Update check is not available. Continuing with the installed kiosk."
    exit 0
  }

  Set-Progress -1 "Checking the get-updates branch..."
  $fetch = Invoke-Tool $Git @("fetch", "origin", $Branch)
  if ($fetch.Code -ne 0) {
    Write-Log "Fetch failed."
    Close-Update "Could not reach the update branch. Continuing with the installed kiosk."
    exit 0
  }

  $before = (& $Git -C $Root "rev-parse" "HEAD").Trim()
  $remote = (& $Git -C $Root "rev-parse" "origin/$Branch").Trim()
  $current = (& $Git -C $Root "rev-parse" "--abbrev-ref" "HEAD").Trim()
  if (-not $remote) {
    Close-Update "The get-updates branch was not found. Continuing with the installed kiosk."
    exit 0
  }

  if ($current -eq $Branch -and $before -eq $remote) {
    Write-Log "Already on $Branch at $before"
    Close-Update "Kiosk is up to date."
    exit 0
  }

  Set-Progress 45 "Pulling updates from get-updates..."
  $checkout = Invoke-Tool $Git @("checkout", "-B", $Branch, "origin/$Branch")
  if ($checkout.Code -ne 0) {
    Write-Log "Checkout failed."
    Close-Update "Could not switch to the update branch. Continuing with the installed kiosk."
    exit 0
  }
  & $Git -C $Root "branch" "--set-upstream-to=origin/$Branch" $Branch 2>$null | Out-Null

  $after = (& $Git -C $Root "rev-parse" "HEAD").Trim()
  if ($before -eq $after) {
    Write-Log "Switched to $Branch. Same commit $after"
    Close-Update "Kiosk is up to date."
    exit 0
  }

  $changed = @(& $Git -C $Root "diff" "--name-only" $before $after)
  Write-Log ("Updated " + $before + " -> " + $after)
  Write-Log ("Changed: " + ($changed -join ", "))

  $needsInstall = @($changed | Where-Object { $_ -eq "package.json" -or $_ -eq "package-lock.json" }).Count -gt 0
  $needsMigrate = @($changed | Where-Object { $_ -like "prisma/*" }).Count -gt 0
  $needsBuild = @($changed | Where-Object {
    $_ -notmatch '^(README\.md|LICENSE|.*\.md)$'
  }).Count -gt 0

  if ($needsInstall) {
    if (-not (Test-Path $Npm)) {
      Close-Update "Node.js is missing, so the update could not be installed."
      exit 0
    }
    Set-Progress -1 "Installing updates..."
    $install = Invoke-Tool "cmd.exe" @("/c", "`"$Npm`"", "install")
    if ($install.Code -ne 0) {
      Close-Update "Install failed. Continuing with the installed kiosk."
      exit 0
    }
  }

  if ($needsMigrate) {
    Set-Progress -1 "Updating the database..."
    $migrate = Invoke-Tool "cmd.exe" @("/c", "`"$Npm`"", "run", "db:deploy")
    if ($migrate.Code -ne 0) {
      Write-Log "Database update failed."
    }
  }

  if ($needsBuild) {
    Set-Progress -1 "Building the kiosk..."
    $build = Invoke-Tool "cmd.exe" @("/c", "`"$Npm`"", "run", "build")
    if ($build.Code -ne 0) {
      Close-Update "Build failed. Continuing with the installed kiosk."
      exit 0
    }
    Restart-KioskServer
    Close-Update "Update installed. The new kiosk is ready."
    exit 0
  }

  Close-Update "Updates downloaded. The kiosk is ready."
} catch {
  Write-Log $_.Exception.Message
  Close-Update "Update check failed. Continuing with the installed kiosk."
}
