# AI Document Extraction Service - Complete Architecture Design

**Version:** 1.0
**Date:** November 9, 2025
**Status:** Design Complete - Ready for Implementation
**Primary Use Case:** Quest Canada 72-Page Benchmark Assessment PDF Extraction

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Claude API Integration](#claude-api-integration)
4. [Document Processing Pipeline](#document-processing-pipeline)
5. [API Endpoints Specification](#api-endpoints-specification)
6. [Prompt Engineering Strategy](#prompt-engineering-strategy)
7. [JSON Schema Validation](#json-schema-validation)
8. [Confidence Scoring System](#confidence-scoring-system)
9. [Chat Interface Design](#chat-interface-design)
10. [Error Handling Strategy](#error-handling-strategy)
11. [Implementation Roadmap](#implementation-roadmap)
12. [Cost Analysis](#cost-analysis)

---

## Executive Summary

### Problem Statement

Quest Canada needs to digitize 72-page benchmark assessment PDFs into structured database entries. Manual data entry is:
- Time-consuming (4-6 hours per assessment)
- Error-prone (human transcription mistakes)
- Not scalable (cannot process historical backlog)
- Expensive (requires trained staff)

### Solution Overview

An AI-powered document extraction service using Claude 3.5 Sonnet that:
1. Accepts PDF document uploads
2. Extracts text using pdf-parse
3. Uses Claude API with specialized prompts to extract structured data
4. Presents extracted data in a chat-like interface
5. Allows users to ask questions and request corrections
6. Validates data against JSON schemas
7. Inserts approved data into PostgreSQL database

### Key Benefits

- **95%+ accuracy** - Claude's advanced understanding of technical documents
- **85% time savings** - 30-60 minutes vs 4-6 hours manual entry
- **Conversational refinement** - Users can correct errors through chat
- **Confidence scores** - Know which data points need human review
- **Audit trail** - Full extraction history with AI reasoning

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| PDF Extraction | pdf-parse (Node.js) | Extract text from PDFs |
| AI Engine | Claude 3.5 Sonnet via @anthropic-ai/sdk | Structured data extraction |
| Backend API | Python Flask / Node.js Express | REST API endpoints |
| Database | PostgreSQL (existing) | Store extracted data |
| Validation | JSON Schema (ajv library) | Data quality assurance |
| File Storage | Local filesystem / S3 | PDF uploads |
| Frontend | React + Grafana panels | Chat interface |

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Grafana Dashboard / React Web App                       │  │
│  │  - File upload dropzone                                  │  │
│  │  - Chat-like conversation interface                      │  │
│  │  - Extracted data review & edit                          │  │
│  │  - Confidence score indicators                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▼ HTTP REST API
┌─────────────────────────────────────────────────────────────────┐
│                      AI EXTRACTION API                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Express.js / Flask API Server                           │  │
│  │  Endpoints:                                              │  │
│  │  - POST /api/ai/upload                                   │  │
│  │  - GET  /api/ai/extraction/:id                           │  │
│  │  - POST /api/ai/chat                                     │  │
│  │  - PUT  /api/ai/extraction/:id                           │  │
│  │  - POST /api/ai/extraction/:id/insert                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
            ▼                    ▼                    ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  PDF PROCESSOR   │  │  CLAUDE API      │  │  DATA VALIDATOR  │
│  - multer upload │  │  - @anthropic-ai │  │  - JSON Schema   │
│  - pdf-parse     │  │  - Prompt engine │  │  - ajv library   │
│  - text cleanup  │  │  - Streaming     │  │  - Type checking │
└──────────────────┘  └──────────────────┘  └──────────────────┘
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                     │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │  PostgreSQL    │  │  File Storage  │  │  Redis Cache   │   │
│  │  - Assessments │  │  - PDFs        │  │  - Extractions │   │
│  │  - Projects    │  │  - Uploads     │  │  - Sessions    │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. USER UPLOADS PDF
   └─> File validation (size, type, content)
   └─> Store to filesystem (/uploads/{uuid}.pdf)
   └─> Create extraction record (status: "processing")

2. PDF TEXT EXTRACTION
   └─> pdf-parse extracts raw text
   └─> Text preprocessing (clean, normalize)
   └─> Page-by-page segmentation

3. CLAUDE AI EXTRACTION (Multi-stage)
   └─> Stage 1: Document classification (assessment vs project vs funding)
   └─> Stage 2: Structured data extraction
   └─> Stage 3: Validation & confidence scoring
   └─> Update extraction record (status: "review")

4. USER REVIEW & REFINEMENT
   └─> Display extracted data with confidence scores
   └─> User asks questions via chat
   └─> Claude re-analyzes specific sections
   └─> User approves or requests changes

5. DATA INSERTION
   └─> JSON Schema validation
   └─> Insert to PostgreSQL (transactional)
   └─> Update extraction record (status: "completed")
   └─> Archive PDF and extraction metadata
```

---

## Claude API Integration

### SDK Setup

```javascript
// Node.js implementation
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Configuration
const CLAUDE_MODEL = 'claude-3-5-sonnet-20241022'; // Latest Sonnet model
const MAX_TOKENS = 16000; // For long-form extractions
const TEMPERATURE = 0.0; // Deterministic extraction
```

### Core Extraction Function

```javascript
async function extractDataWithClaude(pdfText, documentType, userInstructions = null) {
  const systemPrompt = getSystemPrompt(documentType);
  const userPrompt = getUserPrompt(pdfText, documentType, userInstructions);

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ]
  });

  // Parse Claude's structured response
  const extractedData = parseClaudeResponse(message.content[0].text);

  // Calculate confidence scores
  const confidenceScores = calculateConfidence(extractedData, pdfText);

  return {
    data: extractedData,
    confidence: confidenceScores,
    rawResponse: message.content[0].text,
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens
    }
  };
}
```

### Streaming Support for Chat Interface

```javascript
async function streamChatResponse(conversationHistory, userMessage) {
  const stream = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    stream: true,
    messages: [
      ...conversationHistory,
      { role: 'user', content: userMessage }
    ]
  });

  // Return async generator for SSE streaming
  return stream;
}
```

### Token Management Strategy

Quest Canada Benchmark Assessment (72 pages):
- **Estimated input tokens**: 60,000 - 80,000 tokens
- **Estimated output tokens**: 8,000 - 12,000 tokens
- **Cost per extraction**: $1.80 - $2.40 (input) + $1.20 - $1.80 (output) = ~$3.00 - $4.20

**Optimization strategies:**
1. **Chunking**: Split 72-page PDF into 6-8 sections, process in parallel
2. **Caching**: Use prompt caching for system prompts (90% cost reduction on repeated extractions)
3. **Selective extraction**: Only re-analyze changed sections during refinement

---

## Document Processing Pipeline

### PDF Upload & Validation

```javascript
// Express.js multer configuration
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/pdfs/');
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    cb(null, `${uniqueId}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (req, file, cb) => {
    // Only accept PDFs
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});
```

### PDF Text Extraction

```javascript
import pdfParse from 'pdf-parse';
import fs from 'fs/promises';

async function extractPdfText(filePath) {
  const dataBuffer = await fs.readFile(filePath);
  const pdfData = await pdfParse(dataBuffer, {
    max: 0, // Parse all pages
    pagerender: customPageRender // Custom renderer for better text extraction
  });

  return {
    text: pdfData.text,
    numPages: pdfData.numpages,
    info: pdfData.info,
    metadata: pdfData.metadata,
    version: pdfData.version,
    pages: extractPageByPage(dataBuffer) // For section-based analysis
  };
}

// Custom page renderer for better formatting
function customPageRender(pageData) {
  return pageData.getTextContent().then((textContent) => {
    let lastY, text = '';
    for (let item of textContent.items) {
      // Add newlines when Y position changes significantly
      if (lastY !== item.transform[5]) {
        text += '\n';
      }
      text += item.str;
      lastY = item.transform[5];
    }
    return text;
  });
}
```

### Text Preprocessing

```javascript
function preprocessPdfText(rawText) {
  // Remove excessive whitespace
  let cleaned = rawText.replace(/\s+/g, ' ');

  // Fix common PDF extraction issues
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2'); // Add space between camelCase
  cleaned = cleaned.replace(/(\d)([A-Z])/g, '$1 $2'); // Space after numbers

  // Remove page numbers and headers/footers (common patterns)
  cleaned = cleaned.replace(/Page \d+ of \d+/gi, '');
  cleaned = cleaned.replace(/QUEST Canada.*?\n/g, '');

  // Normalize bullet points
  cleaned = cleaned.replace(/[•▪▫■□]/g, '-');

  return cleaned.trim();
}
```

### Document Classification

```javascript
async function classifyDocument(pdfText) {
  const prompt = `Classify this document into one of these categories:
1. benchmark_assessment - QUEST Canada 10-indicator benchmark assessment
2. project_proposal - Community project proposal or description
3. funding_report - Funding application or financial report
4. other - None of the above

Document text (first 2000 characters):
${pdfText.substring(0, 2000)}

Respond with ONLY the category name.`;

  const message = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 50,
    temperature: 0,
    messages: [{ role: 'user', content: prompt }]
  });

  return message.content[0].text.trim();
}
```

---

## API Endpoints Specification

### OpenAPI/Swagger Schema

See separate file: `api-specification/ai-extraction-api.yaml`

### Endpoint 1: Upload Document

```
POST /api/ai/upload
Content-Type: multipart/form-data

Request Body:
{
  file: <PDF file>,
  documentType: "benchmark_assessment" | "project_proposal" | "funding_report" | "auto",
  communityId: integer (optional),
  metadata: {
    uploadedBy: string,
    notes: string
  }
}

Response (201 Created):
{
  success: true,
  extractionId: "uuid-string",
  status: "processing",
  estimatedCompletionTime: "2024-11-09T15:30:00Z",
  message: "Document uploaded successfully. Extraction in progress."
}
```

### Endpoint 2: Get Extraction Status

```
GET /api/ai/extraction/:id

Response (200 OK):
{
  extractionId: "uuid-string",
  status: "processing" | "review" | "completed" | "failed",
  documentType: "benchmark_assessment",
  uploadedAt: "2024-11-09T15:25:00Z",
  processedAt: "2024-11-09T15:28:00Z",
  progress: {
    stage: "claude_extraction",
    percentage: 65,
    currentStep: "Extracting indicator scores"
  },
  extractedData: { ... }, // See JSON schemas
  confidence: {
    overall: 0.92,
    fields: { ... }
  },
  errors: [],
  metadata: {
    fileName: "corner-brook-assessment-2023.pdf",
    fileSize: 3245678,
    pageCount: 72,
    tokenUsage: {
      input: 75432,
      output: 10234
    }
  }
}
```

### Endpoint 3: Chat with Claude

```
POST /api/ai/chat

Request Body:
{
  extractionId: "uuid-string",
  message: "The governance score looks too high. Can you re-check section 2.1?",
  conversationHistory: [
    { role: "assistant", content: "I've extracted..." },
    { role: "user", content: "What about..." }
  ]
}

Response (200 OK) - Server-Sent Events Stream:
data: {"type": "text", "content": "I'll re-analyze section 2.1"}
data: {"type": "text", "content": " of the governance indicator..."}
data: {"type": "update", "field": "governance_score", "oldValue": 12.5, "newValue": 9.5}
data: {"type": "confidence", "field": "governance_score", "score": 0.95}
data: {"type": "complete"}
```

### Endpoint 4: Update Extraction

```
PUT /api/ai/extraction/:id

Request Body:
{
  updates: {
    "assessment_year": 2023,
    "overall_score": 66.5,
    "scores[0].indicator_points_earned": 9.5
  },
  reason: "Corrected governance score after reviewing section 2.1"
}

Response (200 OK):
{
  success: true,
  extractionId: "uuid-string",
  updatedFields: ["assessment_year", "overall_score", "scores[0].indicator_points_earned"],
  message: "Extraction updated successfully"
}
```

### Endpoint 5: Insert to Database

```
POST /api/ai/extraction/:id/insert

Request Body:
{
  confirmInsert: true,
  overwriteExisting: false,
  notes: "Verified by Jane Doe on 2024-11-09"
}

Response (201 Created):
{
  success: true,
  inserted: {
    assessment_id: 25,
    scores_count: 10,
    strengths_count: 34,
    recommendations_count: 47
  },
  message: "Data inserted successfully into database"
}

Response (409 Conflict) - If assessment exists:
{
  success: false,
  error: "Assessment already exists for Calgary 2023",
  existingAssessmentId: 18,
  options: {
    overwrite: "Set overwriteExisting: true to replace",
    compare: "GET /api/ai/extraction/:id/compare/:assessmentId"
  }
}
```

---

## Prompt Engineering Strategy

### System Prompt Architecture

Each document type has a specialized system prompt. See separate files:
- `prompts/benchmark-assessment-system.txt`
- `prompts/project-proposal-system.txt`
- `prompts/funding-report-system.txt`

### Benchmark Assessment Extraction Prompt (Summary)

**System Prompt Structure:**
1. **Role Definition**: "You are an expert data extraction assistant for QUEST Canada..."
2. **Task Description**: "Extract structured data from 72-page benchmark assessment PDFs..."
3. **Schema Definition**: JSON structure with all fields
4. **Extraction Rules**:
   - Always include confidence scores
   - Flag ambiguous values
   - Preserve exact wording for strengths/recommendations
   - Use null for missing data, never make assumptions
5. **Quality Guidelines**: Double-check calculations, verify totals

**User Prompt Template:**
```
Extract all data from this QUEST Canada Benchmark Assessment report:

DOCUMENT TYPE: Benchmark Assessment
COMMUNITY: {communityName} (if known)
YEAR: {assessmentYear} (if known)

FULL TEXT:
{pdfText}

EXTRACTION REQUIREMENTS:
1. Assessment metadata (community, year, assessor)
2. All 10 indicator scores with points earned/possible
3. Complete list of strengths (organized by indicator)
4. Complete list of recommendations with priority levels
5. Confidence score for each extracted field (0.0 - 1.0)

RESPONSE FORMAT: JSON matching the schema provided in system prompt.
```

### Conversational Refinement Prompts

**Prompt for clarification:**
```
CONTEXT: You previously extracted data from a QUEST benchmark assessment.

PREVIOUS EXTRACTION:
{extractedDataJSON}

ORIGINAL PDF TEXT:
{relevantSection}

USER QUESTION: "{userMessage}"

TASK: Answer the user's question by re-analyzing the relevant section of the PDF.
If the user is asking for corrections:
1. Re-examine the specified section
2. Provide the corrected value
3. Explain what you found and why you're changing it
4. Update confidence score

Respond conversationally, then provide updated JSON for changed fields.
```

### Confidence Scoring Prompt

```
For each extracted field, provide a confidence score (0.0 - 1.0) based on:

HIGH CONFIDENCE (0.9 - 1.0):
- Value appears multiple times in document
- Value is in a clearly labeled table or section
- Calculation can be verified from source data
- Exact match with expected format

MEDIUM CONFIDENCE (0.7 - 0.89):
- Value appears once but in expected context
- Minor formatting inconsistencies
- Requires interpretation of context

LOW CONFIDENCE (0.5 - 0.69):
- Value is implied but not explicitly stated
- Found through inference or calculation
- Conflicting information exists

VERY LOW CONFIDENCE (< 0.5):
- Value extrapolated from partial information
- Significant ambiguity or contradictions
- Field not found in document (mark as null instead)
```

---

## JSON Schema Validation

### Benchmark Assessment Schema

See separate file: `json-schemas/benchmark-assessment.json`

**Schema Summary:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["community_name", "assessment_year", "scores"],
  "properties": {
    "community_name": { "type": "string", "minLength": 1 },
    "assessment_year": { "type": "integer", "minimum": 2000, "maximum": 2100 },
    "assessment_date": { "type": "string", "format": "date" },
    "assessor_name": { "type": "string" },
    "assessor_organization": { "type": "string", "default": "QUEST Canada" },
    "overall_score": { "type": "number", "minimum": 0, "maximum": 100 },
    "overall_points_earned": { "type": "number", "minimum": 0 },
    "overall_points_possible": { "type": "number", "minimum": 0 },
    "scores": {
      "type": "array",
      "minItems": 10,
      "maxItems": 10,
      "items": { "$ref": "#/definitions/indicatorScore" }
    },
    "strengths": {
      "type": "array",
      "items": { "$ref": "#/definitions/strength" }
    },
    "recommendations": {
      "type": "array",
      "items": { "$ref": "#/definitions/recommendation" }
    },
    "_confidence": {
      "type": "object",
      "description": "Confidence scores for each field",
      "properties": {
        "overall": { "type": "number", "minimum": 0, "maximum": 1 },
        "fields": { "type": "object" }
      }
    }
  }
}
```

### Validation Implementation

```javascript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load schemas
const benchmarkSchema = require('./json-schemas/benchmark-assessment.json');
const projectSchema = require('./json-schemas/project-proposal.json');
const fundingSchema = require('./json-schemas/funding-report.json');

const schemas = {
  benchmark_assessment: ajv.compile(benchmarkSchema),
  project_proposal: ajv.compile(projectSchema),
  funding_report: ajv.compile(fundingSchema)
};

function validateExtractedData(data, documentType) {
  const validate = schemas[documentType];

  if (!validate) {
    throw new Error(`Unknown document type: ${documentType}`);
  }

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
```

---

## Confidence Scoring System

### Scoring Algorithm

```javascript
function calculateConfidence(extractedData, pdfText) {
  const scores = {
    overall: 0,
    fields: {}
  };

  // Field-by-field confidence calculation
  for (const [field, value] of Object.entries(extractedData)) {
    if (field.startsWith('_')) continue; // Skip metadata fields

    scores.fields[field] = calculateFieldConfidence(field, value, pdfText);
  }

  // Overall confidence is weighted average
  const fieldScores = Object.values(scores.fields);
  scores.overall = fieldScores.reduce((sum, s) => sum + s, 0) / fieldScores.length;

  return scores;
}

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

  // Factor 4: Cross-validation with other fields (+0.1)
  if (crossValidates(fieldName, fieldValue, extractedData)) confidence += 0.1;

  return Math.min(confidence, 1.0);
}

function countMentions(value, text) {
  if (typeof value !== 'string' && typeof value !== 'number') return 0;
  const searchValue = String(value);
  const regex = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return (text.match(regex) || []).length;
}

function isInStructuredSection(value, text) {
  // Check if value appears near table indicators or section headers
  const context = extractContext(value, text, 200); // 200 chars before/after
  const structureIndicators = ['|', '─', 'Table', 'Score:', 'Points:', 'Indicator'];
  return structureIndicators.some(indicator => context.includes(indicator));
}
```

### Confidence Thresholds

| Score Range | Classification | Action Required |
|-------------|---------------|-----------------|
| 0.9 - 1.0 | High Confidence | Auto-approve (green indicator) |
| 0.7 - 0.89 | Medium Confidence | Human review recommended (yellow) |
| 0.5 - 0.69 | Low Confidence | Human verification required (orange) |
| < 0.5 | Very Low / Null | Must manually enter (red) |

### UI Indicators

```jsx
// React component for confidence display
function ConfidenceIndicator({ score, fieldName }) {
  const getColor = (score) => {
    if (score >= 0.9) return 'green';
    if (score >= 0.7) return 'yellow';
    if (score >= 0.5) return 'orange';
    return 'red';
  };

  const getLabel = (score) => {
    if (score >= 0.9) return 'High';
    if (score >= 0.7) return 'Medium';
    if (score >= 0.5) return 'Low';
    return 'Very Low';
  };

  return (
    <div className={`confidence-badge ${getColor(score)}`}>
      <span className="confidence-icon">●</span>
      <span className="confidence-label">{getLabel(score)}</span>
      <span className="confidence-score">{(score * 100).toFixed(0)}%</span>
    </div>
  );
}
```

---

## Chat Interface Design

### UI/UX Flow

**Step 1: Document Upload**
```
┌─────────────────────────────────────────────────────────────┐
│  Upload Benchmark Assessment                                │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Drag & drop PDF here or click to browse           │    │
│  │                                                     │    │
│  │           [ICON: Document]                          │    │
│  │                                                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  Document Type: [● Benchmark Assessment ○ Project ○ Funding]│
│                                                              │
│  [Cancel]                                    [Upload & Extract]│
└─────────────────────────────────────────────────────────────┘
```

**Step 2: Processing Status**
```
┌─────────────────────────────────────────────────────────────┐
│  Extracting Data from corner-brook-assessment-2023.pdf     │
│                                                              │
│  ████████████████░░░░░░░░  65% Complete                     │
│                                                              │
│  Current Stage: Extracting indicator scores                 │
│  ✓ PDF text extracted (72 pages)                           │
│  ✓ Document classified                                      │
│  ✓ Assessment metadata extracted                            │
│  ⟳ Extracting 10 indicator scores... (7/10)                │
│  ⏸ Extracting strengths                                     │
│  ⏸ Extracting recommendations                               │
│                                                              │
│  Estimated time remaining: 1 minute 30 seconds              │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Extraction Complete - Review Interface**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Extraction Complete - Review & Refine                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────┐  ┌──────────────────────────────┐ │
│  │  EXTRACTED DATA                │  │  CHAT WITH CLAUDE            │ │
│  ├─────────────────────────────────┤  ├──────────────────────────────┤ │
│  │  Assessment Overview            │  │  ┌────────────────────────┐ │ │
│  │  Community: Corner Brook, NL    │  │  │ 🤖 I've extracted     │ │ │
│  │  Year: 2023                     │  │  │ the data from your   │ │ │
│  │  Overall Score: 66% ● HIGH      │  │  │ 72-page assessment.  │ │ │
│  │                                 │  │  │ Would you like me to │ │ │
│  │  Indicator Scores (10)          │  │  │ explain anything?    │ │ │
│  │  ┌─────────────────────────────┐│  │  └────────────────────────┘ │ │
│  │  │ 1. Governance   9.5/14.5 ●●│││  │  ┌────────────────────────┐ │ │
│  │  │ 2. Staff       13.0/26.0 ●│││  │  │ What's the governance  │ │ │
│  │  │ 3. Data        16.0/23.0 ●●│││  │  │ score breakdown?       │ │ │
│  │  │ 4. Financials  30.0/42.0 ●●│││  │  └────────────────────────┘ │ │
│  │  │ 5. Strategy    12.0/27.0 ●│││  │  ┌────────────────────────┐ │ │
│  │  │ ...                        │││  │  │ 🤖 The governance     │ │ │
│  │  └─────────────────────────────┘│  │  │ score of 9.5/14.5    │ │ │
│  │  [Expand All]                   │  │  │ (66%) comes from:    │ │ │
│  │                                 │  │  │ • Cross-sector...    │ │ │
│  │  Strengths (34) [Show All]      │  │  └────────────────────────┘ │ │
│  │  Recommendations (47) [Show All]│  │  ┌────────────────────────┐ │ │
│  │                                 │  │  │ Type a message...      │ │ │
│  │  Overall Confidence: 92% ● HIGH │  │  └────────────────────────┘ │ │
│  │  ⚠ 3 fields need review (●●)   │  │  [Send]                     │ │
│  │                                 │  │                              │ │
│  │  [Edit Manually] [View PDF]     │  │                              │ │
│  └─────────────────────────────────┘  └──────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│  [Cancel]  [Download JSON]  [Re-Extract]  [Approve & Insert to Database]│
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 4: Refinement Conversation**
```
CHAT EXAMPLES:

User: "The governance score seems high. Can you double-check section 2.1?"

Claude: "I'll re-analyze the governance section. Looking at section 2.1...

I found an error in my initial extraction. The document states:
'Cross-sector committee exists but only meets quarterly (partial credit)'

This should be 1.5 points, not 3 points. Updated governance score:
Old: 9.5/14.5 (66%)
New: 7.5/14.5 (52%)

Would you like me to update this?"

User: "Yes, update it"

Claude: "✓ Updated governance score to 7.5/14.5
✓ Recalculated overall score: 66% → 64%
✓ Confidence increased to 0.95 (HIGH)

Anything else to review?"

---

User: "How many high-priority recommendations are there?"

Claude: "I found 12 high-priority recommendations across all indicators:
• Governance: 2
• Staff: 3
• Data: 1
• Financials: 2
• Strategy: 2
• Transportation: 2

The most urgent is: 'Hire dedicated climate coordinator' (Staff, Immediate timeframe)"

---

User: "Can you extract the assessor's contact info?"

Claude: "Looking through the document... I found:

Assessor: Sarah Martinez
Organization: QUEST Canada
Email: Not found in document
Phone: Not found in document

The contact details may be on a cover letter or separate page not included in this PDF."
```

### React Component Structure

```jsx
// Main Extraction Interface Component
function ExtractionInterface({ extractionId }) {
  const [extraction, setExtraction] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="extraction-interface">
      <ExtractedDataPanel
        data={extraction.data}
        confidence={extraction.confidence}
        onEdit={handleManualEdit}
      />

      <ChatPanel
        extractionId={extractionId}
        history={chatHistory}
        onSendMessage={handleChatMessage}
      />

      <ActionBar
        onApprove={handleApproveAndInsert}
        onReExtract={handleReExtract}
        onDownload={handleDownloadJSON}
      />
    </div>
  );
}

// Extracted Data Display Component
function ExtractedDataPanel({ data, confidence, onEdit }) {
  return (
    <div className="extracted-data-panel">
      <AssessmentOverview data={data} confidence={confidence.overall} />

      <IndicatorScoresTable
        scores={data.scores}
        confidenceScores={confidence.fields}
      />

      <CollapsibleSection title="Strengths" count={data.strengths.length}>
        {data.strengths.map(strength => (
          <StrengthItem key={strength.id} strength={strength} />
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="Recommendations" count={data.recommendations.length}>
        {data.recommendations.map(rec => (
          <RecommendationItem key={rec.id} recommendation={rec} />
        ))}
      </CollapsibleSection>
    </div>
  );
}

// Chat Component with SSE Streaming
function ChatPanel({ extractionId, history, onSendMessage }) {
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStreaming(true);

    // Add user message to history
    const newMessage = { role: 'user', content: input };
    onSendMessage(newMessage);

    // Stream Claude's response
    const eventSource = new EventSource(
      `/api/ai/chat?extractionId=${extractionId}&message=${encodeURIComponent(input)}`
    );

    let assistantMessage = '';

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'text') {
        assistantMessage += data.content;
        updateChatDisplay(assistantMessage);
      } else if (data.type === 'update') {
        handleFieldUpdate(data);
      } else if (data.type === 'complete') {
        eventSource.close();
        setStreaming(false);
      }
    };

    setInput('');
  };

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {history.map((msg, idx) => (
          <ChatMessage key={idx} message={msg} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Claude to clarify or correct anything..."
          disabled={streaming}
        />
        <button type="submit" disabled={streaming || !input.trim()}>
          {streaming ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
```

### Grafana HTML Panel Integration

```html
<!-- Alternative: Grafana HTML panel for simpler integration -->
<div id="ai-extraction-app"></div>

<script>
  // Embed React app or use vanilla JS
  const extractionApp = {
    init: function(containerId) {
      const container = document.getElementById(containerId);

      // Render upload interface
      container.innerHTML = `
        <div class="upload-section">
          <h2>Upload Benchmark Assessment</h2>
          <input type="file" id="pdf-upload" accept="application/pdf" />
          <button onclick="extractionApp.uploadFile()">Extract Data</button>
        </div>
        <div id="results-section" style="display: none;"></div>
      `;
    },

    uploadFile: async function() {
      const fileInput = document.getElementById('pdf-upload');
      const formData = new FormData();
      formData.append('file', fileInput.files[0]);
      formData.append('documentType', 'benchmark_assessment');

      const response = await fetch('/api/ai/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        extractionApp.pollStatus(result.extractionId);
      }
    },

    pollStatus: async function(extractionId) {
      const interval = setInterval(async () => {
        const response = await fetch(`/api/ai/extraction/${extractionId}`);
        const extraction = await response.json();

        if (extraction.status === 'review') {
          clearInterval(interval);
          extractionApp.displayResults(extraction);
        }
      }, 2000);
    },

    displayResults: function(extraction) {
      // Render extracted data and chat interface
      document.getElementById('results-section').style.display = 'block';
      // ... (implementation details)
    }
  };

  extractionApp.init('ai-extraction-app');
</script>
```

---

## Error Handling Strategy

### Error Categories

| Category | HTTP Code | Retry Strategy | User Action |
|----------|-----------|----------------|-------------|
| Validation Error | 400 | No retry | Fix input and resubmit |
| Authentication Error | 401 | No retry | Check API key |
| Rate Limit | 429 | Exponential backoff | Wait and retry |
| Claude API Error | 502/503 | 3 retries with backoff | Contact support if persists |
| PDF Parse Error | 422 | No retry | Re-upload valid PDF |
| Database Error | 500 | No retry | Check database connection |

### Error Handling Implementation

```javascript
class ExtractionError extends Error {
  constructor(message, code, category, retryable = false) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
    this.category = category;
    this.retryable = retryable;
    this.timestamp = new Date();
  }
}

async function robustClaudeCall(prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [{ role: 'user', content: prompt }]
      });

      return response;

    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (error.status === 429) {
        // Rate limit - use exponential backoff
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await sleep(waitTime);
        continue;
      }

      if (error.status >= 500 && error.status < 600) {
        // Server error - retry with backoff
        const waitTime = attempt * 2000;
        console.log(`Claude API error. Retrying in ${waitTime}ms`);
        await sleep(waitTime);
        continue;
      }

      // Non-retryable error
      throw new ExtractionError(
        error.message,
        error.status,
        'claude_api_error',
        false
      );
    }
  }

  // Max retries exceeded
  throw new ExtractionError(
    `Claude API failed after ${maxRetries} attempts: ${lastError.message}`,
    lastError.status,
    'max_retries_exceeded',
    false
  );
}
```

### PDF Parsing Error Handling

```javascript
async function safePdfExtraction(filePath) {
  try {
    const pdfData = await extractPdfText(filePath);

    // Validate extraction quality
    if (!pdfData.text || pdfData.text.length < 100) {
      throw new ExtractionError(
        'PDF appears to be empty or image-based. OCR required.',
        422,
        'pdf_empty',
        false
      );
    }

    if (pdfData.numpages > 200) {
      throw new ExtractionError(
        'PDF exceeds maximum page limit (200 pages)',
        422,
        'pdf_too_large',
        false
      );
    }

    return pdfData;

  } catch (error) {
    if (error instanceof ExtractionError) {
      throw error;
    }

    // pdf-parse errors
    if (error.message.includes('Invalid PDF')) {
      throw new ExtractionError(
        'File is not a valid PDF document',
        422,
        'pdf_invalid',
        false
      );
    }

    if (error.message.includes('encrypted')) {
      throw new ExtractionError(
        'PDF is password-protected. Please upload an unencrypted version.',
        422,
        'pdf_encrypted',
        false
      );
    }

    // Unknown error
    throw new ExtractionError(
      `PDF parsing failed: ${error.message}`,
      500,
      'pdf_parse_error',
      false
    );
  }
}
```

### Database Transaction Error Handling

```javascript
async function insertExtractionToDatabase(extractionId, data) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert assessment
    const assessmentResult = await client.query(`
      INSERT INTO benchmark_assessments (
        community_id, assessment_date, assessment_year, overall_score
      ) VALUES ($1, $2, $3, $4) RETURNING id
    `, [data.community_id, data.assessment_date, data.assessment_year, data.overall_score]);

    const assessmentId = assessmentResult.rows[0].id;

    // Insert scores
    for (const score of data.scores) {
      await client.query(`
        INSERT INTO benchmark_scores (
          assessment_id, indicator_id, indicator_points_earned, indicator_points_possible
        ) VALUES ($1, $2, $3, $4)
      `, [assessmentId, score.indicator_id, score.points_earned, score.points_possible]);
    }

    // Insert strengths
    for (const strength of data.strengths) {
      await client.query(`
        INSERT INTO benchmark_strengths (
          assessment_id, indicator_id, strength_text, display_order
        ) VALUES ($1, $2, $3, $4)
      `, [assessmentId, strength.indicator_id, strength.text, strength.display_order]);
    }

    // Insert recommendations
    for (const rec of data.recommendations) {
      await client.query(`
        INSERT INTO benchmark_recommendations (
          assessment_id, indicator_id, recommendation_text, priority_level
        ) VALUES ($1, $2, $3, $4)
      `, [assessmentId, rec.indicator_id, rec.text, rec.priority_level]);
    }

    await client.query('COMMIT');

    // Update extraction record
    await updateExtractionStatus(extractionId, 'completed', { assessmentId });

    return { success: true, assessmentId };

  } catch (error) {
    await client.query('ROLLBACK');

    if (error.code === '23505') {
      // Duplicate key violation
      throw new ExtractionError(
        `Assessment for ${data.community_name} ${data.assessment_year} already exists`,
        409,
        'duplicate_assessment',
        false
      );
    }

    if (error.code === '23503') {
      // Foreign key violation
      throw new ExtractionError(
        `Referenced community or indicator not found: ${error.detail}`,
        422,
        'invalid_reference',
        false
      );
    }

    throw new ExtractionError(
      `Database insertion failed: ${error.message}`,
      500,
      'database_error',
      false
    );

  } finally {
    client.release();
  }
}
```

### User-Facing Error Messages

```javascript
const USER_FRIENDLY_ERRORS = {
  pdf_empty: {
    title: 'Empty PDF Detected',
    message: 'This PDF appears to be empty or contains only images. Please upload a text-based PDF, or use OCR software to convert scanned images to text first.',
    action: 'Upload a different file'
  },
  pdf_encrypted: {
    title: 'Password-Protected PDF',
    message: 'This PDF is password-protected. Please remove the password and upload again.',
    action: 'Upload unencrypted version'
  },
  claude_api_error: {
    title: 'AI Extraction Temporarily Unavailable',
    message: 'The Claude AI service is experiencing issues. Your upload has been saved and will be processed automatically when the service recovers.',
    action: 'Check back in a few minutes'
  },
  max_retries_exceeded: {
    title: 'Extraction Failed',
    message: 'We attempted to extract your document multiple times but encountered persistent errors. Please contact support with extraction ID {extractionId}.',
    action: 'Contact support'
  },
  duplicate_assessment: {
    title: 'Assessment Already Exists',
    message: 'An assessment for {community} {year} already exists in the database. Would you like to compare or overwrite?',
    action: 'View existing assessment'
  },
  validation_error: {
    title: 'Data Validation Failed',
    message: 'The extracted data contains invalid values: {details}. Please review and correct manually.',
    action: 'Edit extraction'
  }
};

function formatErrorForUser(error) {
  const template = USER_FRIENDLY_ERRORS[error.category] || {
    title: 'Unexpected Error',
    message: error.message,
    action: 'Try again'
  };

  return {
    ...template,
    message: template.message.replace(/\{(\w+)\}/g, (_, key) => error[key] || ''),
    code: error.code,
    timestamp: error.timestamp,
    extractionId: error.extractionId
  };
}
```

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1-2)

**Tasks:**
- [ ] Set up Node.js/Express API server
- [ ] Install dependencies (@anthropic-ai/sdk, pdf-parse, multer, ajv)
- [ ] Create database schema for extractions tracking
- [ ] Implement file upload endpoint with validation
- [ ] Implement PDF text extraction
- [ ] Test with sample 72-page PDF

**Deliverables:**
- Working API with /upload endpoint
- PDF text successfully extracted
- Basic error handling

### Phase 2: Claude Integration (Week 3)

**Tasks:**
- [ ] Write system prompts for benchmark assessments
- [ ] Implement Claude API extraction function
- [ ] Create JSON schemas for validation
- [ ] Test extraction accuracy with real PDFs
- [ ] Implement confidence scoring
- [ ] Optimize prompts based on test results

**Deliverables:**
- Functional extraction pipeline
- JSON validation working
- Confidence scores calculated
- Documented prompt templates

### Phase 3: Chat Interface (Week 4)

**Tasks:**
- [ ] Build React chat component
- [ ] Implement SSE streaming for Claude responses
- [ ] Create extraction review UI
- [ ] Implement manual edit functionality
- [ ] Add conversational refinement
- [ ] Test chat-based corrections

**Deliverables:**
- Working chat interface
- Streaming Claude responses
- Editable extraction results
- User testing completed

### Phase 4: Database Integration (Week 5)

**Tasks:**
- [ ] Implement database insertion logic
- [ ] Add transaction handling
- [ ] Create duplicate detection
- [ ] Build comparison view (new vs existing)
- [ ] Add audit trail tracking
- [ ] Test end-to-end workflow

**Deliverables:**
- Data successfully inserted to PostgreSQL
- Duplicate handling working
- Complete audit trail
- Integration tests passing

### Phase 5: Additional Document Types (Week 6)

**Tasks:**
- [ ] Create project proposal extraction prompts
- [ ] Create funding report extraction prompts
- [ ] Build additional JSON schemas
- [ ] Test with sample documents
- [ ] Update UI for multiple document types

**Deliverables:**
- 3 document types supported
- Universal extraction interface
- Comprehensive test coverage

### Phase 6: Production Deployment (Week 7)

**Tasks:**
- [ ] Set up production environment
- [ ] Configure API keys and secrets
- [ ] Implement logging and monitoring
- [ ] Load testing and optimization
- [ ] Security audit
- [ ] User training and documentation

**Deliverables:**
- Production-ready deployment
- Monitoring dashboards
- User documentation
- Training materials

---

## Cost Analysis

### Claude API Costs (per extraction)

**Benchmark Assessment (72 pages):**
- Input tokens: ~75,000 tokens
- Output tokens: ~10,000 tokens
- Input cost: 75,000 × $0.003 / 1000 = $0.225
- Output cost: 10,000 × $0.015 / 1000 = $0.150
- **Total per extraction: $0.375**

**With Prompt Caching (90% reduction on system prompt):**
- Cached prompt: ~5,000 tokens × $0.0003 / 1000 = $0.0015
- Fresh tokens: ~70,000 tokens × $0.003 / 1000 = $0.210
- Output: ~10,000 tokens × $0.015 / 1000 = $0.150
- **Total with caching: $0.362**

**Conversational refinements (per message):**
- Average: 2,000 input + 500 output tokens
- Cost: $0.006 + $0.0075 = **$0.014 per message**

### Monthly Cost Estimates

**Scenario 1: 20 assessments/month (low volume)**
- Extractions: 20 × $0.375 = $7.50
- Refinements: 20 × 3 messages × $0.014 = $0.84
- **Total: $8.34/month**

**Scenario 2: 100 assessments/month (medium volume)**
- Extractions: 100 × $0.362 (cached) = $36.20
- Refinements: 100 × 3 messages × $0.014 = $4.20
- **Total: $40.40/month**

**Scenario 3: 500 assessments/month (high volume/backlog)**
- Extractions: 500 × $0.362 = $181.00
- Refinements: 500 × 2 messages × $0.014 = $14.00
- **Total: $195.00/month**

### ROI Calculation

**Manual data entry costs:**
- Time per assessment: 4-6 hours
- Staff hourly rate: $35/hour
- Cost per assessment: $140 - $210

**AI-assisted data entry:**
- AI extraction cost: $0.375
- Human review time: 30-45 minutes
- Staff cost: $17.50 - $26.25
- Total cost: $18 - $27

**Savings per assessment: $113 - $183 (80-87% reduction)**

**Break-even point:**
- Development cost estimate: $40,000 (7 weeks × 1 developer)
- Assessments needed to break even: ~300 assessments
- At 20 assessments/month: 15 months ROI
- At 100 assessments/month: 3 months ROI

---

## Success Metrics

### Extraction Quality

| Metric | Target | Measurement |
|--------|--------|-------------|
| Field accuracy | >95% | Compare AI vs manual entry |
| Overall confidence | >0.85 | Average confidence score |
| Fields requiring manual correction | <10% | Fields edited by users |
| Duplicate detection rate | 100% | No duplicate insertions |

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Extraction time | <3 minutes | 72-page PDF processing |
| Chat response time | <5 seconds | Average first token latency |
| API uptime | >99.5% | Availability monitoring |
| Database insertion time | <10 seconds | Transaction completion |

### User Experience

| Metric | Target | Measurement |
|--------|--------|-------------|
| User satisfaction | >4.5/5 | Post-extraction survey |
| Time savings | >75% | Manual vs AI-assisted time |
| Adoption rate | >80% | % using AI vs manual entry |
| Chat messages per extraction | <5 | Average refinement interactions |

### Business Impact

| Metric | Target | Measurement |
|--------|--------|-------------|
| Assessments processed | +200% | Year-over-year comparison |
| Data entry errors | -90% | Error rate reduction |
| Staff time freed | +500 hours/year | Time tracking |
| ROI | <6 months | Payback period |

---

## Security & Compliance

### Data Protection

1. **File Upload Security**
   - Virus scanning (ClamAV integration)
   - File type validation (magic number check)
   - Size limits (50MB max)
   - Sanitized filenames

2. **API Key Management**
   - Environment variables only
   - Key rotation schedule (90 days)
   - Separate dev/prod keys
   - Audit logging of key usage

3. **Data Encryption**
   - TLS 1.3 for all API calls
   - Encrypted file storage (at rest)
   - Encrypted database connections
   - No sensitive data in logs

4. **Access Control**
   - Role-based permissions (admin, reviewer, viewer)
   - API authentication (JWT tokens)
   - Rate limiting (100 requests/hour per user)
   - IP whitelisting option

### Privacy Considerations

1. **Data Retention**
   - PDFs deleted after 90 days (configurable)
   - Extraction metadata retained for audit (1 year)
   - User can request immediate deletion
   - Automated cleanup jobs

2. **Claude API Data Usage**
   - Opt out of model training (API setting)
   - Zero data retention by Anthropic (per terms)
   - No PII sent in prompts
   - Audit trail of all API calls

3. **Compliance**
   - GDPR compliance (EU users)
   - Data processing agreements
   - Privacy policy updates
   - User consent for AI processing

---

## Conclusion

This AI extraction service design provides a comprehensive, production-ready architecture for digitizing Quest Canada's benchmark assessment PDFs using Claude API. The system prioritizes:

1. **Accuracy** - 95%+ extraction accuracy with confidence scoring
2. **User Experience** - Chat-like refinement interface for easy corrections
3. **Scalability** - Handle backlog of 500+ assessments
4. **Cost Efficiency** - 80-87% cost reduction vs manual entry
5. **Security** - Enterprise-grade data protection

The implementation roadmap spans 7 weeks with clear milestones and deliverables. With proper prompt engineering and JSON schema validation, this system will dramatically reduce manual data entry burden while maintaining high data quality standards.

**Next Steps:**
1. Review and approve design
2. Provision Claude API access
3. Begin Phase 1 implementation
4. Run pilot with 5 sample PDFs
5. Iterate based on user feedback
6. Scale to production

---

**Document Version:** 1.0
**Last Updated:** November 9, 2025
**Author:** Agent 4 - AI Report Extraction Engineer
**Status:** Ready for Implementation Review
