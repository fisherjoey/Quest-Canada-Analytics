import { type GetAssessments, type GetAssessment, type CreateAssessment, type UpdateAssessment, type DeleteAssessment } from "wasp/server/operations";
import { HttpError } from "wasp/server";

// Get all assessments
export const getAssessments: GetAssessments<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const assessments = await context.entities.Assessment.findMany({
    include: {
      community: true,
      creator: true,
      indicators: true,
      strengths: true,
      recommendations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return assessments;
};

// Get single assessment by ID
export const getAssessment: GetAssessment<{ id: string }, any> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const assessment = await context.entities.Assessment.findUnique({
    where: { id },
    include: {
      community: true,
      creator: true,
      indicators: {
        orderBy: {
          indicatorNumber: "asc"
        }
      },
      strengths: true,
      recommendations: {
        orderBy: {
          priorityLevel: "asc"
        }
      },
    },
  });

  if (!assessment) {
    throw new HttpError(404, "Assessment not found");
  }

  return assessment;
};

// Create new assessment with nested indicator scores, strengths, and recommendations
export const createAssessment: CreateAssessment<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const { indicators, strengths, recommendations, ...assessmentData } = args;

  // Create assessment with nested data
  const assessment = await context.entities.Assessment.create({
    data: {
      communityId: assessmentData.communityId,
      assessmentDate: assessmentData.assessmentDate || new Date(),
      assessmentYear: assessmentData.assessmentYear || new Date().getFullYear(),
      assessorName: assessmentData.assessorName || context.user.email || "Unknown",
      assessorOrganization: assessmentData.assessorOrganization || "",
      assessorEmail: assessmentData.assessorEmail || context.user.email,
      generalNotes: assessmentData.generalNotes || "",
      status: assessmentData.status || "DRAFT",
      createdBy: context.user.id,
      // Create nested indicators
      indicators: indicators ? {
        create: indicators.map((ind: any) => ({
          indicatorNumber: ind.indicatorNumber,
          indicatorName: ind.indicatorName,
          category: ind.category,
          pointsEarned: ind.pointsEarned,
          pointsPossible: ind.pointsPossible,
          percentageScore: (ind.pointsEarned / ind.pointsPossible) * 100,
          notes: ind.notes || null,
        }))
      } : undefined,
      // Create nested strengths
      strengths: strengths ? {
        create: strengths.map((str: any) => ({
          category: str.category,
          title: str.title,
          description: str.description,
        }))
      } : undefined,
      // Create nested recommendations
      recommendations: recommendations ? {
        create: recommendations.map((rec: any) => ({
          indicatorNumber: rec.indicatorNumber || null,
          recommendationText: rec.recommendationText,
          priorityLevel: rec.priorityLevel || "MEDIUM",
          responsibleParty: rec.responsibleParty || null,
          implementationStatus: rec.implementationStatus || "PLANNED",
          targetDate: rec.targetDate || null,
          estimatedCost: rec.estimatedCost || null,
          estimatedGhgReduction: rec.estimatedGhgReduction || null,
        }))
      } : undefined,
    },
    include: {
      indicators: true,
      strengths: true,
      recommendations: true,
    }
  });

  // Calculate overall score if indicators were provided
  if (indicators && indicators.length > 0) {
    const overallScore = indicators.reduce((sum: number, ind: any) => sum + ind.pointsEarned, 0);
    const maxPossibleScore = indicators.reduce((sum: number, ind: any) => sum + ind.pointsPossible, 0);
    
    await context.entities.Assessment.update({
      where: { id: assessment.id },
      data: {
        overallScore,
        maxPossibleScore,
      }
    });
  }

  return assessment;
};

// Update existing assessment
export const updateAssessment: UpdateAssessment<{ id: string; [key: string]: any }, any> = async ({ id, ...data }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const assessment = await context.entities.Assessment.findUnique({
    where: { id },
  });

  if (!assessment) {
    throw new HttpError(404, "Assessment not found");
  }

  const { indicators, strengths, recommendations, ...assessmentData } = data;

  // Update assessment base data
  const updatedAssessment = await context.entities.Assessment.update({
    where: { id },
    data: assessmentData,
  });

  // Handle indicators update if provided
  if (indicators) {
    // Delete existing indicators
    await context.entities.IndicatorScore.deleteMany({
      where: { assessmentId: id }
    });
    
    // Create new indicators
    await context.entities.IndicatorScore.createMany({
      data: indicators.map((ind: any) => ({
        assessmentId: id,
        indicatorNumber: ind.indicatorNumber,
        indicatorName: ind.indicatorName,
        category: ind.category,
        pointsEarned: ind.pointsEarned,
        pointsPossible: ind.pointsPossible,
        percentageScore: (ind.pointsEarned / ind.pointsPossible) * 100,
        notes: ind.notes || null,
      }))
    });
    
    // Recalculate overall score
    const overallScore = indicators.reduce((sum: number, ind: any) => sum + ind.pointsEarned, 0);
    const maxPossibleScore = indicators.reduce((sum: number, ind: any) => sum + ind.pointsPossible, 0);
    
    await context.entities.Assessment.update({
      where: { id },
      data: { overallScore, maxPossibleScore }
    });
  }

  // Handle strengths update if provided
  if (strengths) {
    await context.entities.Strength.deleteMany({
      where: { assessmentId: id }
    });
    
    await context.entities.Strength.createMany({
      data: strengths.map((str: any) => ({
        assessmentId: id,
        category: str.category,
        title: str.title,
        description: str.description,
      }))
    });
  }

  // Handle recommendations update if provided
  if (recommendations) {
    await context.entities.Recommendation.deleteMany({
      where: { assessmentId: id }
    });
    
    await context.entities.Recommendation.createMany({
      data: recommendations.map((rec: any) => ({
        assessmentId: id,
        indicatorNumber: rec.indicatorNumber || null,
        recommendationText: rec.recommendationText,
        priorityLevel: rec.priorityLevel || "MEDIUM",
        responsibleParty: rec.responsibleParty || null,
        implementationStatus: rec.implementationStatus || "PLANNED",
        targetDate: rec.targetDate || null,
        estimatedCost: rec.estimatedCost || null,
        estimatedGhgReduction: rec.estimatedGhgReduction || null,
      }))
    });
  }

  return updatedAssessment;
};

// Delete assessment
export const deleteAssessment: DeleteAssessment<{ id: string }, any> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const assessment = await context.entities.Assessment.findUnique({
    where: { id },
  });

  if (!assessment) {
    throw new HttpError(404, "Assessment not found");
  }

  await context.entities.Assessment.delete({
    where: { id },
  });

  return { success: true };
};
