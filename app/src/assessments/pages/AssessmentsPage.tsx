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
    return <div className="p-8 text-foreground">Loading assessments...</div>;
  }

  if (error) {
    return <div className="p-8 text-destructive">Error loading assessments: {error.message}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-foreground">Community Assessments</h1>
        <div className="flex gap-3">
          <Link
            to="/assessments/import"
            className="bg-success text-success-foreground px-4 py-2 rounded hover:bg-success/90 transition-colors"
          >
            Import PDF
          </Link>
          <Link
            to="/assessments/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
          >
            New Assessment
          </Link>
        </div>
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
                        {communityAssessments.length} {communityAssessments.length === 1 ? 'assessment' : 'assessments'}
                        {latestAssessment.overallScore !== undefined && (
                          <span className="ml-2">
                            • Latest score: <span className="font-medium text-primary">{latestAssessment.overallScore}%</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      Latest: {latestAssessment.assessmentYear}
                    </span>
                  </div>
                </button>

                {/* Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/50">
                    {communityAssessments.map((assessment) => {
                      const detailLink = `/assessments/${assessment.id}`;
                      return (
                        <Link
                          key={assessment.id}
                          to={detailLink as any}
                          className="block px-6 py-4 border-b border-border last:border-b-0 hover:bg-accent transition-colors"
                        >
                          <div className="flex justify-between items-center ml-9">
                            <div>
                              <span className="font-medium text-foreground">
                                {assessment.assessmentYear} Assessment
                              </span>
                              <span className="text-muted-foreground ml-3">
                                Created {new Date(assessment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              {assessment.overallScore !== undefined && (
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  assessment.overallScore >= 70 ? 'bg-success/20 text-success dark:bg-success/30' :
                                  assessment.overallScore >= 50 ? 'bg-warning/20 text-warning dark:bg-warning/30' :
                                  'bg-destructive/20 text-destructive dark:bg-destructive/30'
                                }`}>
                                  {assessment.overallScore}%
                                </span>
                              )}
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                assessment.status === 'COMPLETED' ? 'bg-success/20 text-success dark:bg-success/30' :
                                assessment.status === 'IN_REVIEW' ? 'bg-primary/20 text-primary dark:bg-primary/30' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {assessment.status}
                              </span>
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
            No assessments found. Create your first assessment to get started.
          </div>
        )}
      </div>
    </div>
  );
}
