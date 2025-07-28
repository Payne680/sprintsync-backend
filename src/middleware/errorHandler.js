const winston = require("winston");
const path = require("path");

// Create logger instance for error handling
const errorLogger = winston.createLogger({
  level: "error",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "sprintsync-api" },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== "production") {
  errorLogger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

// Error handling middleware
const errorHandler = (err, req, res, _next) => {
  // Log the error
  errorLogger.error("Application Error", {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get("User-Agent") || "",
  });

  // Default error response
  const response = {
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message,
  };

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: "Validation Error",
      message: err.message,
      details: err.details || {},
    });
  }

  if (err.name === "UnauthorizedError" || err.status === 401) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid or missing authentication",
    });
  }

  if (err.name === "ForbiddenError" || err.status === 403) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Insufficient permissions",
    });
  }

  if (err.status === 404) {
    return res.status(404).json({
      error: "Not Found",
      message: "Resource not found",
    });
  }

  // Default 500 error
  res.status(err.status || 500).json(response);
};

module.exports = errorHandler;
