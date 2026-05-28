@echo off
echo ========================================
echo Prepare Android Resources
echo ========================================
echo.

echo [1/2] Copying splash screen logo...
if exist "assets\splashscreen_logo.png" (
    copy /Y "assets\splashscreen_logo.png" "android\app\src\main\res\drawable\splashscreen_logo.png" >nul
    echo [OK] Splash screen logo copied
) else (
    echo [WARNING] assets\splashscreen_logo.png not found
)

echo.
echo [2/2] Copying app icon...
if exist "assets\icon.png" (
    copy /Y "assets\icon.png" "android\app\src\main\res\drawable\icon.png" >nul
    echo [OK] App icon copied
) else (
    echo [WARNING] assets\icon.png not found
)

echo.
echo ========================================
echo Resources Prepared!
echo ========================================
echo.
