/**
 * Assessment Dashboard Component
 * Native React charts replacing Grafana embed
 */

import React, { useMemo } from "react";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface AssessmentDashboardProps {
  assessment: any;
}

const INDICATOR_NAMES: Record<number, string> = {
  1: "Governance",
  2: "Capacity",
  3: "Planning",
  4: "Infrastructure",
  5: "Operations",
  6: "Buildings",
  7: "Transportation",
  8: "Waste",
  9: "Energy",
  10: "Other"
};

export function AssessmentDashboard({ assessment }: AssessmentDashboardProps) {
  // Prepare indicator scores data for horizontal bar chart
  const indicatorChartData = useMemo(() => {
    if (!assessment.indicators || assessment.indicators.length === 0) {
      return { series: [], categories: [] };
    }
    const sorted = [...assessment.indicators].sort(
      (a: any, b: any) => a.indicatorNumber - b.indicatorNumber
    );
    const categories = sorted.map(
      (i: any) => INDICATOR_NAMES[i.indicatorNumber] || i.indicatorName || `Indicator ${i.indicatorNumber}`
    );
    const data = sorted.map((i: any) => Math.round(i.percentageScore || 0));
    return { series: [{ name: "Score (%)", data }], categories };
  }, [assessment.indicators]);

  // Prepare recommendations by priority data for pie chart
  const recommendationsPieData = useMemo(() => {
    if (!assessment.recommendations || assessment.recommendations.length === 0) {
      return { series: [], labels: [] };
    }
    const counts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    assessment.recommendations.forEach((r: any) => {
      const priority = r.priorityLevel || "MEDIUM";
      counts[priority] = (counts[priority] || 0) + 1;
    });
    const labels = Object.keys(counts).filter(k => counts[k] > 0);
    const series = labels.map(l => counts[l]);
    return { series, labels };
  }, [assessment.recommendations]);

  // Bar chart options for indicator scores
  const barOptions: ApexOptions = {
    chart: {
      type: "bar",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      toolbar: { show: true, tools: { download: true, selection: false, zoom: false, zoomin: false, zoomout: false, pan: false, reset: false } }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        barHeight: "70%",
        distributed: true,
        dataLabels: { position: "center" }
      }
    },
    colors: ["#00a9a6", "#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6b7280"],
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val}%`,
      style: { fontSize: "12px", fontWeight: 600, colors: ["#fff"] }
    },
    xaxis: {
      categories: indicatorChartData.categories,
      min: 0,
      max: 100,
      labels: { formatter: (val: string) => `${val}%`, style: { fontSize: "12px" } }
    },
    yaxis: {
      labels: { style: { fontSize: "12px", fontWeight: 500 } }
    },
    grid: {
      borderColor: "#e5e7eb",
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } }
    },
    legend: { show: false },
    tooltip: { y: { formatter: (val: number) => `${val}%` } }
  };

  // Pie chart options for recommendations
  const pieOptions: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    },
    labels: recommendationsPieData.labels,
    colors: ["#ef4444", "#f59e0b", "#22c55e"],
    legend: {
      position: "right",
      fontSize: "13px",
      markers: { width: 8, height: 8 },
      itemMargin: { horizontal: 8, vertical: 4 }
    },
    dataLabels: {
      enabled: true,
      formatter: (_val: number, opts: any) => {
        return String(opts.w.config.series[opts.seriesIndex]);
      },
      style: { fontSize: "14px", fontWeight: 600 }
    },
    plotOptions: {
      pie: {
        donut: {
          size: "55%",
          labels: {
            show: true,
            total: { show: true, label: "Total", fontSize: "14px", fontWeight: 600 }
          }
        }
      }
    },
    tooltip: { y: { formatter: (val: number) => `${val} recommendations` } }
  };

  // Calculate totals for indicator table
  const indicatorTotals = useMemo(() => {
    if (!assessment.indicators) return { count: 0, earned: 0, possible: 0, avgPercent: 0 };
    const earned = assessment.indicators.reduce((sum: number, i: any) => sum + (i.pointsEarned || 0), 0);
    const possible = assessment.indicators.reduce((sum: number, i: any) => sum + (i.pointsPossible || 0), 0);
    return {
      count: assessment.indicators.length,
      earned: Math.round(earned * 10) / 10,
      possible: Math.round(possible * 10) / 10,
      avgPercent: possible > 0 ? Math.round((earned / possible) * 100) : 0
    };
  }, [assessment.indicators]);

  // Helper functions for styling
  const getScoreClass = (score: number) => {
    if (score >= 70) return "bg-success/20 text-success";
    if (score >= 50) return "bg-warning/20 text-warning";
    return "bg-destructive/20 text-destructive";
  };

  const getPriorityClass = (priority: string) => {
    if (priority === "HIGH") return "bg-destructive/20 text-destructive";
    if (priority === "LOW") return "bg-muted text-muted-foreground";
    return "bg-warning/20 text-warning";
  };

  const getStatusClass = (status: string) => {
    if (status === "COMPLETED") return "bg-success/20 text-success";
    if (status === "IN_PROGRESS") return "bg-primary/20 text-primary";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards - Row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-primary">{assessment.overallScore || 0}%</p>
          <p className="text-sm text-muted-foreground mt-1">Overall Score</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-foreground truncate">{assessment.community?.name || "N/A"}</p>
          <p className="text-sm text-muted-foreground mt-1">Community</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-success">{assessment.certificationLevel || "Pending"}</p>
          <p className="text-sm text-muted-foreground mt-1">Certification</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-warning">{assessment.indicators?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Indicators</p>
        </div>
      </div>

      {/* KPI Cards - Row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-foreground">{assessment.assessmentYear}</p>
          <p className="text-sm text-muted-foreground mt-1">Year</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-xl font-bold text-foreground">{assessment.status || "N/A"}</p>
          <p className="text-sm text-muted-foreground mt-1">Status</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-success">{assessment.strengths?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Strengths</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-center shadow-sm">
          <p className="text-3xl font-bold text-warning">{assessment.recommendations?.length || 0}</p>
          <p className="text-sm text-muted-foreground mt-1">Recommendations</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Indicator Scores Bar Chart */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Indicator Scores</h3>
          {indicatorChartData.series.length > 0 && indicatorChartData.series[0].data.length > 0 ? (
            <ReactApexChart
              options={barOptions}
              series={indicatorChartData.series}
              type="bar"
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No indicator data available
            </div>
          )}
        </div>

        {/* Recommendations by Priority Pie Chart */}
        <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recommendations by Priority</h3>
          {recommendationsPieData.series.length > 0 ? (
            <ReactApexChart
              options={pieOptions}
              series={recommendationsPieData.series}
              type="donut"
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-muted-foreground">
              No recommendations data available
            </div>
          )}
        </div>
      </div>

      {/* Detailed Indicator Scores Table */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Detailed Indicator Scores</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">#</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Indicator</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Earned</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Possible</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Score</th>
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Notes</th>
              </tr>
            </thead>
            <tbody>
              {assessment.indicators?.map((indicator: any) => (
                <tr key={indicator.id} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 px-4 text-foreground">{indicator.indicatorNumber}</td>
                  <td className="py-3 px-4 text-foreground font-medium">{indicator.indicatorName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{indicator.category}</td>
                  <td className="py-3 px-4 text-right text-foreground">{indicator.pointsEarned}</td>
                  <td className="py-3 px-4 text-right text-foreground">{indicator.pointsPossible}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${getScoreClass(indicator.percentageScore)}`}>
                      {Math.round(indicator.percentageScore)}%
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate" title={indicator.notes}>
                    {indicator.notes || "-"}
                  </td>
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-muted/50 font-semibold">
                <td className="py-3 px-4 text-primary">TOTAL</td>
                <td className="py-3 px-4 text-foreground">{indicatorTotals.count} indicators</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right text-foreground">{indicatorTotals.earned}</td>
                <td className="py-3 px-4 text-right text-foreground">{indicatorTotals.possible}</td>
                <td className="py-3 px-4 text-right">
                  <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-primary/20 text-primary">
                    {indicatorTotals.avgPercent}%
                  </span>
                </td>
                <td className="py-3 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Strengths Table */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Strengths</h3>
        {assessment.strengths && assessment.strengths.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Title</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {assessment.strengths.map((strength: any) => (
                  <tr key={strength.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">
                        {strength.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{strength.title}</td>
                    <td className="py-3 px-4 text-muted-foreground">{strength.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No strengths recorded</p>
        )}
      </div>

      {/* Recommendations Table */}
      <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground mb-4">Recommendations</h3>
        {assessment.recommendations && assessment.recommendations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Indicator #</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Recommendation</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Priority</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {assessment.recommendations.map((rec: any) => (
                  <tr key={rec.id} className="border-b border-border/50 hover:bg-muted/50">
                    <td className="py-3 px-4 text-foreground">{rec.indicatorNumber || "-"}</td>
                    <td className="py-3 px-4 text-foreground">{rec.recommendationText}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getPriorityClass(rec.priorityLevel)}`}>
                        {rec.priorityLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusClass(rec.implementationStatus)}`}>
                        {rec.implementationStatus?.replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">No recommendations recorded</p>
        )}
      </div>
    </div>
  );
}

export default AssessmentDashboard;
