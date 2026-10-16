import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Handles authentication requests and current user identity queries.
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  getMe(@CurrentUser() user: unknown) {
    return user;
  }
}
