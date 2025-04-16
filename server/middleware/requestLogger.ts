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
  const newEnd = function (this: any, chunk: any, encoding?: BufferEncoding, callback?: () => void) {
    try {
      const duration = Date.now() - startTime;
      
      // Log API access
      if (req.path.startsWith('/api')) {
        // Write directly to the log file to ensure it works
        fs.appendFileSync(
          path.join(process.cwd(), 'logs', 'access.log'),
          JSON.stringify({
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            userId: (req as any).user?.id
          }) + '\n'
        );
      }
    } catch (error) {
      console.error('Error in request logger:', error);
    } finally {
      // Restore original end method regardless of errors
      res.end = originalEnd;
      
      // Handle different call signatures correctly
      if (typeof chunk === 'function') {
        return originalEnd.call(this);
      } else if (typeof encoding === 'function') {
        return originalEnd.call(this, chunk);
      } else {
        return originalEnd.call(this, chunk, encoding, callback);
      }
    }
  };
  
  res.end = newEnd;
  
  next();
}