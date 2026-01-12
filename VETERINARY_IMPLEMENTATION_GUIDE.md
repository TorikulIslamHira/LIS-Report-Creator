# Veterinary Clinic Adaptation & Folder Watcher Implementation

## Overview
This document details the comprehensive refactoring completed for the Report Generator application, transforming it from a human medical lab system to a **Veterinary Clinic Lab Report System** with automated folder watching capabilities.

---

## 1. Domain Changes - Veterinary Clinic Adaptation

### 1.1 Patient → Pet Information Fields

**Changes Made:**
- **Renamed:** "Patient Name" → **"Pet Name"**
- **Added:** **"Pet Owner Name"** field (new)
- **Split Age Field:** Single "Age" input → Three separate inputs:
  - **Years** (e.g., "2")
  - **Months** (e.g., "6")
  - **Days** (e.g., "15")

**Files Modified:**
- `src/App.jsx`: State variables updated (`petName`, `petOwnerName`, `ageYears`, `ageMonths`, `ageDays`)
- `src/components/PrintPreviewModal.jsx`: Print layout updated to display pet/owner information
- `src/components/History.jsx`: History list updated to show pet/owner names

**UI Changes:**
```jsx
// Before
<input value={patientName} placeholder="John Doe" />
<input value={patientAge} placeholder="35" />

// After
<input value={petName} placeholder="Max" />
<input value={petOwnerName} placeholder="Owner's Name" />
<div className="flex gap-2">
  <input value={ageYears} placeholder="Years" />
  <input value={ageMonths} placeholder="Months" />
  <input value={ageDays} placeholder="Days" />
</div>
```

### 1.2 Date Logic Updates

**Two Date Fields:**
1. **Test Date**: Date when tests were performed/data extracted (manual or auto)
2. **Delivery Date**: Auto-set to current system date when "Print Preview" is clicked

**Implementation:**
- `reportDate`: Test Date (existing field, relabeled)
- `deliveryDate`: NEW field, auto-populated on print action
- Print button now triggers: `setDeliveryDate(new Date().toLocaleDateString())`

**Print Layout:**
- Shows both "Test Date" and "Delivery Date" in the printed report
- Delivery Date defaults to current date if not set

### 1.3 Terminology Updates

| Old Term | New Term |
|----------|----------|
| Patient Name | Pet Name |
| Patient Age | Age (Years/Months/Days) |
| Ref. Doctor | Veterinarian |
| Date | Test Date |
| N/A | Delivery Date (new) |

---

## 2. Auto-Processing Watch Folder Feature

### 2.1 Settings Configuration

**Location:** Settings → Hospital Info → Auto-Processing Watch Folder

**UI Elements:**
- Read-only text input showing selected folder path
- **"Browse" button** to open folder selection dialog
- Help text: "PDFs added to this folder will be automatically processed. Filename format: UHID_filename.pdf"

**Saved To:** `electron-store` → `watchFolderPath`

### 2.2 Electron Main Process Implementation

**File:** `electron/electron.js`

**Key Components:**

#### A) Folder Watcher Initialization
```javascript
const chokidar = require('chokidar')
let folderWatcher = null

function startFolderWatcher() {
  const watchPath = store.get('watchFolderPath')
  
  if (!watchPath || !fs.existsSync(watchPath)) {
    console.log('[Watch Folder] No valid watch folder configured')
    return
  }
  
  folderWatcher = chokidar.watch(path.join(watchPath, '*.pdf'), {
    persistent: true,
    ignoreInitial: true, // Don't process existing files on startup
    awaitWriteFinish: {
      stabilityThreshold: 2000, // Wait 2s for file to finish writing
      pollInterval: 100
    }
  })
  
  folderWatcher.on('add', (filePath) => {
    console.log('[Watch Folder] New file detected:', filePath)
    processWatchedPDF(filePath)
  })
}
```

#### B) UHID Extraction from Filename
```javascript
function extractUHIDFromFilename(filename) {
  const nameWithoutExt = path.basename(filename, path.extname(filename))
  const parts = nameWithoutExt.split('_')
  return parts[0] // First part before underscore is UHID
}
```

**Supported Filename Formats:**
- `UHID123_ReportName.pdf` → UHID: "UHID123"
- `UHID123.pdf` → UHID: "UHID123"
- `PET001_BloodTest_Jan2026.pdf` → UHID: "PET001"

