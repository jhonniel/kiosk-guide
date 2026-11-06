# Boot-time update check. Runs before the kiosk question.
# Always asks, even when the device is already on get-updates.
# A newer update is pulled and installed only after the device agrees.
$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Branch = "get-updates"
$Git = "C:\Program Files\Git\cmd\git.exe"
$NodeExe = "C:\Program Files\nodejs\node.exe"
$NpmCli = "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js"
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
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class KioskUpdateWindow {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
  [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();
}
"@

# Hide the PowerShell console only. Questions and the progress window stay visible.
$console = [KioskUpdateWindow]::GetConsoleWindow()
if ($console -ne [IntPtr]::Zero) { [void][KioskUpdateWindow]::ShowWindow($console, 0) }

function Ask-YesNo([string]$Text, [string]$YesText = "Yes", [string]$NoText = "Skip") {
  $ask = New-Object System.Windows.Forms.Form
  $ask.Text = "Kiosk Guide"
  $ask.FormBorderStyle = [System.Windows.Forms.FormBorderStyle]::FixedDialog
  $ask.StartPosition = [System.Windows.Forms.FormStartPosition]::CenterScreen
  $ask.TopMost = $true
  $ask.ControlBox = $false
  $ask.MaximizeBox = $false
  $ask.MinimizeBox = $false
  $ask.ShowInTaskbar = $true
  $ask.ClientSize = New-Object System.Drawing.Size(540, 230)
  $ask.Font = New-Object System.Drawing.Font("Segoe UI", 11)
  $ask.Add_Shown({
    $ask.Activate()
    [void][KioskUpdateWindow]::SetForegroundWindow($ask.Handle)
  }.GetNewClosure())

  $askLabel = New-Object System.Windows.Forms.Label
  $askLabel.Left = 24
  $askLabel.Top = 20
  $askLabel.Width = 492
  $askLabel.Height = 140
  $askLabel.Text = $Text

  $yesButton = New-Object System.Windows.Forms.Button
  $yesButton.Text = $YesText
  $yesButton.DialogResult = [System.Windows.Forms.DialogResult]::Yes
  $yesButton.Left = 248
  $yesButton.Top = 176
  $yesButton.Width = 150
  $yesButton.Height = 32

  $noButton = New-Object System.Windows.Forms.Button
  $noButton.Text = $NoText
  $noButton.DialogResult = [System.Windows.Forms.DialogResult]::No
  $noButton.Left = 412
  $noButton.Top = 176
  $noButton.Width = 100
  $noButton.Height = 32

  $ask.Controls.Add($askLabel)
  $ask.Controls.Add($yesButton)
  if ($NoText) {
    $ask.Controls.Add($noButton)
    $ask.CancelButton = $noButton
  } else {
    $yesButton.Left = 366
  }
  $ask.AcceptButton = $yesButton
  $answer = $ask.ShowDialog()
  $ask.Dispose()
  return $answer -eq [System.Windows.Forms.DialogResult]::Yes
}

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

$outputBox = New-Object System.Windows.Forms.TextBox
$outputBox.Multiline = $true
$outputBox.ReadOnly = $true
$outputBox.ScrollBars = "Vertical"
$outputBox.WordWrap = $false
$outputBox.Font = New-Object System.Drawing.Font("Consolas", 9)
$outputBox.BackColor = [System.Drawing.Color]::FromArgb(16, 18, 20)
$outputBox.ForeColor = [System.Drawing.Color]::FromArgb(186, 230, 186)
$outputBox.Left = 24
$outputBox.Top = 124
$outputBox.Width = 652
$outputBox.Height = 250
$outputBox.Visible = $false

$form.Controls.Add($label)
$form.Controls.Add($bar)
$form.Controls.Add($outputBox)

$script:Closed = $false
$script:LastStatus = ""
$script:Lines = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
$script:BuildLogOffset = 0

function Add-OutputLine([string]$Line) {
  if ([string]::IsNullOrWhiteSpace($Line)) { return }
  $clean = [regex]::Replace($Line, '\x1b\[[0-9;?]*[A-Za-z]', '')
  if ([string]::IsNullOrWhiteSpace($clean)) { return }
  [void]$script:Lines.Add($clean.TrimEnd())
  Write-Log $clean.TrimEnd()
}

function Show-Terminal {
  if ($script:Closed -or $outputBox.Visible) { return }
  $form.ClientSize = New-Object System.Drawing.Size(700, 390)
  $label.Width = 652
  $bar.Width = 652
  $outputBox.Visible = $true
}

function Drain-Output {
  if ($script:Closed) { return }
  $buildLog = Join-Path $LogDir "build.log"
  if (Test-Path $buildLog) {
    try {
      $stream = New-Object System.IO.FileStream($buildLog, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
      if ($script:BuildLogOffset -lt $stream.Length) {
        [void]$stream.Seek($script:BuildLogOffset, [System.IO.SeekOrigin]::Begin)
        $reader = New-Object System.IO.StreamReader($stream)
        while ($null -ne ($buildLine = $reader.ReadLine())) { Add-OutputLine $buildLine }
        $script:BuildLogOffset = $stream.Position
        $reader.Dispose()
      }
      $stream.Dispose()
    } catch { }
  }
  while ($script:Lines.Count -gt 0) {
    Show-Terminal
    $text = [string]$script:Lines[0]
    $script:Lines.RemoveAt(0)
    $outputBox.AppendText($text + [Environment]::NewLine)
  }
  if ($outputBox.Visible) {
    $outputBox.SelectionStart = $outputBox.TextLength
    $outputBox.ScrollToCaret()
  }
  [System.Windows.Forms.Application]::DoEvents()
}

function Wait-Ui([int]$Milliseconds) {
  $end = [DateTime]::UtcNow.AddMilliseconds($Milliseconds)
  while ([DateTime]::UtcNow -lt $end) {
    Drain-Output
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
  if ($script:LastStatus -ne $Text) {
    $script:LastStatus = $Text
    Add-OutputLine $Text
    if ($Text -match 'Install|Build|Pull|Prepar|Updat|Start') { Show-Terminal }
  }
  Drain-Output
  $form.Visible = $true
  $form.TopMost = $true
  $form.Refresh()
  [void][KioskUpdateWindow]::ShowWindow($form.Handle, 5)
  [void][KioskUpdateWindow]::SetForegroundWindow($form.Handle)
  [System.Windows.Forms.Application]::DoEvents()
}

function Close-Update([string]$Text) {
  if ($script:Closed) { return }
  Set-Progress 100 $Text
  Wait-Ui 1500
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
  $proc.add_OutputDataReceived({ param($sender, $e) if ($e.Data) { Add-OutputLine $e.Data } })
  $proc.add_ErrorDataReceived({ param($sender, $e) if ($e.Data) { Add-OutputLine $e.Data } })
  [void]$proc.Start()
  $proc.BeginOutputReadLine()
  $proc.BeginErrorReadLine()
  while (-not $proc.HasExited) {
    Drain-Output
    Start-Sleep -Milliseconds 100
  }
  $proc.WaitForExit()
  Drain-Output
  return [pscustomobject]@{ Code = $proc.ExitCode; Text = "" }
}

function Invoke-Npm([string[]]$NpmArgs) {
  if (-not (Test-Path $NodeExe) -or -not (Test-Path $NpmCli)) {
    return [pscustomobject]@{ Code = 1; Text = "Node.js is missing." }
  }
  return Invoke-Tool $NodeExe (@($NpmCli) + $NpmArgs)
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

function Test-ServerReady([string]$Commit) {
  $recorded = ""
  if (Test-Path "C:\Kiosk\running-commit") { $recorded = (Get-Content "C:\Kiosk\running-commit" -Raw).Trim() }
  if ($recorded -ne $Commit -or -not (Test-KioskPort)) { return $false }
  try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:3000/" -UseBasicParsing -TimeoutSec 5
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Wait-ServerReady([string]$Commit) {
  $deadline = (Get-Date).AddMinutes(15)
  $started = $false
  while ((Get-Date) -lt $deadline) {
    if (Test-ServerReady $Commit) { return $true }
    Set-Progress -1 "Starting the updated kiosk..."
    if (-not $started -and -not (Test-KioskPort)) {
      $started = $true
      Restart-KioskServer
    }
    Wait-Ui 1000
  }
  return $false
}

function Request-KioskReload {
  New-Item -ItemType File -Force -Path "C:\Kiosk\reload-kiosk" | Out-Null
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
  while ($true) {
    Set-Progress -1 "Checking internet..."
    $online = Test-Internet
    $form.Hide()
    if ($online) {
      Write-Log "Internet is connected."
      [void](Ask-YesNo "Internet is connected." "Continue" "")
      break
    }
    Write-Log "No internet connection."
    $tryAgain = Ask-YesNo "No internet connection.`r`n`r`nUpdates cannot be downloaded.`r`n`r`nTry again checks the connection. Skip goes on to the kiosk question." "Try again" "Skip"
    if (-not $tryAgain) {
      Write-Log "Internet check skipped. Continuing to the kiosk."
      $form.Dispose()
      exit 0
    }
  }

  $wantsCheck = Ask-YesNo "Get the latest kiosk update from the get-updates branch?`r`n`r`nThis is asked every time the device starts, even after the kiosk is installed.`r`n`r`nSkip leaves the installed kiosk as it is. You can still open it on the next screen." "Get updates" "Skip"
  if (-not $wantsCheck) {
    Write-Log "Update check skipped. Continuing to the kiosk."
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
    if (-not (Test-ServerReady $before)) {
      Set-Progress -1 "Starting the updated kiosk..."
      if (-not (Wait-ServerReady $before)) {
        Close-Update "The update is installed. Continuing to the kiosk."
        exit 0
      }
    }
    Request-KioskReload
    Close-Update "Kiosk is up to date."
    exit 0
  }

  $form.Hide()
  $wantsInstall = Ask-YesNo "A new update is available on the get-updates branch.`r`n`r`nPull and install it now?`r`n`r`nSkip continues with the kiosk that is already installed." "Pull and install" "Skip"
  if (-not $wantsInstall) {
    Write-Log "Update install skipped. Local $before remote $remote"
    $form.Dispose()
    exit 0
  }
  $form.Show()
  [void][KioskUpdateWindow]::SetForegroundWindow($form.Handle)

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

  $installMutex = New-Object System.Threading.Mutex($false, "Global\KioskGuideBuild")
  $ownsInstall = $false
  $deadline = (Get-Date).AddMinutes(20)
  while (-not $ownsInstall -and (Get-Date) -lt $deadline) {
    $recorded = ""
    if (Test-Path "C:\Kiosk\running-commit") { $recorded = (Get-Content "C:\Kiosk\running-commit" -Raw).Trim() }
    if ($recorded -eq $after -and (Test-Path (Join-Path $Root ".next\BUILD_ID"))) { break }
    if ($installMutex.WaitOne(800)) { $ownsInstall = $true; break }
    Set-Progress -1 "Installing the update..."
  }

  if ($ownsInstall) {
    try {
      $recorded = ""
      if (Test-Path "C:\Kiosk\running-commit") { $recorded = (Get-Content "C:\Kiosk\running-commit" -Raw).Trim() }
      $alreadyBuilt = $recorded -eq $after -and (Test-Path (Join-Path $Root ".next\BUILD_ID"))
      if (-not $alreadyBuilt) {
        if ($needsInstall) {
          if (-not (Test-Path $NodeExe)) {
            Close-Update "Node.js is missing, so the update could not be installed."
            exit 0
          }
          Set-Progress -1 "Installing updates..."
          $install = Invoke-Npm @("install")
          if ($install.Code -ne 0) {
            Close-Update "Install failed. Continuing with the installed kiosk."
            exit 0
          }
        }
        if ($needsMigrate) {
          Set-Progress -1 "Updating the database..."
          $migrate = Invoke-Npm @("run", "db:deploy")
          if ($migrate.Code -ne 0) {
            Close-Update "Database update failed. The installed kiosk is still running."
            exit 0
          }
        }
        if ($needsBuild -or $needsMigrate) {
          Set-Progress -1 "Preparing the update..."
          $generated = Invoke-Npm @("exec", "--", "prisma", "generate")
          if ($generated.Code -ne 0) {
            Close-Update "Could not prepare the update. The installed kiosk is still running."
            exit 0
          }
        }
        if ($needsBuild) {
          Set-Progress -1 "Building the kiosk..."
          $build = Invoke-Npm @("run", "build")
          if ($build.Code -ne 0) {
            Close-Update "Build failed. The installed kiosk is still running."
            exit 0
          }
          $after | Set-Content -Path "C:\Kiosk\running-commit" -Encoding ascii
        }
      }
    } finally {
      $installMutex.ReleaseMutex() | Out-Null
      $installMutex.Dispose()
    }
  }

  if (-not (Wait-ServerReady $after)) {
    Close-Update "The update finished. Continuing to the kiosk."
    exit 0
  }
  Request-KioskReload
  Close-Update "Update installed. The new kiosk is ready."
} catch {
  Write-Log $_.Exception.Message
  Close-Update "Update check failed. Continuing with the installed kiosk."
}
