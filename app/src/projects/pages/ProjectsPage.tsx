import React, { useState, useMemo } from "react";
import { useQuery } from "wasp/client/operations";
import { getProjects } from "wasp/client/operations";
import { Link } from "wasp/client/router";

interface Project {
  id: string;
  projectName: string;
  projectCode: string;
  projectType: string;
  status: string;
  priorityLevel: string;
  completionPercentage?: number;
  totalBudget?: number;
  community?: { name: string };
}

interface GroupedProjects {
  [communityName: string]: Project[];
}

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery(getProjects);
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set());

  // Group projects by community
  const groupedProjects = useMemo(() => {
    if (!projects) return {};

    const grouped: GroupedProjects = {};
    projects.forEach((project: Project) => {
      const communityName = project.community?.name || "Unassigned";
      if (!grouped[communityName]) {
        grouped[communityName] = [];
      }
      grouped[communityName].push(project);
    });

    // Sort projects within each group by priority then name
    const priorityOrder: Record<string, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        const priorityDiff = (priorityOrder[a.priorityLevel] || 2) - (priorityOrder[b.priorityLevel] || 2);
        if (priorityDiff !== 0) return priorityDiff;
        return a.projectName.localeCompare(b.projectName);
      });
    });

    return grouped;
  }, [projects]);

  const communityNames = Object.keys(groupedProjects).sort();

  const toggleCommunity = (communityName: string) => {
    setExpandedCommunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(communityName)) {
        newSet.delete(communityName);
      } else {
        newSet.add(communityName);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedCommunities(new Set(communityNames));
  };

  const collapseAll = () => {
    setExpandedCommunities(new Set());
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
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-700';
      case 'LOW': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading projects: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Climate Action Projects</h1>
        <Link to="/projects/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          New Project
        </Link>
      </div>

      {communityNames.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Expand All
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Collapse All
          </button>
          <span className="text-gray-400 ml-4">
            {communityNames.length} {communityNames.length === 1 ? 'community' : 'communities'}, {projects?.length || 0} projects
          </span>
        </div>
      )}

      <div className="space-y-3">
        {communityNames.length > 0 ? (
          communityNames.map((communityName) => {
            const communityProjects = groupedProjects[communityName];
            const isExpanded = expandedCommunities.has(communityName);
            const activeCount = communityProjects.filter(p => p.status === 'IN_PROGRESS').length;
            const completedCount = communityProjects.filter(p => p.status === 'COMPLETED').length;

            return (
              <div key={communityName} className="bg-white rounded-lg shadow overflow-hidden">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCommunity(communityName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                      <h2 className="text-xl font-semibold text-gray-900">{communityName}</h2>
                      <p className="text-sm text-gray-500">
                        {communityProjects.length} {communityProjects.length === 1 ? 'project' : 'projects'}
                        {activeCount > 0 && (
                          <span className="ml-2">
                            • <span className="text-blue-600 font-medium">{activeCount} active</span>
                          </span>
                        )}
                        {completedCount > 0 && (
                          <span className="ml-2">
                            • <span className="text-green-600 font-medium">{completedCount} completed</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {communityProjects.map((project) => {
                      const detailLink = `/projects/${project.id}`;
                      return (
                        <Link
                          key={project.id}
                          to={detailLink as any}
                          className="block px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition"
                        >
                          <div className="flex justify-between items-start ml-9">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{project.projectName}</span>
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                                  {project.projectCode}
                                </span>
                              </div>
                              <span className="text-gray-500 text-sm">{project.projectType}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(project.priorityLevel)}`}>
                                {project.priorityLevel}
                              </span>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                                {project.status}
                              </span>
                              {project.completionPercentage !== undefined && (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full"
                                      style={{ width: `${project.completionPercentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-gray-600">{project.completionPercentage}%</span>
                                </div>
                              )}
                              <span className="text-blue-600 hover:text-blue-800">View →</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow">
            No projects found. Create your first project to get started.
          </div>
        )}
      </div>
    </div>
  );
}
