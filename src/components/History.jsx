import { useState, useEffect } from 'react'
import { Clock, Trash2, Eye, Search, Calendar, User, FileText } from 'lucide-react'

export default function History({ onLoadReport }) {
  const [history, setHistory] = useState([])
  const [doctors, setDoctors] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDoctor, setFilterDoctor] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadHistory()
    loadDoctors()
  }, [])

  const loadHistory = async () => {
    setIsLoading(true)
    try {
      const reports = await window.electronAPI.getReportHistory()
      setHistory(reports)
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadDoctors = async () => {
    try {
      const doctorList = await window.electronAPI.getDoctors()
      setDoctors(doctorList)
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const handleDelete = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report from history?')) return
    
    try {
      await window.electronAPI.deleteReport(reportId)
      setHistory(prev => prev.filter(r => r.id !== reportId))
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report')
    }
  }

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear all history? This cannot be undone.')) return
    
    try {
      await window.electronAPI.clearHistory()
      setHistory([])
    } catch (error) {
      console.error('Error clearing history:', error)
      alert('Failed to clear history')
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

  const filteredHistory = history.filter(report => {
    const matchesSearch = 
      report.petName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.petOwnerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.uhid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reportId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDoctor = !filterDoctor || report.doctorName === filterDoctor
    
    return matchesSearch && matchesDoctor
  })

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Report History</h1>
            <p className="text-slate-600">View and manage all processed laboratory reports</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 size={18} />
              Clear All
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by patient name, UHID, Report ID, or date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Doctors</option>
            {doctors.map(doctor => (
              <option key={doctor.id} value={doctor.name}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Reports</p>
                <p className="text-2xl font-bold text-slate-800">{history.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Calendar className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">This Month</p>
                <p className="text-2xl font-bold text-slate-800">
                  {history.filter(r => {
                    const date = new Date(r.timestamp)
                    const now = new Date()
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Clock className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-600">Latest Report</p>
                <p className="text-sm font-medium text-slate-800">
                  {history.length > 0 ? formatDate(history[0].timestamp).split(',')[0] : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Report List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
            <Clock className="mx-auto text-slate-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              {searchTerm ? 'No matching reports found' : 'No reports yet'}
            </h3>
            <p className="text-slate-600">
              {searchTerm 
                ? 'Try adjusting your search criteria' 
                : 'Process your first lab report to see it here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((report) => (
              <div
                key={report.id}
                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="text-blue-600" size={20} />
                      <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                          {report.petName || 'Unknown Pet'}
                        </h3>
                        {report.petOwnerName && (
                          <p className="text-sm text-slate-600">Owner: {report.petOwnerName}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* UHID and Report ID */}
                    {(report.uhid || report.reportId) && (
                      <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div>
                          <p className="text-xs font-medium text-blue-700">UHID</p>
                          <p className="text-sm font-semibold text-blue-900">{report.uhid || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-blue-700">Report ID</p>
                          <p className="text-sm font-semibold text-blue-900">{report.reportId || 'N/A'}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-600 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>Report Date: {report.reportDate || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} />
                        <span>Processed: {formatDate(report.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText size={16} />
                        <span>{report.tests?.length || 0} tests</span>
                      </div>
                    </div>

                    {report.tests && report.tests.length > 0 && (
                      <div className="bg-slate-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-slate-600 mb-2">Tests:</p>
                        <div className="flex flex-wrap gap-2">
                          {report.tests.slice(0, 5).map((test, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white text-xs text-slate-700 rounded border border-slate-200"
                            >
                              {test.testName}
                            </span>
                          ))}
                          {report.tests.length > 5 && (
                            <span className="px-2 py-1 text-xs text-slate-500">
                              +{report.tests.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={() => onLoadReport(report)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Eye size={16} />
                      Load Report
                    </button>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
