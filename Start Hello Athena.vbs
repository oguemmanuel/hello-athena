Dim WshShell, fso
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

Dim appPath
appPath = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = appPath

WshShell.Run "cmd /c taskkill /f /im node.exe > nul 2>&1", 0, True
WshShell.Run """C:\Program Files\nodejs\npm.cmd"" start", 0, False
WshShell.Run """C:\Program Files\nodejs\node.exe"" watch-excel.js", 0, False

WScript.Sleep 6000

WshShell.Run "chrome --app=http://localhost:3000 --start-maximized --no-first-run", 0, False

Set WshShell = Nothing
Set fso = Nothing
