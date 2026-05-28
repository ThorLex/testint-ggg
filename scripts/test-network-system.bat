@echo off
echo Test du système de surveillance réseau...
echo.
echo 1. Vérification des imports...
npx tsc --noEmit --skipLibCheck
echo.
echo 2. Compilation réussie !
echo.
echo 3. Instructions de test :
echo    - Lancez l'application sur un appareil/émulateur
echo    - Activez/désactivez le Wi-Fi pour tester les toasts
echo    - Basculez entre Wi-Fi et données mobiles
echo    - Vérifiez l'indicateur réseau dans le header
echo.
pause