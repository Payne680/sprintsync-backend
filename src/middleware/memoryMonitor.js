const logger = require("../utils/logger");

/**
 * Memory monitoring middleware
 * Tracks memory usage and logs potential memory leaks
 */
class MemoryMonitor {
  constructor(options = {}) {
    this.thresholdMB = options.thresholdMB || 100; // Memory threshold in MB
    this.logInterval = options.logInterval || 60000; // Log interval in ms (1 minute)
    this.alertThreshold = options.alertThreshold || 200; // Alert threshold in MB
    this.intervalId = null;
    this.startTime = Date.now();
    this.startMemory = process.memoryUsage();
  }

  /**
   * Get current memory usage in a readable format
   */
  getMemoryUsage() {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // Resident Set Size in MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // Heap used in MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // Total heap in MB
      external: Math.round(usage.external / 1024 / 1024), // External memory in MB
      arrayBuffers: Math.round(usage.arrayBuffers / 1024 / 1024), // ArrayBuffers in MB
    };
  }

  /**
   * Check for potential memory leaks
   */
  checkMemoryLeak() {
    const current = this.getMemoryUsage();
    const runtime = Math.round((Date.now() - this.startTime) / 1000 / 60); // Runtime in minutes

    // Log current memory usage
    logger.info("Memory Usage", {
      memory: current,
      runtimeMinutes: runtime,
      pid: process.pid,
    });

    // Check for memory alerts
    if (current.heapUsed > this.alertThreshold) {
      logger.warn("High Memory Usage Detected", {
        heapUsedMB: current.heapUsed,
        thresholdMB: this.alertThreshold,
        runtimeMinutes: runtime,
      });
    }

    // Check for potential memory growth
    const startHeap = Math.round(this.startMemory.heapUsed / 1024 / 1024);
    const growthMB = current.heapUsed - startHeap;

    if (growthMB > this.thresholdMB) {
      logger.warn("Potential Memory Leak Detected", {
        startHeapMB: startHeap,
        currentHeapMB: current.heapUsed,
        growthMB: growthMB,
        runtimeMinutes: runtime,
      });
    }
  }

  /**
   * Start memory monitoring
   */
  start() {
    if (this.intervalId) {
      logger.warn("Memory monitor already running");
      return;
    }

    logger.info("Starting memory monitor", {
      thresholdMB: this.thresholdMB,
      alertThresholdMB: this.alertThreshold,
      logIntervalMs: this.logInterval,
    });

    this.intervalId = setInterval(() => {
      this.checkMemoryLeak();
    }, this.logInterval);

    // Initial memory log
    this.checkMemoryLeak();
  }

  /**
   * Stop memory monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info("Memory monitor stopped");
    }
  }

  /**
   * Express middleware function
   */
  middleware() {
    return (req, res, next) => {
      // Add memory info to response headers in development
      if (process.env.NODE_ENV === "development") {
        const usage = this.getMemoryUsage();
        res.set("X-Memory-Heap-Used", `${usage.heapUsed}MB`);
        res.set("X-Memory-RSS", `${usage.rss}MB`);
      }
      next();
    };
  }

  /**
   * Force garbage collection if available
   */
  forceGC() {
    if (global.gc) {
      logger.info("Forcing garbage collection");
      global.gc();
      return this.getMemoryUsage();
    } else {
      logger.warn("Garbage collection not available (start with --expose-gc)");
      return null;
    }
  }
}

module.exports = MemoryMonitor;
