const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const pdfParse = require('pdf-parse')

// Disable GPU acceleration for better compatibility
app.disableHardwareAcceleration()

let mainWindow

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

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
