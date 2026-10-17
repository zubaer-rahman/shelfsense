import helmet from "helmet";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";

/**
 * Helmet middleware configuration with Content Security Policy tuned for Swagger UI and API safety.
 */
export function getHelmetMiddleware() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, "data:", "validator.swagger.io"],
        scriptSrc: [`'self'`, `'unsafe-inline'`],
      },
    },
    crossOriginEmbedderPolicy: false,
  });
}

/**
 * Parses single, multiple, or wildcard origins from CORS_ORIGIN environment variable.
 * Examples:
 *  - "http://localhost:3000"
 *  - "http://localhost:3000,https://shelfsense.vercel.app"
 *  - "http://localhost:3000,https://*.vercel.app"
 */
export function parseCorsOrigin(
  rawOrigin?: string,
): boolean | string | (string | RegExp)[] {
  if (!rawOrigin || rawOrigin === "*") {
    return true;
  }

  const origins = rawOrigin
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  if (origins.length === 1 && !origins[0].includes("*")) {
    return origins[0];
  }

  return origins.map((origin) => {
    if (origin.includes("*")) {
      const pattern = origin
        .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\*/g, ".*");
      return new RegExp(`^${pattern}$`);
    }
    return origin;
  });
}

/**
 * Creates production-ready CORS configuration options based on the configured origin.
 */
export function getCorsOptions(rawOrigin?: string): CorsOptions {
  return {
    origin: parseCorsOrigin(rawOrigin),
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-Custom-Header",
    ],
    exposedHeaders: ["Content-Range", "X-Total-Count"],
    maxAge: 86400, // 24 hours preflight cache
  };
}
