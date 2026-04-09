import { SetMetadata } from "@nestjs/common";
import { Role } from "../../generated/prisma/client";

export const ROLES_KEY = "roles";

/**
 * Decorator to restrict endpoint access to specific roles.
 * Usage: @Roles(Role.ADMIN)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
