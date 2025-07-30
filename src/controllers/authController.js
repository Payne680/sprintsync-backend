const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");
const logger = require("../utils/logger");
const databaseManager = require("../utils/database");

const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        error: "Name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long.",
      });
    }

    // Get Prisma client from database manager
    const prisma = databaseManager.getClient();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        error: "User with this email already exists.",
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    // Generate JWT token
    const token = generateToken({ userId: user.id });

    logger.info("User signed up successfully", { userId: user.id, email });

    res.status(201).json({
      message: "User created successfully.",
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    // Get Prisma client from database manager
    const prisma = databaseManager.getClient();

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = generateToken({ userId: user.id });

    // Return user info (excluding password)
    // eslint-disable-next-line no-unused-vars
    const { passwordHash, ...userInfo } = user;

    logger.info("User logged in successfully", { userId: user.id, email });

    res.json({
      message: "Login successful.",
      token,
      user: userInfo,
    });
  } catch (error) {
    next(error);
  }
};
// Return authenticated user's info
const me = async (req, res) => {
  // req.user is set by authMiddleware
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ user: req.user });
};

module.exports = {
  signup,
  login,
  me,
};
