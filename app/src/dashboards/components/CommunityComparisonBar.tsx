/**
 * Community Comparison Bar Chart Component
 * Compares metrics across multiple communities
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS, getScoreChartColor } from '@src/lib/style-utils';

interface CommunityComparisonBarProps {
  assessments: any[];
  metric?: 'overall' | 'indicator';
  indicatorNumber?: number;
}

const INDICATOR_NAMES = [
  'Governance', 'Capacity', 'Planning', 'Infrastructure', 'Operations',
  'Buildings', 'Transportation', 'Waste', 'Energy', 'Other'
];

export function CommunityComparisonBar({
  assessments,
  metric = 'overall',
  indicatorNumber = 1
}: CommunityComparisonBarProps) {
  const { series, options } = useMemo(() => {
    if (assessments.length === 0) {
      return { series: [], options: {} as ApexOptions };
    }

    // Get unique communities and their latest assessments
    const communityMap = new Map<string, any>();
    assessments.forEach(a => {
      const communityId = a.community?.id || 'unknown';
      const existing = communityMap.get(communityId);
      if (!existing || a.assessmentYear > existing.assessmentYear) {
        communityMap.set(communityId, a);
      }
    });

    const latestAssessments = Array.from(communityMap.values())
      .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0))
      .slice(0, 10);

    const categories = latestAssessments.map(a =>
      `${a.community?.name || 'Unknown'} (${a.assessmentYear})`
    );

    let data: number[];
    let seriesName: string;

    if (metric === 'overall') {
      data = latestAssessments.map(a => Math.round(a.overallScore || 0));
      seriesName = 'Overall Score';
    } else {
      data = latestAssessments.map(a => {
        const indicator = (a.indicators || []).find((i: any) => i.indicatorNumber === indicatorNumber);
        return indicator ? Math.round(indicator.percentageScore || 0) : 0;
      });
      seriesName = `${INDICATOR_NAMES[indicatorNumber - 1]} Score`;
    }

    const chartOptions: ApexOptions = {
      chart: {
        type: 'bar',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '65%',
          distributed: true,
          dataLabels: { position: 'top' },
        },
      },
      colors: data.map(score => getScoreChartColor(score)),
      xaxis: {
        categories,
        min: 0,
        max: 100,
        labels: {
          formatter: (val: string) => `${val}%`,
          style: { fontSize: '11px' },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '11px' },
          maxWidth: 180,
        },
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}%`,
        style: { fontSize: '11px', fontWeight: 600, colors: ['hsl(var(--foreground))'] },
        offsetX: 30,
      },
      tooltip: {
        y: { formatter: (val: number) => `${val}%` },
      },
      grid: {
        borderColor: 'hsl(var(--border))',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
    };

    return {
      series: [{ name: seriesName, data }],
      options: chartOptions,
    };
  }, [assessments, metric, indicatorNumber]);

  if (assessments.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-muted-foreground bg-muted rounded-lg">
        <p>No assessments to compare</p>
      </div>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={Math.max(280, assessments.length * 40)}
    />
  );
}

export default CommunityComparisonBar;
