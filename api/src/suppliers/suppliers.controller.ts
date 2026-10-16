import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { SuppliersService } from "./suppliers.service.js";
import { CreateSupplierDto } from "./dto/create-supplier.dto.js";
import { UpdateSupplierDto } from "./dto/update-supplier.dto.js";
import { SupplierQueryDto } from "./dto/supplier-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";

// Exposes HTTP endpoints for supplier directory management, partner registration, and deactivation.
@Controller("suppliers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @Roles(Role.OWNER)
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    const supplier = await this.suppliersService.create(createSupplierDto);
    return {
      message: "Supplier registered successfully",
      supplier,
    };
  }

  @Get()
  async findAll(@Query() query: SupplierQueryDto) {
    const result = await this.suppliersService.findAll(query);
    return {
      message: "Suppliers retrieved successfully",
      ...result,
    };
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    const supplier = await this.suppliersService.findById(id);
    return {
      message: "Supplier details retrieved successfully",
      supplier,
    };
  }

  @Patch(":id")
  @Roles(Role.OWNER)
  async update(
    @Param("id") id: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    const supplier = await this.suppliersService.update(id, updateSupplierDto);
    return {
      message: "Supplier updated successfully",
      supplier,
    };
  }

  @Delete(":id")
  @Roles(Role.OWNER)
  async remove(@Param("id") id: string) {
    const supplier = await this.suppliersService.softDelete(id);
    return {
      message: "Supplier deactivated successfully",
      supplier,
    };
  }
}
