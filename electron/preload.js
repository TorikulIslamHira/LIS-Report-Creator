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
    },
    getSettings: () => {
      console.log('[Preload] getSettings called')
      return ipcRenderer.invoke('get-settings')
    },
    saveSettings: (settings) => {
      console.log('[Preload] saveSettings called with:', settings)
      return ipcRenderer.invoke('save-settings', settings)
    },
    getSetting: (key) => {
      console.log('[Preload] getSetting called with:', key)
      return ipcRenderer.invoke('get-setting', key)
    },
    // Doctor management
    addDoctor: (doctor) => ipcRenderer.invoke('add-doctor', doctor),
    getDoctors: () => ipcRenderer.invoke('get-doctors'),
    deleteDoctor: (doctorId) => ipcRenderer.invoke('delete-doctor', doctorId),
    // Tester management
    addTester: (tester) => ipcRenderer.invoke('add-tester', tester),
    getTesters: () => ipcRenderer.invoke('get-testers'),
    deleteTester: (testerId) => ipcRenderer.invoke('delete-tester', testerId),
    // Report history
    saveReport: (reportData) => {
      console.log('[Preload] saveReport called')
      return ipcRenderer.invoke('save-report', reportData)
    },
    getReportHistory: () => {
      console.log('[Preload] getReportHistory called')
      return ipcRenderer.invoke('get-report-history')
    },
    deleteReport: (reportId) => {
      console.log('[Preload] deleteReport called with:', reportId)
      return ipcRenderer.invoke('delete-report', reportId)
    },
    clearHistory: () => {
      console.log('[Preload] clearHistory called')
      return ipcRenderer.invoke('clear-history')
    },
    // Folder selection
    selectFolder: () => {
      console.log('[Preload] selectFolder called')
      return ipcRenderer.invoke('select-folder')
    },
    // Pending reports (watch folder)
    getPendingReports: () => {
      console.log('[Preload] getPendingReports called')
      return ipcRenderer.invoke('get-pending-reports')
    },
    deletePendingReport: (reportId) => {
      console.log('[Preload] deletePendingReport called with:', reportId)
      return ipcRenderer.invoke('delete-pending-report', reportId)
    },
    // Listen for new pending reports
    onNewPendingReport: (callback) => {
      ipcRenderer.on('new-pending-report', (event, report) => callback(report))
    }
  })
  console.log('[Preload] electronAPI successfully exposed')
} catch (error) {
  console.error('[Preload] Error exposing API:', error)
}

window.addEventListener('DOMContentLoaded', () => {
  console.log('[Preload] DOM loaded, electronAPI available:', !!window.electronAPI)
})
