import React, { useState } from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessment } from "wasp/client/operations";
import { Link } from "wasp/client/router";
import { useParams } from "react-router-dom";
import { GrafanaDashboard } from "../../dashboards/GrafanaDashboard";
import { generateAssessmentPDF } from "../pdfExport";

type TabType = 'overview' | 'dashboard' | 'data';
type DataSection = 'indicators' | 'strengths' | 'recommendations';

export default function AssessmentDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<DataSection>>(new Set(['indicators', 'strengths', 'recommendations']));

  const toggleSection = (section: DataSection) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (!id) {
    return (
      <div className="p-8">
        <div className="text-red-600">No assessment ID provided</div>
        <Link to="/assessments" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Assessments
        </Link>
      </div>
    );
  }
  const { data: assessment, isLoading, error } = useQuery(getAssessment, { id: id! }, { enabled: !!id });

  if (isLoading) {
    return <div className="p-8">Loading assessment...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading assessment: {error.message}</div>;
  }

  if (!assessment) {
    return <div className="p-8">Assessment not found</div>;
  }

  const editLink = `/assessments/${assessment.id}/edit`;

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'data', label: 'Data' },
  ];

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generateAssessmentPDF(assessment);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/assessments" className="text-blue-600 hover:text-blue-800">
          ← Back to Assessments
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{assessment.community?.name || "Assessment"}</h1>
            <p className="text-gray-600 mt-2">
              Year: {assessment.assessmentYear} | Created: {new Date(assessment.createdAt).toLocaleDateString()}
            </p>
            {assessment.overallScore !== undefined && (
              <p className="text-lg font-semibold text-blue-600 mt-1">
                Overall Score: {assessment.overallScore}%
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExporting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                  Export PDF
                </>
              )}
            </button>
            <Link
              to={editLink as any}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex gap-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-6 rounded-lg font-semibold text-base transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            {/* Assessor Information */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Assessor Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium">{assessment.assessorName || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-500">Organization</p>
                  <p className="font-medium">{assessment.assessorOrganization || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{assessment.assessorEmail || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded text-center">
                  <p className="text-2xl font-bold text-blue-600">{assessment.indicators?.length || 0}</p>
                  <p className="text-sm text-blue-700">Indicators</p>
                </div>
                <div className="bg-green-50 p-4 rounded text-center">
                  <p className="text-2xl font-bold text-green-600">{assessment.strengths?.length || 0}</p>
                  <p className="text-sm text-green-700">Strengths</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded text-center">
                  <p className="text-2xl font-bold text-yellow-600">{assessment.recommendations?.length || 0}</p>
                  <p className="text-sm text-yellow-700">Recommendations</p>
                </div>
                <div className="bg-purple-50 p-4 rounded text-center">
                  <p className="text-2xl font-bold text-purple-600">{assessment.overallScore || 0}%</p>
                  <p className="text-sm text-purple-700">Overall Score</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {assessment.generalNotes && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Notes</h2>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-700 whitespace-pre-wrap">{assessment.generalNotes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <GrafanaDashboard
              dashboardUid="assessment-detail"
              urlParams={{ 'var-assessment_id': assessment.id }}
              kiosk={true}
            />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Indicator Scores Accordion */}
            {assessment.indicators && assessment.indicators.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('indicators')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-blue-50 hover:bg-blue-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-blue-600 transition-transform ${expandedSections.has('indicators') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-blue-900">Indicator Scores</h2>
                    <span className="bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full text-sm font-medium">
                      {assessment.indicators.length}
                    </span>
                  </div>
                </button>
                {expandedSections.has('indicators') && (
                  <div className="p-4 bg-white">
                    <div className="grid gap-2">
                      {assessment.indicators.map((score: any) => (
                        <div key={score.id} className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 transition">
                          <span>
                            <span className="font-medium text-gray-900">#{score.indicatorNumber}</span>
                            <span className="text-gray-600 ml-2">{score.indicatorName}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">
                              {score.pointsEarned}/{score.pointsPossible}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              score.percentageScore >= 70 ? 'bg-green-100 text-green-800' :
                              score.percentageScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {Math.round(score.percentageScore)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Strengths Accordion */}
            {assessment.strengths && assessment.strengths.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('strengths')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-green-50 hover:bg-green-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-green-600 transition-transform ${expandedSections.has('strengths') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-green-900">Strengths</h2>
                    <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded-full text-sm font-medium">
                      {assessment.strengths.length}
                    </span>
                  </div>
                </button>
                {expandedSections.has('strengths') && (
                  <div className="p-4 bg-white">
                    <div className="space-y-3">
                      {assessment.strengths.map((strength: any) => (
                        <div key={strength.id} className="border-l-4 border-green-500 pl-4 py-2 bg-gray-50 rounded-r">
                          <p className="text-gray-900">{strength.description}</p>
                          {strength.category && (
                            <span className="inline-block mt-2 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded">
                              {strength.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Accordion */}
            {assessment.recommendations && assessment.recommendations.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-yellow-50 hover:bg-yellow-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-yellow-600 transition-transform ${expandedSections.has('recommendations') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-yellow-900">Recommendations</h2>
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full text-sm font-medium">
                      {assessment.recommendations.length}
                    </span>
                  </div>
                </button>
                {expandedSections.has('recommendations') && (
                  <div className="p-4 bg-white">
                    <div className="space-y-3">
                      {assessment.recommendations.map((recommendation: any) => (
                        <div key={recommendation.id} className="border-l-4 border-yellow-500 pl-4 py-3 bg-gray-50 rounded-r">
                          <div className="flex items-center gap-2 mb-2">
                            {recommendation.indicatorNumber && (
                              <span className="text-sm text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                Indicator #{recommendation.indicatorNumber}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              recommendation.priorityLevel === 'HIGH' ? 'bg-red-100 text-red-800' :
                              recommendation.priorityLevel === 'LOW' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {recommendation.priorityLevel}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              recommendation.implementationStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              recommendation.implementationStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {recommendation.implementationStatus}
                            </span>
                          </div>
                          <p className="text-gray-900">{recommendation.recommendationText}</p>
                          {recommendation.responsibleParty && (
                            <p className="text-sm text-gray-500 mt-2">
                              <span className="font-medium">Responsible:</span> {recommendation.responsibleParty}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
