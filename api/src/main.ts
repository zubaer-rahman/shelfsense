import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";

// Load .env explicitly from process.cwd() or fallback to local api/.env
const cwdEnv = path.join(process.cwd(), ".env");
const fallbackEnv = path.resolve(import.meta.dirname, "../.env");
const envPath = fs.existsSync(cwdEnv) ? cwdEnv : fallbackEnv;
dotenv.config({ path: envPath });

import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [`'self'`],
          styleSrc: [`'self'`, `'unsafe-inline'`],
          imgSrc: [`'self'`, "data:", "validator.swagger.io"],
          scriptSrc: [`'self'`, `'unsafe-inline'`],
        },
      },
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 4000);
  const corsOrigin = configService.get<string>(
    "CORS_ORIGIN",
    "http://localhost:3000",
  );

  app.use(cookieParser());

  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  app.setGlobalPrefix("api/v1");

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure OpenAPI / Swagger Documentation
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

  await app.listen(port);
  console.log(`ShelfSense API running on: http://localhost:${port}`);
  console.log(`Endpoints available under: http://localhost:${port}/api/v1`);
  console.log(`Swagger UI documentation: http://localhost:${port}/api/docs`);
}

bootstrap();
