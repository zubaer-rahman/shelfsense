import { Module } from "@nestjs/common";
import { StockModule } from "../stock/stock.module.js";
import { PurchaseOrdersService } from "./purchase-orders.service.js";
import { PurchaseOrdersController } from "./purchase-orders.controller.js";

// Configures dependency injection and encapsulates Purchase Order procurement domain workflows.
@Module({
  imports: [StockModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
