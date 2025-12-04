/**
 * Assessment Selector Component
 *
 * Allows users to select multiple assessments for comparison
 * Groups by community with filtering and search capabilities
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { getScoreLevel } from '../../lib/style-utils';

interface AssessmentOption {
  id: string;
  communityName: string;
  year: number;
  overallScore: number | null;
  maxPossibleScore: number | null;
  status: string;
}

// Calculate percentage score from raw points
const getPercentageScore = (assessment: AssessmentOption): number | null => {
  if (assessment.overallScore === null || !assessment.maxPossibleScore) {
    return null;
  }
  return Math.round((assessment.overallScore / assessment.maxPossibleScore) * 100);
};

interface AssessmentSelectorProps {
  assessments: AssessmentOption[];
  selectedIds: string[];
  onSelect: (assessment: AssessmentOption) => void;
  template: string;
}

export function AssessmentSelector({
  assessments,
  selectedIds,
  onSelect,
  template
}: AssessmentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCommunities, setExpandedCommunities] = useState<Set<string>>(new Set());

  // Group assessments by community
  const groupedAssessments = useMemo(() => {
    const groups: Record<string, AssessmentOption[]> = {};

    assessments.forEach(assessment => {
      const community = assessment.communityName;
      if (!groups[community]) {
        groups[community] = [];
      }
      groups[community].push(assessment);
    });

    // Sort assessments within each group by year (descending)
    Object.keys(groups).forEach(community => {
      groups[community].sort((a, b) => b.year - a.year);
    });

    return groups;
  }, [assessments]);

  // Filter by search query
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedAssessments;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, AssessmentOption[]> = {};

    Object.entries(groupedAssessments).forEach(([community, items]) => {
      if (community.toLowerCase().includes(query)) {
        filtered[community] = items;
      } else {
        const matchingItems = items.filter(
          item => item.year.toString().includes(query)
        );
        if (matchingItems.length > 0) {
          filtered[community] = matchingItems;
        }
      }
    });

    return filtered;
  }, [groupedAssessments, searchQuery]);

  // Toggle community expansion
  const toggleCommunity = (community: string) => {
    setExpandedCommunities(prev => {
      const next = new Set(prev);
      if (next.has(community)) {
        next.delete(community);
      } else {
        next.add(community);
      }
      return next;
    });
  };

  // Expand all communities on search
  React.useEffect(() => {
    if (searchQuery.trim()) {
      setExpandedCommunities(new Set(Object.keys(filteredGroups)));
    }
  }, [searchQuery, filteredGroups]);

  // Select all from a community
  const selectAllFromCommunity = (community: string) => {
    const communityAssessments = filteredGroups[community] || [];
    communityAssessments.forEach(assessment => {
      if (!selectedIds.includes(assessment.id)) {
        onSelect(assessment);
      }
    });
  };

  const getScoreColorClass = (score: number | null): string => {
    if (score === null) return 'text-muted-foreground';
    const level = getScoreLevel(score);
    switch (level) {
      case 'excellent':
      case 'good':
        return 'text-success';
      case 'fair':
        return 'text-warning';
      default:
        return 'text-destructive';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search communities or years..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-2.5 px-3 pl-9 border-2 border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground transition-colors focus:outline-none focus:border-quest-teal"
        />
      </div>

      {/* Helper Text */}
      <div className="p-2.5 px-3 bg-muted rounded-md text-xs text-muted-foreground">
        {template === 'year-over-year' ? (
          <p className="m-0">Select assessments from the same community to see trends over time</p>
        ) : template === 'community-comparison' ? (
          <p className="m-0">Select assessments from different communities to compare</p>
        ) : (
          <p className="m-0">Select assessments to analyze their indicators</p>
        )}
      </div>

      {/* Community Groups */}
      <div className="flex flex-col gap-2">
        {Object.entries(filteredGroups).length === 0 ? (
          <div className="text-center py-5 text-muted-foreground">
            <p>No assessments found matching "{searchQuery}"</p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([community, items]) => {
            const isExpanded = expandedCommunities.has(community);
            const selectedCount = items.filter(i => selectedIds.includes(i.id)).length;

            return (
              <div key={community} className="border border-border rounded-lg overflow-hidden">
                <div
                  className="flex justify-between items-center p-3 bg-muted cursor-pointer transition-colors hover:bg-muted/80"
                  onClick={() => toggleCommunity(community)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="font-semibold text-foreground">{community}</span>
                    <span className="text-muted-foreground text-xs">({items.length})</span>
                  </div>
                  {selectedCount > 0 && (
                    <span className="text-xs py-0.5 px-2 bg-quest-teal text-white rounded-full">
                      {selectedCount} selected
                    </span>
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-border">
                    {items.length > 1 && (
                      <button
                        className="w-full py-2 px-3 bg-background border-b border-border text-xs text-quest-teal cursor-pointer text-left transition-colors hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation();
                          selectAllFromCommunity(community);
                        }}
                      >
                        Select all from {community}
                      </button>
                    )}
                    {items.map(assessment => {
                      const isSelected = selectedIds.includes(assessment.id);
                      return (
                        <div
                          key={assessment.id}
                          className={cn(
                            "flex items-center gap-3 py-2.5 px-3 cursor-pointer transition-colors border-b border-border/50 last:border-b-0 hover:bg-muted",
                            isSelected && "bg-quest-teal-muted"
                          )}
                          onClick={() => onSelect(assessment)}
                        >
                          <div className={cn(
                            "w-5 h-5 border-2 border-border rounded flex items-center justify-center flex-shrink-0 transition-all",
                            isSelected && "bg-quest-teal border-quest-teal text-white"
                          )}>
                            {isSelected && <Check size={14} />}
                          </div>
                          <div className="flex-1 flex flex-col gap-0.5">
                            <span className="font-semibold text-foreground">{assessment.year}</span>
                            <span className="text-[11px] text-muted-foreground uppercase">{assessment.status}</span>
                          </div>
                          <div className={cn("font-bold text-sm", getScoreColorClass(getPercentageScore(assessment)))}>
                            {getPercentageScore(assessment) !== null
                              ? `${getPercentageScore(assessment)}%`
                              : '-'
                            }
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AssessmentSelector;
