/**
 * Query functions for AI Extraction Logs
 */

import type { GetExtractionLogs } from 'wasp/server/operations';
import { HttpError } from 'wasp/server';

export const getExtractionLogs: GetExtractionLogs<
  { page?: number; pageSize?: number },
  any
> = async (args, context) => {
  if (!context.user) throw new HttpError(401, 'Unauthorized');

  const page = args.page || 1;
  const pageSize = args.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const isAdmin = context.user.isAdmin;
  const where = isAdmin ? {} : { userId: context.user.id };

  const [logs, total] = await Promise.all([
    context.entities.AiExtractionLog.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    }),
    context.entities.AiExtractionLog.count({ where }),
  ]);

  return {
    logs,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};
