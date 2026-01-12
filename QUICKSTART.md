# Quick Start Guide - LabReportOptimizer

## 🚀 First-Time Setup

### 1. Configure Settings
```
Click ⚙️ Settings → Fill in:
- Hospital Name
- Hospital Address  
- Lab Phone
- Lab Email
Click "Save Settings"
```

### 2. Add Doctors
```
In Settings → Right column "Doctor Management":
- Enter doctor name (e.g., "Dr. John Smith")
- Enter degrees (e.g., "MD, MBBS")
- Click "Add Doctor"
- Repeat for all doctors
```

### 3. Add Testers
```
In Settings → Right column "Lab Tester Management":
- Enter tester name (e.g., "Sarah Johnson")
- Enter designation (e.g., "Senior Technician")
- Click "Add Tester"
- Repeat for all testers
```

---

## 📋 Creating a Report

### Step 1: Upload PDF
```
🏠 Home tab → Drag & drop PDF OR click "Browse Files"
✓ Check "Use AI Extraction" (recommended)
Click "Load Result"
```

### Step 2: Review & Edit
```
- Check Patient Name (auto-filled)
- Check Age (auto-filled)
- Check Date (auto-filled)
- SELECT doctor from dropdown (required ⚠️)
- SELECT tester from dropdown (required ⚠️)
- Review test results table
- Click "+ Add Test" if needed
- Edit any values by clicking cells
```

### Step 3: Save Report
```
Click "Save Report" (green button)
→ Validation checks doctor/tester selected
→ Success alert shown
→ "Print Preview" button appears
```

### Step 4: Print
```
Click "Print Preview" (blue button)
→ Modal opens
→ Toggle A4/A5 as needed
→ Review layout
→ Click "Print" to send to printer
→ Click X to close
```

---

## 📁 Viewing History

### Search & Filter
```
🕐 History tab → 
- Search by patient name (left field)
- Filter by doctor (right dropdown)
- Click "Load" to restore any report
- Click "Delete" to remove report
```

### Statistics
```
Top cards show:
- Total Reports
- Recent Reports (last 7 days)
- Reports Today
```

---

## 🔧 Managing Doctors & Testers

### Add New
```
⚙️ Settings → Enter details → Click "Add Doctor/Tester"
Immediately available in dropdowns
```

### Delete
```
⚙️ Settings → Click 🗑️ trash icon next to name
No confirmation - deletes immediately
```

### Edit (workaround)
```
Delete existing entry → Add new entry with updated info
```

---

## ⚠️ Common Validation Messages

| Message | Cause | Fix |
|---------|-------|-----|
| "Please select a doctor before saving" | No doctor selected | Choose doctor from dropdown |
| "Please select a tester before saving" | No tester selected | Choose tester from dropdown |
| "Please add at least one test result" | No tests in table | Upload PDF or click "+ Add Test" |
| "No doctors available. Add doctors in Settings" | Empty doctor list | Go to Settings → Add doctors |
| "No testers available. Add testers in Settings" | Empty tester list | Go to Settings → Add testers |

---

## 🎯 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Reset form | Click Home 🏠 icon |
| Save report | Click "Save Report" after filling form |
| Print preview | Click "Print Preview" after save |
| Close modal | Click X or Escape key |

---

## 💡 Tips & Best Practices

### For Efficiency:
1. **Set up Settings first** - Add all doctors/testers before creating reports
2. **Use AI extraction** - More accurate than regex for varied PDF formats
3. **Save early** - Save report before editing extensively (safety)
4. **Check abnormal values** - Red highlights indicate out-of-range results

### For Quality:
1. **Review extracted data** - AI/regex may miss some fields
2. **Verify reference ranges** - Ensure correct units and ranges
3. **Check patient details** - Confirm name, age, date accuracy
4. **Preview before printing** - Use modal to verify layout

### For Organization:
1. **Use consistent doctor degrees** - "MD, MBBS" not "MD MBBS" or "M.D., M.B.B.S."
2. **Use descriptive tester designations** - "Senior Lab Technician" not just "Technician"
3. **Delete old reports** - Keep history clean (no auto-cleanup yet)
4. **Filter history by doctor** - Find specific doctor's reports easily

---

## 🐛 Troubleshooting

### "Dropdowns are empty"
```
→ No doctors/testers added yet
→ Go to Settings and add them
```

### "Print Preview button not showing"
```
→ Report not saved yet
→ Click "Save Report" first
```

### "PDF extraction failed"
```
→ Try unchecking "Use AI Extraction"
→ Or click "Load Sample Data" to test manually
```

### "Changes not saved"
```
→ Settings: Click "Save Settings" button
→ Reports: Click "Save Report" button
→ Auto-save only works on Settings changes (doctors/testers)
```

---

## 📞 Support

- Check **REFACTORING_SUMMARY.md** for detailed technical info
- Review **package.json** for dependencies
- Logs visible in Electron console (View → Toggle Developer Tools)

---

**Version**: 2.0 (Post-Refactoring)  
**Last Updated**: January 12, 2025
