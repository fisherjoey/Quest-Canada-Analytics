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
import { cn } from '@src/lib/utils';
import { Button } from '@src/components/ui/button';
import { PageHeader } from '@src/components/ui/page-header';
import { DashboardTab } from '@src/components/ui/dashboard-tab';
import { CHART_COLOR_PALETTE } from '@src/lib/style-utils';
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

// Use color palette from style-utils for consistent theming
const COMPARISON_COLORS = [
  ...CHART_COLOR_PALETTE,
  'hsl(340, 82%, 52%)', // Pink (additional)
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
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">Loading assessments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-destructive text-base">Error loading assessments: {(error as Error).message}</div>
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
    <div className="max-w-[1800px] mx-auto px-5 py-5">
      {/* Page Header */}
      <PageHeader
        title="Assessment Analytics"
        description="Compare assessments, track progress, and analyze indicator performance"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={isLayoutLocked ? 'secondary' : 'outline'}
              onClick={() => setIsLayoutLocked(!isLayoutLocked)}
              title={isLayoutLocked ? 'Unlock layout to drag/resize' : 'Lock layout'}
              className="gap-2"
            >
              {isLayoutLocked ? <Lock size={18} /> : <Unlock size={18} />}
              {isLayoutLocked ? 'Locked' : 'Unlocked'}
            </Button>
            <Button variant="outline" onClick={handleResetLayout} title="Reset to default layout" className="gap-2">
              <RotateCcw size={18} />
              Reset
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSelector(!showSelector)}
              className="gap-2 border-quest-teal text-quest-teal hover:bg-quest-teal hover:text-white"
            >
              <Filter size={18} />
              {showSelector ? 'Hide' : 'Show'} Selector
            </Button>
          </div>
        }
      />

      {/* Template Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {templates.map(template => (
          <DashboardTab
            key={template.id}
            label={template.label}
            icon={template.icon}
            isActive={activeTemplate === template.id}
            onClick={() => setActiveTemplate(template.id)}
          />
        ))}
      </div>

      {/* Template Description */}
      <div className="flex justify-between items-center mb-5 p-3 bg-muted border-l-4 border-quest-teal rounded-r-lg">
        <p className="m-0 text-muted-foreground">{templates.find(t => t.id === activeTemplate)?.description}</p>
        {!isLayoutLocked && <span className="text-xs text-muted-foreground italic">Drag widgets to reposition, drag corners to resize</span>}
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Assessment Selector Panel */}
        {showSelector && (
          <div className="w-full lg:w-80 flex-shrink-0 bg-card rounded-xl p-5 shadow-sm border border-border max-h-[calc(100vh-280px)] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="m-0 text-base font-semibold text-foreground">Select Assessments</h3>
              {selectedAssessments.length > 0 && (
                <button
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-destructive-muted text-destructive text-xs rounded cursor-pointer hover:bg-destructive/20 border-none"
                  onClick={handleClearSelection}
                >
                  <X size={14} />
                  Clear All
                </button>
              )}
            </div>

            {selectedAssessments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-border">
                {selectedAssessments.map(sel => (
                  <div
                    key={sel.id}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border-2 rounded-full text-xs"
                    style={{ borderColor: sel.color, backgroundColor: `${sel.color}15` }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: sel.color }} />
                    <span>{sel.communityName} ({sel.year})</span>
                    <button
                      className="bg-transparent border-none p-0 cursor-pointer opacity-60 hover:opacity-100 flex"
                      onClick={() => handleSelectAssessment(sel)}
                    >
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

        {/* Dashboard Content with Grid Layout */}
        <div className={cn('flex-1 min-w-0', !showSelector && 'w-full')}>
          {selectedAssessmentData.length === 0 ? (
            <div className="empty-state">
              <BarChart3 className="empty-state-icon" />
              <h2 className="empty-state-title">Select Assessments to Compare</h2>
              <p className="empty-state-description">Choose one or more assessments from the selector panel to visualize their data</p>
            </div>
          ) : (
            <>
              {/* KPI Summary Cards */}
              <KPICards assessments={selectedAssessmentData} />

              {/* Draggable Grid Layout */}
              <GridLayout
                className="mt-5"
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
                  <div key={item.i} className="dashboard-widget">
                    <div className="widget-drag-handle h-2 bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0px,hsl(var(--border))_2px,transparent_2px,transparent_4px)] cursor-move rounded-t-xl" />
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

// Minimal styles - only what can't be done with Tailwind (grid overrides, widget internals)
const analyticsStyles = `
  /* Widget Content */
  .widget-content {
    flex: 1;
    padding: 16px;
    overflow: auto;
  }

  .widget-content h3 {
    margin: 0 0 12px 0;
    font-size: 15px;
    color: hsl(var(--foreground));
    font-weight: 600;
  }

  .empty-widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: hsl(var(--muted-foreground));
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
    background: hsl(var(--muted));
    border: 2px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 13px;
    color: hsl(var(--foreground));
  }

  .indicator-btn:hover {
    background: hsl(var(--quest-teal-muted));
    border-color: hsl(var(--quest-teal));
  }

  .indicator-btn.active {
    background: hsl(var(--quest-teal));
    border-color: hsl(var(--quest-teal));
    color: white;
  }

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
    border-left: 4px solid hsl(var(--border));
    background: hsl(var(--muted));
    border-radius: 0 6px 6px 0;
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .community-name { font-weight: 600; color: hsl(var(--foreground)); font-size: 13px; }

  .score-badge {
    padding: 3px 8px;
    background: hsl(var(--quest-teal-muted));
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    color: hsl(var(--quest-teal));
  }

  .detail-notes { margin: 0; font-size: 13px; color: hsl(var(--muted-foreground)); line-height: 1.4; }

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
    border-left: 4px solid hsl(var(--border));
    background: hsl(var(--muted));
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

  .priority-badge.priority-high { background: hsl(var(--destructive-muted)); color: hsl(var(--destructive)); }
  .priority-badge.priority-medium { background: hsl(var(--warning-muted)); color: hsl(var(--warning)); }
  .priority-badge.priority-low { background: hsl(var(--success-muted)); color: hsl(var(--success)); }

  .rec-text { margin: 0; font-size: 13px; color: hsl(var(--foreground)); line-height: 1.4; }
  .no-data { text-align: center; color: hsl(var(--muted-foreground)); padding: 30px; }

  /* React Grid Layout overrides */
  .react-grid-item.react-grid-placeholder {
    background: hsl(var(--quest-teal)) !important;
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
    border-right: 2px solid hsl(var(--border));
    border-bottom: 2px solid hsl(var(--border));
  }

  .react-grid-item:hover .react-resizable-handle::after {
    border-color: hsl(var(--quest-teal));
  }
`;

export default AnalyticsDashboardPage;
