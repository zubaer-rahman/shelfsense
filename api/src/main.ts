import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";

// Pre-load .env explicitly for early runtime access
const cwdEnv = path.join(process.cwd(), ".env");
const fallbackEnv = path.resolve(import.meta.dirname, "../.env");
dotenv.config({ path: fs.existsSync(cwdEnv) ? cwdEnv : fallbackEnv });

import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module.js";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";
import { getHelmetMiddleware, getCorsOptions } from "./config/security.config.js";
import { setupSwagger } from "./config/swagger.config.js";

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);

  // Graceful shutdown hooks for container / production environments
  app.enableShutdownHooks();

  // Security headers via Helmet
  app.use(getHelmetMiddleware());

  // Cookie parser for secure httpOnly session cookies
  app.use(cookieParser());

  // Configure CORS using environment origin (single, multi, or regex wildcard)
  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>("CORS_ORIGIN", "http://localhost:3000");
  app.enableCors(getCorsOptions(corsOrigin));

  // Global routing prefix
  app.setGlobalPrefix("api/v1");

  // Global filters, interceptors, and validation pipes
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure OpenAPI / Swagger documentation
  setupSwagger(app);

  const port = configService.get<number>("PORT", 4000);
  await app.listen(port);

  logger.log(`🚀 ShelfSense API running on: http://localhost:${port}`);
  logger.log(`🔗 Global prefix active: http://localhost:${port}/api/v1`);
  logger.log(`📖 Swagger UI documentation: http://localhost:${port}/api/docs`);
  logger.log(`🛡️ CORS configured for origin(s): ${corsOrigin}`);
}

bootstrap();
