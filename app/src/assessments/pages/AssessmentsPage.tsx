import React, { useState, useMemo } from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessments } from "wasp/client/operations";
import { Link } from "wasp/client/router";

interface Assessment {
  id: string;
  assessmentYear: number;
  createdAt: string;
  overallScore?: number;
  status: string;
  community?: { name: string };
}

interface GroupedAssessments {
  [communityName: string]: Assessment[];
}

export default function AssessmentsPage() {
  const { data: assessments, isLoading, error } = useQuery(getAssessments);
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set());

  // Group assessments by community
  const groupedAssessments = useMemo(() => {
    if (!assessments) return {};

    const grouped: GroupedAssessments = {};
    assessments.forEach((assessment: Assessment) => {
      const communityName = assessment.community?.name || "Unknown Community";
      if (!grouped[communityName]) {
        grouped[communityName] = [];
      }
      grouped[communityName].push(assessment);
    });

    // Sort assessments within each group by year (descending)
    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => b.assessmentYear - a.assessmentYear);
    });

    return grouped;
  }, [assessments]);

  const communityNames = Object.keys(groupedAssessments).sort();

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
        <div className="flex gap-3">
          <Link
            to="/assessments/import"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Import PDF
          </Link>
          <Link
            to="/assessments/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            New Assessment
          </Link>
        </div>
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
            {communityNames.length} {communityNames.length === 1 ? 'community' : 'communities'}, {assessments?.length || 0} assessments
          </span>
        </div>
      )}

      <div className="space-y-3">
        {communityNames.length > 0 ? (
          communityNames.map((communityName) => {
            const communityAssessments = groupedAssessments[communityName];
            const isExpanded = expandedCommunities.has(communityName);
            const latestAssessment = communityAssessments[0];

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
                        {communityAssessments.length} {communityAssessments.length === 1 ? 'assessment' : 'assessments'}
                        {latestAssessment.overallScore !== undefined && (
                          <span className="ml-2">
                            • Latest score: <span className="font-medium text-blue-600">{latestAssessment.overallScore}%</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      Latest: {latestAssessment.assessmentYear}
                    </span>
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    {communityAssessments.map((assessment) => {
                      const detailLink = `/assessments/${assessment.id}`;
                      return (
                        <Link
                          key={assessment.id}
                          to={detailLink as any}
                          className="block px-6 py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 transition"
                        >
                          <div className="flex justify-between items-center ml-9">
                            <div>
                              <span className="font-medium text-gray-900">
                                {assessment.assessmentYear} Assessment
                              </span>
                              <span className="text-gray-500 ml-3">
                                Created {new Date(assessment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {assessment.overallScore !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  assessment.overallScore >= 70 ? 'bg-green-100 text-green-800' :
                                  assessment.overallScore >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {assessment.overallScore}%
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                assessment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                assessment.status === 'IN_REVIEW' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {assessment.status}
                              </span>
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
            No assessments found. Create your first assessment to get started.
          </div>
        )}
      </div>
    </div>
  );
}
