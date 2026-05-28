@echo off
echo Correction du problème de splash screen et build Android...

echo.
echo 1. Nettoyage des caches...
call npx expo start --clear --no-dev --minify > nul 2>&1
timeout /t 2 > nul

echo.
echo 2. Regénération des ressources natives...
call npx expo prebuild --platform android --clean

echo.
echo 3. Build Android...
call npx expo run:android --variant release

echo.
echo Build terminé !
pause