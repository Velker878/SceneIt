import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/**
 * GlobalExceptionFilter
 *
 * Catches all exceptions (HTTP and unexpected) and returns a consistent
 * JSON error shape. Never exposes internal stack traces to the client.
 *
 * Response shape:
 * {
 *   "statusCode": 404,
 *   "error": "Not Found",
 *   "message": "User not found on Letterboxd"
 * }
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Something went wrong. Please try again.";
    let error = "Internal Server Error";

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "string") {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === "object" &&
        exceptionResponse !== null
      ) {
        const res = exceptionResponse as any;
        message = res.message ?? message;
        error = res.error ?? error;
      }

      error = this.statusToError(status);
    } else {
      // Unexpected error — log it but don't expose internals
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      error,
      message: Array.isArray(message) ? message.join("; ") : message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private statusToError(status: number): string {
    const map: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      408: "Request Timeout",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
    };
    return map[status] ?? "Error";
  }
}
