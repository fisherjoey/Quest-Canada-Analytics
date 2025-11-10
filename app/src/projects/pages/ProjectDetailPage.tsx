import React from "react";
import { useQuery } from "wasp/client/operations";
import { getProject } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function ProjectDetailPage({ match }: any) {
  const id = match?.params?.id;
  const { data: project, isLoading, error } = useQuery(getProject, { id: id || "" });

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/projects" className="text-blue-600 hover:text-blue-800">
          ← Back to Projects
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{project.community?.name || "Project"}</h1>
            <p className="text-gray-600 mt-2">
              Created: {new Date(project.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Year: {project.assessmentYear}
            </p>
          </div>
          <Link 
            to={editLink as any}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Edit
          </Link>
        </div>

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Assessor Information</h2>
          <p className="text-gray-700">Name: {project.assessorName}</p>
          <p className="text-gray-700">Organization: {project.assessorOrganization}</p>
          {project.assessorEmail && <p className="text-gray-700">Email: {project.assessorEmail}</p>}
        </div>

        {project.generalNotes && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{project.generalNotes}</p>
          </div>
        )}

        {project.indicators && project.indicators.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Indicator Scores</h2>
            <div className="grid gap-2">
              {project.indicators.map((score: any) => (
                <div key={score.id} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>{score.indicator}</span>
                  <span className="font-semibold">{score.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {project.strengths && project.strengths.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Strengths</h2>
            <ul className="list-disc list-inside space-y-2">
              {project.strengths.map((strength: any) => (
                <li key={strength.id}>{strength.description}</li>
              ))}
            </ul>
          </div>
        )}

        {project.recommendations && project.recommendations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Recommendations</h2>
            <ul className="list-disc list-inside space-y-2">
              {project.recommendations.map((recommendation: any) => (
                <li key={recommendation.id}>{recommendation.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