#### C) Auto-Processing Logic
```javascript
async function processWatchedPDF(filePath) {
  // 1. Extract UHID from filename
  const uhid = extractUHIDFromFilename(filePath)
  
  // 2. Parse PDF
  const dataBuffer = fs.readFileSync(filePath)
  const data = await pdfParse(dataBuffer)
  
  // 3. Auto-generate Report ID
  const reportId = `RPT-${YYYYMMDD}-${XXXX}`
  
  // 4. Create pending report
  const pendingReport = {
    id: Date.now(),
    uhid: uhid,
    reportId: reportId,
    sourcePath: filePath,
    pdfText: data.text,
    status: 'PENDING_REVIEW',
    detectedAt: new Date().toISOString(),
    petName: '', // To be filled by user during review
    tests: [] // To be filled by AI extraction or manual entry
  }
  
  // 5. Save to pending reports (electron-store)
  const pending = store.get('pendingReports', [])
  pending.unshift(pendingReport)
  store.set('pendingReports', pending)
  
  // 6. Notify renderer process
  mainWindow.webContents.send('new-pending-report', pendingReport)
}
```

**Auto-Restart Watcher:**
- Watcher automatically restarts when `watchFolderPath` is saved in Settings
- Handles folder changes gracefully

### 2.3 IPC Handlers Added

**File:** `electron/preload.js`

New methods exposed to renderer:
```javascript
selectFolder: () => ipcRenderer.invoke('select-folder')
getPendingReports: () => ipcRenderer.invoke('get-pending-reports')
deletePendingReport: (reportId) => ipcRenderer.invoke('delete-pending-report', reportId)
onNewPendingReport: (callback) => ipcRenderer.on('new-pending-report', callback)
```

---

## 3. Pre-uploaded Reports UI

### 3.1 New Component: `PreUploadedReports.jsx`

**Location:** `src/components/PreUploadedReports.jsx`

**Features:**
- Lists all reports with `status: 'PENDING_REVIEW'`
- Search functionality (UHID, Pet Name, File Path)
- Display columns:
  - UHID
  - Pet Name (if extracted)
  - Detection Date/Time
  - Source File Path
  - Status Badge: "Pending Review" (amber)
- Actions:
  - **"Review" button**: Loads report into main editor for verification/editing
  - **"Delete" button**: Removes pending report from list

**UI Layout:**
```
┌─────────────────────────────────────────────────┐
│ Pre-uploaded Reports                            │
│ Auto-detected reports from watch folder         │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │  📊 Pending Review: 3                       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ 🔍 Search: [UHID, Pet Name, or file path...]   │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ 📄 UHID: PET001                             │ │
│ │    Pet: (Awaiting review)                   │ │
│ │    📅 Detected: Jan 12, 2026, 10:30 AM      │ │
│ │    📁 File: PET001_BloodTest.pdf            │ │
│ │    ⚠️ Pending Review                        │ │
│ │              [👁️ Review]  [🗑️ Delete]        │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### 3.2 Sidebar Integration

**New Sidebar Button:**
- Icon: `AlertCircle` (⚠️)
- Color: Amber (#f59e0b)
- Position: Between "History" and "Settings"
- Title: "Pre-uploaded Reports"

**Navigation:**
```javascript
activeTab === 'pending' → <PreUploadedReports />
```

### 3.3 Review Workflow

**User Flow:**
1. User adds PDF to watch folder (e.g., `D:\LabReports\Incoming\`)
2. System detects file → Extracts UHID → Saves as PENDING_REVIEW
3. User clicks "Pre-uploaded Reports" in sidebar
4. User clicks **"Review"** button
5. Report loads into main editor with:
   - ✅ UHID (pre-filled from filename)
   - ✅ Report ID (auto-generated)
   - ❌ Pet Name (empty - user fills)
   - ❌ Pet Owner (empty - user fills)
   - ❌ Age (empty - user fills)
   - ❌ Tests (empty - user adds/edits)
6. User completes missing information
7. User clicks **"Save Report"**
8. Report moves to regular History (no longer pending)

---

## 4. Data Schema Updates

### 4.1 Report Data Structure

**Before (Medical Lab):**
```javascript
{
  id, timestamp,
  patientName, patientAge,
  doctorName, testerName,
  reportDate,
  tests: []
}
```

**After (Veterinary Lab):**
```javascript
{
  id, timestamp,
  uhid, reportId,
  petName, petOwnerName,
  ageYears, ageMonths, ageDays,
  doctorName, testerName,
  reportDate, deliveryDate,
  tests: []
}
```

### 4.2 Pending Report Structure

```javascript
{
  id,
  uhid, reportId,
  sourcePath,
  pdfText,
  status: 'PENDING_REVIEW',
  detectedAt,
  petName: '',
  petOwnerName: '',
  tests: []
}
```

### 4.3 Store Schema

**electron-store defaults:**
```javascript
{
  hospitalName: 'Medical Laboratory',
  hospitalAddress: '',
  labPhone: '',
  labEmail: '',
  watchFolderPath: '', // NEW
  doctors: [],
  testers: [],
  reportHistory: [],
  pendingReports: [] // NEW
}
```

---

## 5. Future API Preparation

### 5.1 Code Structure for HMS Integration

**Modular Design:**
- All report data uses consistent schema
- UHID serves as unique patient identifier
- Report ID serves as unique report identifier
- Data stored in electron-store can be easily migrated to external DB

**Potential API Endpoints (Future):**
```javascript
GET    /api/reports              // Get all reports
GET    /api/reports/:reportId    // Get specific report
POST   /api/reports              // Create new report
PUT    /api/reports/:reportId    // Update report
DELETE /api/reports/:reportId    // Delete report

