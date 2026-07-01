# Autonomous Web Designer Engine — Ollama Setup
# Runs on Windows PowerShell

Write-Host "[*] Initiating Local AI Environment Setup..." -ForegroundColor Cyan

if (Get-Command "ollama" -ErrorAction SilentlyContinue) {
    Write-Host "[✓] Ollama is already installed." -ForegroundColor Green
} else {
    Write-Host "[!] Ollama not found. Downloading installer..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri "https://ollama.com/download/OllamaSetup.exe" -OutFile "OllamaSetup.exe"
    Write-Host "[*] Please run OllamaSetup.exe manually to complete installation." -ForegroundColor Cyan
}

Write-Host "[*] Pulling critical models..." -ForegroundColor Cyan
ollama pull qwen2.5-coder:7b
if ($args.Contains("-SmallModels") -eq $false) {
    ollama pull deepseek-coder-v2:16b
}

Write-Host "[✓] Setup Complete." -ForegroundColor Green
