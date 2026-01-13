# Resources Folder

This folder contains bundled resources for production builds.

## Required Files (Add before building):

1. **ollama.exe** - Ollama inference engine
   - Download from: https://ollama.com/download/windows
   - Place: `resources/ollama/ollama.exe`

2. **AI Model (.gguf)** - Language model for report extraction
   - Example: llama3.2 model
   - Place: `resources/models/llama3.2.gguf`
   - Or download via: `ollama pull llama3.2` then copy from Ollama's model directory

## Folder Structure:
```
resources/
├── ollama/
│   └── ollama.exe
└── models/
    └── llama3.2.gguf (or your preferred model)
```

## Notes:
- These files are copied to the installation directory during build
- Total size: ~2-4 GB depending on model
- Installer will be large but completely offline-capable
