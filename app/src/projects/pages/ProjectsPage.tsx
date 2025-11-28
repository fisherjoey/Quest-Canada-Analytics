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
      case 'COMPLETED': return 'bg-success/20 text-success dark:bg-success/30';
      case 'IN_PROGRESS': return 'bg-primary/20 text-primary dark:bg-primary/30';
      case 'ON_HOLD': return 'bg-warning/20 text-warning dark:bg-warning/30';
      case 'CANCELLED': return 'bg-destructive/20 text-destructive dark:bg-destructive/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-destructive/20 text-destructive dark:bg-destructive/30';
      case 'MEDIUM': return 'bg-warning/20 text-warning dark:bg-warning/30';
      case 'LOW': return 'bg-success/20 text-success dark:bg-success/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return <div className="p-8 text-foreground">Loading projects...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading projects: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Climate Action Projects</h1>
        <Link to="/projects/new" className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors">
          New Project
        </Link>
      </div>

      {communityNames.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={expandAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Expand All
          </button>
          <span className="text-muted-foreground">|</span>
          <button
            onClick={collapseAll}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Collapse All
          </button>
          <span className="text-muted-foreground ml-4">
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
              <div key={communityName} className="bg-card rounded-lg shadow overflow-hidden border border-border">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleCommunity(communityName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                      <h2 className="text-xl font-semibold text-foreground">{communityName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {communityProjects.length} {communityProjects.length === 1 ? 'project' : 'projects'}
                        {activeCount > 0 && (
                          <span className="ml-2">
                            • <span className="text-primary font-medium">{activeCount} active</span>
                          </span>
                        )}
                        {completedCount > 0 && (
                          <span className="ml-2">
                            • <span className="text-success font-medium">{completedCount} completed</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/50">
                    {communityProjects.map((project) => {
                      const detailLink = `/projects/${project.id}`;
                      return (
                        <Link
                          key={project.id}
                          to={detailLink as any}
                          className="block px-6 py-4 border-b border-border last:border-b-0 hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between items-start ml-9">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{project.projectName}</span>
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {project.projectCode}
                                </span>
                              </div>
                              <span className="text-muted-foreground text-sm">{project.projectType}</span>
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
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div
                                      className="bg-primary h-2 rounded-full"
                                      style={{ width: `${project.completionPercentage}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground">{project.completionPercentage}%</span>
                                </div>
                              )}
                              <span className="text-primary hover:text-primary/80">View →</span>
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
          <div className="text-center py-12 text-muted-foreground bg-card rounded-lg shadow border border-border">
            No projects found. Create your first project to get started.
          </div>
        )}
      </div>
    </div>
  );
}
