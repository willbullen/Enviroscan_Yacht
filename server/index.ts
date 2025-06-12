import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { logger } from "./services/logger";
import { performanceMiddleware, memoryOptimization } from "./utils/performance";

// Initialize Express app
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logger middleware
app.use(requestLogger);

// Add performance monitoring middleware
app.use(performanceMiddleware());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Keep existing logger for compatibility with some additional info
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Set up global error handlers
process.on('uncaughtException', (error) => {
  logger.error(error, { 
    type: 'uncaughtException',
    processId: process.pid
  });
  
  // Log fatal errors
  console.error('UNCAUGHT EXCEPTION - Application will continue running, but may be in unstable state:');
  console.error(error);
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  logger.error(error, { 
    type: 'unhandledRejection',
    processId: process.pid
  });
  
  console.error('UNHANDLED REJECTION - Application will continue running, but may be in unstable state:');
  console.error(reason);
});

(async () => {
  const server = await registerRoutes(app);

  // Add enhanced error handler middleware
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.performance('server_start', { port, environment: app.get("env") });
    log(`serving on port ${port}`);

    // Log initial memory usage
    const memoryUsage = memoryOptimization.getMemoryUsage();
    log(`Server started - Memory usage: ${memoryUsage.heapUsed}MB / ${memoryUsage.heapTotal}MB`);

    // Set up periodic memory monitoring (every 5 minutes)
    setInterval(() => {
      memoryOptimization.monitorMemory(256); // Warning threshold of 256MB
    }, 5 * 60 * 1000);
  });
})();
