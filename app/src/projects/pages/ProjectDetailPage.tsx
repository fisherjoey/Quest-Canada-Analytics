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
        <div className="text-red-600">No project ID provided</div>
        <Link to="/projects" className="text-blue-600 hover:underline mt-4 inline-block">
          ← Back to Projects
        </Link>
      </div>
    );
  }
  const { data: project, isLoading, error } = useQuery(getProject, { id: id! }, { enabled: !!id });

  if (isLoading) {
    return <div className="p-8">Loading project...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading project: {error.message}</div>;
  }

  if (!project) {
    return <div className="p-8">Project not found</div>;
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
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/projects" className="text-blue-600 hover:text-blue-800">
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{project.projectName}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priorityLevel)}`}>
                {project.priorityLevel}
              </span>
            </div>
            <p className="text-gray-600">
              Code: {project.projectCode} | {project.community?.name || "Unknown Community"}
            </p>
          </div>
          <Link
            to={editLink as any}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
          </div>
        )}

        {/* Project Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Project Type</h3>
            <p className="text-lg font-semibold">{project.projectType}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Sector</h3>
            <p className="text-lg font-semibold">{project.sector}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Completion</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${project.completionPercentage || 0}%` }}
                ></div>
              </div>
              <span className="text-lg font-semibold">{project.completionPercentage || 0}%</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Timeline</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Planned Start</h3>
              <p className="font-medium">{formatDate(project.plannedStartDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Actual Start</h3>
              <p className="font-medium">{formatDate(project.actualStartDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Est. Completion</h3>
              <p className="font-medium">{formatDate(project.estimatedCompletionDate)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Actual Completion</h3>
              <p className="font-medium">{formatDate(project.actualCompletionDate)}</p>
            </div>
          </div>
        </div>

        {/* Estimated Impact */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Estimated Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded">
              <h3 className="text-sm font-medium text-green-700">GHG Reduction</h3>
              <p className="text-xl font-bold text-green-800">
                {project.estimatedGhgReduction ? `${project.estimatedGhgReduction} tonnes CO₂e` : "Not set"}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded">
              <h3 className="text-sm font-medium text-blue-700">Energy Reduction</h3>
              <p className="text-xl font-bold text-blue-800">
                {project.estimatedEnergyReduction ? `${project.estimatedEnergyReduction} kWh` : "Not set"}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <h3 className="text-sm font-medium text-purple-700">Estimated Cost</h3>
              <p className="text-xl font-bold text-purple-800">
                {formatCurrency(project.estimatedCost)}
              </p>
            </div>
          </div>
        </div>

        {/* Budget & Funding */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Budget & Funding</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-medium text-gray-500">Total Budget</h3>
              <p className="text-xl font-bold">{formatCurrency(project.totalBudget)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-medium text-gray-500">Secured Funding</h3>
              <p className="text-xl font-bold text-green-600">{formatCurrency(project.totalSecuredFunding)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-sm font-medium text-gray-500">Funding Gap</h3>
              <p className="text-xl font-bold text-red-600">{formatCurrency(project.fundingGap)}</p>
            </div>
          </div>
        </div>

        {/* Funding Sources */}
        {project.fundingSources && project.fundingSources.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Funding Sources ({project.fundingSources.length})</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Funder</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {project.fundingSources.map((funding: any) => (
                    <tr key={funding.id}>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{funding.funderName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{funding.funderType}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{funding.grantProgram || "-"}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(funding.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          funding.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          funding.status === 'RECEIVED' ? 'bg-blue-100 text-blue-800' :
                          funding.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
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
            <h2 className="text-lg font-semibold mb-3">Milestones ({project.milestones.length})</h2>
            <div className="space-y-3">
              {project.milestones.map((milestone: any) => (
                <div key={milestone.id} className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-50 rounded-r">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{milestone.milestoneName}</h3>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      milestone.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      milestone.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      milestone.status === 'DELAYED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {milestone.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>Target: {formatDate(milestone.targetDate)}</span>
                    {milestone.actualDate && <span>Completed: {formatDate(milestone.actualDate)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="border-t pt-4 text-sm text-gray-500">
          <p>Created: {new Date(project.createdAt).toLocaleString()}</p>
          <p>Last Updated: {new Date(project.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
