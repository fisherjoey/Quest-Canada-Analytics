/**
 * Recommendations Pie Chart Component
 *
 * Displays a donut chart showing recommendation breakdown
 * by priority level or implementation status
 */

import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface RecommendationsPieChartProps {
  assessments: any[];
  groupBy?: 'priority' | 'status';
}

const PRIORITY_COLORS = {
  HIGH: '#e74c3c',
  MEDIUM: '#f39c12',
  LOW: '#27ae60'
};

const STATUS_COLORS = {
  PLANNED: '#3498db',
  IN_PROGRESS: '#f39c12',
  COMPLETED: '#27ae60',
  DEFERRED: '#95a5a6',
  CANCELLED: '#e74c3c'
};

export function RecommendationsPieChart({
  assessments,
  groupBy = 'priority'
}: RecommendationsPieChartProps) {
  const [selectedGroupBy, setSelectedGroupBy] = useState<'priority' | 'status'>(groupBy);

  const { series, options, totalCount } = useMemo(() => {
    // Collect all recommendations from selected assessments
    const allRecommendations = assessments.flatMap(a => a.recommendations || []);

    if (allRecommendations.length === 0) {
      return { series: [], options: {} as ApexOptions, totalCount: 0 };
    }

    // Group by selected category
    const counts: Record<string, number> = {};
    const colorMap = selectedGroupBy === 'priority' ? PRIORITY_COLORS : STATUS_COLORS;

    allRecommendations.forEach(rec => {
      const key = selectedGroupBy === 'priority'
        ? rec.priorityLevel || 'MEDIUM'
        : rec.implementationStatus || 'PLANNED';
      counts[key] = (counts[key] || 0) + 1;
    });

    const labels = Object.keys(counts);
    const data = Object.values(counts);
    const colors = labels.map(label => (colorMap as any)[label] || '#999');

    const chartOptions: ApexOptions = {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
      },
      colors: colors,
      labels: labels.map(label => label.replace('_', ' ')),
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '13px',
        fontWeight: 500,
        markers: {
          width: 8,
          height: 8,
          radius: 8
        },
        itemMargin: {
          horizontal: 12,
          vertical: 8
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '24px',
                fontWeight: 700,
                offsetY: 5,
                formatter: (val: string) => val
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '14px',
                fontWeight: 500,
                color: '#666',
                formatter: (w: any) => {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      tooltip: {
        y: {
          formatter: (val: number, opts: any) => {
            const total = opts.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
            const percent = ((val / total) * 100).toFixed(1);
            return `${val} (${percent}%)`;
          }
        }
      },
      stroke: {
        width: 2,
        colors: ['#fff']
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 280
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };

    return {
      series: data,
      options: chartOptions,
      totalCount: allRecommendations.length
    };
  }, [assessments, selectedGroupBy]);

  if (assessments.length === 0 || totalCount === 0) {
    return (
      <div className="chart-placeholder">
        <p>No recommendations to display</p>
      </div>
    );
  }

  return (
    <div className="pie-chart-container">
      {/* Group By Toggle */}
      <div className="groupby-toggle">
        <button
          className={selectedGroupBy === 'priority' ? 'active' : ''}
          onClick={() => setSelectedGroupBy('priority')}
        >
          By Priority
        </button>
        <button
          className={selectedGroupBy === 'status' ? 'active' : ''}
          onClick={() => setSelectedGroupBy('status')}
        >
          By Status
        </button>
      </div>

      <ReactApexChart
        options={options}
        series={series}
        type="donut"
        height={320}
      />

      <style>{pieStyles}</style>
    </div>
  );
}

const pieStyles = `
  .pie-chart-container {
    width: 100%;
  }

  .chart-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 320px;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .groupby-toggle {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    justify-content: center;
  }

  .groupby-toggle button {
    padding: 6px 16px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    color: #666;
    cursor: pointer;
    transition: all 0.2s;
  }

  .groupby-toggle button:hover {
    border-color: #00a9a6;
    color: #00a9a6;
  }

  .groupby-toggle button.active {
    background: #00a9a6;
    border-color: #00a9a6;
    color: white;
  }
`;

export default RecommendationsPieChart;
