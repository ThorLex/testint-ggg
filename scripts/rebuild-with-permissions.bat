@echo off
echo ========================================
echo REBUILD APK AVEC NOUVELLES PERMISSIONS
echo ========================================

echo.
echo 1. Nettoyage des caches...
cd /d "%~dp0\.."
if exist node_modules rmdir /s /q node_modules
if exist android\.gradle rmdir /s /q android\.gradle
if exist android\app\build rmdir /s /q android\app\build
if exist android\build rmdir /s /q android\build

echo.
echo 2. Reinstallation des dependances...
call npm install

echo.
echo 3. Nettoyage Gradle...
cd android
call .\gradlew.bat clean

echo.
echo 4. Build APK Release...
call .\gradlew.bat assembleRelease

echo.
echo ========================================
echo BUILD TERMINE
echo ========================================
echo APK genere dans: android\app\build\outputs\apk\release\
pause