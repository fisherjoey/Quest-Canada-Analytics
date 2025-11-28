/**
 * Analytics Dashboard Page - Quest Canada
 *
 * Interactive Tableau-style dashboard for comparing assessments
 * Features:
 * - Multi-community comparison
 * - Year-over-year progress tracking
 * - Indicator deep-dive analysis
 * - Cross-filtering between charts
 */

import React, { useState, useMemo } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAssessments } from 'wasp/client/operations';
import { AssessmentSelector } from './components/AssessmentSelector';
import { RadarComparisonChart } from './components/RadarComparisonChart';
import { BarComparisonChart } from './components/BarComparisonChart';
import { TrendLineChart } from './components/TrendLineChart';
import { RecommendationsPieChart } from './components/RecommendationsPieChart';
import { KPICards } from './components/KPICards';
import { IndicatorHeatmap } from './components/IndicatorHeatmap';
import { LayoutGrid, TrendingUp, Target, BarChart3, Filter, X } from 'lucide-react';

// Dashboard template types
type DashboardTemplate = 'community-comparison' | 'year-over-year' | 'indicator-deep-dive';

interface SelectedAssessment {
  id: string;
  communityName: string;
  year: number;
  color: string;
}

// Color palette for comparing assessments
const COMPARISON_COLORS = [
  '#00a9a6', // Quest teal
  '#e74c3c', // Red
  '#3498db', // Blue
  '#9b59b6', // Purple
  '#f39c12', // Orange
  '#1abc9c', // Turquoise
  '#e91e63', // Pink
  '#795548', // Brown
];

