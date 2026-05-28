@echo off
echo ========================================
echo Build Android Debug - Navipad
echo ========================================
echo.

echo Etape 1: Prebuild Android...
call npx expo prebuild --platform android --clean
echo.

echo Etape 2: Build et installation...
call npx expo run:android
echo.

echo ========================================
echo Build termine!
echo ========================================
pause
