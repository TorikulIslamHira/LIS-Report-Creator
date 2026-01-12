import { useState, useEffect } from 'react'
import { X, Printer, FileText } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'
import { isWithinRange } from '../utils/parser'

export default function PrintPreviewModal({ isOpen, onClose, reportData, printRef }) {
  const [hospitalSettings, setHospitalSettings] = useState({
    hospitalName: 'Medical Laboratory',
    hospitalAddress: '',
    labPhone: '',
    labEmail: ''
  })

  useEffect(() => {
    loadHospitalSettings()
  }, [])

  const loadHospitalSettings = async () => {
    try {
      const settings = await window.electronAPI.getSettings()
      if (settings) {
        setHospitalSettings({
          hospitalName: settings.hospitalName || 'Medical Laboratory',
          hospitalAddress: settings.hospitalAddress || '',
          labPhone: settings.labPhone || '',
          labEmail: settings.labEmail || ''
        })
      }
    } catch (error) {
      console.error('Error loading hospital settings:', error)
    }
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Lab_Report_${reportData?.petName}_${reportData?.reportDate}`,
    pageStyle: `
      @page {
        size: auto;
        margin: 10mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    `
  })

  if (!isOpen || !reportData) return null

  const { petName, petOwnerName, ageYears, ageMonths, ageDays, doctorName, testerName, reportDate, deliveryDate, tests, uhid, reportId } = reportData

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <FileText className="text-blue-600" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Print Preview</h2>
              <p className="text-sm text-slate-600">Review before printing - Select paper size in Windows print dialog</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="no-print px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Printer size={20} />
              Print
            </button>
            
            <button
              onClick={onClose}
              className="no-print p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X size={24} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-8 no-print">
          <div 
            ref={printRef}
            className="bg-white mx-auto shadow-lg print-content"
            style={{
              width: '210mm',
              minHeight: '297mm',
              padding: '20mm'
            }}
          >
            {/* Report Header */}
            <div className="text-center mb-6 pb-4 border-b-2 border-slate-300">
              <h1 className="font-bold text-blue-900 text-2xl">
                {hospitalSettings.hospitalName}
              </h1>
              {hospitalSettings.hospitalAddress && (
                <p className="text-slate-600 mt-1 text-sm">
                  {hospitalSettings.hospitalAddress}
                </p>
              )}
              <div className="flex justify-center gap-4 mt-2 text-sm text-slate-600">
                {hospitalSettings.labPhone && <span>📞 {hospitalSettings.labPhone}</span>}
                {hospitalSettings.labEmail && <span>✉️ {hospitalSettings.labEmail}</span>}
              </div>
            </div>

            {/* UHID and Report ID */}
            <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div>
                <span className="text-xs font-semibold text-blue-700">UHID:</span>
                <span className="ml-2 text-sm font-bold text-blue-900">{uhid || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-blue-700">Report ID:</span>
                <span className="ml-2 text-sm font-bold text-blue-900">{reportId || 'N/A'}</span>
              </div>
            </div>

            {/* Pet Information */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6 text-sm">
              <div className="flex">
                <span className="font-semibold w-32">Pet Name:</span>
                <span>{petName}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Owner Name:</span>
                <span>{petOwnerName || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Age:</span>
                <span>
                  {ageYears && `${ageYears} Years`}
                  {ageMonths && ` ${ageMonths} Months`}
                  {ageDays && ` ${ageDays} Days`}
                  {!ageYears && !ageMonths && !ageDays && 'N/A'}
                </span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Veterinarian:</span>
                <span>{doctorName || 'N/A'}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Test Date:</span>
                <span>{reportDate}</span>
              </div>
              <div className="flex">
                <span className="font-semibold w-32">Delivery Date:</span>
                <span>{deliveryDate || new Date().toLocaleDateString()}</span>
              </div>
              {testerName && (
                <div className="flex col-span-2">
                  <span className="font-semibold w-32">Tested By:</span>
                  <span>{testerName}</span>
                </div>
              )}
            </div>

            {/* Test Results Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-sm">
                  <th className="border border-slate-300 p-2 text-left font-semibold">Test Name</th>
                  <th className="border border-slate-300 p-2 text-center font-semibold">Result</th>
                  <th className="border border-slate-300 p-2 text-center font-semibold">Unit</th>
                  <th className="border border-slate-300 p-2 text-center font-semibold">Reference Range</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {tests.map((test, index) => {
                  const isAbnormal = !isWithinRange(test.result, test.refRange)
                  return (
                    <tr key={index} className="break-inside-avoid">
                      <td className="border border-slate-300 p-2">{test.testName}</td>
                      <td className={`border border-slate-300 p-2 text-center ${isAbnormal ? 'font-bold text-red-600' : ''}`}>
                        {test.result}
                      </td>
                      <td className="border border-slate-300 p-2 text-center">{test.unit}</td>
                      <td className="border border-slate-300 p-2 text-center">{test.refRange}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-300 text-xs text-slate-500">
              <p className="mb-1">
                <strong>Disclaimer:</strong> This report is for medical purposes only.
              </p>
              <p>
                Results should be interpreted by a qualified healthcare professional.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide everything except the report content */
          .no-print {
            display: none !important;
          }
          
          /* Ensure the modal background doesn't print */
          .fixed {
            position: static !important;
          }
          
          /* Make print content take full page */
          .print-content {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          @page {
            size: auto;
            margin: 0mm;
          }
          
          /* Ensure proper page breaks */
          table {
            page-break-inside: auto;
          }
          
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          
          /* Ensure colors print correctly */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}
