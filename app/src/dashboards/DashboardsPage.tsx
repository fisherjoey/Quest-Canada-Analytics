/**
 * Dashboards Page - Quest Canada
 *
 * Native interactive dashboards replacing Grafana embeds
 * Features drag-and-drop layouts, PDF export, and comprehensive analytics
 */

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getProjects, getAssessments } from 'wasp/client/operations';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);
import { LayoutGrid, DollarSign, CheckCircle2, Users, BarChart3, Building, Lock, Unlock, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardTab as DashboardTabComponent } from '../components/ui/dashboard-tab';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
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

// Responsive breakpoints for grid layout
const GRID_BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const GRID_COLS = { lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 };

// Default layouts for each dashboard
const DEFAULT_LAYOUTS: Record<DashboardTab, Layout[]> = {
  overview: [
    { i: 'status', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'sector', x: 6, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'milestones', x: 0, y: 10, w: 12, h: 12, minW: 4, minH: 10 },
  ],
  funding: [
    { i: 'funding-breakdown', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'funding-gap', x: 6, y: 0, w: 6, h: 12, minW: 3, minH: 10 },
    { i: 'sector-cost', x: 0, y: 12, w: 12, h: 10, minW: 4, minH: 8 },
  ],
  milestones: [
    { i: 'timeline', x: 0, y: 0, w: 12, h: 16, minW: 4, minH: 12 },
    { i: 'status-breakdown', x: 0, y: 16, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'completion-rate', x: 6, y: 16, w: 6, h: 10, minW: 3, minH: 8 },
  ],
  assessments: [
    { i: 'community-scores', x: 0, y: 0, w: 12, h: 12, minW: 4, minH: 10 },
    { i: 'heatmap', x: 0, y: 12, w: 12, h: 12, minW: 4, minH: 10 },
    { i: 'recommendations', x: 0, y: 24, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'radar', x: 6, y: 24, w: 6, h: 10, minW: 3, minH: 8 },
  ],
  community: [
    { i: 'overview-scores', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'project-status', x: 6, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'recommendations-pie', x: 0, y: 10, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'funding-summary', x: 6, y: 10, w: 6, h: 10, minW: 3, minH: 8 },
  ],
  funder: [
    { i: 'portfolio-status', x: 0, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'ghg-impact', x: 6, y: 0, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'funding-allocation', x: 0, y: 10, w: 6, h: 10, minW: 3, minH: 8 },
    { i: 'community-progress', x: 6, y: 10, w: 6, h: 12, minW: 3, minH: 10 },
  ],
};

