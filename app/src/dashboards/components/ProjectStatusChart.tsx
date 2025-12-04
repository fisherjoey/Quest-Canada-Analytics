/**
 * Project Status Chart Component
 * Displays project distribution by status as a donut chart
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '../../lib/style-utils';

interface ProjectStatusChartProps {
  projects: any[];
}

const STATUS_COLORS: Record<string, string> = {
  PLANNED: CHART_COLORS.purple,
  IN_DESIGN: CHART_COLORS.info,
  FUNDED: CHART_COLORS.questTeal,
  IN_PROGRESS: CHART_COLORS.warning,
  COMPLETED: CHART_COLORS.success,
  ON_HOLD: 'hsl(140, 10%, 60%)',
  CANCELLED: CHART_COLORS.destructive,
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
    const colors = Object.keys(statusCounts).map(s => STATUS_COLORS[s] || 'hsl(var(--muted-foreground))');

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
                color: 'hsl(var(--muted-foreground))',
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
      stroke: { width: 2, colors: ['hsl(var(--background))'] },
    };

    return { series: data, options: chartOptions };
  }, [projects]);

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">Create projects to view status distribution</p>
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
