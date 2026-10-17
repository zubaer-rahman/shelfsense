import {
  Body,
  Controller,
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
import { PurchaseOrdersService } from "./purchase-orders.service.js";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto.js";
import { PurchaseOrderQueryDto } from "./dto/purchase-order-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Exposes HTTP endpoints for purchase order drafting, procurement queries, and status transitions (OWNER only).
@ApiTags("Purchase Orders")
@ApiBearerAuth("bearer")
@Controller("purchase-orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @ApiOperation({ summary: "Create a draft purchase order with validated items (OWNER only)" })
  @ApiResponse({ status: 201, description: "Purchase order draft created" })
  @ApiResponse({ status: 400, description: "Validation error or invalid supplier items" })
  @Post()
  async createDraft(
    @Body() createPurchaseOrderDto: CreatePurchaseOrderDto,
    @CurrentUser() user: { id: string },
  ) {
    const purchaseOrder = await this.poService.createDraft(
      createPurchaseOrderDto,
      user.id,
    );
    return {
      message: "Purchase order draft created successfully",
      purchaseOrder,
    };
  }

  @ApiOperation({ summary: "List purchase orders with optional status filter (OWNER only)" })
  @ApiResponse({ status: 200, description: "Purchase orders retrieved" })
  @Get()
  async findAll(@Query() query: PurchaseOrderQueryDto) {
    const result = await this.poService.findAll(query);
    return {
      message: "Purchase orders retrieved successfully",
      ...result,
    };
  }

  @ApiOperation({ summary: "Get purchase order details and items by ID (OWNER only)" })
  @ApiResponse({ status: 200, description: "Purchase order found" })
  @ApiResponse({ status: 404, description: "Purchase order not found" })
  @Get(":id")
  async findById(@Param("id") id: string) {
    const purchaseOrder = await this.poService.findById(id);
    return {
      message: "Purchase order details retrieved successfully",
      purchaseOrder,
    };
  }

  @ApiOperation({ summary: "Transition purchase order from DRAFT to ORDERED (OWNER only)" })
  @ApiResponse({ status: 200, description: "Order status transitioned to ORDERED" })
  @ApiResponse({ status: 400, description: "Invalid transition" })
  @Patch(":id/order")
  async order(@Param("id") id: string) {
    const purchaseOrder = await this.poService.order(id);
    return {
      message: "Purchase order marked as ORDERED",
      purchaseOrder,
    };
  }

  @ApiOperation({ summary: "Transition purchase order from ORDERED to RECEIVED and atomically increment stock (OWNER only)" })
  @ApiResponse({ status: 200, description: "Items received and inventory updated" })
  @ApiResponse({ status: 400, description: "Invalid transition" })
  @Patch(":id/receive")
  async receive(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    const purchaseOrder = await this.poService.receive(id, user.id);
    return {
      message: "Purchase order items received and stock updated",
      purchaseOrder,
    };
  }

  @ApiOperation({ summary: "Cancel purchase order (from DRAFT or ORDERED) (OWNER only)" })
  @ApiResponse({ status: 200, description: "Order cancelled" })
  @ApiResponse({ status: 400, description: "Invalid transition" })
  @Patch(":id/cancel")
  async cancel(@Param("id") id: string) {
    const purchaseOrder = await this.poService.cancel(id);
    return {
      message: "Purchase order cancelled successfully",
      purchaseOrder,
    };
  }
}
