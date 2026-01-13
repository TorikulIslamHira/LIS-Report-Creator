import { useState, useEffect } from 'react'
import { FileText, Eye, Trash2, Search, Clock, AlertCircle, FolderOpen } from 'lucide-react'

export default function PreUploadedReports({ onLoadReport }) {
  const [pendingReports, setPendingReports] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [watchFolderPath, setWatchFolderPath] = useState('')
  const [isSelectingFolder, setIsSelectingFolder] = useState(false)

  useEffect(() => {
    loadWatchFolder()
    loadPendingReports()
  }, [])

  const loadPendingReports = async () => {
    setIsLoading(true)
    try {
      const reports = await window.electronAPI.getPendingReports()
      setPendingReports(reports || [])
    } catch (error) {
      console.error('Error loading pending reports:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadWatchFolder = async () => {
    try {
      const watchPath = await window.electronAPI.getSetting('watchFolderPath')
      setWatchFolderPath(watchPath || '')
    } catch (error) {
      console.error('Error loading watch folder:', error)
    }
  }

  const handleSelectWatchFolder = async () => {
    setIsSelectingFolder(true)
    try {
      const result = await window.electronAPI.selectWatchFolder()
      
      if (result && !result.canceled && result.filePath) {
        console.log('[PreUploadedReports] Folder selected:', result.filePath)
        setWatchFolderPath(result.filePath)
        
        setTimeout(() => {
          loadPendingReports()
        }, 1000)
      }
    } catch (error) {
      console.error('Error selecting watch folder:', error)
      alert('Error: ' + error.message)
    } finally {
      setIsSelectingFolder(false)
    }
  }

  const handleViewReport = (report) => {
    // Load the report into the main editor for review
    onLoadReport(report)
  }

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this pending report?')) return
    
    try {
      await window.electronAPI.deletePendingReport(reportId)
      setPendingReports(prev => prev.filter(r => r.id !== reportId))
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report')
    }
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const filteredReports = pendingReports.filter(report =>
    report.uhid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.sourcePath?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Pre-uploaded Reports</h1>
          <p className="text-slate-600">Auto-detected reports from watch folder awaiting review</p>
        </div>

        {/* Watch Folder Selection Card */}
        <div className="bg-white rounded-lg shadow-md border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <FolderOpen className="text-blue-600" size={24} />
                <div>
                  <p className="text-sm font-medium text-slate-600">Watch Folder</p>
                  <p className="text-lg font-semibold text-slate-800 truncate" title={watchFolderPath}>
                    {watchFolderPath ? watchFolderPath.split('\\').pop() || watchFolderPath : 'No folder selected'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500 ml-9">
                PDFs in this folder will be auto-detected and processed
              </p>
            </div>
            <button
              onClick={handleSelectWatchFolder}
              disabled={isSelectingFolder}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <FolderOpen size={18} />
              {isSelectingFolder ? 'Selecting...' : 'Change Folder'}
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 mb-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm mb-1">Pending Review</p>
              <p className="text-4xl font-bold">{filteredReports.length}</p>
            </div>
            <AlertCircle size={48} className="text-amber-100" />
          </div>
          <p className="text-sm text-amber-50 mt-3">
            Reports detected automatically from the watch folder
          </p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by UHID, Pet Name, or file path..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Clock className="mx-auto text-slate-300 mb-4 animate-spin" size={64} />
            <p className="text-slate-600 mt-4">Loading pending reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <FileText className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchTerm ? 'No matching reports found' : 'No pending reports'}
            </h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Add PDF files to the watch folder to see them here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <FileText className="text-amber-600" size={24} />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          UHID: {report.uhid}
                        </h3>
                        {report.petName && (
                          <p className="text-sm text-slate-600">Pet: {report.petName}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Detected: {formatDate(report.detectedAt)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span className="truncate">File: {report.sourcePath?.split('\\').pop()}</span>
                      </div>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded px-3 py-2 inline-flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <span className="text-sm font-medium text-amber-900">Pending Review</span>
                    </div>

                    {report.tests && report.tests.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-slate-500">
                          {report.tests.length} test(s) extracted automatically
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewReport(report)}
                      className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2"
                      title="Review & Edit"
                    >
                      <Eye size={18} />
                      Review
                    </button>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Watch Folder Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 mt-0.5" size={20} />
            <div className="text-sm">
              <p className="font-semibold text-blue-900 mb-1">About Watch Folder</p>
              <p className="text-blue-700">
                Reports appear here automatically when PDF files are added to the configured watch folder. 
                The system extracts UHID from the filename and processes the report using AI extraction. 
                Configure the watch folder in Settings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
