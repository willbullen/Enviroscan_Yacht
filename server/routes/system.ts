import { Router, Request, Response } from "express";
import { performanceMonitoring, memoryOptimization, cacheUtils } from "../utils/performance";
import { asyncHandler } from "../middleware/errorHandler";

const router = Router();

// Get performance statistics
router.get("/performance", asyncHandler(async (req: Request, res: Response) => {
  const timeRange = req.query.timeRange ? parseInt(req.query.timeRange as string) : undefined;
  const stats = performanceMonitoring.getStats(timeRange);
  
  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
}));

// Get memory usage
router.get("/memory", asyncHandler(async (req: Request, res: Response) => {
  const memoryUsage = memoryOptimization.getMemoryUsage();
  
  res.json({
    success: true,
    data: memoryUsage,
    timestamp: new Date().toISOString()
  });
}));

// Get cache statistics
router.get("/cache", asyncHandler(async (req: Request, res: Response) => {
  const cacheStats = cacheUtils.getStats();
  
  res.json({
    success: true,
    data: cacheStats,
    timestamp: new Date().toISOString()
  });
}));

// Clear cache by prefix
router.delete("/cache/:prefix", asyncHandler(async (req: Request, res: Response) => {
  const prefix = req.params.prefix;
  cacheUtils.clearByPrefix(prefix);
  
  res.json({
    success: true,
    message: `Cache cleared for prefix: ${prefix}`,
    timestamp: new Date().toISOString()
  });
}));

// Get system health summary
router.get("/health", asyncHandler(async (req: Request, res: Response) => {
  const performanceStats = performanceMonitoring.getStats(60000); // Last minute
  const memoryUsage = memoryOptimization.getMemoryUsage();
  const cacheStats = cacheUtils.getStats();

  // Determine system health
  const isHealthy = (
    performanceStats.errorRate < 5 && // Less than 5% error rate
    performanceStats.averageDuration < 2000 && // Average response under 2s
    memoryUsage.heapUsed < 512 // Memory usage under 512MB
  );

  const health = {
    status: isHealthy ? 'healthy' : 'warning',
    uptime: process.uptime(),
    performance: {
      averageResponseTime: performanceStats.averageDuration,
      errorRate: performanceStats.errorRate,
      totalOperations: performanceStats.totalOperations,
      slowOperations: performanceStats.slowOperations
    },
    memory: memoryUsage,
    cache: {
      size: cacheStats.size,
      hitRate: cacheStats.size > 0 ? 'N/A' : '0%' // Simplified for now
    },
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  };

  res.json({
    success: true,
    data: health,
    timestamp: new Date().toISOString()
  });
}));

export default router; 