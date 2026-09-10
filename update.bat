@echo off
echo ================================
echo   Hello Athena - Update Script
echo ================================
echo.

cd /d "%~dp0"

echo [0/5] Closing the app if it's running...
taskkill /F /IM electron.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [1/5] Pulling latest changes from GitHub...
git pull
if %errorlevel% neq 0 (
  echo ERROR: Git pull failed. Check your internet connection.
  pause
  exit /b 1
)

echo.
echo [2/5] Applying database schema changes...
call npx prisma generate
if %errorlevel% neq 0 (
  echo ERROR: Prisma generate failed.
  pause
  exit /b 1
)
call npx prisma db push
if %errorlevel% neq 0 (
  echo ERROR: Database schema update failed.
  pause
  exit /b 1
)

echo.
echo [3/5] Syncing new products to database...
node scripts/sync-from-excel.js
if %errorlevel% neq 0 (
  echo ERROR: Sync failed.
  pause
  exit /b 1
)

echo.
if not exist ".env.local" (
  echo WARNING: .env.local not found - admin login will not work.
  echo Run "set-password.bat" to set the admin password, then run this again.
  pause
  exit /b 1
)

echo.
echo [4/5] Rebuilding app...
set NODE_OPTIONS=--max-old-space-size=4096
call npm run build
if %errorlevel% neq 0 (
  echo ERROR: Build failed.
  pause
  exit /b 1
)

echo.
echo [5/5] Done!
echo ================================
echo  Update complete! Your shop data
echo  is safe and untouched.
echo.
echo  The app was closed to apply this
echo  update - reopen it with
echo  "Athena pos.bat".
echo ================================
echo.
pause
