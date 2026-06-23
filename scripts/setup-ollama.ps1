# ============================================================
# Autonomous Web Designer Engine — Ollama Setup Script
# Installs Ollama + pulls Qwen 2.5 Coder & DeepSeek Coder V2
# Run as: powershell -ExecutionPolicy Bypass -File scripts/setup-ollama.ps1
# ============================================================

param(
    [switch]$SmallModels,      # Use smaller models if disk space is limited
    [switch]$SkipInstall,      # Skip Ollama install (if already installed)
    [switch]$CheckOnly         # Only verify, don't install anything
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Autonomous Web Designer Engine — AI Model Setup            ║" -ForegroundColor Cyan
Write-Host "║   Installing: Ollama + Qwen 2.5 Coder + DeepSeek Coder       ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ── Model Selection ───────────────────────────────────────────────────────────
if ($SmallModels) {
    $QwenModel     = "qwen2.5-coder:3b"    # ~2.0 GB
    $DeepSeekModel = "deepseek-coder:6.7b" # ~3.8 GB
    Write-Host "[MODE] Small models selected (~6GB total disk space)" -ForegroundColor Yellow
} else {
    $QwenModel     = "qwen2.5-coder:7b"     # ~4.7 GB
    $DeepSeekModel = "deepseek-coder-v2:16b" # ~9.0 GB
    Write-Host "[MODE] Standard models selected (~14GB total disk space)" -ForegroundColor Green
    Write-Host "       Use -SmallModels flag for limited disk space" -ForegroundColor DarkGray
}

Write-Host ""

# ── Check Disk Space ──────────────────────────────────────────────────────────
$drive = Split-Path $env:USERPROFILE -Qualifier
$disk = Get-PSDrive -Name ($drive.TrimEnd(':'))
$freeGB = [math]::Round($disk.Free / 1GB, 1)
Write-Host "[*] Available disk space: ${freeGB}GB" -ForegroundColor Gray

$requiredGB = if ($SmallModels) { 7 } else { 16 }
if ($freeGB -lt $requiredGB) {
    Write-Host "[WARNING] Low disk space (${freeGB}GB < ${requiredGB}GB required)" -ForegroundColor Yellow
    Write-Host "          Consider using -SmallModels flag to reduce requirements" -ForegroundColor Yellow
    $response = Read-Host "Continue anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "[ABORT] Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

# ── Check/Install Ollama ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[1/4] Checking Ollama installation..." -ForegroundColor Cyan

$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue

if ($ollamaCmd) {
    $ollamaVersion = (& ollama --version 2>&1) | Select-Object -First 1
    Write-Host "  ✅ Ollama already installed: $ollamaVersion" -ForegroundColor Green
} elseif ($SkipInstall) {
    Write-Host "  ❌ Ollama not found and -SkipInstall is set. Aborting." -ForegroundColor Red
    exit 1
} elseif ($CheckOnly) {
    Write-Host "  ❌ Ollama not installed" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  [*] Ollama not found. Attempting installation via winget..." -ForegroundColor Yellow

    # Try winget first
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
        Write-Host "  [*] Installing via winget..." -ForegroundColor Gray
        try {
            & winget install --id Ollama.Ollama --source winget --accept-package-agreements --accept-source-agreements -e
            Write-Host "  ✅ Ollama installed via winget" -ForegroundColor Green
        } catch {
            Write-Host "  [!] winget install failed. Falling back to direct download..." -ForegroundColor Yellow
            $useDirectDownload = $true
        }
    } else {
        $useDirectDownload = $true
    }

    if ($useDirectDownload) {
        Write-Host "  [*] Downloading Ollama installer from ollama.com..." -ForegroundColor Gray
        $installerUrl = "https://ollama.com/download/OllamaSetup.exe"
        $installerPath = "$env:TEMP\OllamaSetup.exe"

        try {
            $ProgressPreference = 'SilentlyContinue'
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
            Write-Host "  [*] Running installer (this may take a moment)..." -ForegroundColor Gray
            Start-Process -FilePath $installerPath -ArgumentList "/S" -Wait
            Write-Host "  ✅ Ollama installed via direct download" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Automatic installation failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "  ► Manual install: Visit https://ollama.com/download and install OllamaSetup.exe" -ForegroundColor Yellow
            exit 1
        }
    }

    # Refresh PATH so ollama command is found
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

if ($CheckOnly) {
    Write-Host "  [CHECK] Ollama is available" -ForegroundColor Green
    & node scripts/install-models.js 2>&1
    exit 0
}

# ── Start Ollama Service ───────────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/4] Starting Ollama service..." -ForegroundColor Cyan

# Check if already running
$ollamaRunning = $false
try {
    $testReq = [System.Net.WebRequest]::Create("http://localhost:11434/api/tags")
    $testReq.Timeout = 2000
    $resp = $testReq.GetResponse()
    $resp.Close()
    $ollamaRunning = $true
    Write-Host "  ✅ Ollama service already running on localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "  [*] Starting Ollama daemon..." -ForegroundColor Gray
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 4

    # Verify startup
    $retries = 0
    while ($retries -lt 6) {
        try {
            $testReq = [System.Net.WebRequest]::Create("http://localhost:11434/api/tags")
            $testReq.Timeout = 2000
            $resp = $testReq.GetResponse()
            $resp.Close()
            Write-Host "  ✅ Ollama service started successfully" -ForegroundColor Green
            $ollamaRunning = $true
            break
        } catch {
            $retries++
            Write-Host "  [*] Waiting for Ollama to start ($retries/6)..." -ForegroundColor DarkGray
            Start-Sleep -Seconds 3
        }
    }

    if (-not $ollamaRunning) {
        Write-Host "  ❌ Ollama service failed to start. Try running 'ollama serve' manually." -ForegroundColor Red
        exit 1
    }
}

# ── Pull Models ───────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/4] Pulling AI models (this may take several minutes)..." -ForegroundColor Cyan
Write-Host "      Large model downloads will show progress in real-time." -ForegroundColor DarkGray
Write-Host ""

# Pull Qwen 2.5 Coder
Write-Host "  [*] Pulling $QwenModel..." -ForegroundColor Yellow
Write-Host "      (Used for: Stage 02 Competitor Matrix, Stage 04 Design, Stage 05 Critique)" -ForegroundColor DarkGray
try {
    & ollama pull $QwenModel
    Write-Host "  ✅ $QwenModel ready" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to pull ${QwenModel}: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     Retry manually: ollama pull $QwenModel" -ForegroundColor Yellow
}

Write-Host ""

# Pull DeepSeek Coder
Write-Host "  [*] Pulling $DeepSeekModel..." -ForegroundColor Yellow
Write-Host "      (Used for: Stage 06 B2B Pitch Generation)" -ForegroundColor DarkGray
try {
    & ollama pull $DeepSeekModel
    Write-Host "  ✅ $DeepSeekModel ready" -ForegroundColor Green
} catch {
    Write-Host "  ⚠  Failed to pull ${DeepSeekModel}: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "     This is non-critical — Qwen will handle Stage 06 as fallback" -ForegroundColor DarkGray
    Write-Host "     Retry manually: ollama pull $DeepSeekModel" -ForegroundColor DarkGray
}

# ── Final Verification ────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[4/4] Running final health check..." -ForegroundColor Cyan
Write-Host ""

try {
    & node scripts/install-models.js
} catch {
    Write-Host "  [!] Health check script not found. Verifying with ollama list instead..." -ForegroundColor Yellow
    & ollama list
}

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║   ✅  AI Engine Setup Complete!                               ║" -ForegroundColor Green
Write-Host "║                                                              ║" -ForegroundColor Green
Write-Host "║   Open index.html in your browser and click:                 ║" -ForegroundColor Green
Write-Host "║   ⚡ AI Pipeline → Run Full Pipeline                          ║" -ForegroundColor Green
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Models installed:"
Write-Host "  • $QwenModel  → Stages 02, 04, 05"
Write-Host "  • $DeepSeekModel  → Stage 06 (with Qwen fallback)"
Write-Host ""
Write-Host "Ollama API running at: http://localhost:11434"
Write-Host ""
