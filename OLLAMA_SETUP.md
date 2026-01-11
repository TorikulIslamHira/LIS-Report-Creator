# Ollama Setup Guide for LabReportOptimizer

## Quick Setup (Windows)

### 1. Install Ollama
```bash
# Download and install from: https://ollama.ai/download
# Or use winget:
winget install Ollama.Ollama
```

### 2. Pull a Model
Open PowerShell and run:
```bash
# Recommended: Llama 3.2 (3B - Fast & Lightweight)
ollama pull llama3.2

# Alternative options:
# ollama pull llama3.1        # Larger, more accurate
# ollama pull mistral         # Fast alternative
# ollama pull qwen2.5         # Good for technical text
```

### 3. Verify Ollama is Running
```bash
# Check if Ollama is running
ollama list

# You should see llama3.2 in the list
```

### 4. Test the Setup
```bash
# Test if the API is working
curl http://localhost:11434/v1/chat/completions -d "{\"model\":\"llama3.2\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}"
```

### 5. Run the App
```bash
npm run electron:dev
```

## Configuration Already Done ✅

The app is already configured to use Ollama:
- API Base URL: `http://localhost:11434/v1`
- Model: `llama3.2`
- No API key required
- Completely offline and private

## Troubleshooting

### Ollama Not Running?
```bash
# Start Ollama service
ollama serve
```

### Port 11434 in use?
Check if Ollama is running in the background. It should auto-start after installation.

### Model Not Found?
Make sure you've pulled the model:
```bash
ollama pull llama3.2
```

## Changing Models

To use a different model:
1. Pull the model: `ollama pull <model-name>`
2. Edit `src/services/aiExtractor.js`
3. Change `const MODEL = 'llama3.2'` to your model name
4. Restart the app

## Benefits of Ollama

✅ **100% Private** - All data stays on your computer
✅ **No API Costs** - Completely free
✅ **Works Offline** - No internet required
✅ **Fast** - Local processing
✅ **HIPAA Compliant** - Perfect for medical data
