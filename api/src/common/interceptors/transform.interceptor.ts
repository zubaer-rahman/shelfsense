import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { serializeDecimals } from "../utils/decimal-serializer.util.js";

export interface ResponseEnvelope<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  [key: string]: unknown;
}

const DEFAULT_MESSAGES: Record<string, string> = {
  GET: "Data retrieved successfully",
  POST: "Resource created successfully",
  PATCH: "Resource updated successfully",
  PUT: "Resource updated successfully",
  DELETE: "Resource deleted successfully",
};

/**
 * Intercepts successful controller responses, normalizes Prisma Decimal values,
 * and packages output into a standardized JSON response envelope.
 */
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
          return serializeDecimals(resData) as ResponseEnvelope<unknown>;
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
              payload = Object.keys(remaining).length > 0 ? remaining : null;
            }
          }
        } else {
          const method = request.method?.toUpperCase();
          message = DEFAULT_MESSAGES[method] || message;
        }

        const serializedData = serializeDecimals(payload);

        const envelope: ResponseEnvelope<unknown> = {
          statusCode,
          message,
          data: serializedData,
          timestamp: new Date().toISOString(),
        };

        // For backward compatibility with clients reading accessToken directly from root
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
}
