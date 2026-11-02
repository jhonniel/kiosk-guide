# Checks this device, then installs only what is missing.
# Run Setup-Kiosk.bat from the project folder.
$ErrorActionPreference = "Stop"

function Write-Step([string]$Message) {
  Write-Host ""
  Write-Host "== $Message" -ForegroundColor Cyan
}

function Write-Check([string]$Name, [bool]$Ok, [string]$Detail) {
  $mark = if ($Ok) { "OK     " } else { "MISSING" }
  $color = if ($Ok) { "Green" } else { "Yellow" }
  Write-Host ("[{0}] {1} - {2}" -f $mark, $Name, $Detail) -ForegroundColor $color
}

function Refresh-Path {
  $machine = [Environment]::GetEnvironmentVariable("Path", "Machine")
  $user = [Environment]::GetEnvironmentVariable("Path", "User")
  $env:Path = "$machine;$user"
}

function Test-Listening([int]$Port) {
  $client = $null
  try {
    $client = New-Object System.Net.Sockets.TcpClient
    $iar = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
    return [bool]($iar.AsyncWaitHandle.WaitOne(1000, $false) -and $client.Connected)
  } catch {
    return $false
  } finally {
    if ($client) { $client.Close() }
  }
}

function Get-PostgresRoot {
  Get-ChildItem "C:\Program Files\PostgreSQL" -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    Select-Object -First 1
}

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$admin = New-Object Security.Principal.WindowsPrincipal($identity)
if (-not $admin.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Restarting with Administrator permission..."
  Start-Process -FilePath "powershell.exe" -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
  exit 0
}

Write-Step "Operating system"
if ($env:OS -ne "Windows_NT") {
  Write-Host "This setup file supports Windows only. Detected: $($env:OS)"
  exit 1
}

$os = Get-CimInstance Win32_OperatingSystem
$arch = $env:PROCESSOR_ARCHITECTURE
$build = [int]$os.BuildNumber
$supported = $arch -in @("AMD64", "ARM64") -and $build -ge 10240
Write-Host "OS:           $($os.Caption)"
Write-Host "Version:      $($os.Version)  build $build"
Write-Host "Architecture: $arch"
if (-not $supported) {
  Write-Host "This setup needs 64-bit Windows 10 or Windows 11."
  exit 1
}
Write-Host "Supported. Continuing."

Write-Host "User:         $env:USERNAME"

Write-Step "Project folder"
Refresh-Path
if (-not (Test-Path "C:\Program Files\Git\cmd\git.exe")) {
  Write-Host "Git is missing. Installing it so the project can be cloned."
  winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity
  Refresh-Path
}
$env:Path = "C:\Program Files\Git\cmd;" + $env:Path
$git = "C:\Program Files\Git\cmd\git.exe"
if (-not (Test-Path $git)) { throw "Git is required to clone the project." }

$Root = Join-Path ([Environment]::GetFolderPath("MyDocuments")) "KIOSK"
Write-Host "Install folder: $Root"
if (Test-Path (Join-Path $Root "package.json")) {
  Write-Host "Project is already in Documents. Clone will be skipped."
} else {
  if ((Test-Path $Root) -and (Get-ChildItem $Root -Force -ErrorAction SilentlyContinue | Select-Object -First 1)) {
    throw "Documents\KIOSK already exists but does not contain the kiosk project. Move that folder aside, then run setup again."
  }
  $documents = Split-Path $Root -Parent
  if (-not (Test-Path $documents)) { New-Item -ItemType Directory -Force -Path $documents | Out-Null }
  Write-Host "Cloning the get-updates branch into Documents..."
  & $git clone --branch get-updates --single-branch "https://github.com/jhonniel/kiosk-guide.git" $Root
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path (Join-Path $Root "package.json"))) {
    throw "Clone failed. Check the network connection and run Setup-Kiosk.bat again."
  }
  Write-Host "Clone finished."
}

