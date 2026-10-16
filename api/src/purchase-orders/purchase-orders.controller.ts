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
import { Role } from "@prisma/client";
import { PurchaseOrdersService } from "./purchase-orders.service.js";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto.js";
import { PurchaseOrderQueryDto } from "./dto/purchase-order-query.dto.js";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { RolesGuard } from "../common/guards/roles.guard.js";
import { Roles } from "../common/decorators/roles.decorator.js";
import { CurrentUser } from "../common/decorators/current-user.decorator.js";

// Exposes HTTP endpoints for purchase order drafting, procurement queries, and status transitions (OWNER only).
@Controller("purchase-orders")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

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

  @Get()
  async findAll(@Query() query: PurchaseOrderQueryDto) {
    const result = await this.poService.findAll(query);
    return {
      message: "Purchase orders retrieved successfully",
      ...result,
    };
  }

  @Get(":id")
  async findById(@Param("id") id: string) {
    const purchaseOrder = await this.poService.findById(id);
    return {
      message: "Purchase order details retrieved successfully",
      purchaseOrder,
    };
  }

  @Patch(":id/order")
  async order(@Param("id") id: string) {
    const purchaseOrder = await this.poService.order(id);
    return {
      message: "Purchase order marked as ORDERED",
      purchaseOrder,
    };
  }

  @Patch(":id/receive")
  async receive(@Param("id") id: string, @CurrentUser() user: { id: string }) {
    const purchaseOrder = await this.poService.receive(id, user.id);
    return {
      message: "Purchase order items received and stock updated",
      purchaseOrder,
    };
  }

  @Patch(":id/cancel")
  async cancel(@Param("id") id: string) {
    const purchaseOrder = await this.poService.cancel(id);
    return {
      message: "Purchase order cancelled successfully",
      purchaseOrder,
    };
  }
}
