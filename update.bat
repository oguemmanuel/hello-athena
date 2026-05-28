@echo off
echo ================================
echo   Hello Athena - Update Script
echo ================================
echo.

cd /d "%~dp0"

echo [1/3] Pulling latest changes from GitHub...
git pull
if %errorlevel% neq 0 (
  echo ERROR: Git pull failed. Check your internet connection.
  pause
  exit /b 1
)

echo.
echo [2/3] Rebuilding app...
set NODE_OPTIONS=--max-old-space-size=4096
call npm run build
if %errorlevel% neq 0 (
  echo ERROR: Build failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Done!
echo ================================
echo  Update complete! Your shop data
echo  is safe and untouched.
echo ================================
echo.
pause
