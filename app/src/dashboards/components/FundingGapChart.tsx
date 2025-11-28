/**
 * Funding Gap Chart Component
 * Displays budget vs secured funding for projects
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

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
      colors: ['#27ae60', '#e74c3c'],
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
        borderColor: '#e8e8e8',
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
      <div className="chart-placeholder">
        <p>No funding data to display</p>
      </div>
    );
  }

  return (
    <div className="funding-gap-chart">
      {totalGap > 0 && (
        <div className="total-gap-banner">
          <span className="gap-label">Total Funding Gap:</span>
          <span className="gap-amount">${totalGap.toLocaleString()}</span>
        </div>
      )}

      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={Math.max(250, projects.length * 40)}
      />

      <style>{`
        .funding-gap-chart { width: 100%; }
        .chart-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 250px;
          color: #999;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .total-gap-banner {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #fee;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        .gap-label {
          font-size: 14px;
          color: #666;
        }
        .gap-amount {
          font-size: 20px;
          font-weight: 700;
          color: #e74c3c;
        }
      `}</style>
    </div>
  );
}

export default FundingGapChart;
