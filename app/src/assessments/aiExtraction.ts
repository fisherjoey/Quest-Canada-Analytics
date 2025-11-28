/**
 * AI-Powered PDF Assessment Extraction
 * Uses DeepSeek API to extract structured data from Quest Canada benchmark assessment PDFs
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ExtractAssessmentFromPDF, ImportExtractedAssessment } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

import { PDFParse } from 'pdf-parse';

// Types for extracted data matching the system prompt output format
export interface ExtractedAssessmentData {
  documentType: 'benchmark_assessment';
  extractedAt: string;
  assessment: {
    community_name: string;
    assessment_year: number;
    assessment_date: string | null;
    assessor_name: string | null;
    assessor_organization: string;
    overall_score: number;
    overall_points_earned: number;
    overall_points_possible: number;
  };
  scores: Array<{
    indicator_id: number;
    indicator_name: string;
    indicator_points_earned: number;
    indicator_points_possible: number;
    indicator_percentage: number;
  }>;
  strengths: Array<{
    indicator_id: number;
    strength_text: string;
    strength_category: string;
    display_order: number;
  }>;
  recommendations: Array<{
    indicator_id: number;
    recommendation_text: string;
    lead_party: string;
    priority_level: string;
    estimated_timeframe: string;
    display_order: number;
  }>;
  _confidence: {
    overall: number;
    fields: Record<string, any>;
  };
  _extraction_notes: {
    total_pages_analyzed: number;
    ambiguous_fields: string[];
    missing_data: string[];
    warnings: string[];
  };
}

/**
 * Extract text from PDF using pdf-parse
 */
async function extractTextFromPDF(pdfBase64: string): Promise<string> {
  const pdfBuffer = Buffer.from(pdfBase64, 'base64');

  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text;
  } catch (error: any) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

/**
 * Extract assessment data from a PDF file using DeepSeek API
 */
export const extractAssessmentFromPDF: ExtractAssessmentFromPDF<any, any> = async (args, context) => {
  const startTime = Date.now();

  try {
    if (!context.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    // Create log entry immediately with PROCESSING status
    const extractionLog = await context.entities.AiExtractionLog.create({
      data: {
        userId: context.user.id,
        documentType: 'assessment',
        fileName: args.fileName,
        fileSize: Buffer.from(args.pdfBase64, 'base64').length,
        status: 'PROCESSING',
      },
    });

    // Start async processing - don't await
    processExtractionAsync(extractionLog.id, args, context).catch(error => {
      console.error('Background extraction failed:', error);
    });

    // Return immediately with log ID
    return {
      success: true,
      extractionLogId: extractionLog.id,
      processing: true,
      message: 'Extraction started. Please wait...',
    };

  } catch (error: any) {
    console.error('AI extraction setup failed:', error);
    throw new HttpError(500, `AI extraction setup failed: ${error.message}`);
  }
};

// Background processing function
async function processExtractionAsync(logId: string, args: any, context: any) {
  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    const claude = new Anthropic({
      apiKey: apiKey,
    });

    const promptPath = join(process.cwd(), 'prompts', 'benchmark-assessment-system.txt');
    const systemPrompt = await readFile(promptPath, 'utf-8');

    console.log(`Extracting text from PDF: ${args.fileName}`);
    const pdfText = await extractTextFromPDF(args.pdfBase64);

    if (!pdfText || pdfText.length < 100) {
      throw new HttpError(400, 'PDF appears to be empty or unreadable');
    }

    console.log(`Starting AI extraction for ${args.fileName} (${pdfText.length} characters of text)`);

    // Use Claude Haiku 4.5 with streaming for long-running extractions
    const stream = await claude.messages.stream({
      model: 'claude-haiku-4-5',
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Extract assessment data from this PDF. Return complete JSON with all fields.\n\nPDF Content:\n${pdfText}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 32000, // Claude Haiku 4.5 supports up to 64K output tokens
    });

    let responseText = '';
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        responseText += chunk.delta.text;
      }
    }

    const message = await stream.finalMessage();

    if (!responseText) {
      throw new HttpError(500, 'Empty response from AI');
    }

    let extractedData: ExtractedAssessmentData;
    try {
      const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || responseText.match(/{[\s\S]*}/);
      const jsonText = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;
      extractedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText.substring(0, 500));
      throw new HttpError(500, 'Failed to parse AI extraction response');
    }

    const processingTime = Date.now() - startTime;

    // Update the log entry with completed data
    await context.entities.AiExtractionLog.update({
      where: { id: logId },
      data: {
        status: 'COMPLETED',
        extractedData: extractedData as any,
        confidenceScores: extractedData._confidence || null as any,
        processingTimeMs: processingTime,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
        costUsd: calculateClaudeCost(message.usage.input_tokens, message.usage.output_tokens),
        completedAt: new Date(),
      },
    });

    console.log(`Extraction completed in ${processingTime}ms`);

  } catch (error: any) {
    const processingTime = Date.now() - startTime;

    try {
      await context.entities.AiExtractionLog.update({
        where: { id: logId },
        data: {
          status: 'ERROR',
          errorMessage: error.message || 'Unknown error',
          errorStack: error.stack,
          processingTimeMs: processingTime,
        },
      });
    } catch (logError) {
      console.error('Failed to update error log:', logError);
    }

    console.error('AI extraction failed:', error);
  }
}

