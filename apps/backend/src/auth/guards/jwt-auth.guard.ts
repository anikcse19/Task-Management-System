import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Guard that validates JWT tokens on protected routes.
 * Extends Passport's built-in JWT strategy guard.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
