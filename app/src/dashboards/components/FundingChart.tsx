/**
 * Funding Chart Component
 * Displays funding breakdown by type and status
 */

import React, { useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { cn } from '../../lib/utils';
import { CHART_COLORS } from '../../lib/style-utils';

interface FundingChartProps {
  projects: any[];
}

const FUNDER_TYPE_COLORS: Record<string, string> = {
  FEDERAL: CHART_COLORS.info,
  PROVINCIAL: CHART_COLORS.success,
  MUNICIPAL: CHART_COLORS.warning,
  FOUNDATION: CHART_COLORS.purple,
  CORPORATE: 'hsl(200, 12%, 47%)',
  UTILITY: CHART_COLORS.questTeal,
  OTHER: 'hsl(16, 25%, 38%)',
};

const FUNDING_STATUS_COLORS: Record<string, string> = {
  RECEIVED: CHART_COLORS.success,
  APPROVED: CHART_COLORS.info,
  PENDING: CHART_COLORS.warning,
  DENIED: CHART_COLORS.destructive,
  WITHDRAWN: 'hsl(140, 10%, 60%)',
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
    const colors = Object.keys(totals).map(k => colorMap[k] || 'hsl(var(--muted-foreground))');
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
      stroke: { width: 2, colors: ['hsl(var(--background))'] },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 280
            },
            legend: {
              fontSize: '11px',
              itemMargin: { horizontal: 6, vertical: 3 }
            },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    name: { fontSize: '11px' },
                    value: { fontSize: '14px' },
                    total: { fontSize: '10px' }
                  }
                }
              }
            }
          }
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 260
            },
            legend: {
              fontSize: '10px',
              itemMargin: { horizontal: 4, vertical: 2 }
            },
            plotOptions: {
              pie: {
                donut: {
                  size: '60%',
                  labels: {
                    name: { fontSize: '10px' },
                    value: { fontSize: '12px' },
                    total: { fontSize: '9px' }
                  }
                }
              }
            }
          }
        }
      ]
    };

    return { series: data, options: chartOptions, totalFunding: total };
  }, [projects, viewMode]);

  if (projects.length === 0 || totalFunding === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">Add funding sources to projects to view breakdown</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-center gap-2 mb-4">
        <button
          className={cn(
            "py-1.5 px-3.5 border-2 border-border bg-background rounded-full text-xs font-medium cursor-pointer transition-all hover:border-quest-teal hover:text-quest-teal",
            viewMode === 'type' && "bg-quest-teal border-quest-teal text-white hover:text-white"
          )}
          onClick={() => setViewMode('type')}
        >
          By Funder Type
        </button>
        <button
          className={cn(
            "py-1.5 px-3.5 border-2 border-border bg-background rounded-full text-xs font-medium cursor-pointer transition-all hover:border-quest-teal hover:text-quest-teal",
            viewMode === 'status' && "bg-quest-teal border-quest-teal text-white hover:text-white"
          )}
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
    </div>
  );
}

export default FundingChart;