$ScriptDir = Join-Path $Root "scripts\windows-kiosk"
$sourceDir = $PSScriptRoot
if ($sourceDir.TrimEnd('\') -ne $ScriptDir.TrimEnd('\')) {
  New-Item -ItemType Directory -Force -Path $ScriptDir | Out-Null
  Copy-Item -Path (Join-Path $sourceDir "*") -Destination $ScriptDir -Force
  $setupBat = Join-Path (Resolve-Path (Join-Path $sourceDir "..\..")).Path "Setup-Kiosk.bat"
  if (Test-Path $setupBat) {
    Copy-Item $setupBat (Join-Path $Root "Setup-Kiosk.bat") -Force
  }
  Write-Host "Copied the Windows setup files into Documents."
}
Set-Location $Root

Write-Step "Checking what is already installed"
Refresh-Path
$gitOk = Test-Path "C:\Program Files\Git\cmd\git.exe"
$nodeOk = Test-Path "C:\Program Files\nodejs\node.exe"
$pgRoot = Get-PostgresRoot
$pgOk = [bool]$pgRoot
$appOk = Test-Path (Join-Path $Root "package.json")
$envOk = Test-Path (Join-Path $Root ".env")
$modulesOk = Test-Path (Join-Path $Root "node_modules\next\package.json")
$buildOk = Test-Path (Join-Path $Root ".next\BUILD_ID")
$task = Get-ScheduledTask -TaskName "Kiosk Guide" -ErrorAction SilentlyContinue
$guard = Get-ScheduledTask -TaskName "Kiosk Fullscreen Guard" -ErrorAction SilentlyContinue
$taskOk = [bool]$task
$guardOk = [bool]$guard
$shell = (Get-ItemProperty "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" -ErrorAction SilentlyContinue).Shell
$shellOk = $shell -like "*kiosk-shell.vbs*"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutOk = Test-Path (Join-Path $desktop "Kiosk Fullscreen.lnk")

Write-Check "Git" $gitOk $(if ($gitOk) { "installed" } else { "will install" })
Write-Check "Node.js" $nodeOk $(if ($nodeOk) { "installed" } else { "will install" })
Write-Check "PostgreSQL" $pgOk $(if ($pgOk) { $pgRoot.FullName } else { "will install" })
Write-Check "Kiosk app" $appOk $(if ($appOk) { $Root } else { "clone did not create the project" })
Write-Check "Environment" $envOk $(if ($envOk) { ".env found" } else { "will create .env" })
Write-Check "Packages" $modulesOk $(if ($modulesOk) { "node_modules found" } else { "will run npm install" })
Write-Check "Production build" $buildOk $(if ($buildOk) { ".next found" } else { "will build" })
Write-Check "Startup task" $taskOk $(if ($taskOk) { "Kiosk Guide is registered" } else { "will register" })
Write-Check "Boot question" $shellOk $(if ($shellOk) { "sign-in opens the kiosk question" } else { "will set the boot question" })
Write-Check "Desktop shortcut" $shortcutOk $(if ($shortcutOk) { "Kiosk Fullscreen shortcut found" } else { "will create" })
Write-Check "Fullscreen guard" $guardOk $(if ($guardOk) { "registered" } else { "will register" })

if (-not $appOk) {
  throw "The kiosk project was not cloned to $Root."
}

$ready = $gitOk -and $nodeOk -and $pgOk -and $envOk -and $modulesOk -and $buildOk -and $taskOk -and $shellOk -and $shortcutOk -and $guardOk
if ($ready) {
  Write-Step "Already set up"
  Write-Host "This PC already has the kiosk. No install steps will be repeated."
  if (-not (Test-Listening 3000)) {
    Write-Host "Starting the kiosk server."
    Start-ScheduledTask -TaskName "Kiosk Guide"
  } else {
    Write-Host "Kiosk server is already running at http://localhost:3000"
  }
  Write-Host ""
  Write-Host "Restart to be asked whether to open the kiosk." -ForegroundColor Green
  Write-Host "Desktop shortcut: Kiosk Fullscreen"
  exit 0
}

Write-Step "Installing only what is missing"
if (-not $gitOk) {
  winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity
}
if (-not $nodeOk) {
  winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity
}
if (-not $pgOk) {
  winget install --id PostgreSQL.PostgreSQL.16 -e --source winget --accept-package-agreements --accept-source-agreements --disable-interactivity --override "--mode unattended --unattendedmodeui none --superpassword password --serverport 5432 --disable-components stackbuilder"
  $pgRoot = Get-PostgresRoot
}
if (-not $pgRoot) { throw "PostgreSQL is not available." }

Refresh-Path
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;$($pgRoot.FullName)\bin;" + $env:Path
$psql = Join-Path $pgRoot.FullName "bin\psql.exe"
Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -ne "Running" } | Start-Service

$dbUser = "postgres"
$dbPassword = "password"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "kiosk_guide"
if ($envOk) {
  $envLine = Get-Content (Join-Path $Root ".env") | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
  if ($envLine -match 'postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/([^?"\s]+)') {
    $dbUser = $Matches[1]
    $dbPassword = $Matches[2]
    $dbHost = $Matches[3]
    $dbPort = $Matches[4]
    $dbName = $Matches[5]
  }
}

if (-not $envOk) {
  $secret = node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  @"
DATABASE_URL="postgresql://postgres:password@localhost:5432/kiosk_guide?schema=public"
AUTH_SECRET="$secret"
NEXTAUTH_URL="http://localhost:3000"
"@ | Set-Content -Path (Join-Path $Root ".env") -Encoding utf8
  Write-Host "Created .env"
}

