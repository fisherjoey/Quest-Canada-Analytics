/**
 * Assessment Import Page
 * AI-powered PDF import for Quest Canada Benchmark Assessments
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractAssessmentFromPDF, importExtractedAssessment } from 'wasp/client/operations';
import type { ExtractedAssessmentData } from '../aiExtraction';

export default function AssessmentImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedAssessmentData | null>(null);
  const [extractionLogId, setExtractionLogId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Partial<ExtractedAssessmentData['assessment']>>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);

    try {
      const base64 = await fileToBase64(file);
      const result = await extractAssessmentFromPDF({ pdfBase64: base64, fileName: file.name });
      setExtractedData(result.data);
      setExtractionLogId(result.extractionLogId);
    } catch (err: any) {
      setError(err.message || 'Failed to extract assessment data');
      console.error('Extraction error:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImport = async () => {
    if (!extractedData || !extractionLogId) return;

    setIsImporting(true);
    setError(null);

    try {
      const result = await importExtractedAssessment({
        extractionLogId,
        extractedData,
        overrides: editedData,
      });
      navigate(`/assessments/${result.assessmentId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to import assessment');
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleFieldEdit = (field: keyof ExtractedAssessmentData['assessment'], value: any) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Assessment from PDF</h1>
        <p className="text-gray-600">
          Upload a Quest Canada Benchmark Assessment PDF to automatically extract assessment data using AI.
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Upload PDF</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
            disabled={isExtracting}
          />
          <label
            htmlFor="pdf-upload"
            className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Choose PDF File
          </label>
          {file && (
            <div className="mt-4 text-sm text-gray-600">
              Selected: <span className="font-medium">{file.name}</span> ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </div>
          )}
        </div>

        {file && !extractedData && (
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="mt-4 w-full bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Extracting Data with AI...
              </>
            ) : (
              <>Extract Assessment Data</>
            )}
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Extracted Data Preview */}
      {extractedData && (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">2. Review Extracted Data</h2>
              <ConfidenceBadge score={extractedData._confidence.overall} />
            </div>
          </div>

          {/* Assessment Metadata */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Assessment Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <EditableField
                label="Community Name"
                value={editedData.community_name ?? extractedData.assessment.community_name}
                confidence={extractedData._confidence.fields.community_name}
                onChange={(value) => handleFieldEdit('community_name', value)}
              />
              <EditableField
                label="Assessment Year"
                value={editedData.assessment_year ?? extractedData.assessment.assessment_year}
                confidence={extractedData._confidence.fields.assessment_year}
                onChange={(value) => handleFieldEdit('assessment_year', parseInt(value))}
                type="number"
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600">Overall Score</p>
                <p className="text-2xl font-bold text-gray-900">{extractedData.assessment.overall_score}%</p>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600">Points Earned</p>
                <p className="text-2xl font-bold text-gray-900">{extractedData.assessment.overall_points_earned}</p>
              </div>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-sm text-gray-600">Points Possible</p>
                <p className="text-2xl font-bold text-gray-900">{extractedData.assessment.overall_points_possible}</p>
              </div>
            </div>
          </div>

          {/* Indicator Scores */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Indicator Scores ({extractedData.scores.length})</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Indicator</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Score</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {extractedData.scores.map((score) => (
                    <tr key={score.indicator_id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{score.indicator_id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{score.indicator_name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">{score.indicator_percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import Button */}
          <div className="bg-white rounded-lg shadow p-6">
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isImporting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importing to Database...
                </>
              ) : (
                <>Import Assessment</>
              )}
            </button>
            <p className="mt-2 text-sm text-center text-gray-500">
              This will create a new assessment with {extractedData.scores.length} indicators,{' '}
              {extractedData.strengths.length} strengths, and {extractedData.recommendations.length} recommendations.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// Helper Components

function ConfidenceBadge({ score }: { score: number }) {
  const percentage = Math.round(score * 100);
  const color = score >= 0.9 ? 'green' : score >= 0.7 ? 'yellow' : 'red';

  const colorClasses = {
    green: 'bg-green-100 text-green-800 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClasses[color]}`}>
      Confidence: {percentage}%
    </div>
  );
}

function EditableField({
  label,
  value,
  confidence,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  confidence: number;
  onChange: (value: string) => void;
  type?: string;
}) {
  const lowConfidence = confidence < 0.7;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {lowConfidence && (
          <span className="ml-2 text-xs text-yellow-600">(Low confidence - please verify)</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          lowConfidence ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
        }`}
      />
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}
