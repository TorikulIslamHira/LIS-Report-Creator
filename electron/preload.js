const { contextBridge, ipcRenderer } = require('electron')

console.log('[Preload] Script is executing')

try {
  contextBridge.exposeInMainWorld('electronAPI', {
    parsePDF: (filePath) => {
      console.log('[Preload] parsePDF called with:', filePath)
      return ipcRenderer.invoke('parse-pdf', filePath)
    },
    openFileDialog: () => {
      console.log('[Preload] openFileDialog called')
      return ipcRenderer.invoke('open-file-dialog')
    }
  })
  console.log('[Preload] electronAPI successfully exposed')
} catch (error) {
  console.error('[Preload] Error exposing API:', error)
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Preload] DOM loaded, electronAPI available:', !!window.electronAPI)
})
