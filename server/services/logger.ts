import fs from 'fs';
import path from 'path';
import { DatabaseStorage } from '../databaseStorage';
import { db } from '../db';
import { activityLogs } from '@shared/schema';

// Singleton instance for the logger
export class Logger {
  private static instance: Logger;
  private readonly logsDir: string;
  private readonly errorLogPath: string;
  private readonly accessLogPath: string;
  private readonly performanceLogPath: string;
  private storage: DatabaseStorage;
  
  private constructor() {
    this.logsDir = path.join(process.cwd(), 'logs');
    this.errorLogPath = path.join(this.logsDir, 'error.log');
    this.accessLogPath = path.join(this.logsDir, 'access.log');
    this.performanceLogPath = path.join(this.logsDir, 'performance.log');
    this.storage = new DatabaseStorage();
    
    // Ensure logs directory exists
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }
  
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * Log an error with structured information
   */
  public async error(error: Error, context?: Record<string, any>): Promise<void> {
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      level: 'ERROR',
      message: error.message,
      stack: error.stack,
      context: context || {},
    };
    
    // Write to file
    fs.appendFileSync(
      this.errorLogPath,
      `${JSON.stringify(errorLog)}\n`
    );
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ERROR]', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      if (context) {
        console.error('Context:', context);
      }
    }
    
    // Store in activity log for critical errors
    try {
      await this.storage.createActivityLog({
        activityType: 'system_error',
        description: `System error: ${error.message.substring(0, 100)}`,
        metadata: {
          error: {
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            ...context
          }
        }
      });
    } catch (logError) {
      // If we can't log to the database, at least log to the file
      fs.appendFileSync(
        this.errorLogPath,
        `${JSON.stringify({
          timestamp,
          level: 'ERROR',
          message: 'Failed to log error to database',
          error: logError
        })}\n`
      );
    }
  }
  
  /**
   * Log information about API access
   */
  public access(method: string, path: string, statusCode: number, duration: number, userId?: number): void {
    const timestamp = new Date().toISOString();
    const accessLog = {
      timestamp,
      level: 'INFO',
      method,
      path,
      statusCode,
      duration,
      userId
    };
    
    // Write to file
    fs.appendFileSync(
      this.accessLogPath,
      `${JSON.stringify(accessLog)}\n`
    );
    
    // Track slow responses for performance monitoring
    if (duration > 1000) { // More than 1 second is slow
      this.performance('slow_response', { 
        method, 
        path, 
        duration,
        timestamp: new Date()
      });
    }
  }
  
  /**
   * Log performance-related information
   */
  public performance(type: string, data: Record<string, any>): void {
    const timestamp = new Date().toISOString();
    const performanceLog = {
      timestamp,
      level: 'INFO',
      type,
      ...data
    };
    
    // Write to file
    fs.appendFileSync(
      this.performanceLogPath,
      `${JSON.stringify(performanceLog)}\n`
    );
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[PERFORMANCE] ${type}`, data);
    }
  }
  
  /**
   * Get recent error logs (for admin dashboard)
   */
  public getRecentErrors(limit: number = 10): Array<Record<string, any>> {
    try {
      const logs: Array<Record<string, any>> = [];
      const fileContent = fs.readFileSync(this.errorLogPath, 'utf-8');
      
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      const recentLines = lines.slice(-limit);
      
      for (const line of recentLines) {
        try {
          logs.push(JSON.parse(line));
        } catch (e) {
          // Skip malformed log entries
        }
      }
      
      return logs;
    } catch (error) {
      // If file doesn't exist or other error, return empty array
      return [];
    }
  }
  
  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): Record<string, any> {
    try {
      const logs: Array<Record<string, any>> = [];
      const fileContent = fs.readFileSync(this.performanceLogPath, 'utf-8');
      
      const lines = fileContent.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        try {
          logs.push(JSON.parse(line));
        } catch (e) {
          // Skip malformed log entries
        }
      }
      
      // Calculate average response time
      const apiCalls = logs.filter(log => log.type === 'slow_response');
      let totalDuration = 0;
      for (const call of apiCalls) {
        totalDuration += call.duration || 0;
      }
      const averageResponseTime = apiCalls.length > 0 ? totalDuration / apiCalls.length : 0;
      
      // Find slowest endpoints
      const endpointPerformance: Record<string, { count: number, totalDuration: number, avgDuration: number }> = {};
      for (const call of apiCalls) {
        const endpoint = call.path;
        if (!endpoint) continue;
        
        if (!endpointPerformance[endpoint]) {
          endpointPerformance[endpoint] = { count: 0, totalDuration: 0, avgDuration: 0 };
        }
        
        endpointPerformance[endpoint].count++;
        endpointPerformance[endpoint].totalDuration += call.duration || 0;
      }
      
      // Calculate average duration for each endpoint
      Object.keys(endpointPerformance).forEach(endpoint => {
        const stats = endpointPerformance[endpoint];
        stats.avgDuration = stats.totalDuration / stats.count;
      });
      
      return {
        averageResponseTime,
        slowestEndpoints: Object.entries(endpointPerformance)
          .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
          .slice(0, 5)
          .map(([endpoint, stats]) => ({
            endpoint,
            avgDuration: stats.avgDuration,
            callCount: stats.count
          })),
        totalSlowResponses: apiCalls.length
      };
    } catch (error) {
      // If file doesn't exist or other error, return empty stats
      return {
        averageResponseTime: 0,
        slowestEndpoints: [],
        totalSlowResponses: 0
      };
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();