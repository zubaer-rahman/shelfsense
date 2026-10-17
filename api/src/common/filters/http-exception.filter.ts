import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Intercepts HTTP exceptions to format a standardized, uniform error payload.
 * Handles NestJS HTTP exceptions and flattens ValidationPipe error messages.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorType = exception.name.replace("Exception", "");
    let message: string | string[] = exception.message;

    if (typeof exceptionResponse === "string") {
      message = exceptionResponse;
    } else if (
      typeof exceptionResponse === "object" &&
      exceptionResponse !== null
    ) {
      const resObj = exceptionResponse as Record<string, unknown>;
      errorType = (resObj.error as string) || errorType;

      if (Array.isArray(resObj.message)) {
        // Normalize ValidationPipe error messages array into readable delimited message
        message = resObj.message.join("; ");
      } else if (typeof resObj.message === "string") {
        message = resObj.message;
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
