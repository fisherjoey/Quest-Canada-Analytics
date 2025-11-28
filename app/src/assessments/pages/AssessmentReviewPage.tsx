/**
 * Assessment Review Page
 * Review and import AI-extracted assessment data
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExtractionStatus, importExtractedAssessment } from 'wasp/client/operations';
import { useQuery } from '@tanstack/react-query';

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
          <svg className="animate-spin h-8 w-8 text-blue-600 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-gray-600">Loading extraction data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-700">{(error as Error).message}</p>
          <button
            onClick={() => navigate('/assessments/import')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Import
          </button>
        </div>
      </div>
    );
  }

  if (data?.status === 'PROCESSING') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <svg className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 className="text-xl font-semibold text-blue-900 mb-2">Extraction in Progress</h2>
          <p className="text-blue-700">AI is analyzing your PDF. This may take 1-2 minutes...</p>
        </div>
      </div>
    );
  }

  if (data?.status === 'ERROR') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Extraction Failed</h2>
          <p className="text-red-700">{data.error || 'Unknown error occurred'}</p>
          <button
            onClick={() => navigate('/assessments/import')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const extractedData = data?.data as ExtractedAssessmentData | null;

  if (!extractedData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">No Data Found</h2>
          <p className="text-yellow-700">The extraction completed but no data was found.</p>
          <button
            onClick={() => navigate('/assessments/import')}
            className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Back to Import
          </button>
        </div>
      </div>
    );
  }

  const { assessment, scores, strengths, recommendations, _confidence, _extraction_notes } = extractedData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Extracted Assessment</h1>
        <p className="text-gray-600">
          Review the AI-extracted data below. Click "Import Assessment" to save it to the database.
        </p>
      </div>

      {/* Confidence Score */}
      {_confidence && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-blue-800 font-medium">Extraction Confidence:</span>
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${
              _confidence.overall >= 0.8 ? 'bg-green-100 text-green-800' :
              _confidence.overall >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {Math.round(_confidence.overall * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Warnings */}
      {_extraction_notes?.warnings && _extraction_notes.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Warnings</h3>
          <ul className="list-disc list-inside text-yellow-700 text-sm">
            {_extraction_notes.warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Assessment Summary */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Assessment Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-500">Community</label>
            <p className="font-medium text-gray-900">{assessment.community_name}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Assessment Year</label>
            <p className="font-medium text-gray-900">{assessment.assessment_year}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Assessor</label>
            <p className="font-medium text-gray-900">{assessment.assessor_name || 'Not specified'}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Organization</label>
            <p className="font-medium text-gray-900">{assessment.assessor_organization}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Overall Score</label>
            <p className="font-medium text-gray-900">
              {assessment.overall_points_earned} / {assessment.overall_points_possible} ({assessment.overall_score}%)
            </p>
          </div>
          <div>
            <label className="text-sm text-gray-500">Assessment Date</label>
            <p className="font-medium text-gray-900">{assessment.assessment_date || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Indicator Scores */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Indicator Scores ({scores.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indicator</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Points</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scores.map((score) => (
                <tr key={score.indicator_id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{score.indicator_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{score.indicator_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-center">
                    {score.indicator_points_earned} / {score.indicator_points_possible}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      score.indicator_percentage >= 80 ? 'bg-green-100 text-green-800' :
                      score.indicator_percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
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
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Strengths ({strengths.length})</h2>
        <div className="space-y-3">
          {strengths.map((strength, i) => (
            <div key={i} className="border-l-4 border-green-500 pl-4 py-2">
              <div className="text-sm text-gray-500">Indicator {strength.indicator_id} - {strength.strength_category}</div>
              <p className="text-gray-900">{strength.strength_text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Recommendations ({recommendations.length})</h2>
        <div className="space-y-4">
          {recommendations.map((rec, i) => (
            <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-gray-500">Indicator {rec.indicator_id}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  rec.priority_level.toLowerCase().includes('high') ? 'bg-red-100 text-red-800' :
                  rec.priority_level.toLowerCase().includes('low') ? 'bg-gray-100 text-gray-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {rec.priority_level}
                </span>
              </div>
              <p className="text-gray-900 mb-1">{rec.recommendation_text}</p>
              <div className="text-sm text-gray-500">
                Lead: {rec.lead_party} | Timeframe: {rec.estimated_timeframe}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import Error */}
      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-700">{importError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
        <button
          onClick={() => navigate('/assessments/import')}
          className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleImport}
          disabled={isImporting}
          className="px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isImporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importing...
            </>
          ) : (
            'Import Assessment'
          )}
        </button>
      </div>

      {/* Processing Time */}
      {data?.processingTimeMs && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Extraction completed in {(data.processingTimeMs / 1000).toFixed(1)} seconds
        </div>
      )}
    </div>
  );
}
