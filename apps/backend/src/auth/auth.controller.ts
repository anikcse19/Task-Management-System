import {
  Controller,
  Post,
  Get,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "./auth.service";
import { LoginRequestDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /api/v1/auth/login
   * Public endpoint. Validates credentials, returns access token,
   * and sets refresh token as httpOnly cookie.
   */
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    // Set refresh token as httpOnly cookie (can't be read by JavaScript)
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    return {
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: "Login successful",
    };
  }

  /**
   * POST /api/v1/auth/logout
   * Clears the refresh token cookie.
   */
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("refreshToken", { path: "/" });
    return { data: null, message: "Logout successful" };
  }

  /**
   * GET /api/v1/auth/me
   * Protected endpoint. Returns the current authenticated user's profile.
   */
  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    const profile = await this.authService.getProfile(user.id);
    return { data: profile };
  }

  /**
   * POST /api/v1/auth/refresh
   * Uses the refresh token from cookie to get a new access token.
   */
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    return {
      data: { accessToken: tokens.accessToken },
      message: "Token refreshed",
    };
  }
}
