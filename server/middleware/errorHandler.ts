import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';
import { z } from 'zod';

// Custom error types for better error handling
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public errorCode?: string;
  public details?: any;

  constructor(
    message: string,
    statusCode: number,
    errorCode?: string,
    details?: any,
    isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier 
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "NOT_FOUND", { resource, identifier });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT", details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}

export class FileUploadError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "FILE_UPLOAD_ERROR", details);
  }
}

// Error logging utility
const logError = (error: Error, request?: Request) => {
  const timestamp = new Date().toISOString();
  const requestInfo = request ? {
    method: request.method,
    url: request.originalUrl,
    userAgent: request.get('User-Agent'),
    ip: request.ip,
    userId: (request as any).user?.id
  } : {};

  console.error(`[${timestamp}] ERROR:`, {
    message: error.message,
    stack: error.stack,
    request: requestInfo,
    ...(error instanceof AppError && {
      statusCode: error.statusCode,
      errorCode: error.errorCode,
      details: error.details,
      isOperational: error.isOperational
    })
  });
};

// Main error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log the error
  logError(error, req);

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code
    }));

    return res.status(400).json({
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: validationErrors,
      timestamp: new Date().toISOString()
    });
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.errorCode,
      details: error.details,
      timestamp: new Date().toISOString()
    });
  }

  // Handle database connection errors
  if (error.message?.includes('connection') || error.message?.includes('timeout')) {
    return res.status(503).json({
      success: false,
      error: "Service temporarily unavailable. Please try again later.",
      code: "SERVICE_UNAVAILABLE",
      timestamp: new Date().toISOString()
    });
  }

  // Handle file system errors
  const nodeError = error as any; // Cast to access Node.js error properties
  if (nodeError.code === 'ENOENT') {
    return res.status(404).json({
      success: false,
      error: "Requested file not found",
      code: "FILE_NOT_FOUND",
      timestamp: new Date().toISOString()
    });
  }

  if (nodeError.code === 'ENOSPC') {
    return res.status(507).json({
      success: false,
      error: "Insufficient storage space",
      code: "INSUFFICIENT_STORAGE",
      timestamp: new Date().toISOString()
    });
  }

  // Handle multer file upload errors
  if (nodeError.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: "File too large",
      code: "FILE_TOO_LARGE",
      details: { maxSize: "Size limit exceeded" },
      timestamp: new Date().toISOString()
    });
  }

  if (nodeError.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      error: "Too many files",
      code: "TOO_MANY_FILES",
      timestamp: new Date().toISOString()
    });
  }

  if (nodeError.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      error: "Unexpected file field",
      code: "UNEXPECTED_FILE",
      timestamp: new Date().toISOString()
    });
  }

  // Default error response for unhandled errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: isDevelopment ? error.message : "Internal server error",
    code: "INTERNAL_ERROR",
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
};

// Async error wrapper for route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Request validation middleware
export const validateRequest = (schema: {
  body?: z.ZodSchema;
  params?: z.ZodSchema;
  query?: z.ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schema.body) {
        req.body = schema.body.parse(req.body);
      }
      if (schema.params) {
        req.params = schema.params.parse(req.params);
      }
      if (schema.query) {
        req.query = schema.query.parse(req.query);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Rate limiting error
export class RateLimitError extends AppError {
  constructor(message = "Too many requests") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

// Performance monitoring wrapper
export const performanceMonitor = (operation: string) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        
        if (duration > 1000) { // Log slow operations
          console.warn(`[PERFORMANCE] Slow operation: ${operation} took ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`[PERFORMANCE] Failed operation: ${operation} failed after ${duration}ms`, error);
        throw error;
      }
    };
  };
};