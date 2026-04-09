import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { AuditAction, Role } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-status.dto";
import { AssignTaskDto } from "./dto/assign-task.dto";

// Shape of the user object from JWT (attached to req.user)
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// Standard includes for task queries (eager-load relations)
const taskIncludes = {
  assignedTo: {
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  },
  createdBy: {
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  },
};

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * CREATE: Admin creates a new task, optionally assigning it.
   */
  async create(dto: CreateTaskDto, user: AuthUser) {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        createdById: user.id,
        assignedToId: dto.assignedToId || null,
      },
      include: taskIncludes,
    });

    // Audit: log task creation
    await this.auditService.createLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AuditAction.TASK_CREATED,
      entityId: task.id,
      entityTitle: task.title,
      previousValues: null,
      newValues: {
        title: task.title,
        description: task.description,
        status: task.status,
        assignedToId: task.assignedToId,
      },
    });

    // If assigned during creation, log that too
    if (dto.assignedToId) {
      await this.auditService.createLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: AuditAction.TASK_ASSIGNED,
        entityId: task.id,
        entityTitle: task.title,
        previousValues: { assignedToId: null },
        newValues: { assignedToId: dto.assignedToId },
      });
    }

    return task;
  }

  /**
   * READ ALL: Admin sees all tasks.
   */
  async findAll() {
    return this.prisma.task.findMany({
      include: taskIncludes,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * READ ONE: Get a single task by ID.
   */
  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: taskIncludes,
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  /**
   * READ MY TASKS: User sees only tasks assigned to them.
   */
  async findMyTasks(userId: string) {
    return this.prisma.task.findMany({
      where: { assignedToId: userId },
      include: taskIncludes,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * UPDATE: Admin updates task title/description.
   * Detects and logs what actually changed.
   */
  async update(id: string, dto: UpdateTaskDto, user: AuthUser) {
    const existing = await this.findOne(id);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
      },
      include: taskIncludes,
    });

    // Build before/after for changed fields only
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (dto.title && dto.title !== existing.title) {
      previousValues.title = existing.title;
      newValues.title = dto.title;
    }
    if (dto.description && dto.description !== existing.description) {
      previousValues.description = existing.description;
      newValues.description = dto.description;
    }

    // Only log if something actually changed
    if (Object.keys(newValues).length > 0) {
      await this.auditService.createLog({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: AuditAction.TASK_UPDATED,
        entityId: task.id,
        entityTitle: existing.title,
        previousValues,
        newValues,
      });
    }

    return task;
  }

  /**
   * DELETE: Admin deletes a task. Stores the full entity in audit log.
   */
  async remove(id: string, user: AuthUser) {
    const existing = await this.findOne(id);

    // Log BEFORE deletion (because the task won't exist after)
    await this.auditService.createLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AuditAction.TASK_DELETED,
      entityId: existing.id,
      entityTitle: existing.title,
      previousValues: {
        title: existing.title,
        description: existing.description,
        status: existing.status,
        assignedToId: existing.assignedToId,
      },
      newValues: null,
    });

    await this.prisma.task.delete({ where: { id } });
    return { message: "Task deleted successfully" };
  }

  /**
   * UPDATE STATUS: Both admin and user can change task status.
   * Users can only update tasks assigned to them.
   */
  async updateStatus(id: string, dto: UpdateTaskStatusDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Users can only update their own tasks
    if (user.role === Role.USER && existing.assignedToId !== user.id) {
      throw new ForbiddenException("You can only update your own tasks");
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
      include: taskIncludes,
    });

    await this.auditService.createLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AuditAction.TASK_STATUS_CHANGED,
      entityId: task.id,
      entityTitle: existing.title,
      previousValues: { status: existing.status },
      newValues: { status: dto.status },
    });

    return task;
  }

  /**
   * ASSIGN: Admin assigns a task to a user.
   */
  async assign(id: string, dto: AssignTaskDto, user: AuthUser) {
    const existing = await this.findOne(id);

    // Verify the target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: dto.assignedToId },
    });

    if (!targetUser) {
      throw new NotFoundException("Target user not found");
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: { assignedToId: dto.assignedToId },
      include: taskIncludes,
    });

    await this.auditService.createLog({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: AuditAction.TASK_ASSIGNED,
      entityId: task.id,
      entityTitle: existing.title,
      previousValues: { assignedToId: existing.assignedToId },
      newValues: { assignedToId: dto.assignedToId },
    });

    return task;
  }
}
