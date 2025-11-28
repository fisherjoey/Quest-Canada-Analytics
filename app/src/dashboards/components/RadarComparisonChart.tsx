/**
 * Radar Comparison Chart Component
 *
 * Displays a radar/spider chart comparing multiple assessments
 * across all 10 indicators - perfect for visual comparison
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '@src/lib/style-utils';

interface RadarComparisonChartProps {
  assessments: any[];
  onIndicatorClick?: (indicatorNumber: number | null) => void;
}

const INDICATOR_NAMES = [
  'Governance',
  'Capacity',
  'Planning',
  'Infrastructure',
  'Operations',
  'Buildings',
  'Transportation',
  'Waste',
  'Energy',
  'Other'
];

export function RadarComparisonChart({ assessments, onIndicatorClick }: RadarComparisonChartProps) {
  const { series, options } = useMemo(() => {
    // Build series data for each assessment
    const seriesData = assessments.map(assessment => {
      const indicatorScores = INDICATOR_NAMES.map((_, idx) => {
        const indicator = assessment.indicators?.find(
          (i: any) => i.indicatorNumber === idx + 1
        );
        return indicator ? indicator.percentageScore || 0 : 0;
      });

      return {
        name: `${assessment.community?.name || 'Unknown'} (${assessment.assessmentYear})`,
        data: indicatorScores
      };
    });

    const chartOptions: ApexOptions = {
      chart: {
        type: 'radar',
        height: 450,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        },
        events: {
          dataPointSelection: (_event: any, _chartContext: any, config: any) => {
            if (onIndicatorClick) {
              onIndicatorClick(config.dataPointIndex + 1);
            }
          }
        }
      },
      colors: assessments.map(a => a.color || CHART_COLORS.questTeal),
      stroke: {
        width: 2
      },
      fill: {
        opacity: 0.2
      },
      markers: {
        size: 4,
        hover: {
          size: 6
        }
      },
      xaxis: {
        categories: INDICATOR_NAMES,
        labels: {
          style: {
            colors: Array(10).fill('hsl(var(--foreground))'),
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        tickAmount: 5,
        labels: {
          formatter: (val: number) => `${val}%`
        }
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        floating: false,
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
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val.toFixed(1)}%`
        }
      },
      plotOptions: {
        radar: {
          size: 180,
          polygons: {
            strokeColors: 'hsl(var(--border))',
            connectorColors: 'hsl(var(--border))',
            fill: {
              colors: ['hsl(var(--muted))', 'hsl(var(--background))']
            }
          }
        }
      }
    };

    return { series: seriesData, options: chartOptions };
  }, [assessments, onIndicatorClick]);

  if (assessments.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground bg-muted rounded-lg">
        <p>Select assessments to view radar comparison</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="radar"
        height={450}
      />
      {onIndicatorClick && (
        <p className="text-center text-xs text-muted-foreground mt-2 mb-0">Click on an indicator point to view details</p>
      )}
    </div>
  );
}

export default RadarComparisonChart;
