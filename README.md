# LabReportOptimizer

A desktop application for medical laboratories to manage and redesign blood test reports. Built with Electron, React, Vite, and Tailwind CSS.

## Features

- **PDF Upload**: Drag-and-drop or browse to upload lab report PDFs
- **PDF Parsing**: Extracts text from PDFs using pdf-parse library
- **Editable Report**: Full editing capabilities for all test data
- **Validation**: Automatic highlighting of out-of-range results in red and bold
- **Professional Print Layout**: Print-optimized medical report format
- **Patient Information**: Editable patient name, age, and date fields

## Tech Stack

- **Electron**: Desktop application framework
- **React**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **pdf-parse**: PDF text extraction
- **react-to-print**: Print functionality

## Project Structure

```
LabReportOptimizer/
├── electron/
│   ├── electron.js          # Main process
│   └── preload.js           # Preload script with contextBridge
├── src/
│   ├── utils/
│   │   └── parser.js        # PDF parsing and validation utilities
│   ├── App.jsx              # Main React component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles with print CSS
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.cjs       # PostCSS configuration
└── package.json             # Dependencies and scripts
```

## Installation

1. Install dependencies:
```bash
npm install
```

## Development

Run the development server:
```bash
npm run electron:dev
```

This will start both the Vite dev server and Electron in development mode.

## Building

Build the application for production:
```bash
npm run electron:build
```

## Usage

1. **Upload PDF**: Click "Browse Files" or drag-and-drop a PDF file
2. **Edit Data**: Modify test names, results, units, and reference ranges in the table
3. **Add/Delete Tests**: Use "+ Add New Test" button or "Delete" button for each row
4. **Customize Patient Info**: Edit patient name, age, and date in the print preview
5. **Print**: Click "Print Report" to generate a professional medical report

## Validation

Results are automatically validated against reference ranges:
- Red and bold text indicates out-of-range values
- Supports ranges like "10-20", ">10", "<100"

## Parser Configuration

The parser utility (`src/utils/parser.js`) currently returns mock data. To use real PDF parsing:

1. Update the `parseLabReport()` function with regex patterns specific to your lab's PDF format
2. The function receives raw text from the PDF and should return an array of test objects

## Print Layout

The print layout uses CSS `@media print` rules to:
- Hide editing controls and buttons
- Display a clean, professional medical report
- Preserve color coding for out-of-range values
- Show patient information header and signature footer

## License

MIT
