@echo off
echo ========================================
echo Building Release APK for Navipad
echo ========================================
echo.

cd android

echo Step 1: Cleaning previous build...
call gradlew clean
if %ERRORLEVEL% NEQ 0 (
    echo Clean failed!
    cd ..
    exit /b 1
)

echo.
echo Step 2: Building Release APK (this may take 15-20 minutes)...
call gradlew assembleRelease
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    cd ..
    exit /b 1
)

cd ..

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo APK location: android\app\build\outputs\apk\release\app-release.apk
echo.
pause
