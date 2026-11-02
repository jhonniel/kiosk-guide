# Runs at Windows startup, before sign-in.
# Puts the kiosk shell back, then runs the production server in the foreground.
$ErrorActionPreference = "Continue"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$UserName = "Admin"
$config = "C:\Kiosk\device.config"
if (Test-Path $config) {
  foreach ($line in Get-Content $config) {
    if ($line -like "UserName=*") { $UserName = $line.Substring(9).Trim() }
  }
}
$ShellCommand = "wscript.exe `"$Root\scripts\windows-kiosk\kiosk-shell.vbs`""
$LogDir = "C:\Kiosk\logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$Log = Join-Path $LogDir "boot.log"
Remove-Item "C:\Kiosk\fullscreen.lock" -Force -ErrorAction SilentlyContinue

function Write-Log([string]$Message) {
  "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" | Add-Content -Path $Log -Encoding utf8
}

function Set-KioskUserShell {
  $user = Get-LocalUser -Name $UserName -ErrorAction Stop
  $sid = $user.Sid.Value
  $hive = "Registry::HKEY_USERS\$sid"
  $loaded = $false

  if (-not (Test-Path $hive)) {
    $profile = Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $sid } | Select-Object -First 1
    $ntuser = Join-Path $profile.LocalPath "NTUSER.DAT"
    & reg.exe load "HKU\$sid" $ntuser | Out-Null
    if ($LASTEXITCODE -ne 0) {
      Write-Log "Could not load the $UserName user hive."
      return
    }
    $loaded = $true
    Start-Sleep -Seconds 1
  }

  $winlogon = Join-Path $hive "Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
  New-Item -Path $winlogon -Force | Out-Null
  Set-ItemProperty -Path $winlogon -Name "Shell" -Value $ShellCommand

  $policies = Join-Path $hive "Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"
  New-Item -Path $policies -Force | Out-Null
  Remove-ItemProperty -Path $policies -Name "NoWinKeys" -ErrorAction SilentlyContinue

  if ($loaded) {
    [GC]::Collect()
    Start-Sleep -Seconds 1
    & reg.exe unload "HKU\$sid" | Out-Null
  }

  Write-Log "Kiosk shell is set for the next sign-in."
}

try {
  Set-KioskUserShell
} catch {
  Write-Log "Shell setup failed: $($_.Exception.Message)"
}

try {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "$Root\scripts\windows-kiosk\create-desktop-shortcut.ps1" |
    ForEach-Object { Write-Log $_ }
} catch {
  Write-Log "Desktop shortcut setup failed: $($_.Exception.Message)"
}

& "$Root\scripts\windows-kiosk\start-server.ps1"
exit $LASTEXITCODE
