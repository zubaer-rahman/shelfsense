import { plainToInstance } from "class-transformer";
import { IsNumber, IsOptional, IsString, validateSync } from "class-validator";

export class EnvironmentVariables {
  @IsString()
  DATABASE_URL!: string;

  @IsString()
  JWT_SECRET!: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRES_IN: string = "7d";

  @IsNumber()
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = "http://localhost:3000";

  @IsString()
  @IsOptional()
  NODE_ENV: string = "development";

  @IsNumber()
  @IsOptional()
  LEAD_TIME_DAYS: number = 7;

  @IsNumber()
  @IsOptional()
  SAFETY_BUFFER: number = 5;

  @IsNumber()
  @IsOptional()
  FORECAST_WINDOW_DAYS: number = 14;

  @IsNumber()
  @IsOptional()
  NEAR_EXPIRY_DAYS: number = 7;

  @IsString()
  @IsOptional()
  GEMINI_API_KEY?: string;

  @IsString()
  @IsOptional()
  GEMINI_MODEL: string = "gemini-1.5-flash";
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.toString()}`);
  }
  return validatedConfig;
}
