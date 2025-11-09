/**
 * Quest Canada AI Extraction - Claude API Integration Example
 *
 * This example demonstrates how to integrate Claude API for document extraction.
 *
 * Prerequisites:
 * - npm install @anthropic-ai/sdk pdf-parse express multer ajv ajv-formats
 * - Set environment variable: ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from '@anthropic-ai/sdk';
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// =====================================================================
// CONFIGURATION
// =====================================================================

const CLAUDE_CONFIG = {
  model: 'claude-3-5-sonnet-20241022',  // Latest Sonnet model
  maxTokens: 16000,                      // For long-form extractions
  temperature: 0.0                       // Deterministic extraction
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Initialize JSON Schema validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// =====================================================================
// PROMPT LOADING
// =====================================================================

/**
 * Load system and user prompts from files
 */
async function loadPrompts(documentType) {
  const systemPromptPath = `./prompts/${documentType}-system.txt`;
  const userPromptPath = `./prompts/${documentType}-user.txt`;

  const [systemPrompt, userPromptTemplate] = await Promise.all([
    fs.readFile(systemPromptPath, 'utf-8'),
    fs.readFile(userPromptPath, 'utf-8')
  ]);

  return { systemPrompt, userPromptTemplate };
}

/**
 * Populate user prompt template with variables
 */
function populateUserPrompt(template, variables) {
  let prompt = template;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    prompt = prompt.replace(regex, value || 'Unknown - please extract');
  }

  return prompt;
}

// =====================================================================
// PDF TEXT EXTRACTION
// =====================================================================

/**
 * Extract text from PDF file with custom rendering for better quality
 */
async function extractPdfText(filePath) {
  const dataBuffer = await fs.readFile(filePath);

  // Parse PDF with custom page renderer
  const pdfData = await pdfParse(dataBuffer, {
    max: 0,  // Parse all pages
  });

  return {
    text: pdfData.text,
    numPages: pdfData.numpages,
    info: pdfData.info,
    metadata: pdfData.metadata,
  };
}

/**
 * Preprocess PDF text to fix common extraction issues
 */
function preprocessPdfText(rawText) {
  let cleaned = rawText;

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Fix common PDF extraction issues
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase
  cleaned = cleaned.replace(/(\d)([A-Z])/g, '$1 $2');    // Space after numbers

  // Remove common headers/footers
  cleaned = cleaned.replace(/Page \d+ of \d+/gi, '');
  cleaned = cleaned.replace(/QUEST Canada.*?\n/g, '');

  // Normalize bullet points
  cleaned = cleaned.replace(/[•▪▫■□]/g, '-');

  return cleaned.trim();
}

// =====================================================================
// CLAUDE API EXTRACTION
// =====================================================================

/**
 * Main extraction function using Claude API
 */
async function extractDataWithClaude(pdfText, documentType, metadata = {}) {
  console.log(`Extracting ${documentType} data using Claude API...`);

  // Load prompts
  const { systemPrompt, userPromptTemplate } = await loadPrompts(documentType);

  // Populate user prompt with metadata and PDF text
  const userPrompt = populateUserPrompt(userPromptTemplate, {
    communityName: metadata.communityName,
    assessmentYear: metadata.assessmentYear,
    originalFileName: metadata.fileName,
    pageCount: metadata.pageCount,
    uploadDate: metadata.uploadDate || new Date().toISOString(),
    userInstructions: metadata.instructions,
    pdfText: pdfText
  });

  // Call Claude API
  const startTime = Date.now();

  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_CONFIG.model,
      max_tokens: CLAUDE_CONFIG.maxTokens,
      temperature: CLAUDE_CONFIG.temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
    });

    const extractionTime = (Date.now() - startTime) / 1000;

    // Parse JSON response from Claude
    const responseText = message.content[0].text;
    const extractedData = parseClaudeResponse(responseText);

    // Add extraction metadata
    extractedData._extraction_notes = {
      ...extractedData._extraction_notes,
      extraction_time_seconds: extractionTime,
      claude_tokens_used: {
        input_tokens: message.usage.input_tokens,
        output_tokens: message.usage.output_tokens
      }
    };

    console.log(`Extraction completed in ${extractionTime.toFixed(1)}s`);
    console.log(`Tokens used: ${message.usage.input_tokens} in, ${message.usage.output_tokens} out`);

    return {
      success: true,
      data: extractedData,
      rawResponse: responseText,
      metadata: {
        model: CLAUDE_CONFIG.model,
        tokenUsage: message.usage,
        extractionTime: extractionTime
      }
    };

  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Extraction failed: ${error.message}`);
  }
}

/**
 * Parse Claude's JSON response (may have markdown code fences)
 */
function parseClaudeResponse(responseText) {
  // Remove markdown code fences if present
  let jsonText = responseText.trim();

  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    throw new Error(`Failed to parse Claude's JSON response: ${error.message}`);
  }
}

