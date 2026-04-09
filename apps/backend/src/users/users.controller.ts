import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { Role } from "../generated/prisma/client";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /api/v1/users
   * Admin only. Returns all users.
   */
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return { data: users };
  }

  /**
   * GET /api/v1/users/:id
   * Admin only. Returns a single user.
   */
  @Get(":id")
  async findOne(@Param("id") id: string) {
    const user = await this.usersService.findOne(id);
    return { data: user };
  }

  /**
   * POST /api/v1/users
   * Admin only. Creates a new user.
   */
  @Post()
  async create(@Body() dto: CreateUserDto, @CurrentUser() actor: any) {
    const user = await this.usersService.create(dto, actor);
    return { data: user, message: "User created successfully" };
  }

  /**
   * PATCH /api/v1/users/:id
   * Admin only. Updates user name, email, role, or password.
   */
  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: any,
  ) {
    const user = await this.usersService.update(id, dto, actor);
    return { data: user, message: "User updated successfully" };
  }

  /**
   * DELETE /api/v1/users/:id
   * Admin only. Deletes a user (prevents deleting last admin).
   */
  @Delete(":id")
  async remove(@Param("id") id: string, @CurrentUser() actor: any) {
    const result = await this.usersService.remove(id, actor);
    return { data: null, message: result.message };
  }
}
