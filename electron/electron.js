const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')
const chokidar = require('chokidar')
const { spawn } = require('child_process')

// Disable GPU acceleration for better compatibility
app.disableHardwareAcceleration()

let mainWindow
let store
let folderWatcher = null
let ollamaProcess = null

// ============================================
// RESOURCE PATH MANAGEMENT
// ============================================

/**
 * Get the correct resource path based on environment
 * In development: uses project resources/ folder
 * In production: uses installed app resources/ folder
 */
function getResourcePath(relativePath) {
  if (app.isPackaged) {
    // Production: resources are in process.resourcesPath
    return path.join(process.resourcesPath, relativePath)
  } else {
    // Development: resources are in project root
    return path.join(__dirname, '..', 'resources', relativePath)
  }
}

/**
 * Get paths to bundled Ollama executable and models
 */
function getOllamaPaths() {
  const ollamaExePath = getResourcePath('ollama/ollama.exe')
  const modelsPath = getResourcePath('models')
  
  return {
    ollamaExe: ollamaExePath,
    modelsDir: modelsPath,
    exists: fs.existsSync(ollamaExePath)
  }
}

// ============================================
// OLLAMA PROCESS MANAGEMENT
// ============================================

/**
 * Start the bundled Ollama server
 */
function startOllamaServer() {
  const { ollamaExe, modelsDir, exists } = getOllamaPaths()
  
  if (!exists) {
    console.warn('[Ollama] Executable not found at:', ollamaExe)
    console.warn('[Ollama] AI features will not be available')
    return false
  }
  
  console.log('[Ollama] Starting server...')
  console.log('[Ollama] Executable:', ollamaExe)
  console.log('[Ollama] Models directory:', modelsDir)
  
  try {
    // Set environment variables for Ollama
    const env = {
      ...process.env,
      OLLAMA_MODELS: modelsDir,
      OLLAMA_HOST: '127.0.0.1:11434'
    }
    
    // Spawn Ollama process
    ollamaProcess = spawn(ollamaExe, ['serve'], {
      env: env,
      detached: false,
      stdio: 'ignore' // Suppress output, use 'pipe' for debugging
    })
    
    ollamaProcess.on('error', (error) => {
      console.error('[Ollama] Failed to start:', error)
    })
    
    ollamaProcess.on('exit', (code, signal) => {
      console.log('[Ollama] Process exited with code:', code, 'signal:', signal)
      ollamaProcess = null
    })
    
    console.log('[Ollama] Server started with PID:', ollamaProcess.pid)
    return true
    
  } catch (error) {
    console.error('[Ollama] Error starting server:', error)
    return false
  }
}

/**
 * Stop the Ollama server
 */
function stopOllamaServer() {
  if (ollamaProcess && !ollamaProcess.killed) {
    console.log('[Ollama] Stopping server...')
    try {
      ollamaProcess.kill('SIGTERM')
      
      // Force kill after 5 seconds if still running
      setTimeout(() => {
        if (ollamaProcess && !ollamaProcess.killed) {
          console.log('[Ollama] Force killing process')
          ollamaProcess.kill('SIGKILL')
        }
      }, 5000)
      
    } catch (error) {
      console.error('[Ollama] Error stopping server:', error)
    }
  }
}

// ============================================
// STORE & DATABASE MANAGEMENT
// ============================================

// Initialize store with dynamic import
async function initStore() {
  const Store = (await import('electron-store')).default
  store = new Store({
    defaults: {
      hospitalName: 'Medical Laboratory',
      hospitalAddress: '',
      labPhone: '',
      labEmail: '',
      watchFolderPath: '',
      doctors: [],
      testers: [],
      reportHistory: [],
      pendingReports: []
    }
  })
}

function createWindow() {
  const preloadPath = path.join(__dirname, 'preload.cjs')
  console.log('Preload path:', preloadPath)
  console.log('Preload exists:', fs.existsSync(preloadPath))
  
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Wait for the window to be ready
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully')
  })

  // Load the app
  if (!app.isPackaged) {
    // Development mode
    mainWindow.loadURL('http://localhost:5173')
    // DevTools disabled - press F12 to open manually if needed
  } else {
    // Production mode
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handler for PDF parsing
ipcMain.handle('parse-pdf', async (event, filePath) => {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath)
    
    // Parse the PDF
    const data = await pdfParse(dataBuffer)
    
    // Return the raw text
    return {
      success: true,
      text: data.text,
      pages: data.numpages,
      info: data.info
    }
  } catch (error) {
    console.error('PDF parsing error:', error)
    return {
      success: false,
      error: error.message
    }
  }
})

