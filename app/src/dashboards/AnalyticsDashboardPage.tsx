/**
 * Analytics Dashboard Page - Quest Canada
 *
 * Interactive Tableau-style dashboard for comparing assessments
 * Features:
 * - Drag and drop widget positioning
 * - Resizable chart panels
 * - Layout persistence to localStorage
 * - Multi-community comparison
 * - Year-over-year progress tracking
 * - Indicator deep-dive analysis
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getAssessments } from 'wasp/client/operations';
import GridLayout, { Layout } from 'react-grid-layout';
import { AssessmentSelector } from './components/AssessmentSelector';
import { RadarComparisonChart } from './components/RadarComparisonChart';
import { BarComparisonChart } from './components/BarComparisonChart';
import { TrendLineChart } from './components/TrendLineChart';
import { RecommendationsPieChart } from './components/RecommendationsPieChart';
import { KPICards } from './components/KPICards';
import { IndicatorHeatmap } from './components/IndicatorHeatmap';
import { LayoutGrid, TrendingUp, Target, BarChart3, Filter, X, Lock, Unlock, RotateCcw } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

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

// Default layouts for each template
const DEFAULT_LAYOUTS: Record<DashboardTemplate, Layout[]> = {
  'community-comparison': [
    { i: 'radar', x: 0, y: 0, w: 12, h: 14, minW: 6, minH: 10 },
    { i: 'bar', x: 0, y: 14, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'pie', x: 6, y: 14, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'heatmap', x: 0, y: 24, w: 12, h: 12, minW: 6, minH: 10 },
  ],
  'year-over-year': [
    { i: 'trend-overall', x: 0, y: 0, w: 12, h: 12, minW: 6, minH: 10 },
    { i: 'trend-governance', x: 0, y: 12, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'trend-capacity', x: 6, y: 12, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'yoy-change', x: 0, y: 22, w: 12, h: 10, minW: 6, minH: 8 },
  ],
  'indicator-deep-dive': [
    { i: 'indicator-selector', x: 0, y: 0, w: 12, h: 5, minW: 8, minH: 4 },
    { i: 'indicator-bar', x: 0, y: 5, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'indicator-notes', x: 6, y: 5, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'indicator-recs', x: 0, y: 15, w: 12, h: 12, minW: 6, minH: 8 },
  ],
};

// LocalStorage keys for layouts
const getLayoutKey = (template: DashboardTemplate) => `quest-dashboard-layout-${template}`;

export function AnalyticsDashboardPage() {
  const { data: assessments, isLoading, error } = useQuery(getAssessments);

  // Dashboard state
  const [activeTemplate, setActiveTemplate] = useState<DashboardTemplate>('community-comparison');
  const [selectedAssessments, setSelectedAssessments] = useState<SelectedAssessment[]>([]);
  const [selectedIndicator, setSelectedIndicator] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(true);
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);

  // Load layout from localStorage or use default
  const [layouts, setLayouts] = useState<Record<DashboardTemplate, Layout[]>>(() => {
    const saved: Record<string, Layout[]> = {};
    (['community-comparison', 'year-over-year', 'indicator-deep-dive'] as DashboardTemplate[]).forEach(template => {
      const stored = localStorage.getItem(getLayoutKey(template));
      if (stored) {
        try {
          saved[template] = JSON.parse(stored);
        } catch {
          saved[template] = DEFAULT_LAYOUTS[template];
        }
      } else {
        saved[template] = DEFAULT_LAYOUTS[template];
      }
    });
    return saved as Record<DashboardTemplate, Layout[]>;
  });

  // Save layout to localStorage
  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (isLayoutLocked) return;
    setLayouts(prev => ({
      ...prev,
      [activeTemplate]: newLayout,
    }));
    localStorage.setItem(getLayoutKey(activeTemplate), JSON.stringify(newLayout));
  }, [activeTemplate, isLayoutLocked]);

  // Reset layout to default
  const handleResetLayout = useCallback(() => {
    setLayouts(prev => ({
      ...prev,
      [activeTemplate]: DEFAULT_LAYOUTS[activeTemplate],
    }));
    localStorage.removeItem(getLayoutKey(activeTemplate));
  }, [activeTemplate]);

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

  // Community trends for year-over-year
  const communityTrends = useMemo(() => {
    if (!assessments || selectedAssessmentData.length === 0) return [];
    const communities = [...new Set(selectedAssessmentData.map((a: any) => a.community?.id))];
    return communities.map(communityId => {
      const communityAssessments = assessments
        .filter((a: any) => a.community?.id === communityId)
        .sort((a: any, b: any) => a.assessmentYear - b.assessmentYear);
      const selected = selectedAssessmentData.find((a: any) => a.community?.id === communityId);
      return {
        communityId,
        communityName: selected?.community?.name || 'Unknown',
        color: selected?.color || '#999',
        assessments: communityAssessments,
      };
    });
  }, [assessments, selectedAssessmentData]);

  // Handle assessment selection
  const handleSelectAssessment = (assessment: any) => {
    if (selectedAssessments.find(s => s.id === assessment.id)) {
      setSelectedAssessments(prev => prev.filter(s => s.id !== assessment.id));
    } else if (selectedAssessments.length < 8) {
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

  const indicatorNames = [
    'Governance', 'Capacity', 'Planning', 'Infrastructure', 'Operations',
    'Buildings', 'Transportation', 'Waste', 'Energy', 'Other'
  ];

  // Calculate grid width based on selector visibility
  const gridWidth = showSelector ? 1100 : 1400;

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

  // Render widget content based on widget ID
  const renderWidget = (widgetId: string) => {
    switch (widgetId) {
      // Community Comparison widgets
      case 'radar':
        return (
          <div className="widget-content">
            <h3>Indicator Comparison (Radar)</h3>
            <RadarComparisonChart assessments={selectedAssessmentData} onIndicatorClick={setSelectedIndicator} />
          </div>
        );
      case 'bar':
        return (
          <div className="widget-content">
            <h3>Overall Scores</h3>
            <BarComparisonChart assessments={selectedAssessmentData} dataKey="overallScore" label="Overall Score" />
          </div>
        );
      case 'pie':
        return (
          <div className="widget-content">
            <h3>Recommendations by Priority</h3>
            <RecommendationsPieChart assessments={selectedAssessmentData} />
          </div>
        );
      case 'heatmap':
        return (
          <div className="widget-content">
            <h3>Indicator Performance Heatmap</h3>
            <IndicatorHeatmap assessments={selectedAssessmentData} selectedIndicator={selectedIndicator} onIndicatorClick={setSelectedIndicator} />
          </div>
        );

      // Year-over-Year widgets
      case 'trend-overall':
        return (
          <div className="widget-content">
            <h3>Overall Score Trends</h3>
            <TrendLineChart communityTrends={communityTrends} dataKey="overallScore" label="Overall Score" />
          </div>
        );
      case 'trend-governance':
        return (
          <div className="widget-content">
            <h3>Governance Indicator Trend</h3>
            <TrendLineChart communityTrends={communityTrends} indicatorNumber={1} label="Governance Score" />
          </div>
        );
      case 'trend-capacity':
        return (
          <div className="widget-content">
            <h3>Capacity Indicator Trend</h3>
            <TrendLineChart communityTrends={communityTrends} indicatorNumber={2} label="Capacity Score" />
          </div>
        );
      case 'yoy-change':
        return (
          <div className="widget-content">
            <h3>Year-over-Year Change</h3>
            <BarComparisonChart assessments={selectedAssessmentData} dataKey="yearOverYearChange" label="Score Change (%)" showChange={true} />
          </div>
        );

      // Indicator Deep-Dive widgets
      case 'indicator-selector':
        return (
          <div className="widget-content indicator-selector-widget">
            <h3>Select an Indicator to Analyze</h3>
            <div className="indicator-buttons">
              {indicatorNames.map((name, idx) => (
                <button
                  key={idx}
                  className={`indicator-btn ${selectedIndicator === idx + 1 ? 'active' : ''}`}
                  onClick={() => setSelectedIndicator(selectedIndicator === idx + 1 ? null : idx + 1)}
                >
                  <span className="indicator-num">{idx + 1}</span>
                  <span className="indicator-name">{name}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 'indicator-bar':
        return (
          <div className="widget-content">
            <h3>{selectedIndicator ? `${indicatorNames[selectedIndicator - 1]} Scores` : 'Select an Indicator'}</h3>
            {selectedIndicator ? (
              <BarComparisonChart assessments={selectedAssessmentData} indicatorNumber={selectedIndicator} label={indicatorNames[selectedIndicator - 1]} />
            ) : (
              <div className="empty-widget"><Target size={32} /><p>Select an indicator above</p></div>
            )}
          </div>
        );
      case 'indicator-notes':
        return (
          <div className="widget-content">
            <h3>Indicator Notes & Evidence</h3>
            {selectedIndicator ? (
              <div className="indicator-details">
                {selectedAssessmentData.map((assessment: any) => {
                  const indicator = assessment.indicators?.find((i: any) => i.indicatorNumber === selectedIndicator);
                  return (
                    <div key={assessment.id} className="indicator-detail-item" style={{ borderLeftColor: assessment.color }}>
                      <div className="detail-header">
                        <span className="community-name">{assessment.community?.name}</span>
                        <span className="score-badge">{indicator?.pointsEarned || 0} / {indicator?.pointsPossible || 10} pts</span>
                      </div>
                      {indicator?.notes && <p className="detail-notes">{indicator.notes}</p>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-widget"><Target size={32} /><p>Select an indicator above</p></div>
            )}
          </div>
        );
      case 'indicator-recs':
        return (
          <div className="widget-content">
            <h3>{selectedIndicator ? `Recommendations (Indicator ${selectedIndicator})` : 'Related Recommendations'}</h3>
            {selectedIndicator ? (
              <div className="recommendations-list">
                {selectedAssessmentData.flatMap((assessment: any) =>
                  (assessment.recommendations || [])
                    .filter((r: any) => r.indicatorNumber === selectedIndicator)
                    .map((rec: any) => (
                      <div key={rec.id} className="recommendation-item" style={{ borderLeftColor: assessment.color }}>
                        <div className="rec-header">
                          <span className="community-badge" style={{ backgroundColor: assessment.color }}>{assessment.community?.name}</span>
                          <span className={`priority-badge priority-${rec.priorityLevel?.toLowerCase()}`}>{rec.priorityLevel}</span>
                          <span className={`status-badge status-${rec.implementationStatus?.toLowerCase()?.replace('_', '-')}`}>{rec.implementationStatus?.replace('_', ' ')}</span>
                        </div>
                        <p className="rec-text">{rec.recommendationText}</p>
                      </div>
                    ))
                )}
                {selectedAssessmentData.every((a: any) => !(a.recommendations || []).some((r: any) => r.indicatorNumber === selectedIndicator)) && (
                  <p className="no-data">No recommendations found for this indicator</p>
                )}
              </div>
            ) : (
              <div className="empty-widget"><Target size={32} /><p>Select an indicator above</p></div>
            )}
          </div>
        );
      default:
        return <div className="widget-content">Unknown widget</div>;
    }
  };

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
        <div className="header-actions">
          <button
            className={`layout-btn ${isLayoutLocked ? 'locked' : ''}`}
            onClick={() => setIsLayoutLocked(!isLayoutLocked)}
            title={isLayoutLocked ? 'Unlock layout to drag/resize' : 'Lock layout'}
          >
            {isLayoutLocked ? <Lock size={18} /> : <Unlock size={18} />}
            {isLayoutLocked ? 'Locked' : 'Unlocked'}
          </button>
          <button className="reset-btn" onClick={handleResetLayout} title="Reset to default layout">
            <RotateCcw size={18} />
            Reset
          </button>
          <button className="toggle-selector-btn" onClick={() => setShowSelector(!showSelector)}>
            <Filter size={18} />
            {showSelector ? 'Hide' : 'Show'} Selector
          </button>
        </div>
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
        {!isLayoutLocked && <span className="drag-hint">Drag widgets to reposition, drag corners to resize</span>}
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

            {selectedAssessments.length > 0 && (
              <div className="selected-chips">
                {selectedAssessments.map(sel => (
                  <div key={sel.id} className="selected-chip" style={{ borderColor: sel.color, backgroundColor: `${sel.color}15` }}>
                    <span className="color-dot" style={{ backgroundColor: sel.color }} />
                    <span>{sel.communityName} ({sel.year})</span>
                    <button onClick={() => handleSelectAssessment(sel)}><X size={12} /></button>
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

        {/* Dashboard Content with Grid Layout */}
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

              {/* Draggable Grid Layout */}
              <GridLayout
                className="grid-layout"
                layout={layouts[activeTemplate]}
                cols={12}
                rowHeight={30}
                width={gridWidth}
                onLayoutChange={handleLayoutChange}
                isDraggable={!isLayoutLocked}
                isResizable={!isLayoutLocked}
                draggableHandle=".widget-drag-handle"
                margin={[16, 16]}
              >
                {layouts[activeTemplate].map(item => (
                  <div key={item.i} className="grid-widget">
                    <div className="widget-drag-handle" />
                    {renderWidget(item.i)}
                  </div>
                ))}
              </GridLayout>
            </>
          )}
        </div>
      </div>

      <style>{analyticsStyles}</style>
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

  .loading-spinner { color: #666; font-size: 18px; }
  .error-message { color: #e74c3c; font-size: 16px; }

  /* Header */
  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 2px solid #e0e0e0;
    flex-wrap: wrap;
    gap: 16px;
  }

  .header-content h1 {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 32px;
    color: #333;
    margin: 0 0 8px 0;
  }

  .header-content p { color: #666; font-size: 16px; margin: 0; }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .layout-btn, .reset-btn, .toggle-selector-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
  }

  .layout-btn:hover, .reset-btn:hover { border-color: #666; }
  .layout-btn.locked { background: #f0f0f0; border-color: #999; }

  .toggle-selector-btn {
    border-color: #00a9a6;
    color: #00a9a6;
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
    flex-wrap: wrap;
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

  .template-tab:hover { border-color: #00a9a6; color: #00a9a6; }
  .template-tab.active { background: #00a9a6; border-color: #00a9a6; color: white; }

  .template-description {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: #f8f9fa;
    border-left: 4px solid #00a9a6;
    border-radius: 0 8px 8px 0;
  }

  .template-description p { margin: 0; color: #666; }
  .drag-hint { font-size: 12px; color: #999; font-style: italic; }

  /* Layout */
  .dashboard-layout { display: flex; gap: 24px; }

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

  .selector-header h3 { margin: 0; font-size: 16px; color: #333; }

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
  }

  .clear-btn:hover { background: #fdd; }

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

  .selected-chip .color-dot { width: 8px; height: 8px; border-radius: 50%; }
  .selected-chip button { background: none; border: none; padding: 0; cursor: pointer; opacity: 0.6; display: flex; }
  .selected-chip button:hover { opacity: 1; }

  /* Dashboard Content */
  .dashboard-content { flex: 1; min-width: 0; }
  .dashboard-content.full-width { width: 100%; }

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

  .empty-state h2 { margin: 20px 0 8px 0; color: #666; }
  .empty-state p { margin: 0; }

  /* Grid Layout Widgets */
  .grid-layout { margin-top: 20px; }

  .grid-widget {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .widget-drag-handle {
    height: 8px;
    background: linear-gradient(90deg, #e0e0e0 25%, transparent 25%, transparent 50%, #e0e0e0 50%, #e0e0e0 75%, transparent 75%);
    background-size: 8px 8px;
    cursor: move;
    border-radius: 12px 12px 0 0;
  }

  .widget-drag-handle:hover { background-color: #f0f0f0; }

  .widget-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }

  .widget-content h3 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: #333;
    font-weight: 600;
  }

  .empty-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #999;
  }

  .empty-widget p { margin: 12px 0 0 0; }

  /* Indicator Selector Widget */
  .indicator-selector-widget .indicator-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .indicator-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #f5f5f5;
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
  }

  .indicator-btn:hover { background: #eef; border-color: #00a9a6; }
  .indicator-btn.active { background: #00a9a6; border-color: #00a9a6; color: white; }

  .indicator-btn .indicator-num {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    background: rgba(0,0,0,0.1);
    border-radius: 50%;
    font-weight: 600;
    font-size: 11px;
  }

  .indicator-btn.active .indicator-num { background: rgba(255,255,255,0.3); }
  .indicator-btn .indicator-name { font-weight: 500; }

  /* Indicator Details */
  .indicator-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .indicator-detail-item {
    padding: 10px 14px;
    border-left: 4px solid #ccc;
    background: #f9f9f9;
    border-radius: 0 6px 6px 0;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .community-name { font-weight: 600; color: #333; font-size: 13px; }

  .score-badge {
    padding: 3px 8px;
    background: #e8f5f5;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    color: #00a9a6;
  }

  .detail-notes { margin: 0; font-size: 13px; color: #666; line-height: 1.4; }

  /* Recommendations List */
  .recommendations-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-height: 300px;
    overflow-y: auto;
  }

  .recommendation-item {
    padding: 12px;
    border-left: 4px solid #ccc;
    background: #f9f9f9;
    border-radius: 0 6px 6px 0;
  }

  .rec-header {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  .community-badge {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    color: white;
  }

  .priority-badge {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
  }

  .priority-badge.priority-high { background: #fee; color: #e74c3c; }
  .priority-badge.priority-medium { background: #fef6e6; color: #f39c12; }
  .priority-badge.priority-low { background: #e8f5e9; color: #27ae60; }

  .status-badge {
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    background: #f0f0f0;
    color: #666;
  }

  .status-badge.status-completed { background: #e8f5e9; color: #27ae60; }
  .status-badge.status-in-progress { background: #e3f2fd; color: #2196f3; }

  .rec-text { margin: 0; font-size: 13px; color: #333; line-height: 1.4; }
  .no-data { text-align: center; color: #999; padding: 30px; }

  /* React Grid Layout overrides */
  .react-grid-item.react-grid-placeholder {
    background: #00a9a6 !important;
    opacity: 0.2;
    border-radius: 12px;
  }

  .react-resizable-handle {
    background: none !important;
    width: 20px !important;
    height: 20px !important;
  }

  .react-resizable-handle::after {
    content: '';
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 8px;
    height: 8px;
    border-right: 2px solid #ccc;
    border-bottom: 2px solid #ccc;
  }

  .react-grid-item:hover .react-resizable-handle::after {
    border-color: #00a9a6;
  }

  /* Responsive */
  @media (max-width: 1200px) {
    .dashboard-layout { flex-direction: column; }
    .selector-panel { width: 100%; max-height: none; }
  }

  @media (max-width: 768px) {
    .template-tabs { flex-direction: column; }
    .header-actions { width: 100%; justify-content: flex-start; }
  }
`;

export default AnalyticsDashboardPage;
