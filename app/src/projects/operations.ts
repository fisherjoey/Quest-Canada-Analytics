import { type GetProjects, type GetProject, type CreateProject, type UpdateProject, type DeleteProject } from "wasp/server/operations";
import { HttpError } from "wasp/server";

// Get all projects
export const getProjects: GetProjects<void, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const projects = await context.entities.Project.findMany({
    include: {
      community: true,
      fundingSources: true,
      milestones: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return projects;
};

// Get single project by ID
export const getProject: GetProject<{ id: string }, any> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const project = await context.entities.Project.findUnique({
    where: { id },
    include: {
      community: true,
      fundingSources: true,
      milestones: true,
    },
  });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  return project;
};

// Create new project
export const createProject: CreateProject<any, any> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const project = await context.entities.Project.create({
    data: {
      communityId: args.communityId,
      projectCode: args.projectCode,
      projectName: args.projectName,
      description: args.description || null,
      projectType: args.projectType,
      sector: args.sector,
      status: args.status || "PLANNED",
      priorityLevel: args.priorityLevel || "MEDIUM",
      estimatedGhgReduction: args.estimatedGhgReduction || null,
      estimatedEnergyReduction: args.estimatedEnergyReduction || null,
      estimatedCost: args.estimatedCost || null,
      plannedStartDate: args.plannedStartDate ? new Date(args.plannedStartDate) : null,
      actualStartDate: args.actualStartDate ? new Date(args.actualStartDate) : null,
      estimatedCompletionDate: args.estimatedCompletionDate ? new Date(args.estimatedCompletionDate) : null,
      actualCompletionDate: args.actualCompletionDate ? new Date(args.actualCompletionDate) : null,
      completionPercentage: args.completionPercentage || 0,
    },
  });

  return project;
};

// Update existing project
export const updateProject: UpdateProject<{ id: string; [key: string]: any }, any> = async ({ id, ...data }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const project = await context.entities.Project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  // Convert date strings to Date objects if present
  const updateData = { ...data };
  if (updateData.plannedStartDate) {
    updateData.plannedStartDate = new Date(updateData.plannedStartDate);
  }
  if (updateData.actualStartDate) {
    updateData.actualStartDate = new Date(updateData.actualStartDate);
  }
  if (updateData.estimatedCompletionDate) {
    updateData.estimatedCompletionDate = new Date(updateData.estimatedCompletionDate);
  }
  if (updateData.actualCompletionDate) {
    updateData.actualCompletionDate = new Date(updateData.actualCompletionDate);
  }

  const updatedProject = await context.entities.Project.update({
    where: { id },
    data: updateData,
  });

  return updatedProject;
};

// Delete project
export const deleteProject: DeleteProject<{ id: string }, any> = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401, "User not authenticated");
  }

  const project = await context.entities.Project.findUnique({
    where: { id },
  });

  if (!project) {
    throw new HttpError(404, "Project not found");
  }

  await context.entities.Project.delete({
    where: { id },
  });

  return { success: true };
};
