import { Injectable } from "@nestjs/common";
import { AuditAction, Prisma, Role } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

interface CreateAuditLogParams {
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  entityType?: string;
  entityId: string;
  entityTitle: string;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Creates a new audit log entry.
   * Called by the tasks service after every significant action.
   */
  async createLog(params: CreateAuditLogParams) {
    return this.prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorName,
        actorRole: params.actorRole,
        action: params.action,
        entityType: params.entityType || "Task",
        entityId: params.entityId,
        entityTitle: params.entityTitle,
        previousValues:
          params.previousValues === null || params.previousValues === undefined
            ? Prisma.JsonNull
            : (params.previousValues as Prisma.InputJsonValue),
        newValues:
          params.newValues === null || params.newValues === undefined
            ? Prisma.JsonNull
            : (params.newValues as Prisma.InputJsonValue),
      },
    });
  }

  /**
   * Retrieves paginated audit logs for the admin dashboard.
   * Sorted by most recent first.
   */
  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { timestamp: "desc" },
        include: {
          actor: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      this.prisma.auditLog.count(),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
