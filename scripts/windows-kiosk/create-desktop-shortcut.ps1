# Creates the desktop shortcut and the guard that keeps fullscreen open until restart.
$ErrorActionPreference = "Stop"

$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$UserName = "Admin"
$config = "C:\Kiosk\device.config"
if (Test-Path $config) {
  foreach ($line in Get-Content $config) {
    if ($line -like "UserName=*") { $UserName = $line.Substring(9).Trim() }
  }
}

$desktopCandidates = New-Object System.Collections.Generic.List[string]
$knownDesktop = [Environment]::GetFolderPath("Desktop")
if ($knownDesktop) { $desktopCandidates.Add($knownDesktop) }
$profile = Get-CimInstance Win32_UserProfile | Where-Object {
  $_.LocalPath -like "*\$UserName" -or $_.LocalPath -like "*\$UserName.*"
} | Select-Object -First 1
if ($profile) {
  $desktopCandidates.Add((Join-Path $profile.LocalPath "Desktop"))
}
$desktopCandidates.Add("C:\Users\$UserName\Desktop")

$wscript = "$env:SystemRoot\System32\wscript.exe"
$launcher = Join-Path $PSScriptRoot "start-fullscreen.vbs"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) {
  $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
}

$written = @{}
foreach ($desktop in ($desktopCandidates | Select-Object -Unique)) {
  if (-not $desktop -or $desktop -like "*\systemprofile\*" -or $written.ContainsKey($desktop.ToLower())) { continue }
  $written[$desktop.ToLower()] = $true
  if (-not (Test-Path $desktop)) {
    New-Item -ItemType Directory -Force -Path $desktop | Out-Null
  }
  $shortcutPath = Join-Path $desktop "Kiosk Fullscreen.lnk"
  $shell = New-Object -ComObject WScript.Shell
  $shortcut = $shell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $wscript
  $shortcut.Arguments = "//B `"$launcher`""
  $shortcut.WorkingDirectory = $Root
  $shortcut.WindowStyle = 7
  $shortcut.Description = "Open the kiosk fullscreen. It stays open until this PC restarts."
  if (Test-Path $edge) { $shortcut.IconLocation = "$edge,0" }
  $shortcut.Save()
  Write-Output "SHORTCUT $shortcutPath"
}

$guard = Join-Path $PSScriptRoot "guard-fullscreen.vbs"
$action = New-ScheduledTaskAction -Execute "$env:SystemRoot\System32\wscript.exe" -Argument "//B `"$guard`""
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1) -RepetitionDuration (New-TimeSpan -Days 31)
$principal = New-ScheduledTaskPrincipal -UserId $UserName -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -MultipleInstances IgnoreNew -ExecutionTimeLimit (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName "Kiosk Fullscreen Guard" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force | Out-Null
Write-Output "GUARD_REGISTERED"
