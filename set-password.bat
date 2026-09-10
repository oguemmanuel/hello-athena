@echo off
REM Sets the admin/POS unlock password for THIS machine only.
REM Writes .env.local (which is gitignored - never committed).
REM After running this, rebuild the app so the change takes effect.

cd /d "%~dp0"

echo ================================
echo   Hello Athena - Set Admin Password
echo ================================
echo.
echo This changes the password on THIS computer only.
echo Avoid the characters ^% ^^ ^& in the password.
echo.

set "NEWPASS="
set /p "NEWPASS=Enter the new admin password: "

if "%NEWPASS%"=="" (
  echo.
  echo No password entered. Nothing changed.
  pause
  exit /b 1
)

> ".env.local" echo NEXT_PUBLIC_ADMIN_PASSWORD=%NEWPASS%

echo.
echo Saved to .env.local
echo.
echo Next steps:
echo   1. Close the app
echo   2. Run:  npm run build
echo   3. Reopen with "Athena pos.bat"
echo.
pause
