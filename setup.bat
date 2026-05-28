@echo off
title Hello Athena - Setup
color 0A

echo ================================================
echo        HELLO ATHENA POS - SETUP
echo ================================================
echo.
echo This will install everything needed.
echo Please wait and do not close this window...
echo.

cd /d "%~dp0"

echo [1/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo Done!
echo.

echo [2/5] Setting up Prisma...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed!
    pause
    exit /b 1
)
echo Done!
echo.

echo [3/5] Creating database...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed!
    pause
    exit /b 1
)
echo Done!
echo.

echo [4/5] Importing products...
call node scripts/import-products.js
if %errorlevel% neq 0 (
    echo ERROR: Product import failed!
    pause
    exit /b 1
)
echo Done!
echo.

echo [5/5] Building app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo Done!
echo.

echo ================================================
echo   SETUP COMPLETE! 
echo ================================================
echo.
echo To start the app, double-click:
echo "Start Hello Athena.vbs"
echo.
echo Creating desktop shortcut...

set SCRIPT="%TEMP%\shortcut.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") >> %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Hello Athena POS.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "%~dp0Start Hello Athena.vbs" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.Description = "Hello Athena POS System" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%
cscript /nologo %SCRIPT%
del %SCRIPT%

echo Desktop shortcut created!
echo.
echo ================================================
echo  You can now close this window and double-click
echo  "Hello Athena POS" on the desktop to start!
echo ================================================
echo.
pause
