import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  context?: Record<string, any>;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  // Default status code to 500 if not specified
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error with context information
  logger.error(err, {
    url: req.url,
    method: req.method,
    headers: req.headers,
    query: req.query,
    body: req.body,
    userId: (req as any).user?.id,
    statusCode
  });
  
  // Add error code to the response if available
  const errorResponse: Record<string, any> = { message };
  if (err.code) {
    errorResponse.code = err.code;
  }
  
  // Hide stack trace in production
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json(errorResponse);
}

// Helper function to create structured errors
export function createError(message: string, statusCode: number = 500, code?: string, context?: Record<string, any>): AppError {
  const error = new Error(message) as AppError;
  error.status = statusCode;
  if (code) error.code = code;
  if (context) error.context = context;
  return error;
}

// Function to ensure async errors are caught
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}