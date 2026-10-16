import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

// Intercepts all application exceptions to return a standardized, uniform error payload.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorType = "Internal Server Error";
    let message: string | string[] = "An unexpected server error occurred";

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
        errorType = exception.name.replace("Exception", "");
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const resObj = exceptionResponse as Record<string, unknown>;
        errorType = (resObj.error as string) || exception.name.replace("Exception", "");

        if (Array.isArray(resObj.message)) {
          // Normalize ValidationPipe error messages array into readable message
          message = resObj.message.join("; ");
        } else if (typeof resObj.message === "string") {
          message = resObj.message;
        } else {
          message = exception.message;
        }
      }
    } else if (
      exception &&
      typeof exception === "object" &&
      "code" in exception
    ) {
      // Handle Prisma Known Request Errors
      const prismaError = exception as { code: string; meta?: Record<string, unknown> };

      switch (prismaError.code) {
        case "P2002": {
          statusCode = HttpStatus.CONFLICT;
          errorType = "Conflict";
          const target = prismaError.meta?.target;
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
          statusCode = HttpStatus.BAD_REQUEST;
          errorType = "Database Error";
          message = "A database operation failed";
          break;
        }
      }
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
      message = exception.message;
    }

    const errorPayload = {
      statusCode,
      message,
      error: errorType,
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    };

    response.status(statusCode).json(errorPayload);
  }
}
