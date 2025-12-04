/**
 * Bar Comparison Chart Component
 *
 * Displays a horizontal or vertical bar chart comparing
 * overall scores or specific indicator scores across assessments
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '../../lib/style-utils';

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

    const colors = assessments.map(a => a.color || CHART_COLORS.questTeal);

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
          colors: ['hsl(var(--foreground))']
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
        borderColor: 'hsl(var(--border))',
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
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 280
            },
            dataLabels: {
              style: {
                fontSize: '10px'
              }
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '10px'
                },
                maxHeight: 60
              }
            }
          }
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 250
            },
            plotOptions: {
              bar: {
                horizontal: true,
                columnWidth: '80%',
                barHeight: '80%'
              }
            },
            dataLabels: {
              offsetY: 0,
              offsetX: 25,
              style: {
                fontSize: '9px'
              }
            },
            xaxis: {
              labels: {
                rotate: 0,
                style: {
                  fontSize: '9px'
                }
              }
            }
          }
        }
      ]
    };

    // Add annotation line for changes
    if (showChange) {
      chartOptions.annotations = {
        yaxis: [{
          y: 0,
          borderColor: 'hsl(var(--muted-foreground))',
          borderWidth: 2,
          label: {
            text: 'No Change',
            style: {
              fontSize: '11px',
              color: 'hsl(var(--muted-foreground))'
            }
          }
        }]
      };
    }

    return { series: seriesData, options: chartOptions };
  }, [assessments, dataKey, indicatorNumber, label, showChange, horizontal]);

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">Select assessments above to view comparison</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={300}
      />
    </div>
  );
}

export default BarComparisonChart;
