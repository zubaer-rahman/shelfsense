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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { SuppliersService } from "./suppliers.service.js";
import { CreateSupplierDto } from "./dto/create-supplier.dto.js";
import { UpdateSupplierDto } from "./dto/update-supplier.dto.js";
import { SupplierQueryDto } from "./dto/supplier-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";

// Exposes HTTP endpoints for supplier directory management, partner registration, and deactivation.
@ApiTags("Suppliers")
@ApiBearerAuth("bearer")
@Controller("suppliers")
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @ApiOperation({ summary: "Register a new supplier (OWNER only)" })
  @ApiResponse({ status: 201, description: "Supplier registered successfully" })
  @Post()
  @Roles(Role.OWNER)
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    const supplier = await this.suppliersService.create(createSupplierDto);
    return {
      message: "Supplier registered successfully",
      supplier,
    };
  }

  @ApiOperation({ summary: "List suppliers with optional pagination and search filters" })
  @ApiResponse({ status: 200, description: "Suppliers retrieved" })
  @Get()
  async findAll(@Query() query: SupplierQueryDto) {
    const result = await this.suppliersService.findAll(query);
    return {
      message: "Suppliers retrieved successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "Get supplier details by ID" })
  @ApiResponse({ status: 200, description: "Supplier found" })
  @ApiResponse({ status: 404, description: "Supplier not found" })
  @Get(":id")
  async findById(@Param("id") id: string) {
    const supplier = await this.suppliersService.findById(id);
    return {
      message: "Supplier details retrieved successfully",
      supplier,
    };
  }

  @ApiOperation({ summary: "Update supplier details (OWNER only)" })
  @ApiResponse({ status: 200, description: "Supplier updated" })
  @ApiResponse({ status: 404, description: "Supplier not found" })
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

  @ApiOperation({ summary: "Soft delete / deactivate a supplier (OWNER only)" })
  @ApiResponse({ status: 200, description: "Supplier deactivated" })
  @ApiResponse({ status: 404, description: "Supplier not found" })
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