export function AnalyticsDashboardPage() {
  const { data: assessments, isLoading, error } = useQuery(getAssessments);

  // Dashboard state
  const [activeTemplate, setActiveTemplate] = useState<DashboardTemplate>('community-comparison');
  const [selectedAssessments, setSelectedAssessments] = useState<SelectedAssessment[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(true);

  // Process assessments for selection
  const assessmentOptions = useMemo(() => {
    if (!assessments) return [];
    return assessments.map((a: any) => ({
      id: a.id,
      communityName: a.community?.name || 'Unknown',
      year: a.assessmentYear,
      overallScore: a.overallScore,
      status: a.status,
    }));
  }, [assessments]);

  // Get full assessment data for selected assessments
  const selectedAssessmentData = useMemo(() => {
    if (!assessments || selectedAssessments.length === 0) return [];
    return selectedAssessments
      .map(sel => {
        const full = assessments.find((a: any) => a.id === sel.id);
        return full ? { ...full, color: sel.color } : null;
      })
      .filter(Boolean);
  }, [assessments, selectedAssessments]);

  // Handle assessment selection
  const handleSelectAssessment = (assessment: any) => {
    if (selectedAssessments.find(s => s.id === assessment.id)) {
      // Already selected - remove it
      setSelectedAssessments(prev => prev.filter(s => s.id !== assessment.id));
    } else if (selectedAssessments.length < 8) {
      // Add new selection
      const nextColor = COMPARISON_COLORS[selectedAssessments.length % COMPARISON_COLORS.length];
      setSelectedAssessments(prev => [
        ...prev,
        {
          id: assessment.id,
          communityName: assessment.communityName,
          year: assessment.year,
          color: nextColor,
        },
      ]);
    }
  };

  const handleClearSelection = () => {
    setSelectedAssessments([]);
  };

  // Templates configuration
  const templates: { id: DashboardTemplate; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: 'community-comparison',
      label: 'Community Comparison',
      icon: <LayoutGrid size={20} />,
      description: 'Compare multiple communities\' assessments side-by-side',
    },
    {
      id: 'year-over-year',
      label: 'Year-over-Year',
      icon: <TrendingUp size={20} />,
      description: 'Track progress over time for selected communities',
    },
    {
      id: 'indicator-deep-dive',
      label: 'Indicator Analysis',
      icon: <Target size={20} />,
      description: 'Deep-dive into specific indicators across all assessments',
    },
  ];

  if (isLoading) {
    return (
      <div className="analytics-dashboard loading">
        <div className="loading-spinner">Loading assessments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-dashboard error">
        <div className="error-message">Error loading assessments: {(error as Error).message}</div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>
            <BarChart3 size={32} />
            Assessment Analytics
          </h1>
          <p>Compare assessments, track progress, and analyze indicator performance</p>
        </div>
        <button
          className="toggle-selector-btn"
          onClick={() => setShowSelector(!showSelector)}
        >
          <Filter size={18} />
          {showSelector ? 'Hide' : 'Show'} Selector
        </button>
      </div>

      {/* Template Tabs */}
      <div className="template-tabs">
        {templates.map(template => (
          <button
            key={template.id}
            className={`template-tab ${activeTemplate === template.id ? 'active' : ''}`}
            onClick={() => setActiveTemplate(template.id)}
          >
            {template.icon}
            <span className="tab-label">{template.label}</span>
          </button>
        ))}
      </div>

      {/* Template Description */}
      <div className="template-description">
        <p>{templates.find(t => t.id === activeTemplate)?.description}</p>
      </div>

      <div className="dashboard-layout">
        {/* Assessment Selector Panel */}
        {showSelector && (
          <div className="selector-panel">
            <div className="selector-header">
              <h3>Select Assessments</h3>
              {selectedAssessments.length > 0 && (
                <button className="clear-btn" onClick={handleClearSelection}>
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>

            {/* Selected Assessments Chips */}
            {selectedAssessments.length > 0 && (
              <div className="selected-chips">
                {selectedAssessments.map(sel => (
                  <div
                    key={sel.id}
                    className="selected-chip"
                    style={{ borderColor: sel.color, backgroundColor: `${sel.color}15` }}
                  >
                    <span className="color-dot" style={{ backgroundColor: sel.color }} />
                    <span>{sel.communityName} ({sel.year})</span>
                    <button onClick={() => handleSelectAssessment(sel)}>
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <AssessmentSelector
              assessments={assessmentOptions}
              selectedIds={selectedAssessments.map(s => s.id)}
              onSelect={handleSelectAssessment}
              template={activeTemplate}
            />
          </div>
        )}

        {/* Dashboard Content */}
        <div className={`dashboard-content ${!showSelector ? 'full-width' : ''}`}>
          {selectedAssessmentData.length === 0 ? (
            <div className="empty-state">
              <BarChart3 size={64} />
              <h2>Select Assessments to Compare</h2>
              <p>Choose one or more assessments from the selector panel to visualize their data</p>
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <KPICards assessments={selectedAssessmentData} />

              {/* Dashboard Template Content */}
              {activeTemplate === 'community-comparison' && (
                <CommunityComparisonDashboard
                  assessments={selectedAssessmentData}
                  selectedIndicator={selectedIndicator}
                  onIndicatorSelect={setSelectedIndicator}
                />
              )}

              {activeTemplate === 'year-over-year' && (
                <YearOverYearDashboard
                  assessments={selectedAssessmentData}
                  allAssessments={assessments || []}
                />
              )}

              {activeTemplate === 'indicator-deep-dive' && (
                <IndicatorDeepDiveDashboard
                  assessments={selectedAssessmentData}
                  selectedIndicator={selectedIndicator}
                  onIndicatorSelect={setSelectedIndicator}
                />
              )}
            </>
          )}
        </div>
      </div>

      <style>{analyticsStyles}</style>
    </div>
  );
}

// Community Comparison Dashboard Template
function CommunityComparisonDashboard({
  assessments,
  selectedIndicator,
  onIndicatorSelect
}: {
  assessments: any[];
  selectedIndicator: number | null;
  onIndicatorSelect: (indicator: number | null) => void;
}) {
  return (
    <div className="dashboard-grid community-comparison">
      {/* Radar Chart - Full width */}
      <div className="chart-card span-full">
        <h3>Indicator Comparison (Radar)</h3>
        <RadarComparisonChart
          assessments={assessments}
          onIndicatorClick={onIndicatorSelect}
        />
      </div>

      {/* Bar Chart - Half width */}
      <div className="chart-card span-half">
        <h3>Overall Scores</h3>
        <BarComparisonChart
          assessments={assessments}
          dataKey="overallScore"
          label="Overall Score"
        />
      </div>

      {/* Recommendations Pie - Half width */}
      <div className="chart-card span-half">
        <h3>Recommendations by Priority</h3>
        <RecommendationsPieChart assessments={assessments} />
      </div>

      {/* Indicator Heatmap - Full width */}
      <div className="chart-card span-full">
        <h3>Indicator Performance Heatmap</h3>
        <IndicatorHeatmap
          assessments={assessments}
          selectedIndicator={selectedIndicator}
          onIndicatorClick={onIndicatorSelect}
        />
      </div>
    </div>
  );
}

// Year-over-Year Dashboard Template
function YearOverYearDashboard({
  assessments,
  allAssessments
}: {
  assessments: any[];
  allAssessments: any[];
}) {
  // Group assessments by community for trend analysis
  const communityTrends = useMemo(() => {
    const communities = [...new Set(assessments.map(a => a.community?.id))];

    return communities.map(communityId => {
      const communityAssessments = allAssessments
        .filter((a: any) => a.community?.id === communityId)
        .sort((a: any, b: any) => a.assessmentYear - b.assessmentYear);

      const selected = assessments.find(a => a.community?.id === communityId);

      return {
        communityId,
        communityName: selected?.community?.name || 'Unknown',
        color: selected?.color || '#999',
        assessments: communityAssessments,
      };
    });
  }, [assessments, allAssessments]);

  return (
    <div className="dashboard-grid year-over-year">
      {/* Trend Line Chart - Full width */}
      <div className="chart-card span-full">
        <h3>Overall Score Trends</h3>
        <TrendLineChart
          communityTrends={communityTrends}
          dataKey="overallScore"
          label="Overall Score"
        />
      </div>

      {/* Individual Indicator Trends */}
      <div className="chart-card span-half">
        <h3>Governance Indicator Trend</h3>
        <TrendLineChart
          communityTrends={communityTrends}
          indicatorNumber={1}
          label="Governance Score"
        />
      </div>

      <div className="chart-card span-half">
        <h3>Capacity Indicator Trend</h3>
        <TrendLineChart
          communityTrends={communityTrends}
          indicatorNumber={2}
          label="Capacity Score"
        />
      </div>

      {/* Progress Summary */}
      <div className="chart-card span-full">
        <h3>Year-over-Year Change</h3>
        <BarComparisonChart
          assessments={assessments}
          dataKey="yearOverYearChange"
          label="Score Change (%)"
          showChange={true}
        />
      </div>
    </div>
  );
}

// Indicator Deep-Dive Dashboard Template
function IndicatorDeepDiveDashboard({
  assessments,
  selectedIndicator,
  onIndicatorSelect
}: {
  assessments: any[];
  selectedIndicator: number | null;
  onIndicatorSelect: (indicator: number | null) => void;
}) {
  const indicatorNames = [
    'Governance',
    'Capacity',
    'Planning',
    'Infrastructure',
    'Operations',
    'Buildings',
    'Transportation',
    'Waste',
    'Energy',
    'Other'
  ];

  return (
    <div className="dashboard-grid indicator-deep-dive">
      {/* Indicator Selector */}
      <div className="chart-card span-full indicator-selector-card">
        <h3>Select an Indicator to Analyze</h3>
        <div className="indicator-buttons">
          {indicatorNames.map((name, idx) => (
            <button
              key={idx}
              className={`indicator-btn ${selectedIndicator === idx + 1 ? 'active' : ''}`}
              onClick={() => onIndicatorSelect(selectedIndicator === idx + 1 ? null : idx + 1)}
            >
              <span className="indicator-num">{idx + 1}</span>
              <span className="indicator-name">{name}</span>
            </button>
          ))}
        </div>
      </div>

      {selectedIndicator ? (
        <>
          {/* Selected Indicator Bar Chart */}
          <div className="chart-card span-half">
            <h3>Indicator {selectedIndicator}: {indicatorNames[selectedIndicator - 1]} Scores</h3>
            <BarComparisonChart
              assessments={assessments}
              indicatorNumber={selectedIndicator}
              label={indicatorNames[selectedIndicator - 1]}
            />
          </div>

          {/* Indicator Details */}
          <div className="chart-card span-half">
            <h3>Indicator Notes & Evidence</h3>
            <div className="indicator-details">
              {assessments.map((assessment: any) => {
                const indicator = assessment.indicators?.find(
                  (i: any) => i.indicatorNumber === selectedIndicator
                );
                return (
                  <div
                    key={assessment.id}
                    className="indicator-detail-item"
                    style={{ borderLeftColor: assessment.color }}
                  >
                    <div className="detail-header">
                      <span className="community-name">{assessment.community?.name}</span>
                      <span className="score-badge">
                        {indicator?.pointsEarned || 0} / {indicator?.pointsPossible || 10} pts
                      </span>
                    </div>
                    {indicator?.notes && (
                      <p className="detail-notes">{indicator.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Related Recommendations */}
          <div className="chart-card span-full">
            <h3>Related Recommendations (Indicator {selectedIndicator})</h3>
            <div className="recommendations-list">
              {assessments.flatMap((assessment: any) =>
                (assessment.recommendations || [])
                  .filter((r: any) => r.indicatorNumber === selectedIndicator)
                  .map((rec: any) => (
                    <div
                      key={rec.id}
                      className="recommendation-item"
                      style={{ borderLeftColor: assessment.color }}
                    >
                      <div className="rec-header">
                        <span className="community-badge" style={{ backgroundColor: assessment.color }}>
                          {assessment.community?.name}
                        </span>
                        <span className={`priority-badge priority-${rec.priorityLevel?.toLowerCase()}`}>
                          {rec.priorityLevel}
                        </span>
                        <span className={`status-badge status-${rec.implementationStatus?.toLowerCase()?.replace('_', '-')}`}>
                          {rec.implementationStatus?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="rec-text">{rec.recommendationText}</p>
                    </div>
                  ))
              )}
              {assessments.every((a: any) =>
                !(a.recommendations || []).some((r: any) => r.indicatorNumber === selectedIndicator)
              ) && (
                <p className="no-data">No recommendations found for this indicator</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="chart-card span-full">
          <div className="empty-indicator-state">
            <Target size={48} />
            <p>Select an indicator above to see detailed analysis</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Styles
const analyticsStyles = `
  .analytics-dashboard {
    max-width: 1800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .analytics-dashboard.loading,
  .analytics-dashboard.error {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .loading-spinner {
    color: #666;
    font-size: 18px;
  }

  .error-message {
    color: #e74c3c;
    font-size: 16px;
  }

  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
  }

  .header-content h1 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    color: #333;
    margin: 0 0 8px 0;
  }

  .header-content p {
    color: #666;
    font-size: 16px;
    margin: 0;
  }

  .toggle-selector-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 2px solid #00a9a6;
    border-radius: 8px;
    color: #00a9a6;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-selector-btn:hover {
    background: #00a9a6;
    color: white;
  }

  /* Template Tabs */
  .template-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
  }

  .template-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }

  .template-tab:hover {
    border-color: #00a9a6;
    color: #00a9a6;
  }

  .template-tab.active {
    background: #00a9a6;
    border-color: #00a9a6;
    color: white;
  }

  .template-description {
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-left: 4px solid #00a9a6;
    border-radius: 0 8px 8px 0;
  }

  .template-description p {
    margin: 0;
    color: #666;
  }

  /* Layout */
  .dashboard-layout {
    display: flex;
    gap: 24px;
  }

  .selector-panel {
    width: 320px;
    flex-shrink: 0;
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    max-height: calc(100vh - 280px);
    overflow-y: auto;
  }

  .selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .selector-header h3 {
    margin: 0;
    font-size: 16px;
    color: #333;
  }

  .clear-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    background: #fee;
    border: none;
    border-radius: 4px;
    color: #e74c3c;
    font-size: 12px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .clear-btn:hover {
    background: #fdd;
  }

  .selected-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }

  .selected-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    border: 2px solid;
    border-radius: 20px;
    font-size: 12px;
  }

  .selected-chip .color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .selected-chip button {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    opacity: 0.6;
    display: flex;
  }

  .selected-chip button:hover {
    opacity: 1;
  }

  /* Dashboard Content */
  .dashboard-content {
    flex: 1;
    min-width: 0;
  }

  .dashboard-content.full-width {
    width: 100%;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    background: white;
    border-radius: 12px;
    text-align: center;
    color: #999;
  }

  .empty-state h2 {
    margin: 20px 0 8px 0;
    color: #666;
  }

  .empty-state p {
    margin: 0;
  }

  /* Dashboard Grid */
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .chart-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .chart-card h3 {
    margin: 0 0 16px 0;
    font-size: 16px;
    color: #333;
  }

  .chart-card.span-full {
    grid-column: 1 / -1;
  }

  .chart-card.span-half {
    grid-column: span 1;
  }

  /* Indicator Selector */
  .indicator-selector-card {
    padding: 24px;
  }

  .indicator-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .indicator-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: #f5f5f5;
    border: 2px solid transparent;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .indicator-btn:hover {
    background: #eef;
    border-color: #00a9a6;
  }

  .indicator-btn.active {
    background: #00a9a6;
    border-color: #00a9a6;
    color: white;
  }

  .indicator-btn .indicator-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: rgba(0,0,0,0.1);
    border-radius: 50%;
    font-weight: 600;
    font-size: 12px;
  }

  .indicator-btn.active .indicator-num {
    background: rgba(255,255,255,0.3);
  }

  .indicator-btn .indicator-name {
    font-size: 14px;
    font-weight: 500;
  }

  /* Indicator Details */
  .indicator-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .indicator-detail-item {
    padding: 12px 16px;
    border-left: 4px solid #ccc;
    background: #f9f9f9;
    border-radius: 0 8px 8px 0;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .community-name {
    font-weight: 600;
    color: #333;
  }

  .score-badge {
    padding: 4px 10px;
    background: #e8f5f5;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    color: #00a9a6;
  }

  .detail-notes {
    margin: 0;
    font-size: 14px;
    color: #666;
    line-height: 1.5;
  }

  /* Recommendations List */
  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
  }

  .recommendation-item {
    padding: 16px;
    border-left: 4px solid #ccc;
    background: #f9f9f9;
    border-radius: 0 8px 8px 0;
  }

  .rec-header {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 10px;
  }

  .community-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    color: white;
  }

  .priority-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
  }

  .priority-badge.priority-high {
    background: #fee;
    color: #e74c3c;
  }

  .priority-badge.priority-medium {
    background: #fef6e6;
    color: #f39c12;
  }

  .priority-badge.priority-low {
    background: #e8f5e9;
    color: #27ae60;
  }

  .status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    background: #f0f0f0;
    color: #666;
  }

  .status-badge.status-completed {
    background: #e8f5e9;
    color: #27ae60;
  }

  .status-badge.status-in-progress {
    background: #e3f2fd;
    color: #2196f3;
  }

  .rec-text {
    margin: 0;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
  }

  .no-data {
    text-align: center;
    color: #999;
    padding: 40px;
  }

  .empty-indicator-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px;
    color: #999;
  }

  .empty-indicator-state p {
    margin: 16px 0 0 0;
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .dashboard-layout {
      flex-direction: column;
    }

    .selector-panel {
      width: 100%;
      max-height: none;
    }

    .dashboard-grid {
      grid-template-columns: 1fr;
    }

    .chart-card.span-half {
      grid-column: span 1;
    }
  }

  @media (max-width: 768px) {
    .template-tabs {
      flex-direction: column;
    }

    .indicator-buttons {
      flex-direction: column;
    }

    .indicator-btn {
      width: 100%;
    }
  }
`;

export default AnalyticsDashboardPage;
