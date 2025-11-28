/**
 * Trend Line Chart Component
 *
 * Displays year-over-year trends for communities
 * Can show overall scores or specific indicator trends
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

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
        strokeColors: '#fff',
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
        borderColor: '#e8e8e8',
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
            borderColor: '#27ae60',
            borderWidth: 1,
            strokeDashArray: 5,
            label: {
              text: 'Excellent (80%)',
              position: 'right',
              style: {
                fontSize: '10px',
                color: '#27ae60',
                background: 'transparent'
              }
            }
          },
          {
            y: 60,
            borderColor: '#f39c12',
            borderWidth: 1,
            strokeDashArray: 5,
            label: {
              text: 'Good (60%)',
              position: 'right',
              style: {
                fontSize: '10px',
                color: '#f39c12',
                background: 'transparent'
              }
            }
          }
        ]
      }
    };

    return { series: seriesData, options: chartOptions };
  }, [communityTrends, dataKey, indicatorNumber, label]);

  if (communityTrends.length === 0 || communityTrends.every(t => t.assessments.length === 0)) {
    return (
      <div className="chart-placeholder">
        <p>Select assessments to view trends over time</p>
      </div>
    );
  }

  // Check if we have enough data points for a meaningful trend
  const hasMultipleYears = communityTrends.some(t => t.assessments.length > 1);

  return (
    <div className="trend-chart-container">
      {!hasMultipleYears && (
        <div className="single-year-warning">
          <p>Only one year of data available. Select more assessments from the same community to see trends.</p>
        </div>
      )}
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={350}
      />
      <style>{trendStyles}</style>
    </div>
  );
}

const trendStyles = `
  .trend-chart-container {
    width: 100%;
  }

  .chart-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 350px;
    color: #999;
    background: #f9f9f9;
    border-radius: 8px;
  }

  .single-year-warning {
    padding: 12px 16px;
    background: #fef6e6;
    border-left: 4px solid #f39c12;
    border-radius: 0 8px 8px 0;
    margin-bottom: 16px;
  }

  .single-year-warning p {
    margin: 0;
    font-size: 13px;
    color: #856404;
  }
`;

export default TrendLineChart;
