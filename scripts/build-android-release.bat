@echo off
echo ========================================
echo Build Android Release - Navipad
echo ========================================
echo.

echo Etape 1: Nettoyage du cache...
call npm cache clean --force
echo.

echo Etape 2: Installation des dependances...
call npm install
echo.

echo Etape 3: Prebuild Android...
call npx expo prebuild --platform android
echo.

echo Etape 4: Build Release APK...
cd android
call gradlew assembleRelease
cd ..
echo.

echo ========================================
echo Build termine!
echo APK disponible dans: android\app\build\outputs\apk\release\app-release.apk
echo ========================================
pause
