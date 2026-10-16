import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { Role } from "@prisma/client";
import { UsersService } from "./users.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";

// Exposes endpoints for user registration, user listing, and account deactivation (OWNER only).
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      message: "User registered successfully",
      user,
    };
  }

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      message: "Users retrieved successfully",
      users,
    };
  }

  @Patch(":id/deactivate")
  async deactivate(@Param("id") id: string) {
    const user = await this.usersService.deactivate(id);
    return {
      message: "User account deactivated successfully",
      user,
    };
  }
}
