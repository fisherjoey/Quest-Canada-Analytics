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
      indicators: true,
      strengths: true,
      recommendations: true,
    },
  });

  if (!assessment) {
    throw new HttpError(404, "Assessment not found");
  }

  return assessment;
};

// Create new assessment
export const createAssessment: CreateAssessment<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const assessment = await context.entities.Assessment.create({
    data: {
      communityId: args.communityId,
      assessmentDate: args.assessmentDate || new Date(),
      assessmentYear: args.assessmentYear || new Date().getFullYear(),
      assessorName: args.assessorName || context.user.email || "Unknown",
      assessorOrganization: args.assessorOrganization || "",
      assessorEmail: args.assessorEmail || context.user.email,
      generalNotes: args.generalNotes || "",
      createdBy: context.user.id,
    },
  });

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

  const updatedAssessment = await context.entities.Assessment.update({
    where: { id },
    data,
  });

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
