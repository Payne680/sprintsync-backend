const request = require("supertest");
const app = require("../app");
const databaseManager = require("../utils/database");

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    // Connect to database before running tests
    await databaseManager.connect();
  });

  beforeEach(async () => {
    // Clean up test data
    const prisma = databaseManager.getClient();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await databaseManager.disconnect();
  });

  describe("POST /auth/signup", () => {
    it("should create a new user successfully", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User created successfully.",
      );
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).toHaveProperty("email", userData.email);
      expect(response.body.user).toHaveProperty("name", userData.name);
      expect(response.body.user).not.toHaveProperty("passwordHash");
    });

    it("should return error for missing required fields", async () => {
      const response = await request(app)
        .post("/auth/signup")
        .send({
          name: "Test User",
          // Missing email and password
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return error for duplicate email", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      };

      // Create first user
      await request(app).post("/auth/signup").send(userData).expect(201);

      // Try to create user with same email
      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should return error for short password", async () => {
      const userData = {
        name: "Test User",
        email: "test@example.com",
        password: "123", // Too short
      };

      const response = await request(app)
        .post("/auth/signup")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app).post("/auth/signup").send({
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should login successfully with valid credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "password123",
        })
        .expect(200);

      expect(response.body).toHaveProperty("message", "Login successful.");
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user).not.toHaveProperty("passwordHash");
    });

    it("should return error for invalid email", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "wrong@example.com",
          password: "password123",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return error for invalid password", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401);

      expect(response.body).toHaveProperty("error");
    });

    it("should return error for missing credentials", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "test@example.com",
          // Missing password
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});
