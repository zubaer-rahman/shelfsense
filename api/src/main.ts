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
import { AppModule } from "./app.module.js";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter.js";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  await app.listen(port);
  console.log(`ShelfSense API running on: http://localhost:${port}`);
  console.log(`Endpoints available under: http://localhost:${port}/api/v1`);
}

bootstrap();