$env:PGPASSWORD = $dbPassword
& $psql -U $dbUser -h $dbHost -p $dbPort -c "SELECT 1" | Out-Null
if ($LASTEXITCODE -ne 0) {
  throw "Cannot sign in to PostgreSQL as $dbUser. Check the password in .env."
}
$exists = (& $psql -U $dbUser -h $dbHost -p $dbPort -tAc "SELECT 1 FROM pg_database WHERE datname = '$dbName'").Trim()
$createdDatabase = $false
if ($exists -ne "1") {
  & $psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;"
  $createdDatabase = $true
  Write-Host "Created database $dbName"
} else {
  Write-Host "Database $dbName already exists"
}

if (-not $modulesOk) {
  npm install
} else {
  Write-Host "Packages already installed"
}

if ($createdDatabase -or -not $buildOk) {
  npm run db:deploy
  if ($createdDatabase) { npm run db:seed }
}
if (-not $buildOk) {
  npm run build
} else {
  Write-Host "Production build already exists"
}

New-Item -ItemType Directory -Force -Path "C:\Kiosk\logs" | Out-Null
@"
UserName=$env:USERNAME
"@ | Set-Content -Path "C:\Kiosk\device.config" -Encoding ascii

if (-not $taskOk) {
  $ensure = Join-Path $ScriptDir "ensure-kiosk-boot.ps1"
  $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ensure`""
  $trigger = New-ScheduledTaskTrigger -AtStartup
  $trigger.Delay = "PT15S"
  $taskPrincipal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew
  Register-ScheduledTask -TaskName "Kiosk Guide" -Action $action -Trigger $trigger -Principal $taskPrincipal -Settings $settings -Force | Out-Null
  Write-Host "Registered startup task"
} else {
  Write-Host "Startup task already registered"
}

if (-not $shellOk) {
  $shellCommand = "wscript.exe `"$Root\scripts\windows-kiosk\kiosk-shell.vbs`""
  New-Item -Path "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" -Force | Out-Null
  Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" -Name "Shell" -Value $shellCommand
  Write-Host "Boot question will show at the next sign-in"
}

if (-not $shortcutOk -or -not $guardOk) {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File (Join-Path $ScriptDir "create-desktop-shortcut.ps1")
}

Add-Type -AssemblyName System.DirectoryServices.AccountManagement
$context = New-Object System.DirectoryServices.AccountManagement.PrincipalContext("Machine")
$blankPassword = $false
try { $blankPassword = $context.ValidateCredentials($env:USERNAME, "") } catch { $blankPassword = $false }
if ($blankPassword) {
  $winlogon = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
  if ((Get-ItemProperty $winlogon -ErrorAction SilentlyContinue).AutoAdminLogon -ne "1") {
    Set-ItemProperty -Path $winlogon -Name "AutoAdminLogon" -Value "1"
    Set-ItemProperty -Path $winlogon -Name "DefaultUserName" -Value $env:USERNAME
    Set-ItemProperty -Path $winlogon -Name "DefaultDomainName" -Value $env:COMPUTERNAME
    Set-ItemProperty -Path $winlogon -Name "DefaultPassword" -Value ""
  }
  Write-Host "Windows will sign in automatically."
} else {
  Write-Host "This Windows account has a password. Sign in after restart, then the kiosk question appears."
}

New-Item -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization" -Force | Out-Null
New-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Personalization" -Name "NoLockScreen" -PropertyType DWord -Value 1 -Force | Out-Null
powercfg /change standby-timeout-ac 0 | Out-Null
powercfg /change standby-timeout-dc 0 | Out-Null
powercfg /change monitor-timeout-ac 0 | Out-Null
powercfg /change monitor-timeout-dc 0 | Out-Null
powercfg /change hibernate-timeout-ac 0 | Out-Null
powercfg /change hibernate-timeout-dc 0 | Out-Null
powercfg -setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0 | Out-Null
powercfg -setdcvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0 | Out-Null
powercfg -setactive SCHEME_CURRENT | Out-Null

if (-not (Test-Listening 3000)) {
  Start-ScheduledTask -TaskName "Kiosk Guide"
  Write-Host "Started the kiosk server."
} else {
  Write-Host "Kiosk server is already running."
}

Write-Host ""
Write-Host "Setup finished." -ForegroundColor Green
Write-Host "Restart this PC. It will ask whether to open the kiosk."
Write-Host "Desktop shortcut: Kiosk Fullscreen"
Write-Host "Address: http://localhost:3000"
