/**
 * Dashboard KPI Cards Component
 * Displays summary metrics for projects and assessments
 */

import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Target, Users, FolderKanban, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { StatCard } from '../../components/ui/stat-card';
import { cn } from '../../lib/utils';

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
      <StatCard
        title="Total Projects"
        value={metrics.totalProjects}
        icon={<FolderKanban className="w-6 h-6" />}
        iconColor="info"
        description={`${metrics.activeProjects} active`}
      />

      <StatCard
        title="Completed"
        value={metrics.completedProjects}
        icon={<CheckCircle2 className="w-6 h-6" />}
        iconColor="success"
        description={`${metrics.totalProjects > 0 ? Math.round((metrics.completedProjects / metrics.totalProjects) * 100) : 0}% completion rate`}
      />

      <StatCard
        title="Secured Funding"
        value={`$${(metrics.totalSecuredFunding / 1000000).toFixed(1)}M`}
        icon={<DollarSign className="w-6 h-6" />}
        iconColor="warning"
        description={`${fundingPercentage}% of $${(metrics.totalBudget / 1000000).toFixed(1)}M budget`}
      />

      <StatCard
        title={fundingGap > 0 ? 'Funding Gap' : 'Surplus'}
        value={`$${Math.abs(fundingGap / 1000000).toFixed(1)}M`}
        icon={fundingGap > 0 ? <TrendingDown className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
        iconColor={fundingGap > 0 ? 'destructive' : 'success'}
      />

      <StatCard
        title="tCO2e Reduction"
        value={metrics.totalGhgReduction.toLocaleString()}
        icon={<Target className="w-6 h-6" />}
        iconColor="success"
        description="Estimated annual impact"
      />

      <StatCard
        title="Milestones"
        value={`${metrics.milestonesCompleted}/${metrics.milestonesTotal}`}
        icon={metrics.delayedMilestones > 0 ? <AlertTriangle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
        iconColor={metrics.delayedMilestones > 0 ? 'warning' : 'info'}
        description={metrics.delayedMilestones > 0 ? `${metrics.delayedMilestones} delayed` : undefined}
      />
    </>
  );

  const renderAssessmentCards = () => (
    <>
      <StatCard
        title="Communities"
        value={metrics.uniqueCommunities}
        icon={<Users className="w-6 h-6" />}
        iconColor="info"
        description={`${metrics.totalAssessments} assessments`}
      />

      <StatCard
        title="Avg. Score"
        value={`${Math.round(metrics.avgOverallScore)}%`}
        icon={metrics.avgOverallScore >= 60 ? <TrendingUp className="w-6 h-6" /> : <Minus className="w-6 h-6" />}
        iconColor={metrics.avgOverallScore >= 60 ? 'success' : 'warning'}
        description="Across all assessments"
      />

      <StatCard
        title="High Priority"
        value={metrics.highPriorityRecs}
        icon={<AlertTriangle className="w-6 h-6" />}
        iconColor="warning"
        description={`of ${metrics.totalRecommendations} recommendations`}
      />

      <StatCard
        title="Completed Recs"
        value={metrics.completedRecs}
        icon={<CheckCircle2 className="w-6 h-6" />}
        iconColor="success"
        description={`${metrics.totalRecommendations > 0 ? Math.round((metrics.completedRecs / metrics.totalRecommendations) * 100) : 0}% implementation`}
      />
    </>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-6">
      {(type === 'projects' || type === 'combined') && renderProjectCards()}
      {(type === 'assessments' || type === 'combined') && renderAssessmentCards()}
    </div>
  );
}

export default DashboardKPICards;
