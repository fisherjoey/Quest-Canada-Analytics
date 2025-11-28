/**
 * Project Status Chart Component
 * Displays project distribution by status as a donut chart
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ProjectStatusChartProps {
  projects: any[];
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: '#9b59b6',
  IN_DESIGN: '#3498db',
  FUNDED: '#1abc9c',
  IN_PROGRESS: '#f39c12',
  COMPLETED: '#27ae60',
  ON_HOLD: '#95a5a6',
  CANCELLED: '#e74c3c',
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planned',
  IN_DESIGN: 'In Design',
  FUNDED: 'Funded',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CANCELLED: 'Cancelled',
};

export function ProjectStatusChart({ projects }: ProjectStatusChartProps) {
  const { series, options } = useMemo(() => {
    const statusCounts: Record<string, number> = {};

    projects.forEach(project => {
      const status = project.status || 'PLANNED';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const labels = Object.keys(statusCounts).map(s => STATUS_LABELS[s] || s);
    const data = Object.values(statusCounts);
    const colors = Object.keys(statusCounts).map(s => STATUS_COLORS[s] || '#999');

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
        horizontalAlign: 'center',
        fontSize: '13px',
        markers: { width: 10, height: 10, radius: 10 },
        itemMargin: { horizontal: 10, vertical: 5 },
      },
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: { show: true, fontSize: '14px', fontWeight: 600 },
              value: { show: true, fontSize: '20px', fontWeight: 700 },
              total: {
                show: true,
                label: 'Total Projects',
                fontSize: '12px',
                color: '#666',
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      tooltip: {
        y: {
          formatter: (val: number, opts: any) => {
            const total = opts.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
            const percent = ((val / total) * 100).toFixed(1);
            return `${val} (${percent}%)`;
          },
        },
      },
      stroke: { width: 2, colors: ['#fff'] },
    };

    return { series: data, options: chartOptions };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>No projects to display</p>
      </div>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="donut"
      height={300}
    />
  );
}

export default ProjectStatusChart;
