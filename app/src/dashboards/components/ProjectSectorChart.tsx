/**
 * Project Sector Chart Component
 * Displays project distribution by sector as a bar chart
 */

import React, { useMemo } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { CHART_COLORS } from '@src/lib/style-utils';

interface ProjectSectorChartProps {
  projects: any[];
  showGhgImpact?: boolean;
}

const SECTOR_COLORS: Record<string, string> = {
  BUILDINGS: CHART_COLORS.destructive,
  TRANSPORTATION: CHART_COLORS.info,
  WASTE_MANAGEMENT: CHART_COLORS.purple,
  RENEWABLE_ENERGY: CHART_COLORS.success,
  ENERGY_EFFICIENCY: CHART_COLORS.warning,
  LAND_USE: CHART_COLORS.questTeal,
  WATER: 'hsl(187, 100%, 37%)',
  OTHER: 'hsl(140, 10%, 60%)',
};

const SECTOR_LABELS: Record<string, string> = {
  BUILDINGS: 'Buildings',
  TRANSPORTATION: 'Transportation',
  WASTE_MANAGEMENT: 'Waste Management',
  RENEWABLE_ENERGY: 'Renewable Energy',
  ENERGY_EFFICIENCY: 'Energy Efficiency',
  LAND_USE: 'Land Use',
  WATER: 'Water',
  OTHER: 'Other',
};

export function ProjectSectorChart({ projects, showGhgImpact = false }: ProjectSectorChartProps) {
  const { series, options } = useMemo(() => {
    const sectorData: Record<string, { count: number; ghg: number; cost: number }> = {};

    projects.forEach(project => {
      const sector = project.sector || 'OTHER';
      if (!sectorData[sector]) {
        sectorData[sector] = { count: 0, ghg: 0, cost: 0 };
      }
      sectorData[sector].count += 1;
      sectorData[sector].ghg += project.estimatedGhgReduction || 0;
      sectorData[sector].cost += project.estimatedCost || 0;
    });

    const categories = Object.keys(sectorData).map(s => SECTOR_LABELS[s] || s);
    const colors = Object.keys(sectorData).map(s => SECTOR_COLORS[s] || 'hsl(var(--muted-foreground))');

    const chartSeries = showGhgImpact
      ? [
          {
            name: 'GHG Reduction (tCO2e)',
            data: Object.values(sectorData).map(d => Math.round(d.ghg)),
          },
        ]
      : [
          {
            name: 'Project Count',
            data: Object.values(sectorData).map(d => d.count),
          },
        ];

    const chartOptions: ApexOptions = {
      chart: {
        type: 'bar',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        toolbar: { show: false },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '60%',
          distributed: true,
        },
      },
      colors,
      xaxis: {
        categories,
        labels: { style: { fontSize: '12px' } },
      },
      yaxis: {
        labels: { style: { fontSize: '12px' } },
      },
      legend: { show: false },
      dataLabels: {
        enabled: true,
        style: { fontSize: '12px', fontWeight: 600 },
        formatter: (val: number) => (showGhgImpact ? `${val} tCO2e` : `${val}`),
      },
      tooltip: {
        y: {
          formatter: (val: number) => (showGhgImpact ? `${val} tCO2e/year` : `${val} projects`),
        },
      },
      grid: {
        borderColor: 'hsl(var(--border))',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
      },
    };

    return { series: chartSeries, options: chartOptions };
  }, [projects, showGhgImpact]);

  if (projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-[280px] text-muted-foreground bg-muted rounded-lg">
        <p>No projects to display</p>
      </div>
    );
  }

  return (
    <ReactApexChart
      options={options}
      series={series}
      type="bar"
      height={280}
    />
  );
}

export default ProjectSectorChart;
