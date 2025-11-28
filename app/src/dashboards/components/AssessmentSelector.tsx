/**
 * Assessment Selector Component
 *
 * Allows users to select multiple assessments for comparison
 * Groups by community with filtering and search capabilities
 */

import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface AssessmentOption {
  id: string;
  communityName: string;
  year: number;
  overallScore: number | null;
  status: string;
}

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

  const getScoreColor = (score: number | null): string => {
    if (score === null) return '#999';
    if (score >= 80) return '#27ae60';
    if (score >= 60) return '#f39c12';
    return '#e74c3c';
  };

  return (
    <div className="assessment-selector">
      {/* Search Input */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search communities or years..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Helper Text */}
      <div className="helper-text">
        {template === 'year-over-year' ? (
          <p>Select assessments from the same community to see trends over time</p>
        ) : template === 'community-comparison' ? (
          <p>Select assessments from different communities to compare</p>
        ) : (
          <p>Select assessments to analyze their indicators</p>
        )}
      </div>

      {/* Community Groups */}
      <div className="community-groups">
        {Object.entries(filteredGroups).length === 0 ? (
          <div className="no-results">
            <p>No assessments found matching "{searchQuery}"</p>
          </div>
        ) : (
          Object.entries(filteredGroups).map(([community, items]) => {
            const isExpanded = expandedCommunities.has(community);
            const selectedCount = items.filter(i => selectedIds.includes(i.id)).length;

            return (
              <div key={community} className="community-group">
                <div
                  className="community-header"
                  onClick={() => toggleCommunity(community)}
                >
                  <div className="header-left">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="community-name">{community}</span>
                    <span className="assessment-count">({items.length})</span>
                  </div>
                  {selectedCount > 0 && (
                    <span className="selected-count">{selectedCount} selected</span>
                  )}
                </div>

                {isExpanded && (
                  <div className="community-assessments">
                    {items.length > 1 && (
                      <button
                        className="select-all-btn"
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
                          className={`assessment-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => onSelect(assessment)}
                        >
                          <div className="item-checkbox">
                            {isSelected && <Check size={14} />}
                          </div>
                          <div className="item-content">
                            <span className="item-year">{assessment.year}</span>
                            <span className="item-status">{assessment.status}</span>
                          </div>
                          <div
                            className="item-score"
                            style={{ color: getScoreColor(assessment.overallScore) }}
                          >
                            {assessment.overallScore !== null
                              ? `${assessment.overallScore.toFixed(0)}%`
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

      <style>{selectorStyles}</style>
    </div>
  );
}

const selectorStyles = `
  .assessment-selector {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .search-container {
    position: relative;
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #999;
  }

  .search-input {
    width: 100%;
    padding: 10px 12px 10px 36px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #00a9a6;
  }

  .helper-text {
    padding: 10px 12px;
    background: #f8f9fa;
    border-radius: 6px;
    font-size: 12px;
    color: #666;
  }

  .helper-text p {
    margin: 0;
  }

  .community-groups {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .no-results {
    text-align: center;
    padding: 20px;
    color: #999;
  }

  .community-group {
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .community-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: #f8f9fa;
    cursor: pointer;
    transition: background 0.2s;
  }

  .community-header:hover {
    background: #f0f0f0;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .community-name {
    font-weight: 600;
    color: #333;
  }

  .assessment-count {
    color: #999;
    font-size: 12px;
  }

  .selected-count {
    font-size: 12px;
    padding: 2px 8px;
    background: #00a9a6;
    color: white;
    border-radius: 10px;
  }

  .community-assessments {
    border-top: 1px solid #e0e0e0;
  }

  .select-all-btn {
    width: 100%;
    padding: 8px 12px;
    background: #fafafa;
    border: none;
    border-bottom: 1px solid #e0e0e0;
    font-size: 12px;
    color: #00a9a6;
    cursor: pointer;
    text-align: left;
    transition: background 0.2s;
  }

  .select-all-btn:hover {
    background: #f0f0f0;
  }

  .assessment-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    cursor: pointer;
    transition: background 0.2s;
    border-bottom: 1px solid #f0f0f0;
  }

  .assessment-item:last-child {
    border-bottom: none;
  }

  .assessment-item:hover {
    background: #f8f9fa;
  }

  .assessment-item.selected {
    background: #e8f5f5;
  }

  .item-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid #ccc;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .assessment-item.selected .item-checkbox {
    background: #00a9a6;
    border-color: #00a9a6;
    color: white;
  }

  .item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-year {
    font-weight: 600;
    color: #333;
  }

  .item-status {
    font-size: 11px;
    color: #999;
    text-transform: uppercase;
  }

  .item-score {
    font-weight: 700;
    font-size: 14px;
  }
`;

export default AssessmentSelector;
