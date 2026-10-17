import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";

/**
 * Catch-all fallback filter for unhandled runtime exceptions.
 * Logs the stack trace and responds with a standardized 500 JSON envelope.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const message =
      exception instanceof Error
        ? exception.message
        : "An unexpected server error occurred";

    this.logger.error(
      `Unhandled Exception on [${request.method}] ${request.url}: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "An unexpected server error occurred",
      error: "Internal Server Error",
      timestamp: new Date().toISOString(),
      path: request.originalUrl || request.url,
    });
  }
}
