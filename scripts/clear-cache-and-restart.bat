@echo off
echo ========================================
echo Clearing all caches and restarting...
echo ========================================

echo.
echo [1/5] Stopping Metro bundler...
taskkill /F /IM node.exe 2>nul

echo.
echo [2/5] Clearing Metro bundler cache...
if exist "%LOCALAPPDATA%\Temp\metro-*" (
    rmdir /s /q "%LOCALAPPDATA%\Temp\metro-*"
)
if exist "%TEMP%\metro-*" (
    rmdir /s /q "%TEMP%\metro-*"
)
if exist "%TEMP%\react-*" (
    rmdir /s /q "%TEMP%\react-*"
)

echo.
echo [3/5] Clearing Expo cache...
if exist ".expo" (
    rmdir /s /q ".expo"
)

echo.
echo [4/5] Clearing node_modules cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
)

echo.
echo [5/5] Starting fresh Metro bundler...
echo.
echo ========================================
echo Cache cleared! Starting Metro...
echo ========================================
echo.

npx expo start --clear

pause
