/**
 * Funding Chart Component
 * Displays funding breakdown by type and status
 */

import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface FundingChartProps {
  projects: any[];
}

const FUNDER_TYPE_COLORS: Record<string, string> = {
  FEDERAL: '#2196f3',
  PROVINCIAL: '#4caf50',
  MUNICIPAL: '#ff9800',
  FOUNDATION: '#9c27b0',
  CORPORATE: '#607d8b',
  UTILITY: '#00bcd4',
  OTHER: '#795548',
};

const FUNDING_STATUS_COLORS: Record<string, string> = {
  RECEIVED: '#27ae60',
  APPROVED: '#3498db',
  PENDING: '#f39c12',
  DENIED: '#e74c3c',
  WITHDRAWN: '#95a5a6',
};

export function FundingChart({ projects }: FundingChartProps) {
  const [viewMode, setViewMode] = useState<'type' | 'status'>('type');

  const { series, options, totalFunding } = useMemo(() => {
    // Collect all funding from all projects
    const allFunding = projects.flatMap(p => p.fundingSources || []);

    if (allFunding.length === 0) {
      return { series: [], options: {} as ApexOptions, totalFunding: 0 };
    }

    const totals: Record<string, number> = {};
    const colorMap = viewMode === 'type' ? FUNDER_TYPE_COLORS : FUNDING_STATUS_COLORS;

    allFunding.forEach(funding => {
      const key = viewMode === 'type' ? funding.funderType : funding.status;
      totals[key] = (totals[key] || 0) + (funding.amount || 0);
    });

    const labels = Object.keys(totals).map(k => k.replace('_', ' '));
    const data = Object.values(totals);
    const colors = Object.keys(totals).map(k => colorMap[k] || '#999');
    const total = data.reduce((a, b) => a + b, 0);

    const chartOptions: ApexOptions = {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      },
      colors,
      labels,
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '12px',
        markers: { width: 10, height: 10, radius: 10 },
        itemMargin: { horizontal: 8, vertical: 4 },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px' },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: 700,
                formatter: (val: string) => `$${Number(val).toLocaleString()}`,
              },
              total: {
                show: true,
                label: 'Total Funding',
                fontSize: '11px',
                formatter: () => `$${total.toLocaleString()}`,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        y: {
          formatter: (val: number) => `$${val.toLocaleString()}`,
        },
      },
      stroke: { width: 2, colors: ['#fff'] },
    };

    return { series: data, options: chartOptions, totalFunding: total };
  }, [projects, viewMode]);

  if (projects.length === 0 || totalFunding === 0) {
    return (
      <div className="chart-placeholder">
        <p>No funding data to display</p>
      </div>
    );
  }

  return (
    <div className="funding-chart-container">
      <div className="view-toggle">
        <button
          className={viewMode === 'type' ? 'active' : ''}
          onClick={() => setViewMode('type')}
        >
          By Funder Type
        </button>
        <button
          className={viewMode === 'status' ? 'active' : ''}
          onClick={() => setViewMode('status')}
        >
          By Status
        </button>
      </div>

      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={300}
      />

      <style>{`
        .funding-chart-container { width: 100%; }
        .view-toggle {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-bottom: 16px;
        }
        .view-toggle button {
          padding: 6px 14px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .view-toggle button:hover { border-color: #00a9a6; color: #00a9a6; }
        .view-toggle button.active {
          background: #00a9a6;
          border-color: #00a9a6;
          color: white;
        }
        .chart-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #999;
          background: #f9f9f9;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}

export default FundingChart;
