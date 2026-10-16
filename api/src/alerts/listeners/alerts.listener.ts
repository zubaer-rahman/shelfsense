import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../prisma/prisma.service.js";
import { StockChangedEvent } from "../../stock/events/stock-changed.event.js";

// Listens asynchronously to stock change events to detect and flag depleted inventory (Observer Pattern).
@Injectable()
export class AlertsListener {
  private readonly logger = new Logger(AlertsListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent("stock.changed")
  async handleStockChanged(event: StockChangedEvent) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: event.productId },
        select: {
          id: true,
          name: true,
          sku: true,
          quantity: true,
          reorderLevel: true,
          isActive: true,
        },
      });

      if (!product || !product.isActive) {
        return;
      }

      // Observer check: quantity at or below reorderLevel triggers a low-stock alert
      if (product.quantity <= product.reorderLevel) {
        this.logger.warn(
          `[LOW_STOCK_ALERT] Product "${product.name}" (SKU: ${product.sku}) has reached ${product.quantity} units, at or below threshold (${product.reorderLevel}) after ${event.type}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to process stock.changed event for product ${event.productId}`,
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
