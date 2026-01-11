import { useState, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { parseLabReport, isWithinRange, generateTestId } from './utils/parser'
import { extractMedicalDataWithAI, isAIExtractionAvailable, getConfigStatus } from './services/aiExtractor'
import { Home, Printer, Settings, Upload, FileText, Plus, Trash2, Sparkles } from 'lucide-react'

function App() {
  const [tests, setTests] = useState([])
  const [patientName, setPatientName] = useState('John Doe')
  const [patientAge, setPatientAge] = useState('35')
  const [doctorName, setDoctorName] = useState('Dr. Smith')
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString())
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [uploadedFilePath, setUploadedFilePath] = useState(null)
  const [pdfData, setPdfData] = useState(null)
  const [useAI, setUseAI] = useState(true) // Toggle for AI vs Regex parsing
  const printRef = useRef()

  // Handle print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Lab_Report_${patientName}_${reportDate}`,
  })

  // Handle file selection via dialog
  const handleFileSelect = async () => {
    if (!window.electronAPI) {
      alert('Electron API not available. Try loading sample data instead.')
      return
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.openFileDialog()
      
      if (!result.canceled && result.filePath) {
        await uploadPDF(result.filePath)
      }
    } catch (error) {
      console.error('Error selecting file:', error)
      alert('Error selecting file: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Upload the PDF file (store path, don't process yet)
  const uploadPDF = async (filePath) => {
    try {
      const result = await window.electronAPI.parsePDF(filePath)
      
      if (result.success) {
        setUploadedFilePath(filePath)
        setPdfData(result.text)
        alert('PDF uploaded successfully! Click "Load Result" to view the data.')
      } else {
        alert('Error parsing PDF: ' + result.error)
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
      alert('Error processing PDF: ' + error.message)
    }
  }

  // Load and display result
  const handleLoadResult = async () => {
    if (!pdfData) {
      alert('No PDF data available. Please upload a PDF first.')
      return
    }
    
    if (isLoading) {
      console.log('[App] Already processing, ignoring duplicate request')
      return
    }

    setIsLoading(true)
    try {
      if (useAI && isAIExtractionAvailable()) {
        console.log('[App] Using AI extraction')
        const aiResult = await extractMedicalDataWithAI(pdfData)
        
        // Update patient info if extracted
        if (aiResult.patientName) setPatientName(aiResult.patientName)
        if (aiResult.reportDate) setReportDate(aiResult.reportDate)
        
        // Set tests
        setTests(aiResult.tests)
      } else {
        console.log('[App] Using regex extraction')
        const parsedTests = parseLabReport(pdfData)
        setTests(parsedTests)
      }
    } catch (error) {
      console.error('[App] Extraction error:', error)
      alert(`Error extracting data: ${error.message}\n\nFalling back to regex parser...`)
      
      // Fallback to regex parser
      try {
        const parsedTests = parseLabReport(pdfData)
        setTests(parsedTests)
      } catch (fallbackError) {
        console.error('[App] Fallback error:', fallbackError)
        alert('Both AI and regex parsing failed. Please manually enter the data.')
      }
    } finally {
      setIsLoading(false)
    }
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
    }upload

    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setIsLoading(true)
        const filePath = file.path
        if (filePath) {
          await processPDF(filePath)
        } else {
          alert('Could not get file path. Please use the Browse Files button instead.')
        }
        setIsLoading(false)
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

  return (
    <div className="flex h-screen bg-slate-50 print:block">
      {/* Sidebar */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-8 print:hidden">
        <button
          onClick={() => setActiveTab('home')}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'home' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Home"
        >
          <Home size={24} />
        </button>
        <button
          onClick={() => {
            setActiveTab('print')
            if (tests.length > 0) handlePrint()
          }}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'print' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Print"
        >
          <Printer size={24} />
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`p-3 rounded-lg mb-4 transition-colors ${
            activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
          title="Settings"
        >
          <Settings size={24} />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 print:hidden">
          <h1 className="text-2xl font-semibold text-slate-800">Report Generator</h1>
        </header>

        {/* Content Area */}
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
                <Upload className="mx-auto h-16 w-16 text-slate-400 mb-6" />
                <h2 className="text-2xl font-semibold text-slate-800 mb-2">
                  {isLoading ? 'Processing PDF...' : uploadedFilePath ? 'PDF Uploaded Successfully!' : 'Upload Laboratory Report'}
                </h2>
                <p className="text-slate-500 mb-6">
                  {uploadedFilePath 
                    ? `File: ${uploadedFilePath.split('\\').pop()}`
                    : 'Drag and drop a PDF file here, or click to browse'
                  }
                </p>
                
                {/* AI/Regex Toggle */}
                {uploadedFilePath && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useAI}
                          onChange={(e) => setUseAI(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-600"
                        />
                        <Sparkles size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-slate-700">
                          Use AI Extraction {isAIExtractionAvailable() ? '(Recommended)' : '(Not configured)'}
                        </span>
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 text-center mt-2">
                      {getConfigStatus()}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-4 justify-center">
                  {!uploadedFilePath ? (
                    <>
                      <button
                        onClick={handleFileSelect}
                        disabled={isLoading}
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
                      >
                        {isLoading ? 'Loading...' : 'Browse Files'}
                      </button>
                      <button
                        onClick={handleLoadSampleData}
                        className="px-8 py-3 bg-white text-blue-600 font-medium rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Load Sample Data
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleLoadResult}
                        disabled={isLoading}
                        className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileText size={20} />
                        {isLoading ? 'Processing...' : 'Load Result'}
                      </button>
                      <button
                        onClick={() => {
                          setUploadedFilePath(null)
                          setPdfData(null)
                        }}
                        className="px-8 py-3 bg-white text-slate-600 font-medium rounded-lg border-2 border-slate-300 hover:bg-slate-50 transition-colors"
                      >
                        Upload Different File
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* State B: Edit */}
          {tests.length > 0 && (
            <div className="grid grid-cols-2 gap-8 h-full">
              {/* Left Side: Edit Panel */}
              <div className="space-y-6 overflow-auto">
                {/* Patient Info Card */}
                <div className="bg-white rounded-xl p-6 border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Patient Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Patient Name
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Age
                        </label>
                        <input
                          type="text"
                          value={patientAge}
                          onChange={(e) => setPatientAge(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Date
                        </label>
                        <input
                          type="text"
                          value={reportDate}
                          onChange={(e) => setReportDate(e.target.value)}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Doctor Name
                      </label>
                      <input
                        type="text"
                        value={doctorName}
                        onChange={(e) => setDoctorName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
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
              </div>

              {/* Right Side: A4 Preview */}
              <div className="flex items-start justify-center overflow-auto">
                <div 
                  ref={printRef}
                  className="bg-white rounded-lg shadow-2xl p-12 w-[595px] min-h-[842px]"
                  style={{ aspectRatio: '210/297' }}
                >
                  {/* Report Header */}
                  <div className="border-b-2 border-slate-200 pb-6 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-3">
                          LOGO
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Medical Laboratory</h1>
                        <p className="text-xs text-slate-600 mt-1">Blood Test Report</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-semibold text-slate-800">{patientName}</p>
                        <p className="text-slate-600">Age: {patientAge}</p>
                        <p className="text-slate-600">{reportDate}</p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="mb-6">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Referring Physician:</span> {doctorName}
                    </p>
                  </div>

                  {/* Test Results Table */}
                  <div className="mb-8">
                    <h2 className="text-base font-semibold text-slate-800 mb-3">Test Results</h2>
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-700">
                            Test Name
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-700">
                            Result
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-700">
                            Unit
                          </th>
                          <th className="border border-slate-300 px-3 py-2 text-left text-xs font-semibold text-slate-700">
                            Reference Range
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tests.map((test) => {
                          const isOutOfRange = !isWithinRange(test.result, test.refRange)
                          
                          return (
                            <tr key={test.id}>
                              <td className="border border-slate-300 px-3 py-2 text-xs">
                                {test.testName}
                              </td>
                              <td className={`border border-slate-300 px-3 py-2 text-xs ${
                                isOutOfRange ? 'text-red-600 font-bold' : ''
                              }`}>
                                {test.result}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-xs">
                                {test.unit}
                              </td>
                              <td className="border border-slate-300 px-3 py-2 text-xs">
                                {test.refRange}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="border-t-2 border-slate-200 pt-6 mt-auto">
                    <div className="mb-4">
                      <p className="text-xs text-slate-600 mb-2">Authorized Signature:</p>
                      <div className="border-b border-slate-400 w-48 h-8"></div>
                    </div>
                    <div className="text-xs text-slate-500">
                      <p className="mb-1">
                        <strong>Disclaimer:</strong> This report is for medical purposes only.
                      </p>
                      <p className="text-xs">
                        Results should be interpreted by a qualified healthcare professional.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default App
