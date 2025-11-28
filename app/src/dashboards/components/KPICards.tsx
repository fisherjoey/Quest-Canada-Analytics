/**
 * KPI Cards Component
 *
 * Displays key performance indicator cards summarizing
 * the selected assessments at a glance
 */

import React, { useMemo } from 'react';
import { Award, TrendingUp, CheckCircle, AlertCircle, Target, FileText } from 'lucide-react';

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

  if (!stats) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="kpi-cards">
      {/* Average Score Card */}
      <div className="kpi-card highlight">
        <div className="kpi-icon" style={{ background: getScoreColor(stats.avgScore) }}>
          <Award size={24} />
        </div>
        <div className="kpi-content">
          <div className="kpi-value" style={{ color: getScoreColor(stats.avgScore) }}>
            {stats.avgScore.toFixed(1)}%
          </div>
          <div className="kpi-label">Average Score</div>
          <div className="kpi-sublabel">
            Range: {stats.minScore.toFixed(0)}% - {stats.maxScore.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Assessments Count */}
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#3498db' }}>
          <FileText size={24} />
        </div>
        <div className="kpi-content">
          <div className="kpi-value">{stats.totalAssessments}</div>
          <div className="kpi-label">Assessments Selected</div>
          <div className="kpi-sublabel">
            {stats.uniqueCommunities} {stats.uniqueCommunities === 1 ? 'community' : 'communities'}
          </div>
        </div>
      </div>

      {/* Indicator Performance */}
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: getScoreColor(stats.avgIndicatorScore) }}>
          <Target size={24} />
        </div>
        <div className="kpi-content">
          <div className="kpi-value" style={{ color: getScoreColor(stats.avgIndicatorScore) }}>
            {stats.avgIndicatorScore.toFixed(1)}%
          </div>
          <div className="kpi-label">Avg Indicator Score</div>
          <div className="kpi-sublabel">{stats.totalIndicators} total indicators</div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: stats.highPriorityRecs > 0 ? '#e74c3c' : '#95a5a6' }}>
          <AlertCircle size={24} />
        </div>
        <div className="kpi-content">
          <div className="kpi-value">{stats.totalRecommendations}</div>
          <div className="kpi-label">Recommendations</div>
          <div className="kpi-sublabel">
            {stats.highPriorityRecs} high priority
          </div>
        </div>
      </div>

      {/* Completion Rate */}
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#27ae60' }}>
          <CheckCircle size={24} />
        </div>
        <div className="kpi-content">
          <div className="kpi-value">{stats.completionRate.toFixed(0)}%</div>
          <div className="kpi-label">Rec. Completion Rate</div>
          <div className="kpi-sublabel">
            {stats.completedRecs} of {stats.totalRecommendations} completed
          </div>
        </div>
      </div>

      {/* Strengths */}
      <div className="kpi-card">
        <div className="kpi-icon" style={{ background: '#9b59b6' }}>
          <TrendingUp size={24} />
        </div>
        <div className="kpi-content">
          <div className="kpi-value">{stats.totalStrengths}</div>
          <div className="kpi-label">Strengths Identified</div>
          <div className="kpi-sublabel">
            Avg {(stats.totalStrengths / stats.totalAssessments).toFixed(1)} per assessment
          </div>
        </div>
      </div>

      <style>{kpiStyles}</style>
    </div>
  );
}

const kpiStyles = `
  .kpi-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .kpi-card {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  }

  .kpi-card.highlight {
    background: linear-gradient(135deg, #f8f9fa 0%, #fff 100%);
    border: 2px solid #00a9a6;
  }

  .kpi-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 12px;
    color: white;
    flex-shrink: 0;
  }

  .kpi-content {
    flex: 1;
    min-width: 0;
  }

  .kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: #333;
    line-height: 1.1;
    margin-bottom: 4px;
  }

  .kpi-label {
    font-size: 13px;
    font-weight: 600;
    color: #666;
    margin-bottom: 2px;
  }

  .kpi-sublabel {
    font-size: 11px;
    color: #999;
  }

  @media (max-width: 768px) {
    .kpi-cards {
      grid-template-columns: repeat(2, 1fr);
    }

    .kpi-card {
      flex-direction: column;
      text-align: center;
    }

    .kpi-icon {
      margin: 0 auto;
    }
  }

  @media (max-width: 480px) {
    .kpi-cards {
      grid-template-columns: 1fr;
    }
  }
`;

export default KPICards;
