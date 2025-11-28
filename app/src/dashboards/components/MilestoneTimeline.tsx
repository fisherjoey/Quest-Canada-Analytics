/**
 * Milestone Timeline Component
 * Displays project milestones as a Gantt-style chart
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '@src/lib/style-utils';

interface MilestoneTimelineProps {
  projects: any[];
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: 'hsl(140, 10%, 60%)',
  IN_PROGRESS: CHART_COLORS.info,
  COMPLETED: CHART_COLORS.success,
  DELAYED: CHART_COLORS.destructive,
  CANCELLED: 'hsl(200, 5%, 50%)',
};

export function MilestoneTimeline({ projects }: MilestoneTimelineProps) {
  const { series, options, milestoneCount, milestones } = useMemo(() => {
    // Collect milestones from all projects
    const allMilestones: any[] = [];

    projects.forEach(project => {
      (project.milestones || []).forEach((milestone: any) => {
        allMilestones.push({
          ...milestone,
          projectName: project.projectName,
          projectCode: project.projectCode,
        });
      });
    });

    if (allMilestones.length === 0) {
      return { series: [], options: {} as ApexOptions, milestoneCount: 0, milestones: [] };
    }

    // Sort by target date
    allMilestones.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    // Build series data for timeline
    const seriesData = allMilestones.slice(0, 20).map(m => ({
      x: `${m.projectCode || m.projectName}: ${m.milestoneName}`,
      y: [
        new Date(m.targetDate).getTime() - (7 * 24 * 60 * 60 * 1000), // Start 1 week before target
        m.actualDate ? new Date(m.actualDate).getTime() : new Date(m.targetDate).getTime(),
      ],
      fillColor: STATUS_COLORS[m.status] || 'hsl(var(--muted-foreground))',
    }));

    const chartOptions: ApexOptions = {
      chart: {
        type: 'rangeBar',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        toolbar: { show: true },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 4,
          barHeight: '60%',
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeFormatter: {
            year: 'yyyy',
            month: "MMM 'yy",
            day: 'dd MMM',
          },
        },
      },
      yaxis: {
        labels: {
          style: { fontSize: '11px' },
          maxWidth: 200,
        },
      },
      tooltip: {
        custom: ({ seriesIndex, dataPointIndex, w }: any) => {
          const milestone = allMilestones[dataPointIndex];
          return `
            <div style="padding: 12px; font-size: 12px;">
              <strong>${milestone.projectName}</strong><br/>
              <span style="color: hsl(var(--muted-foreground));">${milestone.milestoneName}</span><br/>
              <span>Target: ${new Date(milestone.targetDate).toLocaleDateString()}</span><br/>
              ${milestone.actualDate ? `<span>Completed: ${new Date(milestone.actualDate).toLocaleDateString()}</span><br/>` : ''}
              <span>${milestone.status?.replace('_', ' ')}</span>
            </div>
          `;
        },
      },
      colors: [CHART_COLORS.questTeal],
      dataLabels: { enabled: false },
      grid: {
        borderColor: 'hsl(var(--border))',
        xaxis: { lines: { show: true } },
      },
    };

    return {
      series: [{ data: seriesData }],
      options: chartOptions,
      milestoneCount: allMilestones.length,
      milestones: allMilestones,
    };
  }, [projects]);

  if (milestoneCount === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground bg-muted rounded-lg">
        <p>No milestones to display</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="rangeBar"
        height={Math.max(300, milestoneCount * 35)}
      />

      <div className="flex flex-wrap justify-center gap-4 mt-3 pt-3 border-t border-border">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MilestoneTimeline;
