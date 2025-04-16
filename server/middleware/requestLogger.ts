import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // Skip logging for static assets
  if (req.path.startsWith('/assets') || req.path.includes('.')) {
    return next();
  }
  
  const startTime = Date.now();
  const originalEnd = res.end;
  
  // Override end method to capture response time
  res.end = function (...args: any[]) {
    const duration = Date.now() - startTime;
    
    // Log API access
    if (req.path.startsWith('/api')) {
      logger.access(
        req.method,
        req.path,
        res.statusCode,
        duration,
        (req as any).user?.id
      );
    }
    
    // Restore original end method and call it
    res.end = originalEnd;
    return originalEnd.apply(res, args);
  };
  
  next();
}