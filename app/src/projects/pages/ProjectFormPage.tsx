import React, { useState, useEffect } from "react";
import { useQuery } from "wasp/client/operations";
import { getProject, createProject, updateProject } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function ProjectFormPage({ match, history }: any) {
  const id = match?.params?.id;
  const isEditing = !!id;

  const { data: project, isLoading } = useQuery(getProject, { id: id || "" }, { enabled: isEditing });

  const [formData, setFormData] = useState({
    communityId: "",
    projectYear: new Date().getFullYear(),
    assessorName: "",
    assessorOrganization: "",
    assessorEmail: "",
    generalNotes: "",
  });

  useEffect(() => {
    if (project) {
      setFormData({
        communityId: project.communityId || "",
        projectYear: project.projectYear || new Date().getFullYear(),
        assessorName: project.assessorName || "",
        assessorOrganization: project.assessorOrganization || "",
        assessorEmail: project.assessorEmail || "",
        generalNotes: project.generalNotes || "",
      });
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await updateProject({ id: id!, ...formData });
      } else {
        await createProject(formData);
      }
      
      // Navigate to projects list
      if (history) {
        history.push("/projects");
      } else {
        window.location.href = "/projects";
      }
    } catch (error: any) {
      console.error("Error saving project:", error);
      alert("Error saving project: " + error.message);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/projects" className="text-blue-600 hover:text-blue-800">
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">
          {isEditing ? "Edit Project" : "New Project"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Community ID *
            </label>
            <input
              type="text"
              value={formData.communityId}
              onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Project Year *
            </label>
            <input
              type="number"
              value={formData.projectYear}
              onChange={(e) => setFormData({ ...formData, projectYear: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Assessor Name *
            </label>
            <input
              type="text"
              value={formData.assessorName}
              onChange={(e) => setFormData({ ...formData, assessorName: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Assessor Organization *
            </label>
            <input
              type="text"
              value={formData.assessorOrganization}
              onChange={(e) => setFormData({ ...formData, assessorOrganization: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Assessor Email
            </label>
            <input
              type="email"
              value={formData.assessorEmail}
              onChange={(e) => setFormData({ ...formData, assessorEmail: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              General Notes
            </label>
            <textarea
              value={formData.generalNotes}
              onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              rows={6}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              {isEditing ? "Update" : "Create"} Project
            </button>
            <Link 
              to="/projects"
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 inline-block"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
