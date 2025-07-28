const express = require("express");
const { suggestTaskDescription } = require("../controllers/aiController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Apply auth middleware to all AI routes
router.use(authMiddleware);

/**
 * @swagger
 * /ai/suggest:
 *   post:
 *     summary: Get AI-generated task description suggestion
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 description: The task title to generate a description for
 *     responses:
 *       200:
 *         description: AI suggestion generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 title:
 *                   type: string
 *                 suggestion:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                     confidence:
 *                       type: number
 *                     source:
 *                       type: string
 *       400:
 *         description: Title is required
 *       401:
 *         description: Unauthorized
 */
router.post("/suggest", suggestTaskDescription);

module.exports = router;
