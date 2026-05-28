@echo off
echo ========================================
echo Configure Android NDK
echo ========================================
echo.

set NDK_VERSION=29.0.14206865
set SDK_PATH=C:\Users\Rovan\AppData\Local\Android\Sdk
set NDK_PATH=%SDK_PATH%\ndk\%NDK_VERSION%

echo Checking NDK installation...
if exist "%NDK_PATH%" (
    echo [OK] NDK %NDK_VERSION% found at: %NDK_PATH%
) else (
    echo [ERROR] NDK %NDK_VERSION% not found!
    echo Expected location: %NDK_PATH%
    echo.
    echo Please install NDK %NDK_VERSION% using Android Studio:
    echo 1. Open Android Studio
    echo 2. Go to Tools ^> SDK Manager
    echo 3. Go to SDK Tools tab
    echo 4. Check "Show Package Details"
    echo 5. Expand "NDK (Side by side)"
    echo 6. Check version %NDK_VERSION%
    echo 7. Click Apply
    echo.
    pause
    exit /b 1
)

echo.
echo Updating gradle.properties...
echo android.ndkVersion=%NDK_VERSION%
echo ANDROID_NDK_HOME=%NDK_PATH%

echo.
echo Creating/Updating local.properties...
(
    echo sdk.dir=%SDK_PATH:\=\\%
    echo ndk.dir=%NDK_PATH:\=\\%
) > android\local.properties

echo.
echo ========================================
echo NDK Configuration Complete!
echo ========================================
echo NDK Version: %NDK_VERSION%
echo NDK Path: %NDK_PATH%
echo.
echo You can now build the project:
echo   cd android
echo   .\gradlew.bat assembleRelease
echo.
pause
