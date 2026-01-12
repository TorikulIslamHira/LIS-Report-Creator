import { useState } from 'react'
import { X, User, FileText } from 'lucide-react'

export default function UHIDModal({ isOpen, onConfirm, onCancel, fileName }) {
  const [uhid, setUhid] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    if (!uhid.trim()) {
      setError('UHID is required')
      return
    }
    
    // Generate unique report ID in format: RPT-YYYYMMDD-XXXX
    const now = new Date()
    const dateStr = now.getFullYear() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0')
    const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0')
    const reportId = `RPT-${dateStr}-${randomNum}`
    
    onConfirm(uhid.trim(), reportId)
    setUhid('')
    setError('')
  }

  const handleCancel = () => {
    setUhid('')
    setError('')
    onCancel()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <User className="text-blue-600" size={28} />
            <div>
              <h2 className="text-xl font-bold text-slate-800">Enter Patient UHID</h2>
              <p className="text-sm text-slate-600">Unique Health Identification</p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <FileText className="text-blue-600 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-blue-900">File: {fileName}</p>
              <p className="text-xs text-blue-700 mt-1">A unique Report ID will be generated automatically</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Patient UHID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={uhid}
              onChange={(e) => {
                setUhid(e.target.value)
                setError('')
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="Enter UHID (e.g., UHID123456)"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-slate-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-600 mt-1">{error}</p>
            )}
          </div>

          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Note:</strong> The system will automatically generate a unique Report ID for this session.
              Both UHID and Report ID will be saved for future reference.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200">
          <button
            onClick={handleCancel}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}
