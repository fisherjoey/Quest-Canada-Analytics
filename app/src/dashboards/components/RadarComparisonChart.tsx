/**
 * Radar Comparison Chart Component
 *
 * Displays a radar/spider chart comparing multiple assessments
 * across all 10 indicators - perfect for visual comparison
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

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
      colors: assessments.map(a => a.color || '#00a9a6'),
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
            colors: Array(10).fill('#333'),
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
          size: 8,
          shape: 'circle'
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
            strokeColors: '#e8e8e8',
            strokeWidth: 1,
            connectorColors: '#e8e8e8',
            fill: {
              colors: ['#f8f8f8', '#fff']
            }
          }
        }
      }
    };

    return { series: seriesData, options: chartOptions };
  }, [assessments, onIndicatorClick]);

  if (assessments.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>Select assessments to view radar comparison</p>
      </div>
    );
  }

  return (
    <div className="radar-chart-container">
      <ReactApexChart
        options={options}
        series={series}
        type="radar"
        height={450}
      />
      {onIndicatorClick && (
        <p className="chart-hint">Click on an indicator point to view details</p>
      )}
      <style>{radarStyles}</style>
    </div>
  );
}

const radarStyles = `
  .radar-chart-container {
    width: 100%;
  }

  .chart-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 400px;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .chart-hint {
    text-align: center;
    font-size: 12px;
    color: #999;
    margin: 8px 0 0 0;
  }
`;

export default RadarComparisonChart;
