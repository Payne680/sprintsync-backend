const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create demo users
  const hashedPassword = await bcrypt.hash("demo123", 12);

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@sprintsync.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@sprintsync.com",
      passwordHash: hashedPassword,
      isAdmin: false,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@sprintsync.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@sprintsync.com",
      passwordHash: hashedPassword,
      isAdmin: true,
    },
  });

  // Create demo tasks
  const demoTasks = [
    {
      title: "Setup development environment",
      description:
        "Install Node.js, PostgreSQL, and configure the development environment for the SprintSync project.",
      status: "DONE",
      totalMinutes: 120,
      userId: demoUser.id,
    },
    {
      title: "Implement user authentication",
      description:
        "Create JWT-based authentication system with signup and login endpoints.",
      status: "DONE",
      totalMinutes: 180,
      userId: demoUser.id,
    },
    {
      title: "Build task management API",
      description:
        "Create CRUD endpoints for task management with proper authentication and user scoping.",
      status: "IN_PROGRESS",
      totalMinutes: 240,
      userId: demoUser.id,
    },
    {
      title: "Integrate AI suggestions",
      description:
        "Add AI-powered task description suggestions using OpenAI API.",
      status: "TODO",
      totalMinutes: 0,
      userId: demoUser.id,
    },
    {
      title: "Write comprehensive tests",
      description:
        "Create unit and integration tests for all API endpoints with Jest and Supertest.",
      status: "TODO",
      totalMinutes: 0,
      userId: demoUser.id,
    },
    {
      title: "Setup Docker deployment",
      description:
        "Configure Docker containers for the application and database with proper orchestration.",
      status: "IN_PROGRESS",
      totalMinutes: 90,
      userId: demoUser.id,
    },
    {
      title: "Admin dashboard development",
      description:
        "Build administrative interface for user and system management.",
      status: "TODO",
      totalMinutes: 0,
      userId: adminUser.id,
    },
  ];

  for (const taskData of demoTasks) {
    await prisma.task.upsert({
      where: {
        id: -1, // This will never match, so it will always create
      },
      update: {},
      create: taskData,
    });
  }

  console.log("✅ Database seeding completed successfully!");
  console.log(`👤 Created users: ${demoUser.email}, ${adminUser.email}`);
  console.log(`📋 Created ${demoTasks.length} demo tasks`);
  console.log("🔑 Default password for demo accounts: demo123");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
