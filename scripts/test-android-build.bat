@echo off
echo Test de compilation Android...
echo.
echo 1. Nettoyage du cache...
npx expo start --clear --no-dev --minify --android
echo.
echo 2. Si la compilation échoue, vérifiez :
echo    - Les imports sont corrects
echo    - Les dépendances sont installées
echo    - Le cache Metro est vidé
echo.
pause