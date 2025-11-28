/**
 * Bar Comparison Chart Component
 *
 * Displays a horizontal or vertical bar chart comparing
 * overall scores or specific indicator scores across assessments
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface BarComparisonChartProps {
  assessments: any[];
  dataKey?: string;
  indicatorNumber?: number;
  label?: string;
  showChange?: boolean;
  horizontal?: boolean;
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

export function BarComparisonChart({
  assessments,
  dataKey = 'overallScore',
  indicatorNumber,
  label = 'Score',
  showChange = false,
  horizontal = false
}: BarComparisonChartProps) {
  const { series, options } = useMemo(() => {
    // Get data for each assessment
    const categories = assessments.map(a =>
      `${a.community?.name || 'Unknown'} (${a.assessmentYear})`
    );

    const data = assessments.map(assessment => {
      if (indicatorNumber) {
        const indicator = assessment.indicators?.find(
          (i: any) => i.indicatorNumber === indicatorNumber
        );
        return indicator ? indicator.percentageScore || 0 : 0;
      }
      return assessment[dataKey] || 0;
    });

    const colors = assessments.map(a => a.color || '#00a9a6');

    const seriesData = [{
      name: label,
      data: data
    }];

    const chartOptions: ApexOptions = {
      chart: {
        type: 'bar',
        height: 300,
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
        }
      },
      colors: colors,
      plotOptions: {
        bar: {
          horizontal: horizontal,
          borderRadius: 4,
          distributed: true,
          columnWidth: '60%',
          barHeight: '60%',
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => {
          if (showChange) {
            return val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
          }
          return `${val.toFixed(1)}%`;
        },
        offsetY: horizontal ? 0 : -20,
        offsetX: horizontal ? 30 : 0,
        style: {
          fontSize: '12px',
          fontWeight: 600,
          colors: ['#333']
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500
          },
          rotate: horizontal ? 0 : -45,
          rotateAlways: !horizontal,
          trim: true,
          maxHeight: 80
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        min: showChange ? undefined : 0,
        max: showChange ? undefined : 100,
        labels: {
          formatter: (val: number) => `${val}%`,
          style: {
            fontSize: '12px'
          }
        }
      },
      grid: {
        borderColor: '#e8e8e8',
        strokeDashArray: 4,
        xaxis: {
          lines: {
            show: horizontal
          }
        },
        yaxis: {
          lines: {
            show: !horizontal
          }
        }
      },
      legend: {
        show: false
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => {
            if (showChange) {
              return val > 0 ? `+${val.toFixed(1)}%` : `${val.toFixed(1)}%`;
            }
            return `${val.toFixed(1)}%`;
          }
        }
      },
      states: {
        hover: {
          filter: {
            type: 'darken',
            value: 0.85
          }
        }
      }
    };

    // Add annotation line for changes
    if (showChange) {
      chartOptions.annotations = {
        yaxis: [{
          y: 0,
          borderColor: '#999',
          borderWidth: 2,
          label: {
            text: 'No Change',
            style: {
              fontSize: '11px',
              color: '#666'
            }
          }
        }]
      };
    }

    return { series: seriesData, options: chartOptions };
  }, [assessments, dataKey, indicatorNumber, label, showChange, horizontal]);

  if (assessments.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>Select assessments to view comparison</p>
      </div>
    );
  }

  return (
    <div className="bar-chart-container">
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={300}
      />
      <style>{barStyles}</style>
    </div>
  );
}

const barStyles = `
  .bar-chart-container {
    width: 100%;
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
`;

export default BarComparisonChart;
