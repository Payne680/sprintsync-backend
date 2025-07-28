const { verifyToken } = require("../utils/jwt");
const { PrismaClient } = require("@prisma/client");
const logger = require("../utils/logger");

const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Access denied. No token provided or invalid format.",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      const decoded = verifyToken(token);

      // Fetch user from database to ensure they still exist
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true, isAdmin: true },
      });

      if (!user) {
        return res.status(401).json({
          error: "Access denied. User not found.",
        });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      logger.error("JWT verification failed:", jwtError);
      return res.status(401).json({
        error: "Access denied. Invalid token.",
      });
    }
  } catch (error) {
    logger.error("Auth middleware error:", error);
    return res.status(500).json({
      error: "Internal server error during authentication.",
    });
  }
};

module.exports = authMiddleware;
