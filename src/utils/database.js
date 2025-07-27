const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

/**
 * Database connection manager with connection pooling and memory safety
 */
class DatabaseManager {
  constructor() {
    this.prisma = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000; // 5 seconds
  }

  /**
   * Initialize Prisma client with connection pooling
   */
  async connect() {
    if (this.prisma && this.isConnected) {
      return this.prisma;
    }

    try {
      this.prisma = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        log: [
          { level: "query", emit: "event" },
          { level: "error", emit: "event" },
          { level: "warn", emit: "event" },
        ],
      });

      // Log database queries in development
      if (process.env.NODE_ENV === "development") {
        this.prisma.$on("query", (e) => {
          logger.debug("Database Query", {
            query: e.query,
            duration: `${e.duration}ms`,
            params: e.params,
          });
        });
      }

      // Log database errors
      this.prisma.$on("error", (e) => {
        logger.error("Database Error", {
          target: e.target,
          message: e.message,
        });
      });

      // Test connection
      await this.prisma.$connect();
      this.isConnected = true;
      this.connectionAttempts = 0;

      logger.info("Database connected successfully", {
        database: "postgresql",
        connectionPool: true,
      });

      return this.prisma;
    } catch (error) {
      this.connectionAttempts++;
      logger.error("Database connection failed", {
        attempt: this.connectionAttempts,
        maxRetries: this.maxRetries,
        error: error.message,
      });

      if (this.connectionAttempts < this.maxRetries) {
        logger.info(
          `Retrying database connection in ${this.retryDelay / 1000} seconds...`
        );
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        return this.connect();
      } else {
        throw new Error(
          `Failed to connect to database after ${this.maxRetries} attempts`
        );
      }
    }
  }

  /**
   * Get Prisma client instance
   */
  getClient() {
    if (!this.prisma || !this.isConnected) {
      throw new Error("Database not connected. Call connect() first.");
    }
    return this.prisma;
  }

  /**
   * Check database connection health
   */
  async healthCheck() {
    try {
      if (!this.prisma) {
        return { status: "disconnected", message: "No database connection" };
      }

      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: "healthy",
        message: "Database connection is active",
        connected: this.isConnected,
      };
    } catch (error) {
      logger.error("Database health check failed", { error: error.message });
      return {
        status: "unhealthy",
        message: error.message,
        connected: false,
      };
    }
  }

  /**
   * Gracefully disconnect from database
   */
  async disconnect() {
    if (this.prisma) {
      try {
        await this.prisma.$disconnect();
        this.isConnected = false;
        logger.info("Database disconnected successfully");
      } catch (error) {
        logger.error("Error disconnecting from database", {
          error: error.message,
        });
      } finally {
        this.prisma = null;
      }
    }
  }

  /**
   * Get database connection statistics
   */
  getConnectionStats() {
    return {
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      hasClient: !!this.prisma,
    };
  }
}

// Singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
