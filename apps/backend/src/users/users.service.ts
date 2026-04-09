import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { AuditAction, Role } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

// Shape of the authenticated user from JWT
interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

// Fields returned for every user query (never expose passwordHash)
const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { assignedTasks: true, createdTasks: true } },
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * Returns all users with task counts.
   */
  async findAll() {
    return this.prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Returns a single user by ID.
   */
  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Creates a new user. Hashes the password with bcrypt.
   */
  async create(dto: CreateUserDto, actor: AuthUser) {
    // Check for duplicate email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException("A user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role || "USER",
      },
      select: userSelect,
    });

    await this.auditService.createLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: AuditAction.USER_CREATED,
      entityType: "User",
      entityId: user.id,
      entityTitle: user.name,
      newValues: { name: user.name, email: user.email, role: user.role },
    });

    return user;
  }

  /**
   * Updates a user's name, email, role, and/or password.
   */
  async update(id: string, dto: UpdateUserDto, actor: AuthUser) {
    const existing = await this.findOne(id);

    // If changing email, check for conflicts
    if (dto.email) {
      const dup = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (dup && dup.id !== id) {
        throw new ConflictException("A user with this email already exists");
      }
    }

    const data: Record<string, unknown> = {};
    if (dto.name) data.name = dto.name;
    if (dto.email) data.email = dto.email;
    if (dto.role) data.role = dto.role;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    // Build before/after for changed fields
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};
    if (dto.name && dto.name !== existing.name) {
      previousValues.name = existing.name;
      newValues.name = dto.name;
    }
    if (dto.email && dto.email !== existing.email) {
      previousValues.email = existing.email;
      newValues.email = dto.email;
    }
    if (dto.role && dto.role !== existing.role) {
      previousValues.role = existing.role;
      newValues.role = dto.role;
    }
    if (dto.password) {
      newValues.password = "(changed)";
    }

    if (Object.keys(newValues).length > 0) {
      await this.auditService.createLog({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: AuditAction.USER_UPDATED,
        entityType: "User",
        entityId: user.id,
        entityTitle: user.name,
        previousValues,
        newValues,
      });
    }

    return user;
  }

  /**
   * Deletes a user. Prevents deleting the last ADMIN.
   */
  async remove(id: string, actor: AuthUser) {
    const user = await this.findOne(id);

    // Safety: don't allow deleting the last admin
    if (user.role === "ADMIN") {
      const adminCount = await this.prisma.user.count({
        where: { role: "ADMIN" },
      });
      if (adminCount <= 1) {
        throw new BadRequestException("Cannot delete the last admin user");
      }
    }

    // Log BEFORE deletion
    await this.auditService.createLog({
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: AuditAction.USER_DELETED,
      entityType: "User",
      entityId: user.id,
      entityTitle: user.name,
      previousValues: { name: user.name, email: user.email, role: user.role },
    });

    await this.prisma.user.delete({ where: { id } });
    return { message: "User deleted successfully" };
  }
}
