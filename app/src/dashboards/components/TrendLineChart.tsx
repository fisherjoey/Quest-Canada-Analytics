/**
 * Trend Line Chart Component
 *
 * Displays year-over-year trends for communities
 * Can show overall scores or specific indicator trends
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '../../lib/style-utils';

interface CommunityTrend {
  communityId: string;
  communityName: string;
  color: string;
  assessments: any[];
}

interface TrendLineChartProps {
  communityTrends: CommunityTrend[];
  dataKey?: string;
  indicatorNumber?: number;
  label?: string;
}

export function TrendLineChart({
  communityTrends,
  dataKey = 'overallScore',
  indicatorNumber,
  label = 'Score'
}: TrendLineChartProps) {
  const { series, options } = useMemo(() => {
    // Get all unique years across all communities
    const allYears = new Set<number>();
    communityTrends.forEach(trend => {
      trend.assessments.forEach((a: any) => allYears.add(a.assessmentYear));
    });
    const sortedYears = Array.from(allYears).sort((a, b) => a - b);

    // Build series data for each community
    const seriesData = communityTrends.map(trend => {
      const data = sortedYears.map(year => {
        const assessment = trend.assessments.find((a: any) => a.assessmentYear === year);
        if (!assessment) return null;

        if (indicatorNumber) {
          const indicator = assessment.indicators?.find(
            (i: any) => i.indicatorNumber === indicatorNumber
          );
          return indicator ? indicator.percentageScore || 0 : null;
        }
        return assessment[dataKey] || null;
      });

      return {
        name: trend.communityName,
        data: data
      };
    });

    const colors = communityTrends.map(t => t.color);

    const chartOptions: ApexOptions = {
      chart: {
        type: 'line',
        height: 350,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true
          }
        },
        zoom: {
          enabled: true,
          type: 'x'
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      colors: colors,
      stroke: {
        width: 3,
        curve: 'smooth'
      },
      markers: {
        size: 6,
        strokeWidth: 2,
        strokeColors: 'hsl(var(--background))',
        hover: {
          size: 8
        }
      },
      xaxis: {
        categories: sortedYears.map(String),
        title: {
          text: 'Assessment Year',
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        min: 0,
        max: 100,
        title: {
          text: label,
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        },
        labels: {
          formatter: (val: number) => `${val}%`,
          style: {
            fontSize: '12px'
          }
        }
      },
      grid: {
        borderColor: 'hsl(var(--border))',
        strokeDashArray: 4
      },
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
      tooltip: {
        enabled: true,
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number | null) =>
            val !== null ? `${val.toFixed(1)}%` : 'N/A'
        }
      },
      annotations: {
        yaxis: [
          {
            y: 80,
            borderColor: CHART_COLORS.success,
            borderWidth: 1,
            strokeDashArray: 5,
            label: {
              text: 'Excellent (80%)',
              position: 'right',
              style: {
                fontSize: '10px',
                color: CHART_COLORS.success,
                background: 'transparent'
              }
            }
          },
          {
            y: 60,
            borderColor: CHART_COLORS.warning,
            borderWidth: 1,
            strokeDashArray: 5,
            label: {
              text: 'Good (60%)',
              position: 'right',
              style: {
                fontSize: '10px',
                color: CHART_COLORS.warning,
                background: 'transparent'
              }
            }
          }
        ]
      },
      responsive: [
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 300
            },
            markers: {
              size: 4
            },
            legend: {
              fontSize: '11px',
              itemMargin: {
                horizontal: 8,
                vertical: 4
              }
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '10px'
                }
              },
              title: {
                style: {
                  fontSize: '10px'
                }
              }
            },
            yaxis: {
              labels: {
                style: {
                  fontSize: '10px'
                }
              },
              title: {
                style: {
                  fontSize: '10px'
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
            stroke: {
              width: 2
            },
            markers: {
              size: 3
            },
            legend: {
              fontSize: '10px',
              itemMargin: {
                horizontal: 6,
                vertical: 3
              }
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '9px'
                }
              },
              title: {
                text: ''
              }
            },
            yaxis: {
              labels: {
                style: {
                  fontSize: '9px'
                }
              },
              title: {
                text: ''
              }
            },
            annotations: {
              yaxis: []
            }
          }
        }
      ]
    };

    return { series: seriesData, options: chartOptions };
  }, [communityTrends, dataKey, indicatorNumber, label]);

  if (communityTrends.length === 0 || communityTrends.every(t => t.assessments.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[350px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">Select assessments above to view trends over time</p>
      </div>
    );
  }

  // Check if we have enough data points for a meaningful trend
  const hasMultipleYears = communityTrends.some(t => t.assessments.length > 1);

  return (
    <div className="w-full">
      {!hasMultipleYears && (
        <div className="py-3 px-4 bg-warning-muted border-l-4 border-warning rounded-r-lg mb-4">
          <p className="m-0 text-[13px] text-warning-foreground">Only one year of data available. Select more assessments from the same community to see trends.</p>
        </div>
      )}
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    </div>
  );
}

export default TrendLineChart;
