/**
 * Milestone Timeline Component
 * Displays project milestones as a Gantt-style chart
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface MilestoneTimelineProps {
  projects: any[];
}

const STATUS_COLORS: Record<string, string> = {
  NOT_STARTED: '#95a5a6',
  IN_PROGRESS: '#3498db',
  COMPLETED: '#27ae60',
  DELAYED: '#e74c3c',
  CANCELLED: '#7f8c8d',
};

export function MilestoneTimeline({ projects }: MilestoneTimelineProps) {
  const { series, options, milestoneCount } = useMemo(() => {
    // Collect milestones from all projects
    const milestones: any[] = [];

    projects.forEach(project => {
      (project.milestones || []).forEach((milestone: any) => {
        milestones.push({
          ...milestone,
          projectName: project.projectName,
          projectCode: project.projectCode,
        });
      });
    });

    if (milestones.length === 0) {
      return { series: [], options: {} as ApexOptions, milestoneCount: 0 };
    }

    // Sort by target date
    milestones.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());

    // Build series data for timeline
    const seriesData = milestones.slice(0, 20).map(m => ({
      x: `${m.projectCode || m.projectName}: ${m.milestoneName}`,
      y: [
        new Date(m.targetDate).getTime() - (7 * 24 * 60 * 60 * 1000), // Start 1 week before target
        m.actualDate ? new Date(m.actualDate).getTime() : new Date(m.targetDate).getTime(),
      ],
      fillColor: STATUS_COLORS[m.status] || '#999',
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
          const milestone = milestones[dataPointIndex];
          return `
            <div style="padding: 12px; font-size: 12px;">
              <strong>${milestone.projectName}</strong><br/>
              <span style="color: #666;">${milestone.milestoneName}</span><br/>
              <span>Target: ${new Date(milestone.targetDate).toLocaleDateString()}</span><br/>
              ${milestone.actualDate ? `<span>Completed: ${new Date(milestone.actualDate).toLocaleDateString()}</span><br/>` : ''}
              <span class="status-${milestone.status?.toLowerCase()}">${milestone.status?.replace('_', ' ')}</span>
            </div>
          `;
        },
      },
      colors: ['#00a9a6'],
      dataLabels: { enabled: false },
      grid: {
        borderColor: '#e8e8e8',
        xaxis: { lines: { show: true } },
      },
    };

    return {
      series: [{ data: seriesData }],
      options: chartOptions,
      milestoneCount: milestones.length,
    };
  }, [projects]);

  if (milestoneCount === 0) {
    return (
      <div className="chart-placeholder">
        <p>No milestones to display</p>
      </div>
    );
  }

  return (
    <div className="milestone-timeline">
      <ReactApexChart
        options={options}
        series={series}
        type="rangeBar"
        height={Math.max(300, milestoneCount * 35)}
      />

      <div className="milestone-legend">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: color }} />
            <span>{status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      <style>{`
        .milestone-timeline { width: 100%; }
        .chart-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: #999;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .milestone-legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #666;
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

export default MilestoneTimeline;
