const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Generate a JWT token
 * @param {Object} payload - The payload to encode in the token
 * @returns {string} - The generated JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} - The decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};

/**
 * Decode a JWT token without verification (use with caution)
 * @param {string} token - The JWT token to decode
 * @returns {Object} - The decoded token payload
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
};
