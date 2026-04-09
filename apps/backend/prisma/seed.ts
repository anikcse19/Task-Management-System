import "dotenv/config";
import { PrismaClient, Role } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // Hash passwords with bcrypt (10 salt rounds)
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);
  const userPasswordHash = await bcrypt.hash("User@123", 10);

  // Create Admin user (upsert = create if not exists, update if exists)
  const admin = await prisma.user.upsert({
    where: { email: "admin@techanalytica.com" },
    update: {},
    create: {
      email: "admin@techanalytica.com",
      passwordHash: adminPasswordHash,
      name: "Admin User",
      role: Role.ADMIN,
    },
  });

  // Create Normal user
  const user = await prisma.user.upsert({
    where: { email: "user@techanalytica.com" },
    update: {},
    create: {
      email: "user@techanalytica.com",
      passwordHash: userPasswordHash,
      name: "Normal User",
      role: Role.USER,
    },
  });

  console.log("✅ Seeded users:");
  console.log(`   Admin: ${admin.email} (${admin.role})`);
  console.log(`   User:  ${user.email} (${user.role})`);

  // Create some sample tasks for demo
  const task1 = await prisma.task.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      title: "Design database schema",
      description:
        "Create the PostgreSQL schema with User, Task, and AuditLog tables",
      status: "DONE",
      createdById: admin.id,
      assignedToId: user.id,
    },
  });

  const task2 = await prisma.task.upsert({
    where: { id: "00000000-0000-0000-0000-000000000002" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000002",
      title: "Implement authentication",
      description: "Set up JWT-based authentication with refresh tokens",
      status: "PROCESSING",
      createdById: admin.id,
      assignedToId: user.id,
    },
  });

  const task3 = await prisma.task.upsert({
    where: { id: "00000000-0000-0000-0000-000000000003" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000003",
      title: "Write API documentation",
      description: "Document all REST endpoints with request/response examples",
      status: "PENDING",
      createdById: admin.id,
      assignedToId: null,
    },
  });

  console.log(`✅ Seeded ${3} sample tasks`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
