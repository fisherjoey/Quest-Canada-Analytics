/**
 * Indicator Heatmap Component
 *
 * Displays a heatmap showing indicator performance
 * across all selected assessments for quick comparison
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

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
                color: '#e74c3c'
              },
              {
                from: 40,
                to: 59,
                name: 'Fair',
                color: '#f39c12'
              },
              {
                from: 60,
                to: 79,
                name: 'Good',
                color: '#3498db'
              },
              {
                from: 80,
                to: 100,
                name: 'Excellent',
                color: '#27ae60'
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
          size: 10,
          shape: 'square'
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
      }
    };

    return { series: seriesData, options: chartOptions };
  }, [assessments, onIndicatorClick]);

  if (assessments.length === 0) {
    return (
      <div className="chart-placeholder">
        <p>Select assessments to view heatmap</p>
      </div>
    );
  }

  return (
    <div className="heatmap-container">
      <ReactApexChart
        options={options}
        series={series}
        type="heatmap"
        height={400}
      />
      {onIndicatorClick && (
        <p className="chart-hint">Click on a cell to view indicator details</p>
      )}

      {/* Legend explanation */}
      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#e74c3c' }}></span>
          <span>0-39% Needs Improvement</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f39c12' }}></span>
          <span>40-59% Fair</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3498db' }}></span>
          <span>60-79% Good</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#27ae60' }}></span>
          <span>80-100% Excellent</span>
        </div>
      </div>

      <style>{heatmapStyles}</style>
    </div>
  );
}

const heatmapStyles = `
  .heatmap-container {
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

  .heatmap-legend {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #e8e8e8;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }
`;

export default IndicatorHeatmap;
