import React, { useState, useEffect } from "react";
import { useQuery, useAction } from "wasp/client/operations";
import { getProject, createProject, updateProject, deleteProject } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function ProjectFormPage({ match, history }: any) {
  const id = match?.params?.id;
  const isEditing = !!id;

  const { data: project, isLoading } = useQuery(getProject, { id: id || "" }, { enabled: isEditing });
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
        history.push("/projects");
      } else {
        window.location.href = "/projects";
      }
    } catch (error: any) {
      setError(error.message || "Failed to save project");
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Project" : "Create New Project"}
        </h1>
        <Link to="/projects" className="text-blue-600 hover:underline">
          Back to Projects
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Code *</label>
            <input
              type="text"
              required
              value={formData.projectCode}
              onChange={(e) => setFormData({ ...formData, projectCode: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Community ID *</label>
            <input
              type="text"
              required
              value={formData.communityId}
              onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Project Name *</label>
          <input
            type="text"
            required
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Type *</label>
            <input
              type="text"
              required
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Sector *</label>
            <select
              required
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
              className="w-full px-3 py-2 border rounded"
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
            <label className="block text-sm font-medium mb-1">Status *</label>
            <select
              required
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="PLANNED">Planned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority Level *</label>
            <select
              required
              value={formData.priorityLevel}
              onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value })}
              className="w-full px-3 py-2 border rounded"
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
            className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {isEditing ? "Save Changes" : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
