import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  // Path to the Prisma schema file (relative to this config file)
  schema: "prisma/schema.prisma",

  // Migration & seed configuration
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },

  // Database connection — moved here from datasource block in schema.prisma (Prisma 7)
  datasource: {
    url: env("DATABASE_URL"),
  },
});
