# Fix Gradle Workspace Error - PowerShell Version
Write-Host "========================================" -ForegroundColor Green
Write-Host "Fix Gradle Workspace Error - Navipad" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Fonction pour supprimer un dossier avec retry
function Remove-DirectoryWithRetry {
    param([string]$Path, [int]$MaxRetries = 3)
    
    for ($i = 1; $i -le $MaxRetries; $i++) {
        try {
            if (Test-Path $Path) {
                Write-Host "Tentative $i : Suppression de $Path..." -ForegroundColor Yellow
                Remove-Item -Path $Path -Recurse -Force -ErrorAction Stop
                Write-Host "✅ $Path supprimé avec succès" -ForegroundColor Green
                return $true
            }
            return $true
        }
        catch {
            Write-Host "❌ Échec tentative $i : $($_.Exception.Message)" -ForegroundColor Red
            if ($i -lt $MaxRetries) {
                Write-Host "Attente avant nouvelle tentative..." -ForegroundColor Yellow
                Start-Sleep -Seconds 2
            }
        }
    }
    return $false
}

# Étape 1: Arrêter tous les processus
Write-Host "Étape 1: Arrêt des processus Gradle et Java..." -ForegroundColor Cyan
try {
    Get-Process -Name "java" -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process -Name "gradle" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Processus arrêtés" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Certains processus n'ont pas pu être arrêtés" -ForegroundColor Yellow
}

# Arrêter le daemon Gradle
try {
    & "android\gradlew.bat" --stop 2>$null
    Write-Host "✅ Daemon Gradle arrêté" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Daemon Gradle déjà arrêté" -ForegroundColor Yellow
}

Write-Host ""

# Étape 2: Attendre la libération des fichiers
Write-Host "Étape 2: Attente de la libération des fichiers..." -ForegroundColor Cyan
Start-Sleep -Seconds 3
Write-Host ""

# Étape 3: Nettoyage des caches
Write-Host "Étape 3: Nettoyage complet des caches..." -ForegroundColor Cyan

$pathsToClean = @(
    "android\.gradle",
    ".gradle",
    "android\app\build",
    "android\build",
    "node_modules\.cache",
    ".expo",
    "$env:USERPROFILE\.gradle\caches",
    "$env:USERPROFILE\.gradle\daemon",
    "$env:USERPROFILE\.gradle\wrapper"
)

foreach ($path in $pathsToClean) {
    Remove-DirectoryWithRetry -Path $path
}

# Supprimer les fichiers temporaires
Write-Host "Suppression des fichiers temporaires..." -ForegroundColor Yellow
try {
    Get-ChildItem -Path "android" -Recurse -Include "*.tmp", "*.lock" -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "✅ Fichiers temporaires supprimés" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Certains fichiers temporaires n'ont pas pu être supprimés" -ForegroundColor Yellow
}

Write-Host ""

# Étape 4: Attendre la libération complète
Write-Host "Étape 4: Attente de la libération complète..." -ForegroundColor Cyan
Start-Sleep -Seconds 5
Write-Host ""

# Étape 5: Régénération du wrapper Gradle
Write-Host "Étape 5: Régénération du wrapper Gradle..." -ForegroundColor Cyan
try {
    & "android\gradlew.bat" wrapper --gradle-version=8.10.2 --distribution-type=all
    Write-Host "✅ Wrapper Gradle régénéré" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors de la régénération du wrapper" -ForegroundColor Red
}
Write-Host ""

# Étape 6: Test de la configuration
Write-Host "Étape 6: Test de la configuration Gradle..." -ForegroundColor Cyan
try {
    & "android\gradlew.bat" --version
    Write-Host "✅ Configuration Gradle OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Problème avec la configuration Gradle" -ForegroundColor Red
}
Write-Host ""

# Étape 7: Nettoyage Gradle
Write-Host "Étape 7: Nettoyage Gradle..." -ForegroundColor Cyan
try {
    & "android\gradlew.bat" clean
    Write-Host "✅ Nettoyage Gradle terminé" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors du nettoyage Gradle" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "NETTOYAGE TERMINÉ!" -ForegroundColor Green
Write-Host "Vous pouvez maintenant essayer:" -ForegroundColor White
Write-Host "  npx expo run:android" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Read-Host "Appuyez sur Entrée pour continuer"