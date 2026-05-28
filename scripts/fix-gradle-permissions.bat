@echo off
echo ========================================
echo Fix Gradle Permissions - Navipad
echo ========================================
echo.

echo Etape 1: Verification des permissions...
whoami
echo.

echo Etape 2: Arret de tous les processus Java...
taskkill /f /im java.exe 2>nul
taskkill /f /im javaw.exe 2>nul
echo.

echo Etape 3: Suppression complete des caches avec permissions...
echo Suppression avec takeown et icacls...

if exist "android\.gradle" (
    takeown /f "android\.gradle" /r /d y 2>nul
    icacls "android\.gradle" /grant %USERNAME%:F /t 2>nul
    rmdir /s /q "android\.gradle" 2>nul
    echo Cache android\.gradle supprime
)

if exist "%USERPROFILE%\.gradle" (
    takeown /f "%USERPROFILE%\.gradle" /r /d y 2>nul
    icacls "%USERPROFILE%\.gradle" /grant %USERNAME%:F /t 2>nul
    rmdir /s /q "%USERPROFILE%\.gradle" 2>nul
    echo Cache global .gradle supprime
)

echo.
echo Etape 4: Creation d'un dossier temporaire personnalise...
set GRADLE_USER_HOME=%TEMP%\gradle-navipad
mkdir "%GRADLE_USER_HOME%" 2>nul
echo GRADLE_USER_HOME defini sur: %GRADLE_USER_HOME%
echo.

echo Etape 5: Test avec le nouveau dossier temporaire...
set GRADLE_OPTS=-Dorg.gradle.daemon=false -Dorg.gradle.caching=false
cd android
.\gradlew.bat clean --no-daemon --no-build-cache --gradle-user-home "%GRADLE_USER_HOME%"
cd ..

echo.
echo ========================================
echo Si cela fonctionne, ajoutez ces variables:
echo set GRADLE_USER_HOME=%TEMP%\gradle-navipad
echo set GRADLE_OPTS=-Dorg.gradle.daemon=false
echo ========================================
echo.

pause