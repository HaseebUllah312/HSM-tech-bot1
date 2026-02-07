@echo off
REM ========================================
REM HSM Tech Bot - Katabump Deployment Helper
REM ========================================

echo.
echo ========================================
echo    HSM Tech Bot - Katabump Deployment
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env file from .env.example
    pause
    exit /b 1
)

echo [OK] .env file found
echo.

echo ========================================
echo   Checking Required Files
echo ========================================
echo.

REM Check critical files
set errors=0

if exist bot.js (
    echo [OK] bot.js
) else (
    echo [ERROR] bot.js - NOT FOUND
    set /a errors+=1
)

if exist package.json (
    echo [OK] package.json
) else (
    echo [ERROR] package.json - NOT FOUND
    set /a errors+=1
)

if exist src\ (
    echo [OK] src folder
) else (
    echo [ERROR] src folder - NOT FOUND
    set /a errors+=1
)

echo.

if %errors% gtr 0 (
    echo [WARNING] Found %errors% missing required files
    pause
    exit /b 1
)

echo ========================================
echo   Creating ZIP for Katabump
echo ========================================
echo.

REM Create temp directory for clean packaging
if exist katabump-temp rmdir /s /q katabump-temp
mkdir katabump-temp

echo Copying files...

REM Copy essential files
xcopy /E /I /Y src katabump-temp\src >nul
xcopy /E /I /Y data katabump-temp\data >nul 2>nul
xcopy /E /I /Y VU_Files katabump-temp\VU_Files >nul 2>nul
copy /Y bot.js katabump-temp\ >nul
copy /Y package.json katabump-temp\ >nul
copy /Y package-lock.json katabump-temp\ >nul 2>nul
copy /Y .env katabump-temp\ >nul

echo Files copied successfully!
echo.

REM Create ZIP using PowerShell
echo Creating hsm-tech-bot.zip...
powershell -command "Compress-Archive -Path katabump-temp\* -DestinationPath hsm-tech-bot.zip -Force"

if exist hsm-tech-bot.zip (
    echo.
    echo [SUCCESS] hsm-tech-bot.zip created!
    echo.
    
    REM Clean up temp directory
    rmdir /s /q katabump-temp
    
    REM Get file size
    for %%A in (hsm-tech-bot.zip) do echo File size: %%~zA bytes
    echo.
) else (
    echo.
    echo [ERROR] Failed to create ZIP file
    rmdir /s /q katabump-temp
    pause
    exit /b 1
)

echo ========================================
echo   Next Steps for Katabump Deployment
echo ========================================
echo.
echo 1. Go to https://katabump.com/
echo 2. Sign Up / Login
echo 3. Click "Order" or "Create Server"
echo 4. Choose "Node" language
echo 5. Select "Free" tier
echo 6. Go to "Files" tab
echo 7. Upload hsm-tech-bot.zip
echo 8. Extract/Unzip in panel
echo 9. Bot starts automatically
echo 10. Go to "Console" tab to see QR code
echo 11. Scan QR code with WhatsApp
echo.
echo ========================================
echo   Important Notes
echo ========================================
echo.
echo - ZIP file: hsm-tech-bot.zip (ready to upload)
echo - After upload, UNZIP in Katabump panel
echo - QR code appears in Console tab
echo - Bot stays online 24/7 for FREE
echo.
echo For detailed instructions, read DEPLOY.md
echo.
echo Good luck! Press any key to exit...
pause >nul
