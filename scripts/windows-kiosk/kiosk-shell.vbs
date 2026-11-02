Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("Wscript.Shell")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
root = fso.GetParentFolderName(fso.GetParentFolderName(scriptDir))
shell.CurrentDirectory = root

' Check internet and pull the get-updates branch before the kiosk question.
shell.Run "powershell.exe -STA -NoProfile -ExecutionPolicy Bypass -File """ & scriptDir & "\check-updates.ps1""", 0, True

message = "Continue to the kiosk?" & vbCrLf & vbCrLf & _
  "Yes — fullscreen kiosk. This PC shows only the kiosk." & vbCrLf & vbCrLf & _
  "No — use Windows normally. The kiosk keeps running in the background." & vbCrLf & _
  "Use the Kiosk Fullscreen shortcut on the desktop to open it fullscreen." & vbCrLf & _
  "That stays open until you restart the PC." & vbCrLf & _
  "Or open http://localhost:3000 in a browser. That stays a normal window."

' vbYesNo (4) + vbQuestion (32) + vbSystemModal (4096) + default No (256)
choice = MsgBox(message, 4 + 32 + 4096 + 256, "Kiosk Guide")

If choice = 6 Then
  mode = "Kiosk"
Else
  mode = "Desktop"
End If

shell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File """ & scriptDir & "\kiosk-shell.ps1"" -Mode " & mode, 0, True
