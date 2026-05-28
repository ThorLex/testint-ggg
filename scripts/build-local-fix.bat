@echo off
echo ========================================
echo Build Local APK - Solution Windows
echo ========================================
echo.

echo IMPORTANT: Fermez Android Studio et tous les terminaux avant de continuer!
pause

echo.
echo Etape 1: Nettoyage complet...
call android\gradlew.bat --stop
taskkill /F /IM java.exe 2>nul
timeout /t 2 >nul

rmdir /s /q android\.gradle 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul
rmdir /s /q %USERPROFILE%\.gradle\caches 2>nul

echo Nettoyage termine!
echo.

echo Etape 2: Build APK (cela peut prendre 5-10 minutes)...
cd android
gradlew.bat assembleRelease --no-daemon --stacktrace
cd ..

echo.
if exist android\app\build\outputs\apk\release\app-release.apk (
    echo ========================================
    echo SUCCESS! APK cree avec succes!
    echo ========================================
    echo.
    echo Fichier: android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo Pour installer sur votre telephone:
    echo 1. Connectez votre telephone en USB
    echo 2. Executez: adb install android\app\build\outputs\apk\release\app-release.apk
    echo.
    echo OU
    echo.
    echo 1. Copiez app-release.apk sur votre telephone
    echo 2. Ouvrez le fichier sur le telephone
    echo 3. Installez (autorisez les sources inconnues)
    echo.
) else (
    echo ========================================
    echo ERREUR: Le build a echoue
    echo ========================================
    echo.
    echo SOLUTION RECOMMANDEE: Utilisez EAS Build (cloud)
    echo.
    echo 1. npm install -g eas-cli
    echo 2. eas login
    echo 3. eas build --platform android --profile preview
    echo.
    echo Consultez BUILD_WITH_EAS.md pour plus de details
    echo.
)

pause