// Mobile layouts (stacked vertically)
const MOBILE_LAYOUTS: Record<DashboardTab, Layout[]> = {
  overview: [
    { i: 'status', x: 0, y: 0, w: 2, h: 10 },
    { i: 'sector', x: 0, y: 10, w: 2, h: 10 },
    { i: 'milestones', x: 0, y: 20, w: 2, h: 10 },
  ],
  funding: [
    { i: 'funding-breakdown', x: 0, y: 0, w: 2, h: 10 },
    { i: 'funding-gap', x: 0, y: 10, w: 2, h: 12 },
    { i: 'sector-cost', x: 0, y: 22, w: 2, h: 10 },
  ],
  milestones: [
    { i: 'timeline', x: 0, y: 0, w: 2, h: 14 },
    { i: 'status-breakdown', x: 0, y: 14, w: 2, h: 10 },
    { i: 'completion-rate', x: 0, y: 24, w: 2, h: 10 },
  ],
  assessments: [
    { i: 'community-scores', x: 0, y: 0, w: 2, h: 10 },
    { i: 'heatmap', x: 0, y: 10, w: 2, h: 10 },
    { i: 'recommendations', x: 0, y: 20, w: 2, h: 10 },
    { i: 'radar', x: 0, y: 30, w: 2, h: 10 },
  ],
  community: [
    { i: 'overview-scores', x: 0, y: 0, w: 2, h: 10 },
    { i: 'project-status', x: 0, y: 10, w: 2, h: 10 },
    { i: 'recommendations-pie', x: 0, y: 20, w: 2, h: 10 },
    { i: 'funding-summary', x: 0, y: 30, w: 2, h: 10 },
  ],
  funder: [
    { i: 'portfolio-status', x: 0, y: 0, w: 2, h: 10 },
    { i: 'ghg-impact', x: 0, y: 10, w: 2, h: 10 },
    { i: 'funding-allocation', x: 0, y: 20, w: 2, h: 10 },
    { i: 'community-progress', x: 0, y: 30, w: 2, h: 10 },
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

  // Generate responsive layouts for all breakpoints
  const responsiveLayouts = useMemo(() => {
    return {
      lg: layouts[activeTab],
      md: layouts[activeTab],
      sm: layouts[activeTab].map(item => ({ ...item, w: 6, x: 0 })),
      xs: MOBILE_LAYOUTS[activeTab].map(item => ({ ...item, w: 4 })),
      xxs: MOBILE_LAYOUTS[activeTab]
    };
  }, [layouts, activeTab]);

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
      <div className="page-container flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground text-lg">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5">
      {/* Page Header */}
      <PageHeader
        title="Quest Canada Dashboards"
        description="Visual analytics and reporting for climate action tracking"
        actions={
          <div className="flex gap-2 flex-wrap">
            <PDFExport
              contentRef={contentRef}
              filename={`quest-${activeTab}-dashboard`}
              title={`Quest Canada - ${activeDashboard?.label}`}
              subtitle={activeDashboard?.description}
            />
            <Button
              variant={isLayoutLocked ? 'secondary' : 'outline'}
              onClick={() => setIsLayoutLocked(!isLayoutLocked)}
              title={isLayoutLocked ? 'Unlock layout' : 'Lock layout'}
              className="gap-2"
            >
              {isLayoutLocked ? <Lock size={18} /> : <Unlock size={18} />}
              {isLayoutLocked ? 'Locked' : 'Unlocked'}
            </Button>
            <Button variant="outline" onClick={handleResetLayout} title="Reset layout" className="gap-2">
              <RotateCcw size={18} />
              Reset
            </Button>
          </div>
        }
      />

      {/* Dashboard Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 border-b-2 border-border">
        {dashboards.map(dashboard => (
          <DashboardTabComponent
            key={dashboard.id}
            label={dashboard.label}
            icon={dashboard.icon}
            isActive={activeTab === dashboard.id}
            onClick={() => setActiveTab(dashboard.id)}
          />
        ))}
      </div>

      {/* Dashboard Description */}
      {activeDashboard && (
        <div className="flex flex-col gap-1 bg-card p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 border-l-4 border-quest-teal shadow-sm border border-border">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground m-0">{activeDashboard.label}</h2>
          <p className="text-xs sm:text-sm text-muted-foreground m-0">{activeDashboard.description}</p>
          {!isLayoutLocked && (
            <span className="text-xs text-muted-foreground italic mt-1 hidden sm:block">
              Drag widgets to reposition, drag corners to resize
            </span>
          )}
        </div>
      )}

      {/* Dashboard Content */}
      <div ref={contentRef} className="bg-card rounded-xl p-3 sm:p-5 shadow-sm border border-border">
        {/* KPI Cards */}
        <DashboardKPICards
          projects={projects || []}
          assessments={assessments || []}
          type={activeTab === 'assessments' ? 'assessments' : activeTab === 'overview' || activeTab === 'community' ? 'combined' : 'projects'}
        />

        {/* Responsive Grid Layout Container */}
        <div className="mt-4 w-full">
          <ResponsiveGridLayout
            layouts={responsiveLayouts}
            breakpoints={GRID_BREAKPOINTS}
            cols={GRID_COLS}
            rowHeight={30}
            onLayoutChange={(currentLayout: Layout[], allLayouts: any) => {
              if (allLayouts.lg) {
                handleLayoutChange(allLayouts.lg);
              }
            }}
            isDraggable={!isLayoutLocked}
            isResizable={!isLayoutLocked}
            draggableHandle=".widget-drag-handle"
            margin={[16, 16]}
          >
            {layouts[activeTab].map(item => (
              <div key={item.i} className="dashboard-widget">
                <div className="widget-drag-handle h-2 bg-[repeating-linear-gradient(90deg,hsl(var(--border))_0px,hsl(var(--border))_2px,transparent_2px,transparent_4px)] cursor-move rounded-t-xl hidden sm:block" />
                {renderWidget(item.i)}
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      </div>

      <style>{gridStyles}</style>
    </div>
  );
}

// Minimal styles only for react-grid-layout overrides that can't be done with Tailwind
const gridStyles = `
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
`;

export default DashboardsPage;
