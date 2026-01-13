import { useState, useRef, useEffect } from 'react'
import { parseLabReport, isWithinRange, generateTestId } from './utils/parser'
import { extractMedicalDataWithAI, isAIExtractionAvailable, getConfigStatus } from './services/aiExtractor'
import { Home, Settings as SettingsIcon, Upload, FileText, Plus, Trash2, Sparkles, Clock, Save, Printer, AlertCircle } from 'lucide-react'
import Settings from './components/Settings'
import History from './components/History'
import PrintPreviewModal from './components/PrintPreviewModal'
import UHIDModal from './components/UHIDModal'
import LabWorklist from './components/LabWorklist'

function App() {
  const [tests, setTests] = useState([])
  const [petName, setPetName] = useState('Max')
  const [petOwnerName, setPetOwnerName] = useState('')
  const [ageYears, setAgeYears] = useState('')
  const [ageMonths, setAgeMonths] = useState('')
  const [ageDays, setAgeDays] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedTesterId, setSelectedTesterId] = useState('')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [deliveryDate, setDeliveryDate] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [uploadedFilePath, setUploadedFilePath] = useState(null)
  const [pdfData, setPdfData] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [testers, setTesters] = useState([])
  const [showPrintPreview, setShowPrintPreview] = useState(false)
  const [savedReportData, setSavedReportData] = useState(null)
  const [showUHIDModal, setShowUHIDModal] = useState(false)
  const [pendingFilePath, setPendingFilePath] = useState(null)
  const [uhid, setUhid] = useState('')
  const [reportId, setReportId] = useState('')
  const printRef = useRef()

  // Load doctors and testers on mount
  useEffect(() => {
    loadDoctors()
    loadTesters()
  }, [])

  const loadDoctors = async () => {
    try {
      const doctorsList = await window.electronAPI.getDoctors()
      setDoctors(doctorsList || [])
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const loadTesters = async () => {
    try {
      const testersList = await window.electronAPI.getTesters()
      setTesters(testersList || [])
    } catch (error) {
      console.error('Error loading testers:', error)
    }
  }

  // Handle file selection via dialog
  const handleFileSelect = async () => {
    if (!window.electronAPI) {
      alert('Electron API not available. Try loading sample data instead.')
      return
    }

    try {
      const result = await window.electronAPI.openFileDialog()
      
      if (!result.canceled && result.filePath) {
        // Show UHID modal before processing
        setPendingFilePath(result.filePath)
        setShowUHIDModal(true)
      }
    } catch (error) {
      console.error('Error selecting file:', error)
      alert('Error selecting file: ' + error.message)
    }
  }

  // Upload and immediately process the PDF file
  const uploadPDF = async (filePath) => {
    try {
      setIsLoading(true)
      const result = await window.electronAPI.parsePDF(filePath)
      
      if (result.success) {
        setUploadedFilePath(filePath)
        setPdfData(result.text)
        
        // Immediately trigger AI extraction
        await processExtraction(result.text)
      } else {
        alert('Error parsing PDF: ' + result.error)
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Error processing PDF: ' + error.message)
      setIsLoading(false)
    }
  }
  
  // Extract AI data from PDF text
  const processExtraction = async (textData) => {
    try {
      if (isAIExtractionAvailable()) {
        console.log('[App] Using AI extraction')
        const aiResult = await extractMedicalDataWithAI(textData)
        
        // Update pet info if extracted
        if (aiResult.patientName) setPetName(aiResult.patientName)
        if (aiResult.reportDate) setReportDate(aiResult.reportDate)
        
        // Set tests
        setTests(aiResult.tests)
      } else {
        console.log('[App] Using regex extraction')
        const parsedTests = parseLabReport(textData)
        setTests(parsedTests)
      }
    } catch (error) {
      console.error('[App] Extraction error:', error)
      alert(`Error extracting data: ${error.message}\n\nFalling back to regex parser...`)
      
      // Fallback to regex parser
      try {
        const parsedTests = parseLabReport(textData)
        setTests(parsedTests)
      } catch (fallbackError) {
        console.error('[App] Fallback error:', fallbackError)
        alert('Both AI and regex parsing failed. Please manually enter the data.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Handle UHID confirmation
  const handleUHIDConfirm = async (enteredUhid, generatedReportId) => {
    setUhid(enteredUhid)
    setReportId(generatedReportId)
    setShowUHIDModal(false)
    
    // Now upload the PDF
    setIsLoading(true)
    await uploadPDF(pendingFilePath)
    setPendingFilePath(null)
    setIsLoading(false)
  }

  // Handle UHID modal cancel
  const handleUHIDCancel = () => {
    setShowUHIDModal(false)
    setPendingFilePath(null)
  }



  // Handle drag and drop events
  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (!window.electronAPI) {
      alert('Electron API not available. Please use the Browse Files button.')
      return
    }

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const filePath = file.path
        if (filePath) {
          // Show UHID modal before processing
          setPendingFilePath(filePath)
          setShowUHIDModal(true)
        } else {
          alert('Could not get file path. Please use the Browse Files button instead.')
        }
      } else {
        alert('Please drop a PDF file')
      }
    }
  }

  // Load sample data for testing
  const handleLoadSampleData = () => {
    const sampleTests = parseLabReport('')
    setTests(sampleTests)
  }

  // Handle test data changes
  const handleTestChange = (id, field, value) => {
    setTests(tests.map(test => 
      test.id === id ? { ...test, [field]: value } : test
    ))
  }

  // Delete a test row
  const handleDeleteTest = (id) => {
    setTests(tests.filter(test => test.id !== id))
  }

  // Add a new test row
  const handleAddTest = () => {
    const newTest = {
      id: generateTestId(tests),
      testName: '',
      result: '',
      unit: '',
      refRange: ''
    }
    setTests([...tests, newTest])
  }

  // Save report to history
  const handleSaveToHistory = async () => {
    if (tests.length === 0) {
      alert('Please add at least one test result before saving.')
      return
    }

    if (!selectedDoctorId) {
      alert('Please select a doctor before saving.')
      return
    }

    if (!selectedTesterId) {
      alert('Please select a tester before saving.')
      return
    }

    if (!uhid) {
      alert('UHID is missing. Please upload the PDF again.')
      return
    }

    try {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId)
      const selectedTester = testers.find(t => t.id === selectedTesterId)

      const reportData = {
        uhid,
        reportId,
        petName,
        petOwnerName,
        ageYears,
        ageMonths,
        ageDays,
        doctorId: selectedDoctorId,
        doctorName: selectedDoctor ? `${selectedDoctor.name}, ${selectedDoctor.degrees}` : '',
        testerId: selectedTesterId,
        testerName: selectedTester ? `${selectedTester.name} (${selectedTester.designation})` : '',
        reportDate,
        deliveryDate,
        tests,
        createdAt: new Date().toISOString()
      }

      await window.electronAPI.saveReport(reportData)
      setSavedReportData(reportData)
      alert('Report saved successfully!')
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Error saving report: ' + error.message)
    }
  }

  // Load report from history
  const handleLoadFromHistory = (report) => {
    setPetName(report.petName || '')
    setPetOwnerName(report.petOwnerName || '')
    setAgeYears(report.ageYears || '')
    setAgeMonths(report.ageMonths || '')
    setAgeDays(report.ageDays || '')
    setSelectedDoctorId(report.doctorId || '')
    setSelectedTesterId(report.testerId || '')
    setReportDate(report.reportDate || '')
    setDeliveryDate(report.deliveryDate || '')
    setTests(report.tests || [])
    setUhid(report.uhid || '')
    setReportId(report.reportId || '')
    setSavedReportData(report)
    setActiveTab('home')
  }

  // Load pending report from watch folder for review/edit
  const handleLoadPendingReport = (report) => {
    setPetName(report.petName || '')
    setPetOwnerName(report.petOwnerName || '')
    setAgeYears(report.ageYears || '')
    setAgeMonths(report.ageMonths || '')
    setAgeDays(report.ageDays || '')
    setSelectedDoctorId('')
    setSelectedTesterId('')
    setReportDate(new Date().toISOString().split('T')[0])
    setDeliveryDate('')
    setTests(report.tests || [])
    setUhid(report.uhid || '')
    setReportId(report.reportId || '')
    setSavedReportData(null) // Not saved yet, needs review
    setActiveTab('home')
  }

  // Reset form
  const handleReset = () => {
    setTests([])
    setPetName('Max')
    setPetOwnerName('')
    setAgeYears('')
    setAgeMonths('')
    setAgeDays('')
    setSelectedDoctorId('')
    setSelectedTesterId('')
    setReportDate(new Date().toISOString().split('T')[0])
    setDeliveryDate('')
    setUploadedFilePath(null)
    setPdfData(null)
    setSavedReportData(null)
    setShowPrintPreview(false)
    setUhid('')
    setReportId('')
  }

  return (
    <div className="flex h-screen bg-slate-50 print:block">
      {/* Sidebar */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-8 print:hidden">
        {/* Logo */}
        <div className="mb-6 px-2">
          <img src="/assest/Veta-logo.png" alt="Veta" className="w-12 h-12 object-contain" />
        </div>
        
        <button
          onClick={() => {
            setActiveTab('home')
            handleReset()
          }}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Home"
        >
          <Home size={24} />
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'history' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="History"
        >
          <Clock size={24} />
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'pending' ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Lab Worklist"
        >
          <AlertCircle size={24} />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Settings"
        >
          <SettingsIcon size={24} />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 print:hidden">
          <h1 className="text-2xl font-semibold text-slate-800">
            {activeTab === 'settings' ? 'Settings' : activeTab === 'history' ? 'History' : activeTab === 'pending' ? 'Lab Worklist' : 'Report Generator'}
          </h1>
        </header>

        {/* Content Area */}
        {activeTab === 'settings' ? (
          <Settings />
        ) : activeTab === 'history' ? (
          <History onLoadReport={handleLoadFromHistory} />
        ) : activeTab === 'pending' ? (
          <LabWorklist onLoadReport={handleLoadPendingReport} />
        ) : (
          <main className="flex-1 overflow-auto p-8">
          {/* State A: Upload */}
          {tests.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`w-full max-w-2xl border-2 border-dashed rounded-2xl p-16 text-center transition-all ${
                  isDragging 
                    ? 'border-blue-600 bg-blue-50' 
                    : 'border-slate-300 bg-white hover:border-blue-400'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="mx-auto h-16 w-16 text-blue-600 mb-6 animate-spin">
                      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </div>
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                      Processing PDF...
                    </h2>
                    <p className="text-slate-500 mb-6">
                      Extracting medical data with AI, please wait...
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                    <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                      Upload Laboratory Report
                    </h2>
                    <p className="text-slate-500 mb-6">
                      Drag and drop a PDF file here, or click to browse
                    </p>
                    
                    <div className="flex gap-4 justify-center">
                      <button
                        onClick={handleFileSelect}
                        disabled={isLoading}
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
                      >
                        Browse Files
                      </button>
                      <button
                        onClick={handleLoadSampleData}
                        className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Load Sample Data
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* State B: Edit - Single Column Layout */}
          {tests.length > 0 && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Patient Info Card */}
              <div className="bg-white rounded-xl p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h3>
                
                {/* UHID and Report ID Display */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      UHID (Unique Health ID)
                    </label>
                    <p className="text-sm font-semibold text-blue-900">{uhid || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">
                      Report ID
                    </label>
                    <p className="text-sm font-semibold text-blue-900">{reportId || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Pet Name
                      </label>
                      <input
                        type="text"
                        value={petName}
                        onChange={(e) => {
                          console.log('Pet Name changed:', e.target.value)
                          setPetName(e.target.value)
                        }}
                        placeholder="Enter pet name"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Pet Owner Name
                      </label>
                      <input
                        type="text"
                        value={petOwnerName}
                        onChange={(e) => {
                          console.log('Pet Owner changed:', e.target.value)
                          setPetOwnerName(e.target.value)
                        }}
                        placeholder="Enter owner name"
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Age
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Years"
                            value={ageYears}
                            onChange={(e) => {
                              console.log('Age Years changed:', e.target.value)
                              setAgeYears(e.target.value)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                          />
                          <p className="text-xs text-slate-500 text-center mt-1">Years</p>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Months"
                            value={ageMonths}
                            onChange={(e) => {
                              console.log('Age Months changed:', e.target.value)
                              setAgeMonths(e.target.value)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                          />
                          <p className="text-xs text-slate-500 text-center mt-1">Months</p>
                        </div>
                        <div className="flex-1">
                          <input
                            type="text"
                            placeholder="Days"
                            value={ageDays}
                            onChange={(e) => {
                              console.log('Age Days changed:', e.target.value)
                              setAgeDays(e.target.value)
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center"
                          />
                          <p className="text-xs text-slate-500 text-center mt-1">Days</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Test Date
                      </label>
                      <input
                        type="date"
                        value={reportDate}
                        onChange={(e) => setReportDate(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Referring Doctor
                      </label>
                      <select
                        value={selectedDoctorId}
                        onChange={(e) => setSelectedDoctorId(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((doctor) => (
                          <option key={doctor.id} value={doctor.id}>
                            {doctor.name}, {doctor.degrees}
                          </option>
                        ))}
                      </select>
                      {doctors.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          No doctors available. Add doctors in Settings.
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Lab Tester
                      </label>
                      <select
                        value={selectedTesterId}
                        onChange={(e) => setSelectedTesterId(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Select Tester</option>
                        {testers.map((tester) => (
                          <option key={tester.id} value={tester.id}>
                            {tester.name} ({tester.designation})
                          </option>
                        ))}
                      </select>
                      {testers.length === 0 && (
                        <p className="text-xs text-amber-600 mt-1">
                          No testers available. Add testers in Settings.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* Test Results Card */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-800">Test Results</h3>
                    <button
                      onClick={handleAddTest}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} />
                      Add Test
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-auto">
                    {tests.map((test) => {
                      const isOutOfRange = !isWithinRange(test.result, test.refRange)
                      
                      return (
                        <div key={test.id} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 rounded-lg">
                          <input
                            type="text"
                            value={test.testName}
                            onChange={(e) => handleTestChange(test.id, 'testName', e.target.value)}
                            placeholder="Test Name"
                            className="col-span-4 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <input
                            type="text"
                            value={test.result}
                            onChange={(e) => handleTestChange(test.id, 'result', e.target.value)}
                            placeholder="Result"
                            className={`col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                              isOutOfRange ? 'text-red-600 font-bold border-red-300' : ''
                            }`}
                          />
                          <input
                            type="text"
                            value={test.unit}
                            onChange={(e) => handleTestChange(test.id, 'unit', e.target.value)}
                            placeholder="Unit"
                            className="col-span-2 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <input
                            type="text"
                            value={test.refRange}
                            onChange={(e) => handleTestChange(test.id, 'refRange', e.target.value)}
                            placeholder="Range"
                            className="col-span-3 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                          />
                          <button
                            onClick={() => handleDeleteTest(test.id)}
                            className="col-span-1 flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <div className="flex gap-4">
                    <button
                      onClick={handleSaveToHistory}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Save size={20} />
                      Save Report
                    </button>
                    {savedReportData && (
                      <button
                        onClick={() => {
                          setDeliveryDate(new Date().toISOString().split('T')[0])
                          setShowPrintPreview(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Printer size={20} />
                        Print Preview
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
            </div>
          )}
        </main>
        )}
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        reportData={savedReportData}
        printRef={printRef}
      />

      {/* UHID Modal */}
      <UHIDModal
        isOpen={showUHIDModal}
        onConfirm={handleUHIDConfirm}
        onCancel={handleUHIDCancel}
        fileName={pendingFilePath ? pendingFilePath.split('\\').pop() : ''}
      />
    </div>
  )
}

export default App
