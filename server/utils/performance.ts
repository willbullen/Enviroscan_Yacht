import { Request, Response, NextFunction } from "express";

// Performance monitoring
interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata?: any;
}

const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS = 10000; // Keep last 10k metrics

// Simple in-memory cache
const simpleCache = new Map<string, { data: any; expiry: number }>();

// Cache utilities
export const cacheUtils = {
  // Generate cache key from request
  generateCacheKey: (prefix: string, params: Record<string, any>): string => {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {} as Record<string, any>);
    
    return `${prefix}:${JSON.stringify(sortedParams)}`;
  },

  // Get from cache
  get: <T>(key: string): T | undefined => {
    const item = simpleCache.get(key);
    if (!item) return undefined;
    
    if (Date.now() > item.expiry) {
      simpleCache.delete(key);
      return undefined;
    }
    
    return item.data as T;
  },

  // Set in cache
  set: (key: string, value: any, ttlMs: number = 900000): void => { // 15 min default
    simpleCache.set(key, {
      data: value,
      expiry: Date.now() + ttlMs
    });
  },

  // Delete from cache
  delete: (key: string): void => {
    simpleCache.delete(key);
  },

  // Clear cache by prefix
  clearByPrefix: (prefix: string): void => {
    const keys = Array.from(simpleCache.keys());
    keys.forEach(key => {
      if (key.startsWith(prefix)) {
        simpleCache.delete(key);
      }
    });
  },

  // Get cache stats
  getStats: () => {
    return {
      size: simpleCache.size,
      keys: Array.from(simpleCache.keys())
    };
  }
};

// Pagination interface
interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  offset: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: number | null;
  previousPage: number | null;
}

// Pagination utilities
export const paginationUtils = {
  // Calculate pagination metadata
  calculatePagination: (page: number, limit: number, totalCount: number): PaginationMetadata => {
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
      offset,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? page + 1 : null,
      previousPage: hasPreviousPage ? page - 1 : null
    };
  },

  // Create paginated response
  createPaginatedResponse: <T>(
    data: T[],
    pagination: PaginationMetadata
  ) => {
    return {
      data,
      pagination,
      success: true,
      timestamp: new Date().toISOString()
    };
  }
};

// Database query optimization
export const queryOptimization = {
  // Build optimized where conditions
  buildWhereConditions: (filters: Record<string, any>) => {
    const conditions: any[] = [];
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        conditions.push({ [key]: value });
      }
    });
    
    return conditions;
  },

  // Optimize select fields to reduce data transfer
  selectOnlyNeeded: (fields?: string[]) => {
    if (!fields || fields.length === 0) {
      return undefined; // Return all fields
    }
    
    return fields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
  }
};

// Performance monitoring utilities
export const performanceMonitoring = {
  // Start performance timer
  startTimer: (): number => {
    return Date.now();
  },

  // End timer and record metrics
  endTimer: (
    startTime: number,
    operation: string,
    success: boolean = true,
    error?: string,
    metadata?: any
  ): number => {
    const duration = Date.now() - startTime;
    
    // Record metrics
    const metric: PerformanceMetrics = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      error,
      metadata
    };

    performanceMetrics.push(metric);
    
    // Keep only last MAX_METRICS
    if (performanceMetrics.length > MAX_METRICS) {
      performanceMetrics.shift();
    }

    // Log slow operations
    if (duration > 1000) {
      console.warn(`[SLOW OPERATION] ${operation} took ${duration}ms`);
    }

    return duration;
  },

  // Get performance statistics
  getStats: (timeRange?: number): any => {
    const now = Date.now();
    const rangeMs = timeRange || 60000; // Default to last minute
    
    const recentMetrics = performanceMetrics.filter(
      metric => now - metric.timestamp.getTime() <= rangeMs
    );

    if (recentMetrics.length === 0) {
      return {
        totalOperations: 0,
        averageDuration: 0,
        slowOperations: 0,
        errorRate: 0
      };
    }

    const totalDuration = recentMetrics.reduce((sum, metric) => sum + metric.duration, 0);
    const slowOperations = recentMetrics.filter(metric => metric.duration > 1000).length;
    const errorCount = recentMetrics.filter(metric => !metric.success).length;

    return {
      totalOperations: recentMetrics.length,
      averageDuration: Math.round(totalDuration / recentMetrics.length),
      slowOperations,
      errorRate: (errorCount / recentMetrics.length) * 100,
      slowestOperations: recentMetrics
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10)
        .map(metric => ({
          operation: metric.operation,
          duration: metric.duration,
          timestamp: metric.timestamp
        }))
    };
  }
};

// Simple performance middleware
export const performanceMiddleware = (operation?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = performanceMonitoring.startTimer();
    const operationName = operation || `${req.method} ${req.path}`;

    // Store original send method
    const originalSend = res.send;
    
    res.send = function(data: any) {
      performanceMonitoring.endTimer(
        startTime,
        operationName,
        res.statusCode < 400,
        res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
        {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          userId: (req as any).user?.id
        }
      );

      return originalSend.call(this, data);
    };

    next();
  };
};

// Batch processing utilities
export const batchProcessing = {
  // Process items in batches to avoid overwhelming the system
  processBatch: async <T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
    delayMs: number = 0
  ): Promise<R[]> => {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchPromises = batch.map(processor);
      
      try {
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches if specified
        if (delayMs > 0 && i + batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`Batch processing error at items ${i}-${i + batchSize}:`, error);
        throw error;
      }
    }
    
    return results;
  }
};

// Memory optimization utilities
export const memoryOptimization = {
  // Check memory usage
  getMemoryUsage: () => {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(usage.external / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024 * 100) / 100 // MB
    };
  },

  // Monitor memory and log warnings
  monitorMemory: (threshold: number = 512): void => {
    const usage = memoryOptimization.getMemoryUsage();
    
    if (usage.heapUsed > threshold) {
      console.warn(`[MEMORY WARNING] High memory usage: ${usage.heapUsed}MB (threshold: ${threshold}MB)`);
    }
  }
};

// Export all utilities
export default {
  cacheUtils,
  paginationUtils,
  queryOptimization,
  performanceMonitoring,
  performanceMiddleware,
  batchProcessing,
  memoryOptimization
}; 