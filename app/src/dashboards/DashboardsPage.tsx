/**
 * Dashboards Page - Quest Canada
 *
 * Native interactive dashboards replacing Grafana embeds
 * Features drag-and-drop layouts, PDF export, and comprehensive analytics
 */

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getProjects, getAssessments } from 'wasp/client/operations';
import GridLayout, { Layout } from 'react-grid-layout';
import { LayoutGrid, DollarSign, CheckCircle2, Users, BarChart3, Building, Lock, Unlock, RotateCcw } from 'lucide-react';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Chart components
import { ProjectStatusChart } from './components/ProjectStatusChart';
import { FundingChart } from './components/FundingChart';
import { MilestoneTimeline } from './components/MilestoneTimeline';
import { ProjectSectorChart } from './components/ProjectSectorChart';
import { FundingGapChart } from './components/FundingGapChart';
import { CommunityComparisonBar } from './components/CommunityComparisonBar';
import { DashboardKPICards } from './components/DashboardKPICards';
import { RadarComparisonChart } from './components/RadarComparisonChart';
import { IndicatorHeatmap } from './components/IndicatorHeatmap';
import { RecommendationsPieChart } from './components/RecommendationsPieChart';
import { PDFExport } from './components/PDFExport';

type DashboardTab =
  | 'overview'
  | 'funding'
  | 'milestones'
  | 'assessments'
  | 'community'
  | 'funder';

