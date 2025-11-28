/**
 * Dashboards Page - Quest Canada
 *
 * Displays all available Grafana dashboards with tabs for easy navigation
 */

import React, { useState } from 'react';
import {
  GrafanaDashboard,
  ProjectFundingDashboard,
  ProjectMilestoneDashboard,
  BenchmarkStrengthsDashboard,
  CommunityStakeholderDashboard,
  CitizenEngagementDashboard,
  FunderPolicymakerDashboard
} from './GrafanaDashboard';

type DashboardTab =
  | 'overview'
  | 'funding'
  | 'milestones'
  | 'assessments'
  | 'benchmarks'
  | 'community'
  | 'citizen'
  | 'funder';

interface DashboardInfo {
  id: DashboardTab;
  label: string;
  description: string;
  icon: string;
  component: React.ReactNode;
}

const dashboards: DashboardInfo[] = [
  {
    id: 'overview',
    label: 'Projects Overview',
    description: 'Live overview of all projects, communities, and funding',
    icon: '',
    component: <GrafanaDashboard dashboardUid="projects-overview-simple" title="Projects Overview" kiosk={true} />
  },
  {
    id: 'funding',
    label: 'Project Funding',
    description: 'Track funding sources, commitments, and financial gaps',
    icon: '',
    component: <ProjectFundingDashboard />
  },
  {
    id: 'milestones',
    label: 'Project Milestones',
    description: 'Monitor project progress and milestone completion',
    icon: '',
    component: <ProjectMilestoneDashboard />
  },
  {
    id: 'assessments',
    label: 'Community Assessments',
    description: 'View all 10-indicator benchmark assessments with strengths and recommendations',
    icon: '',
    component: <GrafanaDashboard dashboardUid="community-assessment" title="Community Assessment Dashboard" kiosk={true} />
  },
  {
    id: 'benchmarks',
    label: 'Benchmarks & Strengths',
    description: 'Analyze benchmark assessments and community strengths',
    icon: '',
    component: <BenchmarkStrengthsDashboard />
  },
  {
    id: 'community',
    label: 'Community Stakeholder',
    description: 'Comprehensive view for community administrators',
    icon: '',
    component: <CommunityStakeholderDashboard />
  },
  {
    id: 'citizen',
    label: 'Citizen Engagement',
    description: 'Public-facing community climate action dashboard',
    icon: '',
    component: <CitizenEngagementDashboard />
  },
  {
    id: 'funder',
    label: 'Funder & Policymaker',
    description: 'Portfolio-wide program performance and impact analysis',
    icon: '',
    component: <FunderPolicymakerDashboard />
  }
];

export function DashboardsPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  const activeDashboard = dashboards.find(d => d.id === activeTab);

  return (
    <div className="dashboards-page">
      <div className="page-header">
        <h1>Quest Canada Dashboards</h1>
        <p>Visual analytics and reporting for climate action tracking</p>
      </div>

      {/* Dashboard Tabs */}
      <div className="dashboard-tabs">
        {dashboards.map(dashboard => (
          <button
            key={dashboard.id}
            className={`tab ${activeTab === dashboard.id ? 'active' : ''}`}
            onClick={() => setActiveTab(dashboard.id)}
          >
            <span className="tab-icon">{dashboard.icon}</span>
            <span className="tab-label">{dashboard.label}</span>
          </button>
        ))}
      </div>

      {/* Dashboard Description */}
      {activeDashboard && (
        <div className="dashboard-description">
          <h2>{activeDashboard.label}</h2>
          <p>{activeDashboard.description}</p>
        </div>
      )}

      {/* Dashboard Content */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: 0
      }}>
        {activeDashboard?.component}
      </div>
    </div>
  );
}

// Add external CSS
const styles = `
  .dashboards-page {
    max-width: 1800px;
    margin: 0 auto;
    padding: 20px;
  }

  .page-header {
    text-align: center;
    margin-bottom: 40px;
  }

  .page-header h1 {
    font-size: 36px;
    color: #333;
    margin-bottom: 8px;
  }

  .page-header p {
    font-size: 18px;
    color: #666;
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
    padding: 12px 24px;
    background: white;
    border: 2px solid #e0e0e0;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .tab:hover {
    background: #f5f5f5;
    border-color: #00a9a6;
  }

  .tab.active {
    background: #00a9a6;
    color: white;
    border-color: #00a9a6;
    font-weight: 600;
  }

  .tab-icon {
    font-size: 20px;
  }

  .tab-label {
    font-size: 14px;
  }

  .dashboard-description {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 24px;
    border-left: 4px solid #00a9a6;
  }

  .dashboard-description h2 {
    margin: 0 0 8px 0;
    font-size: 22px;
    color: #333;
  }

  .dashboard-description p {
    margin: 0;
    color: #666;
    font-size: 16px;
  }

  @media (max-width: 768px) {
    .dashboard-tabs {
      flex-direction: column;
    }

    .tab {
      width: 100%;
      justify-content: center;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

export default DashboardsPage;
