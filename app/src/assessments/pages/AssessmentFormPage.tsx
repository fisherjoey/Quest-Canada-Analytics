import React, { useState, useEffect } from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessment, createAssessment, updateAssessment } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function AssessmentFormPage({ match, history }: any) {
  const id = match?.params?.id;
  const isEditing = !!id;

  const { data: assessment, isLoading } = useQuery(getAssessment, { id: id || "" }, { enabled: isEditing });

  const [formData, setFormData] = useState({
    communityId: "",
    assessmentYear: new Date().getFullYear(),
    assessorName: "",
    assessorOrganization: "",
    assessorEmail: "",
    generalNotes: "",
  });

  useEffect(() => {
    if (assessment) {
      setFormData({
        communityId: assessment.communityId || "",
        assessmentYear: assessment.assessmentYear || new Date().getFullYear(),
        assessorName: assessment.assessorName || "",
        assessorOrganization: assessment.assessorOrganization || "",
        assessorEmail: assessment.assessorEmail || "",
        generalNotes: assessment.generalNotes || "",
      });
    }
  }, [assessment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        await updateAssessment({ id: id!, ...formData });
      } else {
        await createAssessment(formData);
      }
      
      // Navigate to assessments list
      if (history) {
        history.push("/assessments");
      } else {
        window.location.href = "/assessments";
      }
    } catch (error: any) {
      console.error("Error saving assessment:", error);
      alert("Error saving assessment: " + error.message);
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/assessments" className="text-blue-600 hover:text-blue-800">
          ← Back to Assessments
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">
          {isEditing ? "Edit Assessment" : "New Assessment"}
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
              Assessment Year *
            </label>
            <input
              type="number"
              value={formData.assessmentYear}
              onChange={(e) => setFormData({ ...formData, assessmentYear: parseInt(e.target.value) })}
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
              {isEditing ? "Update" : "Create"} Assessment
            </button>
            <Link 
              to="/assessments"
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
