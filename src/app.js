const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const path = require("path");
const fs = require("fs");

const config = require("./config");
const logger = require("./utils/logger");
const requestLogger = require("./middleware/logger");
const errorHandler = require("./middleware/errorHandler");
const MemoryMonitor = require("./middleware/memoryMonitor");
const databaseManager = require("./utils/database");

// Import routes
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const aiRoutes = require("./routes/ai");

// Initialize memory monitor
const memoryMonitor = new MemoryMonitor({
  thresholdMB: 50, // Alert if memory grows by 50MB
  alertThreshold: 150, // Alert if heap usage exceeds 150MB
  logInterval: 30000, // Log every 30 seconds
});

const app = express();

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, "..", "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Memory monitoring middleware
app.use(memoryMonitor.middleware());

// Request logging
app.use(requestLogger);

// Initialize database connection
async function initializeDatabase() {
  try {
    await databaseManager.connect();
    logger.info("Database connection established");
  } catch (error) {
    logger.error("Database connection failed", { error: error.message });
    process.exit(1);
  }
}

// Health check endpoint with memory and database status
app.get("/health", async (req, res) => {
  const memoryUsage = memoryMonitor.getMemoryUsage();
  const dbHealth = await databaseManager.healthCheck();

  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    memory: memoryUsage,
    database: dbHealth,
    uptime: process.uptime(),
  });
});

//
// API routes
app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/ai", aiRoutes);

// Swagger documentation
try {
  const swaggerDocument = YAML.load(
    path.join(__dirname, "..", "docs", "swagger.yaml"),
  );
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (error) {
  logger.warn("Could not load Swagger documentation", { error: error.message });
}

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    method: req.method,
    url: req.originalUrl,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database function for server startup
async function startServer() {
  await initializeDatabase();
  memoryMonitor.start();
}

// Only start server if this file is run directly (not imported for testing)
if (require.main === module) {
  const server = app.listen(config.port, async () => {
    logger.info(`SprintSync API server running on port ${config.port}`, {
      port: config.port,
      environment: config.nodeEnv,
      docsUrl: `http://localhost:${config.port}/docs`,
      healthUrl: `http://localhost:${config.port}/health`,
    });

    // Initialize database and memory monitoring
    await startServer();
  });

  // Graceful shutdown
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully");

    // Stop memory monitoring
    memoryMonitor.stop();

    // Disconnect from database
    await databaseManager.disconnect();

    // Close server
    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });

  // Handle SIGINT (Ctrl+C)
  process.on("SIGINT", async () => {
    logger.info("SIGINT received, shutting down gracefully");

    memoryMonitor.stop();
    await databaseManager.disconnect();

    server.close(() => {
      logger.info("Process terminated");
      process.exit(0);
    });
  });
}

module.exports = app;
