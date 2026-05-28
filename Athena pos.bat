@echo off
cd /d "%~dp0"
start "" /min /b cmd /c "npm start > nul 2>&1"
timeout /t 4 >nul
start "" /b npx electron .
exit