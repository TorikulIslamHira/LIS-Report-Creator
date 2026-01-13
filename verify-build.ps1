# Pre-Build Verification Script
# Run this before `npm run build` to check all requirements

Write-Host "`n==================================" -ForegroundColor Cyan
Write-Host "  Pre-Build Verification Check" -ForegroundColor Cyan
Write-Host "==================================`n" -ForegroundColor Cyan

$allGood = $true

# Check 1: Ollama executable
Write-Host "[1/4] Checking Ollama executable..." -NoNewline
$ollamaPath = ".\resources\ollama\ollama.exe"
if (Test-Path $ollamaPath) {
    $ollamaSize = [math]::Round((Get-Item $ollamaPath).Length / 1MB, 2)
    Write-Host " ✅ FOUND ($ollamaSize MB)" -ForegroundColor Green
} else {
    Write-Host " ❌ MISSING" -ForegroundColor Red
    Write-Host "   → Download from: https://ollama.com/download/windows" -ForegroundColor Yellow
    Write-Host "   → Place at: $ollamaPath" -ForegroundColor Yellow
    $allGood = $false
}

# Check 2: AI Model
Write-Host "[2/4] Checking AI model (.gguf)..." -NoNewline
$modelFiles = Get-ChildItem -Path ".\resources\models" -Filter "*.gguf" -ErrorAction SilentlyContinue
if ($modelFiles) {
    $modelSize = [math]::Round($modelFiles[0].Length / 1GB, 2)
    Write-Host " ✅ FOUND: $($modelFiles[0].Name) ($modelSize GB)" -ForegroundColor Green
} else {
    Write-Host " ❌ MISSING" -ForegroundColor Red
    Write-Host "   → Run: ollama pull llama3.2" -ForegroundColor Yellow
    Write-Host "   → Or download from: https://huggingface.co/" -ForegroundColor Yellow
    Write-Host "   → Place .gguf file in: .\resources\models\" -ForegroundColor Yellow
    $allGood = $false
}

# Check 3: Icon file
Write-Host "[3/4] Checking application icon..." -NoNewline
$iconPath = ".\build\icon.ico"
if (Test-Path $iconPath) {
    Write-Host " ✅ FOUND" -ForegroundColor Green
} else {
    Write-Host " ⚠️  MISSING (optional but recommended)" -ForegroundColor Yellow
    Write-Host "   → Create 256x256 icon and save to: $iconPath" -ForegroundColor Yellow
    Write-Host "   → Icon tools: https://www.icoconverter.com/" -ForegroundColor Yellow
}

# Check 4: Node modules
Write-Host "[4/4] Checking node_modules..." -NoNewline
if (Test-Path ".\node_modules") {
    Write-Host " ✅ INSTALLED" -ForegroundColor Green
} else {
    Write-Host " ❌ MISSING" -ForegroundColor Red
    Write-Host "   → Run: npm install" -ForegroundColor Yellow
    $allGood = $false
}

# Summary
Write-Host "`n==================================`n" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✅ All required files present!" -ForegroundColor Green
    Write-Host "`nReady to build! Run:" -ForegroundColor Green
    Write-Host "  npm run build`n" -ForegroundColor White -BackgroundColor DarkGreen
} else {
    Write-Host "❌ Missing required files!" -ForegroundColor Red
    Write-Host "`nPlease complete the checklist above before building.`n" -ForegroundColor Yellow
    Write-Host "See BUILD_GUIDE.md for detailed instructions.`n" -ForegroundColor Cyan
}

# Display folder structure
Write-Host "Current structure:" -ForegroundColor Cyan
Write-Host "  resources/ollama/    : $(if (Test-Path '.\resources\ollama\ollama.exe') {'✅'} else {'❌'})" -ForegroundColor $(if (Test-Path '.\resources\ollama\ollama.exe') {'Green'} else {'Red'})
Write-Host "  resources/models/    : $(if (Get-ChildItem -Path '.\resources\models' -Filter '*.gguf' -ErrorAction SilentlyContinue) {'✅'} else {'❌'})" -ForegroundColor $(if (Get-ChildItem -Path '.\resources\models' -Filter '*.gguf' -ErrorAction SilentlyContinue) {'Green'} else {'Red'})
Write-Host "  build/icon.ico       : $(if (Test-Path '.\build\icon.ico') {'✅'} else {'⚠️ '})" -ForegroundColor $(if (Test-Path '.\build\icon.ico') {'Green'} else {'Yellow'})
Write-Host "  node_modules/        : $(if (Test-Path '.\node_modules') {'✅'} else {'❌'})`n" -ForegroundColor $(if (Test-Path '.\node_modules') {'Green'} else {'Red'})
