@echo off
echo Correction des ressources splash screen manquantes...

echo.
echo 1. Création du dossier drawable si nécessaire...
if not exist "android\app\src\main\res\drawable" mkdir "android\app\src\main\res\drawable"

echo.
echo 2. Copie du logo splash screen...
copy "assets\splashscreen_logo.png" "android\app\src\main\res\drawable\splashscreen_logo.png" > nul 2>&1

echo.
echo 3. Copie de l'icône principale comme fallback...
copy "assets\icon.png" "android\app\src\main\res\drawable\splash_icon.png" > nul 2>&1

echo.
echo 4. Copie de l'image splash...
copy "assets\splash.png" "android\app\src\main\res\drawable\splash_image.png" > nul 2>&1

echo.
echo Ressources splash screen copiées avec succès !
echo Vous pouvez maintenant relancer le build Android.

pause