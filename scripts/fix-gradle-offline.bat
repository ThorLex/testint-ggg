@echo off
echo ========================================
echo Fix Gradle Offline - Navipad
echo ========================================
echo.

echo Etape 1: Verification de la version Gradle existante...
if exist android\gradle\wrapper\gradle-wrapper.properties (
    echo Fichier gradle-wrapper.properties trouve
    type android\gradle\wrapper\gradle-wrapper.properties
) else (
    echo ERREUR: Fichier gradle-wrapper.properties manquant
    goto :error
)
echo.

echo Etape 2: Utilisation de la version Gradle locale...
echo Modification du wrapper pour utiliser une version compatible...

echo distributionBase=GRADLE_USER_HOME > android\gradle\wrapper\gradle-wrapper.properties
echo distributionPath=wrapper/dists >> android\gradle\wrapper\gradle-wrapper.properties
echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.8-all.zip >> android\gradle\wrapper\gradle-wrapper.properties
echo networkTimeout=60000 >> android\gradle\wrapper\gradle-wrapper.properties
echo validateDistributionUrl=true >> android\gradle\wrapper\gradle-wrapper.properties
echo zipStoreBase=GRADLE_USER_HOME >> android\gradle\wrapper\gradle-wrapper.properties
echo zipStorePath=wrapper/dists >> android\gradle\wrapper\gradle-wrapper.properties

echo.
echo Nouveau contenu du gradle-wrapper.properties:
type android\gradle\wrapper\gradle-wrapper.properties
echo.

echo Etape 3: Test avec la nouvelle configuration...
call android\gradlew.bat --version
echo.

if %ERRORLEVEL% NEQ 0 (
    echo Echec avec Gradle 8.8, essai avec 8.6...
    echo distributionUrl=https\://services.gradle.org/distributions/gradle-8.6-all.zip > temp_url.txt
    powershell -Command "(Get-Content android\gradle\wrapper\gradle-wrapper.properties) -replace 'gradle-8.8-all.zip', 'gradle-8.6-all.zip' | Set-Content android\gradle\wrapper\gradle-wrapper.properties"
    call android\gradlew.bat --version
)

echo.
echo Etape 4: Nettoyage et test de build...
call android\gradlew.bat clean
echo.

echo ========================================
echo CONFIGURATION TERMINEE!
echo Essayez maintenant: npx expo run:android
echo ========================================
echo.

goto :end

:error
echo ========================================
echo ERREUR: Configuration impossible
echo Verifiez que vous etes dans le bon dossier
echo ========================================

:end
pause