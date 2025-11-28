import React, { useState, useEffect } from "react";
import { useQuery } from "wasp/client/operations";
import { getAssessment, createAssessment, updateAssessment } from "wasp/client/operations";
import { Link } from "wasp/client/router";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@src/components/ui/button";

// Define the 10 Quest Canada indicators
const INDICATORS = [
  { number: 1, name: "Sustainability Governance", category: "GOVERNANCE" },
  { number: 2, name: "Corporate Energy & GHG Management", category: "CAPACITY" },
  { number: 3, name: "Community Energy & Emissions Planning", category: "PLANNING" },
  { number: 4, name: "Integrated Community Planning", category: "PLANNING" },
  { number: 5, name: "Energy Distribution", category: "INFRASTRUCTURE" },
  { number: 6, name: "Buildings", category: "BUILDINGS" },
  { number: 7, name: "Energy Generation", category: "ENERGY" },
  { number: 8, name: "Transportation", category: "TRANSPORTATION" },
  { number: 9, name: "Solid Waste", category: "WASTE" },
  { number: 10, name: "Water & Wastewater", category: "OTHER" },
];

const CATEGORIES = [
  "GOVERNANCE", "CAPACITY", "PLANNING", "INFRASTRUCTURE",
  "OPERATIONS", "BUILDINGS", "TRANSPORTATION", "WASTE",
  "ENERGY", "OTHER"
];

const PRIORITY_LEVELS = ["HIGH", "MEDIUM", "LOW"];

