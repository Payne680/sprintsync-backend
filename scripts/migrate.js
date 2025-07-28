const { execSync } = require("child_process");
const path = require("path");

console.log("🔄 Running Prisma migrations...");

try {
  // Generate Prisma client
  console.log("📦 Generating Prisma client...");
  execSync("npx prisma generate", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  // Run migrations
  console.log("🚀 Applying database migrations...");
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });

  console.log("✅ Migrations completed successfully!");
} catch (error) {
  console.error("❌ Migration failed:", error.message);
  process.exit(1);
}
