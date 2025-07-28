const databaseManager = require("../utils/database");
const logger = require("../utils/logger");

const createTask = async (req, res, next) => {
  try {
    const { title, description, totalMinutes } = req.body;
    const userId = req.user.id;

    // Validation
    if (!title) {
      return res.status(400).json({
        error: "Title is required.",
      });
    }

    const prisma = databaseManager.getClient();
    const task = await prisma.task.create({
      data: {
        title,
        description,
        totalMinutes: totalMinutes || 0,
        userId,
      },
    });

    logger.info("Task created", { taskId: task.id, userId });

    res.status(201).json({
      message: "Task created successfully.",
      task,
    });
  } catch (error) {
    next(error);
  }
};

const getTasks = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const prisma = databaseManager.getClient();
    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.json({
      tasks,
      count: tasks.length,
    });
  } catch (error) {
    next(error);
  }
};

const getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const prisma = databaseManager.getClient();
    const task = await prisma.task.findFirst({
      where: {
        id: Number.parseInt(id),
        userId,
      },
    });

    if (!task) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    res.json({ task });
  } catch (error) {
    next(error);
  }
};

const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, totalMinutes } = req.body;
    const userId = req.user.id;

    const prisma = databaseManager.getClient();

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: Number.parseInt(id),
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (totalMinutes !== undefined) updateData.totalMinutes = totalMinutes;

    const task = await prisma.task.update({
      where: { id: Number.parseInt(id) },
      data: updateData,
    });

    logger.info("Task updated", { taskId: task.id, userId });

    res.json({
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    next(error);
  }
};

const updateTaskStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status
    const validStatuses = ["TODO", "IN_PROGRESS", "DONE"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Valid status is required. Options: TODO, IN_PROGRESS, DONE",
      });
    }

    const prisma = databaseManager.getClient();

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: Number.parseInt(id),
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    const task = await prisma.task.update({
      where: { id: Number.parseInt(id) },
      data: { status },
    });

    logger.info("Task status updated", { taskId: task.id, status, userId });

    res.json({
      message: "Task status updated successfully.",
      task,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const prisma = databaseManager.getClient();

    // Check if task exists and belongs to user
    const existingTask = await prisma.task.findFirst({
      where: {
        id: Number.parseInt(id),
        userId,
      },
    });

    if (!existingTask) {
      return res.status(404).json({
        error: "Task not found.",
      });
    }

    await prisma.task.delete({
      where: { id: Number.parseInt(id) },
    });

    logger.info("Task deleted", { taskId: Number.parseInt(id), userId });

    res.json({
      message: "Task deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
};
