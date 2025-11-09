import React from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessments } from "wasp/client/operations";
import { Link } from "wasp/client/router";

export default function AssessmentsPage() {
  const { data: assessments, isLoading, error } = useQuery(getAssessments);

  if (isLoading) {
    return <div className="p-8">Loading assessments...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Error loading assessments: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Community Assessments</h1>
        <Link to="/assessments/new" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          New Assessment
        </Link>
      </div>

      <div className="grid gap-4">
        {assessments && assessments.length > 0 ? (
          assessments.map((assessment: any) => {
            const detailLink = `/assessments/${assessment.id}`;
            return (
              <Link 
                key={assessment.id} 
                to={detailLink as any}
                className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{assessment.community?.name || "Unknown Community"}</h2>
                    <p className="text-gray-600 mt-1">
                      Year: {assessment.assessmentYear} | Created: {new Date(assessment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-blue-600 hover:text-blue-800">View Details →</span>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-12 text-gray-500">
            No assessments found. Create your first assessment to get started.
          </div>
        )}
      </div>
    </div>
  );
}
