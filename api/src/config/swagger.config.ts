import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/**
 * Configures OpenAPI / Swagger documentation for ShelfSense API.
 */
export function setupSwagger(app: INestApplication): void {
  const swaggerConfig = new DocumentBuilder()
    .setTitle("ShelfSense API")
    .setDescription(
      "Production-grade inventory, expiry tracking, and demand-based reorder suggestions API for retail shops.",
    )
    .setVersion("1.0.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "bearer",
    )
    .addCookieAuth("accessToken")
    .addTag("Authentication", "User login, session cookies, and profile endpoints")
    .addTag("Users", "User management and account deactivation (OWNER)")
    .addTag("Suppliers", "Supplier partner directory management")
    .addTag("Products", "Inventory product catalog, search, and SKU validation")
    .addTag("Stock Movements", "Inventory transactions, sales, and audit movements")
    .addTag("Alerts", "Depleted inventory, near-expiry, and expired items")
    .addTag("Purchase Orders", "Procurement drafts, ordering, and receiving lifecycle")
    .addTag("Demand Forecasting", "AI/ML demand forecasting and automated reorders")
    .addTag("Health", "Service health check probes")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "ShelfSense API Documentation",
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
