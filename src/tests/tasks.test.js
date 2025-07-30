const request = require("supertest");
const app = require("../app");
const databaseManager = require("../utils/database");

describe("Task Endpoints", () => {
  let authToken;
  let testUserId;

  beforeAll(async () => {
    // Connect to database before running tests
    await databaseManager.connect();
  });

  beforeEach(async () => {
    // Clean up test data
    const prisma = databaseManager.getClient();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user and get auth token
    const userData = {
      name: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    const authResponse = await request(app)
      .post("/api/auth/signup")
      .send(userData);

    authToken = authResponse.body.token;
    testUserId = authResponse.body.user.id;
  });

  afterAll(async () => {
    await databaseManager.disconnect();
  });

  describe("POST /api/tasks", () => {
    it("should create a new task successfully", async () => {
      const taskData = {
        title: "Test Task",
        description: "Test task description",
        totalMinutes: 60,
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "Task created successfully."
      );
      expect(response.body).toHaveProperty("task");
      expect(response.body.task).toHaveProperty("title", taskData.title);
      expect(response.body.task).toHaveProperty(
        "description",
        taskData.description
      );
      expect(response.body.task).toHaveProperty(
        "totalMinutes",
        taskData.totalMinutes
      );
      expect(response.body.task).toHaveProperty("userId", testUserId);
      expect(response.body.task).toHaveProperty("status", "TODO");
    });

    it("should create a task with default totalMinutes when not provided", async () => {
      const taskData = {
        title: "Test Task",
        description: "Test task description",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      expect(response.body.task).toHaveProperty("totalMinutes", 0);
    });

    it("should return error for missing title", async () => {
      const taskData = {
        description: "Test task description",
      };

      const response = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send(taskData)
        .expect(400);

      expect(response.body).toHaveProperty("error", "Title is required.");
    });

    it("should return error for unauthenticated request", async () => {
      const taskData = {
        title: "Test Task",
      };

      const response = await request(app)
        .post("/api/tasks")
        .send(taskData)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /tasks", () => {
    beforeEach(async () => {
      // Create test tasks
      await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Task 1", description: "First task" });

      await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Task 2", description: "Second task" });
    });

    it("should get all tasks for authenticated user", async () => {
      const response = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("tasks");
      expect(response.body).toHaveProperty("count", 2);
      expect(response.body.tasks).toHaveLength(2);
      expect(response.body.tasks[0]).toHaveProperty("title");
      expect(response.body.tasks[0]).toHaveProperty("userId", testUserId);
    });

    it("should filter tasks by status", async () => {
      // Update one task to IN_PROGRESS
      const tasksResponse = await request(app)
        .get("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`);

      const taskId = tasksResponse.body.tasks[0].id;

      await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "IN_PROGRESS" });

      // Filter by TODO status
      const response = await request(app)
        .get("/api/tasks?status=TODO")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.tasks[0].status).toBe("TODO");
    });

    it("should return error for unauthenticated request", async () => {
      const response = await request(app).get("/api/tasks").expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/tasks/:id", () => {
    let taskId;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Test Task", description: "Test description" });

      taskId = taskResponse.body.task.id;
    });

    it("should get a specific task", async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("task");
      expect(response.body.task).toHaveProperty("id", taskId);
      expect(response.body.task).toHaveProperty("title", "Test Task");
    });

    it("should return 404 for non-existent task", async () => {
      const response = await request(app)
        .get("/api/tasks/999999")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error", "Task not found.");
    });

    it("should return error for unauthenticated request", async () => {
      const response = await request(app)
        .get(`/api/tasks/${taskId}`)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("PUT /api/tasks/:id", () => {
    let taskId;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Original Task",
          description: "Original description",
          totalMinutes: 30,
        });

      taskId = taskResponse.body.task.id;
    });

    it("should update a task successfully", async () => {
      const updateData = {
        title: "Updated Task",
        description: "Updated description",
        totalMinutes: 45,
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Task updated successfully."
      );
      expect(response.body.task).toHaveProperty("title", updateData.title);
      expect(response.body.task).toHaveProperty(
        "description",
        updateData.description
      );
      expect(response.body.task).toHaveProperty(
        "totalMinutes",
        updateData.totalMinutes
      );
    });

    it("should update partial fields", async () => {
      const updateData = {
        title: "Partially Updated Task",
      };

      const response = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.task).toHaveProperty("title", updateData.title);
      expect(response.body.task).toHaveProperty(
        "description",
        "Original description"
      );
    });

    it("should return 404 for non-existent task", async () => {
      const response = await request(app)
        .put("/api/tasks/999999")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Updated" })
        .expect(404);

      expect(response.body).toHaveProperty("error", "Task not found.");
    });
  });

  describe("PATCH /api/tasks/:id/status", () => {
    let taskId;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Test Task", description: "Test description" });

      taskId = taskResponse.body.task.id;
    });

    it("should update task status successfully", async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "IN_PROGRESS" })
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Task status updated successfully."
      );
      expect(response.body.task).toHaveProperty("status", "IN_PROGRESS");
    });

    it("should return error for invalid status", async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "INVALID_STATUS" })
        .expect(400);

      expect(response.body).toHaveProperty(
        "error",
        "Valid status is required. Options: TODO, IN_PROGRESS, DONE"
      );
    });

    it("should return error for missing status", async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("DELETE /api/tasks/:id", () => {
    let taskId;

    beforeEach(async () => {
      const taskResponse = await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ title: "Test Task", description: "Test description" });

      taskId = taskResponse.body.task.id;
    });

    it("should delete a task successfully", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        "message",
        "Task deleted successfully."
      );

      // Verify task is deleted
      await request(app)
        .get(`/api/tasks/${taskId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);
    });

    it("should return 404 for non-existent task", async () => {
      const response = await request(app)
        .delete("/api/tasks/999999")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty("error", "Task not found.");
    });

    it("should return error for unauthenticated request", async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });
  });
});
