@echo off
echo ========================================
echo Force Gradle Fix - Solution Radicale
echo ========================================
echo.

echo Etape 1: Arret de tous les processus...
taskkill /f /im java.exe 2>nul
taskkill /f /im javaw.exe 2>nul
taskkill /f /im gradle.exe 2>nul
echo.

echo Etape 2: Suppression complete du dossier Android...
if exist android (
    echo Suppression du dossier android...
    rmdir /s /q android 2>nul
    timeout /t 2 /nobreak >nul
)

echo Etape 3: Nettoyage des caches globaux...
if exist "%USERPROFILE%\.gradle" (
    echo Suppression du cache Gradle global...
    rmdir /s /q "%USERPROFILE%\.gradle" 2>nul
)

if exist ".gradle" (
    echo Suppression du cache local...
    rmdir /s /q ".gradle" 2>nul
)

echo Etape 4: Regeneration du projet Android...
echo Regeneration avec Expo...
npx expo prebuild --clean --platform android

echo.
echo Etape 5: Configuration Gradle optimisee...
echo Modification du wrapper Gradle...

echo distributionBase=GRADLE_USER_HOME > android\gradle\wrapper\gradle-wrapper.properties
echo distributionPath=wrapper/dists >> android\gradle\wrapper\gradle-wrapper.properties
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip >> android\gradle\wrapper\gradle-wrapper.properties
echo networkTimeout=120000 >> android\gradle\wrapper\gradle-wrapper.properties
echo validateDistributionUrl=true >> android\gradle\wrapper\gradle-wrapper.properties
echo zipStoreBase=GRADLE_USER_HOME >> android\gradle\wrapper\gradle-wrapper.properties
echo zipStorePath=wrapper/dists >> android\gradle\wrapper\gradle-wrapper.properties

echo.
echo Etape 6: Creation du gradle.properties optimise...
echo org.gradle.jvmargs=-Xmx4096m -XX:MaxMetaspaceSize=512m > android\gradle.properties
echo org.gradle.parallel=true >> android\gradle.properties
echo org.gradle.daemon=false >> android\gradle.properties
echo org.gradle.configureondemand=false >> android\gradle.properties
echo org.gradle.caching=false >> android\gradle.properties
echo android.useAndroidX=true >> android\gradle.properties
echo android.enableJetifier=true >> android\gradle.properties

echo.
echo Etape 7: Test du build...
cd android
echo Test de la version Gradle...
.\gradlew.bat --version

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Test du build debug...
    .\gradlew.bat assembleDebug --no-daemon --no-build-cache
) else (
    echo Erreur avec Gradle, essai avec une version plus ancienne...
    echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.4-all.zip > gradle\wrapper\gradle-wrapper.properties
    .\gradlew.bat --version
)

cd ..

echo.
echo ========================================
echo PROCESSUS TERMINE!
echo Si le build fonctionne, essayez:
echo   npx expo run:android
echo ========================================
echo.

pause