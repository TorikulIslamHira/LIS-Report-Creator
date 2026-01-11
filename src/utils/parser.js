/**
 * Mock parser that converts raw PDF text into structured test data
 * In production, this would use regex patterns specific to your lab's PDF format
 * 
 * @param {string} rawText - The raw text extracted from PDF
 * @returns {Array} - Array of test objects
 */
export const parseLabReport = (rawText) => {
  // TODO: Replace this with actual parsing logic based on your PDF format
  // For now, return mock data to test the UI
  
  return [
    { id: 1, testName: "Hemoglobin", result: "12.5", unit: "g/dL", refRange: "11.5-16.5" },
    { id: 2, testName: "RBC Count", result: "5.2", unit: "million/µL", refRange: "4.5-5.5" },
    { id: 3, testName: "WBC Count", result: "8.5", unit: "thousand/µL", refRange: "4.0-11.0" },
    { id: 4, testName: "Platelets", result: "180", unit: "thousand/µL", refRange: "150-400" },
    { id: 5, testName: "Blood Sugar (Fasting)", result: "110", unit: "mg/dL", refRange: "70-100" },
    { id: 6, testName: "Total Cholesterol", result: "210", unit: "mg/dL", refRange: "125-200" },
    { id: 7, testName: "HDL Cholesterol", result: "45", unit: "mg/dL", refRange: "40-60" },
    { id: 8, testName: "LDL Cholesterol", result: "140", unit: "mg/dL", refRange: "0-100" },
    { id: 9, testName: "Triglycerides", result: "125", unit: "mg/dL", refRange: "0-150" },
    { id: 10, testName: "Creatinine", result: "1.1", unit: "mg/dL", refRange: "0.7-1.3" }
  ]
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
