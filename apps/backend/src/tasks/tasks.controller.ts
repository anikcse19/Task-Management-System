import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { Role } from "../generated/prisma/client";
import { TasksService } from "./tasks.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-status.dto";
import { AssignTaskDto } from "./dto/assign-task.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@Controller("tasks")
@UseGuards(JwtAuthGuard, RolesGuard) // All routes require authentication
export class TasksController {
  constructor(private tasksService: TasksService) {}

  // ─── Admin Endpoints ─────────────────────────────────

  /**
   * POST /api/v1/tasks
   * Admin creates a new task.
   */
  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    const task = await this.tasksService.create(dto, user);
    return { data: task, message: "Task created successfully" };
  }

  /**
   * GET /api/v1/tasks
   * Admin gets all tasks.
   */
  @Get()
  @Roles(Role.ADMIN)
  async findAll() {
    const tasks = await this.tasksService.findAll();
    return { data: tasks };
  }

  /**
   * GET /api/v1/tasks/my
   * Both admin and user can see their assigned tasks.
   * IMPORTANT: This route must be BEFORE :id to avoid conflict.
   */
  @Get("my")
  async findMyTasks(@CurrentUser() user: any) {
    const tasks = await this.tasksService.findMyTasks(user.id);
    return { data: tasks };
  }

  /**
   * GET /api/v1/tasks/:id
   * Admin gets a specific task.
   */
  @Get(":id")
  @Roles(Role.ADMIN)
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    const task = await this.tasksService.findOne(id);
    return { data: task };
  }

  /**
   * PATCH /api/v1/tasks/:id
   * Admin updates task title/description.
   */
  @Patch(":id")
  @Roles(Role.ADMIN)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    const task = await this.tasksService.update(id, dto, user);
    return { data: task, message: "Task updated successfully" };
  }

  /**
   * DELETE /api/v1/tasks/:id
   * Admin deletes a task.
   */
  @Delete(":id")
  @Roles(Role.ADMIN)
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ) {
    const result = await this.tasksService.remove(id, user);
    return { data: null, message: result.message };
  }

  // ─── Shared Endpoints ────────────────────────────────

  /**
   * PATCH /api/v1/tasks/:id/status
   * Both admin and user can update task status.
   * Users can only update tasks assigned to them (enforced in service).
   */
  @Patch(":id/status")
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @CurrentUser() user: any,
  ) {
    const task = await this.tasksService.updateStatus(id, dto, user);
    return { data: task, message: "Task status updated" };
  }

  /**
   * POST /api/v1/tasks/:id/assign
   * Admin assigns a task to a user.
   */
  @Post(":id/assign")
  @Roles(Role.ADMIN)
  async assign(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: any,
  ) {
    const task = await this.tasksService.assign(id, dto, user);
    return { data: task, message: "Task assigned successfully" };
  }
}
