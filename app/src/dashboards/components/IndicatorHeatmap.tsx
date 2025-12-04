/**
 * Indicator Heatmap Component
 *
 * Displays a heatmap showing indicator performance
 * across all selected assessments for quick comparison
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '../../lib/style-utils';

interface IndicatorHeatmapProps {
  assessments: any[];
  selectedIndicator?: number | null;
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

export function IndicatorHeatmap({
  assessments,
  selectedIndicator,
  onIndicatorClick
}: IndicatorHeatmapProps) {
  const { series, options } = useMemo(() => {
    // Build heatmap data
    // Each row is an assessment, each column is an indicator
    const seriesData = INDICATOR_NAMES.map((indicatorName, idx) => {
      const indicatorNumber = idx + 1;
      const data = assessments.map(assessment => {
        const indicator = assessment.indicators?.find(
          (i: any) => i.indicatorNumber === indicatorNumber
        );
        return {
          x: `${assessment.community?.name || 'Unknown'} (${assessment.assessmentYear})`,
          y: indicator ? Math.round(indicator.percentageScore || 0) : 0
        };
      });

      return {
        name: indicatorName,
        data: data
      };
    });

    const chartOptions: ApexOptions = {
      chart: {
        type: 'heatmap',
        height: 400,
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
              // config.seriesIndex is the indicator index
              onIndicatorClick(config.seriesIndex + 1);
            }
          }
        }
      },
      plotOptions: {
        heatmap: {
          shadeIntensity: 0.5,
          radius: 4,
          useFillColorAsStroke: false,
          colorScale: {
            ranges: [
              {
                from: 0,
                to: 39,
                name: 'Needs Improvement',
                color: CHART_COLORS.destructive
              },
              {
                from: 40,
                to: 59,
                name: 'Fair',
                color: CHART_COLORS.warning
              },
              {
                from: 60,
                to: 79,
                name: 'Good',
                color: CHART_COLORS.info
              },
              {
                from: 80,
                to: 100,
                name: 'Excellent',
                color: CHART_COLORS.success
              }
            ]
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '11px',
          fontWeight: 600,
          colors: ['#fff']
        },
        formatter: (val: number) => `${val}%`
      },
      xaxis: {
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: 500
          },
          rotate: -45,
          rotateAlways: true,
          trim: true,
          maxHeight: 100
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `${val}%`
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'right',
        fontSize: '12px',
        markers: {
          width: 10,
          height: 10,
          radius: 2
        },
        itemMargin: {
          horizontal: 8,
          vertical: 4
        }
      },
      states: {
        hover: {
          filter: {
            type: 'darken',
            value: 0.15
          }
        }
      },
      stroke: {
        width: 2,
        colors: ['#fff']
      },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            chart: {
              height: 380
            }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: {
              height: 350
            },
            dataLabels: {
              style: {
                fontSize: '9px'
              }
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '9px'
                },
                maxHeight: 70
              }
            },
            yaxis: {
              labels: {
                style: {
                  fontSize: '10px'
                }
              }
            },
            legend: {
              fontSize: '10px',
              itemMargin: {
                horizontal: 6,
                vertical: 3
              }
            }
          }
        },
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 320
            },
            dataLabels: {
              enabled: false
            },
            xaxis: {
              labels: {
                style: {
                  fontSize: '8px'
                },
                rotate: -90,
                maxHeight: 60
              }
            },
            yaxis: {
              labels: {
                style: {
                  fontSize: '9px'
                }
              }
            },
            legend: {
              show: false
            }
          }
        }
      ]
    };

    return { series: seriesData, options: chartOptions };
  }, [assessments, onIndicatorClick]);

  if (assessments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/25">
        <p className="text-lg font-medium mb-1">No Data</p>
        <p className="text-sm">Select assessments above to view heatmap</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <ReactApexChart
        options={options}
        series={series}
        type="heatmap"
        height={400}
      />
      {onIndicatorClick && (
        <p className="text-center text-xs text-muted-foreground mt-2 mb-0">Click on a cell to view indicator details</p>
      )}

      {/* Legend explanation */}
      <div className="flex justify-center flex-wrap gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-4 h-4 rounded-sm bg-destructive"></span>
          <span>0-39% Needs Improvement</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-4 h-4 rounded-sm bg-warning"></span>
          <span>40-59% Fair</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-4 h-4 rounded-sm bg-info"></span>
          <span>60-79% Good</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-4 h-4 rounded-sm bg-success"></span>
          <span>80-100% Excellent</span>
        </div>
      </div>
    </div>
  );
}

export default IndicatorHeatmap;
