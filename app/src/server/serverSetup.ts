/**
 * Server middleware configuration
 * Increases body size limit to support PDF uploads for AI assessment extraction
 */

import express from 'express';
import type { MiddlewareConfigFn } from 'wasp/server';

/**
 * Configure server middleware to allow larger request bodies
 * Default is 100KB, we increase to 50MB for PDF uploads
 */
export const serverMiddlewareFn: MiddlewareConfigFn = (middlewareConfig) => {
  // Replace the default express.json middleware with one that has a higher limit
  // This is needed for PDF uploads which are sent as base64 (increases size by ~33%)
  middlewareConfig.set('express.json', express.json({ limit: '50mb' }));
  middlewareConfig.set('express.urlencoded', express.urlencoded({ extended: true, limit: '50mb' }));

  return middlewareConfig;
};
