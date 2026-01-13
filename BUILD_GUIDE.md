# Production Build Guide

Complete guide to building a standalone Windows installer with bundled AI capabilities.

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **Ollama executable** and **AI model**
3. **Application icon** (.ico file)

---

## 🚀 Step-by-Step Build Process

### Step 1: Prepare Ollama & Model

#### Option A: Download Ollama Executable
```powershell
# Download Ollama for Windows
# Visit: https://ollama.com/download/windows
# Or use direct download link

# Place ollama.exe in:
# resources/ollama/ollama.exe
```

#### Option B: Copy from Existing Installation
```powershell
# If Ollama is already installed, copy the executable
Copy-Item "C:\Users\$env:USERNAME\AppData\Local\Programs\Ollama\ollama.exe" -Destination ".\resources\ollama\"
```

### Step 2: Get the AI Model

```powershell
# Pull the model using Ollama (if installed)
ollama pull llama3.2

# Find model location:
# C:\Users\<YourUsername>\.ollama\models\blobs\

# Copy the .gguf model file to:
# resources/models/llama3.2.gguf
```

**OR** Download model directly:
- Visit: https://huggingface.co/
- Search for "llama3.2 GGUF"
- Download and place in `resources/models/`

### Step 3: Verify Folder Structure

```
LIS-Report-Creator/
├── resources/
│   ├── ollama/
│   │   └── ollama.exe          ✅ Required
│   └── models/
│       └── llama3.2.gguf       ✅ Required (~2-4GB)
├── build/
│   └── icon.ico                ✅ Required
└── LICENSE                     ✅ Created
```

### Step 4: Add Application Icon

Create or download a 256x256 icon and save as:
```
build/icon.ico
```

**Icon creation tools:**
- https://www.icoconverter.com/
- https://convertico.com/

### Step 5: Install Dependencies

```powershell
npm install
```

### Step 6: Build the Application

```powershell
# Clean previous builds (optional)
Remove-Item -Recurse -Force release -ErrorAction SilentlyContinue

# Build the installer
npm run build
```

**Build process includes:**
1. Vite builds the React frontend → `dist/`
2. Electron main files copied → `dist-electron/`
3. Resources bundled → `release/win-unpacked/resources/`
4. NSIS installer created → `release/LIS Report Creator-1.0.0-Setup.exe`

---

## 📦 Build Output

After successful build:

```
release/
├── win-unpacked/               # Unpacked application (for testing)
│   ├── resources/
│   │   ├── ollama/
│   │   │   └── ollama.exe
│   │   └── models/
│   │       └── llama3.2.gguf
│   └── LIS Report Creator.exe
└── LIS Report Creator-1.0.0-Setup.exe  # 🎯 INSTALLER (Distribute this)
```

**Installer Size:** ~2-5 GB (depends on model size)

---

## ✅ Testing the Build

### Test Unpacked Version
```powershell
cd release/win-unpacked
./LIS Report Creator.exe
```

### Test Installer
```powershell
# Run the installer
./release/LIS Report Creator-1.0.0-Setup.exe

# Default install location:
# C:\Users\<Username>\AppData\Local\Programs\LIS Report Creator\
```

---

## 🔧 Troubleshooting

### Build Fails

**Error: "Cannot find resources/ollama/ollama.exe"**
```powershell
# Verify file exists
Test-Path ".\resources\ollama\ollama.exe"
# Should return: True
```

**Error: "Icon not found"**
```powershell
# Verify icon exists
Test-Path ".\build\icon.ico"
# Create a placeholder icon if needed
```

### Ollama Not Starting in Production

**Check console logs:**
```javascript
// Electron console will show:
// [Ollama] Starting server...
// [Ollama] Server started with PID: XXXX
```

**Manual test:**
```powershell
# Navigate to installed app
cd "C:\Users\$env:USERNAME\AppData\Local\Programs\LIS Report Creator\resources\ollama"

# Try running Ollama manually
.\ollama.exe serve
```

### Large Installer Size

**Normal sizes:**
- Without model: ~200-500 MB
- With llama3.2 (3B): ~2 GB
- With llama3.1 (8B): ~4-5 GB

**Reduce size:**
- Use smaller models (e.g., `phi3:mini`)
- Enable compression in package.json (already set to "maximum")

---

## 🎯 Distribution

### Distribute the Installer
```powershell
# Copy installer to distribution folder
Copy-Item ".\release\LIS Report Creator-1.0.0-Setup.exe" -Destination ".\dist-final\"

# Rename for clarity (optional)
Rename-Item ".\dist-final\LIS Report Creator-1.0.0-Setup.exe" -NewName "LIS-Report-Creator-Setup.exe"
```

### Create Portable Version
The unpacked version can be zipped for portable use:
```powershell
Compress-Archive -Path ".\release\win-unpacked\*" -DestinationPath ".\LIS-Report-Creator-Portable.zip"
```

---

## 📝 Build Configuration Details

### electron-builder Configuration (package.json)

```json
{
  "build": {
    "extraResources": [
      {
        "from": "resources/ollama",
        "to": "ollama"
      },
      {
        "from": "resources/models",
        "to": "models"
      }
    ]
  }
}
```

**This configuration:**
- Copies `resources/ollama/*` → `<install-dir>/resources/ollama/`
- Copies `resources/models/*` → `<install-dir>/resources/models/`
- Makes files available via `process.resourcesPath` in production

### Resource Path Resolution (electron.js)

```javascript
function getResourcePath(relativePath) {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, relativePath)
  } else {
    return path.join(__dirname, '..', 'resources', relativePath)
  }
}
```

---

## 🔄 Updating the Application

### Version Updates
1. Update version in `package.json`
2. Rebuild: `npm run build`
3. New installer will have updated version number

### Database Persistence
User data is stored in:
```
C:\Users\<Username>\AppData\Roaming\labreportoptimizer\
```

**This data persists across:**
- App updates
- Reinstallations (unless explicitly deleted)

---

## 🛡️ Code Signing (Optional)

For production distribution, sign the installer:

```powershell
# Install signtool (Windows SDK)
# Get code signing certificate

# Sign the installer
signtool sign /f "certificate.pfx" /p "password" /tr "http://timestamp.digicert.com" /td SHA256 "LIS Report Creator-1.0.0-Setup.exe"
```

---

## 📊 Build Checklist

- [ ] Ollama.exe placed in `resources/ollama/`
- [ ] Model (.gguf) placed in `resources/models/`
- [ ] Icon (.ico) placed in `build/`
- [ ] LICENSE file exists
- [ ] Dependencies installed (`npm install`)
- [ ] Build completed successfully (`npm run build`)
- [ ] Installer tested locally
- [ ] AI features working in production build
- [ ] Database persists after reinstall

---

## 🎉 Success!

Your installer is ready for distribution at:
```
release/LIS Report Creator-1.0.0-Setup.exe
```

**File Size:** 2-5 GB (fully offline, includes AI)

Users can install and run completely offline with full AI capabilities! 🚀
