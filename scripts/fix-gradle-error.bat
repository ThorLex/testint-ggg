@echo off
echo ========================================
echo Correction Erreur Gradle - Navipad
echo ========================================
echo.

echo Etape 1: Arreter tous les processus Gradle...
call android\gradlew.bat --stop
taskkill /F /IM java.exe 2>nul
echo.

echo Etape 2: Suppression des caches Gradle...
rmdir /s /q android\.gradle 2>nul
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul
rmdir /s /q .gradle 2>nul
rmdir /s /q %USERPROFILE%\.gradle\caches 2>nul
echo.

echo Etape 3: Suppression des fichiers temporaires...
del /s /q android\*.lock 2>nul
echo.

echo Etape 4: Nettoyage npm...
rmdir /s /q node_modules 2>nul
del package-lock.json 2>nul
call npm install
echo.

echo ========================================
echo Nettoyage termine!
echo Vous pouvez maintenant relancer le build
echo ========================================
pause