/**
 * Import extracted assessment data into the database
 */
export const importExtractedAssessment: ImportExtractedAssessment<any, any> = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Unauthorized');
    }

    const data = args.extractedData;
    const assessmentData = { ...data.assessment, ...args.overrides };

    let community = await context.entities.Community.findFirst({
      where: { name: assessmentData.community_name },
    });

    if (!community) {
      const provinceMatch = assessmentData.community_name.match(/,\s*([A-Z]{2})$/);
      const province = provinceMatch ? provinceMatch[1] : 'ON';

      community = await context.entities.Community.create({
        data: {
          name: assessmentData.community_name,
          province: province as any,
          isActive: true,
        },
      });
    }

    // Check for existing assessment for this community + year
    const existingAssessment = await context.entities.Assessment.findFirst({
      where: {
        communityId: community.id,
        assessmentYear: assessmentData.assessment_year,
      },
    });

    if (existingAssessment) {
      throw new HttpError(
        409,
        `An assessment for "${assessmentData.community_name}" in ${assessmentData.assessment_year} already exists. ` +
        `Please delete the existing assessment first or choose a different year.`
      );
    }

    const assessment = await context.entities.Assessment.create({
      data: {
        communityId: community.id,
        assessmentDate: assessmentData.assessment_date
          ? new Date(assessmentData.assessment_date)
          : new Date(`${assessmentData.assessment_year}-01-01`),
        assessmentYear: assessmentData.assessment_year,
        assessorName: assessmentData.assessor_name || 'Unknown',
        assessorOrganization: assessmentData.assessor_organization,
        status: 'DRAFT',
        overallScore: assessmentData.overall_score,
        maxPossibleScore: assessmentData.overall_points_possible,
        createdBy: context.user.id,
      },
    });

    const indicatorScores = await Promise.all(
      data.scores.map((score: any) =>
        context.entities.IndicatorScore.create({
          data: {
            assessmentId: assessment.id,
            indicatorNumber: score.indicator_id,
            indicatorName: score.indicator_name,
            category: mapIndicatorToCategory(score.indicator_id) as any,
            pointsEarned: score.indicator_points_earned,
            pointsPossible: score.indicator_points_possible,
            percentageScore: score.indicator_percentage,
          },
        })
      )
    );

    const strengths = await Promise.all(
      data.strengths.map((strength: any) =>
        context.entities.Strength.create({
          data: {
            assessmentId: assessment.id,
            category: mapIndicatorToCategory(strength.indicator_id) as any,
            title: strength.strength_category,
            description: strength.strength_text,
          },
        })
      )
    );

    const recommendations = await Promise.all(
      data.recommendations.map((rec: any) =>
        context.entities.Recommendation.create({
          data: {
            assessmentId: assessment.id,
            indicatorNumber: rec.indicator_id,
            recommendationText: rec.recommendation_text,
            priorityLevel: mapPriorityLevel(rec.priority_level) as any,
            responsibleParty: rec.lead_party,
            implementationStatus: 'PLANNED',
          },
        })
      )
    );

    await context.entities.AiExtractionLog.update({
      where: { id: args.extractionLogId },
      data: {
        insertedRecordIds: {
          assessmentId: assessment.id,
          indicatorScoreIds: indicatorScores.map((s) => s.id),
          strengthIds: strengths.map((s) => s.id),
          recommendationIds: recommendations.map((r) => r.id),
        } as any,
      },
    });

    return {
      success: true,
      assessmentId: assessment.id,
      counts: {
        indicatorScores: indicatorScores.length,
        strengths: strengths.length,
        recommendations: recommendations.length,
      },
    };

  } catch (error: any) {
    console.error('Failed to import assessment:', error);

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
      throw new HttpError(
        409,
        'An assessment for this community and year already exists. Please delete the existing assessment first or choose a different year.'
      );
    }

    // Re-throw HttpErrors as-is (they already have user-friendly messages)
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(500, `Failed to import assessment: ${error.message}`);
  }
};

// Helper functions

function mapIndicatorToCategory(indicatorId: number): string {
  const mapping: Record<number, string> = {
    1: 'GOVERNANCE',
    2: 'CAPACITY',
    3: 'PLANNING',
    4: 'PLANNING',
    5: 'PLANNING',
    6: 'PLANNING',
    7: 'INFRASTRUCTURE',
    8: 'OPERATIONS',
    9: 'TRANSPORTATION',
    10: 'BUILDINGS',
  };
  return mapping[indicatorId] || 'OTHER';
}

function mapPriorityLevel(priority: string): string {
  const normalizedPriority = priority.toLowerCase();
  if (normalizedPriority.includes('high') || normalizedPriority.includes('immediate')) {
    return 'HIGH';
  } else if (normalizedPriority.includes('low')) {
    return 'LOW';
  }
  return 'MEDIUM';
}

function calculateClaudeCost(inputTokens: number, outputTokens: number): number {
  // Claude Haiku 4.5 pricing
  const INPUT_COST_PER_1M = 1.00;   // $1 per 1M input tokens
  const OUTPUT_COST_PER_1M = 5.00;  // $5 per 1M output tokens

  const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M;
  const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M;

  return inputCost + outputCost;
}
