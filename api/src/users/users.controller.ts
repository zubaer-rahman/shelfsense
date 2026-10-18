import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";

// Exposes endpoints for user registration, user listing, and account deactivation (OWNER only).
@ApiTags("Users")
@ApiBearerAuth("bearer")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: "Register a new user account (OWNER only)" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "Email already in use" })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: "User registered successfully",
      user,
    };
  }

  @ApiOperation({ summary: "List all registered users (OWNER only)" })
  @ApiResponse({ status: 200, description: "Users list retrieved" })
  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      message: "Users retrieved successfully",
      users,
    };
  }

  @ApiOperation({ summary: "Deactivate user account (OWNER only)" })
  @ApiResponse({ status: 200, description: "User deactivated" })
  @ApiResponse({ status: 404, description: "User not found" })
  @Patch(":id/deactivate")
  async deactivate(@Param("id") id: string) {
    const user = await this.usersService.deactivate(id);
    return {
      message: "User account deactivated successfully",
      user,
    };
  }
}
