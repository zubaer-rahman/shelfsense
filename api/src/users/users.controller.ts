import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import { CreateUserDto } from "./dto/create-user.dto.js";

// Exposes endpoints for user registration, user listing, and account deactivation.
@Controller("users")
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
