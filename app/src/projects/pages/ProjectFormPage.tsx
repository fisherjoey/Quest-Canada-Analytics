import React, { useState, useEffect } from "react";
import { useQuery, useAction } from "wasp/client/operations";
import { getProject, createProject, updateProject, deleteProject, getCommunities } from "wasp/client/operations";
import { Link } from "wasp/client/router";
import { useParams, useNavigate } from "react-router-dom";

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: project, isLoading } = useQuery(getProject, { id: id! }, { enabled: !!id });
  const { data: communities, isLoading: communitiesLoading } = useQuery(getCommunities);
  const createProjectFn = useAction(createProject);
  const updateProjectFn = useAction(updateProject);
  const deleteProjectFn = useAction(deleteProject);

  const [formData, setFormData] = useState({
    communityId: "",
    projectCode: "",
    projectName: "",
    description: "",
    projectType: "",
    sector: "ENERGY",
    status: "PLANNED",
    priorityLevel: "MEDIUM",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setFormData({
        communityId: project.communityId || "",
        projectCode: project.projectCode || "",
        projectName: project.projectName || "",
        description: project.description || "",
        projectType: project.projectType || "",
        sector: project.sector || "ENERGY",
        status: project.status || "PLANNED",
        priorityLevel: project.priorityLevel || "MEDIUM",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const projectData = {
        communityId: formData.communityId,
        projectCode: formData.projectCode,
        projectName: formData.projectName,
        description: formData.description,
        projectType: formData.projectType,
        sector: formData.sector,
        status: formData.status,
        priorityLevel: formData.priorityLevel,
      };

      if (isEditing) {
        await updateProjectFn({ id: id, ...projectData });
      } else {
        await createProjectFn(projectData);
      }

      if (history) {
        navigate("/projects");
      } else {
        window.location.href = "/projects";
      }
    } catch (error: any) {
      setError(error.message || "Failed to save project");
    }
  };

  if (isLoading && id) {
    return <div className="p-8 text-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? "Edit Project" : "Create New Project"}
        </h1>
        <Link to="/projects" className="text-primary hover:text-primary/80 transition-colors">
          Back to Projects
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/20 border border-destructive text-destructive px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Project Code *</label>
            <input
              type="text"
              required
              value={formData.projectCode}
              onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Community *</label>
            <select
              required
              value={formData.communityId}
              onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              disabled={communitiesLoading}
            >
              <option value="">
                {communitiesLoading ? "Loading communities..." : "Select a community..."}
              </option>
              {communities?.map((community: { id: string; name: string; province: string }) => (
                <option key={community.id} value={community.id}>
                  {community.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Project Name *</label>
          <input
            type="text"
            required
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Project Type *</label>
            <input
              type="text"
              required
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Sector *</label>
            <select
              required
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="ENERGY">Energy</option>
              <option value="WASTE">Waste</option>
              <option value="TRANSPORTATION">Transportation</option>
              <option value="BUILDINGS">Buildings</option>
              <option value="AGRICULTURE">Agriculture</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Priority Level *</label>
            <select
              required
              value={formData.priorityLevel}
              onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <Link
            to="/projects"
            className="px-6 py-2 border border-border rounded hover:bg-muted text-foreground transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          >
            {isEditing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
