import { Body, Controller, Get, Post, Request } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { LoginDto } from "./dto/login.dto.js";

// Handles authentication requests and current user identity queries.
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("me")
  getMe(@Request() req: { user: unknown }) {
    return req.user;
  }
}
