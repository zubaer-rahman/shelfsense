import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import type { Response } from "express";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Handles authentication requests, cookie session tokens, and current user identity queries.
@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: "Authenticate with email and password" })
  @ApiResponse({ status: 200, description: "Successfully authenticated with JWT token" })
  @ApiResponse({ status: 401, description: "Invalid credentials or inactive user" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return {
      message: "Logged in successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "Logout user and clear session cookie" })
  @ApiResponse({ status: 200, description: "Successfully logged out" })
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return { message: "Logged out successfully" };
  }

  @ApiBearerAuth("bearer")
  @ApiOperation({ summary: "Retrieve authenticated user identity and role" })
  @ApiResponse({ status: 200, description: "Authenticated profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: unknown) {
    return {
      message: "User profile retrieved successfully",
      user,
    };
  }
}
