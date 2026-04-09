import { Role, TaskStatus, AuditAction } from "./enums";

// ─── Auth DTOs ──────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: UserDto;
}

// ─── User DTOs ──────────────────────────────────────────
export interface UserDto {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
}

// ─── Task DTOs ──────────────────────────────────────────
export interface TaskDto {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assignedTo: UserDto | null;
  createdBy: UserDto;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  assignedToId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
}

export interface UpdateTaskStatusDto {
  status: TaskStatus;
}

export interface AssignTaskDto {
  assignedToId: string;
}

// ─── Audit Log DTOs ────────────────────────────────────
export interface AuditLogDto {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  entityType: string;
  entityId: string;
  previousValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  timestamp: string;
}