export default function AssessmentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: assessment, isLoading } = useQuery(getAssessment, { id: id! }, { enabled: !!id });

  // Assessment metadata
  const [formData, setFormData] = useState({
    communityId: "",
    assessmentYear: new Date().getFullYear(),
    assessorName: "",
    assessorOrganization: "",
    assessorEmail: "",
    generalNotes: "",
  });

  // Indicator scores (all 10 indicators)
  const [indicators, setIndicators] = useState(
    INDICATORS.map(ind => ({
      indicatorNumber: ind.number,
      indicatorName: ind.name,
      category: ind.category,
      pointsEarned: 0,
      pointsPossible: 10,
      notes: ""
    }))
  );

  // Strengths (dynamic array)
  const [strengths, setStrengths] = useState([
    { category: "GOVERNANCE", title: "", description: "" }
  ]);

  // Recommendations (dynamic array)
  const [recommendations, setRecommendations] = useState([
    {
      indicatorNumber: 1,
      recommendationText: "",
      priorityLevel: "MEDIUM",
      responsibleParty: "",
      targetDate: "",
      estimatedCost: "",
      estimatedGhgReduction: ""
    }
  ]);

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

      // Load existing indicators
      if (assessment.indicators && assessment.indicators.length > 0) {
        setIndicators(assessment.indicators.map((ind: any) => ({
          indicatorNumber: ind.indicatorNumber,
          indicatorName: ind.indicatorName,
          category: ind.category,
          pointsEarned: ind.pointsEarned,
          pointsPossible: ind.pointsPossible,
          notes: ind.notes || ""
        })));
      }

      // Load existing strengths
      if (assessment.strengths && assessment.strengths.length > 0) {
        setStrengths(assessment.strengths.map((str: any) => ({
          category: str.category,
          title: str.title,
          description: str.description
        })));
      }

      // Load existing recommendations
      if (assessment.recommendations && assessment.recommendations.length > 0) {
        setRecommendations(assessment.recommendations.map((rec: any) => ({
          indicatorNumber: rec.indicatorNumber || 1,
          recommendationText: rec.recommendationText,
          priorityLevel: rec.priorityLevel,
          responsibleParty: rec.responsibleParty || "",
          targetDate: rec.targetDate ? new Date(rec.targetDate).toISOString().split("T")[0] : "",
          estimatedCost: rec.estimatedCost || "",
          estimatedGhgReduction: rec.estimatedGhgReduction || ""
        })));
      }
    }
  }, [assessment]);

  const handleSubmit = async (e: React.FormEvent, status: string = "COMPLETED") => {
    e.preventDefault();

    try {
      const payload = {
        ...formData,
        status,  // Add status to payload
        indicators: indicators.map(ind => ({
          ...ind,
          pointsEarned: parseFloat(ind.pointsEarned.toString()),
          pointsPossible: parseFloat(ind.pointsPossible.toString())
        })),
        strengths: strengths.filter(s => s.title.trim() !== ""),
        recommendations: recommendations.filter(r => r.recommendationText.trim() !== "").map(rec => ({
          ...rec,
          indicatorNumber: parseInt(rec.indicatorNumber.toString()),
          targetDate: rec.targetDate ? new Date(rec.targetDate) : null,
          estimatedCost: rec.estimatedCost ? parseFloat(rec.estimatedCost.toString()) : null,
          estimatedGhgReduction: rec.estimatedGhgReduction ? parseFloat(rec.estimatedGhgReduction.toString()) : null
        }))
      };

      if (isEditing) {
        await updateAssessment({ id: id!, ...payload });
      } else {
        await createAssessment(payload);
      }

      navigate("/assessments");
    } catch (error: any) {
      console.error("Error saving assessment:", error);
      alert("Error saving assessment: " + error.message);
    }
  };

  const handleSaveAsDraft = async (e: React.MouseEvent) => {
    e.preventDefault();
    const formEvent = new Event('submit') as any;
    formEvent.preventDefault = () => {};
    await handleSubmit(formEvent as React.FormEvent, "DRAFT");
  };

  if (isLoading && id) {
    return <div className="p-8 text-foreground">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/assessments" className="text-primary hover:text-primary/80 transition-colors">
          ← Back to Assessments
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow border border-border p-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">
          {isEditing ? "Edit Assessment" : "New Assessment"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* SECTION 1: Assessment Metadata */}
          <div className="border-b border-border pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Assessment Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Community *
                </label>
                <select
                  value={formData.communityId}
                  onChange={(e) => setFormData({ ...formData, communityId: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  required
                >
                  <option value="">Select a community...</option>
                  <option value="comm-calgary">Calgary</option>
                  <option value="comm-edmonton">Edmonton</option>
                  <option value="comm-vancouver">Vancouver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Assessment Year *
                </label>
                <input
                  type="number"
                  value={formData.assessmentYear}
                  onChange={(e) => setFormData({ ...formData, assessmentYear: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Assessor Name *
                </label>
                <input
                  type="text"
                  value={formData.assessorName}
                  onChange={(e) => setFormData({ ...formData, assessorName: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Assessor Organization *
                </label>
                <input
                  type="text"
                  value={formData.assessorOrganization}
                  onChange={(e) => setFormData({ ...formData, assessorOrganization: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Assessor Email
                </label>
                <input
                  type="email"
                  value={formData.assessorEmail}
                  onChange={(e) => setFormData({ ...formData, assessorEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2 text-foreground">
                General Notes
              </label>
              <textarea
                value={formData.generalNotes}
                onChange={(e) => setFormData({ ...formData, generalNotes: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                rows={3}
              />
            </div>
          </div>

          {/* SECTION 2: Indicator Scores */}
          <div className="border-b border-border pb-6">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Indicator Scores</h2>
            <p className="text-sm text-muted-foreground mb-4">Enter scores for all 10 Quest Canada indicators</p>

            <div className="space-y-4">
              {indicators.map((indicator, index) => (
                <div key={indicator.indicatorNumber} className="bg-muted p-4 rounded-lg">
                  <h3 className="font-semibold mb-2 text-foreground">
                    {indicator.indicatorNumber}. {indicator.indicatorName}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1 text-foreground">Points Earned *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={indicator.pointsEarned}
                        onChange={(e) => {
                          const newIndicators = [...indicators];
                          newIndicators[index].pointsEarned = parseFloat(e.target.value) || 0;
                          setIndicators(newIndicators);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Points Possible *</label>
                      <input
                        type="number"
                        step="0.1"
                        value={indicator.pointsPossible}
                        onChange={(e) => {
                          const newIndicators = [...indicators];
                          newIndicators[index].pointsPossible = parseFloat(e.target.value) || 10;
                          setIndicators(newIndicators);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Percentage</label>
                      <input
                        type="text"
                        value={`${((indicator.pointsEarned / indicator.pointsPossible) * 100).toFixed(1)}%`}
                        disabled
                        className="w-full px-3 py-2 border border-input rounded bg-muted text-muted-foreground"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm mb-1 text-foreground">Notes</label>
                    <textarea
                      value={indicator.notes}
                      onChange={(e) => {
                        const newIndicators = [...indicators];
                        newIndicators[index].notes = e.target.value;
                        setIndicators(newIndicators);
                      }}
                      className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: Strengths */}
          <div className="border-b border-border pb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Strengths</h2>
                <p className="text-sm text-muted-foreground">Identify community strengths</p>
              </div>
              <Button
                type="button"
                onClick={() => setStrengths([...strengths, { category: "GOVERNANCE", title: "", description: "" }])}
                variant="default"
              >
                + Add Strength
              </Button>
            </div>

            <div className="space-y-4">
              {strengths.map((strength, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg relative">
                  <button
                    type="button"
                    onClick={() => setStrengths(strengths.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    ✕ Remove
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1 text-foreground">Category *</label>
                      <select
                        value={strength.category}
                        onChange={(e) => {
                          const newStrengths = [...strengths];
                          newStrengths[index].category = e.target.value;
                          setStrengths(newStrengths);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                        required
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Title *</label>
                      <input
                        type="text"
                        value={strength.title}
                        onChange={(e) => {
                          const newStrengths = [...strengths];
                          newStrengths[index].title = e.target.value;
                          setStrengths(newStrengths);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm mb-1 text-foreground">Description *</label>
                    <textarea
                      value={strength.description}
                      onChange={(e) => {
                        const newStrengths = [...strengths];
                        newStrengths[index].description = e.target.value;
                        setStrengths(newStrengths);
                      }}
                      className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      rows={2}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Recommendations */}
          <div className="pb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Recommendations</h2>
                <p className="text-sm text-muted-foreground">Action recommendations for improvement</p>
              </div>
              <Button
                type="button"
                onClick={() => setRecommendations([...recommendations, {
                  indicatorNumber: 1,
                  recommendationText: "",
                  priorityLevel: "MEDIUM",
                  responsibleParty: "",
                  targetDate: "",
                  estimatedCost: "",
                  estimatedGhgReduction: ""
                }])}
                variant="default"
              >
                + Add Recommendation
              </Button>
            </div>

            <div className="space-y-4">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-muted p-4 rounded-lg relative">
                  <button
                    type="button"
                    onClick={() => setRecommendations(recommendations.filter((_, i) => i !== index))}
                    className="absolute top-2 right-2 text-destructive hover:text-destructive/80 transition-colors"
                  >
                    ✕ Remove
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm mb-1 text-foreground">Indicator #</label>
                      <select
                        value={rec.indicatorNumber}
                        onChange={(e) => {
                          const newRecs = [...recommendations];
                          newRecs[index].indicatorNumber = parseInt(e.target.value);
                          setRecommendations(newRecs);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      >
                        {INDICATORS.map(ind => (
                          <option key={ind.number} value={ind.number}>
                            {ind.number}. {ind.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Priority *</label>
                      <select
                        value={rec.priorityLevel}
                        onChange={(e) => {
                          const newRecs = [...recommendations];
                          newRecs[index].priorityLevel = e.target.value;
                          setRecommendations(newRecs);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                        required
                      >
                        {PRIORITY_LEVELS.map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Responsible Party</label>
                      <input
                        type="text"
                        value={rec.responsibleParty}
                        onChange={(e) => {
                          const newRecs = [...recommendations];
                          newRecs[index].responsibleParty = e.target.value;
                          setRecommendations(newRecs);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm mb-1 text-foreground">Recommendation Text *</label>
                    <textarea
                      value={rec.recommendationText}
                      onChange={(e) => {
                        const newRecs = [...recommendations];
                        newRecs[index].recommendationText = e.target.value;
                        setRecommendations(newRecs);
                      }}
                      className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      rows={2}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-sm mb-1 text-foreground">Target Date</label>
                      <input
                        type="date"
                        value={rec.targetDate}
                        onChange={(e) => {
                          const newRecs = [...recommendations];
                          newRecs[index].targetDate = e.target.value;
                          setRecommendations(newRecs);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Estimated Cost ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rec.estimatedCost}
                        onChange={(e) => {
                          const newRecs = [...recommendations];
                          newRecs[index].estimatedCost = e.target.value;
                          setRecommendations(newRecs);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-foreground">Est. GHG Reduction (tCO2e)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rec.estimatedGhgReduction}
                        onChange={(e) => {
                          const newRecs = [...recommendations];
                          newRecs[index].estimatedGhgReduction = e.target.value;
                          setRecommendations(newRecs);
                        }}
                        className="w-full px-3 py-2 border border-input rounded bg-background text-foreground focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-6 border-t border-border">
            <Button type="submit" size="lg">
              {isEditing ? "Update" : "Submit"} Assessment
            </Button>
            <Button
              type="button"
              onClick={handleSaveAsDraft}
              variant="secondary"
              size="lg"
            >
              Save as Draft
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/assessments">
                Cancel
              </Link>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
