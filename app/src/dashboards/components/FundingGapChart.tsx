/**
 * Funding Gap Chart Component
 * Displays budget vs secured funding for projects
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '@src/lib/style-utils';

interface FundingGapChartProps {
  projects: any[];
}

export function FundingGapChart({ projects }: FundingGapChartProps) {
  const { series, options, totalGap } = useMemo(() => {
    // Filter to projects with budget data
    const projectsWithBudget = projects
      .filter(p => p.totalBudget || p.estimatedCost)
      .slice(0, 10);

    if (projectsWithBudget.length === 0) {
      return { series: [], options: {} as ApexOptions, totalGap: 0 };
    }

    const categories = projectsWithBudget.map(p => p.projectCode || p.projectName.slice(0, 20));
    const budgets = projectsWithBudget.map(p => p.totalBudget || p.estimatedCost || 0);
    const secured = projectsWithBudget.map(p => {
      const fundingSources = p.fundingSources || [];
      return fundingSources
        .filter((f: any) => f.status === 'RECEIVED' || f.status === 'APPROVED')
        .reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
    });
    const gaps = budgets.map((b, i) => Math.max(0, b - secured[i]));
    const gap = gaps.reduce((a, b) => a + b, 0);

    const chartOptions: ApexOptions = {
      chart: {
        type: 'bar',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        toolbar: { show: true },
        stacked: true,
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '70%',
        },
      },
      colors: [CHART_COLORS.success, CHART_COLORS.destructive],
      xaxis: {
        categories,
        labels: {
          formatter: (val: string) => `$${(Number(val) / 1000).toFixed(0)}K`,
          style: { fontSize: '11px' },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '11px' },
          maxWidth: 150,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'center',
        fontSize: '12px',
        markers: { width: 10, height: 10, radius: 2 },
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => (val > 0 ? `$${(val / 1000).toFixed(0)}K` : ''),
        style: { fontSize: '10px', colors: ['#fff'] },
      },
      tooltip: {
        y: {
          formatter: (val: number) => `$${val.toLocaleString()}`,
        },
      },
      grid: {
        borderColor: 'hsl(var(--border))',
        xaxis: { lines: { show: true } },
      },
    };

    return {
      series: [
        { name: 'Secured Funding', data: secured },
        { name: 'Funding Gap', data: gaps },
      ],
      options: chartOptions,
      totalGap: gap,
    };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground bg-muted rounded-lg">
        <p>No funding data to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {totalGap > 0 && (
        <div className="flex justify-center items-center gap-3 p-3 bg-destructive-muted rounded-lg mb-4">
          <span className="text-sm text-muted-foreground">Total Funding Gap:</span>
          <span className="text-xl font-bold text-destructive">${totalGap.toLocaleString()}</span>
        </div>
      )}

      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={Math.max(250, projects.length * 40)}
      />
    </div>
  );
}

export default FundingGapChart;
