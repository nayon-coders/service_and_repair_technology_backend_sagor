import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError';
import { sendError } from '../utils/response';
import { env } from '../config/environment';

export const errorHandler: ErrorRequestHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  const errorDetails =
    env.nodeEnv === 'development'
      ? {
          name: err.name,
          stack: err.stack,
        }
      : undefined;

  sendError(res, message, errorDetails, statusCode);
};
