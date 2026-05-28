@echo off
echo Build Android Release - Nettoyage complet et reconstruction...

echo.
echo 1. Arrêt des processus Metro en cours...
taskkill /f /im node.exe > nul 2>&1

echo.
echo 2. Nettoyage des caches...
call npx expo start --clear > nul 2>&1
timeout /t 3 > nul

echo.
echo 3. Correction des ressources splash screen...
call .\scripts\fix-splash-resources.bat > nul 2>&1

echo.
echo 4. Nettoyage Gradle...
if exist "android\app\build" rmdir /s /q "android\app\build"
if exist "android\build" rmdir /s /q "android\build"

echo.
echo 5. Build Android Release...
call npx expo run:android --variant release

echo.
echo Build terminé !
pause