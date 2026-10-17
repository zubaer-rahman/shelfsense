import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

/**
 * Handles Prisma database exceptions and translates database error codes (e.g. P2002, P2025, P2003)
 * into semantic HTTP error responses.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.BAD_REQUEST;
    let errorType = "Database Error";
    let message = "A database operation failed";

    switch (exception.code) {
      case "P2002": {
        statusCode = HttpStatus.CONFLICT;
        errorType = "Conflict";
        const target = exception.meta?.target;
        message = target
          ? `A record with this ${Array.isArray(target) ? target.join(", ") : target} already exists`
          : "A unique constraint violation occurred";
        break;
      }
      case "P2025": {
        statusCode = HttpStatus.NOT_FOUND;
        errorType = "Not Found";
        message = "The requested record was not found";
        break;
      }
      case "P2003": {
        statusCode = HttpStatus.BAD_REQUEST;
        errorType = "Bad Request";
        message = "Referenced entity does not exist";
        break;
      }
      default: {
        this.logger.warn(`Prisma error code [${exception.code}]: ${exception.message}`);
        break;
      }
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    });
  }
}
