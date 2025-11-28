/**
 * Assessment Import Page
 * AI-powered PDF import for Quest Canada Benchmark Assessments
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { extractAssessmentFromPDF, getExtractionStatus } from 'wasp/client/operations';

export default function AssessmentImportPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const pollExtractionStatus = async (logId: string) => {
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    let attempts = 0;
    const startTime = Date.now();

    // Start timer that updates every second
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
      // Simulate progress: reach 90% at 2 minutes, then hold until completion
      const estimatedProgress = Math.min(90, (elapsed / 120) * 90);
      setExtractionProgress(estimatedProgress);
    }, 1000);

    while (attempts < maxAttempts) {
      try {
        const status = await getExtractionStatus({ extractionLogId: logId });

        if (status.status === 'COMPLETED') {
          clearInterval(timer);
          setExtractionProgress(100);
          setIsExtracting(false);

          // Navigate to review page
          navigate(`/assessments/review/${logId}`);
          return;
        } else if (status.status === 'ERROR') {
          clearInterval(timer);
          throw new Error(status.error || 'Extraction failed');
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (err: any) {
        clearInterval(timer);
        setError(err.message || 'Failed to check extraction status');
        setIsExtracting(false);
        setExtractionProgress(0);
        setElapsedTime(0);
        return;
      }
    }

    // Timeout
    clearInterval(timer);
    setError('Extraction timed out. Please try again.');
    setIsExtracting(false);
    setExtractionProgress(0);
    setElapsedTime(0);
  };

  const handleExtract = async () => {
    if (!file) return;

    setIsExtracting(true);
    setError(null);
    setExtractionProgress(0);
    setElapsedTime(0);

    try {
      const base64 = await fileToBase64(file);
      const result = await extractAssessmentFromPDF({ pdfBase64: base64, fileName: file.name });

      // Start polling for status
      if (result.extractionLogId) {
        await pollExtractionStatus(result.extractionLogId);
      } else {
        throw new Error('No extraction log ID returned');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start assessment extraction');
      console.error('Extraction error:', err);
      setIsExtracting(false);
      setExtractionProgress(0);
      setElapsedTime(0);
    }
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
        <h2 className="text-xl font-semibold mb-4">Upload PDF</h2>
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

        {file && (
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

      {/* Extraction Progress Modal */}
      {isExtracting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <svg className="animate-spin mx-auto h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Extracting Assessment Data</h3>
              <p className="text-gray-600 mb-6">AI is analyzing your PDF document...</p>
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{Math.round(extractionProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${extractionProgress}%` }}></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')} elapsed</span>
              </div>
              <p className="mt-4 text-xs text-gray-500">This typically takes 1-2 minutes</p>
            </div>
          </div>
        </div>
      )}
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
