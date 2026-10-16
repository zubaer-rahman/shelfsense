import { BadRequestException, Injectable } from "@nestjs/common";
import { ForecastService } from "./forecast.service.js";
import { PurchaseOrdersService } from "../purchase-orders/purchase-orders.service.js";
import { ForecastQueryDto } from "./dto/forecast-query.dto.js";

// Facade orchestrating demand forecasting and draft purchase order generation into a single procurement workflow.
@Injectable()
export class ReorderFacade {
  constructor(
    private readonly forecastService: ForecastService,
    private readonly purchaseOrdersService: PurchaseOrdersService,
  ) {}

  /**
   * Evaluates demand forecast for a product and automatically generates a draft purchase order
   * for the product's supplier if the suggested reorder quantity is greater than zero.
   *
   * @param productId Target product identifier
   * @param userId Initiating user identifier
   * @param query Strategy and window configuration parameters
   */
  async createPOFromSuggestion(
    productId: string,
    userId: string,
    query?: ForecastQueryDto,
  ) {
    // 1. Calculate demand forecast and suggested reorder quantity
    const forecast = await this.forecastService.getForecast(productId, query);

    // 2. Validate that suggested reorder quantity is above zero
    if (forecast.suggestedReorderQuantity <= 0) {
      throw new BadRequestException(
        `Suggested reorder quantity for product "${forecast.product.name}" is 0. Current stock (${forecast.currentStock}) is sufficient to satisfy expected demand over supplier lead time.`,
      );
    }

    // 3. Assemble procurement line item and draft purchase order DTO
    const createDraftDto = {
      supplierId: forecast.product.supplier.id,
      items: [
        {
          productId: forecast.product.id,
          quantity: forecast.suggestedReorderQuantity,
          unitCost: Number(forecast.product.unitPrice),
        },
      ],
    };

    // 4. Delegate to PurchaseOrdersService to create verified DRAFT order
    const purchaseOrder = await this.purchaseOrdersService.createDraft(
      createDraftDto,
      userId,
    );

    return {
      forecast,
      purchaseOrder,
    };
  }
}
