import React from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessment } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function AssessmentDetailPage({ match }: any) {
  const id = match?.params?.id;
  const { data: assessment, isLoading, error } = useQuery(getAssessment, { id: id || "" });

  if (isLoading) {
    return <div className="p-8">Loading assessment...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading assessment: {error.message}</div>;
  }

  if (!assessment) {
    return <div className="p-8">Assessment not found</div>;
  }

  const editLink = `/assessments/${assessment.id}/edit`;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/assessments" className="text-blue-600 hover:text-blue-800">
          ← Back to Assessments
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{assessment.community?.name || "Assessment"}</h1>
            <p className="text-gray-600 mt-2">
              Created: {new Date(assessment.createdAt).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Year: {assessment.assessmentYear}
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
          <p className="text-gray-700">Name: {assessment.assessorName}</p>
          <p className="text-gray-700">Organization: {assessment.assessorOrganization}</p>
          {assessment.assessorEmail && <p className="text-gray-700">Email: {assessment.assessorEmail}</p>}
        </div>

        {assessment.generalNotes && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Notes</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{assessment.generalNotes}</p>
          </div>
        )}

        {assessment.indicators && assessment.indicators.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Indicator Scores</h2>
            <div className="grid gap-2">
              {assessment.indicators.map((score: any) => (
                <div key={score.id} className="flex justify-between p-3 bg-gray-50 rounded">
                  <span>{score.indicator}</span>
                  <span className="font-semibold">{score.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {assessment.strengths && assessment.strengths.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Strengths</h2>
            <ul className="list-disc list-inside space-y-2">
              {assessment.strengths.map((strength: any) => (
                <li key={strength.id}>{strength.description}</li>
              ))}
            </ul>
          </div>
        )}

        {assessment.recommendations && assessment.recommendations.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Recommendations</h2>
            <ul className="list-disc list-inside space-y-2">
              {assessment.recommendations.map((recommendation: any) => (
                <li key={recommendation.id}>{recommendation.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
