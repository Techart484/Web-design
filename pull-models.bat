@echo off
echo.
echo ============================================================
echo  AURA AI Model Setup - Run this in a normal terminal window
echo ============================================================
echo.
echo Starting Ollama server...
start "" "C:\Users\Irank\AppData\Local\Programs\Ollama\ollama.exe"
echo Waiting 10 seconds for Ollama to initialize...
timeout /t 10 /nobreak > nul

echo.
echo Pulling qwen2.5-coder:7b (~4.7 GB) - Stages 02, 04, 05
echo This will take 5-15 minutes...
"C:\Users\Irank\AppData\Local\Programs\Ollama\ollama.exe" pull qwen2.5-coder:7b
echo.

echo Pulling deepseek-coder-v2:16b (~9 GB) - Stage 06
echo This will take 10-30 minutes...
"C:\Users\Irank\AppData\Local\Programs\Ollama\ollama.exe" pull deepseek-coder-v2:16b
echo.

echo ============================================================
echo Available models:
"C:\Users\Irank\AppData\Local\Programs\Ollama\ollama.exe" list
echo.
echo DONE. Open index.html - the AI Pipeline tab will show ONLINE
echo ============================================================
pause
