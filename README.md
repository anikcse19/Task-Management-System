# Task Management System

A full-stack task management system with role-based access control (RBAC) and comprehensive audit logging, built for the Tech Analytica assessment.

## 🏗️ Architecture

```
tech-analytica/
├── apps/
│   ├── backend/          # NestJS API (Port 3001)
│   └── frontend/         # Next.js App Router (Port 3000)
├── packages/
│   └── shared-types/     # Shared TypeScript definitions
├── docker-compose.yml    # One command to run everything
└── README.md
```

| Layer     | Technology                                           |
| --------- | ---------------------------------------------------- |
| Frontend  | Next.js 15, Tailwind CSS v4, Lucide Icons            |
| Backend   | NestJS 11, Passport JWT                              |
| ORM       | Prisma 6                                             |
| Database  | PostgreSQL 16                                        |
| Auth      | JWT (access token) + httpOnly cookie (refresh token) |
| Container | Docker Compose                                       |

## 🚀 Quick Start (Docker)

```bash
# Clone the repo
git clone https://github.com/anikcse19/Frontend-Developer-Assignment-Betafore.git
cd Frontend-Developer-Assignment-Betafore

# Start everything
sudo docker compose up --build

# Wait ~30 seconds for build + migrations + seeding
# Then open http://localhost:3000
```

That's it! `docker compose up` will:

1. Start PostgreSQL
2. Build & run the NestJS backend (runs migrations + seeds database)
3. Build & run the Next.js frontend

## 🔑 Demo Credentials

| Role      | Email                   | Password  |
| --------- | ----------------------- | --------- |
| **Admin** | admin@techanalytica.com | Admin@123 |
| **User**  | user@techanalytica.com  | User@123  |

## 📋 Features

### Admin can:

- ✅ Create, update, delete tasks
- ✅ Assign tasks to users
- ✅ Change task status (PENDING → PROCESSING → DONE)
- ✅ View all audit logs (paginated)

### User can:

- ✅ View assigned tasks
- ✅ Update task status

### Audit Logging:

Every important action is logged with:

- ✅ Actor (who did it)
- ✅ Action type (created, updated, deleted, status changed, assigned)
- ✅ Target entity (which task)
- ✅ Before/after data (what changed)
- ✅ Timestamp

## 🗄️ Database Schema

### Users Table

| Field        | Type   | Description            |
| ------------ | ------ | ---------------------- |
| id           | UUID   | Primary key            |
| email        | String | Unique login email     |
| passwordHash | String | bcrypt hashed password |
| name         | String | Display name           |
| role         | Enum   | ADMIN or USER          |

### Tasks Table

| Field        | Type   | Description               |
| ------------ | ------ | ------------------------- |
| id           | UUID   | Primary key               |
| title        | String | Task title                |
| description  | String | Task details              |
| status       | Enum   | PENDING, PROCESSING, DONE |
| assignedToId | UUID?  | FK → users (nullable)     |
| createdById  | UUID   | FK → users                |

### Audit Logs Table

| Field          | Type     | Description                      |
| -------------- | -------- | -------------------------------- |
| id             | UUID     | Primary key                      |
| actorId        | UUID     | FK → users (who acted)           |
| actorName      | String   | Denormalized for performance     |
| action         | Enum     | TASK_CREATED, TASK_UPDATED, etc. |
| entityId       | UUID     | FK → tasks (target)              |
| previousValues | JSON     | State before change              |
| newValues      | JSON     | State after change               |
| timestamp      | DateTime | When it happened                 |

## 🔌 API Endpoints

### Auth

| Method | Endpoint             | Access        |
| ------ | -------------------- | ------------- |
| POST   | /api/v1/auth/login   | Public        |
| POST   | /api/v1/auth/logout  | Public        |
| GET    | /api/v1/auth/me      | Authenticated |
| POST   | /api/v1/auth/refresh | Authenticated |

### Tasks

| Method | Endpoint                 | Access       |
| ------ | ------------------------ | ------------ |
| POST   | /api/v1/tasks            | Admin        |
| GET    | /api/v1/tasks            | Admin        |
| GET    | /api/v1/tasks/my         | Admin + User |
| GET    | /api/v1/tasks/:id        | Admin        |
| PATCH  | /api/v1/tasks/:id        | Admin        |
| DELETE | /api/v1/tasks/:id        | Admin        |
| PATCH  | /api/v1/tasks/:id/status | Admin + User |
| POST   | /api/v1/tasks/:id/assign | Admin        |

### Users

| Method | Endpoint      | Access |
| ------ | ------------- | ------ |
| GET    | /api/v1/users | Admin  |

### Audit Logs

| Method | Endpoint           | Access |
| ------ | ------------------ | ------ |
| GET    | /api/v1/audit-logs | Admin  |

## 🛡️ Security

- Passwords hashed with bcryptjs
- JWT access tokens (15min expiry)
- Refresh tokens in httpOnly cookies (7 day expiry)
- Role-based guards on every protected endpoint
- Input validation with class-validator
- CORS configured for frontend origin only
- Parameterized queries via Prisma (SQL injection safe)

## 🧪 Local Development (without Docker)

```bash
# Prerequisites: Node.js 22+, pnpm, PostgreSQL running locally

# Install dependencies
pnpm install

# Set up backend environment
cp apps/backend/.env.example apps/backend/.env
# Edit DATABASE_URL if needed

# Run migrations and seed
cd apps/backend
npx prisma migrate deploy
npx ts-node prisma/seed.ts

# Start backend (terminal 1)
pnpm dev:backend

# Start frontend (terminal 2)
pnpm dev:frontend
```

## 📁 Key Architecture Decisions

1. **Monorepo with pnpm workspaces** — Clean separation of backend/frontend with shared types
2. **Prisma ORM** — Type-safe database access, excellent migration support
3. **Direct audit logging in service layer** — Audit logs are created explicitly in each task operation (not via interceptor), giving full control over what data is captured
4. **JWT + httpOnly cookies** — Access token in memory (not localStorage), refresh token in secure cookie
5. **NestJS modular architecture** — Each feature (auth, tasks, audit, users) is a separate module with its own controller/service
6. **No external state management** — React hooks + context for simplicity and maintainability
