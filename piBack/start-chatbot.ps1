Write-Host "Démarrage du service chatbot..." -ForegroundColor Green
Write-Host "Vérification des dossiers nécessaires..." -ForegroundColor Yellow

# Obtenir le chemin du script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Vérifier si le dossier models existe
if (-not (Test-Path "$scriptPath\models")) {
    Write-Host "Création du dossier models..." -ForegroundColor Yellow
    New-Item -Path "$scriptPath\models" -ItemType Directory | Out-Null
}

# Vérifier si le fichier intents.json existe
if (-not (Test-Path "$scriptPath\scripts\intents.json")) {
    Write-Host "ERREUR: Le fichier intents.json n'existe pas!" -ForegroundColor Red
    Write-Host "Le service chatbot ne peut pas démarrer sans ce fichier." -ForegroundColor Red
    exit 1
}

# Définir le répertoire de travail
Set-Location $scriptPath

Write-Host "Lancement du service chatbot..." -ForegroundColor Green
python "$scriptPath\scripts\chatbot_service.py" --host=0.0.0.0 --port=5001
