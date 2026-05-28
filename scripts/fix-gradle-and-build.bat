@echo off
echo ========================================
echo Fix Gradle Cache and Build Release APK
echo ========================================
echo.

echo [1/6] Preparing Android resources...
call "%~dp0prepare-android-resources.bat"

echo.
echo [2/6] Stopping Gradle Daemon...
cd android
call gradlew.bat --stop
timeout /t 2 /nobreak >nul

echo.
echo [3/6] Cleaning Gradle cache...
if exist ".gradle" (
    rmdir /s /q ".gradle"
    echo Gradle cache deleted
) else (
    echo No Gradle cache found
)

echo.
echo [4/6] Cleaning build directories...
if exist "build" rmdir /s /q "build"
if exist "app\build" rmdir /s /q "app\build"
echo Build directories cleaned

echo.
echo [5/6] Running Gradle clean...
call gradlew.bat clean

echo.
echo [6/6] Building Release APK...
call gradlew.bat assembleRelease

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo APK Location: android\app\build\outputs\apk\release\app-release.apk
echo.
pause
