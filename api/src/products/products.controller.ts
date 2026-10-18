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
import { ProductsService } from "./products.service.js";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { UpdateProductDto } from "./dto/update-product.dto.js";
import { ProductQueryDto } from "./dto/product-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";

// Exposes HTTP endpoints for inventory catalog management, search queries, and lifecycle actions.
@ApiTags("Products")
@ApiBearerAuth("bearer")
@Controller("products")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @ApiOperation({ summary: "Create a new product in the catalog (OWNER only)" })
  @ApiResponse({ status: 201, description: "Product created successfully" })
  @ApiResponse({ status: 409, description: "SKU already exists" })
  @Post()
  @Roles(Role.OWNER)
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto);
    return {
      message: "Product registered successfully",
      product,
    };
  }

  @ApiOperation({ summary: "List products with search, category filter, and pagination" })
  @ApiResponse({ status: 200, description: "Products retrieved" })
  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    const result = await this.productsService.findAll(query);
    return {
      message: "Products retrieved successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "Get product details by ID" })
  @ApiResponse({ status: 200, description: "Product found" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @Get(":id")
  async findById(@Param("id") id: string) {
    const product = await this.productsService.findById(id);
    return {
      message: "Product details retrieved successfully",
      product,
    };
  }

  @ApiOperation({ summary: "Update product details (OWNER only)" })
  @ApiResponse({ status: 200, description: "Product updated" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @Patch(":id")
  @Roles(Role.OWNER)
  async update(
    @Param("id") id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(id, updateProductDto);
    return {
      message: "Product updated successfully",
      product,
    };
  }

  @ApiOperation({ summary: "Soft delete / deactivate a product (OWNER only)" })
  @ApiResponse({ status: 200, description: "Product deactivated" })
  @ApiResponse({ status: 404, description: "Product not found" })
  @Delete(":id")
  @Roles(Role.OWNER)
  async remove(@Param("id") id: string) {
    const product = await this.productsService.softDelete(id);
    return {
      message: "Product deactivated successfully",
      product,
    };
  }
}