// =====================================================================
// CONFIDENCE SCORING
// =====================================================================

/**
 * Calculate additional confidence scores based on cross-validation
 */
function calculateConfidence(extractedData, pdfText) {
  const scores = {
    overall: extractedData._confidence?.overall || 0.5,
    fields: extractedData._confidence?.fields || {}
  };

  // Field-by-field confidence calculation
  for (const [field, value] of Object.entries(extractedData.assessment || extractedData.project || {})) {
    if (field.startsWith('_')) continue; // Skip metadata fields

    scores.fields[field] = calculateFieldConfidence(field, value, pdfText);
  }

  // Overall confidence is weighted average
  const fieldScores = Object.values(scores.fields).filter(s => typeof s === 'number');
  if (fieldScores.length > 0) {
    scores.overall = fieldScores.reduce((sum, s) => sum + s, 0) / fieldScores.length;
  }

  return scores;
}

/**
 * Calculate confidence for a specific field
 */
function calculateFieldConfidence(fieldName, fieldValue, pdfText) {
  let confidence = 0.5; // Base confidence

  // Factor 1: Multiple mentions (+0.2)
  const mentionCount = countMentions(fieldValue, pdfText);
  if (mentionCount >= 3) confidence += 0.2;
  else if (mentionCount === 2) confidence += 0.1;

  // Factor 2: Found in structured section (+0.2)
  if (isInStructuredSection(fieldValue, pdfText)) confidence += 0.2;

  // Factor 3: Matches expected format (+0.1)
  if (matchesExpectedFormat(fieldName, fieldValue)) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function countMentions(value, text) {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  const searchValue = String(value);
  const regex = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(regex) || []).length;
}

function isInStructuredSection(value, text) {
  if (!value) return false;
  const context = extractContext(String(value), text, 200);
  const structureIndicators = ['|', '─', 'Table', 'Score:', 'Points:', 'Indicator'];
  return structureIndicators.some(indicator => context.includes(indicator));
}

function extractContext(value, text, radius) {
  const index = text.indexOf(String(value));
  if (index === -1) return '';
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + String(value).length + radius);
  return text.substring(start, end);
}

function matchesExpectedFormat(fieldName, fieldValue) {
  // Add format validation logic based on field name
  if (fieldName.includes('year') && typeof fieldValue === 'number') {
    return fieldValue >= 2000 && fieldValue <= 2100;
  }
  if (fieldName.includes('score') && typeof fieldValue === 'number') {
    return fieldValue >= 0 && fieldValue <= 100;
  }
  return true; // Default to true for unknown fields
}

// =====================================================================
// JSON SCHEMA VALIDATION
// =====================================================================

/**
 * Validate extracted data against JSON schema
 */
async function validateExtractedData(data, documentType) {
  const schemaPath = `./json-schemas/${documentType}.json`;
  const schemaJSON = await fs.readFile(schemaPath, 'utf-8');
  const schema = JSON.parse(schemaJSON);

  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors.map(err => ({
        field: err.instancePath,
        message: err.message,
        params: err.params
      }))
    };
  }

  return { valid: true, errors: [] };
}

// =====================================================================
// CONVERSATIONAL REFINEMENT
// =====================================================================

/**
 * Chat with Claude for refinement and corrections
 */
async function chatWithClaude(extractionId, userMessage, conversationHistory, extractedData, pdfText) {
  console.log(`Chat refinement for extraction ${extractionId}`);

  const systemPrompt = `You are helping refine an AI extraction of a QUEST Canada document.

PREVIOUS EXTRACTION:
${JSON.stringify(extractedData, null, 2)}

The user may ask questions or request corrections. Re-analyze the relevant parts of the PDF and provide updated data if needed.`;

  const messages = [
    ...conversationHistory,
    {
      role: 'user',
      content: `${userMessage}\n\nRELEVANT PDF CONTEXT:\n${pdfText.substring(0, 50000)}`
    }
  ];

  const stream = await anthropic.messages.create({
    model: CLAUDE_CONFIG.model,
    max_tokens: 4096,
    temperature: 0.2,
    system: systemPrompt,
    messages: messages,
    stream: true
  });

  return stream; // Return stream for SSE
}

// =====================================================================
// COMPLETE EXTRACTION PIPELINE
// =====================================================================

/**
 * Complete extraction pipeline from PDF to validated JSON
 */
