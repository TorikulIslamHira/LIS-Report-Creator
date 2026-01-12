import { useState, useEffect } from 'react'
import { Save, Building2, Phone, Mail, User, Award, Plus, Trash2, UserCheck } from 'lucide-react'

export default function Settings() {
  const [settings, setSettings] = useState({
    hospitalName: '',
    hospitalAddress: '',
    labPhone: '',
    labEmail: '',
    watchFolderPath: ''
  })
  
  const [doctors, setDoctors] = useState([])
  const [testers, setTesters] = useState([])
  
  const [newDoctor, setNewDoctor] = useState({ name: '', degrees: '' })
  const [newTester, setNewTester] = useState({ name: '', designation: '' })
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  useEffect(() => {
    loadSettings()
    loadDoctors()
    loadTesters()
  }, [])

  const loadSettings = async () => {
    try {
      const savedSettings = await window.electronAPI.getSettings()
      setSettings({
        hospitalName: savedSettings.hospitalName || '',
        hospitalAddress: savedSettings.hospitalAddress || '',
        labPhone: savedSettings.labPhone || '',
        labEmail: savedSettings.labEmail || '',
        watchFolderPath: savedSettings.watchFolderPath || ''
      })
    } catch (error) {
      console.error('Error loading settings:', error)
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

  const loadTesters = async () => {
    try {
      const testerList = await window.electronAPI.getTesters()
      setTesters(testerList)
    } catch (error) {
      console.error('Error loading testers:', error)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage('')
    try {
      await window.electronAPI.saveSettings(settings)
      setSaveMessage('Settings saved successfully!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setSaveMessage('Error saving settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddDoctor = async () => {
    if (!newDoctor.name.trim()) {
      alert('Please enter doctor name')
      return
    }
    
    try {
      await window.electronAPI.addDoctor(newDoctor)
      await loadDoctors()
      setNewDoctor({ name: '', degrees: '' })
    } catch (error) {
      console.error('Error adding doctor:', error)
      alert('Failed to add doctor')
    }
  }

  const handleDeleteDoctor = async (doctorId) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return
    
    try {
      await window.electronAPI.deleteDoctor(doctorId)
      await loadDoctors()
    } catch (error) {
      console.error('Error deleting doctor:', error)
      alert('Failed to delete doctor')
    }
  }

  const handleAddTester = async () => {
    if (!newTester.name.trim()) {
      alert('Please enter tester name')
      return
    }
    
    try {
      await window.electronAPI.addTester(newTester)
      await loadTesters()
      setNewTester({ name: '', designation: '' })
    } catch (error) {
      console.error('Error adding tester:', error)
      alert('Failed to add tester')
    }
  }

  const handleDeleteTester = async (testerId) => {
    if (!confirm('Are you sure you want to delete this tester?')) return
    
    try {
      await window.electronAPI.deleteTester(testerId)
      await loadTesters()
    } catch (error) {
      console.error('Error deleting tester:', error)
      alert('Failed to delete tester')
    }
  }

  return (
    <div className="flex-1 overflow-auto p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Settings</h1>
        <p className="text-slate-600 mb-8">Configure hospital, doctors, and laboratory information</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Hospital Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={24} className="text-blue-600" />
                Hospital/Laboratory Information
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Hospital/Laboratory Name
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={settings.hospitalName}
                    onChange={handleChange}
                    placeholder="e.g., Medical Laboratory"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Address
                  </label>
                  <textarea
                    name="hospitalAddress"
                    value={settings.hospitalAddress}
                    onChange={handleChange}
                    placeholder="Full address"
                    rows="3"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="labPhone"
                    value={settings.labPhone}
                    onChange={handleChange}
                    placeholder="e.g., +880 1234-567890"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="labEmail"
                    value={settings.labEmail}
                    onChange={handleChange}
                    placeholder="e.g., lab@example.com"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Auto-Processing Watch Folder
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={settings.watchFolderPath}
                      readOnly
                      placeholder="No folder selected"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700"
                    />
                    <button
                      onClick={async () => {
                        try {
                          const result = await window.electronAPI.selectFolder()
                          if (result && !result.canceled && result.filePath) {
                            setSettings(prev => ({ ...prev, watchFolderPath: result.filePath }))
                          }
                        } catch (error) {
                          console.error('Error selecting folder:', error)
                        }
                      }}
                      className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors whitespace-nowrap"
                    >
                      Browse
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    PDFs added to this folder will be automatically processed. Filename format: UHID_filename.pdf
                  </p>
                </div>

                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save size={20} />
                  {isSaving ? 'Saving...' : 'Save Hospital Info'}
                </button>
                
                {saveMessage && (
                  <p className={`text-sm font-medium text-center ${saveMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                    {saveMessage}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Doctors and Testers */}
          <div className="space-y-6">
            {/* Manage Doctors */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <User size={24} className="text-blue-600" />
                Manage Doctors
              </h2>
              
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Doctor Name (e.g., Dr. John Doe)"
                  value={newDoctor.name}
                  onChange={(e) => setNewDoctor({...newDoctor, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Degrees (e.g., MBBS, MD)"
                  value={newDoctor.degrees}
                  onChange={(e) => setNewDoctor({...newDoctor, degrees: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddDoctor}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Doctor
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {doctors.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No doctors added yet</p>
                ) : (
                  doctors.map(doctor => (
                    <div key={doctor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-800">{doctor.name}</p>
                        {doctor.degrees && (
                          <p className="text-sm text-slate-600">{doctor.degrees}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteDoctor(doctor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Manage Testers */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <UserCheck size={24} className="text-blue-600" />
                Manage Testers/Pathologists
              </h2>
              
              <div className="space-y-3 mb-4">
                <input
                  type="text"
                  placeholder="Tester Name"
                  value={newTester.name}
                  onChange={(e) => setNewTester({...newTester, name: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <input
                  type="text"
                  placeholder="Designation (e.g., Lab Technician)"
                  value={newTester.designation}
                  onChange={(e) => setNewTester({...newTester, designation: e.target.value})}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddTester}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add Tester
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {testers.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">No testers added yet</p>
                ) : (
                  testers.map(tester => (
                    <div key={tester.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div>
                        <p className="font-medium text-slate-800">{tester.name}</p>
                        {tester.designation && (
                          <p className="text-sm text-slate-600">{tester.designation}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTester(tester.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Doctors and Testers will appear as dropdown options when creating reports.
            All information is stored locally on your computer.
          </p>
        </div>
      </div>
    </div>
  )
}
