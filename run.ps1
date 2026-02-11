# Script to run the Terraforming Mars Scorekeeper API

# Get the root directory where this script is located
$rootPath = $PSScriptRoot
$venvPath = Join-Path $rootPath ".venv"
$backendPath = Join-Path $rootPath "backend"

# Activate virtual environment
$activateScript = Join-Path $venvPath "Scripts\Activate.ps1"

if (-Not (Test-Path $activateScript)) {
    Write-Host "Error: Virtual environment not found at $venvPath" -ForegroundColor Red
    Write-Host "Please run: python -m venv .venv" -ForegroundColor Yellow
    exit 1
}

Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& $activateScript

Write-Host "Starting Terraforming Mars Scorekeeper API..." -ForegroundColor Green
Write-Host "Navigate to http://localhost:8000/docs for API documentation" -ForegroundColor Cyan
Write-Host ""

Set-Location $backendPath
uvicorn main:app --reload --host 0.0.0.0 --port 8000
