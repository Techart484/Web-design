const { spawn } = require('child_process');

async function checkModels() {
  console.log('[*] Checking Ollama environment...');
  const models = ['qwen2.5-coder:7b', 'deepseek-coder-v2:16b'];

  for (const model of models) {
    console.log(`[*] Verifying ${model}...`);
    await new Promise((resolve) => {
      const child = spawn('ollama', ['run', model, 'echo "Ready"']);
      child.on('close', (code) => {
        if (code === 0) console.log(`[✓] ${model} is ready.`);
        else console.warn(`[!] ${model} not found or failed. Please run: ollama pull ${model}`);
        resolve();
      });
    });
  }
}

checkModels();
