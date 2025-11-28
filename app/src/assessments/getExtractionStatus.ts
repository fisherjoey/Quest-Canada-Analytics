import { HttpError } from 'wasp/server';

export const getExtractionStatus = async ({ extractionLogId }: any, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Unauthorized');
  }

  const log = await context.entities.AiExtractionLog.findUnique({
    where: { id: extractionLogId },
  });

  if (!log || log.userId !== context.user.id) {
    throw new HttpError(404, 'Extraction log not found');
  }

  return {
    status: log.status,
    data: log.extractedData,
    error: log.errorMessage,
    processingTimeMs: log.processingTimeMs,
  };
};