GET    /api/pending-reports      // Get pending reviews
POST   /api/pending-reports/:id/approve // Move to history

GET    /api/patients/:uhid       // Get patient by UHID
```

**Data Export Ready:**
- All reports contain complete metadata
- Timestamps in ISO format
- Foreign keys (doctorId, testerId) maintained

---

## 6. Testing Checklist

### 6.1 Veterinary Domain Testing

- [ ] Pet Name field accepts input
- [ ] Pet Owner Name field accepts input
- [ ] Age Years/Months/Days accept numeric input
- [ ] Age fields allow partial input (e.g., only Years, or Years + Months)
- [ ] Print preview shows Pet Name instead of Patient Name
- [ ] Print preview shows Pet Owner Name
- [ ] Print preview displays age as "X Years Y Months Z Days"
- [ ] Test Date can be manually edited
- [ ] Delivery Date auto-populates when Print Preview clicked
- [ ] History shows Pet Name and Pet Owner

### 6.2 Watch Folder Testing

**Setup:**
1. Open Settings → Hospital Info
2. Click "Browse" next to "Auto-Processing Watch Folder"
3. Select a folder (e.g., `D:\TestWatchFolder`)
4. Click "Save Hospital Info"

**Test Scenarios:**

**Test 1: Basic File Detection**
- [ ] Create a PDF file: `PET001_BloodTest.pdf`
- [ ] Copy to watch folder
- [ ] Wait 3 seconds
- [ ] Go to "Pre-uploaded Reports"
- [ ] Verify report appears with UHID: "PET001"

**Test 2: UHID Extraction**
- [ ] Test filename: `UHID123.pdf` → Should extract "UHID123"
- [ ] Test filename: `UHID123_Report.pdf` → Should extract "UHID123"
- [ ] Test filename: `TEST_ABC_XYZ.pdf` → Should extract "TEST"

**Test 3: Review Workflow**
- [ ] Add PDF: `DOG001_LabReport.pdf`
- [ ] Go to Pre-uploaded Reports
- [ ] Click "Review" button
- [ ] Verify main editor opens
- [ ] Verify UHID shows "DOG001"
- [ ] Verify Report ID is auto-generated
- [ ] Fill in Pet Name, Owner, Age
- [ ] Add test results manually
- [ ] Click "Save Report"
- [ ] Go to History
- [ ] Verify report appears in history

**Test 4: Delete Pending Report**
- [ ] Add PDF: `TEST001.pdf`
- [ ] Go to Pre-uploaded Reports
- [ ] Click Delete button
- [ ] Confirm deletion
- [ ] Verify report removed from list

**Test 5: Search Functionality**
- [ ] Add multiple PDFs with different UHIDs
- [ ] Go to Pre-uploaded Reports
- [ ] Search by UHID → Verify filtering works
- [ ] Search by filename → Verify filtering works

**Test 6: Watch Folder Change**
- [ ] Change watch folder in Settings
- [ ] Save settings
- [ ] Verify watcher restarts (check console logs)
- [ ] Add PDF to new folder
- [ ] Verify detection still works

---

## 7. File Changes Summary

### Files Created (3):
1. `src/components/PreUploadedReports.jsx` - New component for pending reports UI

### Files Modified (7):
1. `package.json` - Added `chokidar` dependency
2. `src/App.jsx` - Updated domain fields, added routing, added handleLoadPendingReport
3. `src/components/Settings.jsx` - Added watch folder selection UI
4. `src/components/PrintPreviewModal.jsx` - Updated to veterinary fields
5. `src/components/History.jsx` - Updated to show pet/owner names
6. `electron/electron.js` - Added folder watcher, IPC handlers, auto-processing
7. `electron/preload.js` - Added new IPC methods

### Dependencies Added:
- `chokidar@^4.0.3` - File system watcher

---

## 8. Console Logs for Debugging

**Watch Folder Events:**
```
[Watch Folder] Watching: D:\TestWatchFolder
[Watch Folder] New file detected: D:\TestWatchFolder\PET001.pdf
[Watch Folder] Processing: D:\TestWatchFolder\PET001.pdf
[Watch Folder] Report saved as PENDING_REVIEW: PET001
```

**Settings Changes:**
```
[Settings] Watch folder changed, restarting watcher
```

**Errors to Watch:**
```
[Watch Folder] No valid watch folder configured
[Watch Folder] Error processing PDF: <error message>
```

---

## 9. Usage Instructions

### For End Users

**Daily Workflow:**
1. Save lab report PDFs to the watch folder with format: `UHID_filename.pdf`
2. Open the app and click "Pre-uploaded Reports" (⚠️ icon)
3. Click "Review" on a pending report
4. Fill in missing pet information (Name, Owner, Age)
5. Verify/edit extracted test results
6. Select Veterinarian and Lab Tester
7. Click "Save Report"
8. Click "Print Preview" to review
9. Click "Print" to send to Windows print dialog

**First-Time Setup:**
1. Go to Settings
2. Fill in Hospital/Clinic information
3. Add Veterinarians (Doctors)
4. Add Lab Testers
5. Select Watch Folder path
6. Save settings

---

## 10. Architecture Notes

### Why This Design?

**Separation of Concerns:**
- **Watch Folder**: Auto-detects and extracts UHID only
- **Pending Reports**: Temporary staging area
- **Main Editor**: Full data entry and validation
- **History**: Final saved reports

**Benefits:**
- User reviews all auto-detected reports before finalizing
- Prevents accidental auto-saves with incomplete data
- Maintains data quality through manual verification
- Easy to track which reports need attention

**Future Enhancements:**
- Integrate AI extraction in `processWatchedPDF()` to pre-fill tests
- Add email notifications when new reports detected
- Batch processing UI for multiple pending reports
- Export to external HMS database via REST API

---

## 11. Known Limitations

1. **AI Extraction**: Currently not integrated in auto-processing (PDF text is saved but not parsed)
2. **Concurrent Files**: If multiple PDFs added simultaneously, all will be processed sequentially
3. **File Overwrites**: If same filename added twice, creates duplicate pending reports
4. **Network Folders**: Watch folder should be local path (network drives may have issues)
5. **Large PDFs**: Very large PDFs (>50MB) may take longer to process

---

## Support & Troubleshooting

**Watch Folder Not Working:**
1. Check folder path is valid
2. Verify folder has write permissions
3. Check console logs for errors
4. Try restarting the app

**Reports Not Appearing in Pending List:**
1. Verify filename contains UHID before underscore
2. Check file extension is `.pdf`
3. Wait 2-3 seconds after copying file
4. Refresh the Pre-uploaded Reports page

**UHID Not Extracting Correctly:**
- Use format: `UHID_description.pdf`
- UHID should not contain underscores
- Example: `PET001_BloodTest.pdf` ✅
- Bad example: `PET_001_BloodTest.pdf` ❌ (will extract "PET")

---

**Implementation Completed:** January 12, 2026  
**Version:** 2.0.0 - Veterinary Edition with Folder Watcher  
**Total Code Changes:** ~800 lines added/modified across 10 files
