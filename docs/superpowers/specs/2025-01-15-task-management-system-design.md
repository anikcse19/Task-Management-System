# Task Management System - Design Specification

**Date:** 2025-01-15
**Project:** Tech Analytica Job Assessment
**Author:** Anik Deb

---

## Overview

A task management system with role-based access control (RBAC) and comprehensive audit logging. The system allows administrators to manage tasks and assign them to users, while users can view and update the status of their assigned tasks. All significant actions are logged for audit purposes.

**Key Requirements:**
- Two user roles: Admin (full access) and User (limited access)
- Task lifecycle: PENDING → PROCESSING → DONE
- Complete audit trail of all actions
- JWT-based authentication with httpOnly cookies

---

## Architecture

### Project Structure (Modular Monolith)

```
tech-analytica/
├── apps/
│   ├── backend/          # NestJS API
│   └── frontend/         # Next.js App Router
├── packages/
│   └── shared-types/     # Shared TypeScript definitions
├── docker-compose.yml
├── package.json          # Workspace root
└── README.md
```

**Rationale:** Modular monolith provides clean separation of concerns while maintaining simplicity. Shared types ensure API contract consistency between frontend and backend.

### Technology Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Frontend | Next.js 15 (App Router) | Modern React framework with server components |
| UI | shadcn/ui + Tailwind CSS | Professional components, excellent DX |
| Backend | NestJS | Structured Node.js framework, dependency injection |
| ORM | Prisma | Type-safe, excellent TypeScript integration |
| Database | PostgreSQL | Robust relational database |
| Auth | JWT + httpOnly cookies | Industry standard, secure by default |
| Containerization | Docker Compose | Easy setup for demo/evaluation |

---

## Database Schema

### Entity Relationship Diagram

```
User (1) ───┬───< (N) Task (as createdBy)
            │
            └───< (N) Task (as assignedTo)

User (1) ────< (N) AuditLog

Task (1) ────< (N) AuditLog
```

### Tables

#### User
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | Primary Key |
| email | String | Unique |
| passwordHash | String | bcrypt |
| name | String | - |
| role | Enum | ADMIN, USER |
| createdAt | DateTime | - |
| updatedAt | DateTime | - |

#### Task
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | Primary Key |
| title | String | - |
| description | String | - |
| status | Enum | PENDING, PROCESSING, DONE |
| assignedToId | UUID | Foreign Key → User (nullable) |
| createdById | UUID | Foreign Key → User |
| createdAt | DateTime | - |
| updatedAt | DateTime | - |

#### AuditLog
| Field | Type | Constraints |
|-------|------|-------------|
| id | UUID | Primary Key |
| actorId | UUID | Foreign Key → User |
| actorName | String | Denormalized for query performance |
| actorRole | Enum | ADMIN, USER |
| action | Enum | TASK_CREATED, TASK_UPDATED, TASK_DELETED, TASK_STATUS_CHANGED, TASK_ASSIGNED |
| entityType | String | "Task" |
| entityId | UUID | Target entity ID |
| previousValues | JSON | Nullable, for state changes |
| newValues | JSON | New state or created entity |
| timestamp | DateTime | - |

**Indexes:** `assignedToId`, `createdById`, `actorId`, `entityId`, `timestamp`

---

## API Design

### Base URL
```
/api/v1
```

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Authenticate user |
| POST | `/auth/logout` | Clear session |
| GET | `/auth/me` | Get current user profile |

### Admin Endpoints (Role: ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks` | Create new task |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Get task details |
| PATCH | `/tasks/:id` | Update task |
| DELETE | `/tasks/:id` | Delete task |
| POST | `/tasks/:id/assign` | Assign task to user |
| GET | `/users` | List all users |
| GET | `/audit-logs` | Get audit logs (paginated) |

### User Endpoints (Role: USER or ADMIN)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/my` | Get my assigned tasks |
| PATCH | `/tasks/:id/status` | Update task status |

### Response Format

**Success:**
```json
{
  "data": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

---

## Authentication & Authorization

### JWT Strategy

**Access Token:**
- Lifetime: 15 minutes
- Stored in: Memory (Authorization header)
- Contains: `sub`, `email`, `role`

**Refresh Token:**
- Lifetime: 7 days
- Stored in: httpOnly cookie
- HttpOnly, Secure, SameSite=strict

### Login Flow

1. User submits email + password
2. Backend verifies against bcrypt hash
3. Generate access + refresh tokens
4. Set refresh token in httpOnly cookie
5. Return access token + user data

### Protected Route Flow

1. Request includes Authorization header
2. JwtGuard validates token signature
3. Attaches user to request object
4. RoleGuard checks required permissions
5. Controller executes or returns 403

---

## Frontend Architecture

### Route Structure

```
/                    # Landing (redirects to login or dashboard)
/login               # Public login page
/dashboard           # Protected base (redirects based on role)

