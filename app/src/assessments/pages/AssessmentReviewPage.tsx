/**
 * Assessment Review Page
 * Review and import AI-extracted assessment data
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExtractionStatus, importExtractedAssessment } from 'wasp/client/operations';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';

interface ExtractedAssessmentData {
  documentType: string;
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
  _confidence?: {
    overall: number;
    fields: Record<string, any>;
  };
  _extraction_notes?: {
    total_pages_analyzed: number;
    ambiguous_fields: string[];
    missing_data: string[];
    warnings: string[];
  };
}

export function AssessmentReviewPage() {
  const { extractionLogId } = useParams<{ extractionLogId: string }>();
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['extractionStatus', extractionLogId],
    queryFn: () => getExtractionStatus({ extractionLogId }),
    enabled: !!extractionLogId,
    refetchInterval: (data) => {
      if (data?.status === 'PROCESSING') return 3000;
      return false;
    },
  });

  const handleImport = async () => {
    if (!data?.data || !extractionLogId) return;

    setIsImporting(true);
    setImportError(null);

    try {
      const result = await importExtractedAssessment({
        extractionLogId,
        extractedData: data.data,
        overrides: {},
      });

      if (result.success) {
        navigate(`/assessments/${result.assessmentId}`);
      }
    } catch (err: any) {
      setImportError(err.message || 'Failed to import assessment');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-primary mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-muted-foreground">Loading extraction data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h2>
          <p className="text-destructive/80">{(error as Error).message}</p>
          <Button
            onClick={() => navigate('/assessments/import')}
            variant="destructive"
            className="mt-4"
          >
            Back to Import
          </Button>
        </div>
      </div>
    );
  }

  if (data?.status === 'PROCESSING') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-info/10 border border-info/30 rounded-lg p-8 text-center">
          <svg className="animate-spin h-12 w-12 text-info mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-foreground mb-2">Extraction in Progress</h2>
          <p className="text-muted-foreground">AI is analyzing your PDF. This may take 1-2 minutes...</p>
        </div>
      </div>
    );
  }

  if (data?.status === 'ERROR') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">Extraction Failed</h2>
          <p className="text-destructive/80">{data.error || 'Unknown error occurred'}</p>
          <Button
            onClick={() => navigate('/assessments/import')}
            variant="destructive"
            className="mt-4"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const extractedData = data?.data as ExtractedAssessmentData | null;

  if (!extractedData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-warning mb-2">No Data Found</h2>
          <p className="text-warning/80">The extraction completed but no data was found.</p>
          <Button
            onClick={() => navigate('/assessments/import')}
            variant="outline"
            className="mt-4 border-warning text-warning hover:bg-warning/10"
          >
            Back to Import
          </Button>
        </div>
      </div>
    );
  }

  const { assessment, scores, strengths, recommendations, _confidence, _extraction_notes } = extractedData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Review Extracted Assessment</h1>
        <p className="text-muted-foreground">
          Review the AI-extracted data below. Click "Import Assessment" to save it to the database.
        </p>
      </div>

      {/* Confidence Score */}
      {_confidence && (
        <div className="bg-info/10 border border-info/30 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-foreground font-medium">Extraction Confidence:</span>
            <span className={cn(
              'ml-2 px-3 py-1 rounded-full text-sm font-semibold',
              _confidence.overall >= 0.8 ? 'bg-success/20 text-success' :
              _confidence.overall >= 0.6 ? 'bg-warning/20 text-warning' :
              'bg-destructive/20 text-destructive'
            )}>
              {Math.round(_confidence.overall * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {_extraction_notes?.warnings && _extraction_notes.warnings.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-warning mb-2">Warnings</h3>
          <ul className="list-disc list-inside text-warning/80 text-sm">
            {_extraction_notes.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Assessment Summary */}
      <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Assessment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-muted-foreground">Community</label>
            <p className="font-medium text-foreground">{assessment.community_name}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Assessment Year</label>
            <p className="font-medium text-foreground">{assessment.assessment_year}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Assessor</label>
            <p className="font-medium text-foreground">{assessment.assessor_name || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Organization</label>
            <p className="font-medium text-foreground">{assessment.assessor_organization}</p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Overall Score</label>
            <p className="font-medium text-foreground">
              {assessment.overall_points_earned} / {assessment.overall_points_possible} ({assessment.overall_score}%)
            </p>
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Assessment Date</label>
            <p className="font-medium text-foreground">{assessment.assessment_date || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Indicator Scores */}
      <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Indicator Scores ({scores.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Indicator</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Points</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {scores.map((score) => (
                <tr key={score.indicator_id}>
                  <td className="px-4 py-3 text-sm text-foreground">{score.indicator_id}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{score.indicator_name}</td>
                  <td className="px-4 py-3 text-sm text-foreground text-center">
                    {score.indicator_points_earned} / {score.indicator_points_possible}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn(
                      'px-2 py-1 rounded text-sm font-medium',
                      score.indicator_percentage >= 80 ? 'bg-success/20 text-success' :
                      score.indicator_percentage >= 60 ? 'bg-warning/20 text-warning' :
                      'bg-destructive/20 text-destructive'
                    )}>
                      {score.indicator_percentage}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Strengths ({strengths.length})</h2>
        <div className="space-y-3">
          {strengths.map((strength, i) => (
            <div key={i} className="border-l-4 border-success pl-4 py-2">
              <div className="text-sm text-muted-foreground">Indicator {strength.indicator_id} - {strength.strength_category}</div>
              <p className="text-foreground">{strength.strength_text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-lg shadow border border-border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Recommendations ({recommendations.length})</h2>
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="border-l-4 border-info pl-4 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">Indicator {rec.indicator_id}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded text-xs font-medium',
                  rec.priority_level.toLowerCase().includes('high') ? 'bg-destructive/20 text-destructive' :
                  rec.priority_level.toLowerCase().includes('low') ? 'bg-muted text-muted-foreground' :
                  'bg-warning/20 text-warning'
                )}>
                  {rec.priority_level}
                </span>
              </div>
              <p className="text-foreground mb-1">{rec.recommendation_text}</p>
              <div className="text-sm text-muted-foreground">
                Lead: {rec.lead_party} | Timeframe: {rec.estimated_timeframe}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Error */}
      {importError && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
          <p className="text-destructive">{importError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center bg-muted rounded-lg p-4">
        <Button
          onClick={() => navigate('/assessments/import')}
          variant="outline"
        >
          Cancel
        </Button>
        <Button
          onClick={handleImport}
          disabled={isImporting}
          size="lg"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            </>
          ) : (
            'Import Assessment'
          )}
        </Button>
      </div>

      {/* Processing Time */}
      {data?.processingTimeMs && (
        <div className="mt-4 text-center text-sm text-muted-foreground">
          Extraction completed in {(data.processingTimeMs / 1000).toFixed(1)} seconds
        </div>
      )}
    </div>
  );
}
