/**
 * AI-Powered Medical Report Data Extraction Service
 * Uses OpenAI API for intelligent parsing of unstructured medical reports
 * 
 * NOTE: Can be swapped with local Ollama endpoint for offline/privacy mode
 * Example: Change API_BASE_URL to 'http://localhost:11434/v1' for Ollama
 */

// OpenAI API Configuration (DISABLED - Using Ollama instead)
// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || ''
// const API_BASE_URL = 'https://api.openai.com/v1'
// const MODEL = 'gpt-4o-mini' // Cost-efficient model (can also use 'gpt-3.5-turbo')

// Ollama Configuration (ACTIVE - Offline mode)
const OPENAI_API_KEY = '' // No API key needed for Ollama
const API_BASE_URL = 'http://localhost:11434/v1'
const MODEL = 'llama3.2' // Use any local Ollama model (llama3.2, llama3.1, mistral, etc.)

const SYSTEM_PROMPT = `You are a Medical Data Extraction Assistant. Extract blood test results from medical report text and return ONLY a valid JSON object. NO explanations, NO markdown, NO code blocks - JUST the JSON object.

CRITICAL: Your entire response must be ONLY the JSON object starting with { and ending with }. Do not wrap it in markdown code blocks. Do not add any text before or after the JSON.

Instructions:
1. Extract patient name from fields like "Patient Name", "Name", etc.
2. Extract report date from fields like "Report Released", "Date", "Sample Collected", etc.
3. Find all laboratory test results - these usually appear in a table or list format
4. Each test typically has: test name, numeric result, unit of measurement, and reference range
5. Determine status by comparing result to reference range:
   - If result is within range: "Normal"
   - If result is above range or marked as "H" or "High": "High"  
   - If result is below range or marked as "L" or "Low": "Low"
6. Skip header information, patient demographics, doctor names, hospital info
7. If you cannot find a field, use null

Common test names to look for: Hemoglobin, WBC, RBC, Platelets, Glucose, Creatinine, etc.

Return ONLY this JSON structure with no additional text:
{
  "patientName": "string or null",
  "reportDate": "string or null",
  "tests": [
    {
      "testName": "string",
      "result": "string",
      "unit": "string",
      "referenceRange": "string",
      "status": "Normal" | "High" | "Low"
    }
  ]
}

IMPORTANT: Start your response with { and end with }. Nothing else.`

/**
 * Extract medical data using AI
 * @param {string} rawText - Raw text extracted from PDF
 * @returns {Promise<Object>} Parsed medical data
 */
export async function extractMedicalDataWithAI(rawText) {
  // Ollama doesn't require API key, just check if it's OpenAI
  if (!OPENAI_API_KEY && API_BASE_URL.includes('openai.com')) {
    throw new Error('OpenAI API key not configured. Please set VITE_OPENAI_API_KEY in .env file')
  }

  if (!rawText || rawText.trim().length < 10) {
    throw new Error('No text provided for extraction')
  }

  try {
    console.log('[AI Extractor] Sending request to AI model...')
    console.log('[AI Extractor] Model:', MODEL)
    console.log('[AI Extractor] API Base:', API_BASE_URL)
    console.log('[AI Extractor] Text length:', rawText.length)

    const requestBody = {
      model: MODEL,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: `Extract medical data from this report:\n\n${rawText}`
        }
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      stream: false
    }

    // Only add response_format for OpenAI (Ollama doesn't support it yet)
    if (API_BASE_URL.includes('openai.com')) {
      requestBody.response_format = { type: "json_object" }
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // Only add Authorization header for OpenAI
    if (API_BASE_URL.includes('openai.com')) {
      headers['Authorization'] = `Bearer ${OPENAI_API_KEY}`
    }

    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[AI Extractor] API Error:', error)
      throw new Error(`API request failed: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('[AI Extractor] Raw API Response:', data)

    const extractedText = data.choices[0].message.content
    console.log('[AI Extractor] Raw extracted text:', extractedText)

    // Clean the response - Ollama sometimes wraps JSON in markdown or adds extra text
    let cleanedText = extractedText.trim()
    
    // Remove markdown code blocks if present
    cleanedText = cleanedText.replace(/```json\s*/gi, '')
    cleanedText = cleanedText.replace(/```\s*/g, '')
    
    // Remove any text before the first { and after the last }
    const firstBrace = cleanedText.indexOf('{')
    const lastBrace = cleanedText.lastIndexOf('}')
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedText = cleanedText.substring(firstBrace, lastBrace + 1)
    }
    
    console.log('[AI Extractor] Cleaned JSON text:', cleanedText)

    // Parse the JSON response
    let parsedData
    try {
      parsedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error('[AI Extractor] JSON parse error:', parseError)
      console.error('[AI Extractor] Failed to parse this text:', cleanedText)
      console.error('[AI Extractor] Original text:', extractedText)
      throw new Error(`AI returned invalid JSON: ${parseError.message}. Check console for details.`)
    }
    
    console.log('[AI Extractor] Successfully parsed data:', parsedData)

    // Validate the response structure
    if (!parsedData.tests || !Array.isArray(parsedData.tests)) {
      throw new Error('Invalid AI response: missing tests array')
    }

    // Add IDs to tests for React keys
    parsedData.tests = parsedData.tests.map((test, index) => ({
      id: index + 1,
      testName: test.testName || '',
      result: test.result || '',
      unit: test.unit || '',
      refRange: test.referenceRange || '',
      status: test.status || 'Normal'
    }))

    console.log('[AI Extractor] Successfully extracted', parsedData.tests.length, 'tests')
    
    return parsedData

  } catch (error) {
    console.error('[AI Extractor] Error:', error)
    throw error
  }
}

/**
 * Check if AI extraction is available
 * @returns {boolean}
 */
export function isAIExtractionAvailable() {
  // Check if API key is configured (for OpenAI)
  if (API_BASE_URL.includes('openai.com')) {
    return !!OPENAI_API_KEY
  }
  
  // For Ollama, assume available if base URL is set
  return true
}

/**
 * Get configuration status message
 * @returns {string}
 */
export function getConfigStatus() {
  if (API_BASE_URL.includes('openai.com')) {
    return OPENAI_API_KEY 
      ? `✅ OpenAI configured (${MODEL})`
      : '❌ OpenAI API key missing. Add VITE_OPENAI_API_KEY to .env file'
  }
  return `🔧 Using local Ollama (${MODEL})`
}