/admin/tasks         # Admin: Task list & create
/admin/tasks/[id]    # Admin: Task detail & edit
/admin/audit         # Admin: Audit log viewer

/user/tasks          # User: My assigned tasks
```

### Key Components

#### Authentication
- `LoginForm.tsx` - Login form with validation
- `AuthGuard.tsx` - Client-side route protection
- `useAuth.ts` - Auth state hook

#### Admin
- `TaskForm.tsx` - Create/edit task dialog
- `TaskTable.tsx` - List with actions
- `AuditLogTable.tsx` - Paginated audit viewer
- `AssignTaskDialog.tsx` - User assignment

#### User
- `MyTasksTable.tsx` - Personal task list with status update

#### Shared
- `Navbar.tsx` - Navigation with logout
- `StatusBadge.tsx` - Status indicator component
- `ErrorMessage.tsx` - API error display

### State Management

- Server Components for data fetching
- React hooks (`useState`, `useEffect`) for local state
- No external state library (keep it simple)

---

## Audit Logging Implementation

### Trigger Points

Audit logs are created for:
1. **Task Creation** - After successful insert
2. **Task Update** - Before/after comparison
3. **Task Deletion** - Store deleted entity data
4. **Status Change** - Detected within update
5. **Assignment Change** - Detected within update

### Implementation Pattern

```typescript
// Using NestJS Interceptor pattern
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(async (response) => {
        // Extract user from request
        // Determine action type
        // Create audit log entry
      })
    );
  }
}
```

### Data Capture Strategy

| Action | Previous Values | New Values |
|--------|----------------|------------|
| TASK_CREATED | null | Full task entity |
| TASK_UPDATED | Changed fields only | New values |
| TASK_DELETED | Full entity | null |
| TASK_STATUS_CHANGED | oldStatus | newStatus |
| TASK_ASSIGNED | oldAssignedToId | newAssignedToId |

---

## Security Considerations

| Threat | Mitigation |
|--------|------------|
| XSS | httpOnly cookies, React escaping |
| CSRF | SameSite=strict on cookies |
| SQL Injection | Prisma parameterized queries |
| Password exposure | bcrypt hashing, never in logs |
| Unauthorized access | Role guards on all protected routes |
| Token leakage | Short-lived access tokens |

---

## Error Handling Strategy

### Client Errors (4xx)
- 400: Validation error (return field-level errors)
- 401: Not authenticated (redirect to login)
- 403: Forbidden (show "insufficient permissions")
- 404: Resource not found

### Server Errors (5xx)
- 500: Internal server error (log, show generic message)
- 503: Service unavailable (database connection issue)

---

## Deployment Strategy

### Docker Compose Setup

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: tech_analytica
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret

  backend:
    build: ./apps/backend
    ports: ["3001:3001"]
    depends_on: [postgres]
    environment:
      DATABASE_URL: postgres://...

  frontend:
    build: ./apps/frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
```

### Demo Credentials

```
Admin User:
  Email: admin@techanalytica.com
  Password: Admin@123

Normal User:
  Email: user@techanalytica.com
  Password: User@123
```

---

## Testing Strategy

| Type | Coverage |
|------|----------|
| Unit | Services, utilities, validators |
| Integration | API endpoints, database operations |
| E2E | Critical user flows (login, create task, update status) |

---

## Success Criteria

- [ ] Admin can create, view, update, delete tasks
- [ ] Admin can assign tasks to users
- [ ] User can only view assigned tasks
- [ ] User can only update task status
- [ ] All actions logged in audit table
- [ ] Admin can view audit logs with pagination
- [ ] JWT authentication working correctly
- [ ] Role-based access control enforced
- [ ] Docker compose runs entire system
- [ ] No security vulnerabilities in implementation

---

## Next Steps

1. Set up monorepo structure with pnpm workspaces
2. Configure Prisma schema and run migrations
3. Implement NestJS backend (auth, tasks, audit modules)
4. Implement Next.js frontend with shadcn/ui
5. Docker containerization
6. Testing and documentation
