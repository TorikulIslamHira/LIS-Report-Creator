/**
 * Parser that converts raw PDF text into structured test data
 * Attempts to extract test data from various lab report formats
 * 
 * @param {string} rawText - The raw text extracted from PDF
 * @returns {Array} - Array of test objects
 */
export const parseLabReport = (rawText) => {
  console.log('=== RAW PDF TEXT ===')
  console.log(rawText)
  console.log('=== END RAW PDF TEXT ===')
  
  if (!rawText || rawText.trim().length === 0) {
    console.warn('No text extracted from PDF')
    return []
  }

  const tests = []
  let testId = 1

  // Common patterns for lab reports
  // Pattern 1: Test Name | Result | Unit | Reference Range
  // Pattern 2: Test Name    Result Unit    Reference Range
  // Pattern 3: Test Name: Result Unit (Range: xxx-xxx)
  
  const lines = rawText.split('\n')
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (!line || line.length < 5) continue
    
    // Try different parsing patterns
    
    // Pattern 1: Tab or pipe separated (TestName | 12.5 | g/dL | 11.5-16.5)
    let match = line.match(/^(.+?)[\s\|]+(\d+\.?\d*)\s+([\w\/µΩ°%]+)\s+([\d\.\-<>]+)/i)
    
    if (!match) {
      // Pattern 2: Multiple spaces separated (Hemoglobin    12.5 g/dL    11.5-16.5)
      match = line.match(/^(.+?)\s{2,}(\d+\.?\d*)\s+([\w\/µΩ°%]+)\s+([\d\.\-<>]+)/i)
    }
    
    if (!match) {
      // Pattern 3: Colon format (Hemoglobin: 12.5 g/dL (11.5-16.5))
      match = line.match(/^(.+?):\s*(\d+\.?\d*)\s*([\w\/µΩ°%]+)\s*\(?([\d\.\-<>]+)/i)
    }
    
    if (!match) {
      // Pattern 4: Any number followed by unit and range
      match = line.match(/^(.+?)\s+(\d+\.?\d*)\s+([\w\/µΩ°%]+)\s+([\d\.\-<>]+)/i)
    }
    
    if (match && match.length >= 5) {
      const testName = match[1].trim()
      const result = match[2].trim()
      const unit = match[3].trim()
      const refRange = match[4].trim()
      
      // Filter out header rows
      if (testName.toLowerCase().includes('test') && testName.toLowerCase().includes('name')) continue
      if (testName.toLowerCase() === 'parameter') continue
      if (testName.toLowerCase() === 'investigation') continue
      
      tests.push({
        id: testId++,
        testName: testName,
        result: result,
        unit: unit,
        refRange: refRange
      })
    }
  }
  
  console.log('Parsed tests:', tests)
  
  // If no tests were parsed, return sample data with a warning
  if (tests.length === 0) {
    console.warn('Could not parse any tests from PDF. Returning sample data.')
    alert('Could not automatically parse the PDF format. Please check the console to see the raw text and adjust the parser accordingly, or manually enter the data.')
    
    // Return empty array so user can manually add tests
    return []
  }
  
  return tests
}

/**
 * Validates if a result value is within the reference range
 * 
 * @param {string} result - The test result value
 * @param {string} refRange - The reference range (e.g., "10-20" or ">5" or "<100")
 * @returns {boolean} - True if within range, false otherwise
 */
export const isWithinRange = (result, refRange) => {
  if (!result || !refRange) return true
  
  const resultNum = parseFloat(result)
  if (isNaN(resultNum)) return true
  
  // Handle ranges like "10-20"
  const rangeMatch = refRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/)
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1])
    const max = parseFloat(rangeMatch[2])
    return resultNum >= min && resultNum <= max
  }
  
  // Handle greater than like ">10"
  const greaterMatch = refRange.match(/>(\d+\.?\d*)/)
  if (greaterMatch) {
    const threshold = parseFloat(greaterMatch[1])
    return resultNum > threshold
  }
  
  // Handle less than like "<100"
  const lessMatch = refRange.match(/<(\d+\.?\d*)/)
  if (lessMatch) {
    const threshold = parseFloat(lessMatch[1])
    return resultNum < threshold
  }
  
  // If we can't parse the range, assume it's valid
  return true
}

/**
 * Generates a unique ID for new test entries
 * 
 * @param {Array} tests - Current array of tests
 * @returns {number} - New unique ID
 */
export const generateTestId = (tests) => {
  if (!tests || tests.length === 0) return 1
  return Math.max(...tests.map(t => t.id)) + 1
}
