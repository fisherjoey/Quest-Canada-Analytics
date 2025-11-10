import React from "react";
import { useQuery } from "wasp/client/operations";
import { getProjects } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function ProjectsPage() {
  const { data: projects, isLoading, error } = useQuery(getProjects);

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

      <div className="grid gap-4">
        {projects && projects.length > 0 ? (
          projects.map((project: any) => {
            const detailLink = `/projects/${project.id}`;
            return (
              <Link 
                key={project.id} 
                to={detailLink as any}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{project.projectName}</h2>
                    <p className="text-gray-600 mt-1">
                      {project.community?.name || "Unknown Community"} | {project.projectType} | Status: {project.status}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Code: {project.projectCode} | Priority: {project.priorityLevel}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-blue-600 hover:text-blue-800">View Details →</span>
                    {project.completionPercentage !== undefined && (
                      <p className="text-sm text-gray-600 mt-1">{project.completionPercentage}% Complete</p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500">
            No projects found. Create your first project to get started.
          </div>
        )}
      </div>
    </div>
  );
}
