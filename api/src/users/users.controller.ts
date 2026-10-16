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
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(":id/deactivate")
  deactivate(@Param("id") id: string) {
    return this.usersService.deactivate(id);
  }
}
