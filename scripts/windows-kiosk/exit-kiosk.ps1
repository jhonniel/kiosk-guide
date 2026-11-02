# Restores the Windows desktop for maintenance.
# The next restart puts the fullscreen kiosk back.
$ErrorActionPreference = "Continue"

$winlogon = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Winlogon"
if (Get-ItemProperty -Path $winlogon -Name Shell -ErrorAction SilentlyContinue) {
  Remove-ItemProperty -Path $winlogon -Name Shell -ErrorAction SilentlyContinue
}

Get-CimInstance Win32_Process -Filter "Name = 'msedge.exe'" -ErrorAction SilentlyContinue |
  Where-Object { $_.CommandLine -and $_.CommandLine -like "*C:\Kiosk\edge-profile*" } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Get-Process powershell, wscript -ErrorAction SilentlyContinue |
  Where-Object { $_.Id -ne $PID } |
  ForEach-Object {
    try {
      $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $($_.Id)"
      if ($proc.CommandLine -like "*kiosk-shell*") {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
      }
    } catch {}
  }

if (-not (Get-Process explorer -ErrorAction SilentlyContinue)) {
  Start-Process explorer.exe
}

Write-Output "Windows desktop restored. The next restart asks again whether to open the kiosk."
