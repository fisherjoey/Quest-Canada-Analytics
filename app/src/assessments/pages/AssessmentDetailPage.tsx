import React, { useState } from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessment } from "wasp/client/operations";
import { Link } from "wasp/client/router";
import { useParams } from "react-router-dom";
import { AssessmentDashboard } from "../components/AssessmentDashboard";
import { generateAssessmentPDF } from "../pdfExport";

type TabType = 'overview' | 'dashboard' | 'data';
type DataSection = 'indicators' | 'strengths' | 'recommendations';

// Calculate percentage score from raw points
const getPercentageScore = (assessment: any): number => {
  if (!assessment.overallScore || !assessment.maxPossibleScore) {
    return 0;
  }
  return Math.round((assessment.overallScore / assessment.maxPossibleScore) * 100);
};

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
        <div className="text-destructive">No assessment ID provided</div>
        <Link to="/assessments" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Assessments
        </Link>
      </div>
    );
  }
  const { data: assessment, isLoading, error } = useQuery(getAssessment, { id: id! }, { enabled: !!id });

  if (isLoading) {
    return <div className="p-8 text-foreground">Loading assessment...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading assessment: {error.message}</div>;
  }

  if (!assessment) {
    return <div className="p-8 text-foreground">Assessment not found</div>;
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
        <Link to="/assessments" className="text-primary hover:text-primary/80 transition-colors">
          ← Back to Assessments
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow p-6 border border-border">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{assessment.community?.name || "Assessment"}</h1>
            <p className="text-muted-foreground mt-2">
              Year: {assessment.assessmentYear} | Created: {new Date(assessment.createdAt).toLocaleDateString()}
            </p>
            {assessment.overallScore !== undefined && assessment.maxPossibleScore && (
              <p className="text-lg font-semibold text-primary mt-1">
                Overall Score: {getPercentageScore(assessment)}%
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="bg-success text-success-foreground px-4 py-2 rounded hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
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
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
              <h2 className="text-lg font-semibold mb-3 text-foreground">Assessor Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium text-foreground">{assessment.assessorName || 'N/A'}</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">Organization</p>
                  <p className="font-medium text-foreground">{assessment.assessorOrganization || 'N/A'}</p>
                </div>
                <div className="bg-muted p-4 rounded">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium text-foreground">{assessment.assessorEmail || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3 text-foreground">Summary</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded text-center border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{assessment.indicators?.length || 0}</p>
                  <p className="text-sm text-primary">Indicators</p>
                </div>
                <div className="bg-success/10 dark:bg-success/20 p-4 rounded text-center border border-success/20">
                  <p className="text-2xl font-bold text-success">{assessment.strengths?.length || 0}</p>
                  <p className="text-sm text-success">Strengths</p>
                </div>
                <div className="bg-warning/10 dark:bg-warning/20 p-4 rounded text-center border border-warning/20">
                  <p className="text-2xl font-bold text-warning">{assessment.recommendations?.length || 0}</p>
                  <p className="text-sm text-warning">Recommendations</p>
                </div>
                <div className="bg-secondary/10 dark:bg-secondary/20 p-4 rounded text-center border border-secondary/20">
                  <p className="text-2xl font-bold text-secondary">{getPercentageScore(assessment)}%</p>
                  <p className="text-sm text-secondary">Overall Score</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {assessment.generalNotes && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-foreground">Notes</h2>
                <div className="bg-muted p-4 rounded">
                  <p className="text-muted-foreground whitespace-pre-wrap">{assessment.generalNotes}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div>
            <AssessmentDashboard assessment={assessment} />
          </div>
        )}

        {activeTab === 'data' && (
          <div className="space-y-4">
            {/* Indicator Scores Accordion */}
            {assessment.indicators && assessment.indicators.length > 0 && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('indicators')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 dark:hover:bg-primary/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-primary transition-transform ${expandedSections.has('indicators') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-primary">Indicator Scores</h2>
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-sm font-medium">
                      {assessment.indicators.length}
                    </span>
                  </div>
                </button>
                {expandedSections.has('indicators') && (
                  <div className="p-4 bg-card">
                    <div className="grid gap-2">
                      {assessment.indicators.map((score: any) => (
                        <div key={score.id} className="flex justify-between items-center p-3 bg-muted rounded hover:bg-accent transition">
                          <span>
                            <span className="font-medium text-foreground">#{score.indicatorNumber}</span>
                            <span className="text-muted-foreground ml-2">{score.indicatorName}</span>
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">
                              {score.pointsEarned}/{score.pointsPossible}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              score.percentageScore >= 70 ? 'bg-success/20 text-success' :
                              score.percentageScore >= 50 ? 'bg-warning/20 text-warning' :
                              'bg-destructive/20 text-destructive'
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
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('strengths')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-success/10 dark:bg-success/20 hover:bg-success/20 dark:hover:bg-success/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-success transition-transform ${expandedSections.has('strengths') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-success">Strengths</h2>
                    <span className="bg-success/20 text-success px-2 py-0.5 rounded-full text-sm font-medium">
                      {assessment.strengths.length}
                    </span>
                  </div>
                </button>
                {expandedSections.has('strengths') && (
                  <div className="p-4 bg-card">
                    <div className="space-y-3">
                      {assessment.strengths.map((strength: any) => (
                        <div key={strength.id} className="border-l-4 border-success pl-4 py-2 bg-muted rounded-r">
                          <p className="text-foreground">{strength.description}</p>
                          {strength.category && (
                            <span className="inline-block mt-2 text-xs text-success bg-success/20 px-2 py-0.5 rounded">
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
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection('recommendations')}
                  className="w-full px-5 py-4 flex items-center justify-between bg-warning/10 dark:bg-warning/20 hover:bg-warning/20 dark:hover:bg-warning/30 transition"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 text-warning transition-transform ${expandedSections.has('recommendations') ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <h2 className="text-xl font-semibold text-warning">Recommendations</h2>
                    <span className="bg-warning/20 text-warning px-2 py-0.5 rounded-full text-sm font-medium">
                      {assessment.recommendations.length}
                    </span>
                  </div>
                </button>
                {expandedSections.has('recommendations') && (
                  <div className="p-4 bg-card">
                    <div className="space-y-3">
                      {assessment.recommendations.map((recommendation: any) => (
                        <div key={recommendation.id} className="border-l-4 border-warning pl-4 py-3 bg-muted rounded-r">
                          <div className="flex items-center gap-2 mb-2">
                            {recommendation.indicatorNumber && (
                              <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded border border-border">
                                Indicator #{recommendation.indicatorNumber}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              recommendation.priorityLevel === 'HIGH' ? 'bg-destructive/20 text-destructive' :
                              recommendation.priorityLevel === 'LOW' ? 'bg-muted text-muted-foreground' :
                              'bg-warning/20 text-warning'
                            }`}>
                              {recommendation.priorityLevel}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              recommendation.implementationStatus === 'COMPLETED' ? 'bg-success/20 text-success' :
                              recommendation.implementationStatus === 'IN_PROGRESS' ? 'bg-primary/20 text-primary' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {recommendation.implementationStatus}
                            </span>
                          </div>
                          <p className="text-foreground">{recommendation.recommendationText}</p>
                          {recommendation.responsibleParty && (
                            <p className="text-sm text-muted-foreground mt-2">
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
