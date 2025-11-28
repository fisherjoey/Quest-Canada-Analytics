/**
 * Dashboard KPI Cards Component
 * Displays summary metrics for projects and assessments
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Target, Users, FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface DashboardKPICardsProps {
  projects?: any[];
  assessments?: any[];
  type?: 'projects' | 'assessments' | 'combined';
}

export function DashboardKPICards({ projects = [], assessments = [], type = 'combined' }: DashboardKPICardsProps) {
  const metrics = useMemo(() => {
    const projectMetrics = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'IN_PROGRESS').length,
      completedProjects: projects.filter(p => p.status === 'COMPLETED').length,
      totalBudget: projects.reduce((sum, p) => sum + (p.totalBudget || p.estimatedCost || 0), 0),
      totalSecuredFunding: projects.reduce((sum, p) => {
        const funding = (p.fundingSources || [])
          .filter((f: any) => f.status === 'RECEIVED' || f.status === 'APPROVED')
          .reduce((s: number, f: any) => s + (f.amount || 0), 0);
        return sum + funding;
      }, 0),
      totalGhgReduction: projects.reduce((sum, p) => sum + (p.estimatedGhgReduction || 0), 0),
      milestonesCompleted: projects.reduce((sum, p) =>
        sum + (p.milestones || []).filter((m: any) => m.status === 'COMPLETED').length, 0
      ),
      milestonesTotal: projects.reduce((sum, p) => sum + (p.milestones || []).length, 0),
      delayedMilestones: projects.reduce((sum, p) =>
        sum + (p.milestones || []).filter((m: any) => m.status === 'DELAYED').length, 0
      ),
    };

    const assessmentMetrics = {
      totalAssessments: assessments.length,
      avgOverallScore: assessments.length > 0
        ? assessments.reduce((sum, a) => sum + (a.overallScore || 0), 0) / assessments.length
        : 0,
      publishedAssessments: assessments.filter(a => a.status === 'PUBLISHED').length,
      totalRecommendations: assessments.reduce((sum, a) => sum + (a.recommendations || []).length, 0),
      highPriorityRecs: assessments.reduce((sum, a) =>
        sum + (a.recommendations || []).filter((r: any) => r.priorityLevel === 'HIGH').length, 0
      ),
      completedRecs: assessments.reduce((sum, a) =>
        sum + (a.recommendations || []).filter((r: any) => r.implementationStatus === 'COMPLETED').length, 0
      ),
      uniqueCommunities: new Set(assessments.map(a => a.community?.id)).size,
    };

    return { ...projectMetrics, ...assessmentMetrics };
  }, [projects, assessments]);

  const fundingGap = metrics.totalBudget - metrics.totalSecuredFunding;
  const fundingPercentage = metrics.totalBudget > 0
    ? Math.round((metrics.totalSecuredFunding / metrics.totalBudget) * 100)
    : 0;

  const renderProjectCards = () => (
    <>
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#e3f2fd' }}>
          <FolderKanban size={24} color="#2196f3" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.totalProjects}</span>
          <span className="kpi-label">Total Projects</span>
          <span className="kpi-detail">{metrics.activeProjects} active</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#e8f5e9' }}>
          <CheckCircle2 size={24} color="#4caf50" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.completedProjects}</span>
          <span className="kpi-label">Completed</span>
          <span className="kpi-detail">
            {metrics.totalProjects > 0
              ? `${Math.round((metrics.completedProjects / metrics.totalProjects) * 100)}%`
              : '0%'} completion rate
          </span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#fff3e0' }}>
          <DollarSign size={24} color="#ff9800" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">${(metrics.totalSecuredFunding / 1000000).toFixed(1)}M</span>
          <span className="kpi-label">Secured Funding</span>
          <span className="kpi-detail">{fundingPercentage}% of ${(metrics.totalBudget / 1000000).toFixed(1)}M budget</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: fundingGap > 0 ? '#ffebee' : '#e8f5e9' }}>
          {fundingGap > 0 ? <TrendingDown size={24} color="#e74c3c" /> : <TrendingUp size={24} color="#4caf50" />}
        </div>
        <div className="kpi-content">
          <span className="kpi-value" style={{ color: fundingGap > 0 ? '#e74c3c' : '#4caf50' }}>
            ${Math.abs(fundingGap / 1000000).toFixed(1)}M
          </span>
          <span className="kpi-label">{fundingGap > 0 ? 'Funding Gap' : 'Surplus'}</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#e8f5e9' }}>
          <Target size={24} color="#27ae60" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.totalGhgReduction.toLocaleString()}</span>
          <span className="kpi-label">tCO2e Reduction</span>
          <span className="kpi-detail">Estimated annual impact</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: metrics.delayedMilestones > 0 ? '#fff3e0' : '#e3f2fd' }}>
          {metrics.delayedMilestones > 0 ? <AlertTriangle size={24} color="#ff9800" /> : <Clock size={24} color="#2196f3" />}
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.milestonesCompleted}/{metrics.milestonesTotal}</span>
          <span className="kpi-label">Milestones</span>
          {metrics.delayedMilestones > 0 && (
            <span className="kpi-detail warning">{metrics.delayedMilestones} delayed</span>
          )}
        </div>
      </div>
    </>
  );

  const renderAssessmentCards = () => (
    <>
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#e3f2fd' }}>
          <Users size={24} color="#2196f3" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.uniqueCommunities}</span>
          <span className="kpi-label">Communities</span>
          <span className="kpi-detail">{metrics.totalAssessments} assessments</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: metrics.avgOverallScore >= 60 ? '#e8f5e9' : '#fff3e0' }}>
          {metrics.avgOverallScore >= 60 ? <TrendingUp size={24} color="#4caf50" /> : <Minus size={24} color="#ff9800" />}
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{Math.round(metrics.avgOverallScore)}%</span>
          <span className="kpi-label">Avg. Score</span>
          <span className="kpi-detail">Across all assessments</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#fff3e0' }}>
          <AlertTriangle size={24} color="#ff9800" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.highPriorityRecs}</span>
          <span className="kpi-label">High Priority</span>
          <span className="kpi-detail">of {metrics.totalRecommendations} recommendations</span>
        </div>
      </div>

      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#e8f5e9' }}>
          <CheckCircle2 size={24} color="#4caf50" />
        </div>
        <div className="kpi-content">
          <span className="kpi-value">{metrics.completedRecs}</span>
          <span className="kpi-label">Completed Recs</span>
          <span className="kpi-detail">
            {metrics.totalRecommendations > 0
              ? `${Math.round((metrics.completedRecs / metrics.totalRecommendations) * 100)}%`
              : '0%'} implementation
          </span>
        </div>
      </div>
    </>
  );

  return (
    <div className="dashboard-kpi-cards">
      {(type === 'projects' || type === 'combined') && renderProjectCards()}
      {(type === 'assessments' || type === 'combined') && renderAssessmentCards()}

      <style>{`
        .dashboard-kpi-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .kpi-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .kpi-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 52px;
          height: 52px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .kpi-content {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          line-height: 1.2;
        }

        .kpi-label {
          font-size: 13px;
          color: #666;
          margin-top: 2px;
        }

        .kpi-detail {
          font-size: 11px;
          color: #999;
          margin-top: 4px;
        }

        .kpi-detail.warning {
          color: #ff9800;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .dashboard-kpi-cards {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 480px) {
          .dashboard-kpi-cards {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

export default DashboardKPICards;
