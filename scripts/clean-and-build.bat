@echo off
echo ========================================
echo Nettoyage et Build Android - Navipad
echo ========================================
echo.

echo Etape 1: Arreter les daemons Gradle...
call android\gradlew.bat --stop
echo.

echo Etape 2: Nettoyage des caches...
rmdir /s /q android\.gradle 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul
rmdir /s /q .gradle 2>nul
echo Cache nettoye!
echo.

echo Etape 3: Nettoyage Gradle...
call android\gradlew.bat clean
echo.

echo Etape 4: Build Release APK...
call android\gradlew.bat assembleRelease
echo.

if exist android\app\build\outputs\apk\release\app-release.apk (
    echo ========================================
    echo BUILD REUSSI!
    echo APK disponible: android\app\build\outputs\apk\release\app-release.apk
    echo ========================================
) else (
    echo ========================================
    echo ERREUR: Le build a echoue
    echo ========================================
)

pause
