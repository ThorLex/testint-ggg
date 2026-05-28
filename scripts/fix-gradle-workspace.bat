@echo off
echo ========================================
echo Fix Gradle Workspace Error - Navipad
echo ========================================
echo.

echo Etape 1: Arreter tous les processus Gradle...
taskkill /f /im java.exe 2>nul
taskkill /f /im gradle.exe 2>nul
call android\gradlew.bat --stop 2>nul
echo.

echo Etape 2: Attendre la liberation des fichiers...
timeout /t 3 /nobreak >nul
echo.

echo Etape 3: Nettoyage complet des caches Gradle...
echo Suppression du cache .gradle local...
rmdir /s /q android\.gradle 2>nul
rmdir /s /q .gradle 2>nul

echo Suppression du cache Gradle global...
rmdir /s /q "%USERPROFILE%\.gradle\caches" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\daemon" 2>nul
rmdir /s /q "%USERPROFILE%\.gradle\wrapper" 2>nul

echo Suppression des dossiers de build...
rmdir /s /q android\app\build 2>nul
rmdir /s /q android\build 2>nul

echo Suppression des caches Node.js...
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q .expo 2>nul

echo Suppression des fichiers temporaires...
del /q /s android\*.tmp 2>nul
del /q /s android\*.lock 2>nul
echo.

echo Etape 4: Attendre la liberation complete...
timeout /t 5 /nobreak >nul
echo.

echo Etape 5: Regeneration des wrappers Gradle...
echo Telechargement du wrapper Gradle...
call android\gradlew.bat wrapper --gradle-version=8.10.2 --distribution-type=all
echo.

echo Etape 6: Test de la configuration Gradle...
call android\gradlew.bat --version
echo.

echo Etape 7: Nettoyage Gradle...
call android\gradlew.bat clean
echo.

echo ========================================
echo NETTOYAGE TERMINE!
echo Vous pouvez maintenant essayer:
echo   npx expo run:android
echo ========================================
echo.

pause