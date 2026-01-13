# 🚀 Pre-Build Checklist

Quick reference before running `npm run build`

## Required Files

### 1. Ollama Executable
- [ ] Downloaded from: https://ollama.com/download/windows
- [ ] Placed at: `resources/ollama/ollama.exe`
- [ ] Size: ~50-100 MB
- [ ] Version: Latest stable

### 2. AI Model
- [ ] Model: llama3.2 (or your preferred model)
- [ ] Format: `.gguf` file
- [ ] Placed at: `resources/models/llama3.2.gguf`
- [ ] Size: ~2-4 GB (depending on model)

**How to get model:**
```powershell
# Option 1: Pull with Ollama
ollama pull llama3.2
# Then copy from: C:\Users\<You>\.ollama\models\blobs\

# Option 2: Download directly
# Visit: https://huggingface.co/
# Search: "llama3.2 GGUF"
```

### 3. Application Icon
- [ ] Created/downloaded icon file
- [ ] Format: `.ico`
- [ ] Resolution: 256x256 pixels minimum
- [ ] Placed at: `build/icon.ico`

**Icon tools:**
- https://www.icoconverter.com/
- https://convertico.com/
- GIMP (free image editor)

### 4. License File
- [x] Already created: `LICENSE` ✅

## Folder Structure Verification

```
LIS-Report-Creator/
├── resources/
│   ├── ollama/
│   │   └── ollama.exe          [ ] Check
│   └── models/
│       └── llama3.2.gguf       [ ] Check (~2-4GB)
├── build/
│   ├── icon.ico                [ ] Check
│   └── README.md               [x] Exists
├── LICENSE                     [x] Exists
└── package.json                [x] Exists
```

## Quick Verification Commands

```powershell
# Check if ollama.exe exists
Test-Path ".\resources\ollama\ollama.exe"

# Check if model exists
Test-Path ".\resources\models\*.gguf"

# Check if icon exists
Test-Path ".\build\icon.ico"

# Check file sizes
Get-ChildItem -Path ".\resources" -Recurse -File | Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB, 2)}}
```

## Expected Total Size

- **Ollama.exe:** ~50-100 MB
- **Model (.gguf):** ~2-4 GB
- **App code:** ~50-100 MB
- **Total Installer:** ~2-5 GB

## Build Command

Once all checkboxes are complete:

```powershell
npm run build
```

## Post-Build Verification

- [ ] Installer created at: `release/LIS Report Creator-1.0.0-Setup.exe`
- [ ] Unpacked version exists at: `release/win-unpacked/`
- [ ] Installer size is 2-5 GB
- [ ] Test run the unpacked version
- [ ] Test install from installer

## Common Issues

### ❌ Build fails with "Cannot find resources"
→ Check that ollama.exe and model are in correct folders

### ❌ Icon not found
→ Create placeholder: 256x256 PNG → convert to .ico → place in `build/`

### ❌ Installer too large
→ Normal for bundled AI! Expected 2-5 GB

### ❌ Ollama doesn't start in production
→ Check console logs, verify ollama.exe is executable

---

**Ready to build?** Run: `npm run build` 🚀
