# Task Management System

A full-stack task management system with role-based access control and audit logging.

## Tech Stack

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | Next.js 15, Tailwind CSS v4                |
| Backend  | NestJS 11, Passport JWT                    |
| ORM      | Prisma 6                                   |
| Database | PostgreSQL 16                              |
| Auth     | JWT access token + httpOnly refresh cookie |

## Quick Start

```bash
git clone https://github.com/anikcse19/Task-Management-System.git
cd Task-Management-System

docker compose up --build
```

Open **http://localhost:3000** after ~30 seconds. The backend automatically runs migrations and seeds the database.

## Demo Credentials

| Role  | Email                   | Password  |
| ----- | ----------------------- | --------- |
| Admin | admin@techanalytica.com | Admin@123 |
| User  | user@techanalytica.com  | User@123  |

## Features

**Admin:**

- Create, update, delete tasks
- Assign tasks to users
- Change task status (PENDING → PROCESSING → DONE)
- View audit logs (paginated)

**User:**

- View assigned tasks
- Update task status

**Audit Logging:**
Every important action (create, update, delete, status change, assignment) is logged with the actor, action type, target entity, before/after data, and timestamp.

## Project Structure

```
├── apps/
│   ├── backend/        # NestJS API (port 3001)
│   └── frontend/       # Next.js frontend (port 3000)
├── docker-compose.yml
└── README.md
```

## Database Schema

Three tables — **users**, **tasks**, **audit_logs**.

**users:** id, email, passwordHash, name, role (ADMIN/USER), timestamps

**tasks:** id, title, description, status (PENDING/PROCESSING/DONE), assignedToId, createdById, timestamps

**audit_logs:** id, actorId, actorName, actorRole, action, entityType, entityId, entityTitle, previousValues (JSON), newValues (JSON), timestamp

## API Endpoints

| Method | Endpoint                 | Access        |
| ------ | ------------------------ | ------------- |
| POST   | /api/v1/auth/login       | Public        |
| POST   | /api/v1/auth/logout      | Public        |
| GET    | /api/v1/auth/me          | Authenticated |
| POST   | /api/v1/auth/refresh     | Authenticated |
| POST   | /api/v1/tasks            | Admin         |
| GET    | /api/v1/tasks            | Admin         |
| GET    | /api/v1/tasks/my         | Authenticated |
| GET    | /api/v1/tasks/:id        | Admin         |
| PATCH  | /api/v1/tasks/:id        | Admin         |
| DELETE | /api/v1/tasks/:id        | Admin         |
| PATCH  | /api/v1/tasks/:id/status | Authenticated |
| POST   | /api/v1/tasks/:id/assign | Admin         |
| GET    | /api/v1/users            | Admin         |
| GET    | /api/v1/audit-logs       | Admin         |

## Local Development (without Docker)

```bash
# Prerequisites: Node.js 22+, pnpm, PostgreSQL

pnpm install

# Set up backend .env
cp apps/backend/.env.example apps/backend/.env

# Migrations + seed
cd apps/backend
npx prisma migrate deploy
npx ts-node prisma/seed.ts

# Run (two terminals)
pnpm dev:backend
pnpm dev:frontend
```