// IPC Handler for opening file dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'PDF Files', extensions: ['pdf'] }
    ]
  })
  
  if (result.canceled) {
    return { canceled: true }
  } else {
    return { 
      canceled: false, 
      filePath: result.filePaths[0] 
    }
  }
})

// IPC Handlers for settings
ipcMain.handle('get-settings', async () => {
  return store.store
})

ipcMain.handle('save-settings', async (event, settings) => {
  const oldWatchPath = store.get('watchFolderPath')
  
  Object.keys(settings).forEach(key => {
    store.set(key, settings[key])
  })
  
  // Restart folder watcher if watch path changed
  const newWatchPath = settings.watchFolderPath
  if (oldWatchPath !== newWatchPath) {
    console.log('[Settings] Watch folder changed, restarting watcher')
    startFolderWatcher()
  }
  
  return { success: true }
})

ipcMain.handle('get-setting', async (event, key) => {
  return store.get(key)
})

// IPC Handler for selecting watch folder from Pre-uploaded Reports page
ipcMain.handle('select-watch-folder', async () => {
  console.log('[Watch Folder] Opening folder selection dialog')
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Watch Folder for PDF Reports'
  })
  
  if (result.canceled) {
    console.log('[Watch Folder] Selection canceled')
    return { canceled: true }
  }
  
  const selectedPath = result.filePaths[0]
  console.log('[Watch Folder] New path selected:', selectedPath)
  
  // Save to store
  store.set('watchFolderPath', selectedPath)
  
  // Restart watcher
  console.log('[Watch Folder] Restarting watcher')
  startFolderWatcher()
  
  // Scan for existing PDFs
  console.log('[Watch Folder] Scanning for existing PDFs')
  await scanFolderForPDFs(selectedPath)
  
  return { 
    canceled: false, 
    filePath: selectedPath 
  }
})

// IPC Handlers for doctors management
ipcMain.handle('add-doctor', async (event, doctor) => {
  const doctors = store.get('doctors', [])
  const newDoctor = {
    id: Date.now(),
    ...doctor
  }
  doctors.push(newDoctor)
  store.set('doctors', doctors)
  return { success: true, doctor: newDoctor }
})

ipcMain.handle('get-doctors', async () => {
  return store.get('doctors', [])
})

ipcMain.handle('delete-doctor', async (event, doctorId) => {
  const doctors = store.get('doctors', [])
  const filtered = doctors.filter(d => d.id !== doctorId)
  store.set('doctors', filtered)
  return { success: true }
})

// IPC Handlers for testers management
ipcMain.handle('add-tester', async (event, tester) => {
  const testers = store.get('testers', [])
  const newTester = {
    id: Date.now(),
    ...tester
  }
  testers.push(newTester)
  store.set('testers', testers)
  return { success: true, tester: newTester }
})

ipcMain.handle('get-testers', async () => {
  return store.get('testers', [])
})

ipcMain.handle('delete-tester', async (event, testerId) => {
  const testers = store.get('testers', [])
  const filtered = testers.filter(t => t.id !== testerId)
  store.set('testers', filtered)
  return { success: true }
})

// IPC Handlers for report history
ipcMain.handle('save-report', async (event, reportData) => {
  const history = store.get('reportHistory', [])
  const newReport = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...reportData
  }
  history.unshift(newReport) // Add to beginning
  
  // Keep only last 100 reports
  if (history.length > 100) {
    history.pop()
  }
  
  store.set('reportHistory', history)
  return { success: true, report: newReport }
})

ipcMain.handle('get-report-history', async () => {
  return store.get('reportHistory', [])
})

ipcMain.handle('delete-report', async (event, reportId) => {
  const history = store.get('reportHistory', [])
  const filtered = history.filter(r => r.id !== reportId)
  store.set('reportHistory', filtered)
  return { success: true }
})

ipcMain.handle('clear-history', async () => {
  store.set('reportHistory', [])
  return { success: true }
})

// IPC Handler for folder selection
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  
  if (result.canceled) {
    return { canceled: true }
  } else {
    return { 
      canceled: false, 
      filePath: result.filePaths[0] 
    }
  }
})

// IPC Handlers for pending reports (watch folder)
ipcMain.handle('get-pending-reports', async () => {
  return store.get('pendingReports', [])
})

