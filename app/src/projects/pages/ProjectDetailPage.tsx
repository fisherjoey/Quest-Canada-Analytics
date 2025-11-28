import React from "react";
import { useQuery } from "wasp/client/operations";
import { getProject } from "wasp/client/operations";
import { Link } from "wasp/client/router";
import { useParams } from "react-router-dom";

export default function ProjectDetailPage() {
  const { id } = useParams();

  if (!id) {
    return (
      <div className="p-8">
        <div className="text-destructive">No project ID provided</div>
        <Link to="/projects" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Projects
        </Link>
      </div>
    );
  }
  const { data: project, isLoading, error } = useQuery(getProject, { id: id! }, { enabled: !!id });

  if (isLoading) {
    return <div className="p-8 text-foreground">Loading project...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading project: {error.message}</div>;
  }

  if (!project) {
    return <div className="p-8 text-foreground">Project not found</div>;
  }

  const editLink = `/projects/${project.id}/edit`;

  const formatDate = (date: string | null) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return "Not set";
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-success/20 text-success dark:bg-success/30';
      case 'IN_PROGRESS': return 'bg-primary/20 text-primary dark:bg-primary/30';
      case 'ON_HOLD': return 'bg-warning/20 text-warning dark:bg-warning/30';
      case 'CANCELLED': return 'bg-destructive/20 text-destructive dark:bg-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-destructive/20 text-destructive dark:bg-destructive/30';
      case 'HIGH': return 'bg-warning/20 text-warning dark:bg-warning/30';
      case 'MEDIUM': return 'bg-warning/20 text-warning dark:bg-warning/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/projects" className="text-primary hover:text-primary/80 transition-colors">
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow p-6 border border-border">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{project.projectName}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priorityLevel)}`}>
                {project.priorityLevel}
              </span>
            </div>
            <p className="text-muted-foreground">
              Code: {project.projectCode} | {project.community?.name || "Unknown Community"}
            </p>
          </div>
          <Link
            to={editLink as any}
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            Edit
          </Link>
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2 text-foreground">Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-muted p-4 rounded">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Project Type</h3>
            <p className="text-lg font-semibold text-foreground">{project.projectType}</p>
          </div>
          <div className="bg-muted p-4 rounded">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Sector</h3>
            <p className="text-lg font-semibold text-foreground">{project.sector}</p>
          </div>
          <div className="bg-muted p-4 rounded">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Completion</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-border rounded-full h-3">
                <div
                  className="bg-primary h-3 rounded-full"
                  style={{ width: `${project.completionPercentage || 0}%` }}
                ></div>
              </div>
              <span className="text-lg font-semibold text-foreground">{project.completionPercentage || 0}%</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Timeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Planned Start</h3>
              <p className="font-medium text-foreground">{formatDate(project.plannedStartDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Actual Start</h3>
              <p className="font-medium text-foreground">{formatDate(project.actualStartDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Est. Completion</h3>
              <p className="font-medium text-foreground">{formatDate(project.estimatedCompletionDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Actual Completion</h3>
              <p className="font-medium text-foreground">{formatDate(project.actualCompletionDate)}</p>
            </div>
          </div>
        </div>

        {/* Estimated Impact */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Estimated Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-success/10 dark:bg-success/20 p-4 rounded border border-success/20">
              <h3 className="text-sm font-medium text-success">GHG Reduction</h3>
              <p className="text-xl font-bold text-success">
                {project.estimatedGhgReduction ? `${project.estimatedGhgReduction} tonnes CO₂e` : "Not set"}
              </p>
            </div>
            <div className="bg-primary/10 dark:bg-primary/20 p-4 rounded border border-primary/20">
              <h3 className="text-sm font-medium text-primary">Energy Reduction</h3>
              <p className="text-xl font-bold text-primary">
                {project.estimatedEnergyReduction ? `${project.estimatedEnergyReduction} kWh` : "Not set"}
              </p>
            </div>
            <div className="bg-secondary/10 dark:bg-secondary/20 p-4 rounded border border-secondary/20">
              <h3 className="text-sm font-medium text-secondary">Estimated Cost</h3>
              <p className="text-xl font-bold text-secondary">
                {formatCurrency(project.estimatedCost)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget & Funding */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-foreground">Budget & Funding</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-muted p-4 rounded">
              <h3 className="text-sm font-medium text-muted-foreground">Total Budget</h3>
              <p className="text-xl font-bold text-foreground">{formatCurrency(project.totalBudget)}</p>
            </div>
            <div className="bg-muted p-4 rounded">
              <h3 className="text-sm font-medium text-muted-foreground">Secured Funding</h3>
              <p className="text-xl font-bold text-success">{formatCurrency(project.totalSecuredFunding)}</p>
            </div>
            <div className="bg-muted p-4 rounded">
              <h3 className="text-sm font-medium text-muted-foreground">Funding Gap</h3>
              <p className="text-xl font-bold text-destructive">{formatCurrency(project.fundingGap)}</p>
            </div>
          </div>
        </div>

        {/* Funding Sources */}
        {project.fundingSources && project.fundingSources.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Funding Sources ({project.fundingSources.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Funder</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Program</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {project.fundingSources.map((funding: any) => (
                    <tr key={funding.id}>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{funding.funderName}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{funding.funderType}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{funding.grantProgram || "-"}</td>
                      <td className="px-4 py-3 text-sm text-foreground text-right">{formatCurrency(funding.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          funding.status === 'APPROVED' ? 'bg-success/20 text-success dark:bg-success/30' :
                          funding.status === 'RECEIVED' ? 'bg-primary/20 text-primary dark:bg-primary/30' :
                          funding.status === 'REJECTED' ? 'bg-destructive/20 text-destructive dark:bg-destructive/30' :
                          'bg-warning/20 text-warning dark:bg-warning/30'
                        }`}>
                          {funding.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Milestones */}
        {project.milestones && project.milestones.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3 text-foreground">Milestones ({project.milestones.length})</h2>
            <div className="space-y-3">
              {project.milestones.map((milestone: any) => (
                <div key={milestone.id} className="border-l-4 border-primary pl-4 py-2 bg-muted rounded-r">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-foreground">{milestone.milestoneName}</h3>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      milestone.status === 'COMPLETED' ? 'bg-success/20 text-success dark:bg-success/30' :
                      milestone.status === 'IN_PROGRESS' ? 'bg-primary/20 text-primary dark:bg-primary/30' :
                      milestone.status === 'DELAYED' ? 'bg-destructive/20 text-destructive dark:bg-destructive/30' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Target: {formatDate(milestone.targetDate)}</span>
                    {milestone.actualDate && <span>Completed: {formatDate(milestone.actualDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t border-border pt-4 text-sm text-muted-foreground">
          <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
          <p>Last Updated: {new Date(project.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
