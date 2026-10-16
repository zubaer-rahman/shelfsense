import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ResponseEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  [key: string]: unknown;
}

// Intercepts outgoing controller responses, recursively converts Prisma Decimal types to numbers,
// and shapes responses into a standardized, human-readable envelope.
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ResponseEnvelope<unknown>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ResponseEnvelope<unknown>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((resData) => {
        // If data is already an envelope, return as-is
        if (
          resData &&
          typeof resData === "object" &&
          "statusCode" in resData &&
          "data" in resData &&
          "message" in resData
        ) {
          return this.serializeDecimals(resData) as ResponseEnvelope<unknown>;
        }

        let message = "Operation completed successfully";
        let payload = resData;

        // Extract custom message if returned by controller (e.g. { message: "...", ...rest })
        if (
          resData &&
          typeof resData === "object" &&
          !Array.isArray(resData) &&
          !(resData instanceof Date)
        ) {
          const rawObj = resData as Record<string, unknown>;
          if (typeof rawObj.message === "string") {
            message = rawObj.message;
            if ("data" in rawObj) {
              payload = rawObj.data;
            } else {
              const { message: _, ...remaining } = rawObj;
              // If only message was returned, data is null
              payload = Object.keys(remaining).length > 0 ? remaining : null;
            }
          }
        } else {
          // Method-based default message fallback
          const method = request.method?.toUpperCase();
          if (method === "GET") {
            message = "Data retrieved successfully";
          } else if (method === "POST") {
            message = "Resource created successfully";
          } else if (method === "PATCH" || method === "PUT") {
            message = "Resource updated successfully";
          } else if (method === "DELETE") {
            message = "Resource deleted successfully";
          }
        }

        const serializedData = this.serializeDecimals(payload);

        const envelope: ResponseEnvelope<unknown> = {
          statusCode,
          message,
          data: serializedData,
          timestamp: new Date().toISOString(),
        };

        // For backward compatibility with clients directly reading accessToken from root
        if (
          serializedData &&
          typeof serializedData === "object" &&
          "accessToken" in serializedData
        ) {
          envelope.accessToken = (serializedData as Record<string, unknown>).accessToken;
        }

        return envelope;
      }),
    );
  }

  // Recursively converts Prisma Decimal instances to standard JavaScript numbers.
  private serializeDecimals(value: unknown): unknown {
    if (value === null || value === undefined) {
      return value;
    }

    // Prisma Decimal check (duck-typing for Decimal.js / Prisma Decimal)
    if (
      typeof value === "object" &&
      value !== null &&
      "toNumber" in value &&
      typeof (value as { toNumber: unknown }).toNumber === "function"
    ) {
      return (value as { toNumber: () => number }).toNumber();
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.serializeDecimals(item));
    }

    if (typeof value === "object") {
      const transformed: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        transformed[key] = this.serializeDecimals(val);
      }
      return transformed;
    }

    return value;
  }
}