ipcMain.handle('delete-pending-report', async (event, reportId) => {
  const pending = store.get('pendingReports', [])
  const filtered = pending.filter(r => r.id !== reportId)
  store.set('pendingReports', filtered)
  return { success: true }
})

// Extract UHID from filename (format: UHID_filename.pdf or UHID.pdf)
function extractUHIDFromFilename(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename))
  const parts = nameWithoutExt.split('_')
  return parts[0] // First part is assumed to be UHID
}

// Process PDF from watch folder
async function processWatchedPDF(filePath) {
  try {
    console.log('[Watch Folder] Processing:', filePath)
    
    // Extract UHID from filename
    const uhid = extractUHIDFromFilename(filePath)
    
    // Parse PDF
    const dataBuffer = fs.readFileSync(filePath)
    const data = await pdfParse(dataBuffer)
    
    // Auto-generate Report ID
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const reportId = `RPT-${dateStr}-${randomNum}`
    
    // Create pending report
    const pendingReport = {
      id: Date.now(),
      uhid: uhid,
      reportId: reportId,
      sourcePath: filePath,
      pdfText: data.text,
      status: 'PENDING_REVIEW',
      detectedAt: new Date().toISOString(),
      petName: '', // Will be filled by AI extraction or manual entry
      tests: [] // Will be filled by AI extraction or manual entry
    }
    
    // Save to pending reports
    const pending = store.get('pendingReports', [])
    pending.unshift(pendingReport)
    store.set('pendingReports', pending)
    
    console.log('[Watch Folder] Report saved as PENDING_REVIEW:', uhid)
    
    // Notify renderer process
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('new-pending-report', pendingReport)
    }
    
  } catch (error) {
    console.error('[Watch Folder] Error processing PDF:', error)
  }
}

// Scan folder for existing PDFs when folder is first selected
async function scanFolderForPDFs(folderPath) {
  try {
    console.log('[Watch Folder] Scanning folder:', folderPath)
    
    if (!fs.existsSync(folderPath)) {
      console.warn('[Watch Folder] Folder does not exist')
      return
    }
    
    const files = fs.readdirSync(folderPath)
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'))
    
    console.log('[Watch Folder] Found', pdfFiles.length, 'PDF files')
    
    for (const pdfFile of pdfFiles) {
      const filePath = path.join(folderPath, pdfFile)
      await processWatchedPDF(filePath)
    }
  } catch (error) {
    console.error('[Watch Folder] Error scanning folder:', error)
  }
}

// Start/restart folder watcher
function startFolderWatcher() {
  const watchPath = store.get('watchFolderPath')
  
  // Stop existing watcher if any
  if (folderWatcher) {
    folderWatcher.close()
    folderWatcher = null
  }
  
  if (!watchPath || !fs.existsSync(watchPath)) {
    console.log('[Watch Folder] No valid watch folder configured')
    return
  }
  
  console.log('[Watch Folder] Watching:', watchPath)
  
  folderWatcher = chokidar.watch(path.join(watchPath, '*.pdf'), {
    persistent: true,
    ignoreInitial: true, // Don't process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait 2s for file to finish writing
      pollInterval: 100
    }
  })
  
  folderWatcher
    .on('add', (filePath) => {
      console.log('[Watch Folder] New file detected:', filePath)
      processWatchedPDF(filePath)
    })
    .on('error', (error) => {
      console.error('[Watch Folder] Error:', error)
    })
}

app.whenReady().then(async () => {
  await initStore()
  createWindow()
  
  // Start Ollama server with the bundled resources
  console.log('[App] Starting Ollama server...')
  const ollamaStarted = startOllamaServer()
  
  if (ollamaStarted) {
    console.log('[App] Ollama server started successfully')
    // Wait 2 seconds for Ollama to initialize
    await new Promise(resolve => setTimeout(resolve, 2000))
  } else {
    console.warn('[App] Ollama server failed to start - AI features disabled')
  }
  
  // Start folder watcher after store is initialized
  startFolderWatcher()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  // Close folder watcher
  if (folderWatcher) {
    folderWatcher.close()
  }
  
  // Stop Ollama server
  console.log('[App] Shutting down Ollama server...')
  stopOllamaServer()
  
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle app termination gracefully
app.on('before-quit', () => {
  console.log('[App] Application closing...')
  stopOllamaServer()
})

// Ensure Ollama is stopped on any exit
process.on('exit', () => {
  stopOllamaServer()
})