async function runCompleteExtraction(pdfFilePath, documentType = 'benchmark_assessment', metadata = {}) {
  console.log('========================================');
  console.log('QUEST CANADA AI EXTRACTION PIPELINE');
  console.log('========================================');

  try {
    // Step 1: Extract PDF text
    console.log('\n[1/5] Extracting text from PDF...');
    const pdfData = await extractPdfText(pdfFilePath);
    console.log(`✓ Extracted ${pdfData.numPages} pages`);

    // Step 2: Preprocess text
    console.log('\n[2/5] Preprocessing text...');
    const cleanedText = preprocessPdfText(pdfData.text);
    console.log(`✓ Cleaned text (${cleanedText.length} characters)`);

    // Step 3: Extract with Claude
    console.log('\n[3/5] Extracting structured data with Claude API...');
    const extraction = await extractDataWithClaude(cleanedText, documentType, {
      ...metadata,
      pageCount: pdfData.numPages,
      fileName: pdfFilePath.split('/').pop()
    });
    console.log(`✓ Extraction completed`);

    // Step 4: Calculate confidence scores
    console.log('\n[4/5] Calculating confidence scores...');
    const confidence = calculateConfidence(extraction.data, cleanedText);
    extraction.data._confidence = confidence;
    console.log(`✓ Overall confidence: ${(confidence.overall * 100).toFixed(1)}%`);

    // Step 5: Validate against schema
    console.log('\n[5/5] Validating against JSON schema...');
    const validation = await validateExtractedData(extraction.data, documentType);

    if (validation.valid) {
      console.log(`✓ Validation passed`);
    } else {
      console.log(`✗ Validation failed:`);
      validation.errors.forEach(err => {
        console.log(`  - ${err.field}: ${err.message}`);
      });
    }

    // Summary
    console.log('\n========================================');
    console.log('EXTRACTION SUMMARY');
    console.log('========================================');
    console.log(`Document Type: ${documentType}`);
    console.log(`Pages Analyzed: ${pdfData.numPages}`);
    console.log(`Overall Confidence: ${(confidence.overall * 100).toFixed(1)}%`);
    console.log(`Validation: ${validation.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`Token Usage: ${extraction.metadata.tokenUsage.input_tokens} in, ${extraction.metadata.tokenUsage.output_tokens} out`);
    console.log(`Extraction Time: ${extraction.metadata.extractionTime.toFixed(1)} seconds`);

    if (extraction.data._extraction_notes?.missing_data?.length > 0) {
      console.log(`\nMissing Data (${extraction.data._extraction_notes.missing_data.length} fields):`);
      extraction.data._extraction_notes.missing_data.forEach(field => {
        console.log(`  - ${field}`);
      });
    }

    if (extraction.data._extraction_notes?.warnings?.length > 0) {
      console.log(`\nWarnings (${extraction.data._extraction_notes.warnings.length}):`);
      extraction.data._extraction_notes.warnings.forEach(warning => {
        console.log(`  - ${warning}`);
      });
    }

    return {
      success: true,
      extractedData: extraction.data,
      validation: validation,
      metadata: extraction.metadata
    };

  } catch (error) {
    console.error('\n✗ Extraction failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// =====================================================================
// EXAMPLE USAGE
// =====================================================================

/**
 * Example: Extract a benchmark assessment PDF
 */
async function exampleBenchmarkExtraction() {
  const result = await runCompleteExtraction(
    './uploads/corner-brook-assessment-2023.pdf',
    'benchmark_assessment',
    {
      communityName: 'Corner Brook, NL',
      assessmentYear: 2023,
      instructions: 'Pay special attention to governance and staff sections'
    }
  );

  if (result.success) {
    // Save extracted data to file
    await fs.writeFile(
      './extractions/corner-brook-2023.json',
      JSON.stringify(result.extractedData, null, 2)
    );
    console.log('\n✓ Extracted data saved to extractions/corner-brook-2023.json');
  }

  return result;
}

/**
 * Example: Chat refinement
 */
async function exampleChatRefinement(extractionId, extractedData, pdfText) {
  const conversationHistory = [
    {
      role: 'assistant',
      content: "I've extracted the data from your benchmark assessment. The overall score is 66%. Would you like me to explain anything?"
    }
  ];

  const userMessage = "The governance score seems high. Can you double-check section 2.1?";

  const stream = await chatWithClaude(
    extractionId,
    userMessage,
    conversationHistory,
    extractedData,
    pdfText
  );

  // Stream response
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      process.stdout.write(chunk.delta.text);
    }
  }
}

// =====================================================================
// EXPORTS
// =====================================================================

export {
  extractPdfText,
  preprocessPdfText,
  extractDataWithClaude,
  calculateConfidence,
  validateExtractedData,
  chatWithClaude,
  runCompleteExtraction,
  exampleBenchmarkExtraction,
  exampleChatRefinement
};

// =====================================================================
// RUN EXAMPLE (if executed directly)
// =====================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  exampleBenchmarkExtraction()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
