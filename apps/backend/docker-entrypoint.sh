#!/bin/sh
set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy --config prisma.config.ts

echo "🌱 Seeding database..."
node -e "
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('🌱 Seeding database...');
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const userHash = await bcrypt.hash('User@123', 10);

  // Upsert admin user
  const adminResult = await pool.query(
    \`INSERT INTO users (id, email, \"passwordHash\", name, role, \"createdAt\", \"updatedAt\")
     VALUES (gen_random_uuid(), \\\$1, \\\$2, 'Admin User', 'ADMIN', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id\`,
    ['admin@techanalytica.com', adminHash]
  );
  const adminId = adminResult.rows[0].id;

  // Upsert normal user
  const userResult = await pool.query(
    \`INSERT INTO users (id, email, \"passwordHash\", name, role, \"createdAt\", \"updatedAt\")
     VALUES (gen_random_uuid(), \\\$1, \\\$2, 'Normal User', 'USER', NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id\`,
    ['user@techanalytica.com', userHash]
  );
  const userId = userResult.rows[0].id;

  // Upsert sample tasks
  await pool.query(
    \`INSERT INTO tasks (id, title, description, status, \"createdById\", \"assignedToId\", \"createdAt\", \"updatedAt\")
     VALUES ('00000000-0000-0000-0000-000000000001', 'Design database schema', 'Create the PostgreSQL schema with User, Task, and AuditLog tables', 'DONE', \\\$1, \\\$2, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING\`,
    [adminId, userId]
  );

  await pool.query(
    \`INSERT INTO tasks (id, title, description, status, \"createdById\", \"assignedToId\", \"createdAt\", \"updatedAt\")
     VALUES ('00000000-0000-0000-0000-000000000002', 'Implement authentication', 'Set up JWT-based authentication with refresh tokens', 'PROCESSING', \\\$1, \\\$2, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING\`,
    [adminId, userId]
  );

  await pool.query(
    \`INSERT INTO tasks (id, title, description, status, \"createdById\", \"assignedToId\", \"createdAt\", \"updatedAt\")
     VALUES ('00000000-0000-0000-0000-000000000003', 'Write API documentation', 'Document all REST endpoints with request/response examples', 'PENDING', \\\$1, NULL, NOW(), NOW())
     ON CONFLICT (id) DO NOTHING\`,
    [adminId]
  );

  console.log('✅ Seeded users: admin@techanalytica.com, user@techanalytica.com');
  console.log('✅ Seeded 3 sample tasks');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => pool.end());
"

echo "🚀 Starting backend server..."
exec node dist/main