interface DashboardInfo {
  id: DashboardTab;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// Default layouts for each dashboard
const DEFAULT_LAYOUTS: Record<DashboardTab, Layout[]> = {
  overview: [
    { i: 'status', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'sector', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'milestones', x: 0, y: 10, w: 12, h: 12, minW: 6, minH: 10 },
  ],
  funding: [
    { i: 'funding-breakdown', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'funding-gap', x: 6, y: 0, w: 6, h: 12, minW: 4, minH: 10 },
    { i: 'sector-cost', x: 0, y: 12, w: 12, h: 10, minW: 6, minH: 8 },
  ],
  milestones: [
    { i: 'timeline', x: 0, y: 0, w: 12, h: 16, minW: 8, minH: 12 },
    { i: 'status-breakdown', x: 0, y: 16, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'completion-rate', x: 6, y: 16, w: 6, h: 10, minW: 4, minH: 8 },
  ],
  assessments: [
    { i: 'community-scores', x: 0, y: 0, w: 12, h: 12, minW: 6, minH: 10 },
    { i: 'heatmap', x: 0, y: 12, w: 12, h: 12, minW: 6, minH: 10 },
    { i: 'recommendations', x: 0, y: 24, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'radar', x: 6, y: 24, w: 6, h: 10, minW: 4, minH: 8 },
  ],
  community: [
    { i: 'overview-scores', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'project-status', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'recommendations-pie', x: 0, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'funding-summary', x: 6, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
  ],
  funder: [
    { i: 'portfolio-status', x: 0, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'ghg-impact', x: 6, y: 0, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'funding-allocation', x: 0, y: 10, w: 6, h: 10, minW: 4, minH: 8 },
    { i: 'community-progress', x: 6, y: 10, w: 6, h: 12, minW: 4, minH: 10 },
  ],
};

const dashboards: DashboardInfo[] = [
  {
    id: 'overview',
    label: 'Projects Overview',
    description: 'Live overview of all projects, status distribution, and milestone progress',
    icon: <LayoutGrid size={20} />,
  },
  {
    id: 'funding',
    label: 'Project Funding',
    description: 'Track funding sources, commitments, gaps, and financial analysis',
    icon: <DollarSign size={20} />,
  },
  {
    id: 'milestones',
    label: 'Project Milestones',
    description: 'Monitor project progress, timeline, and milestone completion',
    icon: <CheckCircle2 size={20} />,
  },
  {
    id: 'assessments',
    label: 'Community Assessments',
    description: 'View benchmark assessments, indicator scores, and recommendations',
    icon: <BarChart3 size={20} />,
  },
  {
    id: 'community',
    label: 'Community View',
    description: 'Comprehensive dashboard for community administrators',
    icon: <Building size={20} />,
  },
  {
    id: 'funder',
    label: 'Funder & Policymaker',
    description: 'Portfolio-wide program performance and impact analysis',
    icon: <Users size={20} />,
  },
];

const getLayoutKey = (tab: DashboardTab) => `quest-dashboard-layout-${tab}`;

export function DashboardsPage() {
  const { data: projects, isLoading: projectsLoading } = useQuery(getProjects);
  const { data: assessments, isLoading: assessmentsLoading } = useQuery(getAssessments);

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [isLayoutLocked, setIsLayoutLocked] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load layouts from localStorage
  const [layouts, setLayouts] = useState<Record<DashboardTab, Layout[]>>(() => {
    const saved: Record<string, Layout[]> = {};
    (Object.keys(DEFAULT_LAYOUTS) as DashboardTab[]).forEach(tab => {
      const stored = localStorage.getItem(getLayoutKey(tab));
      if (stored) {
        try {
          saved[tab] = JSON.parse(stored);
        } catch {
          saved[tab] = DEFAULT_LAYOUTS[tab];
        }
      } else {
        saved[tab] = DEFAULT_LAYOUTS[tab];
      }
    });
    return saved as Record<DashboardTab, Layout[]>;
  });

  const handleLayoutChange = useCallback((newLayout: Layout[]) => {
    if (isLayoutLocked) return;
    setLayouts(prev => ({
      ...prev,
      [activeTab]: newLayout,
    }));
    localStorage.setItem(getLayoutKey(activeTab), JSON.stringify(newLayout));
  }, [activeTab, isLayoutLocked]);

  const handleResetLayout = useCallback(() => {
    setLayouts(prev => ({
      ...prev,
      [activeTab]: DEFAULT_LAYOUTS[activeTab],
    }));
    localStorage.removeItem(getLayoutKey(activeTab));
  }, [activeTab]);

  const activeDashboard = dashboards.find(d => d.id === activeTab);
  const isLoading = projectsLoading || assessmentsLoading;

  // Latest assessments for charts
  const latestAssessments = useMemo(() => {
    if (!assessments) return [];
    const communityMap = new Map<string, any>();
    assessments.forEach((a: any) => {
      const communityId = a.community?.id || 'unknown';
      const existing = communityMap.get(communityId);
      if (!existing || a.assessmentYear > existing.assessmentYear) {
        communityMap.set(communityId, a);
      }
    });
    return Array.from(communityMap.values());
  }, [assessments]);

  // Render widget content based on tab and widget ID
  const renderWidget = (widgetId: string) => {
    const projectList = projects || [];
    const assessmentList = assessments || [];

    switch (activeTab) {
      case 'overview':
        switch (widgetId) {
          case 'status':
            return (
              <div className="widget-content">
                <h3>Project Status Distribution</h3>
                <ProjectStatusChart projects={projectList} />
              </div>
            );
          case 'sector':
            return (
              <div className="widget-content">
                <h3>Projects by Sector</h3>
                <ProjectSectorChart projects={projectList} />
              </div>
            );
          case 'milestones':
            return (
              <div className="widget-content">
                <h3>Upcoming Milestones</h3>
                <MilestoneTimeline projects={projectList} />
              </div>
            );
        }
        break;

      case 'funding':
        switch (widgetId) {
          case 'funding-breakdown':
            return (
              <div className="widget-content">
                <h3>Funding Breakdown</h3>
                <FundingChart projects={projectList} />
              </div>
            );
          case 'funding-gap':
            return (
              <div className="widget-content">
                <h3>Budget vs Secured Funding</h3>
                <FundingGapChart projects={projectList} />
              </div>
            );
          case 'sector-cost':
            return (
              <div className="widget-content">
                <h3>Estimated GHG Reduction by Sector</h3>
                <ProjectSectorChart projects={projectList} showGhgImpact={true} />
              </div>
            );
        }
        break;

      case 'milestones':
        switch (widgetId) {
          case 'timeline':
            return (
              <div className="widget-content">
                <h3>Project Timeline</h3>
                <MilestoneTimeline projects={projectList} />
              </div>
            );
          case 'status-breakdown':
            return (
              <div className="widget-content">
                <h3>Project Status</h3>
                <ProjectStatusChart projects={projectList} />
              </div>
            );
          case 'completion-rate':
            return (
              <div className="widget-content">
                <h3>Projects by Sector</h3>
                <ProjectSectorChart projects={projectList} />
              </div>
            );
        }
        break;

      case 'assessments':
        switch (widgetId) {
          case 'community-scores':
            return (
              <div className="widget-content">
                <h3>Community Overall Scores</h3>
                <CommunityComparisonBar assessments={assessmentList} metric="overall" />
              </div>
            );
          case 'heatmap':
            return (
              <div className="widget-content">
                <h3>Indicator Performance Heatmap</h3>
                <IndicatorHeatmap assessments={latestAssessments} />
              </div>
            );
          case 'recommendations':
            return (
              <div className="widget-content">
                <h3>Recommendations by Priority</h3>
                <RecommendationsPieChart assessments={assessmentList} />
              </div>
            );
          case 'radar':
            return (
              <div className="widget-content">
                <h3>Indicator Comparison</h3>
                <RadarComparisonChart assessments={latestAssessments.slice(0, 5)} />
              </div>
            );
        }
        break;

      case 'community':
        switch (widgetId) {
          case 'overview-scores':
            return (
              <div className="widget-content">
                <h3>Assessment Scores</h3>
                <CommunityComparisonBar assessments={assessmentList} metric="overall" />
              </div>
            );
          case 'project-status':
            return (
              <div className="widget-content">
                <h3>Project Status</h3>
                <ProjectStatusChart projects={projectList} />
              </div>
            );
          case 'recommendations-pie':
            return (
              <div className="widget-content">
                <h3>Recommendations</h3>
                <RecommendationsPieChart assessments={assessmentList} />
              </div>
            );
          case 'funding-summary':
            return (
              <div className="widget-content">
                <h3>Funding Overview</h3>
                <FundingChart projects={projectList} />
              </div>
            );
        }
        break;

      case 'funder':
        switch (widgetId) {
          case 'portfolio-status':
            return (
              <div className="widget-content">
                <h3>Portfolio Project Status</h3>
                <ProjectStatusChart projects={projectList} />
              </div>
            );
          case 'ghg-impact':
            return (
              <div className="widget-content">
                <h3>GHG Impact by Sector</h3>
                <ProjectSectorChart projects={projectList} showGhgImpact={true} />
              </div>
            );
          case 'funding-allocation':
            return (
              <div className="widget-content">
                <h3>Funding Allocation</h3>
                <FundingChart projects={projectList} />
              </div>
            );
          case 'community-progress':
            return (
              <div className="widget-content">
                <h3>Community Progress</h3>
                <CommunityComparisonBar assessments={assessmentList} metric="overall" />
              </div>
            );
        }
        break;
    }

    return <div className="widget-content">Widget not found</div>;
  };

  if (isLoading) {
    return (
      <div className="dashboards-page loading">
        <div className="loading-spinner">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="dashboards-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Quest Canada Dashboards</h1>
          <p>Visual analytics and reporting for climate action tracking</p>
        </div>
        <div className="header-actions">
          <PDFExport
            contentRef={contentRef}
            filename={`quest-${activeTab}-dashboard`}
            title={`Quest Canada - ${activeDashboard?.label}`}
            subtitle={activeDashboard?.description}
          />
          <button
            className={`layout-btn ${isLayoutLocked ? 'locked' : ''}`}
            onClick={() => setIsLayoutLocked(!isLayoutLocked)}
            title={isLayoutLocked ? 'Unlock layout' : 'Lock layout'}
          >
            {isLayoutLocked ? <Lock size={18} /> : <Unlock size={18} />}
            {isLayoutLocked ? 'Locked' : 'Unlocked'}
          </button>
          <button className="reset-btn" onClick={handleResetLayout} title="Reset layout">
            <RotateCcw size={18} />
            Reset
          </button>
        </div>
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        {dashboards.map(dashboard => (
          <button
            key={dashboard.id}
            className={`tab ${activeTab === dashboard.id ? 'active' : ''}`}
            onClick={() => setActiveTab(dashboard.id)}
          >
            {dashboard.icon}
            <span className="tab-label">{dashboard.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Description */}
      {activeDashboard && (
        <div className="dashboard-description">
          <h2>{activeDashboard.label}</h2>
          <p>{activeDashboard.description}</p>
          {!isLayoutLocked && <span className="drag-hint">Drag widgets to reposition, drag corners to resize</span>}
        </div>
      )}

      {/* Dashboard Content */}
      <div ref={contentRef} className="dashboard-content">
        {/* KPI Cards */}
        <DashboardKPICards
          projects={projects || []}
          assessments={assessments || []}
          type={activeTab === 'assessments' ? 'assessments' : activeTab === 'overview' || activeTab === 'community' ? 'combined' : 'projects'}
        />

        {/* Grid Layout */}
        <GridLayout
          className="grid-layout"
          layout={layouts[activeTab]}
          cols={12}
          rowHeight={30}
          width={1400}
          onLayoutChange={handleLayoutChange}
          isDraggable={!isLayoutLocked}
          isResizable={!isLayoutLocked}
          draggableHandle=".widget-drag-handle"
          margin={[16, 16]}
        >
          {layouts[activeTab].map(item => (
            <div key={item.i} className="grid-widget">
              <div className="widget-drag-handle" />
              {renderWidget(item.i)}
            </div>
          ))}
        </GridLayout>
      </div>

      <style>{dashboardStyles}</style>
    </div>
  );
}

const dashboardStyles = `
  .dashboards-page {
    max-width: 1800px;
    margin: 0 auto;
    padding: 20px;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  .dashboards-page.loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .loading-spinner {
    color: #666;
    font-size: 18px;
  }

  .page-header {
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
    font-size: 32px;
    color: #333;
    margin: 0 0 8px 0;
  }

  .header-content p {
    color: #666;
    font-size: 16px;
    margin: 0;
  }

  .header-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .layout-btn, .reset-btn {
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

  .layout-btn:hover, .reset-btn:hover {
    border-color: #666;
  }

  .layout-btn.locked {
    background: #f0f0f0;
    border-color: #999;
  }

  .dashboard-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    overflow-x: auto;
    padding: 8px 0;
    border-bottom: 2px solid #e0e0e0;
  }

  .tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    color: #666;
  }

  .tab:hover {
    background: #f5f5f5;
    border-color: #00a9a6;
    color: #00a9a6;
  }

  .tab.active {
    background: #00a9a6;
    color: white;
    border-color: #00a9a6;
    font-weight: 600;
  }

  .tab-label {
    font-size: 14px;
  }

  .dashboard-description {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #f8f9fa;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 24px;
    border-left: 4px solid #00a9a6;
  }

  .dashboard-description h2 {
    margin: 0;
    font-size: 20px;
    color: #333;
  }

  .dashboard-description p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }

  .drag-hint {
    font-size: 12px;
    color: #999;
    font-style: italic;
    margin-top: 4px;
  }

  .dashboard-content {
    background: #f5f5f5;
    border-radius: 12px;
    padding: 20px;
  }

  .grid-layout {
    margin-top: 16px;
  }

  .grid-widget {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
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

  .widget-drag-handle:hover {
    background-color: #f0f0f0;
  }

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

  .chart-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
  }

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

  @media (max-width: 1200px) {
    .dashboard-tabs {
      flex-wrap: wrap;
    }
  }

  @media (max-width: 768px) {
    .dashboard-tabs {
      flex-direction: column;
    }

    .tab {
      width: 100%;
      justify-content: center;
    }

    .header-actions {
      width: 100%;
      justify-content: flex-start;
    }
  }
`;

export default DashboardsPage;
