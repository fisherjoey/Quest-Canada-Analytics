/**
 * Recommendations Pie Chart Component
 *
 * Displays a donut chart showing recommendation breakdown
 * by priority level or implementation status
 */

import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { cn } from '../../lib/utils';
import { CHART_COLORS, PRIORITY_CHART_COLORS, STATUS_CHART_COLORS } from '../../lib/style-utils';

interface RecommendationsPieChartProps {
  assessments: any[];
  groupBy?: 'priority' | 'status';
}

const PRIORITY_COLORS = {
  HIGH: CHART_COLORS.destructive,
  MEDIUM: CHART_COLORS.warning,
  LOW: CHART_COLORS.success
};

const STATUS_COLORS = {
  PLANNED: CHART_COLORS.info,
  IN_PROGRESS: CHART_COLORS.warning,
  COMPLETED: CHART_COLORS.success,
  DEFERRED: 'hsl(140, 10%, 60%)',
  CANCELLED: CHART_COLORS.destructive
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
    const colors = labels.map(label => (colorMap as any)[label] || 'hsl(var(--muted-foreground))');

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
                color: 'hsl(var(--muted-foreground))',
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
        colors: ['hsl(var(--background))']
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
      <div className="flex flex-col items-center justify-center h-[320px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">No recommendations available for selected assessments</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Group By Toggle */}
      <div className="flex gap-2 mb-4 justify-center">
        <button
          className={cn(
            "py-1.5 px-4 border-2 border-border bg-background rounded-full text-xs font-medium text-muted-foreground cursor-pointer transition-all hover:border-quest-teal hover:text-quest-teal",
            selectedGroupBy === 'priority' && "bg-quest-teal border-quest-teal text-white hover:text-white"
          )}
          onClick={() => setSelectedGroupBy('priority')}
        >
          By Priority
        </button>
        <button
          className={cn(
            "py-1.5 px-4 border-2 border-border bg-background rounded-full text-xs font-medium text-muted-foreground cursor-pointer transition-all hover:border-quest-teal hover:text-quest-teal",
            selectedGroupBy === 'status' && "bg-quest-teal border-quest-teal text-white hover:text-white"
          )}
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
    </div>
  );
}

export default RecommendationsPieChart;
