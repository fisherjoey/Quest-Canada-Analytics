/**
 * KPI Cards Component
 *
 * Displays key performance indicator cards summarizing
 * the selected assessments at a glance
 */

import React, { useMemo } from 'react';
import { Award, TrendingUp, CheckCircle, AlertCircle, Target, FileText } from 'lucide-react';
import { StatCard } from '../../components/ui/stat-card';
import { getScoreLevel, type IconColor } from '../../lib/style-utils';

interface KPICardsProps {
  assessments: any[];
}

export function KPICards({ assessments }: KPICardsProps) {
  const stats = useMemo(() => {
    if (assessments.length === 0) return null;

    // Calculate aggregate statistics
    const totalAssessments = assessments.length;

    // Average overall score
    const scores = assessments
      .filter(a => a.overallScore !== null)
      .map(a => a.overallScore);
    const avgScore = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;

    // Highest and lowest scores
    const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
    const minScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Total indicators across all assessments
    const totalIndicators = assessments.reduce(
      (sum, a) => sum + (a.indicators?.length || 0),
      0
    );

    // Average indicator score
    const allIndicatorScores = assessments.flatMap(a =>
      (a.indicators || []).map((i: any) => i.percentageScore || 0)
    );
    const avgIndicatorScore = allIndicatorScores.length > 0
      ? allIndicatorScores.reduce((a, b) => a + b, 0) / allIndicatorScores.length
      : 0;

    // Recommendations breakdown
    const allRecommendations = assessments.flatMap(a => a.recommendations || []);
    const highPriorityRecs = allRecommendations.filter(r => r.priorityLevel === 'HIGH').length;
    const completedRecs = allRecommendations.filter(r => r.implementationStatus === 'COMPLETED').length;

    // Strengths count
    const totalStrengths = assessments.reduce(
      (sum, a) => sum + (a.strengths?.length || 0),
      0
    );

    // Communities represented
    const uniqueCommunities = new Set(assessments.map(a => a.community?.id)).size;

    return {
      totalAssessments,
      uniqueCommunities,
      avgScore,
      maxScore,
      minScore,
      totalIndicators,
      avgIndicatorScore,
      totalRecommendations: allRecommendations.length,
      highPriorityRecs,
      completedRecs,
      completionRate: allRecommendations.length > 0
        ? (completedRecs / allRecommendations.length) * 100
        : 0,
      totalStrengths
    };
  }, [assessments]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[120px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25 mb-6">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">Select assessments to view key performance indicators</p>
      </div>
    );
  }

  // Map score level to icon color
  const getScoreIconColor = (score: number): IconColor => {
    const level = getScoreLevel(score);
    switch (level) {
      case 'excellent':
      case 'good':
        return 'success';
      case 'fair':
        return 'warning';
      default:
        return 'destructive';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {/* Average Score Card */}
      <StatCard
        title="Average Score"
        value={`${stats.avgScore.toFixed(1)}%`}
        icon={<Award className="w-6 h-6" />}
        iconColor={getScoreIconColor(stats.avgScore)}
        description={`Range: ${stats.minScore.toFixed(0)}% - ${stats.maxScore.toFixed(0)}%`}
        className="border-2 border-quest-teal"
      />

      {/* Assessments Count */}
      <StatCard
        title="Assessments Selected"
        value={stats.totalAssessments}
        icon={<FileText className="w-6 h-6" />}
        iconColor="info"
        description={`${stats.uniqueCommunities} ${stats.uniqueCommunities === 1 ? 'community' : 'communities'}`}
      />

      {/* Indicator Performance */}
      <StatCard
        title="Avg Indicator Score"
        value={`${stats.avgIndicatorScore.toFixed(1)}%`}
        icon={<Target className="w-6 h-6" />}
        iconColor={getScoreIconColor(stats.avgIndicatorScore)}
        description={`${stats.totalIndicators} total indicators`}
      />

      {/* Recommendations */}
      <StatCard
        title="Recommendations"
        value={stats.totalRecommendations}
        icon={<AlertCircle className="w-6 h-6" />}
        iconColor={stats.highPriorityRecs > 0 ? 'destructive' : 'primary'}
        description={`${stats.highPriorityRecs} high priority`}
      />

      {/* Completion Rate */}
      <StatCard
        title="Rec. Completion Rate"
        value={`${stats.completionRate.toFixed(0)}%`}
        icon={<CheckCircle className="w-6 h-6" />}
        iconColor="success"
        description={`${stats.completedRecs} of ${stats.totalRecommendations} completed`}
      />

      {/* Strengths */}
      <StatCard
        title="Strengths Identified"
        value={stats.totalStrengths}
        icon={<TrendingUp className="w-6 h-6" />}
        iconColor="quest-teal"
        description={`Avg ${(stats.totalStrengths / stats.totalAssessments).toFixed(1)} per assessment`}
      />
    </div>
  );
}

export default KPICards;
